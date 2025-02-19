import mongoose from 'mongoose';

const learningDataSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
  },
  keywords: [{
    type: String,
    required: true,
  }],
  urls: [{
    type: String,
    required: true,
  }],
  frequency: {
    type: Number,
    default: 1,
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 1,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  }
});

const LearningData = mongoose.model('LearningData', learningDataSchema);
export default LearningData; 