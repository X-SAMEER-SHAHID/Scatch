const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middlewares/auth');
const userController = require('../controllers/userController');
const User = require('../models/usermodel');

// Import controllers (to be created)
// const { getProfile, updateProfile, deleteProfile } = require('../controllers/userController');

// Profile routes
router.get('/profile', protect, userController.getProfile);
router.post('/profile', protect, userController.updateProfile);
router.post('/profile/password', protect, userController.changePassword);
router.post('/profile/picture', protect, userController.uploadProfilePicture);
router.delete('/profile', protect, userController.deleteAccount);

// Email verification
router.get('/verify-email/:token', userController.verifyEmail);

// Admin only routes
router.get('/', protect, restrictTo('admin'), async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.render('admin/users', { users });
    } catch (error) {
        req.flash('error', 'Error loading users');
        res.redirect('/admin/dashboard');
    }
});

router.get('/:id', protect, restrictTo('admin'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            req.flash('error', 'User not found');
            return res.redirect('/admin/users');
        }
        res.render('admin/user-details', { user });
    } catch (error) {
        req.flash('error', 'Error loading user');
        res.redirect('/admin/users');
    }
});

router.put('/:id', protect, restrictTo('admin'), async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        ).select('-password');

        if (!user) {
            req.flash('error', 'User not found');
            return res.redirect('/admin/users');
        }

        req.flash('success', 'User updated successfully');
        res.redirect('/admin/users');
    } catch (error) {
        req.flash('error', 'Error updating user');
        res.redirect('/admin/users');
    }
});

router.delete('/:id', protect, restrictTo('admin'), async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            req.flash('error', 'User not found');
            return res.redirect('/admin/users');
        }

        req.flash('success', 'User deleted successfully');
        res.redirect('/admin/users');
    } catch (error) {
        req.flash('error', 'Error deleting user');
        res.redirect('/admin/users');
    }
});

module.exports = router; 