const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/usermodel');
const Product = require('../models/productmodel');
const Order = require('../models/ordermodel');
require('dotenv').config();

async function checkData() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/scatch');
        console.log('Connected to MongoDB');

        // Check Users
        const users = await User.find();
        console.log('\nUsers:', users.length);
        console.log(users.map(u => ({ id: u._id, name: u.fullName, email: u.email, isAdmin: u.isAdmin })));

        // Check Products
        const products = await Product.find();
        console.log('\nProducts:', products.length);
        console.log(products.map(p => ({ id: p._id, name: p.name, price: p.price })));

        // Check Orders
        const orders = await Order.find();
        console.log('\nOrders:', orders.length);
        console.log(orders.map(o => ({ id: o._id, user: o.user, total: o.total, status: o.status })));

    } catch (error) {
        console.error('Error checking data:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

async function checkAdminPasswords() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/scatch');
        console.log('Connected to MongoDB');

        // Common admin passwords to try
        const commonPasswords = [
            'Admin@123',
            'admin123',
            'password123',
            'Owner@123',
            'owner123',
            'Store@123',
            'store123'
        ];

        // Find all admin users
        const adminUsers = await User.find({ isAdmin: true });

        console.log('\nChecking admin accounts...');
        console.log('------------------------');

        for (const admin of adminUsers) {
            console.log(`\nChecking account: ${admin.email}`);
            for (const password of commonPasswords) {
                const isMatch = await admin.comparePassword(password);
                if (isMatch) {
                    console.log('Found matching password!');
                    console.log('Email:', admin.email);
                    console.log('Password:', password);
                    console.log('------------------------');
                }
            }
        }

    } catch (error) {
        console.error('Error checking admin accounts:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

checkData();
checkAdminPasswords(); 