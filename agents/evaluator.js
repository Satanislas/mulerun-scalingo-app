// Agent 3: Evaluator
// Evaluates student answers with detailed feedback

const { evaluateAnswer } = require('../services/ai-engine');

class Evaluator {
  constructor() {
    this.name = 'Evaluator';
    this.role = 'Assesses student responses with detailed, actionable feedback';
  }

  async evaluate(session, answer) {
    const startTime = Date.now();
    
    // Get the most recent exercise
    const currentExercise = session.exercises[session.exercises.length - 1];
    if (!currentExercise) {
      throw new Error('No exercise found to evaluate. Generate an exercise first.');
    }

    // Evaluate the answer
    const evaluation = evaluateAnswer(answer, currentExercise.exercise || currentExercise, session);

    // Generate detailed analysis
    const analysis = this._generateAnalysis(evaluation, session, currentExercise);

    const result = {
      score: evaluation.score,
      maxScore: 10,
      percentage: Math.round((evaluation.score / 10) * 100),
      strengths: evaluation.strengths,
      weaknesses: evaluation.weaknesses,
      feedback: evaluation.feedback,
      misconceptions: evaluation.misconceptions || [],
      analysis,
      agentMeta: {
        agent: this.name,
        processingTime: Date.now() - startTime,
        evaluationMethod: 'Multi-criteria assessment with contextual analysis',
        criteria: ['Completeness', 'Accuracy', 'Depth', 'Structure', 'Use of examples', 'Technical vocabulary']
      }
    };

    return result;
  }

  _generateAnalysis(evaluation, session, exercise) {
    const score = evaluation.score;
    const totalExercises = session.evaluations.length;
    const avgScore = session.scores.length > 0 
      ? session.scores.reduce((a, b) => a + b, 0) / session.scores.length 
      : 0;

    let performanceLevel, trend;
    
    if (score >= 8) performanceLevel = 'Excellent';
    else if (score >= 6) performanceLevel = 'Good';
    else if (score >= 4) performanceLevel = 'Satisfactory';
    else performanceLevel = 'Needs Improvement';

    if (session.scores.length >= 2) {
      const lastTwo = session.scores.slice(-2);
      if (lastTwo[1] > lastTwo[0]) trend = 'Improving';
      else if (lastTwo[1] < lastTwo[0]) trend = 'Declining';
      else trend = 'Stable';
    } else {
      trend = 'First evaluation';
    }

    return {
      performanceLevel,
      trend,
      comparisonToAverage: score > avgScore ? 'Above your average' : score < avgScore ? 'Below your average' : 'At your average',
      totalExercisesCompleted: totalExercises,
      runningAverage: Math.round(avgScore * 10) / 10,
      chapter: exercise.chapter ? exercise.chapter.title : 'Current chapter'
    };
  }
}

module.exports = new Evaluator();
