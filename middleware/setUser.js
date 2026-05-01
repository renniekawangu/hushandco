const User = require('../models/user');

const setUser = async (req, res, next) => {
    if (req.session && req.session.userId) {
        try {
            const user = await User.findById(req.session.userId);
            if (user) {
                req.user = user;
                res.locals.user = user;
            }
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
};

// Admin middleware
const requireAdmin = (req, res, next) => {
    if (!req.session || !req.session.userId) {
        req.flash('error', 'Please login to continue');
        return res.redirect('/login');
    }
    
    // Check if user is admin
    if (!req.user || !req.user.isAdmin) {
        req.flash('error', 'Access denied. Admin privileges required.');
        return res.redirect('/');
    }
    
    next();
};

module.exports = { setUser, requireAdmin };