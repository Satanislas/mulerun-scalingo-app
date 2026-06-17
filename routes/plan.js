const express = require('express');
const router = express.Router();
const planner = require('../agents/planner');
const SessionService = require('../services/session');

router.post('/', async (req, res) => {
  try {
    const { topic, level } = req.body;
    
    if (!topic || !level) {
      return res.status(400).json({ error: 'Topic and level are required' });
    }

    const validLevels = ['beginner', 'intermediate', 'advanced'];
    if (!validLevels.includes(level)) {
      return res.status(400).json({ error: 'Level must be beginner, intermediate, or advanced' });
    }

    // Create session
    const sessionService = new SessionService(req.app.locals.redisClient);
    const session = await sessionService.create(topic, level);

    // Generate learning plan
    const plan = await planner.plan(topic, level);
    
    // Update session with plan
    await sessionService.update(session.id, { 
      plan, 
      status: 'active',
      currentDifficulty: level === 'beginner' ? 1 : level === 'intermediate' ? 3 : 5
    });

    res.json({
      sessionId: session.id,
      plan,
      message: `Learning plan generated for "${topic}" at ${level} level`
    });
  } catch (error) {
    console.error('Plan generation error:', error);
    res.status(500).json({ error: 'Failed to generate learning plan' });
  }
});

module.exports = router;
