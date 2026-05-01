const express = require('express');
const router = express.Router();
const User = require('../models/user');

// Middleware to check if user is authenticated
const isAuthenticated = async (req, res, next) => {
    if (req.session.userId) {
        try {
            const user = await User.findById(req.session.userId);
            if (user) {
                req.user = user;
                return next();
            }
        } catch (err) {}
    }
    res.redirect('/auth/login');
};
// Login page
router.get('/login', (req, res) => {
    res.render('auth/login', { error: null });
});

// Signup page
router.get('/signup', (req, res) => {
    res.render('auth/signup', { error: null });
});

// Handle signup
router.post('/signup', async (req, res) => {
    try {
        const { email, password, name } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.render('auth/signup', { error: 'Email already registered' });
        }

        // Create new user
        const user = new User({ email, password, name });
        await user.save();
        
        // Redirect to login page with success message
        res.render('auth/login', { 
            error: null,
            success: 'Account created successfully! Please login to continue.'
        });
    } catch (error) {
        res.render('auth/signup', { error: 'Error creating account' });
    }
});

// Handle login
router.post('/login', async (req, res) => {
    try {
        console.log('Login attempt:', { email: req.body.email });
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        
        if (!user) {
            console.log('User not found');
            return res.render('auth/login', { error: 'Invalid email or password' });
        }
        
        const isValid = await user.validatePassword(password);
        console.log('Password validation:', { isValid });
        
        if (!isValid) {
            return res.render('auth/login', { error: 'Invalid email or password' });
        }
        
        req.session.userId = user._id;
        req.session.isAdmin = user.isAdmin;
        
        console.log('Session set:', { 
            userId: req.session.userId,
            isAdmin: req.session.isAdmin 
        });
        
        if (user.isAdmin) {
            res.redirect('/admin/dashboard');
        } else {
            res.redirect('/products');
        }
    } catch (error) {
        res.render('auth/login', { error: 'Error logging in' });
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/auth/login');
});

module.exports = { router, isAuthenticated };