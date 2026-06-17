const express = require('express');
const router = express.Router();
const evaluator = require('../agents/evaluator');
const SessionService = require('../services/session');
const SubjectService = require('../services/subjects');

router.post('/', async (req, res) => {
  try {
    const { sessionId, answer } = req.body;

    if (!sessionId || !answer) {
      return res.status(400).json({ error: 'sessionId and answer are required' });
    }

    const sessionService = new SessionService(req.app.locals.redisClient);
    const subjectService = new SubjectService(req.app.locals.redisClient);
    const session = await sessionService.get(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.exercises.length === 0) {
      return res.status(400).json({ error: 'No exercise to evaluate. Generate an exercise first.' });
    }

    const evaluation = await evaluator.evaluate(session, answer);

    await sessionService.addEvaluation(sessionId, {
      score: evaluation.score,
      strengths: evaluation.strengths,
      weaknesses: evaluation.weaknesses,
      feedback: evaluation.feedback,
      misconceptions: evaluation.misconceptions,
      exerciseIndex: session.exercises.length - 1,
      chapterIndex: session.currentChapterIndex
    });

    if (evaluation.score >= 6) {
      await sessionService.completeChapter(sessionId, session.currentChapterIndex);
    }

    // Subject-aware: update skill graph + last activity
    let subject = null;
    if (session.subjectId) {
      subject = await subjectService.recordEvaluation(session.subjectId, {
        score: evaluation.score,
        chapterIndex: session.currentChapterIndex,
        weaknesses: evaluation.weaknesses || []
      });
    }

    res.json({
      sessionId,
      subjectId: session.subjectId || null,
      subject,
      evaluation,
      message: `Answer evaluated with score ${evaluation.score}/10`
    });
  } catch (error) {
    console.error('Evaluation error:', error);
    res.status(500).json({ error: 'Failed to evaluate answer' });
  }
});

module.exports = router;
