const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { authLimiter } = require('../middlewares/rateLimiter');
const { registerUser, loginUser } = require('../controllers/authController');

// Import controllers (to be created)
// const { register, login, logout, forgotPassword, resetPassword } = require('../controllers/authController');

// Auth routes
router.post('/register', express.json(), registerUser);
router.post('/login', express.json(), loginUser);

router.post('/logout', protect, (req, res) => {
    res.clearCookie('jwt');
    res.redirect('/');
});

router.post('/forgot-password', authLimiter, (req, res) => {
    res.status(501).json({ message: 'Not implemented yet' });
});

router.post('/reset-password/:token', authLimiter, (req, res) => {
    res.status(501).json({ message: 'Not implemented yet' });
});

// Frontend routes
router.get('/register', (req, res) => {
    res.render('index', {
        title: 'Register',
        error: req.flash('error'),
        loggedin: false
    });
});

router.get('/login', (req, res) => {
    res.render('index', {
        title: 'Login',
        error: req.flash('error'),
        loggedin: false
    });
});

module.exports = router; 