import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import User from './models/User.js';
import Analysis from './models/Analysis.js';
import LearningData from './models/LearningData.js';
import { Frame } from './models/Frame.js';
import fs from 'fs/promises';
import path from 'path';
import { Session } from './models/Session.js';
import multer from 'multer';
import { authenticateToken } from './middleware/auth.js';
import PDFDocument from 'pdfkit';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/frames', express.static('public/frames'));

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
app.post('/api/analysis', authenticateToken, async (req, res) => {
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

app.get('/api/analysis', authenticateToken, async (req, res) => {
  try {
    const analyses = await Analysis.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(analyses);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Learning data routes
app.get('/learning-data', authenticateToken, async (req, res) => {
  try {
    const learningData = await LearningData.find({ userId: req.user.id });
    res.json(learningData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch learning data' });
  }
});

app.post('/learning-data', authenticateToken, async (req, res) => {
  try {
    const learningData = new LearningData({
      userId: req.user.id,
      ...req.body
    });
    await learningData.save();
    res.json(learningData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save learning data' });
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

// Ensure frames directory exists
const framesDir = path.join(process.cwd(), 'public', 'frames');
await fs.mkdir(framesDir, { recursive: true });

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.user.id;
    const userDir = path.join(process.cwd(), 'public', 'frames', userId);
    fs.mkdirSync(userDir, { recursive: true });
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    cb(null, `frame_${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage });

// Frame routes
app.get('/frames', authenticateToken, async (req, res) => {
  try {
    const frames = await Frame.find({ userId: req.user.id })
      .sort({ timestamp: -1 });
    res.json(frames);
  } catch (error) {
    console.error('Error fetching frames:', error);
    res.status(500).json({ error: 'Failed to fetch frames' });
  }
});

app.post('/frames', authenticateToken, async (req, res) => {
  try {
    const { imageData, category, keywords, text } = req.body;
    const userId = req.user.id;

    // Save image to filesystem
    const buffer = Buffer.from(imageData.split(',')[1], 'base64');
    const fileName = `frame_${Date.now()}.png`;
    const filePath = `public/frames/${userId}`;
    
    await fs.mkdir(filePath, { recursive: true });
    await fs.writeFile(`${filePath}/${fileName}`, buffer);

    const frame = new Frame({
      userId,
      imageUrl: `/frames/${userId}/${fileName}`,
      category,
      keywords,
      text,
      timestamp: new Date()
    });

    await frame.save();
    res.json(frame);
  } catch (error) {
    console.error('Error saving frame:', error);
    res.status(500).json({ error: 'Failed to save frame' });
  }
});

// Session routes
app.post('/sessions/start', authenticateToken, async (req, res) => {
  try {
    const session = new Session({
      userId: req.user.id,
      startTime: new Date()
    });
    await session.save();
    res.json(session);
  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({ error: 'Failed to start session' });
  }
});

app.post('/sessions/:sessionId/end', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { report } = req.body;
    
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    session.endTime = new Date();
    session.report = report;
    await session.save();
    
    res.json(session);
  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({ error: 'Failed to end session' });
  }
});

// Update sessions route to remove /api prefix
app.get('/sessions', authenticateToken, async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.user.id })
      .populate('frames')
      .sort({ startTime: -1 });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

app.get('/sessions/:sessionId/pdf', authenticateToken, async (req, res) => {
  try {
    const session = await Session.findById(req.params.sessionId)
      .populate('frames');
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const doc = new PDFDocument();
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=session-${session.startTime}.pdf`);
    
    // Pipe the PDF to the response
    doc.pipe(res);
    
    // Add content to PDF
    doc.fontSize(20).text('Session Report', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(12).text(`Date: ${new Date(session.startTime).toLocaleString()}`);
    doc.moveDown();
    
    if (session.report) {
      doc.fontSize(16).text('Analysis');
      doc.fontSize(12).text(`Category: ${session.report.category}`);
      doc.text(`Keywords: ${session.report.keywords.join(', ')}`);
      if (session.report.urls.length > 0) {
        doc.text('URLs:');
        session.report.urls.forEach(url => doc.text(`• ${url}`));
      }
      doc.moveDown();
      doc.text('Summary:');
      doc.text(session.report.summary);
    }
    
    doc.end();
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});