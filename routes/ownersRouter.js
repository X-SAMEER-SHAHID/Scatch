const express = require("express");
const router = express.Router();
const ownerModel = require("../models/ownersmodel")
const isAdmin = require('../middlewares/isAdmin');
const User = require('../models/usermodel');
const Product = require('../models/productmodel');
const isLoggedIn = require('../middlewares/isLoggedIn');
const Order = require('../models/ordermodel');

if (process.env.NODE_ENV === "development") {
    router.post("/create", async (req, res) => {
        let owners = await ownerModel.find();
        if (owners.length > 0) {
            return res.status(500).send("You cannot create a new owner,");
        }

        let { fullname, email, password } = req.body;

        let createdOwner = await ownerModel.create({
            fullname,
            email,
            password,
        });

        res.status(201).send(createdOwner)
    })
}

router.get("/", function (req, res) {
    res.send("hey its working");
});

router.get("/admin", function (req, res) {
    let success = req.flash("success");
    res.render("createproducts", { success });
})

// Admin Dashboard
router.get('/admin/dashboard', isLoggedIn, isAdmin, async (req, res) => {
    try {
        console.log('Rendering admin dashboard');
        res.render('admin-dashboard');
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ error: 'Error loading dashboard' });
    }
});

// Dashboard Data API
router.get('/admin/dashboard/data', isLoggedIn, isAdmin, async (req, res) => {
    console.log('Fetching dashboard data');
    try {
        // Fetch dashboard data
        const totalUsers = await User.countDocuments();
        console.log('Total users:', totalUsers);

        const activeOrders = await Order.countDocuments({ status: 'pending' });
        console.log('Active orders:', activeOrders);

        const totalProducts = await Product.countDocuments();
        console.log('Total products:', totalProducts);

        // Calculate total revenue
        const orders = await Order.find();
        const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
        console.log('Total revenue:', totalRevenue);

        // Get recent orders for activity log
        const recentOrders = await Order.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .lean(); // Convert to plain JavaScript objects

        // Fetch users separately and create a map
        const userIds = recentOrders.map(order => order.user);
        const users = await User.find({ _id: { $in: userIds } }).lean();
        const userMap = {};
        users.forEach(user => {
            userMap[user._id.toString()] = user;
        });

        // Map orders with user data
        const ordersWithUserData = recentOrders.map(order => ({
            id: order._id,
            user: order.user ? {
                name: userMap[order.user.toString()]?.fullName || 'Unknown User',
                email: userMap[order.user.toString()]?.email || 'unknown@email.com'
            } : { name: 'Unknown User', email: 'unknown@email.com' },
            total: order.total || 0,
            status: order.status,
            createdAt: order.createdAt
        }));

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

        const response = {
            stats: {
                totalUsers,
                activeOrders,
                totalRevenue,
                totalProducts
            },
            recentOrders: ordersWithUserData,
            revenueData,
            userGrowth
        };

        console.log('Sending response:', JSON.stringify(response, null, 2));
        res.json(response);
    } catch (error) {
        console.error('Dashboard data error:', error);
        res.status(500).json({ error: 'Error fetching dashboard data' });
    }
});

// Inventory Management Route
router.get('/inventory', isLoggedIn, isAdmin, async (req, res) => {
    try {
        res.render('inventory-management');
    } catch (error) {
        console.error('Inventory error:', error);
        res.status(500).json({ error: 'Error loading inventory management' });
    }
});

module.exports = router;