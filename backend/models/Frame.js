import mongoose from 'mongoose';

const frameSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  imageUrl: String,
  category: String,
  keywords: [String],
  text: String,
  urls: [String],
  timestamp: {
    type: Date,
    default: Date.now
  },
  confidence: {
    type: Number,
    default: 0.8
  }
});

// Middleware to update learning data when frame is saved
frameSchema.post('save', async function(doc) {
  try {
    const LearningData = mongoose.model('LearningData');
    let learningData = await LearningData.findOne({ userId: doc.userId });
    
    if (!learningData) {
      learningData = new LearningData({ userId: doc.userId });
    }

    // Update categories
    if (doc.category) {
      const categoryData = learningData.categories.get(doc.category) || {
        count: 0,
        lastSeen: new Date(),
        relatedKeywords: []
      };
      categoryData.count += 1;
      categoryData.lastSeen = new Date();
      learningData.categories.set(doc.category, categoryData);
    }

    // Update keywords
    doc.keywords.forEach(keyword => {
      const keywordData = learningData.keywords.get(keyword) || {
        count: 0,
        lastSeen: new Date(),
        category: doc.category,
        importance: 5
      };
      keywordData.count += 1;
      keywordData.lastSeen = new Date();
      learningData.keywords.set(keyword, keywordData);
    });

    // Update URLs
    doc.urls.forEach(url => {
      const urlData = learningData.urls.get(url) || {
        visits: 0,
        lastVisited: new Date(),
        category: doc.category,
        safetyRating: 'safe'
      };
      urlData.visits += 1;
      urlData.lastVisited = new Date();
      learningData.urls.set(url, urlData);
    });

    await learningData.save();
  } catch (error) {
    console.error('Error updating learning data:', error);
  }
});

export const Frame = mongoose.model('Frame', frameSchema); 