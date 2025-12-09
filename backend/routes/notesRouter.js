// create a router for notes with all CRUD operations and export it
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getAllNotes, getNoteById, createNote, updateNote, deleteNote } = require('../controller/notesController');
const uploadRouter = require('./uploadRouter');

// protect all note routes
router.use(auth);

// file upload route mounted at /api/notes/uploads
router.use('/uploads', uploadRouter);

// Get all notes (for authenticated user)
router.get('/', getAllNotes);
// Get a single note by ID
router.get('/:id', getNoteById);
// Create a new note
router.post('/', createNote);
// Update an existing note
router.put('/:id', updateNote);
// Delete a note
router.delete('/:id', deleteNote);
module.exports = router;