const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Candidate = require('../models/Candidate');
const { sendEmail } = require('../services/emailService');

// Register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const role = "candidate";

        if (!name || !email || !password) {
            return res.render('login', {
                error: 'All fields are required',
                layout: false,
                tab: 'register'
            });
        }

        if (password.length < 6) {
            return res.render('login', {
                error: 'Password must be at least 6 characters',
                layout: false,
                tab: 'register'
            });
        }

        const existing = await User.findOne({ email });
        if (existing) {
            return res.render('login', {
                error: 'Email already registered',
                layout: false,
                tab: 'register'
            });
        }

        const hashed = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashed,
            role
        });

        await Candidate.create({
            userId: user._id,
            name: name,
            skills: [],
            experience: 0,
            personalityScore: 50
        });

        res.render('login', {
            success: 'Account created! Please sign in.',
            layout: false,
            tab: 'login'
        });

    } catch (error) {
        console.error("REGISTER ERROR:", error);
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

        const resetLink = `http://localhost:5000/reset-password?email=${email}`;

        const html = `
        <h2>Password Reset</h2>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}">${resetLink}</a>
        `;

        await sendEmail(email, "Password Reset - AI Fit Index", html);

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

router.post('/reset-password', async (req, res) => {
    try {

        const { email, password } = req.body;

        const bcrypt = require('bcryptjs');

        const hashed = await bcrypt.hash(password, 10);

        await User.updateOne(
            { email: email },
            { password: hashed }
        );

        res.render('login', {
            success: 'Password updated successfully',
            layout: false,
            tab: 'login'
        });

    } catch (error) {

        console.error(error);

        res.send("Password reset failed");

    }
});

router.get('/reset-password', (req, res) => {

    const email = req.query.email;

    res.render('reset-password', {
        layout: false,
        email
    });

});

router.post('/reset-password', async (req, res) => {

    try {

        const { email, password } = req.body;

        const user = await User.findOne({ email });

        const isSame = await bcrypt.compare(password, user.password);

        if (isSame) {
            return res.render('reset-password', {
                layout:false,
                email,
                error: "New password cannot be same as old password"
            });
        }

        const hashed = await bcrypt.hash(password, 10);

        await User.updateOne(
            { email },
            { password: hashed }
        );

        res.render('login', {
            layout:false,
            success: "Password updated successfully"
        });

    } catch (error) {

        console.error(error);
        res.send("Password reset failed");

    }
});


module.exports = router;