const express = require('express');
const router = express.Router();
const multer = require('multer');
const auth = require('../middleware/auth');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary from env. Ensure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET are set.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Use memory storage to avoid writing to disk; we will stream upload to Cloudinary
const upload = multer({ storage: multer.memoryStorage() });

// Protected upload endpoint: accepts form field 'file'
router.post('/', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    // upload buffer to cloudinary via upload_stream
    const streamUpload = (buffer, options = {}) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
          if (error) return reject(error);
          resolve(result);
        });
        stream.end(buffer);
      });
    };

    // Determine resource_type based on mimetype
    const mimetype = req.file.mimetype || '';
    const resource_type = mimetype.startsWith('image/') ? 'image' : mimetype.startsWith('video/') ? 'video' : 'auto';

    const result = await streamUpload(req.file.buffer, { resource_type });

    // Return Cloudinary secure URL and public_id
    res.json({ url: result.secure_url, public_id: result.public_id, resource_type: result.resource_type });
  } catch (err) {
    console.error('Cloudinary upload error:', err);
    res.status(500).json({ error: 'Upload failed', details: err.message });
  }
});

module.exports = router;
