const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Get cart
router.get('/', (req, res) => {
    const cart = req.session.cart || [];
    res.render('cart', {
        cart,
        user: req.user,
        title: 'Shopping Cart'
    });
});

// Add to cart
router.post('/add/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            req.flash('error', 'Product not found');
            return res.redirect('/shop');
        }

        const cart = req.session.cart || [];
        const existingItem = cart.find(item => item.product._id.toString() === req.params.id);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                product,
                quantity: 1
            });
        }

        req.session.cart = cart;
        req.flash('success', 'Product added to cart');
        res.redirect('/cart');
    } catch (error) {
        req.flash('error', 'Error adding product to cart');
        res.redirect('/shop');
    }
});

// Remove from cart
router.post('/remove/:id', (req, res) => {
    const cart = req.session.cart || [];
    const updatedCart = cart.filter(item => item.product._id.toString() !== req.params.id);
    req.session.cart = updatedCart;
    req.flash('success', 'Product removed from cart');
    res.redirect('/cart');
});

// Update cart quantity
router.post('/update/:id', (req, res) => {
    const { quantity } = req.body;
    const cart = req.session.cart || [];
    const item = cart.find(item => item.product._id.toString() === req.params.id);

    if (item) {
        item.quantity = parseInt(quantity);
    }

    req.session.cart = cart;
    res.redirect('/cart');
});

module.exports = router; 