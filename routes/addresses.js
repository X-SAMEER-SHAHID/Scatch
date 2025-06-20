const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const addressController = require('../controllers/addressController');

// Address routes
router.get('/', protect, addressController.getAddresses);
router.post('/', protect, addressController.addAddress);
router.put('/:id', protect, addressController.updateAddress);
router.delete('/:id', protect, addressController.deleteAddress);
router.get('/:id/edit', protect, addressController.getAddressForEdit);

module.exports = router; 