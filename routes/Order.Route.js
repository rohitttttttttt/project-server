const { Router } = require('express');
const auth = require('../middlewares/Auth');
const {
    placeOrder,
    getMyOrders,
    getSellerOrders,
    getOrderById,
    updateOrderStatus,
    cancelOrder,
} = require('../controllers/Order.controller');

const router = Router();

// All order routes require authentication

// List routes (static paths first)
router.get('/', auth, getMyOrders);                            // Buyer's orders
router.get('/seller', auth, getSellerOrders);                  // Seller's orders (?status=pending)
router.post('/placeOrder', auth, placeOrder);                  // Place order from cart

// Single order routes (parameterized — must be last)
router.get('/:orderId', auth, getOrderById);                   // Get order details
router.patch('/:orderId/status', auth, updateOrderStatus);     // Seller updates status
router.patch('/:orderId/cancel', auth, cancelOrder);           // Buyer or seller cancels

module.exports = router;