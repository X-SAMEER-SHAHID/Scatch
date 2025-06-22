const bcrypt = require("bcryptjs");
const userModel = require("../models/usermodel")
const prodectsModel = require("../models/productmodel");
const jwt = require("jsonwebtoken");
const { generateToken } = require("../utils/generateToken")
const crypto = require('crypto');
const nodemailer = require('nodemailer');


module.exports.registerUser = async (req, res) => {
    try {
        const { fullName, email, password } = req.body;

        // Check if user exists
        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            if (req.headers['content-type'] === 'application/json') {
                return res.status(400).json({ error: 'Email already registered' });
            } else {
                req.flash('error', 'Email already registered');
                return res.redirect('/auth/register');
            }
        }

        // Create new user (password will be hashed by the model's pre-save middleware)
        const user = new userModel({
            fullName,
            email,
            password,
            isAdmin: false
        });

        await user.save();

        // Log activity
        await user.logActivity('REGISTER', 'New user registration');

        if (req.headers['content-type'] === 'application/json') {
            return res.status(201).json({
                success: true,
                message: 'Registration successful! Please login.',
                user: {
                    id: user._id,
                    fullName: user.fullName,
                    email: user.email
                }
            });
        } else {
            req.flash('success', 'Registration successful! You can now log in.');
            res.redirect('/');
        }
    } catch (error) {
        console.error('Registration error:', error);
        if (req.headers['content-type'] === 'application/json') {
            return res.status(500).json({ error: 'Error during registration. Please try again.' });
        } else {
            req.flash('error', 'Error during registration. Please try again.');
            res.redirect('/auth/register');
        }
    }
};

module.exports.loginUser = async function (req, res) {
    try {
        const { email, password } = req.body;
        console.log('Login form data:', req.body);

        const user = await userModel.findOne({ email });
        if (!user) {
            req.flash("error", "User does not exist, please register first.");
            return res.redirect("/auth/login");
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            req.flash("error", "Incorrect Email or Password.");
            return res.redirect("/auth/login");
        }

        // Generate token and set cookie
        const token = generateToken(user);
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        // Update last activity
        user.lastActivity = new Date();
        await user.save();

        // Redirect based on user type
        if (user.isAdmin) {
            return res.redirect("/owner/admin/dashboard");
        } else {
            const products = await prodectsModel.find();
            return res.render("shop", { products, success: "" });
        }
    } catch (error) {
        console.error('Login error:', error);
        req.flash("error", "An error occurred during login.");
        return res.redirect("/auth/login");
    }
};

// Forgot Password - Email Link Generation
module.exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await userModel.findOne({ email });

        if (!user) {
            req.flash("error", "No account with that email address exists.");
            return res.redirect("/forgot-password");
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // Token expires in 1 hour
        await user.save();

        // Create email transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Email content
        const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Password Reset Request',
            html: `
                <p>You requested a password reset</p>
                <p>Click this <a href="${resetUrl}">link</a> to reset your password.</p>
                <p>This link will expire in 1 hour.</p>
                <p>If you didn't request this, please ignore this email.</p>
            `
        };

        await transporter.sendMail(mailOptions);
        req.flash("success", "Password reset link has been sent to your email.");
        res.redirect("/login");
    } catch (err) {
        req.flash("error", "Error sending password reset email.");
        res.redirect("/forgot-password");
    }
};

// Reset Password with Token
module.exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const user = await userModel.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            req.flash("error", "Password reset token is invalid or has expired.");
            return res.redirect("/forgot-password");
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        req.flash("success", "Your password has been updated.");
        res.redirect("/login");
    } catch (err) {
        req.flash("error", "Error resetting password.");
        res.redirect("/forgot-password");
    }
};

// Security Questions Password Reset
module.exports.securityQuestionsReset = async (req, res) => {
    try {
        const { email, answers } = req.body;
        const user = await userModel.findOne({ email });

        if (!user) {
            req.flash("error", "No account with that email address exists.");
            return res.redirect("/security-questions");
        }

        // Verify security question answers
        const isCorrect = user.securityQuestions.every((q, index) =>
            q.answer.toLowerCase() === answers[index].toLowerCase()
        );

        if (!isCorrect) {
            req.flash("error", "Incorrect answers to security questions.");
            return res.redirect("/security-questions");
        }

        // Generate temporary password
        const tempPassword = crypto.randomBytes(4).toString('hex');
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(tempPassword, salt);
        await user.save();

        // Send temporary password via email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Your Temporary Password',
            html: `
                <p>Your temporary password is: ${tempPassword}</p>
                <p>Please login with this temporary password and change it immediately.</p>
            `
        };

        await transporter.sendMail(mailOptions);
        req.flash("success", "A temporary password has been sent to your email.");
        res.redirect("/login");
    } catch (err) {
        req.flash("error", "Error processing security questions reset.");
        res.redirect("/security-questions");
    }
};