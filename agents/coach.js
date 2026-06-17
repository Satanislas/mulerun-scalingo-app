// Agent 4: Pedagogical Coach
// MOST IMPORTANT AGENT - Drives the learning journey autonomously

const { coachDecision } = require('../services/ai-engine');

class PedagogicalCoach {
  constructor() {
    this.name = 'Pedagogical Coach';
    this.role = 'Autonomously drives the learning journey by analyzing performance and adapting the path';
  }

  async coach(session) {
    const startTime = Date.now();
    
    // Analyze complete student history
    const historyAnalysis = this._analyzeHistory(session);
    
    // Make coaching decision
    const decision = coachDecision(session);
    
    // Generate detailed coaching report
    const report = this._generateReport(decision, historyAnalysis, session);

    const result = {
      decision: decision.decision,
      reason: decision.reason,
      nextChapter: decision.nextChapter,
      nextDifficulty: decision.nextDifficulty,
      recommendations: decision.recommendations,
      historyAnalysis,
      report,
      agentMeta: {
        agent: this.name,
        processingTime: Date.now() - startTime,
        decisionFramework: 'Performance-based adaptive learning with pattern detection',
        factors: [
          'Recent scores trend',
          'Average performance',
          'Recurring weaknesses',
          'Chapter progression',
          'Difficulty calibration'
        ]
      }
    };

    return result;
  }

  _analyzeHistory(session) {
    const scores = session.scores;
    const evaluations = session.evaluations;
    const decisions = session.coachDecisions;

    if (scores.length === 0) {
      return {
        hasHistory: false,
        message: 'No performance history yet. Starting initial assessment.'
      };
    }

    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const recentScores = scores.slice(-3);
    const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    
    // Detect patterns
    const allWeaknesses = evaluations.flatMap(ev => ev.weaknesses || []);
    const weaknessFrequency = {};
    allWeaknesses.forEach(w => {
      weaknessFrequency[w] = (weaknessFrequency[w] || 0) + 1;
    });

    const topWeaknesses = Object.entries(weaknessFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([weakness, count]) => ({ weakness, count }));

    const allStrengths = evaluations.flatMap(ev => ev.strengths || []);
    const strengthFrequency = {};
    allStrengths.forEach(s => {
      strengthFrequency[s] = (strengthFrequency[s] || 0) + 1;
    });

    const topStrengths = Object.entries(strengthFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([strength, count]) => ({ strength, count }));

    // Trend analysis
    let trend = 'insufficient_data';
    if (scores.length >= 3) {
      const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
      const secondHalf = scores.slice(Math.floor(scores.length / 2));
      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      
      if (secondAvg - firstAvg > 1) trend = 'strongly_improving';
      else if (secondAvg - firstAvg > 0.3) trend = 'improving';
      else if (firstAvg - secondAvg > 1) trend = 'strongly_declining';
      else if (firstAvg - secondAvg > 0.3) trend = 'declining';
      else trend = 'stable';
    }

    return {
      hasHistory: true,
      totalExercises: scores.length,
      averageScore: Math.round(avgScore * 10) / 10,
      recentAverage: Math.round(recentAvg * 10) / 10,
      scoreRange: { min: Math.min(...scores), max: Math.max(...scores) },
      trend,
      topStrengths,
      topWeaknesses,
      consistency: this._calculateConsistency(scores),
      decisionsMade: decisions.length
    };
  }

  _calculateConsistency(scores) {
    if (scores.length < 2) return 'insufficient_data';
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev < 1) return 'highly_consistent';
    if (stdDev < 2) return 'moderately_consistent';
    return 'variable';
  }

  _generateReport(decision, history, session) {
    const decisionMessages = {
      advance: `The student is ready to advance to the next chapter. Their performance demonstrates sufficient mastery of the current material. Moving to "${session.plan.chapters[decision.nextChapter]?.title || 'the next chapter'}" with increased difficulty.`,
      repeat: `The student should continue practicing the current chapter. While they show some understanding, additional practice will solidify their knowledge before advancing.`,
      simplify: `The current difficulty level is too challenging. Reducing complexity to rebuild confidence and ensure foundational understanding is secure.`,
      increase_difficulty: `The student is performing well and can handle more challenge. Increasing difficulty while maintaining the current chapter to deepen understanding.`,
      review_previous_chapter: `Performance suggests gaps in prerequisite knowledge. Reviewing the previous chapter will strengthen the foundation needed for current material.`
    };

    return {
      summary: decisionMessages[decision.decision] || decisionMessages.advance,
      studentProfile: history.hasHistory ? this._buildStudentProfile(history) : 'New student - profile will develop with completed exercises.',
      nextSteps: decision.recommendations,
      expectedOutcome: this._predictOutcome(decision, history)
    };
  }

  _buildStudentProfile(history) {
    let profile = 'Student profile: ';
    
    if (history.averageScore >= 7) profile += 'strong performer';
    else if (history.averageScore >= 5) profile += 'steady learner';
    else profile += 'developing learner';
    
    profile += ` with ${history.consistency.replace('_', ' ')} performance`;
    
    if (history.trend === 'improving' || history.trend === 'strongly_improving') {
      profile += ' showing positive momentum';
    } else if (history.trend === 'declining' || history.trend === 'strongly_declining') {
      profile += ' needing additional support';
    }
    
    profile += '.';
    return profile;
  }

  _predictOutcome(decision, history) {
    const predictions = {
      advance: 'Student should successfully engage with the next chapter given their strong performance trajectory.',
      repeat: 'Additional practice at this level should bring performance to the advancement threshold.',
      simplify: 'Reducing difficulty will allow the student to rebuild confidence and address knowledge gaps.',
      increase_difficulty: 'The student is ready for a challenge that will accelerate their learning.',
      review_previous_chapter: 'Reinforcing prerequisite knowledge will improve performance on current material.'
    };
    return predictions[decision.decision] || predictions.advance;
  }
}

module.exports = new PedagogicalCoach();
