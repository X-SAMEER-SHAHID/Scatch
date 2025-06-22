const mongoose = require('mongoose');
const Cart = require('../models/cartmodel');
const Product = require('../models/productmodel');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/scatch')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB', err));

async function cleanupCarts() {
    try {
        console.log('Starting cart cleanup...');

        // Get all carts
        const carts = await Cart.find().populate('items.product');
        let totalCleaned = 0;

        for (const cart of carts) {
            let hasChanges = false;

            // Filter out items with null products
            const originalLength = cart.items.length;
            cart.items = cart.items.filter(item => item.product !== null);

            if (cart.items.length !== originalLength) {
                hasChanges = true;
                totalCleaned += (originalLength - cart.items.length);
                console.log(`Cleaned cart for user ${cart.user}: removed ${originalLength - cart.items.length} invalid items`);
            }

            // If cart is empty, delete it
            if (cart.items.length === 0) {
                await Cart.findByIdAndDelete(cart._id);
                console.log(`Deleted empty cart for user ${cart.user}`);
                hasChanges = true;
            } else if (hasChanges) {
                // Save the updated cart
                await cart.save();
            }
        }

        console.log(`Cart cleanup completed! Cleaned ${totalCleaned} invalid items.`);
        mongoose.connection.close();
    } catch (error) {
        console.error('Error cleaning up carts:', error);
        mongoose.connection.close();
    }
}

// Run the cleanup
cleanupCarts(); 