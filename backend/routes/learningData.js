import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import LearningData from '../models/LearningData.js';

const router = express.Router();

// Get learning data for the authenticated user
router.get('/learning-data', authenticateToken, async (req, res) => {
  try {
    let learningData = await LearningData.findOne({ userId: req.user._id });
    
    if (!learningData) {
      learningData = new LearningData({
        userId: req.user._id,
        categories: new Map(),
        keywords: new Map(),
        urls: new Map(),
        learningPatterns: new Map()
      });
      await learningData.save();
    }
    
    // Transform the data for the frontend
    const transformedData = {
      categories: Array.from(learningData.categories.entries()).map(([category, data]) => ({
        category,
        count: data.count,
        lastSeen: data.lastSeen,
        relatedKeywords: data.relatedKeywords
      })),
      keywords: Array.from(learningData.keywords.entries()).map(([keyword, data]) => ({
        keyword,
        count: data.count,
        category: data.category,
        importance: data.importance,
        lastSeen: data.lastSeen
      })),
      urls: Array.from(learningData.urls.entries()).map(([url, data]) => ({
        url,
        visits: data.visits,
        category: data.category,
        safetyRating: data.safetyRating,
        lastVisited: data.lastVisited
      })),
      stats: {
        totalCategories: learningData.categories.size,
        totalKeywords: learningData.keywords.size,
        totalUrls: learningData.urls.size,
        lastUpdated: learningData.lastUpdated
      }
    };
    
    res.json(transformedData);
  } catch (error) {
    console.error('Error fetching learning data:', error);
    res.status(500).json({ error: 'Failed to fetch learning data' });
  }
});

// Update learning data
router.post('/learning-data/update', authenticateToken, async (req, res) => {
  try {
    let learningData = await LearningData.findOne({ userId: req.user._id });
    
    if (!learningData) {
      learningData = new LearningData({
        userId: req.user._id,
        categories: new Map(),
        keywords: new Map(),
        urls: new Map()
      });
    }

    // Update categories
    const category = req.body.category;
    if (category) {
      const existingCategory = learningData.categories.get(category) || {
        count: 0,
        relatedKeywords: []
      };

      learningData.categories.set(category, {
        count: existingCategory.count + 1,
        lastSeen: new Date(),
        relatedKeywords: [...new Set([...existingCategory.relatedKeywords, ...req.body.keywords])]
      });
    }

    // Update keywords
    req.body.keywords.forEach(keyword => {
      const existingKeyword = learningData.keywords.get(keyword) || {
        count: 0,
        category: req.body.category,
        importance: 5
      };

      learningData.keywords.set(keyword, {
        count: existingKeyword.count + 1,
        lastSeen: new Date(),
        category: req.body.category,
        importance: existingKeyword.importance
      });
    });

    // Update URLs
    if (req.body.urls) {
      req.body.urls.forEach(url => {
        const existingUrl = learningData.urls.get(url) || {
          visits: 0,
          category: req.body.category,
          safetyRating: 'Safe'
        };

        learningData.urls.set(url, {
          visits: existingUrl.visits + 1,
          lastVisited: new Date(),
          category: req.body.category,
          safetyRating: existingUrl.safetyRating
        });
      });
    }

    learningData.lastUpdated = new Date();
    await learningData.save();

    res.json(learningData);
  } catch (error) {
    console.error('Error updating learning data:', error);
    res.status(500).json({ error: 'Failed to update learning data' });
  }
});

// Get combined knowledge view
router.get('/learning-data/combined', authenticateToken, async (req, res) => {
  try {
    const learningData = await LearningData.findOne({ userId: req.user._id });
    
    if (!learningData) {
      return res.json({
        categories: [],
        keywords: [],
        urls: [],
        stats: {
          totalCategories: 0,
          totalKeywords: 0,
          totalUrls: 0,
          lastUpdated: null
        }
      });
    }

    const combinedData = {
      categories: Array.from(learningData.categories.entries()).map(([name, data]) => ({
        name,
        count: data.count,
        lastSeen: data.lastSeen,
        relatedKeywords: data.relatedKeywords
      })),
      keywords: Array.from(learningData.keywords.entries()).map(([keyword, data]) => ({
        keyword,
        count: data.count,
        category: data.category,
        importance: data.importance,
        lastSeen: data.lastSeen
      })),
      urls: Array.from(learningData.urls.entries()).map(([url, data]) => ({
        url,
        visits: data.visits,
        category: data.category,
        safetyRating: data.safetyRating,
        lastVisited: data.lastVisited
      })),
      stats: {
        totalCategories: learningData.categories.size,
        totalKeywords: learningData.keywords.size,
        totalUrls: learningData.urls.size,
        lastUpdated: learningData.lastUpdated
      }
    };

    res.json(combinedData);
  } catch (error) {
    console.error('Error fetching combined learning data:', error);
    res.status(500).json({ error: 'Failed to fetch combined learning data' });
  }
});

export default router; 