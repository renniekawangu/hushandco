const express = require('express');
const router = express.Router();
const User = require('../models/user');
const { isAuthenticated } = require('./auth');

// Get user profile page
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        res.render('profile/profile', { user });
    } catch (error) {
        res.status(500).send('Error fetching profile');
    }
});

// Get settings page
router.get('/settings', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        res.render('profile/settings', { user });
    } catch (error) {
        res.status(500).send('Error fetching settings');
    }
});

// Update profile
router.post('/update', isAuthenticated, async (req, res) => {
    try {
        const { name, email, phone } = req.body;
        await User.findByIdAndUpdate(req.user._id, {
            name,
            email,
            phone
        });
        res.redirect('/profile');
    } catch (error) {
        res.status(500).send('Error updating profile');
    }
});

// Update password
router.post('/settings/password', isAuthenticated, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id);
        
        // Verify current password
        const isMatch = await user.validatePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).send('Current password is incorrect');
        }

        // Update password
        user.password = newPassword;
        await user.save();
        
        res.redirect('/profile/settings');
    } catch (error) {
        res.status(500).send('Error updating password');
    }
});

module.exports = router;