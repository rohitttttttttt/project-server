const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    items: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            default: 1,
        },
    }],
    total: {
        type: Number,
        default: 0,
    },
}, { timestamps: true });
cartSchema.index({ userId: 1 },{unique: true});
const Cart = mongoose.model('Cart', cartSchema);
module.exports = Cart;
