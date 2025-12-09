// create a controller file for user model to handle user registration and login
const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';


// User Registration
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const existingUser = await User.findOne({ email
    });;
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ name, email, password: hashedPassword });
        await user.save();
        // Issue a JWT so the user is logged in immediately
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });
        res.status(201).json({ token, user: { _id: user._id, name: user.name, email: user.email } });
    }
    catch (err) {
        res.status(500).json({ error: 'Registration failed' });
    }
};


// User Login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User
            .findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });
        // Return token and basic user info
        res.json({ token, user: { _id: user._id, name: user.name, email: user.email } });
    }
    catch (err) {
        res.status(500).json({ error: 'Login failed' });
    }
};
