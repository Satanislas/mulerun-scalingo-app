// Subject routes — central API for the Subject Hub
const express = require('express');
const router = express.Router();

const SubjectService = require('../services/subjects');
const SessionService = require('../services/session');
const planner = require('../agents/planner');
const coachAgent = require('../agents/coach');

function services(req) {
  return {
    subjects: new SubjectService(req.app.locals.redisClient),
    sessions: new SessionService(req.app.locals.redisClient)
  };
}

// GET /api/subjects — list all subjects + portfolio analytics
router.get('/', async (req, res) => {
  try {
    const { subjects } = services(req);
    const list = await subjects.list();
    const portfolio = await subjects.portfolio();

    // Light-weight progress numbers for cards
    const sessionService = new SessionService(req.app.locals.redisClient);
    const enriched = [];
    for (const s of list) {
      let progress = 0;
      let chaptersCompleted = 0;
      let totalChapters = 0;
      let averageScore = 0;
      if (s.sessionId) {
        const session = await sessionService.get(s.sessionId);
        if (session) {
          const a = sessionService.getAnalytics(session);
          progress = a.mastery;
          chaptersCompleted = a.chaptersCompleted;
          totalChapters = a.totalChapters;
          averageScore = a.averageScore;
        }
      }
      enriched.push({ ...s, progress, chaptersCompleted, totalChapters, averageScore });
    }
    res.json({ subjects: enriched, portfolio });
  } catch (err) {
    console.error('List subjects error:', err);
    res.status(500).json({ error: 'Failed to list subjects' });
  }
});

// POST /api/subjects — create a new subject and auto-bootstrap planner session + skill graph
router.post('/', async (req, res) => {
  try {
    const { title, description = '', level = 'beginner', goal = '' } = req.body || {};
    if (!title || !title.trim()) return res.status(400).json({ error: 'title is required' });
    const validLevels = ['beginner', 'intermediate', 'advanced'];
    if (!validLevels.includes(level)) return res.status(400).json({ error: 'level must be beginner, intermediate or advanced' });

    const { subjects, sessions } = services(req);

    // 1) Spin up a planner session — keeps full compatibility with existing exercise/evaluate/coach flow
    const session = await sessions.create(title.trim(), level);
    const plan = await planner.plan(title.trim(), level);
    await sessions.update(session.id, {
      plan,
      status: 'active',
      currentDifficulty: level === 'beginner' ? 1 : level === 'intermediate' ? 3 : 5
    });

    // 2) Create the subject record with auto-assigned visual identity + skill graph
    const subject = await subjects.create({
      title, description, level, goal, sessionId: session.id
    });

    // 3) Cross-link sessionId -> subjectId so other routes can find the subject quickly
    await sessions.update(session.id, { subjectId: subject.id });

    res.json({ subject, plan, sessionId: session.id });
  } catch (err) {
    console.error('Create subject error:', err);
    res.status(500).json({ error: 'Failed to create subject' });
  }
});

// GET /api/subjects/:id — full subject + session + analytics + recommendation
router.get('/:id', async (req, res) => {
  try {
    const { subjects, sessions } = services(req);
    const subject = await subjects.get(req.params.id);
    if (!subject) return res.status(404).json({ error: 'Subject not found' });

    let session = null;
    let analytics = null;
    if (subject.sessionId) {
      session = await sessions.get(subject.sessionId);
      analytics = session ? sessions.getAnalytics(session) : null;
    }
    const recommendation = subjects.buildRecommendation(subject, session, analytics);
    res.json({ subject, session, analytics, recommendation });
  } catch (err) {
    console.error('Get subject error:', err);
    res.status(500).json({ error: 'Failed to fetch subject' });
  }
});

// POST /api/subjects/:id/recommend — re-runs the coach with subject context
router.post('/:id/recommend', async (req, res) => {
  try {
    const { subjects, sessions } = services(req);
    const subject = await subjects.get(req.params.id);
    if (!subject) return res.status(404).json({ error: 'Subject not found' });
    const session = subject.sessionId ? await sessions.get(subject.sessionId) : null;
    const analytics = session ? sessions.getAnalytics(session) : null;

    let coaching = null;
    if (session && session.evaluations.length > 0) {
      coaching = await coachAgent.coach(session);
    }
    const recommendation = subjects.buildRecommendation(subject, session, analytics);
    await subjects.touch(subject.id);
    res.json({ subject, recommendation, coaching, analytics });
  } catch (err) {
    console.error('Recommend error:', err);
    res.status(500).json({ error: 'Failed to generate recommendation' });
  }
});

// DELETE /api/subjects/:id
router.delete('/:id', async (req, res) => {
  try {
    const { subjects } = services(req);
    const subject = await subjects.get(req.params.id);
    if (!subject) return res.status(404).json({ error: 'Subject not found' });
    await subjects.remove(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    console.error('Delete subject error:', err);
    res.status(500).json({ error: 'Failed to delete subject' });
  }
});

// GET /api/subjects/themes — exposes the visual identity catalogue (for the create modal preview)
router.get('/meta/themes', async (req, res) => {
  res.json({ themes: SubjectService.THEMES });
});

module.exports = router;
