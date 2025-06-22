const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
    productName: {
        type: String,
        required: true,
        trim: true
    },
    sku: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    currentStock: {
        type: Number,
        required: true,
        min: 0
    },
    lowStockThreshold: {
        type: Number,
        required: true,
        min: 0
    },
    unitPrice: {
        type: Number,
        required: true,
        min: 0
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

// Generate SKU before saving
inventorySchema.pre('save', async function (next) {
    if (!this.sku) {
        const prefix = this.category.substring(0, 3).toUpperCase();
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        this.sku = `${prefix}-${timestamp}-${random}`;
    }
    next();
});

const Inventory = mongoose.model('Inventory', inventorySchema);

module.exports = Inventory; 