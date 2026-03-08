const { Router } = require('express');
const auth = require('../middlewares/Auth');
const {
    addProduct,
    search,
    getNearByProducts,
    getLatestProducts,
    getTopRatedProducts,
    getOrganicProducts,
    getProductById,
    getByCategory,
    getBySubCategory,
    getHomeFeed,
    getMyProducts,
    getSellerProducts,
    getBestSellers,
    updateProduct,
    deleteProduct,
} = require('../controllers/Product.controller');
const {apiLimitter} = require('../middlewares/rateLimiter')

const router = Router();

// ── Public routes ──
router.get('/feed', apiLimitter, getHomeFeed);                                   // Home page curated feed
router.get('/top-rated', getTopRatedProducts);                      // Highest rated products
router.get('/best-sellers', getBestSellers);                        // Best selling products
router.get('/latest', getLatestProducts);                           // Freshly added products
router.get('/organic', getOrganicProducts);                         // Organic products
router.post('/near-me', getNearByProducts);                         // Products near coordinates
router.get('/category/:categoryId', getByCategory);                 // All products in a category
router.get('/category/:categoryId/:subCategory', getBySubCategory); // Products in sub-category
router.get('/seller/:sellerId', getSellerProducts);                 // Public seller profile
router.post('/search', apiLimitter, search);                                     // Full-text search with filters

// ── Protected routes (auth required) ──
router.post('/', auth, addProduct);                                 // Create new product
router.get('/my/products', auth, getMyProducts);                    // Farmer's own listings
router.patch('/:id', auth, updateProduct);                          // Update product (owner only)
router.delete('/:id', auth, deleteProduct);                         // Delete product (owner only)

// ── Parameterized (MUST be last to avoid catching static paths) ──
router.get('/:id', getProductById);                                 // Single product detail

module.exports = router;
