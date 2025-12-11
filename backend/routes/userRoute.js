
// Create a router for user-related routes
const express = require('express');
const router = express.Router();
const User = require('../models/userModel');

const {
    register,
    login,
    getProfile,
    updatePassword,
    updateProfile,
    deleteProfilePic
} = require('../controller/userController');
const auth = require('../middleware/auth');


// User registration route
router.post('/register', register);
// User login route
router.post('/login', login);

// Get User Profile (Protected)
router.get('/profile', auth, getProfile);

// Update Profile Info (Protected)
router.put('/profile', auth, updateProfile);

// Update Password (Protected)
router.put('/profile/password', auth, updatePassword);

// Delete Profile Picture (Protected)
router.delete('/profile/picture', auth, deleteProfilePic);

module.exports = router;
