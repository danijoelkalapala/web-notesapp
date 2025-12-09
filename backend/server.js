// Create a server using Express
const express = require('express');
const app = express();
// Load environment variables from this backend folder explicitly
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('./config/mogodb');
const userRouter = require('./routes/userRoute');
const notesRouter = require('./routes/notesRouter');
const cors = require('cors');
const path = require('path');

// Configure CORS to allow frontend origin if provided
// Configure CORS: support a comma-separated list in CLIENT_URL or sensible defaults.
const rawClient = process.env.CLIENT_URL; // e.g. "http://localhost:3000,http://localhost:5173"
const defaultOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
];
const allowedOrigins = rawClient ? rawClient.split(',').map(s => s.trim()) : defaultOrigins;

app.use(cors({
    origin: function(origin, callback) {
        // allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            return callback(null, true);
        }
        return callback(new Error('CORS policy: This origin is not allowed'));
    },
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET','POST','PUT','DELETE','OPTIONS'],
    credentials: true,
}));

// Serve uploaded files from /uploads
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

const PORT = process.env.PORT || 4000;
app.use(express.json());
app.use('/api/users', userRouter);
app.use('/api/notes', notesRouter);
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
