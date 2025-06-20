const User = require('../models/User');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Address = require('../models/Address');

// Configure multer for profile picture upload
const storage = multer.diskStorage({
    destination: 'public/uploads/profiles',
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only image files are allowed!'));
    }
}).single('profilePicture');

// Get user profile
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-password')
            .populate('addresses');
        res.render('profile', { user });
    } catch (error) {
        req.flash('error', 'Error loading profile');
        res.redirect('/');
    }
};

// Update user profile
exports.updateProfile = async (req, res) => {
    try {
        const { fullname, email, phone, dob } = req.body;

        // Validate input
        if (!fullname || !email) {
            req.flash('error', 'Name and email are required');
            return res.redirect('/profile');
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            req.flash('error', 'Invalid email format');
            return res.redirect('/profile');
        }

        // Check if email is already taken by another user
        if (email !== req.user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                req.flash('error', 'Email is already taken');
                return res.redirect('/profile');
            }
        }

        // Update user profile
        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                fullname,
                email,
                phone,
                dob,
                emailVerified: email !== req.user.email ? false : req.user.emailVerified
            },
            { new: true }
        ).select('-password');

        // If email changed, send verification email
        if (email !== req.user.email) {
            const verificationToken = crypto.randomBytes(32).toString('hex');
            user.emailVerificationToken = verificationToken;
            user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
            await user.save();

            // TODO: Send verification email
            req.flash('success', 'Please verify your new email address');
        } else {
            req.flash('success', 'Profile updated successfully');
        }

        res.redirect('/profile');
    } catch (error) {
        req.flash('error', 'Error updating profile');
        res.redirect('/profile');
    }
};

// Upload profile picture
exports.uploadProfilePicture = (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            req.flash('error', err.message);
            return res.redirect('/profile');
        }

        try {
            const user = await User.findById(req.user._id);

            // Delete old profile picture if exists
            if (user.profilePicture) {
                const oldPicturePath = path.join(__dirname, '../public', user.profilePicture);
                fs.unlink(oldPicturePath, (err) => {
                    if (err) console.error('Error deleting old profile picture:', err);
                });
            }

            // Update user with new profile picture path
            user.profilePicture = '/uploads/profiles/' + req.file.filename;
            await user.save();

            req.flash('success', 'Profile picture updated successfully');
            res.redirect('/profile');
        } catch (error) {
            req.flash('error', 'Error updating profile picture');
            res.redirect('/profile');
        }
    });
};

// Change password
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;

        // Validate input
        if (!currentPassword || !newPassword || !confirmPassword) {
            req.flash('error', 'All password fields are required');
            return res.redirect('/profile');
        }

        if (newPassword !== confirmPassword) {
            req.flash('error', 'New passwords do not match');
            return res.redirect('/profile');
        }

        // Password strength validation
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            req.flash('error', 'Password must be at least 8 characters long and contain uppercase, lowercase, number and special character');
            return res.redirect('/profile');
        }

        const user = await User.findById(req.user._id);

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            req.flash('error', 'Current password is incorrect');
            return res.redirect('/profile');
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        req.flash('success', 'Password changed successfully');
        res.redirect('/profile');
    } catch (error) {
        req.flash('error', 'Error changing password');
        res.redirect('/profile');
    }
};

// Delete account
exports.deleteAccount = async (req, res) => {
    try {
        const { password } = req.body;

        const user = await User.findById(req.user._id);

        // Verify password before deletion
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            req.flash('error', 'Password is incorrect');
            return res.redirect('/profile');
        }

        // Delete user's profile picture if exists
        if (user.profilePicture) {
            const picturePath = path.join(__dirname, '../public', user.profilePicture);
            fs.unlink(picturePath, (err) => {
                if (err) console.error('Error deleting profile picture:', err);
            });
        }

        // Delete user's addresses
        await Address.deleteMany({ user: req.user._id });

        // Delete user
        await user.remove();

        // Clear session
        req.session.destroy();

        req.flash('success', 'Your account has been deleted');
        res.redirect('/');
    } catch (error) {
        req.flash('error', 'Error deleting account');
        res.redirect('/profile');
    }
};

// Verify email
exports.verifyEmail = async (req, res) => {
    try {
        const user = await User.findOne({
            emailVerificationToken: req.params.token,
            emailVerificationExpires: { $gt: Date.now() }
        });

        if (!user) {
            req.flash('error', 'Invalid or expired verification token');
            return res.redirect('/profile');
        }

        user.emailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();

        req.flash('success', 'Email verified successfully');
        res.redirect('/profile');
    } catch (error) {
        req.flash('error', 'Error verifying email');
        res.redirect('/profile');
    }
}; 