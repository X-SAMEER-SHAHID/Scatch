const Order = require('../models/ordermodel');

// Get all orders for a user
exports.getUserOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .sort({ createdAt: -1 }); // Sort by newest first

        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Error fetching orders' });
    }
};

// Get single order details
exports.getOrderDetails = async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.orderId,
            user: req.user._id
        });

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json(order);
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).json({ error: 'Error fetching order details' });
    }
};

// Update order status (admin only)
exports.updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status, location, details } = req.body;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Add new tracking event
        order.tracking.push({
            status,
            location,
            details,
            timestamp: new Date()
        });

        // Update current status
        order.status = status;
        order.updatedAt = new Date();

        await order.save();

        res.json(order);
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Error updating order status' });
    }
};

// Create new order
exports.createOrder = async (req, res) => {
    try {
        const { items, total, paymentMethod, shippingAddress, billingAddress } = req.body;

        const order = new Order({
            user: req.user._id,
            items,
            total,
            paymentMethod,
            shippingAddress,
            billingAddress,
            orderNumber: generateOrderNumber(),
            status: 'ordered',
            tracking: [{
                status: 'ordered',
                details: 'Order placed successfully',
                timestamp: new Date()
            }]
        });

        await order.save();
        res.status(201).json(order);
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Error creating order' });
    }
};

// Helper function to generate order number
function generateOrderNumber() {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${timestamp}${random}`;
}
