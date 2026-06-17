const express = require('express');
const router = express.Router();
const coach = require('../agents/coach');
const SessionService = require('../services/session');

router.post('/', async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const sessionService = new SessionService(req.app.locals.redisClient);
    const session = await sessionService.get(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.evaluations.length === 0) {
      return res.status(400).json({ error: 'No evaluations yet. Complete at least one exercise first.' });
    }

    // Get coaching decision
    const coaching = await coach.coach(session);
    
    // Store coaching decision
    await sessionService.addCoachDecision(sessionId, {
      decision: coaching.decision,
      reason: coaching.reason,
      nextChapter: coaching.nextChapter,
      nextDifficulty: coaching.nextDifficulty,
      recommendations: coaching.recommendations
    });

    // Update session state based on decision
    const updates = {
      currentDifficulty: coaching.nextDifficulty
    };
    
    if (coaching.decision === 'advance' || coaching.decision === 'review_previous_chapter') {
      updates.currentChapterIndex = coaching.nextChapter;
    }

    await sessionService.update(sessionId, updates);

    // Get updated session with analytics
    const updatedSession = await sessionService.get(sessionId);
    const analytics = sessionService.getAnalytics(updatedSession);

    res.json({
      sessionId,
      coaching,
      analytics,
      message: `Coach decided: ${coaching.decision}`
    });
  } catch (error) {
    console.error('Coaching error:', error);
    res.status(500).json({ error: 'Failed to generate coaching decision' });
  }
});

module.exports = router;
