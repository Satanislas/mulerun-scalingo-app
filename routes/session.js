const express = require('express');
const router = express.Router();
const SessionService = require('../services/session');

// Get session details
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const sessionService = new SessionService(req.app.locals.redisClient);
    const session = await sessionService.get(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const analytics = sessionService.getAnalytics(session);

    res.json({ session, analytics });
  } catch (error) {
    console.error('Session fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// Get session history
router.get('/:sessionId/history', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const sessionService = new SessionService(req.app.locals.redisClient);
    const session = await sessionService.get(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      exercises: session.exercises,
      evaluations: session.evaluations,
      coachDecisions: session.coachDecisions,
      scores: session.scores,
      completedChapters: session.completedChapters
    });
  } catch (error) {
    console.error('History fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

module.exports = router;
