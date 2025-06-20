const mongoose = require('mongoose');
const Product = require('../models/Product');

const products = [
    {
        sku: "WH-001",
        name: "Wireless Headphones",
        description: "High-quality wireless headphones with noise cancellation",
        price: 199.99,
        images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500"],
        category: "Electronics",
        stock: 50
    },
    {
        sku: "SW-001",
        name: "Smart Watch",
        description: "Feature-rich smartwatch with health tracking",
        price: 299.99,
        images: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500"],
        category: "Electronics",
        stock: 30
    },
    {
        sku: "RS-001",
        name: "Running Shoes",
        description: "Comfortable running shoes for all terrains",
        price: 89.99,
        images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500"],
        category: "Sports",
        stock: 100
    },
    {
        sku: "BP-001",
        name: "Backpack",
        description: "Durable backpack with multiple compartments",
        price: 49.99,
        images: ["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500"],
        category: "Accessories",
        stock: 75
    },
    {
        sku: "CM-001",
        name: "Coffee Maker",
        description: "Programmable coffee maker with thermal carafe",
        price: 79.99,
        images: ["https://images.unsplash.com/photo-1570087935864-441b5fe83d2a?w=500"],
        category: "Home",
        stock: 25
    }
];

const seedProducts = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce');
        // Drop the products collection if it exists
        if (await mongoose.connection.db.listCollections({ name: 'products' }).hasNext()) {
            await mongoose.connection.db.dropCollection('products');
            console.log('Dropped existing products collection.');
        }
        // Add new products
        await Product.insertMany(products);
        console.log('Products seeded successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding products:', error);
        process.exit(1);
    }
};

seedProducts(); 