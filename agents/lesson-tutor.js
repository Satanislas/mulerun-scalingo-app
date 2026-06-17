// Agent 5: Lesson Tutor
// Converts static chapters into guided, stateful, conversational lessons.

class LessonTutor {
  constructor() {
    this.name = 'Lesson Tutor';
    this.role = 'Guides structured teaching, handles contextual Q&A, then resumes lesson progression';
  }

  teach({ subject, session, course, courseIndex, message = '', lessonState = null }) {
    const startTime = Date.now();
    const outline = this._buildOutline(course);
    const state = this._normalizeState(lessonState, courseIndex, outline);
    const text = (message || '').trim();
    const isInitial = !text && state.completedSections.length === 0;
    const questionLike = this._isQuestion(text);
    const continueLike = this._isContinue(text);

    let mode = 'teaching';
    let response;

    if (isInitial) {
      response = this._intro({ subject, session, course, outline });
      this._completeSection(state, 0, outline);
      mode = 'teaching';
    } else if (questionLike && !continueLike) {
      mode = 'resume';
      const answer = this._answerQuestion({ subject, course, outline, state, message: text });
      this._recordConfusion(state, text);
      const resume = this._teachCurrentSection({ subject, course, outline, state, isResume: true });
      response = `${answer}\n\n---\n\n${resume}`;
    } else {
      response = this._teachCurrentSection({ subject, course, outline, state, isResume: false });
      mode = 'teaching';
    }

    state.lastMode = mode;
    state.summaryOfWhatUserUnderstood = this._summarizeUnderstanding({ state, course, outline });
    state.remainingSections = outline
      .map((section, index) => ({ index, title: section.title }))
      .filter((section) => !state.completedSections.includes(section.index));
    state.updatedAt = new Date().toISOString();

    return {
      response,
      updatedLessonState: state,
      mode,
      agentMeta: {
        agent: this.name,
        processingTime: Date.now() - startTime,
        strategy: 'Stateful guided tutoring with interruption handling and automatic resume'
      }
    };
  }

  _normalizeState(raw, courseIndex, outline) {
    const base = raw && typeof raw === 'object' ? raw : {};
    const completed = Array.isArray(base.completedSections)
      ? base.completedSections.map((n) => Number(n)).filter((n) => Number.isInteger(n) && n >= 0 && n < outline.length)
      : [];
    const current = Number.isInteger(Number(base.currentSection))
      ? Math.max(0, Math.min(outline.length - 1, Number(base.currentSection)))
      : 0;

    return {
      courseId: String(courseIndex),
      currentSection: completed.includes(current)
        ? Math.min(outline.length - 1, completed.length)
        : current,
      completedSections: [...new Set(completed)].sort((a, b) => a - b),
      userConfusions: Array.isArray(base.userConfusions) ? base.userConfusions.slice(-8) : [],
      lastMode: base.lastMode || 'teaching',
      summaryOfWhatUserUnderstood: base.summaryOfWhatUserUnderstood || 'Lesson just started; understanding will be summarized as the tutor progresses.',
      sectionNotes: base.sectionNotes && typeof base.sectionNotes === 'object' ? base.sectionNotes : {},
      remainingSections: Array.isArray(base.remainingSections) ? base.remainingSections : [],
      startedAt: base.startedAt || new Date().toISOString()
    };
  }

  _buildOutline(course) {
    const objectives = Array.isArray(course.objectives) ? course.objectives : [];
    const keyConcepts = Array.isArray(course.content?.keyConcepts) ? course.content.keyConcepts : [];
    const sections = [
      {
        title: 'Big picture and learning target',
        type: 'overview',
        objective: `Understand why "${course.title}" matters and how the lesson will unfold.`
      },
      ...objectives.map((objective, index) => ({
        title: objective,
        type: 'objective',
        objective,
        keyConcept: keyConcepts[index]?.name || objective
      })),
      {
        title: 'Guided example',
        type: 'example',
        objective: 'Apply the lesson idea to a concrete, low-friction example.'
      },
      {
        title: 'Mastery check and next bridge',
        type: 'mastery',
        objective: 'Verify understanding and connect this chapter to the wider roadmap.'
      }
    ];

    return sections.map((section, index) => ({ ...section, index }));
  }

  _intro({ subject, session, course, outline }) {
    const topic = session?.topic || subject?.title || 'this subject';
    const objectives = (course.objectives || []).map((o, i) => `${i + 1}. ${o}`).join('\n');
    const concepts = (course.content?.keyConcepts || []).map((c) => `- ${c.name}: ${c.description}`).join('\n');
    const firstExample = this._exampleFor(subject, course);

    return [
      `I’ll teach **${course.title}** as a guided lesson, not as a static reading page.`,
      '',
      '### 1) What this chapter is about',
      `${course.content?.context || `This chapter builds useful foundations for ${topic}.`} The goal is to make the ideas usable: you should be able to explain them, recognize them in examples, and apply them in practice.`,
      '',
      '### 2) Lesson roadmap',
      outline.map((s, i) => `${i + 1}. ${s.title}`).join('\n'),
      '',
      '### 3) Learning objectives',
      objectives || '- Build a clear mental model\n- Practice with examples\n- Check understanding before moving forward',
      '',
      concepts ? `### 4) Key concepts\n${concepts}` : '',
      '',
      '### 5) Starter example',
      firstExample,
      '',
      'We’ll start with the big picture, then move through each objective. You can interrupt me with any question; I’ll answer it and then resume the lesson from the right point.'
    ].filter(Boolean).join('\n');
  }

  _teachCurrentSection({ subject, course, outline, state, isResume }) {
    let sectionIndex = state.currentSection;
    if (state.completedSections.includes(sectionIndex) && sectionIndex < outline.length - 1) {
      sectionIndex += 1;
      state.currentSection = sectionIndex;
    }

    const section = outline[sectionIndex] || outline[outline.length - 1];
    const body = this._sectionExplanation({ subject, course, section, state, isResume });
    this._completeSection(state, section.index, outline);
    return body;
  }

  _sectionExplanation({ subject, course, section, state, isResume }) {
    const prefix = isResume
      ? `Now I’ll resume the structured lesson at **${section.title}**.`
      : `Let’s continue with **${section.title}**.`;

    if (section.type === 'overview') {
      return [
        prefix,
        '',
        'A useful way to think about this chapter is: **concept → pattern → application**.',
        `- Concept: ${course.title} gives you the vocabulary for the topic.`,
        '- Pattern: you learn what to notice and how pieces relate.',
        '- Application: you use the pattern to solve a real task or explain a real situation.',
        '',
        `Example: ${this._exampleFor(subject, course)}`,
        '',
        'Before moving deeper, keep one question in mind: “What problem does this concept help me solve?”'
      ].join('\n');
    }

    if (section.type === 'objective') {
      return [
        prefix,
        '',
        `### Core idea`,
        `${section.objective}. The important part is not memorizing the phrase; it is knowing what action it asks you to perform.`,
        '',
        '### How to learn it',
        '1. Restate the idea in your own words.',
        '2. Connect it to one concrete example.',
        '3. Test it by asking, “What would change if this idea were missing?”',
        '',
        '### Mini example',
        this._objectiveExample(subject, course, section),
        '',
        'I’m marking this section as covered, but if any part feels unclear, ask directly and I’ll pause here before advancing.'
      ].join('\n');
    }

    if (section.type === 'example') {
      return [
        prefix,
        '',
        'We’ll use a simple worked pattern:',
        '1. Identify the concept being used.',
        '2. Name the evidence that tells us it applies.',
        '3. Apply the concept in one controlled step.',
        '4. Explain the result in plain language.',
        '',
        `Worked example: ${this._exampleFor(subject, course)}`,
        '',
        'This pattern is deliberately reusable: it works for exercises, explanations, and real-world application.'
      ].join('\n');
    }

    return [
      prefix,
      '',
      'Quick mastery check:',
      `- Can you explain **${course.title}** in two sentences?`,
      '- Can you give one example without looking at the notes?',
      '- Can you say which objective was easiest and which still feels uncertain?',
      '',
      state.userConfusions.length
        ? `I noticed these questions/confusions during the lesson: ${state.userConfusions.map((c) => `"${c.question}"`).join(', ')}. We should revisit them during practice.`
        : 'No unresolved confusion has been recorded yet.',
      '',
      'Next best step: try an exercise for this chapter so the Evaluator and Pedagogical Coach can measure mastery and adapt the path.'
    ].join('\n');
  }

  _answerQuestion({ subject, course, outline, state, message }) {
    const current = outline[state.currentSection] || outline[0];
    const relevantConcept = this._pickRelevantConcept(course, message) || current.keyConcept || current.title;
    const lower = message.toLowerCase();

    let angle = 'clarification';
    if (lower.includes('example')) angle = 'example';
    if (lower.includes('why')) angle = 'reason';
    if (lower.includes('how')) angle = 'process';

    const answerMap = {
      example: `A concrete example: ${this._exampleFor(subject, course)} The key is to identify the concept first, then show how it changes the outcome.`,
      reason: `The reason this matters is that **${relevantConcept}** gives you a reliable mental handle. Without it, the chapter can feel like isolated facts instead of a connected method.`,
      process: `The process is: define the concept, identify where it appears, apply it to one small case, then explain the result in plain language.`,
      clarification: `In this lesson, **${relevantConcept}** means the part of ${course.title} that helps you move from vague recognition to usable understanding.`
    };

    return [
      `Good interruption. I’m pausing the lesson to answer this in context: “${message}”`,
      '',
      answerMap[angle],
      '',
      'A simpler way to say it:',
      `- What it is: a tool for understanding **${course.title}**.`,
      '- What you do with it: recognize the pattern, then use it deliberately.',
      '- How you know you understand it: you can explain it with a new example.',
      '',
      'I’ll keep this question in the lesson state so the tutor can adapt future explanations.'
    ].join('\n');
  }

  _completeSection(state, sectionIndex, outline) {
    if (!state.completedSections.includes(sectionIndex)) {
      state.completedSections.push(sectionIndex);
      state.completedSections.sort((a, b) => a - b);
    }
    state.sectionNotes[String(sectionIndex)] = `Covered: ${outline[sectionIndex]?.title || 'section'}`;
    const next = outline.find((section) => !state.completedSections.includes(section.index));
    state.currentSection = next ? next.index : outline.length - 1;
  }

  _recordConfusion(state, question) {
    state.userConfusions.push({
      question,
      section: state.currentSection,
      status: 'addressed',
      addressedAt: new Date().toISOString()
    });
    state.userConfusions = state.userConfusions.slice(-8);
  }

  _summarizeUnderstanding({ state, course, outline }) {
    const covered = state.completedSections.map((i) => outline[i]?.title).filter(Boolean);
    const remaining = outline.filter((s) => !state.completedSections.includes(s.index)).map((s) => s.title);
    const confusionNote = state.userConfusions.length
      ? ` Questions addressed: ${state.userConfusions.map((c) => c.question).slice(-3).join(' | ')}.`
      : '';
    return `Covered ${covered.length}/${outline.length} sections in "${course.title}": ${covered.join(', ') || 'none yet'}. Remaining: ${remaining.join(', ') || 'none'}.${confusionNote}`;
  }

  _pickRelevantConcept(course, message) {
    const concepts = course.content?.keyConcepts || [];
    const lower = message.toLowerCase();
    return concepts.find((c) => lower.includes((c.name || '').toLowerCase().split(' ')[0]))?.name;
  }

  _exampleFor(subject, course) {
    const domain = subject?.domain || 'default';
    const title = subject?.title || 'the subject';
    const examples = {
      mathematics: `if ${title} involves solving a problem, first name the known quantities, then choose the principle from "${course.title}" that links them.`,
      programming: `if you are building a feature, "${course.title}" helps you decide what the code should do, what data it needs, and how to test edge cases.`,
      science: `if you observe a phenomenon, "${course.title}" helps you form a hypothesis, identify variables, and predict what should happen next.`,
      language: `if you are writing or speaking, "${course.title}" helps you choose structure, vocabulary, and tone for the audience.`,
      business: `if a team faces a decision, "${course.title}" helps structure the trade-offs, metrics, and execution plan.`
    };
    return examples[domain] || `when studying ${title}, "${course.title}" helps you move from definitions to practical use.`;
  }

  _objectiveExample(subject, course, section) {
    return `Take the objective "${section.objective}". A learner should be able to say: “I can recognize this idea in ${subject?.title || 'the subject'}, explain why it matters, and use it in a small example related to ${course.title}.”`;
  }

  _isQuestion(text) {
    if (!text) return false;
    return /\?$/.test(text)
      || /^(what|why|how|when|where|can|could|would|should|is|are|do|does|did)\b/i.test(text)
      || /\b(confused|don't understand|do not understand|not clear|explain|example|clarify)\b/i.test(text);
  }

  _isContinue(text) {
    return /\b(continue|resume|next|go on|got it|understood|keep going)\b/i.test(text || '');
  }
}

module.exports = new LessonTutor();
