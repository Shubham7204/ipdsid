import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import LearningData from '../models/LearningData.js';
import mongoose from 'mongoose';

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
    // Get base learning data
    let learningData = await LearningData.findOne({ userId: req.user._id });
    
    if (!learningData) {
      learningData = new LearningData({ 
        userId: req.user._id,
        categories: new Map(),
        keywords: new Map(),
        urls: new Map()
      });
      await learningData.save();
    }
    
    // Get all sessions for this user
    const Session = mongoose.model('Session');
    const sessions = await Session.find({ userId: req.user._id });
    
    // Create combined data structure
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
    
    // Add data from sessions if not already included
    sessions.forEach(session => {
      if (session.report) {
        // Add category if not exists
        const existingCategory = combinedData.categories.find(c => c.name === session.report.category);
        if (!existingCategory && session.report.category) {
          combinedData.categories.push({
            name: session.report.category,
            count: 1,
            lastSeen: session.endTime || session.startTime,
            relatedKeywords: session.report.keywords || []
          });
        }
        
        // Add keywords if not exists
        if (session.report.keywords) {
          session.report.keywords.forEach(keyword => {
            const existingKeyword = combinedData.keywords.find(k => k.keyword === keyword);
            if (!existingKeyword) {
              combinedData.keywords.push({
                keyword,
                count: 1,
                category: session.report.category,
                importance: 5,
                lastSeen: session.endTime || session.startTime
              });
            }
          });
        }
        
        // Add URLs if not exists
        if (session.report.urls) {
          session.report.urls.forEach(url => {
            const existingUrl = combinedData.urls.find(u => u.url === url);
            if (!existingUrl) {
              combinedData.urls.push({
                url,
                visits: 1,
                category: session.report.category,
                safetyRating: 'safe',
                lastVisited: session.endTime || session.startTime
              });
            }
          });
        }
      }
    });
    
    // Update final stats
    combinedData.stats.totalCategories = combinedData.categories.length;
    combinedData.stats.totalKeywords = combinedData.keywords.length;
    combinedData.stats.totalUrls = combinedData.urls.length;
    
    res.json(combinedData);
  } catch (error) {
    console.error('Error fetching combined learning data:', error);
    res.status(500).json({ error: 'Failed to fetch combined learning data' });
  }
});

export default router; 