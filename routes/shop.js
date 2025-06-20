const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect } = require('../middlewares/auth');

// Get all products
router.get('/', async (req, res) => {
    try {
        const products = await Product.find();
        res.render('shop', {
            products,
            user: req.user,
            title: 'Shop'
        });
    } catch (error) {
        req.flash('error', 'Error fetching products');
        res.redirect('/');
    }
});

// Get single product
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            req.flash('error', 'Product not found');
            return res.redirect('/shop');
        }
        res.render('product-details', {
            product,
            user: req.user,
            title: product.name
        });
    } catch (error) {
        req.flash('error', 'Error fetching product');
        res.redirect('/shop');
    }
});

module.exports = router; 