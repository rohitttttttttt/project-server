const { Router } = require('express');
const router = Router();
const {
    signUp,
    login,
    logout,
    refreshAccessToken,
    getCurrentUser,
    getUser,
} = require('../controllers/User.controller');
const auth = require('../middlewares/Auth');
const {loginLimitter} = require('../middlewares/rateLimiter')

// --- Public routes ---
router.post('/register',loginLimitter, signUp);
router.post('/login', loginLimitter, login);
router.post('/refresh-token', refreshAccessToken);

// --- Protected routes ---
router.post('/logout', auth, logout);
router.get('/me', auth, getCurrentUser);
router.get('/:id', auth, getUser);

module.exports = router;