const User = require('../models/usermodel');

const isAdmin = async (req, res, next) => {
    try {
        console.log('isAdmin middleware - checking admin status');
        console.log('User object exists:', !!req.user);

        // Check if user is logged in
        if (!req.user) {
            console.log('isAdmin middleware: user not logged in');
            if (req.xhr || req.path.endsWith('/data')) {
                return res.status(401).json({ error: 'Not authenticated' });
            }
            return res.redirect('/auth/login');
        }

        // Check if user is an admin
        console.log('Checking admin status for user:', req.user.email);
        const user = await User.findById(req.user._id);
        console.log('User found in DB:', !!user);
        console.log('Is admin?', user?.isAdmin);

        if (!user || !user.isAdmin) {
            console.log('isAdmin middleware: user is not admin');
            if (req.xhr || req.path.endsWith('/data')) {
                return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
            }
            return res.redirect('/');
        }

        // Update last activity
        user.lastActivity = new Date();
        await user.save();

        console.log('isAdmin middleware: user is admin');
        next();
    } catch (error) {
        console.error('Admin middleware error:', error);
        if (req.xhr || req.path.endsWith('/data')) {
            return res.status(500).json({ error: 'Internal server error' });
        }
        res.status(500).send('Internal server error');
    }
};

module.exports = isAdmin; 