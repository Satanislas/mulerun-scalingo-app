// Agent 2: Exercise Generator
// Generates adaptive exercises based on chapter context and difficulty

const { generateExercise, generateChapterContent, detectDomain } = require('../services/ai-engine');

class ExerciseGenerator {
  constructor() {
    this.name = 'Exercise Generator';
    this.role = 'Creates adaptive exercises tailored to student level and chapter context';
  }

  async generate(session) {
    const startTime = Date.now();
    
    const { topic, level, plan, currentChapterIndex, currentDifficulty } = session;
    const chapter = plan.chapters[currentChapterIndex];
    const { domain } = detectDomain(topic);
    
    // Determine exercise index within chapter (cycle through types)
    const exercisesInChapter = session.exercises.filter(
      ex => ex.chapterIndex === currentChapterIndex
    ).length;
    
    // Generate exercise
    const exercise = generateExercise(
      topic, 
      chapter, 
      currentChapterIndex, 
      currentDifficulty, 
      domain,
      exercisesInChapter
    );

    // Add chapter context
    const chapterContent = generateChapterContent(
      topic, chapter, currentChapterIndex, currentDifficulty, domain
    );

    const result = {
      chapter: {
        index: currentChapterIndex,
        title: chapter.title,
        objectives: chapter.objectives
      },
      difficulty: currentDifficulty,
      difficultyLabel: currentDifficulty <= 2 ? 'Foundational' : currentDifficulty <= 4 ? 'Intermediate' : 'Advanced',
      exercise: {
        id: `ex_${Date.now()}`,
        type: exercise.type,
        question: exercise.question,
        instructions: exercise.instructions,
        hint: exercise.hint,
        expectedSkills: exercise.expectedSkills
      },
      context: {
        chapterContent,
        keyConcepts: chapterContent.keyConcepts,
        realWorldConnection: chapterContent.realWorldConnection
      },
      agentMeta: {
        agent: this.name,
        processingTime: Date.now() - startTime,
        strategy: `Generated ${exercise.type} exercise at difficulty ${currentDifficulty} for "${chapter.title}"`,
        adaptation: `Difficulty adjusted based on ${session.scores.length} previous evaluations`
      }
    };

    return result;
  }
}

module.exports = new ExerciseGenerator();
