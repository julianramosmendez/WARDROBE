const mongoose = require('mongoose');

const ClothingItemSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  category: { type: String, required: true, enum: ['Tops', 'Bottoms', 'Shoes', 'Accessories'] },
  description: { type: String },
  imageUrl: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ClothingItem', ClothingItemSchema); 