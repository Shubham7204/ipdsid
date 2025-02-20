import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { Session } from '../models/Session.js';

const router = express.Router();

// Get all sessions for the authenticated user
router.get('/sessions', authenticateToken, async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.user._id })
      .sort({ startTime: -1 })
      .populate('frames');
    res.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Start a new session
router.post('/sessions/start', authenticateToken, async (req, res) => {
  try {
    const session = new Session({
      userId: req.user._id,
      startTime: new Date(),
      frames: [],
      rawData: []
    });
    await session.save();
    res.json(session);
  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({ error: 'Failed to start session' });
  }
});

// End a session
router.post('/sessions/:id/end', authenticateToken, async (req, res) => {
  try {
    const session = await Session.findOne({ 
      _id: req.params.id,
      userId: req.user._id 
    });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    session.endTime = new Date();
    session.report = req.body.report;
    await session.save();
    
    res.json(session);
  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({ error: 'Failed to end session' });
  }
});

export default router; 