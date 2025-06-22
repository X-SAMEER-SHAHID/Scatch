const jwt = require('jsonwebtoken');
const User = require('../models/usermodel');

const isLoggedIn = async (req, res, next) => {
    try {
        console.log('isLoggedIn middleware - checking authentication');
        console.log('Cookies:', req.cookies);

        // Check for token in cookies
        const token = req.cookies.token;
        console.log('Token from cookies:', token ? 'Token exists' : 'No token found');

        if (!token) {
            console.log('No token found in cookies');
            if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
                return res.status(401).json({ success: false, error: 'Not authenticated' });
            }
            req.flash('error', 'Please login to access this page');
            return res.redirect('/auth/login');
        }

        // Verify token
        console.log('Verifying token with JWT_KEY');
        const decoded = jwt.verify(token, process.env.JWT_KEY);
        console.log('Token decoded successfully:', decoded);

        // Find user
        const user = await User.findById(decoded.userId);
        console.log('User found:', user ? 'Yes' : 'No');

        if (!user) {
            console.log('No user found with decoded ID');
            if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
                return res.status(401).json({ success: false, error: 'User not found' });
            }
            req.flash('error', 'User not found');
            return res.redirect('/auth/login');
        }

        // Attach user to request
        console.log('User authenticated successfully:', user.email);
        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
            return res.status(401).json({ success: false, error: 'Authentication failed' });
        }
        req.flash('error', 'Authentication failed');
        res.redirect('/auth/login');
    }
};

module.exports = isLoggedIn;