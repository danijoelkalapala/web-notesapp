// create user schema and model with title ,content ,image,video ,audio attachments and timestamps
const mongoose = require('mongoose');
const { Schema } = mongoose; 
const noteSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    imageUrls: { type: [String], default: [] },
    videoUrls: { type: [String], default: [] },
    attachments: {
        type: [
            {
                url: { type: String },
                public_id: { type: String },
                resource_type: { type: String },
            },
        ],
        default: [],
    },
}, { timestamps: true });

const Note = mongoose.model('Note', noteSchema);

module.exports = Note;