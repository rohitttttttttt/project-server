const { Router } = require('express');
const auth = require('../middlewares/Auth');
const {
    addProduct,
    search,
    getProductById,
    getTopRated,
    getByCategory,
    getBySubCategory,
    getHomeFeed,
    getMyProducts,
    getSellerProducts,
} = require('../controllers/Product.controller');

const router = Router();

// ── Public routes ──
router.get('/feed', getHomeFeed);                                   // Home page curated feed
router.get('/top-rated', getTopRated);                              // Highest rated products
router.get('/category/:categoryId', getByCategory);                 // All products in a category
router.get('/category/:categoryId/:subCategory', getBySubCategory); // Products in sub-category
router.get('/seller/:sellerId', getSellerProducts);                 // Public seller profile
router.post('/search', search);                                     // Full-text search with filters

// ── Protected routes (auth required) ──
router.post('/', auth, addProduct);                                 // Create new product
router.get('/my/products', auth, getMyProducts);                    // Farmer's own listings

// ── Parameterized (MUST be last to avoid catching static paths) ──
router.get('/:id', getProductById);                                 // Single product detail

// TODO: Uncomment when you implement these
// router.get('/best-sellers', getBestSellers);                     // Best selling products
// router.get('/near-me', getNearby);                               // Products near coordinates
// router.patch('/:id', auth, updateProduct);                       // Update product (owner only)
// router.delete('/:id', auth, deleteProduct);                      // Delete product (owner only)

module.exports = router;
