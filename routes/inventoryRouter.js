const express = require('express');
const router = express.Router();
const Product = require('../models/productmodel');

// GET /inventory - Display product list page
router.get('/', async (req, res) => {
    try {
        const products = await Product.find().sort({ name: 1 });
        res.render('inventory-management', {
            products,
            success: req.flash('success') || '',
            error: req.flash('error') || ''
        });
    } catch (error) {
        req.flash('error', 'Error fetching products data');
        res.render('inventory-management', {
            products: [],
            success: '',
            error: 'Error fetching products data'
        });
    }
});

// GET /inventory/stock - Get current stock levels
router.get('/stock', (req, res) => {
    // TODO: Implement stock level retrieval
    res.json({ message: 'Stock levels endpoint' });
});

// POST /inventory/update/:id - Update inventory item
router.post('/update/:id', async (req, res) => {
    try {
        const { currentStock, lowStockThreshold, unitPrice } = req.body;

        await Inventory.findByIdAndUpdate(req.params.id, {
            currentStock: parseInt(currentStock),
            lowStockThreshold: parseInt(lowStockThreshold),
            unitPrice: parseFloat(unitPrice),
            lastUpdated: Date.now()
        });

        req.flash('success', 'Item updated successfully');
        res.redirect('/inventory');
    } catch (error) {
        req.flash('error', 'Error updating item: ' + error.message);
        res.redirect('/inventory');
    }
});

// POST /inventory/delete/:id - Delete a product
router.post('/delete/:id', async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        req.flash('success', 'Product deleted successfully');
        res.redirect('/inventory');
    } catch (error) {
        req.flash('error', 'Error deleting product');
        res.redirect('/inventory');
    }
});

// GET /inventory/low-stock - Get items with low stock
router.get('/low-stock', async (req, res) => {
    try {
        const lowStockItems = await Inventory.find({
            $expr: { $lte: ["$currentStock", "$lowStockThreshold"] }
        });
        res.json(lowStockItems);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching low stock items' });
    }
});

// GET /inventory/search - Search inventory items
router.get('/search', async (req, res) => {
    try {
        const { query } = req.query;
        const searchResults = await Inventory.find({
            $or: [
                { productName: { $regex: query, $options: 'i' } },
                { sku: { $regex: query, $options: 'i' } },
                { category: { $regex: query, $options: 'i' } }
            ]
        });
        res.json(searchResults);
    } catch (error) {
        res.status(500).json({ error: 'Error searching inventory' });
    }
});

module.exports = router; 