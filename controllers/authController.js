const bcrypt = require("bcrypt");
const userModel = require("../models/usermodel")
const productsModel = require("../models/Product");
const jwt = require("jsonwebtoken");
const { generateToken } = require("../utils/generateToken")
const { AppError } = require('../utils/errorHandler');

module.exports.registerUser = async (req, res, next) => {
    try {
        const { fullname, email, password } = req.body;
        if (!fullname || !email || !password) {
            req.flash('error', 'All fields are required');
            return res.redirect('/');
        }
        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            req.flash('error', 'Email already in use');
            return res.redirect('/');
        }
        const hashedPassword = await bcrypt.hash(password, 12);
        const user = await userModel.create({
            fullname,
            email,
            password: hashedPassword
        });

        const token = generateToken(user);
        res.cookie('jwt', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        // Get products for the shop page
        const products = await productsModel.find();

        // Set success message and render shop page
        req.flash('success', 'Registration successful! Welcome to Scatch.');
        res.render('shop', {
            products,
            success: 'Registration successful! Welcome to Scatch.',
            user: user
        });
    } catch (err) {
        req.flash('error', err.message);
        res.redirect('/');
    }
}

module.exports.loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            req.flash('error', 'Email and password are required');
            return res.redirect('/');
        }
        const user = await userModel.findOne({ email });
        if (!user) {
            req.flash('error', 'Invalid email or password');
            return res.redirect('/');
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            req.flash('error', 'Invalid email or password');
            return res.redirect('/');
        }
        const token = generateToken(user);
        res.cookie('jwt', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        // Get products for the shop page
        const products = await productsModel.find();

        // Set success message and render shop page
        req.flash('success', 'Login successful! Welcome back.');
        res.render('shop', {
            products,
            success: 'Login successful! Welcome back.',
            user: user
        });
    } catch (err) {
        req.flash('error', err.message);
        res.redirect('/');
    }
}