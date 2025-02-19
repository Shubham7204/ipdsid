import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import User from './models/User.js';
import Analysis from './models/Analysis.js';
import LearningData from './models/LearningData.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const MONGODB_URI = 'mongodb://127.0.0.1:27017/sid2';

const connectWithRetry = async () => {
  const options = {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    useNewUrlParser: true,
    useUnifiedTopology: true
  };

  try {
    await mongoose.connect(MONGODB_URI, options);
    console.log('Connected to MongoDB successfully');
    console.log('Database Name:', mongoose.connection.db.databaseName);
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
  } catch (err) {
    console.error('MongoDB connection error:', err);
    console.log('Retrying in 5 seconds...');
    setTimeout(connectWithRetry, 5000);
  }
};

connectWithRetry();

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected. Attempting to reconnect...');
  connectWithRetry();
});

// Authentication middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) throw new Error('No token provided');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) throw new Error('User not found');

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: error.message || 'Please authenticate' });
  }
};

// Auth routes
app.post('/api/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const user = new User({ email, password });
    await user.save();
    
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.status(201).json({ user: { email: user.email }, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ error: 'Invalid login credentials' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.json({ user: { email: user.email }, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Analysis routes
app.post('/api/analysis', auth, async (req, res) => {
  try {
    const { category, keywords, urls } = req.body;
    if (!category) {
      return res.status(400).json({ error: 'Category is required' });
    }

    const analysis = new Analysis({
      userId: req.user._id,
      category,
      keywords: keywords || [],
      urls: urls || [],
    });

    await analysis.save();
    res.status(201).json(analysis);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/analysis', auth, async (req, res) => {
  try {
    const analyses = await Analysis.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(analyses);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Endpoint to update learning data
app.post('/api/learning-data', auth, async (req, res) => {
  try {
    const { category, keywords, urls, confidence } = req.body;
    
    console.log('Received learning data:', { category, keywords, urls, confidence });

    if (!category || !Array.isArray(keywords) || !Array.isArray(urls)) {
      return res.status(400).json({ 
        error: 'Invalid data format. Required: category (string), keywords (array), urls (array)' 
      });
    }

    // Check if category already exists
    let learningData = await LearningData.findOne({ category });
    console.log('Existing learning data:', learningData);

    if (learningData) {
      // Update existing category data
      const uniqueKeywords = [...new Set([...learningData.keywords, ...keywords])];
      const uniqueUrls = [...new Set([...learningData.urls, ...urls])];

      learningData.keywords = uniqueKeywords;
      learningData.urls = uniqueUrls;
      learningData.frequency += 1;
      learningData.confidence = (learningData.confidence + confidence) / 2;
      learningData.lastUpdated = Date.now();

      const updated = await learningData.save();
      console.log('Updated learning data:', updated);
    } else {
      // Create new category data
      learningData = new LearningData({
        category,
        keywords,
        urls,
        confidence,
      });
      const saved = await learningData.save();
      console.log('New learning data saved:', saved);
    }

    // Verify the save by fetching the latest data
    const verifyData = await LearningData.findOne({ category });
    console.log('Verified saved data:', verifyData);

    res.json(learningData);
  } catch (error) {
    console.error('Error saving learning data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to get learning data
app.get('/api/learning-data', auth, async (req, res) => {
  try {
    const learningData = await LearningData.find().sort({ frequency: -1 });
    res.json(learningData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Add this after your routes to verify data is being saved
app.post('/api/test-db', async (req, res) => {
  try {
    const testData = new LearningData({
      category: 'test',
      keywords: ['test'],
      urls: ['http://test.com'],
      confidence: 0.9
    });
    
    const saved = await testData.save();
    console.log('Test data saved:', saved);
    
    const count = await LearningData.countDocuments();
    console.log('Total documents in LearningData:', count);
    
    res.json({ success: true, saved, count });
  } catch (error) {
    console.error('Test DB Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add this endpoint to check database status
app.get('/api/db-status', async (req, res) => {
  try {
    const status = {
      connected: mongoose.connection.readyState === 1,
      database: mongoose.connection.db?.databaseName,
      collections: await mongoose.connection.db?.listCollections().toArray(),
      learningDataCount: await LearningData.countDocuments()
    };
    res.json(status);
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      connected: false 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});