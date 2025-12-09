// Create a router for user-related routes
const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const { register, login } = require('../controller/userController');

// User registration route
router.post('/register', register);
// User login route
router.post('/login', login);
module.exports = router;