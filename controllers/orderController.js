const Order = require('../models/Order');

// Get all orders for a user
exports.getOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .populate('items.product')
            .sort({ createdAt: -1 });

        res.render('orders', { orders });
    } catch (error) {
        req.flash('error', 'Error loading orders');
        res.redirect('/');
    }
};

// Get single order details
exports.getOrderDetails = async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.id,
            user: req.user._id
        }).populate('items.product');

        if (!order) {
            req.flash('error', 'Order not found');
            return res.redirect('/orders');
        }

        res.render('order-details', { order });
    } catch (error) {
        req.flash('error', 'Error loading order details');
        res.redirect('/orders');
    }
};

// Cancel order
exports.cancelOrder = async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.id,
            user: req.user._id,
            status: 'processing'
        });

        if (!order) {
            req.flash('error', 'Order cannot be cancelled');
            return res.redirect('/orders');
        }

        order.status = 'cancelled';
        await order.save();

        req.flash('success', 'Order cancelled successfully');
        res.redirect('/orders');
    } catch (error) {
        req.flash('error', 'Error cancelling order');
        res.redirect('/orders');
    }
};

// Create new order
exports.createOrder = async (req, res) => {
    try {
        const { items, shippingAddress, paymentMethod } = req.body;

        // Calculate total
        const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Generate order number
        const orderNumber = 'ORD' + Date.now().toString().slice(-6);

        const order = new Order({
            user: req.user._id,
            orderNumber,
            items,
            total,
            shippingAddress,
            paymentMethod,
            status: 'processing'
        });

        await order.save();

        // Clear cart after successful order
        req.session.cart = null;

        req.flash('success', 'Order placed successfully');
        res.redirect(`/orders/${order._id}`);
    } catch (error) {
        req.flash('error', 'Error creating order');
        res.redirect('/cart');
    }
}; 