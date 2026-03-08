const { Router } = require('express');
const auth = require('../middlewares/Auth');
const {
    addReview,
    getProductReviews,
    updateReview,
    deleteReview,
} = require('../controllers/Review.controller');

const router = Router();

// ── Public routes ──
router.get('/:productId', getProductReviews);          // Get all reviews for a product

// ── Protected routes (auth required) ──
router.post('/', auth, addReview);                     // Add a review
router.patch('/:reviewId', auth, updateReview);        // Update own review
router.delete('/:reviewId', auth, deleteReview);       // Delete own review

module.exports = router;
