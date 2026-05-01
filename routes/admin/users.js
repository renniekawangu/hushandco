const express = require('express');
const router = express.Router();
const User = require('../../models/user');

// Admin middleware check
const isAdmin = (req, res, next) => {
    if (req.session.isAdmin) {
        next();
    } else {
        res.status(403).redirect('/products');
    }
};

// List all users
router.get('/', isAdmin, async (req, res) => {
    try {
        const { search = '', role = '' } = req.query;
        
        // Build query
        let query = {};
        if (search) {
            query.$or = [
                { email: new RegExp(search, 'i') },
                { name: new RegExp(search, 'i') }
            ];
        }
        if (role === 'admin') {
            query.isAdmin = true;
        } else if (role === 'user') {
            query.isAdmin = false;
        }

        const users = await User.find(query).sort({ createdAt: -1 });
        res.render('admin/users/index', { 
            users,
            search,
            role,
            messages: {
                success: req.session.success,
                error: req.session.error
            }
        });
        // Clear flash messages
        req.session.success = null;
        req.session.error = null;
    } catch (error) {
        console.error('Error fetching users:', error);
        req.session.error = 'Error fetching users';
        res.redirect('/admin/dashboard');
    }
});

// View user details
router.get('/:id', isAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            req.session.error = 'User not found';
            return res.redirect('/admin/users');
        }
        res.render('admin/users/view', { user });
    } catch (error) {
        console.error('Error fetching user:', error);
        req.session.error = 'Error fetching user details';
        res.redirect('/admin/users');
    }
});

// Update user role (make/remove admin)
router.post('/:id/role', isAdmin, async (req, res) => {
    try {
        const { action } = req.body;
        const user = await User.findById(req.params.id);
        
        if (!user) {
            req.session.error = 'User not found';
            return res.redirect('/admin/users');
        }

        // Prevent self-demotion
        if (user.email === req.user.email) {
            req.session.error = 'Cannot change your own admin status';
            return res.redirect('/admin/users');
        }

        user.isAdmin = action === 'make-admin';
        await user.save();
        
        req.session.success = `Successfully ${action === 'make-admin' ? 'made user admin' : 'removed admin rights'}`;
        res.redirect('/admin/users');
    } catch (error) {
        console.error('Error updating user role:', error);
        req.session.error = 'Error updating user role';
        res.redirect('/admin/users');
    }
});

// Delete user
router.post('/:id/delete', isAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        
        if (!user) {
            req.session.error = 'User not found';
            return res.redirect('/admin/users');
        }

        // Prevent self-deletion
        if (user.email === req.user.email) {
            req.session.error = 'Cannot delete your own account';
            return res.redirect('/admin/users');
        }

        await User.findByIdAndDelete(req.params.id);
        req.session.success = 'User deleted successfully';
        res.redirect('/admin/users');
    } catch (error) {
        console.error('Error deleting user:', error);
        req.session.error = 'Error deleting user';
        res.redirect('/admin/users');
    }
});

module.exports = router;