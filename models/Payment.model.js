const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
    },
    paymentId: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'paid', 'failed'],
        default: 'pending',
    },
    method: {
        type: String,
        enum: ['COD', 'UPI', 'Card'],
        required: true,
    },
}, { timestamps: true });
paymentSchema.index({ orderId: 1 });

const Payment = mongoose.model('Payment', paymentSchema);
module.exports = Payment;
