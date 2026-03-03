const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Candidate = require('../models/Candidate');

// Register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Validation
        if (password.length < 6) {
            return res.render('login', { 
                error: 'Password must be at least 6 characters',
                layout: false,
                tab: 'register'
            });
        }

        // Check if user exists
        const existing = await User.findOne({ email });
        if (existing) {
            return res.render('login', { 
                error: 'Email already registered',
                layout: false,
                tab: 'register'
            });
        }

        // Hash password
        const hashed = await bcrypt.hash(password, 10);

        // Create user
        const user = await User.create({
            name,
            email,
            password: hashed,
            role
        });

        // Create candidate profile if needed
        if (role === 'candidate') {
            await Candidate.create({
                userId: user._id,
                name,
                skills: [],
                experience: 0,
                personalityScore: 50
            });
        }

        res.render('login', { 
            success: 'Account created! Please sign in.',
            layout: false,
            tab: 'login'
        });

    } catch (error) {
        console.error(error);
        res.render('login', { 
            error: 'Registration failed',
            layout: false,
            tab: 'register'
        });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.render('login', { 
                error: 'Invalid email or password',
                layout: false,
                tab: 'login'
            });
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.render('login', { 
                error: 'Invalid email or password',
                layout: false,
                tab: 'login'
            });
        }

        req.session.user = {
            id: user._id,
            email: user.email,
            role: user.role,
            name: user.name
        };

        res.redirect(user.role === 'hr' ? '/hr/dashboard' : '/candidate/dashboard');

    } catch (error) {
        console.error(error);
        res.render('login', { 
            error: 'Login failed',
            layout: false,
            tab: 'login'
        });
    }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.render('login', { 
                error: 'Email not found',
                layout: false,
                tab: 'forgot'
            });
        }

        // In production, send email here
        console.log(`Password reset for: ${email}`);

        res.render('login', { 
            success: 'Reset link sent to your email!',
            layout: false,
            tab: 'login'
        });

    } catch (error) {
        console.error(error);
        res.render('login', { 
            error: 'Try again',
            layout: false,
            tab: 'forgot'
        });
    }
});

module.exports = router;