const mongoose = require('mongoose');

const productAnalyticsSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
        unique: true,
    },
    totalSales: {
        type: Number,
        default: 0,
    },
    totalOrders: {
        type: Number,
        default: 0,
    },
    totalQuantitySold: {
        type: Number,
        default: 0,
    },
    productViews: {
        type: Number,
        default: 0,
    },
    addToCartCount: {
        type: Number,
        default: 0,
    },
    averageRating: {
        type: Number,
        default: 0,
    },
    totalReviews: {
        type: Number,
        default: 0,
    },
}, { timestamps: true });
productAnalyticsSchema.index({ productId: 1 });

const ProductAnalytics = mongoose.model('ProductAnalytics', productAnalyticsSchema);
module.exports = ProductAnalytics;
