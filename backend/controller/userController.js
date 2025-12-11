// create a controller file for user model to handle user registration and login
const User = require('../models/userModel');
const Note = require('../models/notesModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';


// User Registration
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const existingUser = await User.findOne({
            email
        });;
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ name, email, password: hashedPassword });
        await user.save();
        // Issue a JWT so the user is logged in immediately
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });
        res.status(201).json({ token, user: { _id: user._id, name: user.name, email: user.email, profilePic: user.profilePic, profilePicPublicId: user.profilePicPublicId } });
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
        res.json({ token, user: { _id: user._id, name: user.name, email: user.email, profilePic: user.profilePic, profilePicPublicId: user.profilePicPublicId } });
    }
    catch (err) {
        res.status(500).json({ error: 'Login failed' });
    }
};

// Get User Profile
exports.getProfile = async (req, res) => {
    try {
        if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });
        const user = await User.findById(req.userId).select('-password'); // Exclude password
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const noteCount = await Note.countDocuments({ user: req.userId });
        res.json({ ...user.toObject(), noteCount });
    } catch (err) {
        console.error('Get profile error:', err);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
};

// Update Password
exports.updatePassword = async (req, res) => {
    try {
        if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Incorrect current password' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        console.error('Update password error:', err);
        res.status(500).json({ error: 'Failed to update password' });
    }
};

// Update Profile (Name, Profile Pic)
exports.updateProfile = async (req, res) => {
    try {
        if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });
        const { name, profilePic, profilePicPublicId } = req.body;

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (name) user.name = name;
        if (profilePic !== undefined) user.profilePic = profilePic;
        if (profilePicPublicId !== undefined) user.profilePicPublicId = profilePicPublicId;

        await user.save();

        // Return updated user info
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            profilePic: user.profilePic,
            profilePicPublicId: user.profilePicPublicId
        });
    } catch (err) {
        console.error('Update profile error:', err);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};

exports.deleteProfilePic = async (req, res) => {
    try {
        if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.profilePicPublicId) {
            await cloudinary.uploader.destroy(user.profilePicPublicId);
        }

        user.profilePic = "";
        user.profilePicPublicId = "";
        await user.save();

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            profilePic: user.profilePic,
            profilePicPublicId: user.profilePicPublicId
        });
    } catch (err) {
        console.error('Delete profile pic error:', err);
        res.status(500).json({ error: 'Failed to delete profile picture' });
    }
};
