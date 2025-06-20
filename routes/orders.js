const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const orderController = require('../controllers/orderController');

// Get all orders for the current user
router.get('/', protect, orderController.getOrders);

// Get a specific order
router.get('/:id', protect, orderController.getOrderDetails);

// Create a new order
router.post('/', protect, orderController.createOrder);

// Cancel an order
router.post('/:id/cancel', protect, orderController.cancelOrder);

module.exports = router; 