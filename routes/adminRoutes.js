const express = require('express');
const router = express.Router();
const isAdmin = require('../middlewares/isAdmin');
const Order = require('../models/ordermodel');
const User = require('../models/usermodel');
const Product = require('../models/productmodel');
const orderController = require('../controllers/orderController');

// Apply isAdmin middleware to all admin routes
router.use(isAdmin);

// Admin dashboard page render
router.get('/dashboard', async (req, res) => {
    try {
        // Fetch dashboard data
        const totalUsers = await User.countDocuments();
        const activeOrders = await Order.countDocuments({ status: 'pending' });
        const totalProducts = await Product.countDocuments();

        // Calculate total revenue
        const orders = await Order.find();
        const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);

        // Get recent orders for activity log
        const recentOrders = await Order.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('user', 'name email');

        // Get revenue data for chart
        const revenueData = await Order.aggregate([
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$createdAt"
                        }
                    },
                    dailyRevenue: { $sum: "$total" }
                }
            },
            { $sort: { _id: 1 } },
            { $limit: 7 }
        ]);

        // Get user growth data
        const userGrowth = await User.aggregate([
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$createdAt"
                        }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } },
            { $limit: 7 }
        ]);

        res.render('admin-dashboard', {
            stats: {
                totalUsers,
                activeOrders,
                totalRevenue,
                totalProducts
            },
            recentOrders,
            revenueData,
            userGrowth
        });
    } catch (error) {
        console.error('Admin dashboard error:', error);
        res.status(500).render('error', { error: 'Internal server error' });
    }
});

// Update order status
router.put('/orders/:orderId/status', orderController.updateOrderStatus);

// Get all orders with detailed information
router.get('/orders', async (req, res) => {
    try {
        const orders = await Order.find()
            .sort({ createdAt: -1 })
            .populate('user', 'name email')
            .populate('items.product', 'name');
        res.render('admin-orders', { orders, error: req.flash('error') });
    } catch (error) {
        console.error('Error fetching orders:', error);
        req.flash('error', 'Error fetching orders');
        res.status(500).render('admin-orders', { orders: [], error: req.flash('error') });
    }
});

// Get single order details
router.get('/orders/:orderId', async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId)
            .populate('user', 'name email')
            .populate('items.product', 'name');

        if (!order) {
            return res.status(404).render('error', { error: 'Order not found' });
        }

        res.render('admin-order-detail', { order });
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).render('error', { error: 'Error fetching order details' });
    }
});

module.exports = router;
