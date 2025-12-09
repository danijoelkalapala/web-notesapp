// Create a separate controller file for notes-related routes
const Note = require('../models/noteModel');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary here as well (ensure env is loaded by server)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Get all notes for authenticated user
exports.getAllNotes = async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });
    const notes = await Note.find({ user: req.userId }).sort({ updatedAt: -1 }).lean();
    res.json(notes);
  } catch (err) {
    console.error('Get all notes error:', err);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
};

// Get a single note by ID (only if it belongs to authenticated user)
exports.getNoteById = async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });
    const note = await Note.findById(req.params.id).lean();
    if (!note) return res.status(404).json({ error: 'Note not found' });
    if (note.user && note.user.toString() !== req.userId) return res.status(403).json({ error: 'Forbidden' });
    res.json(note);
  } catch (err) {
    console.error('Get note by id error:', err);
    res.status(500).json({ error: 'Failed to fetch note' });
  }
};

// Create a new note for authenticated user
exports.createNote = async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });
    const { title = '', content = '', imageUrls = [], videoUrls = [], attachments = [] } = req.body;
    const note = new Note({ user: req.userId, title, content, imageUrls, videoUrls, attachments, updatedAt: new Date() });
    await note.save();
    res.status(201).json(note);
  } catch (err) {
    console.error('Create note error:', err);
    res.status(500).json({ error: 'Failed to create note' });
  }
};

// Update an existing note (only owner)
exports.updateNote = async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });
    const { title = '', content = '', imageUrls = [], videoUrls = [], attachments = [] } = req.body;
    const existing = await Note.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Note not found' });
    if (existing.user && existing.user.toString() !== req.userId) return res.status(403).json({ error: 'Forbidden' });
    existing.title = title;
    existing.content = content;
    existing.imageUrls = imageUrls;
    existing.videoUrls = videoUrls;
    existing.attachments = attachments;
    existing.updatedAt = new Date();
    await existing.save();
    res.json(existing);
  } catch (err) {
    console.error('Update note error:', err);
    res.status(500).json({ error: 'Failed to update note' });
  }
};

// Delete a note (only owner) and remove any Cloudinary assets referenced
exports.deleteNote = async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: 'Note not found' });
    if (note.user && note.user.toString() !== req.userId) return res.status(403).json({ error: 'Forbidden' });

    // Collect public_ids from attachments array (if present)
    const publicIds = [];
    if (Array.isArray(note.attachments)) {
      note.attachments.forEach((a) => {
        if (a && a.public_id) publicIds.push({ public_id: a.public_id, resource_type: a.resource_type || 'auto' });
      });
    }

    // Also parse content for MEDIA tags of the form: [MEDIA:type:url|public_id|resource_type]
    const MEDIA_REGEX = /\[MEDIA:(?:image|audio|video):([^\|\]]+)(?:\|([^\|\]]*))?(?:\|([^\]]*))?\]/g;
    const content = note.content || '';
    let m;
    while ((m = MEDIA_REGEX.exec(content)) !== null) {
      const public_id = m[2] || '';
      const resource_type = m[3] || 'auto';
      if (public_id) publicIds.push({ public_id, resource_type });
    }

    // Deduplicate public_ids
    const unique = [];
    const seen = new Set();
    publicIds.forEach((p) => {
      if (!p.public_id) return;
      if (!seen.has(p.public_id)) {
        seen.add(p.public_id);
        unique.push(p);
      }
    });

    // Attempt to delete each asset from Cloudinary (best-effort)
    for (const p of unique) {
      try {
        await cloudinary.uploader.destroy(p.public_id, { resource_type: p.resource_type || 'auto' });
        console.log('Deleted cloudinary asset', p.public_id);
      } catch (err) {
        console.error('Failed to delete cloudinary asset', p.public_id, err && err.message ? err.message : err);
      }
    }

    await Note.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete note error:', err);
    res.status(500).json({ error: 'Failed to delete note' });
  }
};

