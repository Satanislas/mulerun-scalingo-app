// AI Engine - Sophisticated template-based content generation
// Generates contextually appropriate educational content based on topic, level, and context

const KNOWLEDGE_BASE = {
  mathematics: {
    keywords: ['math', 'mathematics', 'algebra', 'calculus', 'geometry', 'statistics', 'equation', 'function', 'derivative', 'integral'],
    chapters: [
      { title: 'Foundations & Core Concepts', objectives: ['Understand fundamental principles', 'Master basic notation', 'Build problem-solving framework'] },
      { title: 'Structural Analysis', objectives: ['Analyze mathematical structures', 'Identify patterns', 'Apply systematic approaches'] },
      { title: 'Applied Problem Solving', objectives: ['Solve real-world problems', 'Apply theoretical knowledge', 'Develop mathematical reasoning'] },
      { title: 'Advanced Techniques', objectives: ['Master complex methods', 'Combine multiple approaches', 'Handle edge cases'] },
      { title: 'Synthesis & Mastery', objectives: ['Integrate all concepts', 'Solve multi-step problems', 'Demonstrate deep understanding'] }
    ],
    exerciseTypes: ['proof', 'calculation', 'word_problem', 'graphical_analysis', 'derivation']
  },
  programming: {
    keywords: ['programming', 'coding', 'javascript', 'python', 'software', 'algorithm', 'web', 'development', 'computer science', 'data structure'],
    chapters: [
      { title: 'Programming Fundamentals', objectives: ['Understand syntax and semantics', 'Write basic programs', 'Debug simple errors'] },
      { title: 'Control Flow & Logic', objectives: ['Master conditionals and loops', 'Implement algorithms', 'Handle edge cases'] },
      { title: 'Data Structures', objectives: ['Choose appropriate structures', 'Implement from scratch', 'Analyze complexity'] },
      { title: 'Design Patterns & Architecture', objectives: ['Apply common patterns', 'Structure code effectively', 'Write maintainable software'] },
      { title: 'Real-World Projects', objectives: ['Build complete applications', 'Handle errors gracefully', 'Optimize performance'] }
    ],
    exerciseTypes: ['code_writing', 'debugging', 'code_review', 'architecture_design', 'optimization']
  },
  science: {
    keywords: ['physics', 'chemistry', 'biology', 'science', 'experiment', 'hypothesis', 'molecule', 'atom', 'cell', 'energy', 'force'],
    chapters: [
      { title: 'Scientific Method & Observation', objectives: ['Formulate hypotheses', 'Design experiments', 'Analyze observations'] },
      { title: 'Core Principles & Laws', objectives: ['Understand fundamental laws', 'Apply scientific models', 'Predict outcomes'] },
      { title: 'Experimental Analysis', objectives: ['Interpret experimental data', 'Identify variables', 'Draw conclusions'] },
      { title: 'Complex Systems', objectives: ['Analyze interacting systems', 'Model real phenomena', 'Handle uncertainty'] },
      { title: 'Applications & Research', objectives: ['Apply knowledge to problems', 'Evaluate research', 'Propose investigations'] }
    ],
    exerciseTypes: ['hypothesis_testing', 'data_analysis', 'experiment_design', 'concept_application', 'research_evaluation']
  },
  language: {
    keywords: ['language', 'english', 'french', 'spanish', 'grammar', 'vocabulary', 'writing', 'linguistics', 'communication'],
    chapters: [
      { title: 'Foundations of Communication', objectives: ['Master basic grammar', 'Build core vocabulary', 'Understand sentence structure'] },
      { title: 'Intermediate Expression', objectives: ['Construct complex sentences', 'Use varied vocabulary', 'Express nuanced ideas'] },
      { title: 'Analytical Reading & Writing', objectives: ['Analyze texts critically', 'Write structured arguments', 'Use rhetorical devices'] },
      { title: 'Advanced Communication', objectives: ['Master stylistic elements', 'Adapt tone and register', 'Persuade effectively'] },
      { title: 'Mastery & Creative Expression', objectives: ['Write creatively', 'Analyze literature', 'Communicate with precision'] }
    ],
    exerciseTypes: ['grammar_exercise', 'composition', 'text_analysis', 'translation', 'creative_writing']
  },
  business: {
    keywords: ['business', 'management', 'marketing', 'finance', 'economics', 'entrepreneurship', 'strategy', 'leadership'],
    chapters: [
      { title: 'Business Fundamentals', objectives: ['Understand market dynamics', 'Analyze business models', 'Evaluate value propositions'] },
      { title: 'Strategic Planning', objectives: ['Develop strategic thinking', 'Conduct SWOT analysis', 'Set measurable goals'] },
      { title: 'Financial Analysis', objectives: ['Read financial statements', 'Calculate key metrics', 'Make data-driven decisions'] },
      { title: 'Marketing & Growth', objectives: ['Design marketing strategies', 'Analyze customer behavior', 'Optimize conversion'] },
      { title: 'Leadership & Execution', objectives: ['Lead teams effectively', 'Manage projects', 'Drive organizational change'] }
    ],
    exerciseTypes: ['case_study', 'financial_analysis', 'strategy_development', 'market_analysis', 'leadership_scenario']
  },
  default: {
    chapters: [
      { title: 'Introduction & Foundations', objectives: ['Understand core concepts', 'Build foundational knowledge', 'Identify key terminology'] },
      { title: 'Core Principles', objectives: ['Master fundamental principles', 'Apply basic techniques', 'Solve standard problems'] },
      { title: 'Intermediate Applications', objectives: ['Apply knowledge to scenarios', 'Analyze complex cases', 'Develop critical thinking'] },
      { title: 'Advanced Concepts', objectives: ['Handle advanced topics', 'Integrate multiple concepts', 'Solve challenging problems'] },
      { title: 'Mastery & Synthesis', objectives: ['Demonstrate comprehensive understanding', 'Apply to novel situations', 'Teach concepts to others'] }
    ],
    exerciseTypes: ['conceptual', 'analytical', 'applied', 'critical_thinking', 'synthesis']
  }
};

function detectDomain(topic) {
  const lower = topic.toLowerCase();
  for (const [domain, data] of Object.entries(KNOWLEDGE_BASE)) {
    if (domain === 'default') continue;
    if (data.keywords.some(kw => lower.includes(kw))) {
      return { domain, data };
    }
  }
  return { domain: 'default', data: KNOWLEDGE_BASE.default };
}

function generateChapterContent(topic, chapter, chapterIndex, difficulty, domain) {
  const diffLabel = difficulty <= 2 ? 'fundamental' : difficulty <= 4 ? 'intermediate' : 'advanced';
  
  const contexts = {
    mathematics: `In the context of ${topic}, we explore ${diffLabel} mathematical reasoning.`,
    programming: `When working with ${topic}, ${diffLabel} computational thinking is essential.`,
    science: `Studying ${topic} requires ${diffLabel} scientific methodology.`,
    language: `Mastering ${topic} involves ${diffLabel} linguistic competence.`,
    business: `In ${topic}, ${diffLabel} strategic understanding drives success.`,
    default: `The study of ${topic} at a ${diffLabel} level builds comprehensive expertise.`
  };

  return {
    context: contexts[domain] || contexts.default,
    keyConcepts: generateKeyConcepts(topic, chapter, difficulty, domain),
    realWorldConnection: generateRealWorldConnection(topic, chapter, domain)
  };
}

function generateKeyConcepts(topic, chapter, difficulty, domain) {
  const base = chapter.objectives.map((obj, i) => ({
    name: obj.replace(/^(Understand|Master|Apply|Analyze|Develop|Build|Identify|Solve|Write|Design|Conduct|Evaluate|Lead|Manage|Drive|Handle|Integrate|Demonstrate|Teach|Choose|Implement|Formulate|Create) /, ''),
    description: `${obj} through focused practice and application.`,
    importance: ['foundational', 'core', 'essential'][Math.min(i, 2)]
  }));
  return base;
}

function generateRealWorldConnection(topic, chapter, domain) {
  const connections = {
    mathematics: `Understanding ${chapter.title.toLowerCase()} in ${topic} enables better decision-making in finance, engineering, and data science.`,
    programming: `Skills from ${chapter.title.toLowerCase()} directly apply to building software that solves real-world problems at scale.`,
    science: `${chapter.title.toLowerCase()} principles in ${topic} are used daily in healthcare, environmental science, and technology.`,
    language: `Mastery of ${chapter.title.toLowerCase()} enhances communication in professional, academic, and personal contexts.`,
    business: `${chapter.title.toLowerCase()} knowledge drives better business outcomes and career advancement.`,
    default: `${chapter.title.toLowerCase()} expertise in ${topic} has broad applications across industries and disciplines.`
  };
  return connections[domain] || connections.default;
}

function generateExercise(topic, chapter, chapterIndex, difficulty, domain, exerciseIndex) {
  const { data } = detectDomain(topic);
  const exerciseType = data.exerciseTypes[exerciseIndex % data.exerciseTypes.length];
  const diffLabel = difficulty <= 2 ? 'foundational' : difficulty <= 4 ? 'intermediate' : 'advanced';
  
  const exercises = generateExerciseByDomain(topic, chapter, difficulty, domain, exerciseType, diffLabel);
  return exercises;
}

function generateExerciseByDomain(topic, chapter, difficulty, domain, type, diffLabel) {
  const chapterTitle = chapter.title.toLowerCase();
  
  const templates = {
    mathematics: {
      conceptual: {
        question: `Explain the relationship between the key concepts in "${chapter.title}" within the context of ${topic}. How do these concepts build upon each other to form a coherent mathematical framework? Provide a specific example demonstrating this relationship.`,
        hint: `Consider how ${difficulty <= 2 ? 'basic principles connect to form more complex ideas' : 'multiple mathematical structures interact in sophisticated ways'}.`,
        expectedSkills: ['conceptual understanding', 'mathematical reasoning', 'clear explanation']
      },
      calculation: {
        question: `Given a scenario involving ${topic} at a ${diffLabel} level: A system has parameters that follow the principles of "${chapter.title}". If the initial conditions are set and we apply the transformation described by the core concepts of this chapter, determine the resulting state. Show all work and justify each step.`,
        hint: `Break the problem into smaller steps. Apply each principle from "${chapter.title}" sequentially.`,
        expectedSkills: ['systematic problem solving', 'step-by-step reasoning', 'verification']
      },
      proof: {
        question: `Prove or disprove: In the context of ${topic}, the principles outlined in "${chapter.title}" necessarily lead to the conclusion that systematic application of these concepts produces consistent, predictable results. Use formal reasoning and provide a counterexample if the statement is false.`,
        hint: `Consider both the general case and potential edge cases where the principles might not apply directly.`,
        expectedSkills: ['formal reasoning', 'logical structure', 'counterexample generation']
      }
    },
    programming: {
      code_writing: {
        question: `Write a ${diffLabel} program that demonstrates the concepts from "${chapter.title}" in the context of ${topic}. Your solution should: (1) correctly implement the core algorithm, (2) handle edge cases, (3) include appropriate error handling, and (4) be well-documented. Describe your design decisions.`,
        hint: `Start with the simplest case, then add complexity. Think about what could go wrong.`,
        expectedSkills: ['code implementation', 'error handling', 'documentation', 'design thinking']
      },
      debugging: {
        question: `The following approach to implementing "${chapter.title}" concepts in ${topic} has a subtle bug: "A developer implements the core logic but forgets to handle the case where input data doesn't match expected patterns, causing silent failures in production." Identify the bug, explain why it occurs, and provide the corrected implementation with proper safeguards.`,
        hint: `Think about what happens when inputs are unexpected. What assumptions does the code make?`,
        expectedSkills: ['bug identification', 'root cause analysis', 'defensive programming']
      },
      architecture_design: {
        question: `Design a software architecture for a ${topic} application that properly implements the principles of "${chapter.title}". Your design should address: component structure, data flow, error handling strategy, and scalability considerations. Justify your architectural choices.`,
        hint: `Consider separation of concerns, modularity, and how components interact.`,
        expectedSkills: ['system design', 'architectural thinking', 'trade-off analysis']
      }
    },
    science: {
      hypothesis_testing: {
        question: `Based on the principles of "${chapter.title}" in ${topic}, formulate a testable hypothesis about a real-world phenomenon. Design an experiment to test it, identifying: independent variable, dependent variable, control group, and expected outcomes. Explain how you would analyze the results.`,
        hint: `Ensure your hypothesis is falsifiable and your experiment has proper controls.`,
        expectedSkills: ['hypothesis formulation', 'experimental design', 'variable identification']
      },
      data_analysis: {
        question: `A research team studying ${topic} collected data related to "${chapter.title}". The results show: Trial 1: expected outcome, Trial 2: 15% deviation from expected, Trial 3: outcome matches prediction within 2% margin. Analyze this data, identify potential sources of variation, and draw conclusions about the underlying principles.`,
        hint: `Consider both systematic and random sources of error. What does the pattern tell you?`,
        expectedSkills: ['data interpretation', 'error analysis', 'conclusion drawing']
      }
    },
    language: {
      composition: {
        question: `Write a ${diffLabel} essay (300-500 words) on the topic of ${topic}, specifically addressing the concepts from "${chapter.title}". Your essay should demonstrate: clear thesis, logical argumentation, appropriate vocabulary, and effective transitions. Include at least one counterargument and your response to it.`,
        hint: `Structure your essay with a clear introduction, body paragraphs with topic sentences, and a strong conclusion.`,
        expectedSkills: ['structured writing', 'argumentation', 'vocabulary usage', 'coherence']
      },
      text_analysis: {
        question: `Analyze how the concepts from "${chapter.title}" in ${topic} are communicated in different registers (formal academic, casual conversational, and professional). Provide examples of how the same core idea would be expressed differently in each context, and explain why these differences exist.`,
        hint: `Consider audience, purpose, and conventions of each register.`,
        expectedSkills: ['register awareness', 'audience analysis', 'adaptation skills']
      }
    },
    business: {
      case_study: {
        question: `A startup in the ${topic} space is struggling with challenges related to "${chapter.title}". They have: limited resources, a small team of 5, and 6 months of runway. Analyze the situation using the frameworks from this chapter. Recommend a strategic approach with specific, actionable steps and expected outcomes.`,
        hint: `Consider both short-term survival and long-term growth. What are the trade-offs?`,
        expectedSkills: ['strategic analysis', 'resource allocation', 'actionable recommendations']
      },
      financial_analysis: {
        question: `Given a ${topic} business with the following metrics related to "${chapter.title}": Revenue growing 20% monthly, customer acquisition cost at $50, lifetime value at $200, churn rate at 8%. Analyze these metrics, identify strengths and weaknesses, and recommend specific improvements with projected impact.`,
        hint: `Calculate derived metrics like LTV/CAC ratio and consider what industry benchmarks suggest.`,
        expectedSkills: ['metric analysis', 'benchmarking', 'strategic recommendations']
      }
    },
    default: {
      conceptual: {
        question: `Explain the core concepts of "${chapter.title}" in ${topic} at a ${diffLabel} level. How do these concepts interconnect? Provide a detailed example that illustrates the practical application of these principles.`,
        hint: `Start with the fundamentals and build up. Use concrete examples to illustrate abstract concepts.`,
        expectedSkills: ['conceptual understanding', 'clear explanation', 'practical application']
      },
      analytical: {
        question: `Analyze the key factors that make "${chapter.title}" important within ${topic}. Compare and contrast different approaches to understanding these concepts. Which approach is most effective and why? Support your analysis with specific examples.`,
        hint: `Consider multiple perspectives and evaluate the strengths and weaknesses of each.`,
        expectedSkills: ['critical analysis', 'comparative evaluation', 'evidence-based reasoning']
      },
      applied: {
        question: `Apply the principles of "${chapter.title}" to solve a real-world problem in ${topic}. Describe the problem, your approach, the solution, and how you would verify its effectiveness. Consider potential obstacles and how to address them.`,
        hint: `Think about practical constraints and how to work within them while still achieving the goal.`,
        expectedSkills: ['problem solving', 'practical application', 'solution verification']
      }
    }
  };

  const domainTemplates = templates[domain] || templates.default;
  const template = domainTemplates[type] || domainTemplates[Object.keys(domainTemplates)[0]];
  
  return {
    type,
    question: template.question,
    hint: template.hint,
    expectedSkills: template.expectedSkills,
    difficulty: diffLabel,
    instructions: `Provide a thorough, well-structured response. Take your time to think through each aspect of the question. Your answer will be evaluated on accuracy, depth of understanding, and clarity of explanation.`
  };
}

function evaluateAnswer(answer, exercise, session) {
  if (!answer || answer.trim().length < 10) {
    return {
      score: 1,
      strengths: ['Attempted to answer the question'],
      weaknesses: ['Response too brief to demonstrate understanding', 'Lacks depth and detail'],
      feedback: 'Your response is too short to properly evaluate. Please provide a more detailed answer that addresses all aspects of the question. Include specific examples and explain your reasoning step by step.',
      misconceptions: ['Insufficient engagement with the material']
    };
  }

  const answerLength = answer.trim().length;
  const wordCount = answer.trim().split(/\s+/).length;
  const hasExamples = /\b(example|for instance|such as|specifically|consider|imagine)\b/i.test(answer);
  const hasStructure = /\b(first|second|third|finally|however|therefore|because|since|moreover|additionally|in conclusion)\b/i.test(answer);
  const hasTechnicalTerms = exercise.expectedSkills.some(skill => 
    answer.toLowerCase().includes(skill.toLowerCase().split(' ')[0])
  );
  const addressesQuestion = exercise.question.toLowerCase().split(' ').filter(w => w.length > 5).some(word => 
    answer.toLowerCase().includes(word)
  );

  let score = 3; // Base score
  
  if (wordCount > 50) score += 1;
  if (wordCount > 150) score += 1;
  if (hasExamples) score += 1;
  if (hasStructure) score += 1;
  if (hasTechnicalTerms) score += 1;
  if (addressesQuestion) score += 1;
  
  // Difficulty adjustment
  const diff = session.currentDifficulty;
  if (diff <= 2 && wordCount > 30) score += 0.5;
  if (diff >= 5 && wordCount > 200 && hasExamples) score += 0.5;
  
  score = Math.min(10, Math.max(1, Math.round(score)));

  const strengths = [];
  const weaknesses = [];
  const misconceptions = [];

  if (wordCount > 100) strengths.push('Provided a detailed and thorough response');
  else weaknesses.push('Response could be more detailed');
  
  if (hasExamples) strengths.push('Used concrete examples to illustrate understanding');
  else weaknesses.push('Could benefit from specific examples');
  
  if (hasStructure) strengths.push('Well-organized and logically structured answer');
  else weaknesses.push('Answer structure could be improved');
  
  if (hasTechnicalTerms) strengths.push('Demonstrated knowledge of key terminology');
  else { weaknesses.push('Missing key technical terminology'); misconceptions.push('May not have fully grasped the core vocabulary'); }
  
  if (addressesQuestion) strengths.push('Directly addressed the question asked');
  else { weaknesses.push('Did not fully address the specific question'); misconceptions.push('May have misunderstood what was being asked'); }

  if (score >= 8) {
    strengths.push('Demonstrated deep understanding of the concepts');
  } else if (score >= 5) {
    strengths.push('Showed reasonable understanding with room for growth');
  } else {
    weaknesses.push('Fundamental concepts need reinforcement');
    misconceptions.push('Core principles may not be fully understood');
  }

  const feedbackTemplates = {
    high: `Excellent work! Your response demonstrates a strong grasp of the material. ${strengths[0]}. To push even further, consider exploring how these concepts connect to adjacent topics and thinking about edge cases or limitations.`,
    mid: `Good effort! You've shown understanding of several key concepts. ${strengths[0]}. To improve, focus on: ${weaknesses[0]}. Review the chapter material and try to incorporate more specific examples in your responses.`,
    low: `Your response shows some engagement with the material, but there are areas that need significant improvement. ${weaknesses.join('. ')}. I recommend revisiting the chapter fundamentals and working through the examples more carefully before attempting similar questions.`
  };

  const feedback = score >= 7 ? feedbackTemplates.high : score >= 4 ? feedbackTemplates.mid : feedbackTemplates.low;

  return { score, strengths, weaknesses, feedback, misconceptions };
}

function coachDecision(session) {
  const scores = session.scores;
  const recentScores = scores.slice(-3);
  const avgRecent = recentScores.length > 0 ? recentScores.reduce((a, b) => a + b, 0) / recentScores.length : 5;
  const totalChapters = session.plan ? session.plan.chapters.length : 0;
  const currentIndex = session.currentChapterIndex;
  const difficulty = session.currentDifficulty;

  let decision, reason, nextDifficulty = difficulty, nextChapter = currentIndex;
  const recommendations = [];

  if (scores.length === 0) {
    decision = 'advance';
    reason = 'Starting the learning journey. Beginning with the first chapter to establish foundational knowledge.';
    recommendations.push('Focus on understanding core concepts before moving to applications');
    recommendations.push('Take notes on key terminology and principles');
  } else if (avgRecent >= 7.5 && currentIndex < totalChapters - 1) {
    decision = 'advance';
    reason = `Strong performance (average ${avgRecent.toFixed(1)}/10 on recent exercises). The student has demonstrated mastery of the current chapter and is ready to progress.`;
    nextChapter = currentIndex + 1;
    nextDifficulty = Math.min(7, difficulty + 1);
    recommendations.push('Challenge yourself with the increased difficulty');
    recommendations.push('Connect new concepts to previously learned material');
  } else if (avgRecent >= 5 && avgRecent < 7.5) {
    decision = 'increase_difficulty';
    reason = `Solid performance (average ${avgRecent.toFixed(1)}/10). The student understands the basics but can be challenged further before advancing.`;
    nextDifficulty = Math.min(7, difficulty + 1);
    recommendations.push('Focus on depth of understanding rather than just getting correct answers');
    recommendations.push('Try to explain concepts in your own words');
  } else if (avgRecent >= 3 && avgRecent < 5) {
    decision = 'repeat';
    reason = `Moderate performance (average ${avgRecent.toFixed(1)}/10). The student needs more practice with the current chapter before advancing.`;
    nextDifficulty = Math.max(1, difficulty);
    recommendations.push('Review the chapter material thoroughly');
    recommendations.push('Focus on the identified weaknesses in your evaluations');
    recommendations.push('Try approaching the concepts from a different angle');
  } else {
    decision = 'simplify';
    reason = `Performance indicates difficulty is too high (average ${avgRecent.toFixed(1)}/10). Reducing complexity to build confidence and solid foundations.`;
    nextDifficulty = Math.max(1, difficulty - 1);
    if (currentIndex > 0) {
      decision = 'review_previous_chapter';
      nextChapter = Math.max(0, currentIndex - 1);
      reason += ' Revisiting the previous chapter to reinforce prerequisite knowledge.';
    }
    recommendations.push('Take time to fully understand each concept before moving on');
    recommendations.push('Use the hints provided with exercises');
    recommendations.push('Break complex problems into smaller, manageable steps');
  }

  // Check for patterns in weaknesses
  const recentEvals = session.evaluations.slice(-3);
  const recurringWeaknesses = {};
  recentEvals.forEach(ev => {
    (ev.weaknesses || []).forEach(w => {
      recurringWeaknesses[w] = (recurringWeaknesses[w] || 0) + 1;
    });
  });
  const patterns = Object.entries(recurringWeaknesses).filter(([, count]) => count >= 2);
  if (patterns.length > 0) {
    recommendations.push(`Recurring issue detected: "${patterns[0][0]}" - dedicate extra practice to this area`);
  }

  return {
    decision,
    reason,
    nextChapter: Math.min(nextChapter, totalChapters - 1),
    nextDifficulty,
    recommendations
  };
}

module.exports = {
  detectDomain,
  generateChapterContent,
  generateExercise,
  evaluateAnswer,
  coachDecision,
  KNOWLEDGE_BASE
};
