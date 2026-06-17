const express = require('express');
const router = express.Router();
const exerciseGenerator = require('../agents/exercise-generator');
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

    if (!session.plan) {
      return res.status(400).json({ error: 'No learning plan found. Generate a plan first.' });
    }

    const exercise = await exerciseGenerator.generate(session);

    await sessionService.addExercise(sessionId, {
      ...exercise.exercise,
      chapterIndex: session.currentChapterIndex,
      chapterTitle: exercise.chapter.title,
      difficulty: exercise.difficulty
    });

    if (session.subjectId) {
      await subjectService.touch(session.subjectId);
    }

    res.json({
      sessionId,
      subjectId: session.subjectId || null,
      exercise,
      message: `Exercise generated for "${exercise.chapter.title}"`
    });
  } catch (error) {
    console.error('Exercise generation error:', error);
    res.status(500).json({ error: 'Failed to generate exercise' });
  }
});

module.exports = router;
