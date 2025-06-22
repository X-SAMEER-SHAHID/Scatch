const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/usermodel');
const bcryptjs = require('bcryptjs');
const Owner = require('../models/ownersmodel');
const { registerUser, loginUser, forgotPassword, resetPassword } = require('../controllers/authController');

// Debug middleware
router.use((req, res, next) => {
    console.log('Auth Route Request:', {
        method: req.method,
        path: req.path,
        originalUrl: req.originalUrl,
        body: req.body,
        headers: req.headers
    });
    next();
});

// Test route to directly create a user
router.post('/test-register', async (req, res) => {
    try {
        console.log('Test register called with:', req.body);
        const { fullName, email, password } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Create new user
        const user = new User({
            fullName,
            email,
            password,
            isAdmin: false
        });

        await user.save();
        console.log('User created successfully:', user._id);

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            userId: user._id
        });
    } catch (error) {
        console.error('Test register error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Default landing page
router.get('/', (req, res) => {
    res.render('index', { messages: req.flash() });
});

// Login route
router.get('/login', (req, res) => {
    res.render('login', { messages: req.flash() });
});

router.post('/login', loginUser);

// Logout route
router.get('/logout', (req, res) => {
    res.clearCookie('token');
    req.flash('success', 'Logged out successfully');
    res.redirect('/auth/login');
});

// Register route
router.get('/register', (req, res) => {
    console.log('Rendering register page');
    res.render('register', { messages: req.flash() });
});

router.post('/register', (req, res, next) => {
    console.log('Register POST request received:', req.body);
    registerUser(req, res, next);
});

// Forgot Password Route
router.get('/forgot-password', (req, res) => {
    res.render('forgot-password', { messages: req.flash() });
});

router.post('/forgot-password', forgotPassword);

// Reset Password Route
router.get('/reset-password/:token', async (req, res) => {
    try {
        const user = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            req.flash('error', 'Password reset token is invalid or has expired.');
            return res.redirect('/auth/forgot-password');
        }

        res.render('reset-password', { token: req.params.token, messages: req.flash() });
    } catch (error) {
        req.flash('error', 'Error accessing reset password page.');
        res.redirect('/auth/forgot-password');
    }
});

router.post('/reset-password/:token', resetPassword);

module.exports = router; 