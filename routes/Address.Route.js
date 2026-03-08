const { Router } = require('express');
const auth = require('../middlewares/Auth');
const {
    addAddress,
    getMyAddress,
    updateAddress,
    deleteAddress,
} = require('../controllers/Address.controller');

const router = Router();

// All address routes require authentication
router.get('/', auth, getMyAddress);          // Get user's address
router.post('/', auth, addAddress);            // Add address
router.patch('/', auth, updateAddress);        // Update address
router.delete('/', auth, deleteAddress);       // Delete address

module.exports = router;
