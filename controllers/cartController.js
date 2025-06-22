const Cart = require('../models/cartmodel');
const Product = require('../models/productmodel');

exports.addToCart = async (req, res) => {
    console.log('addToCart called', req.user, req.body);
    try {
        const { productId, quantity } = req.body;
        const userId = req.user._id;
        const qty = parseInt(quantity) || 1;

        // Get product details
        const product = await Product.findById(productId);
        if (!product) {
            if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                return res.json({ success: false, error: 'Product not found' });
            }
            req.flash('error', 'Product not found');
            return res.redirect(req.get('Referrer') || '/');
        }

        // Find or create cart
        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            cart = new Cart({ user: userId, items: [] });
        }

        // Check if product already in cart
        const existingItem = cart.items.find(item => item.product.toString() === productId);
        if (existingItem) {
            existingItem.quantity += qty;
        } else {
            cart.items.push({
                product: productId,
                quantity: qty,
                price: product.price
            });
        }

        await cart.save();
        const cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.json({ success: true, cartCount });
        }
        req.flash('success', 'Product added to cart');
        res.redirect(req.get('Referrer') || '/');
    } catch (error) {
        console.error('Add to cart error:', error);
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.json({ success: false, error: 'Failed to add product to cart' });
        }
        req.flash('error', 'Failed to add product to cart');
        res.redirect(req.get('Referrer') || '/');
    }
};

exports.updateQuantity = async (req, res) => {
    try {
        const { quantity } = req.body;
        const { itemId } = req.params;
        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            return res.status(404).json({ success: false, error: 'Cart not found' });
        }
        const item = cart.items.id(itemId);
        if (!item) {
            return res.status(404).json({ success: false, error: 'Item not found in cart' });
        }
        item.quantity = parseInt(quantity);
        await cart.save();
        return res.json({ success: true, quantity: item.quantity, total: cart.total });
    } catch (error) {
        console.error('Update quantity error:', error);
        res.status(500).json({ success: false, error: 'Failed to update quantity' });
    }
};
