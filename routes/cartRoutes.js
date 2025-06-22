const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const isLoggedIn = require('../middlewares/isLoggedIn');

router.post('/add', isLoggedIn, cartController.addToCart);
router.post('/update/:itemId', isLoggedIn, cartController.updateQuantity);

module.exports = router;
