const mongoose = require('mongoose');
const axios = require('axios');
const Product = require('../models/productmodel');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/scatch')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB', err));

// Product names for demo
const productNames = [
    'Classic T-Shirt', 'Denim Jeans', 'Leather Jacket', 'Running Shoes',
    'Summer Dress', 'Winter Coat', 'Casual Shirt', 'Sports Shorts',
    'Elegant Watch', 'Sunglasses', 'Backpack', 'Sneakers',
    'Hoodie', 'Scarf', 'Beanie', 'Socks Pack',
    'Belt', 'Wallet', 'Umbrella', 'Gloves'
];

// Function to generate random price between min and max
const randomPrice = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

// Function to generate random color
const randomColor = () => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
        '#D4A5A5', '#9E9E9E', '#58B19F', '#FFB6B9', '#FAD02E'];
    return colors[Math.floor(Math.random() * colors.length)];
};

// Function to fetch image from Lorem Picsum
async function getImage(index, width = 800, height = 600) {
    try {
        const response = await axios.get(`https://picsum.photos/${width}/${height}?random=${index}`, {
            responseType: 'arraybuffer'
        });
        return Buffer.from(response.data, 'binary');
    } catch (error) {
        console.error('Error fetching image:', error);
        return null;
    }
}

// Function to create products
async function seedProducts() {
    try {
        // Clear existing products
        await Product.deleteMany({});

        for (let i = 0; i < 20; i++) {
            // Get main product image
            const image = await getImage(i);
            // Get title image (smaller size)
            const titleImage = await getImage(i + 100, 400, 300);

            const product = new Product({
                name: productNames[i],
                price: randomPrice(20, 200),
                discount: randomPrice(0, 30),
                bgcolor: randomColor(),
                panelcolor: randomColor(),
                textcolor: '#FFFFFF',
                image: image,
                titleImage: titleImage
            });

            await product.save();
            console.log(`Added product: ${product.name}`);

            // Add a small delay between requests to avoid overwhelming the server
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log('Seeding completed!');
        mongoose.connection.close();
    } catch (error) {
        console.error('Error seeding products:', error);
        mongoose.connection.close();
    }
}

// Run the seeding
seedProducts(); 