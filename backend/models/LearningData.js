import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  count: Number,
  lastSeen: Date,
  relatedKeywords: [String]
}, { _id: false });

const keywordSchema = new mongoose.Schema({
  count: Number,
  lastSeen: Date,
  category: String,
  importance: Number
}, { _id: false });

const urlSchema = new mongoose.Schema({
  visits: Number,
  lastVisited: Date,
  category: String,
  safetyRating: String
}, { _id: false });

const learningDataSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  categories: {
    type: Map,
    of: categorySchema
  },
  keywords: {
    type: Map,
    of: keywordSchema
  },
  urls: {
    type: Map,
    of: urlSchema
  },
  learningPatterns: {
    type: Map,
    of: {
      frequency: Number,
      timeSpent: Number,
      lastActivity: Date
    },
    default: new Map()
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Add method to analyze learning patterns
learningDataSchema.methods.analyzeLearningTrends = function() {
  const categories = Array.from(this.categories.entries());
  const keywords = Array.from(this.keywords.entries());
  const urls = Array.from(this.urls.entries());

  return {
    mostFrequentCategories: categories
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5),
    topKeywords: keywords
      .sort((a, b) => b[1].importance * b[1].count - a[1].importance * a[1].count)
      .slice(0, 10),
    safeUrls: urls
      .filter(([_, data]) => data.safetyRating === 'safe')
      .sort((a, b) => b[1].visits - a[1].visits)
  };
};

const LearningData = mongoose.model('LearningData', learningDataSchema);
export default LearningData; 