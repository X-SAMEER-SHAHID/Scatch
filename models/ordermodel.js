const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: String,
    price: Number,
    quantity: Number,
    image: Buffer
});

const trackingEventSchema = new mongoose.Schema({
    status: String, // e.g., "shipped", "out_for_delivery", "delivered"
    location: String, // e.g., "Delhi Hub"
    timestamp: { type: Date, default: Date.now },
    details: String // e.g., "Handed to courier"
});

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    items: [orderItemSchema],
    total: Number,
    status: { type: String, default: 'pending' }, // current status
    paymentMethod: String,
    shippingAddress: String,
    billingAddress: String,
    tracking: [trackingEventSchema], // order tracking history
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    orderNumber: { type: String, unique: true, required: true }
});

module.exports = mongoose.model('Order', orderSchema);
