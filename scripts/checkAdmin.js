const mongoose = require('mongoose');
const User = require('../models/usermodel');
require('dotenv').config();

async function checkAdminUsers() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/scatch');
        console.log('Connected to MongoDB');

        // Find all admin users
        const adminUsers = await User.find({ isAdmin: true }, 'fullName email');

        console.log('\nAdmin Users Found:', adminUsers.length);
        console.log('------------------------');
        adminUsers.forEach((admin, index) => {
            console.log(`Admin ${index + 1}:`);
            console.log('Full Name:', admin.fullName);
            console.log('Email:', admin.email);
            console.log('------------------------');
        });

    } catch (error) {
        console.error('Error checking admin users:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

checkAdminUsers(); 