const express = require('express');
const router = express.Router();
const coach = require('../agents/coach');
const SessionService = require('../services/session');
const SubjectService = require('../services/subjects');

router.post('/', async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const sessionService = new SessionService(req.app.locals.redisClient);
    const subjectService = new SubjectService(req.app.locals.redisClient);
    const session = await sessionService.get(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.evaluations.length === 0) {
      return res.status(400).json({ error: 'No evaluations yet. Complete at least one exercise first.' });
    }

    const coaching = await coach.coach(session);

    await sessionService.addCoachDecision(sessionId, {
      decision: coaching.decision,
      reason: coaching.reason,
      nextChapter: coaching.nextChapter,
      nextDifficulty: coaching.nextDifficulty,
      recommendations: coaching.recommendations
    });

    const updates = { currentDifficulty: coaching.nextDifficulty };
    if (coaching.decision === 'advance' || coaching.decision === 'review_previous_chapter') {
      updates.currentChapterIndex = coaching.nextChapter;
    }
    await sessionService.update(sessionId, updates);

    const updatedSession = await sessionService.get(sessionId);
    const analytics = sessionService.getAnalytics(updatedSession);

    // Subject-aware: refresh subject recommendation + last activity
    let subject = null;
    let recommendation = null;
    if (session.subjectId) {
      subject = await subjectService.touch(session.subjectId);
      recommendation = subjectService.buildRecommendation(subject, updatedSession, analytics);
    }

    res.json({
      sessionId,
      subjectId: session.subjectId || null,
      coaching,
      analytics,
      subject,
      recommendation,
      message: `Coach decided: ${coaching.decision}`
    });
  } catch (error) {
    console.error('Coaching error:', error);
    res.status(500).json({ error: 'Failed to generate coaching decision' });
  }
});

module.exports = router;
