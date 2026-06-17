const { v4: uuidv4 } = require('uuid');

const SESSION_TTL = 86400; // 24 hours

class SessionService {
  constructor(redisClient) {
    this.redis = redisClient;
  }

  _key(sessionId) {
    return `epistudy:session:${sessionId}`;
  }

  async create(topic, level) {
    const sessionId = uuidv4();
    const session = {
      id: sessionId,
      topic,
      level,
      createdAt: new Date().toISOString(),
      plan: null,
      currentChapterIndex: 0,
      currentDifficulty: level === 'beginner' ? 1 : level === 'intermediate' ? 3 : 5,
      exercises: [],
      evaluations: [],
      coachDecisions: [],
      scores: [],
      completedChapters: [],
      status: 'planning'
    };
    await this.redis.setEx(this._key(sessionId), SESSION_TTL, JSON.stringify(session));
    return session;
  }

  async get(sessionId) {
    const data = await this.redis.get(this._key(sessionId));
    if (!data) return null;
    return JSON.parse(data);
  }

  async update(sessionId, updates) {
    const session = await this.get(sessionId);
    if (!session) return null;
    const updated = { ...session, ...updates };
    await this.redis.setEx(this._key(sessionId), SESSION_TTL, JSON.stringify(updated));
    return updated;
  }

  async addExercise(sessionId, exercise) {
    const session = await this.get(sessionId);
    if (!session) return null;
    session.exercises.push({
      ...exercise,
      id: uuidv4(),
      createdAt: new Date().toISOString()
    });
    await this.redis.setEx(this._key(sessionId), SESSION_TTL, JSON.stringify(session));
    return session;
  }

  async addEvaluation(sessionId, evaluation) {
    const session = await this.get(sessionId);
    if (!session) return null;
    session.evaluations.push({
      ...evaluation,
      id: uuidv4(),
      createdAt: new Date().toISOString()
    });
    session.scores.push(evaluation.score);
    await this.redis.setEx(this._key(sessionId), SESSION_TTL, JSON.stringify(session));
    return session;
  }

  async addCoachDecision(sessionId, decision) {
    const session = await this.get(sessionId);
    if (!session) return null;
    session.coachDecisions.push({
      ...decision,
      id: uuidv4(),
      createdAt: new Date().toISOString()
    });
    await this.redis.setEx(this._key(sessionId), SESSION_TTL, JSON.stringify(session));
    return session;
  }

  async completeChapter(sessionId, chapterIndex) {
    const session = await this.get(sessionId);
    if (!session) return null;
    if (!session.completedChapters.includes(chapterIndex)) {
      session.completedChapters.push(chapterIndex);
    }
    await this.redis.setEx(this._key(sessionId), SESSION_TTL, JSON.stringify(session));
    return session;
  }

  getAnalytics(session) {
    if (!session) return null;
    const totalChapters = session.plan ? session.plan.chapters.length : 0;
    const completedCount = session.completedChapters.length;
    const scores = session.scores;
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const mastery = totalChapters > 0 ? Math.round((completedCount / totalChapters) * 100) : 0;
    
    const recentScores = scores.slice(-5);
    const trend = recentScores.length >= 2 
      ? (recentScores[recentScores.length - 1] >= recentScores[0] ? 'improving' : 'declining')
      : 'stable';

    return {
      mastery,
      chaptersCompleted: completedCount,
      totalChapters,
      averageScore: Math.round(avgScore * 10) / 10,
      exercisesCompleted: session.evaluations.length,
      trend,
      currentDifficulty: session.currentDifficulty,
      scores: session.scores
    };
  }
}

module.exports = SessionService;
