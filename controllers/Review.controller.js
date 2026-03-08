const mongoose = require('mongoose');
const Review = require('../models/Review.model');
const Product = require('../models/Product.model');

// ═══════════════════════════════════════════════════
//  HELPER — Recalculate product average rating
// ═══════════════════════════════════════════════════
const recalculateProductRating = async (productId) => {
    const result = await Review.aggregate([
        { $match: { productId: new mongoose.Types.ObjectId(productId) } },
        {
            $group: {
                _id: '$productId',
                averageRating: { $avg: '$rating' },
                numberOfReviews: { $sum: 1 },
            },
        },
    ]);

    if (result.length > 0) {
        await Product.findByIdAndUpdate(productId, {
            averageRating: Math.round(result[0].averageRating * 10) / 10,
            numberOfReviews: result[0].numberOfReviews,
        });
    } else {
        // No reviews left — reset to defaults
        await Product.findByIdAndUpdate(productId, {
            averageRating: 0,
            numberOfReviews: 0,
        });
    }
};

// ═══════════════════════════════════════════════════
//  ADD REVIEW  (POST /review)
//  Auth required — one review per user per product
// ═══════════════════════════════════════════════════
const addReview = async (req, res) => {
    try {
        const userId = req.user._id;
        const { productId, reviewMessage, rating, images } = req.body;

        // ── Input validation ──
        if (!productId || !reviewMessage || rating === undefined) {
            return res.status(400).json({
                success: false,
                message: 'productId, reviewMessage, and rating are required',
            });
        }
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ success: false, message: 'Invalid product ID' });
        }
        if (typeof reviewMessage !== 'string' || reviewMessage.trim().length === 0) {
            return res.status(400).json({ success: false, message: 'reviewMessage must be a non-empty string' });
        }
        if (typeof rating !== 'number' || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: 'rating must be a number between 1 and 5' });
        }
        if (images && !Array.isArray(images)) {
            return res.status(400).json({ success: false, message: 'images must be an array' });
        }

        // ── Verify product exists ──
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // ── Prevent duplicate reviews ──
        const existingReview = await Review.findOne({ productId, userId });
        if (existingReview) {
            return res.status(409).json({
                success: false,
                message: 'You have already reviewed this product. Use update instead.',
            });
        }

        // ── Create review ──
        const review = new Review({
            productId,
            userId,
            reviewMessage: reviewMessage.trim(),
            rating,
            images: images || [],
        });
        await review.save();

        // ── Recalculate product rating ──
        await recalculateProductRating(productId);

        return res.status(201).json({
            success: true,
            message: 'Review added successfully',
            review,
        });
    } catch (error) {
        console.error('AddReview Error:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ═══════════════════════════════════════════════════
//  GET PRODUCT REVIEWS  (GET /review/:productId)
//  Public — paginated, sorted by newest
// ═══════════════════════════════════════════════════
const getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ success: false, message: 'Invalid product ID' });
        }

        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
        const skip = (page - 1) * limit;

        const [reviews, total] = await Promise.all([
            Review.find({ productId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('userId', 'fullName')
                .lean(),
            Review.countDocuments({ productId }),
        ]);

        return res.status(200).json({
            success: true,
            reviews,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('GetProductReviews Error:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ═══════════════════════════════════════════════════
//  UPDATE REVIEW  (PATCH /review/:reviewId)
//  Auth required — owner only
// ═══════════════════════════════════════════════════
const updateReview = async (req, res) => {
    try {
        const userId = req.user._id;
        const { reviewId } = req.params;
        const { reviewMessage, rating, images } = req.body;

        if (!mongoose.Types.ObjectId.isValid(reviewId)) {
            return res.status(400).json({ success: false, message: 'Invalid review ID' });
        }

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        if (review.userId.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: 'You are not authorized to update this review' });
        }

        // ── Validate & apply updates ──
        if (reviewMessage !== undefined) {
            if (typeof reviewMessage !== 'string' || reviewMessage.trim().length === 0) {
                return res.status(400).json({ success: false, message: 'reviewMessage must be a non-empty string' });
            }
            review.reviewMessage = reviewMessage.trim();
        }
        if (rating !== undefined) {
            if (typeof rating !== 'number' || rating < 1 || rating > 5) {
                return res.status(400).json({ success: false, message: 'rating must be a number between 1 and 5' });
            }
            review.rating = rating;
        }
        if (images !== undefined) {
            if (!Array.isArray(images)) {
                return res.status(400).json({ success: false, message: 'images must be an array' });
            }
            review.images = images;
        }

        await review.save();

        // ── Recalculate product rating if rating changed ──
        if (rating !== undefined) {
            await recalculateProductRating(review.productId);
        }

        return res.status(200).json({
            success: true,
            message: 'Review updated successfully',
            review,
        });
    } catch (error) {
        console.error('UpdateReview Error:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ═══════════════════════════════════════════════════
//  DELETE REVIEW  (DELETE /review/:reviewId)
//  Auth required — owner only
// ═══════════════════════════════════════════════════
const deleteReview = async (req, res) => {
    try {
        const userId = req.user._id;
        const { reviewId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(reviewId)) {
            return res.status(400).json({ success: false, message: 'Invalid review ID' });
        }

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        if (review.userId.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: 'You are not authorized to delete this review' });
        }

        const productId = review.productId;
        await Review.findByIdAndDelete(reviewId);

        // ── Recalculate product rating ──
        await recalculateProductRating(productId);

        return res.status(200).json({
            success: true,
            message: 'Review deleted successfully',
        });
    } catch (error) {
        console.error('DeleteReview Error:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = {
    addReview,
    getProductReviews,
    updateReview,
    deleteReview,
};
