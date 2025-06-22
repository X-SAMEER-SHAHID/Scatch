const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/usermodel');
require('dotenv').config();

async function createNewAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/scatch');
        console.log('Connected to MongoDB');

        // New admin credentials
        const adminData = {
            fullName: 'Super Admin',
            email: 'superadmin@scatch.com',
            password: 'SuperAdmin@123',
            isAdmin: true
        };

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: adminData.email });
        if (existingAdmin) {
            console.log('This admin user already exists');
            process.exit(0);
        }

        // Create admin user
        const admin = new User(adminData);
        await admin.save();

        console.log('New admin user created successfully');
        console.log('Admin credentials:');
        console.log('Email:', adminData.email);
        console.log('Password:', adminData.password);

    } catch (error) {
        console.error('Error creating admin:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

createNewAdmin(); 