const mongoose = require('mongoose');
require('./productmodel'); // Ensure Product schema is registered

const cartItemSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true }
});

const cartSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [cartItemSchema],
    total: { type: Number, default: 0 }
}, { timestamps: true });

cartSchema.pre('save', function (next) {
    this.total = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    next();
});

module.exports = mongoose.model('Cart', cartSchema);

