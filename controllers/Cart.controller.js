const mongoose = require('mongoose');
const Cart = require('../models/Cart.model');
const Product = require('../models/Product.model');
const ProductAnalytics = require('../models/ProductAnalytics.model');

// ═══════════════════════════════════════════════════
//  SHARED HELPERS
// ═══════════════════════════════════════════════════

/** Recalculate cart total from its populated items */
const recalculateTotal = (items) => {
    return items.reduce((sum, item) => {
        const price = item.productId?.price ?? 0;
        return sum + price * item.quantity;
    }, 0);
};

// ═══════════════════════════════════════════════════
//  GET CART  (GET /cart)
//  Returns the user's cart with populated product info
// ═══════════════════════════════════════════════════
const getCart = async (req, res) => {
    try {
        const userId = req.user._id;

        let cart = await Cart.findOne({ userId }).populate({
            path: 'items.productId',
            select: 'title price unit images stock isOrganic',
        });

        if (!cart) {
            return res.status(200).json({
                success: true,
                cart: { items: [], total: 0 },
            });
        }

        // Recalculate total in case product prices changed
        cart.total = recalculateTotal(cart.items);
        await cart.save();

        return res.status(200).json({ success: true, cart });
    } catch (error) {
        console.error('GetCart Error:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ═══════════════════════════════════════════════════
//  ADD TO CART  (POST /cart)
//  Body: { productId, quantity }
// ═══════════════════════════════════════════════════
const addToCart = async (req, res) => {
    try {
        const userId = req.user._id;
        const { productId, quantity } = req.body;

        // ── Input validation ──
        if (!productId || !quantity) {
            return res.status(400).json({ success: false, message: 'productId and quantity are required' });
        }
        if (typeof quantity !== 'number' || quantity < 1) {
            return res.status(400).json({ success: false, message: 'quantity must be a positive number' });
        }
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ success: false, message: 'Invalid product ID' });
        }

        // ── Verify product exists and has stock ──
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // ── Find or create cart ──
        let cart = await Cart.findOne({ userId });

        if (!cart) {
            cart = new Cart({ userId, items: [], total: 0 });
        }

        // ── Check if product already in cart ──
        const existingItem = cart.items.find(
            (item) => item.productId.toString() === productId
        );

        if (existingItem) {
            const newQty = existingItem.quantity + quantity;
            if (newQty > product.stock) {
                return res.status(400).json({
                    success: false,
                    message: `Not enough stock. Available: ${product.stock}, In cart: ${existingItem.quantity}`,
                });
            }
            existingItem.quantity = newQty;
        } else {
            if (quantity > product.stock) {
                return res.status(400).json({
                    success: false,
                    message: `Not enough stock. Available: ${product.stock}`,
                });
            }
            cart.items.push({ productId, quantity });
        }

        // ── Recalculate total ──
        await cart.populate({
            path: 'items.productId',
            select: 'title price unit images stock isOrganic',
        });
        cart.total = recalculateTotal(cart.items);
        await cart.save();

        // ── Increment addToCartCount (fire-and-forget) ──
        ProductAnalytics.findOneAndUpdate(
            { productId },
            { $inc: { addToCartCount: 1 } },
            { upsert: true }
        ).exec();

        return res.status(200).json({
            success: true,
            message: 'Product added to cart',
            cart,
        });
    } catch (error) {
        console.error('AddToCart Error:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ═══════════════════════════════════════════════════
//  UPDATE CART ITEM  (PATCH /cart/:productId)
//  Body: { quantity }  — set to 0 to remove
// ═══════════════════════════════════════════════════
const updateCartItem = async (req, res) => {
    try {
        const userId = req.user._id;
        const { productId } = req.params;
        const { quantity } = req.body;

        if (quantity === undefined || typeof quantity !== 'number' || quantity < 0) {
            return res.status(400).json({ success: false, message: 'quantity must be a non-negative number' });
        }
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ success: false, message: 'Invalid product ID' });
        }

        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        const itemIndex = cart.items.findIndex(
            (item) => item.productId.toString() === productId
        );
        if (itemIndex === -1) {
            return res.status(404).json({ success: false, message: 'Product not found in cart' });
        }

        if (quantity === 0) {
            // Remove item
            cart.items.splice(itemIndex, 1);
        } else {
            // Validate stock
            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({ success: false, message: 'Product no longer exists' });
            }
            if (quantity > product.stock) {
                return res.status(400).json({
                    success: false,
                    message: `Not enough stock. Available: ${product.stock}`,
                });
            }
            cart.items[itemIndex].quantity = quantity;
        }

        // Recalculate total
        await cart.populate({
            path: 'items.productId',
            select: 'title price unit images stock isOrganic',
        });
        cart.total = recalculateTotal(cart.items);
        await cart.save();

        return res.status(200).json({
            success: true,
            message: quantity === 0 ? 'Item removed from cart' : 'Cart item updated',
            cart,
        });
    } catch (error) {
        console.error('UpdateCartItem Error:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ═══════════════════════════════════════════════════
//  REMOVE FROM CART  (DELETE /cart/:productId)
// ═══════════════════════════════════════════════════
const removeFromCart = async (req, res) => {
    try {
        const userId = req.user._id;
        const { productId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ success: false, message: 'Invalid product ID' });
        }

        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        const initialLength = cart.items.length;
        cart.items = cart.items.filter(
            (item) => item.productId.toString() !== productId
        );

        if (cart.items.length === initialLength) {
            return res.status(404).json({ success: false, message: 'Product not found in cart' });
        }

        // Recalculate total
        await cart.populate({
            path: 'items.productId',
            select: 'title price unit images stock isOrganic',
        });
        cart.total = recalculateTotal(cart.items);
        await cart.save();

        return res.status(200).json({
            success: true,
            message: 'Product removed from cart',
            cart,
        });
    } catch (error) {
        console.error('RemoveFromCart Error:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ═══════════════════════════════════════════════════
//  CLEAR CART  (DELETE /cart)
// ═══════════════════════════════════════════════════
const clearCart = async (req, res) => {
    try {
        const userId = req.user._id;

        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(200).json({
                success: true,
                message: 'Cart is already empty',
                cart: { items: [], total: 0 },
            });
        }

        cart.items = [];
        cart.total = 0;
        await cart.save();

        return res.status(200).json({
            success: true,
            message: 'Cart cleared',
            cart,
        });
    } catch (error) {
        console.error('ClearCart Error:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
};
