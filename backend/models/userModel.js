// create a user schema and model with name ,email,passowrd
const mongoose = require('mongoose');
const { Schema } = mongoose;
const userSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profilePic: { type: String, default: "" },
    profilePicPublicId: { type: String, default: "" },
    username: { type: String, unique: true, sparse: true },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = User;
