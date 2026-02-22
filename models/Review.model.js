const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    reviewMessage: {
        type: String,
        required: true,
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    images: {
        type: [String],
        default: [],
    },
}, { timestamps: true });
reviewSchema.index({ productId: 1 });
reviewSchema.index({ userId: 1 });

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
