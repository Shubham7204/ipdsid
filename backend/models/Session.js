import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  frames: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Frame'
  }],
  report: {
    category: String,
    keywords: [String],
    urls: [String],
    summary: String
  },
  rawData: [String]
});

export const Session = mongoose.model('Session', sessionSchema); 