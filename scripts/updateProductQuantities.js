const mongoose = require('mongoose');
const Product = require('../models/productmodel');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/scatch')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB', err));

// Function to generate random integer between min and max (inclusive)
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Function to shuffle an array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

async function updateProductQuantities() {
    try {
        console.log('Starting to update product quantities...');

        const products = await Product.find({});

        if (products.length < 4) {
            console.error('Not enough products to set low inventory for at least 4 of them.');
            mongoose.connection.close();
            return;
        }

        shuffleArray(products);

        const lowStockProducts = products.slice(0, 4);
        const normalStockProducts = products.slice(4);

        // Update low stock products
        for (const product of lowStockProducts) {
            const newQuantity = randomInt(1, 9);
            product.quantity = newQuantity;
            await product.save();
            console.log(`Updated ${product.name} quantity to ${newQuantity} (low stock).`);
        }

        // Update normal stock products
        for (const product of normalStockProducts) {
            const newQuantity = randomInt(10, 100);
            product.quantity = newQuantity;
            await product.save();
            console.log(`Updated ${product.name} quantity to ${newQuantity}.`);
        }

        console.log('Product quantities updated successfully!');
        mongoose.connection.close();
    } catch (error) {
        console.error('Error updating product quantities:', error);
        mongoose.connection.close();
    }
}

// Run the update
updateProductQuantities(); 