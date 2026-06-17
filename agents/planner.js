// Agent 1: Learning Planner
// Analyzes topic, determines level, creates structured learning plan

const { detectDomain, generateChapterContent } = require('../services/ai-engine');

class LearningPlanner {
  constructor() {
    this.name = 'Learning Planner';
    this.role = 'Analyzes topics and creates structured learning journeys';
  }

  async plan(topic, level) {
    const startTime = Date.now();
    
    // Step 1: Detect domain
    const { domain, data } = detectDomain(topic);
    
    // Step 2: Analyze topic complexity
    const complexity = this._analyzeComplexity(topic, level);
    
    // Step 3: Generate chapters based on domain knowledge
    const baseChapters = data.chapters;
    const chapters = baseChapters.map((ch, index) => ({
      id: index + 1,
      title: ch.title,
      objectives: ch.objectives,
      status: 'pending',
      estimatedTime: this._estimateTime(index, level),
      content: generateChapterContent(topic, ch, index, complexity.startingDifficulty, domain),
      order: index + 1
    }));

    // Step 4: Define learning objectives
    const objectives = this._generateObjectives(topic, level, domain);

    // Step 5: Estimate total duration
    const estimatedDuration = this._estimateTotalDuration(chapters, level);

    const plan = {
      topic,
      level,
      domain,
      objectives,
      chapters,
      estimatedDuration,
      complexity,
      createdAt: new Date().toISOString(),
      agentMeta: {
        agent: this.name,
        processingTime: Date.now() - startTime,
        strategy: `Adaptive ${domain} curriculum with ${level}-level entry point`
      }
    };

    return plan;
  }

  _analyzeComplexity(topic, level) {
    const levels = {
      beginner: { startingDifficulty: 1, description: 'Foundational approach with guided progression' },
      intermediate: { startingDifficulty: 3, description: 'Balanced approach building on existing knowledge' },
      advanced: { startingDifficulty: 5, description: 'Rigorous approach with complex applications' }
    };
    return levels[level] || levels.beginner;
  }

  _estimateTime(chapterIndex, level) {
    const baseTime = { beginner: 45, intermediate: 30, advanced: 25 };
    const multiplier = 1 + (chapterIndex * 0.15);
    return Math.round((baseTime[level] || 45) * multiplier);
  }

  _estimateTotalDuration(chapters, level) {
    const totalMinutes = chapters.reduce((sum, ch) => sum + ch.estimatedTime, 0);
    const hours = Math.ceil(totalMinutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} (${totalMinutes} minutes total)`;
  }

  _generateObjectives(topic, level, domain) {
    const objectivesByLevel = {
      beginner: [
        `Build a solid foundation in ${topic}`,
        `Understand core principles and terminology`,
        `Apply basic concepts to simple problems`,
        `Develop confidence for intermediate study`
      ],
      intermediate: [
        `Deepen understanding of ${topic} principles`,
        `Apply concepts to complex real-world scenarios`,
        `Develop analytical and critical thinking skills`,
        `Connect concepts across different areas`
      ],
      advanced: [
        `Master advanced techniques in ${topic}`,
        `Solve novel and complex problems independently`,
        `Evaluate and critique approaches critically`,
        `Contribute original insights and solutions`
      ]
    };
    return objectivesByLevel[level] || objectivesByLevel.beginner;
  }
}

module.exports = new LearningPlanner();
