import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { Frame } from '../models/Frame.js';
import fs from 'fs/promises';
import path from 'path';

const router = express.Router();

// Get all frames for the authenticated user
router.get('/frames', authenticateToken, async (req, res) => {
  try {
    const frames = await Frame.find({ userId: req.user._id })
      .sort({ timestamp: -1 });
    res.json(frames);
  } catch (error) {
    console.error('Error fetching frames:', error);
    res.status(500).json({ error: 'Failed to fetch frames' });
  }
});

// Save a new frame
router.post('/frames', authenticateToken, async (req, res) => {
  try {
    const { imageData, category, keywords, text } = req.body;
    const userId = req.user._id;

    // Extract base64 data and create buffer
    const base64Data = imageData.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');

    // Create filename and paths
    const fileName = `frame_${Date.now()}.png`;
    const publicPath = path.join(process.cwd(), 'public', 'frames', userId.toString());
    const filePath = path.join(publicPath, fileName);

    // Ensure directory exists
    await fs.mkdir(publicPath, { recursive: true });

    // Write file
    await fs.writeFile(filePath, buffer);

    // Create frame document with public URL
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

export default router; 