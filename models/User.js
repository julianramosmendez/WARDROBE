const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: false, unique: true, sparse: true },
  password: { type: String }, // hashed password
  googleId: { type: String, unique: true, sparse: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema); 