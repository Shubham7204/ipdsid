import mongoose from 'mongoose';

const frameSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  imageUrl: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  category: String,
  keywords: [String],
  text: String
});

export const Frame = mongoose.model('Frame', frameSchema); 