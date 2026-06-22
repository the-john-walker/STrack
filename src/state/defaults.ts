import type { Category, Settings } from './types';

export const DEFAULT_SETTINGS: Settings = {
  customColors: null,
  heatBaseline: 60,
  pomodoroFocus: 25,
  pomodoroBreak: 5,
  pomodoroRounds: 4,
  ambient: 'none',
  alertSound: true,
  focusColor: null,
  focusEffectColor: null,
};

export const DEFAULTS: Category[] = [
  { id: 'matho', name: 'Math Olympiad (AMC/AIME)', goalH: 2.75, color: '#4A6FA5' },
  { id: 'usaco', name: 'USACO Prep', goalH: 1.5, color: '#6C8EBF' },
  { id: 'proj', name: 'Projects', goalH: 6, color: '#A3B899' },
  { id: 'deca', name: 'DECA', goalH: 1.25, color: '#C9A06B' },
  { id: 'econ', name: 'Econ', goalH: 0.5, color: '#B0857F' },
  { id: 'other', name: 'Other', goalH: 0, color: '#9A9A92' },
];

export const BUILTIN_SUBJECTS: Record<string, string[]> = {
  matho: [
    'AMC 10/12 problem set',
    'AIME prep',
    'Timed past exam',
    'Weak-topic drill',
    'Geometry',
    'Number theory',
    'Counting & probability',
    'Algebra',
  ],
  usaco: ['Bronze problem', 'USACO Guide module', 'Past contest (timed)', 'Editorial review'],
  proj: [
    'Golf Data Analysis',
    'EUIN Inquiries',
    'ML Fine-tuning (Colab)',
    'Walker Digital Transform',
    'ChessIQ',
    'CS50P',
    'Other project',
  ],
  deca: [
    'Cluster exam questions',
    'Role-play scenario',
    'Written event',
    'Performance-indicator review',
  ],
  econ: ['Khan: Microeconomics', 'Khan: Macroeconomics', 'NEC prep', 'Markets reading'],
};

export const METHODS = [
  'Practice problems',
  'Drilling / reps',
  'Past exam / mock test',
  'Timed test',
  'Active recall / flashcards',
  'Reviewing mistakes',
  'Reading',
  'Watching lecture',
  'Watching tutorial',
  'Note-taking',
  'Building / coding',
  'Debugging',
  'Writing / drafting',
  'Research',
  'Editorial / solution review',
  'Role-play / speaking',
  'Presenting out loud',
  'Planning',
  'Group study',
  'Office hours / tutoring',
  'Other',
];

export interface StudyStep {
  time: string;
  title: string;
  detail?: string;
}

export interface StudyVariant {
  label: string;
  steps: StudyStep[];
  weekly: string;
}

export interface StudyPlan {
  goal: string;
  variants: StudyVariant[];
}

export const STUDY: Record<string, StudyPlan> = {
  matho: {
    goal: '2.75 hrs / week',
    variants: [
      {
        label: 'Foundations',
        steps: [
          {
            time: '30 min',
            title: 'Alcumus on your weakest topic.',
            detail:
              'Let Alcumus auto-pick from your lowest-rated topic. Quality over speed: aim to fully understand 6-8 problems, not rush 20.',
          },
          {
            time: '20 min',
            title: '5 past AMC 10 problems, untimed, review every miss.',
            detail:
              'Start from problems 1-10 of a recent AMC 10. For each miss, write the single idea you were missing. That list becomes your study map.',
          },
          {
            time: '10 min',
            title: 'Log mistakes in your error notebook.',
            detail:
              'One line per mistake: the trap + the fix. Re-reading this weekly is where most of the score gain actually comes from.',
          },
        ],
        weekly: 'Weekly: one timed 75-min AMC 10 mock (Saturday).',
      },
      {
        label: 'Speed',
        steps: [
          {
            time: '25 min',
            title: 'Timed sprint: 10 AMC problems in 25 min, no stopping.',
            detail:
              'Simulate test pacing. If stuck more than 2.5 min, mark it and move on. Finishing the sprint matters more than any single problem.',
          },
          {
            time: '20 min',
            title: 'Review every miss. Write the one idea you lacked.',
            detail: '',
          },
          {
            time: '15 min',
            title: 'One hard problem, slow, full solution.',
            detail:
              'Pick a problem 18-22. The goal is not to solve fast, it is to build the deep patterns that separate AIME qualifiers.',
          },
        ],
        weekly: "Weekly: redo last mock's misses from scratch.",
      },
      {
        label: 'Deep dive',
        steps: [
          {
            time: '35 min',
            title: 'Pick one topic; read theory + 2 worked examples.',
            detail:
              'Number theory, counting, or geometry. Use AoPS Vol 1 chapters; read actively with paper, redo each example yourself.',
          },
          { time: '15 min', title: '3 targeted problems on that exact topic.', detail: '' },
          {
            time: '10 min',
            title: 'Summarize the technique in 3 lines.',
            detail: 'If you cannot compress it to 3 lines, you do not own it yet.',
          },
        ],
        weekly: 'Weekly: finish one AoPS chapter end-to-end.',
      },
    ],
  },
  usaco: {
    goal: '1.5 hrs / week',
    variants: [
      {
        label: 'Problem-first',
        steps: [
          {
            time: '35 min',
            title: 'One Bronze problem.',
            detail:
              'Read the statement twice, write your approach in plain English before coding. Most Bronze losses are misreads, not algorithm gaps.',
          },
          {
            time: '15 min',
            title: 'If stuck, read editorial and re-implement from scratch.',
            detail:
              'Do not just copy the solution. Close the editorial and re-code it from memory. That is where the learning actually sticks.',
          },
          { time: '10 min', title: 'Summarize the key technique in plain English.', detail: '' },
        ],
        weekly: 'Weekly: aim for one full problem + editorial review.',
      },
      {
        label: 'Guide-based',
        steps: [
          {
            time: '30 min',
            title: 'One USACO Guide module: read + do practice problems.',
            detail:
              'Focus on the bronze modules. Do not skip the practice problems; they are calibrated to the exact difficulty you will see.',
          },
          {
            time: '20 min',
            title: 'Past contest: one problem from the relevant topic.',
            detail: '',
          },
          { time: '10 min', title: 'Log what you got wrong and why.', detail: '' },
        ],
        weekly: 'Weekly: complete one full guide section.',
      },
      {
        label: 'Contest sim',
        steps: [
          {
            time: '60 min',
            title: 'Timed contest: 3 bronze problems in 60 min.',
            detail:
              'Simulate real contest conditions: no hints, no searching. Read all 3 problems first and pick the easiest to start.',
          },
          { time: '20 min', title: 'Review every problem you did not fully solve.', detail: '' },
        ],
        weekly: 'Weekly: one timed simulation, always.',
      },
    ],
  },
  proj: {
    goal: '6 hrs / week',
    variants: [
      {
        label: 'Build session',
        steps: [
          {
            time: '15 min',
            title: "Write today's goal: one clear outcome.",
            detail:
              'Vague goals like "work on the project" lead to wasted sessions. Write "implement X feature" or "fix Y bug" before you open the editor.',
          },
          {
            time: '75 min',
            title: 'Focused build time. No distractions.',
            detail:
              'Single-task. Turn off notifications. If you get stuck for more than 10 minutes, write the exact question you are stuck on, then search for that.',
          },
          {
            time: '10 min',
            title: 'Log what you built. Note blockers.',
            detail:
              'This log becomes your project journal and helps your future self pick up quickly next session.',
          },
        ],
        weekly: 'Weekly: ship at least one visible thing.',
      },
      {
        label: 'Debug session',
        steps: [
          {
            time: '10 min',
            title: 'Write the exact bug and what you expect vs. what you get.',
            detail:
              'Precise problem statements are half the solution. Writing "it crashes" is not useful; "line 42 throws X when input is Y" is.',
          },
          {
            time: '60 min',
            title: 'Debug systematically. Read logs. Add print statements.',
            detail:
              'Work from the outside in. Test the outermost layer first, then drill down. Resist the urge to change multiple things at once.',
          },
          { time: '10 min', title: 'Document what caused it and how you fixed it.', detail: '' },
        ],
        weekly: 'Weekly: no unresolved blockers over 2 days old.',
      },
      {
        label: 'Review + plan',
        steps: [
          {
            time: '20 min',
            title: 'Review what you built this week.',
            detail:
              'Read your own code as if you are a new contributor. Is it readable? Are there obvious improvements?',
          },
          {
            time: '30 min',
            title: "Plan next week's work: write 3-5 concrete tasks.",
            detail:
              'Each task should be small enough to finish in one session. If it is bigger, break it down further.',
          },
          { time: '10 min', title: 'Clean up: remove dead code, update comments.', detail: '' },
        ],
        weekly: 'Weekly: always end with a written plan for next week.',
      },
    ],
  },
  deca: {
    goal: '1.25 hrs / week',
    variants: [
      {
        label: 'Cluster prep',
        steps: [
          {
            time: '25 min',
            title: 'Practice 15 cluster exam questions.',
            detail:
              'Time yourself. Flag every question you are unsure about. Guessing without flagging makes it hard to review effectively.',
          },
          {
            time: '10 min',
            title: 'Review all flagged questions.',
            detail:
              'For each wrong answer, write the principle it tests. Build a formula sheet of the concepts you keep getting wrong.',
          },
          {
            time: '5 min',
            title: 'Pick one principle to memorize cold for next time.',
            detail: '',
          },
        ],
        weekly: 'Weekly: track your score by topic area.',
      },
      {
        label: 'Role-play',
        steps: [
          {
            time: '5 min',
            title: 'Read the scenario carefully twice.',
            detail:
              "Identify: what is the situation, who is the judge's role, what are you being asked to do. Most failures come from misreading the prompt.",
          },
          {
            time: '20 min',
            title: 'Practice your response out loud.',
            detail:
              'Say it out loud, not in your head. Recording yourself and listening back is the fastest way to improve fluency and catch filler words.',
          },
          {
            time: '10 min',
            title: 'Evaluate your response against the judging rubric.',
            detail: '',
          },
        ],
        weekly: 'Weekly: at least 2 full role-play run-throughs.',
      },
    ],
  },
  econ: {
    goal: '0.5 hrs / week',
    variants: [
      {
        label: 'Khan review',
        steps: [
          {
            time: '15 min',
            title: 'Watch one Khan Academy microecon video + take notes.',
            detail:
              'Pause and summarize each concept in your own words before moving on. Passive watching does not stick.',
          },
          { time: '10 min', title: 'Do the Khan practice exercises for that topic.', detail: '' },
          { time: '5 min', title: 'Write the one-sentence takeaway from today.', detail: '' },
        ],
        weekly: 'Weekly: complete one full unit.',
      },
    ],
  },
};

// Keywords matched against sector names (lowercase) to generate subject suggestions.
// The first key whose substring is found in the sector name wins; order matters for specificity.
export const SUBJECT_SUGGESTIONS: Record<string, string[]> = {
  calculus: ['Limits', 'Derivatives', 'Integrals', 'Series', 'Multivariable', 'Differential equations'],
  statistics: ['Probability', 'Distributions', 'Inference', 'Regression', 'Hypothesis testing'],
  algebra: ['Linear equations', 'Quadratics', 'Polynomials', 'Matrices', 'Systems of equations'],
  geometry: ['Proofs', 'Triangles', 'Circles', 'Coordinate geometry', 'Transformations'],
  math: ['Practice set', 'Past exam', 'Concept review', 'Problem set', 'Error review'],
  physics: ['Mechanics', 'Thermodynamics', 'Electromagnetism', 'Optics', 'Modern physics', 'Problem set'],
  chemistry: ['Organic reactions', 'Stoichiometry', 'Thermodynamics', 'Lab work', 'Reaction mechanisms'],
  biology: ['Cell biology', 'Genetics', 'Ecology', 'Anatomy', 'Evolution', 'Lab work'],
  science: ['Problem set', 'Lab work', 'Reading', 'Concept review', 'Lab report'],
  history: ['Primary sources', 'Essay', 'Timeline review', 'Document analysis', 'Lecture notes'],
  english: ['Essay writing', 'Poetry analysis', 'Literary analysis', 'Grammar', 'Research paper', 'Close reading'],
  writing: ['Drafting', 'Editing', 'Outlining', 'Research', 'Revision', 'Citation'],
  reading: ['Textbook', 'Articles', 'Primary sources', 'Notes review', 'Annotation'],
  spanish: ['Vocabulary', 'Listening', 'Speaking', 'Grammar drill', 'Reading passage'],
  french: ['Vocabulary', 'Listening', 'Speaking', 'Grammar drill', 'Reading passage'],
  german: ['Vocabulary', 'Listening', 'Speaking', 'Grammar drill', 'Reading passage'],
  chinese: ['Characters', 'Speaking', 'Listening', 'Grammar', 'Reading passage'],
  japanese: ['Kanji', 'Speaking', 'Listening', 'Grammar', 'Reading passage'],
  language: ['Vocabulary', 'Listening', 'Speaking', 'Grammar', 'Reading', 'Writing practice'],
  programming: ['Problem set', 'Project work', 'Debugging', 'Code review', 'Documentation'],
  computer: ['Algorithm practice', 'Project work', 'Debugging', 'System design', 'Problem set'],
  coding: ['Problem set', 'Project work', 'Debugging', 'Algorithm practice', 'Code review'],
  economics: ['Microeconomics', 'Macroeconomics', 'Problem set', 'Reading', 'Case study'],
  philosophy: ['Reading', 'Essay', 'Argument analysis', 'Logic', 'Passage breakdown'],
  geography: ['Map work', 'Reading', 'Case study', 'Data analysis', 'Essay'],
  music: ['Practice', 'Theory', 'Ear training', 'Sight reading', 'Composition'],
  art: ['Drawing', 'Painting', 'Design', 'Art history', 'Sketching'],
};

// Return subject suggestions for a sector name, ordered by best match.
// Returns an empty array if no keywords match.
export function subjectSuggestionsFor(sectorName: string): string[] {
  const lower = sectorName.toLowerCase();
  for (const [key, subs] of Object.entries(SUBJECT_SUGGESTIONS)) {
    if (lower.includes(key)) return subs;
  }
  return [];
}

export const CAT_PALETTE = [
  '#4A6FA5',
  '#6C8EBF',
  '#A3B899',
  '#C9A06B',
  '#B0857F',
  '#9A9A92',
  '#7A9E87',
  '#8B7BAB',
];

// Generic starter setup loaded by the "Autofill my setup" button. Edit this to
// change the template. It is intentionally generic, not anyone's real subjects.
export interface StarterTemplate {
  sectors: { name: string; goalH: number; color: string; subjects: string[] }[];
  methods: string[];
  plans: { title: string; steps: string[] }[];
}

export const STARTER_TEMPLATE: StarterTemplate = {
  sectors: [
    { name: 'Mathematics', goalH: 3, color: '#5C7FB0', subjects: ['Practice set', 'Past exam', 'Concept review'] },
    { name: 'Reading', goalH: 2, color: '#94AC88', subjects: ['Textbook', 'Articles', 'Notes review'] },
    { name: 'Writing', goalH: 1.5, color: '#C2803A', subjects: ['Drafting', 'Editing', 'Outlining'] },
    { name: 'Science', goalH: 2, color: '#6C8EBF', subjects: ['Problem set', 'Lab work', 'Reading'] },
    { name: 'Languages', goalH: 1, color: '#B0857F', subjects: ['Vocabulary', 'Listening', 'Speaking'] },
    { name: 'Other', goalH: 0, color: '#9A9A92', subjects: [] },
  ],
  methods: [...METHODS],
  plans: [
    {
      title: 'Focused study block',
      steps: [
        '5 min: review what you did last session',
        '40 min: deep work on the hardest task',
        '10 min: practice problems or active recall',
        '5 min: write the one takeaway from today',
      ],
    },
    {
      title: 'Exam prep day',
      steps: [
        '20 min: timed practice section',
        '20 min: review every mistake and why',
        '20 min: redo the missed problems',
      ],
    },
  ],
};
