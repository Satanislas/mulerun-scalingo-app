// Subject Service - Manages multi-subject learning workspaces
// Each subject owns: metadata, visual identity (icon + palette), a planner session, and a skill graph.

const { v4: uuidv4 } = require('uuid');
const { detectDomain } = require('./ai-engine');

const SUBJECT_TTL = 60 * 60 * 24 * 30; // 30 days
const INDEX_KEY = 'epistudy:subjects:index';
const SUBJECT_KEY = (id) => `epistudy:subject:${id}`;

// ── Visual identity catalogue ────────────────────────────────────────────────
// Each theme is a self-contained palette that the UI can render directly.
const THEMES = {
  mathematics: {
    label: 'Mathematics',
    icon: 'calculator',
    paletteName: 'blue',
    palette: {
      primary: '#3b82f6', primaryDark: '#1d4ed8', accent: '#60a5fa',
      bg: 'rgba(59,130,246,0.10)', border: 'rgba(59,130,246,0.35)',
      glow: 'rgba(59,130,246,0.25)', text: '#93c5fd',
      gradient: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)'
    }
  },
  programming: {
    label: 'Programming',
    icon: 'code',
    paletteName: 'green',
    palette: {
      primary: '#22c55e', primaryDark: '#15803d', accent: '#4ade80',
      bg: 'rgba(34,197,94,0.10)', border: 'rgba(34,197,94,0.35)',
      glow: 'rgba(34,197,94,0.25)', text: '#86efac',
      gradient: 'linear-gradient(135deg, #14532d 0%, #22c55e 100%)'
    }
  },
  physics: {
    label: 'Physics',
    icon: 'atom',
    paletteName: 'purple',
    palette: {
      primary: '#a855f7', primaryDark: '#7e22ce', accent: '#c084fc',
      bg: 'rgba(168,85,247,0.10)', border: 'rgba(168,85,247,0.35)',
      glow: 'rgba(168,85,247,0.25)', text: '#d8b4fe',
      gradient: 'linear-gradient(135deg, #581c87 0%, #a855f7 100%)'
    }
  },
  biology: {
    label: 'Biology',
    icon: 'leaf',
    paletteName: 'emerald',
    palette: {
      primary: '#10b981', primaryDark: '#047857', accent: '#34d399',
      bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.35)',
      glow: 'rgba(16,185,129,0.25)', text: '#6ee7b7',
      gradient: 'linear-gradient(135deg, #064e3b 0%, #10b981 100%)'
    }
  },
  chemistry: {
    label: 'Chemistry',
    icon: 'flask',
    paletteName: 'rose',
    palette: {
      primary: '#f43f5e', primaryDark: '#be123c', accent: '#fb7185',
      bg: 'rgba(244,63,94,0.10)', border: 'rgba(244,63,94,0.35)',
      glow: 'rgba(244,63,94,0.25)', text: '#fda4af',
      gradient: 'linear-gradient(135deg, #881337 0%, #f43f5e 100%)'
    }
  },
  history: {
    label: 'History',
    icon: 'book',
    paletteName: 'amber',
    palette: {
      primary: '#f59e0b', primaryDark: '#b45309', accent: '#fbbf24',
      bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.35)',
      glow: 'rgba(245,158,11,0.25)', text: '#fcd34d',
      gradient: 'linear-gradient(135deg, #78350f 0%, #f59e0b 100%)'
    }
  },
  language: {
    label: 'Language & Literature',
    icon: 'globe',
    paletteName: 'cyan',
    palette: {
      primary: '#06b6d4', primaryDark: '#0e7490', accent: '#22d3ee',
      bg: 'rgba(6,182,212,0.10)', border: 'rgba(6,182,212,0.35)',
      glow: 'rgba(6,182,212,0.25)', text: '#67e8f9',
      gradient: 'linear-gradient(135deg, #164e63 0%, #06b6d4 100%)'
    }
  },
  business: {
    label: 'Business',
    icon: 'briefcase',
    paletteName: 'indigo',
    palette: {
      primary: '#6366f1', primaryDark: '#4338ca', accent: '#818cf8',
      bg: 'rgba(99,102,241,0.10)', border: 'rgba(99,102,241,0.35)',
      glow: 'rgba(99,102,241,0.25)', text: '#a5b4fc',
      gradient: 'linear-gradient(135deg, #312e81 0%, #6366f1 100%)'
    }
  },
  default: {
    label: 'General',
    icon: 'sparkles',
    paletteName: 'slate',
    palette: {
      primary: '#64748b', primaryDark: '#334155', accent: '#94a3b8',
      bg: 'rgba(100,116,139,0.10)', border: 'rgba(100,116,139,0.35)',
      glow: 'rgba(100,116,139,0.25)', text: '#cbd5e1',
      gradient: 'linear-gradient(135deg, #1e293b 0%, #64748b 100%)'
    }
  }
};

// Keywords -> theme key (extends ai-engine domain detection with finer granularity)
const KEYWORD_MAP = [
  { theme: 'mathematics', words: ['math', 'algebra', 'geometry', 'calculus', 'trigonom', 'statistic', 'arithmetic', 'number theory'] },
  { theme: 'programming', words: ['programming', 'coding', 'javascript', 'python', 'react', 'java', 'rust', 'c++', 'algorithm', 'software', 'developer', 'web dev', 'frontend', 'backend', 'devops', 'data structure', 'machine learning', 'deep learning', 'neural network', 'data science', ' ai ', 'artificial intelligence', 'computer science'] },
  { theme: 'physics', words: ['physic', 'mechanic', 'quantum', 'relativity', 'optic', 'thermodynam', 'electromagnet'] },
  { theme: 'chemistry', words: ['chemistry', 'organic', 'inorganic', 'molecul', 'reaction'] },
  { theme: 'biology', words: ['biolog', 'cell', 'genetic', 'ecolog', 'anatomy', 'evolution', 'micro', 'botany', 'zoolog'] },
  { theme: 'history', words: ['history', 'historic', 'civilization', 'ancient', 'medieval', 'world war', 'revolution'] },
  { theme: 'language', words: ['english', 'french', 'spanish', 'german', 'italian', 'chinese', 'literature', 'grammar', 'writing', 'linguistic', 'language', 'poetry'] },
  { theme: 'business', words: ['business', 'finance', 'marketing', 'management', 'economics', 'entrepreneur', 'leadership', 'strategy'] }
];

function detectTheme(title, description = '') {
  const text = `${title} ${description}`.toLowerCase();
  for (const entry of KEYWORD_MAP) {
    if (entry.words.some((w) => text.includes(w))) {
      return { key: entry.theme, ...THEMES[entry.theme] };
    }
  }
  return { key: 'default', ...THEMES.default };
}

// ── Skill graph templates ────────────────────────────────────────────────────
const SKILL_TEMPLATES = {
  mathematics: ['Algebra', 'Geometry', 'Trigonometry', 'Calculus', 'Statistics', 'Number Theory'],
  programming: ['Variables', 'Control Flow', 'Functions', 'Data Structures', 'Algorithms', 'Architecture'],
  physics:     ['Mechanics', 'Thermodynamics', 'Electromagnetism', 'Optics', 'Quantum Mechanics'],
  chemistry:   ['Atomic Structure', 'Stoichiometry', 'Organic', 'Inorganic', 'Thermochemistry'],
  biology:     ['Cell Biology', 'Genetics', 'Ecology', 'Evolution', 'Anatomy', 'Physiology'],
  history:     ['Ancient', 'Medieval', 'Modern', 'Geopolitics', 'Cultural History'],
  language:    ['Grammar', 'Vocabulary', 'Reading', 'Writing', 'Speaking', 'Literature'],
  business:    ['Strategy', 'Finance', 'Marketing', 'Operations', 'Leadership', 'Analytics'],
  default:     ['Foundations', 'Application', 'Analysis', 'Synthesis', 'Evaluation']
};

function buildSkillGraph(themeKey) {
  const skills = SKILL_TEMPLATES[themeKey] || SKILL_TEMPLATES.default;
  return skills.map((name) => ({
    name,
    mastery: 0,
    exerciseCount: 0,
    lastAssessment: null
  }));
}

// ── Service ──────────────────────────────────────────────────────────────────
class SubjectService {
  constructor(redisClient) {
    this.redis = redisClient;
  }

  async _readIndex() {
    const raw = await this.redis.get(INDEX_KEY);
    if (!raw) return [];
    try { return JSON.parse(raw); } catch { return []; }
  }

  async _writeIndex(ids) {
    await this.redis.setEx(INDEX_KEY, SUBJECT_TTL, JSON.stringify(ids));
  }

  async list() {
    const ids = await this._readIndex();
    const items = [];
    for (const id of ids) {
      const s = await this.get(id);
      if (s) items.push(s);
    }
    // Most recently active first
    items.sort((a, b) => new Date(b.lastActivity || b.createdAt) - new Date(a.lastActivity || a.createdAt));
    return items;
  }

  async get(id) {
    const raw = await this.redis.get(SUBJECT_KEY(id));
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }

  async _save(subject) {
    await this.redis.setEx(SUBJECT_KEY(subject.id), SUBJECT_TTL, JSON.stringify(subject));
  }

  /**
   * Create a new subject — auto-assigns icon + palette + skill graph based on title.
   * The sessionId is supplied by the caller after the planner has built the learning plan.
   */
  async create({ title, description = '', level = 'beginner', goal = '', sessionId = null, themeOverride = null }) {
    const id = uuidv4();
    const detected = themeOverride ? { key: themeOverride, ...THEMES[themeOverride] } : detectTheme(title, description);

    // Cross-check with ai-engine domain detection so the planner stays in sync
    const aiDomain = detectDomain(title).domain;

    const subject = {
      id,
      title: title.trim(),
      description: description.trim(),
      level,
      goal: goal.trim(),
      icon: detected.icon,
      themeKey: detected.key,
      paletteName: detected.paletteName,
      palette: detected.palette,
      domain: aiDomain,
      sessionId,
      skillGraph: buildSkillGraph(detected.key),
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };

    await this._save(subject);
    const ids = await this._readIndex();
    if (!ids.includes(id)) ids.unshift(id);
    await this._writeIndex(ids);
    return subject;
  }

  async update(id, updates) {
    const existing = await this.get(id);
    if (!existing) return null;
    const next = { ...existing, ...updates, id: existing.id };
    await this._save(next);
    return next;
  }

  async touch(id) {
    const existing = await this.get(id);
    if (!existing) return null;
    existing.lastActivity = new Date().toISOString();
    await this._save(existing);
    return existing;
  }

  async remove(id) {
    const ids = await this._readIndex();
    const next = ids.filter((x) => x !== id);
    await this._writeIndex(next);
    // We let the subject blob expire naturally — keep it deletable client-side immediately.
    await this.redis.setEx(SUBJECT_KEY(id), 1, JSON.stringify({ deleted: true }));
    return true;
  }

  /**
   * Update the skill graph after an evaluation.
   * Skill targeting heuristic: pick a skill by chapter index modulo skill count
   * so the graph progressively covers all skills as the student advances.
   */
  async recordEvaluation(id, { score, chapterIndex = 0, weaknesses = [] }) {
    const subject = await this.get(id);
    if (!subject || !subject.skillGraph?.length) return subject;
    const skills = subject.skillGraph;
    const targetIdx = Math.abs(chapterIndex) % skills.length;
    const target = skills[targetIdx];
    target.exerciseCount += 1;
    // Smooth running average of mastery (score 0-10 -> 0-100)
    const incoming = Math.round(score * 10);
    target.mastery = target.exerciseCount === 1
      ? incoming
      : Math.round((target.mastery * 0.7) + (incoming * 0.3));
    target.lastAssessment = new Date().toISOString();

    // Penalize a secondary skill when recurring weaknesses are detected
    if (weaknesses.length >= 2 && skills.length > 1) {
      const secondary = skills[(targetIdx + 1) % skills.length];
      secondary.exerciseCount += 1;
      const dampened = Math.max(0, Math.round(incoming * 0.8));
      secondary.mastery = secondary.exerciseCount === 1
        ? dampened
        : Math.round((secondary.mastery * 0.85) + (dampened * 0.15));
      secondary.lastAssessment = new Date().toISOString();
    }

    subject.lastActivity = new Date().toISOString();
    await this._save(subject);
    return subject;
  }

  /**
   * Subject-aware coach recommendation. Combines session analytics with the skill graph
   * to produce an autonomous next-action suggestion that appears prominently in the workspace.
   */
  buildRecommendation(subject, session, analytics) {
    if (!subject) return null;
    const skills = subject.skillGraph || [];
    const assessed = skills.filter((s) => s.exerciseCount > 0);
    const weakest = assessed.slice().sort((a, b) => a.mastery - b.mastery)[0];
    const strongest = assessed.slice().sort((a, b) => b.mastery - a.mastery)[0];
    const avg = analytics?.averageScore ?? 0;
    const trend = analytics?.trend || 'stable';
    const chaptersCompleted = analytics?.chaptersCompleted ?? 0;
    const totalChapters = analytics?.totalChapters ?? 0;

    let action = 'next_chapter';
    let title = 'Continue your learning path';
    let body = `Ready when you are — generate the next exercise to keep the momentum going in ${subject.title}.`;
    let cta = 'Generate next exercise';

    if (!session || session.evaluations.length === 0) {
      action = 'start';
      title = `Start your ${subject.title} journey`;
      body = 'Your roadmap is ready. Begin with the first exercise to let the coach calibrate to your level.';
      cta = 'Start first exercise';
    } else if (weakest && weakest.mastery < 60) {
      action = 'review_skill';
      title = `Reinforce ${weakest.name}`;
      body = `Your ${weakest.name.toLowerCase()} mastery dropped to ${weakest.mastery}%. The coach recommends a reinforcement exercise before advancing.`;
      cta = `Practice ${weakest.name}`;
    } else if (avg >= 8 && trend !== 'declining') {
      action = 'challenge';
      title = 'Time to level up';
      body = `Your recent average is ${avg}/10 and your skills are strong. The coach is queuing an advanced challenge exercise.`;
      cta = 'Take the challenge';
    } else if (chaptersCompleted >= totalChapters && totalChapters > 0) {
      action = 'mastery';
      title = `${subject.title} mastery in sight`;
      body = 'All chapters completed. The coach suggests a synthesis exercise to certify mastery.';
      cta = 'Run mastery exercise';
    } else if (trend === 'declining') {
      action = 'review_chapter';
      title = 'Slow down and reinforce';
      body = `Your recent scores are trending down. Reviewing the current chapter${strongest ? ` and leaning on your ${strongest.name} strength` : ''} will rebuild momentum.`;
      cta = 'Review current chapter';
    }

    return {
      action, title, body, cta,
      generatedAt: new Date().toISOString(),
      stats: {
        weakestSkill: weakest ? { name: weakest.name, mastery: weakest.mastery } : null,
        strongestSkill: strongest ? { name: strongest.name, mastery: strongest.mastery } : null,
        averageScore: avg,
        trend
      }
    };
  }

  /**
   * Aggregate analytics across all subjects for the Hub overview.
   */
  async portfolio() {
    const subjects = await this.list();
    let totalMastery = 0;
    let masteredSkills = 0;
    let totalSkills = 0;
    let totalExercises = 0;
    let consistencyDays = new Set();

    for (const s of subjects) {
      const skills = s.skillGraph || [];
      totalSkills += skills.length;
      for (const sk of skills) {
        totalMastery += sk.mastery;
        if (sk.mastery >= 80) masteredSkills += 1;
        totalExercises += sk.exerciseCount;
        if (sk.lastAssessment) consistencyDays.add(sk.lastAssessment.slice(0, 10));
      }
    }

    return {
      subjectCount: subjects.length,
      averageMastery: totalSkills > 0 ? Math.round(totalMastery / totalSkills) : 0,
      masteredSkills,
      totalSkills,
      totalExercises,
      activeDays: consistencyDays.size
    };
  }
}

module.exports = SubjectService;
module.exports.THEMES = THEMES;
module.exports.detectTheme = detectTheme;
module.exports.SKILL_TEMPLATES = SKILL_TEMPLATES;
