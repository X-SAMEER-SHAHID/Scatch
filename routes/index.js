const express = require("express")
const router = express.Router();
const prodectsModel = require("../models/productmodel")
const isLoggedIn = require("../middlewares/isLoggedIn");
const usermodel = require("../models/usermodel");
const jwt = require('jsonwebtoken');
const Cart = require("../models/cartmodel");
const Product = require("../models/productmodel");
const Order = require("../models/ordermodel");

// Default landing page - accessible without authentication
router.get("/", (req, res) => {
    let error = req.flash("error");
    let success = req.flash("success");
    res.render("index", { error, success, loggedin: false });
});

// Protected routes
router.get("/shop", isLoggedIn, async (req, res) => {
    let { category, sortby, search } = req.query;
    let filter = {};

    // Add search filter
    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
        ];
    }

    if (category === 'new') {
        const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
        filter.dateAdded = { $gte: twoDaysAgo };
    } else if (category === 'discount') {
        filter.discount = { $gt: 0 };
    }
    // Sorting logic
    let sort = {};
    if (sortby === 'newest') {
        sort.dateAdded = -1;
    } else if (sortby === 'price') {
        sort.price = -1;
    }
    let products = await prodectsModel.find(filter).sort(sort);
    let success = req.flash("success") || [];
    res.render("shop", { products, success, category, sortby, search });
});

router.get("/cart", isLoggedIn, async (req, res) => {
    const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
    if (!cart || cart.items.length < 1) {
        req.flash("success", "Add something in the cart first.");
        return res.redirect("/shop");
    }

    // Filter out items with null products (products that no longer exist)
    const validItems = cart.items.filter(item => item.product !== null);

    if (validItems.length === 0) {
        // If no valid items remain, clear the cart
        await Cart.findByIdAndDelete(cart._id);
        req.flash("success", "Your cart has been cleared as some products are no longer available.");
        return res.redirect("/shop");
    }

    // Map items to include product details and quantity
    const cartItems = validItems.map(item => ({
        _id: item._id,
        name: item.product.name,
        image: item.product.image,
        price: item.price,
        quantity: item.quantity
    }));

    // Calculate total
    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) + 20;
    res.render("cart", { user: { ...req.user, cart: cartItems }, total });
});

router.get("/addtocart/:id", isLoggedIn, async (req, res) => {
    const productId = req.params.id;
    const userId = req.user._id;

    // Get product details
    const product = await Product.findById(productId);
    if (!product) {
        req.flash("error", "Product not found");
        return res.redirect("/shop");
    }

    // Find or create cart
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
        cart = new Cart({ user: userId, items: [] });
    }

    // Check if product already in cart
    const existingItem = cart.items.find(item => item.product.toString() === productId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.items.push({
            product: productId,
            quantity: 1,
            price: product.price
        });
    }

    await cart.save();
    req.flash("success", "Item added successfully.");
    res.redirect("/shop");
});

// Forgot Password View
router.get("/forgot-password", (req, res) => {
    res.render("forgot-password", { messages: {} });
});

// Reset Password View
router.get("/reset-password/:token", (req, res) => {
    res.render("reset-password", { messages: {} });
});

// Account page
router.get("/account", isLoggedIn, async (req, res) => {
    try {
        const user = await usermodel.findOne({ email: req.user.email });
        const orders = await Order.find({ user: req.user._id })
            .sort({ createdAt: -1 }); // Sort by newest first
        res.render("account", {
            user,
            orders,
            success: req.flash("success"),
            error: req.flash("error")
        });
    } catch (err) {
        console.error('Error loading account data:', err);
        req.flash("error", "Failed to load account data.");
        res.redirect("/");
    }
});

// Update personal info
router.post("/account/update-info", isLoggedIn, async (req, res) => {
    try {
        const { fullName } = req.body;
        await usermodel.updateOne({ email: req.user.email }, { fullName });
        req.flash("success", "Personal information updated.");
        res.redirect("/account");
    } catch (err) {
        req.flash("error", "Failed to update info.");
        res.redirect("/account");
    }
});

// Update address
router.post("/account/update-address", isLoggedIn, async (req, res) => {
    try {
        const { shippingAddress, billingAddress } = req.body;
        await usermodel.updateOne({ email: req.user.email }, { shippingAddress, billingAddress });
        req.flash("success", "Address updated.");
        res.redirect("/account");
    } catch (err) {
        req.flash("error", "Failed to update address.");
        res.redirect("/account");
    }
});

// Change password
router.post("/account/change-password", isLoggedIn, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await usermodel.findOne({ email: req.user.email });
        if (!(await user.comparePassword(currentPassword))) {
            req.flash("error", "Current password is incorrect.");
            return res.redirect("/account");
        }
        user.password = newPassword;
        await user.save();
        req.flash("success", "Password changed successfully.");
        res.redirect("/account");
    } catch (err) {
        req.flash("error", "Failed to change password.");
        res.redirect("/account");
    }
});

// Delete account
router.post("/account/delete", isLoggedIn, async (req, res) => {
    try {
        await usermodel.deleteOne({ email: req.user.email });
        res.clearCookie('token'); // Clear JWT or session cookie
        req.logout && req.logout(); // Call logout if using passport
        req.flash("success", "Account deleted.");
        res.redirect("/");
    } catch (err) {
        req.flash("error", "Failed to delete account.");
        res.redirect("/account");
    }
});

// Product detail page
router.get("/product/:id", async (req, res) => {
    let user = null;
    try {
        // Check for JWT token in cookies
        if (req.cookies && req.cookies.token) {
            try {
                const decoded = jwt.verify(req.cookies.token, process.env.JWT_KEY);
                user = await usermodel.findById(decoded.userId);
            } catch (err) {
                user = null;
            }
        }
        const product = await prodectsModel.findById(req.params.id).populate({
            path: 'reviews.user',
            select: 'fullName email'
        });
        if (!product) {
            req.flash('error', 'Product not found');
            return res.redirect('/shop');
        }
        res.render("product-detail", { product, user, success: req.flash('success'), error: req.flash('error') });
    } catch (err) {
        req.flash('error', 'Error loading product');
        res.redirect('/shop');
    }
});

router.post("/product/:id/review", async (req, res) => {
    try {
        // Check for JWT token in cookies to get user
        let user = null;
        if (req.cookies && req.cookies.token) {
            try {
                const jwt = require('jsonwebtoken');
                const decoded = jwt.verify(req.cookies.token, process.env.JWT_KEY);
                user = await usermodel.findById(decoded.userId);
            } catch (err) {
                user = null;
            }
        }
        if (!user) {
            req.flash('error', 'You must be logged in to submit a review.');
            return res.redirect(`/product/${req.params.id}`);
        }
        const { rating, comment } = req.body;
        const product = await prodectsModel.findById(req.params.id);
        if (!product) {
            req.flash('error', 'Product not found');
            return res.redirect('/shop');
        }
        product.reviews.push({
            user: user._id,
            rating: parseInt(rating, 10),
            comment,
            date: new Date()
        });
        await product.save();
        req.flash('success', 'Review submitted successfully!');
        res.redirect(`/product/${req.params.id}`);
    } catch (err) {
        req.flash('error', 'Error submitting review');
        res.redirect(`/product/${req.params.id}`);
    }
});

router.get("/checkout", isLoggedIn, async (req, res) => {
    const Cart = require("../models/cartmodel");
    const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
    if (!cart || cart.items.length < 1) {
        req.flash("success", "Add something in the cart first.");
        return res.redirect("/shop");
    }

    // Filter out items with null products (products that no longer exist)
    const validItems = cart.items.filter(item => item.product !== null);

    if (validItems.length === 0) {
        // If no valid items remain, clear the cart
        await Cart.findByIdAndDelete(cart._id);
        req.flash("success", "Your cart has been cleared as some products are no longer available.");
        return res.redirect("/shop");
    }

    // Map items to include product details and quantity
    const cartItems = validItems.map(item => ({
        _id: item._id,
        name: item.product.name,
        image: item.product.image,
        price: item.price,
        quantity: item.quantity
    }));
    // Calculate total
    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) + 20;
    res.render("checkout", { user: { ...req.user, cart: cartItems }, total });
});

router.post("/checkout", isLoggedIn, async (req, res) => {
    const Cart = require("../models/cartmodel");
    const Order = require("../models/ordermodel");
    const usermodel = require("../models/usermodel");
    const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
    const user = await usermodel.findById(req.user._id);
    if (!cart || cart.items.length < 1) {
        req.flash("error", "Your cart is empty.");
        return res.redirect("/cart");
    }

    // Filter out items with null products (products that no longer exist)
    const validItems = cart.items.filter(item => item.product !== null);

    if (validItems.length === 0) {
        // If no valid items remain, clear the cart
        await Cart.findByIdAndDelete(cart._id);
        req.flash("error", "Your cart has been cleared as some products are no longer available.");
        return res.redirect("/shop");
    }

    // Prepare order items
    const orderItems = validItems.map(item => ({
        product: item.product._id,
        name: item.product.name,
        price: item.price,
        quantity: item.quantity,
        image: item.product.image
    }));
    const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingFee = 20;
    const taxes = Math.round(subtotal * 0.05);
    const total = subtotal + shippingFee + taxes;
    // Get payment method from body, query, or session
    const paymentMethod = req.body.paymentMethod || req.query.paymentMethod || req.session.paymentMethod || 'N/A';
    // Create order with status, addresses, payment, and tracking
    try {
        const orderNumber = 'ORD' + Date.now() + Math.floor(Math.random() * 1000);
        const newOrder = await Order.create({
            user: req.user._id,
            items: orderItems,
            subtotal,
            shippingFee,
            taxes,
            total,
            status: 'pending',
            paymentMethod,
            shippingAddress: user.shippingAddress,
            billingAddress: user.billingAddress,
            tracking: [{ status: 'Order placed', timestamp: new Date(), details: 'Order has been placed by user.' }],
            orderNumber
        });
        req.session.paymentMethod = undefined; // Clear after use
        console.log('Order created:', newOrder);
    } catch (err) {
        console.error('Order creation error:', err);
    }
    // Clear cart
    cart.items = [];
    await cart.save();
    req.flash("success", "Order placed successfully!");
    res.redirect("/confirmation");
});

router.get("/payment", isLoggedIn, async (req, res) => {
    const Cart = require("../models/cartmodel");
    const usermodel = require("../models/usermodel");
    const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
    const user = await usermodel.findById(req.user._id);
    if (!cart || cart.items.length < 1) {
        req.flash("success", "Add something in the cart first.");
        return res.redirect("/shop");
    }

    // Filter out items with null products (products that no longer exist)
    const validItems = cart.items.filter(item => item.product !== null);

    if (validItems.length === 0) {
        // If no valid items remain, clear the cart
        await Cart.findByIdAndDelete(cart._id);
        req.flash("success", "Your cart has been cleared as some products are no longer available.");
        return res.redirect("/shop");
    }

    // Map items to include product details and quantity
    const cartItems = validItems.map(item => ({
        _id: item._id,
        name: item.product.name,
        image: item.product.image,
        price: item.price,
        quantity: item.quantity
    }));
    res.render("payment", { user: { ...user.toObject(), cart: cartItems } });
});

router.post("/payment", isLoggedIn, async (req, res) => {
    req.session.address = req.body.address;
    req.session.paymentMethod = req.body.paymentMethod;
    // Redirect to /checkout with paymentMethod as query param for reliability
    res.redirect(`/checkout?paymentMethod=${encodeURIComponent(req.body.paymentMethod)}`);
});

router.get("/confirmation", isLoggedIn, async (req, res) => {
    const Cart = require("../models/cartmodel");
    const usermodel = require("../models/usermodel");
    const Order = require("../models/ordermodel");
    const user = await usermodel.findById(req.user._id);
    // Get the most recent order for the user
    const order = await Order.findOne({ user: req.user._id }).sort({ createdAt: -1 });
    let orderItems = [], total = 0, orderNumber = '', orderDate = '', paymentMethod = 'N/A';
    if (order) {
        orderItems = order.items;
        total = order.total;
        orderNumber = order.orderNumber;
        orderDate = order.createdAt.toLocaleDateString();
        paymentMethod = order.paymentMethod;
    }
    res.render("confirmation", {
        address: user.shippingAddress,
        billingAddress: user.billingAddress,
        fullName: user.fullName,
        contact: user.contact,
        paymentMethod,
        orderItems,
        total,
        orderNumber,
        orderDate
    });
});

router.get("/invoice", isLoggedIn, async (req, res) => {
    const usermodel = require("../models/usermodel");
    const Order = require("../models/ordermodel");
    const user = await usermodel.findById(req.user._id);
    // Get the most recent order for the user
    const order = await Order.findOne({ user: req.user._id }).sort({ createdAt: -1 });
    if (!order) {
        return res.status(404).send('No order found');
    }
    let subtotal = order.subtotal;
    let shippingFee = order.shippingFee;
    let taxes = order.taxes;
    if (subtotal === undefined) {
        subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }
    if (shippingFee === undefined) {
        shippingFee = 20;
    }
    if (taxes === undefined) {
        taxes = Math.round(subtotal * 0.05);
    }
    res.setHeader('Content-Disposition', 'attachment; filename=invoice.html');
    res.send(`
      <html><head><title>Invoice</title><style>body{font-family:sans-serif;padding:2rem;}table{width:100%;border-collapse:collapse;}th,td{border:1px solid #ccc;padding:8px;}th{background:#f1f5f9;}tfoot td{font-weight:bold;}</style></head><body>
      <h2>Invoice</h2>
      <p><b>Order Number:</b> ${order.orderNumber}<br><b>Order Date:</b> ${order.createdAt.toLocaleDateString()}</p>
      <p><b>Customer:</b> ${user.fullName} &nbsp; ${user.contact}</p>
      <p><b>Delivery Address:</b> ${order.shippingAddress}<br><b>Billing Address:</b> ${order.billingAddress}</p>
      <p><b>Payment Method:</b> ${order.paymentMethod}</p>
      <table><thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr></thead><tbody>
      ${order.items.map(item => `<tr><td>${item.name}</td><td>${item.quantity}</td><td>Rs${item.price}</td><td>Rs${item.price * item.quantity}</td></tr>`).join('')}
      </tbody></table>
      <div style="margin-top:2rem;width:100%;max-width:600px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td><b>Subtotal</b></td><td>Rs${subtotal}</td></tr>
          <tr><td><b>Shipping Fee</b></td><td>Rs${shippingFee}</td></tr>
          <tr><td><b>Taxes (5%)</b></td><td>Rs${taxes}</td></tr>
          <tr><td><b>Total</b></td><td><b>Rs${order.total}</b></td></tr>
        </table>
      </div>
      </body></html>
    `);
});

router.get("/address", isLoggedIn, async (req, res) => {
    const user = await usermodel.findById(req.user._id);
    res.render("address", { user });
});

router.post("/address", isLoggedIn, async (req, res) => {
    await usermodel.findByIdAndUpdate(req.user._id, {
        fullName: req.body.fullName,
        contact: req.body.contact,
        shippingAddress: req.body.shippingAddress,
        billingAddress: req.body.billingAddress
    });
    const redirectTo = req.query.from === 'payment' ? '/payment' : '/payment';
    res.redirect(redirectTo);
});

router.post('/cart/delete/:itemId', isLoggedIn, async (req, res) => {
    const Cart = require('../models/cartmodel');
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
        cart.items = cart.items.filter(item => item._id.toString() !== req.params.itemId);
        await cart.save();
    }
    res.redirect('/checkout');
});

router.get("/orders", isLoggedIn, async (req, res) => {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.render("orders", { orders });
});

router.get("/orders/:id", isLoggedIn, async (req, res) => {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) {
        req.flash("error", "Order not found");
        return res.redirect("/orders");
    }
    res.render("order-detail", { order });
});

// Add search API endpoint for AJAX requests
router.get("/api/products/search", isLoggedIn, async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.json([]);
        }

        const products = await prodectsModel.find({
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } }
            ]
        }).limit(10);

        res.json(products);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Error searching products' });
    }
});

module.exports = router;