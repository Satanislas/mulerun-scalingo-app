const express = require('express');
const router = express.Router();

const lessonTutor = require('../agents/lesson-tutor');
const SubjectService = require('../services/subjects');
const SessionService = require('../services/session');

const LESSON_TTL = 60 * 60 * 24 * 30; // 30 days
const lessonKey = (subjectId, courseIndex) => `epistudy:lesson:${subjectId}:${courseIndex}`;

function resolveCourse(plan, courseId) {
  if (!plan?.chapters?.length) return null;
  const byId = plan.chapters.findIndex((chapter) => String(chapter.id) === String(courseId));
  if (byId >= 0) return { course: plan.chapters[byId], courseIndex: byId };
  const numeric = Number(courseId);
  if (Number.isInteger(numeric) && numeric >= 0 && numeric < plan.chapters.length) {
    return { course: plan.chapters[numeric], courseIndex: numeric };
  }
  return null;
}

async function readPersistedState(redis, subjectId, courseIndex) {
  const raw = await redis.get(lessonKey(subjectId, courseIndex));
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

router.post('/chat', async (req, res) => {
  try {
    const { subjectId, courseId, message = '', lessonState = null } = req.body || {};
    if (!subjectId) return res.status(400).json({ error: 'subjectId is required' });
    if (courseId === undefined || courseId === null) return res.status(400).json({ error: 'courseId is required' });

    const subjectService = new SubjectService(req.app.locals.redisClient);
    const sessionService = new SessionService(req.app.locals.redisClient);

    const subject = await subjectService.get(subjectId);
    if (!subject || subject.deleted) return res.status(404).json({ error: 'Subject not found' });

    const session = subject.sessionId ? await sessionService.get(subject.sessionId) : null;
    if (!session?.plan) return res.status(404).json({ error: 'Learning plan not found for this subject' });

    const resolved = resolveCourse(session.plan, courseId);
    if (!resolved) return res.status(404).json({ error: 'Course not found' });

    const persisted = await readPersistedState(req.app.locals.redisClient, subjectId, resolved.courseIndex);
    const activeLessonState = lessonState || persisted;

    const result = lessonTutor.teach({
      subject,
      session,
      course: resolved.course,
      courseIndex: resolved.courseIndex,
      message,
      lessonState: activeLessonState
    });
    result.updatedLessonState.courseId = String(resolved.course.id ?? resolved.courseIndex);

    await req.app.locals.redisClient.setEx(
      lessonKey(subjectId, resolved.courseIndex),
      LESSON_TTL,
      JSON.stringify(result.updatedLessonState)
    );
    await subjectService.touch(subjectId);

    res.json({
      response: result.response,
      updatedLessonState: result.updatedLessonState,
      mode: result.mode,
      agentMeta: result.agentMeta
    });
  } catch (error) {
    console.error('Lesson chat error:', error);
    res.status(500).json({ error: 'Failed to run lesson tutor' });
  }
});

module.exports = router;
