const User = require('../models/User.model');
const Product = require('../models/Product.model');
const Order = require('../models/Order.model');
const Conversation = require('../models/Chat.model');
const Message = require('../models/Message.model');
const { getIO } = require('../socket');
const Cart = require('../models/Cart.model');
const Address = require('../models/Address.model');
const UserStore = require('../socket/userStore');
const mongoose = require('mongoose');

const placeOrder = async (req , res ) =>{

    /*
    Implement logic for placing order 
    1. get all  the items  and there quantity from the cart  
    2. get address Id from request body 
    3. create a order 
    4. create a conversation between the sellers and the buyers 
    5. send a message to the seller that the order has been placed 
    
    
    */

    try {

        const {addressId} = req.body;
        const userId = req.user._id;



        if(!addressId){
            return res.status(400).json({
                message:"Address ID is required"
            })
        }
        const fullAddress = await Address.findById(addressId).select("userId fullName phoneNo state city postalCode land addressLine lat long");
        if(!fullAddress){
            return res.status(404).json({
                message:"Address not found"
            })
        }

        if(fullAddress.userId.toString() !== userId.toString()){
            return res.status(403).json({
                message:"You are not authorized to use this address"
            })
        }

        const cart = await Cart.findOne({ userId });
        if(!cart){
            return res.status(404).json({
                message:"Cart not found"
            })
        }

        if (cart.items.length === 0) {
            return res.status(400).json({ message: "Cart is empty" });
        }


        for(const item of cart.items){
            const product = await Product.findById(item.productId);
            if(!product){
                return res.status(404).json({
                    message:"Product not found"
                })
            }
            if(product.stock < item.quantity){
                return res.status(400).json({
                    message:"Product out of stock"
                })
            }
            const finalPrice = product.price * item.quantity;
            const seller = await User.findById(product.userId);
            if(!seller){
                return res.status(404).json({
                    message:"Seller not found"
                })
            }
            const sellerSocketId = UserStore.getUser(seller._id.toString());
            const order = await Order.create({
                buyer:userId,
                seller:seller._id,
                product:item.productId,
                quantity:item.quantity,
                totalAmount:finalPrice,
                deliveryAddress:fullAddress._id,
                paymentStatus:"pending",
                status:"pending",
            })
           
            // Find existing conversation or create a new one
            let conversation = await Conversation.findOne({
                $or: [
                    { user1: userId, user2: seller._id },
                    { user1: seller._id, user2: userId },
                ],
            });
            if (!conversation) {
                conversation = await Conversation.create({
                    user1: userId,
                    user2: seller._id,
                });
            }
            const content = `Hi! I'd like to order ${product.title}. Let's discuss delivery and payment.`
            await Message.create({
                conversationId:conversation._id,
                sender:userId,
                message:content,
            })

            conversation.lastMessage = content;
            await conversation.save();

             if(sellerSocketId){
                const io = getIO();
                io.to(sellerSocketId).emit('orderPlaced' , {
                    message:"Order placed successfully",
                    order:{
                        productId:item.productId,
                        productTitle:product.title,
                        quantity:item.quantity,
                        price:finalPrice,
                        buyer:req.user.fullName,
                        address:fullAddress,
                        orderId:order._id,
                        createdAt:order.createdAt,
                        updatedAt:order.updatedAt,
                        
                    }
                })

                io.to(sellerSocketId).emit('message-received' , {
                   conversation:conversation._id,
                   content:content,
                   senderId:userId,
                   timestamp: new Date().toISOString(),
                })
            }
            
            
        }

        cart.items = [];
        cart.total = 0;
        await cart.save();



        return res.status(200).json({
            message:"Order placed successfully",
        })



        
        
    } catch (error) {
        return res.status(500).json({
            message:"Internal server error",
            error:error.message,
        })
    }
}

module.exports = { placeOrder };

// ═══════════════════════════════════════════════════
//  GET MY ORDERS  (GET /order)
//  Auth required — returns all orders placed by the
//  logged-in user (as buyer), newest first, paginated.
// ═══════════════════════════════════════════════════
const getMyOrders = async (req, res) => {
    try {
        const userId = req.user._id;

        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
        const skip = (page - 1) * limit;

        const [orders, total] = await Promise.all([
            Order.find({ buyer: userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('product', 'title price images unit')
                .populate('seller', 'fullName')
                .populate('deliveryAddress')
                .lean(),
            Order.countDocuments({ buyer: userId }),
        ]);

        return res.status(200).json({
            success: true,
            orders,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error('GetMyOrders Error:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ═══════════════════════════════════════════════════
//  GET SELLER ORDERS  (GET /order/seller)
//  Auth required — returns all orders received by the
//  logged-in user (as seller), newest first, paginated.
//  Optional query: ?status=pending to filter by status
// ═══════════════════════════════════════════════════
const getSellerOrders = async (req, res) => {
    try {
        const userId = req.user._id;

        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
        const skip = (page - 1) * limit;

        // Optional status filter
        const filter = { seller: userId };
        if (req.query.status) {
            const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
            if (validStatuses.includes(req.query.status)) {
                filter.status = req.query.status;
            }
        }

        const [orders, total] = await Promise.all([
            Order.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('product', 'title price images unit')
                .populate('buyer', 'fullName')
                .populate('deliveryAddress')
                .lean(),
            Order.countDocuments(filter),
        ]);

        return res.status(200).json({
            success: true,
            orders,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error('GetSellerOrders Error:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ═══════════════════════════════════════════════════
//  GET ORDER BY ID  (GET /order/:orderId)
//  Auth required — only buyer or seller can view
// ═══════════════════════════════════════════════════
const getOrderById = async (req, res) => {
    try {
        const userId = req.user._id;
        const { orderId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ success: false, message: 'Invalid order ID' });
        }

        const order = await Order.findById(orderId)
            .populate('product', 'title price images unit')
            .populate('buyer', 'fullName')
            .populate('seller', 'fullName')
            .populate('deliveryAddress');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Only buyer or seller can view the order
        const isBuyer = order.buyer._id.toString() === userId.toString();
        const isSeller = order.seller._id.toString() === userId.toString();
        if (!isBuyer && !isSeller) {
            return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
        }

        return res.status(200).json({ success: true, order });
    } catch (error) {
        console.error('GetOrderById Error:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ═══════════════════════════════════════════════════
//  UPDATE ORDER STATUS  (PATCH /order/:orderId/status)
//  Auth required — only the SELLER can update status.
//  Allowed transitions:
//    pending → confirmed  (decrements product stock)
//    confirmed → shipped
//    shipped → delivered
//  Body: { status: "confirmed" }
// ═══════════════════════════════════════════════════
const updateOrderStatus = async (req, res) => {
    try {
        const userId = req.user._id;
        const { orderId } = req.params;
        const { status } = req.body;

        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ success: false, message: 'Invalid order ID' });
        }
        if (!status) {
            return res.status(400).json({ success: false, message: 'status is required' });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Only seller can update order status
        if (order.seller.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: 'Only the seller can update order status' });
        }

        // Validate status transitions
        const allowedTransitions = {
            pending: 'confirmed',
            confirmed: 'shipped',
            shipped: 'delivered',
        };

        if (allowedTransitions[order.status] !== status) {
            return res.status(400).json({
                success: false,
                message: `Cannot change status from '${order.status}' to '${status}'. Next allowed: '${allowedTransitions[order.status] || 'none'}'`,
            });
        }

        // Decrement stock when seller confirms the order
        if (status === 'confirmed') {
            const product = await Product.findById(order.product);
            if (product) {
                if (product.stock < order.quantity) {
                    return res.status(400).json({ success: false, message: 'Not enough stock to confirm' });
                }
                product.stock -= order.quantity;
                await product.save();
            }
        }

        order.status = status;
        await order.save();

        // Notify the buyer about the status change via socket
        const buyerSocketId = UserStore.getUser(order.buyer.toString());
        if (buyerSocketId) {
            const io = getIO();
            io.to(buyerSocketId).emit('orderStatusUpdated', {
                orderId: order._id,
                status: order.status,
            });
        }

        return res.status(200).json({
            success: true,
            message: `Order status updated to '${status}'`,
            order,
        });
    } catch (error) {
        console.error('UpdateOrderStatus Error:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ═══════════════════════════════════════════════════
//  CANCEL ORDER  (PATCH /order/:orderId/cancel)
//  Auth required — buyer OR seller can cancel,
//  but only if status is 'pending'.
//  If status is 'confirmed', only seller can cancel
//  and stock is restored.
// ═══════════════════════════════════════════════════
const cancelOrder = async (req, res) => {
    try {
        const userId = req.user._id;
        const { orderId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ success: false, message: 'Invalid order ID' });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const isBuyer = order.buyer.toString() === userId.toString();
        const isSeller = order.seller.toString() === userId.toString();

        if (!isBuyer && !isSeller) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        // Buyer can only cancel if pending
        if (isBuyer && order.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Buyer can only cancel pending orders' });
        }

        // Seller can cancel if pending or confirmed
        if (isSeller && !['pending', 'confirmed'].includes(order.status)) {
            return res.status(400).json({ success: false, message: 'Seller can only cancel pending or confirmed orders' });
        }

        // Restore stock if order was already confirmed
        if (order.status === 'confirmed') {
            const product = await Product.findById(order.product);
            if (product) {
                product.stock += order.quantity;
                await product.save();
            }
        }

        order.status = 'cancelled';
        await order.save();

        // Notify the other party via socket
        const otherUserId = isBuyer ? order.seller.toString() : order.buyer.toString();
        const otherSocketId = UserStore.getUser(otherUserId);
        if (otherSocketId) {
            const io = getIO();
            io.to(otherSocketId).emit('orderCancelled', {
                orderId: order._id,
                cancelledBy: isBuyer ? 'buyer' : 'seller',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Order cancelled successfully',
            order,
        });
    } catch (error) {
        console.error('CancelOrder Error:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = {
    placeOrder,
    getMyOrders,
    getSellerOrders,
    getOrderById,
    updateOrderStatus,
    cancelOrder,
};