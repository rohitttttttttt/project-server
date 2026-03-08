const { Router } = require('express');
const auth = require('../middlewares/Auth');
const {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
} = require('../controllers/Cart.controller');

const router = Router();

// All cart routes require authentication
router.get('/', auth, getCart);                       // Get user's cart
router.post('/', auth, addToCart);                     // Add item to cart
router.patch('/:productId', auth, updateCartItem);     // Update item quantity
router.delete('/clear', auth, clearCart);               // Clear entire cart
router.delete('/:productId', auth, removeFromCart);    // Remove specific item

module.exports = router;
