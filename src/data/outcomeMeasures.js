// ─── Standardized Outcome Measures ───
// Validated questionnaires used by physiotherapists to track patient progress.
// Each has questions, scoring instructions, and interpretation.

export const OUTCOME_MEASURES = [
  // ════════════════════════════════════════════════════════
  //                          KOOS
  // ════════════════════════════════════════════════════════
  {
    id: 'koos-jr',
    name: 'KOOS-JR (Knee)',
    fullName: 'Knee Injury and Osteoarthritis Outcome Score — Joint Replacement',
    bodyPart: 'Knee',
    description: 'Short 7-item knee questionnaire used to track pain and function for knee conditions.',
    instructions: 'For each question, choose the answer that best describes your knee in the past week.',
    estimatedTime: '3 min',
    scoring: 'Higher score = better knee function (0-100 scale)',
    questions: [
      { id: 'q1', text: 'How often do you experience knee pain?', options: ['Never', 'Monthly', 'Weekly', 'Daily', 'Always'] },
      { id: 'q2', text: 'How would you rate the stiffness in your knee in the morning after waking?', options: ['None', 'Mild', 'Moderate', 'Severe', 'Extreme'] },
      { id: 'q3', text: 'Straightening your knee fully — what level of difficulty?', options: ['None', 'Mild', 'Moderate', 'Severe', 'Extreme'] },
      { id: 'q4', text: 'Bending your knee fully — what level of difficulty?', options: ['None', 'Mild', 'Moderate', 'Severe', 'Extreme'] },
      { id: 'q5', text: 'Going up or down stairs — what level of difficulty?', options: ['None', 'Mild', 'Moderate', 'Severe', 'Extreme'] },
      { id: 'q6', text: 'Standing upright — what level of difficulty?', options: ['None', 'Mild', 'Moderate', 'Severe', 'Extreme'] },
      { id: 'q7', text: 'Getting in/out of a car — what level of difficulty?', options: ['None', 'Mild', 'Moderate', 'Severe', 'Extreme'] },
    ],
    // Each option scores 0-4. Sum -> normalized to 0-100 (100 = best)
    calculate: (responses) => {
      const total = responses.reduce((sum, r) => sum + (r ?? 0), 0);
      const max = 28; // 7 questions × 4
      const raw = (1 - total / max) * 100;
      return Math.round(raw);
    },
    interpret: (score) => {
      if (score >= 85) return { level: 'Excellent', color: '#4CAF50', text: 'Minimal symptoms — keep up the good work!' };
      if (score >= 70) return { level: 'Good', color: '#8BC34A', text: 'Mild symptoms, generally functional' };
      if (score >= 50) return { level: 'Moderate', color: '#FFC107', text: 'Notable symptoms affecting daily life' };
      if (score >= 30) return { level: 'Poor', color: '#FF9800', text: 'Significant impairment — discuss with your physio' };
      return { level: 'Severe', color: '#F44336', text: 'Severe symptoms — seek prompt evaluation' };
    },
  },

  // ════════════════════════════════════════════════════════
  //                       OSWESTRY
  // ════════════════════════════════════════════════════════
  {
    id: 'oswestry',
    name: 'Oswestry Disability Index',
    fullName: 'Oswestry Low Back Pain Disability Questionnaire',
    bodyPart: 'Back',
    description: 'Standard 10-section questionnaire for measuring disability from low back pain.',
    instructions: 'For each section, choose the ONE statement that best describes your situation today.',
    estimatedTime: '5 min',
    scoring: 'Lower score = less disability (0-100 scale)',
    questions: [
      {
        id: 'q1', text: 'Pain Intensity', options: [
          'I have no pain at the moment',
          'The pain is very mild',
          'The pain is moderate',
          'The pain is fairly severe',
          'The pain is very severe',
          'The pain is the worst imaginable',
        ],
      },
      {
        id: 'q2', text: 'Personal Care (washing, dressing)', options: [
          'I can look after myself normally without causing extra pain',
          'I can look after myself normally but it is very painful',
          'It is painful and I am slow and careful',
          'I need some help but manage most personal care',
          'I need help every day in most personal care',
          'I do not get dressed, wash with difficulty, stay in bed',
        ],
      },
      {
        id: 'q3', text: 'Lifting', options: [
          'I can lift heavy weights without extra pain',
          'I can lift heavy weights but it gives extra pain',
          'Pain prevents lifting heavy weights but I can manage if positioned',
          'Pain prevents lifting heavy weights but I can manage light weights',
          'I can only lift very light weights',
          'I cannot lift or carry anything at all',
        ],
      },
      {
        id: 'q4', text: 'Walking', options: [
          'Pain does not prevent me walking any distance',
          'Pain prevents me walking more than 1 mile',
          'Pain prevents me walking more than 1/4 mile',
          'Pain prevents me walking more than 100 yards',
          'I can only walk using a stick or crutches',
          'I am in bed most of the time',
        ],
      },
      {
        id: 'q5', text: 'Sitting', options: [
          'I can sit in any chair as long as I like',
          'I can sit in my favorite chair as long as I like',
          'Pain prevents me from sitting more than 1 hour',
          'Pain prevents me from sitting more than 1/2 hour',
          'Pain prevents me from sitting more than 10 minutes',
          'Pain prevents me from sitting at all',
        ],
      },
      {
        id: 'q6', text: 'Standing', options: [
          'I can stand as long as I want without extra pain',
          'I can stand as long as I want but it gives extra pain',
          'Pain prevents me from standing more than 1 hour',
          'Pain prevents me from standing more than 1/2 hour',
          'Pain prevents me from standing more than 10 minutes',
          'Pain prevents me from standing at all',
        ],
      },
      {
        id: 'q7', text: 'Sleeping', options: [
          'My sleep is never disturbed by pain',
          'My sleep is occasionally disturbed by pain',
          'Because of pain I have less than 6 hours of sleep',
          'Because of pain I have less than 4 hours of sleep',
          'Because of pain I have less than 2 hours of sleep',
          'Pain prevents me from sleeping at all',
        ],
      },
      {
        id: 'q8', text: 'Social Life', options: [
          'My social life is normal and gives no extra pain',
          'My social life is normal but increases pain',
          'Pain restricts more energetic activities (sports)',
          'Pain restricts me to going out less often',
          'Pain restricts social life to my home',
          'I have no social life because of pain',
        ],
      },
      {
        id: 'q9', text: 'Traveling', options: [
          'I can travel anywhere without pain',
          'I can travel anywhere but it gives extra pain',
          'Pain restricts me to journeys of less than 2 hours',
          'Pain restricts me to journeys of less than 1 hour',
          'Pain restricts me to short necessary journeys under 30 minutes',
          'Pain prevents me from traveling except to receive treatment',
        ],
      },
      {
        id: 'q10', text: 'Employment / Homemaking', options: [
          'My normal job/housework activities do not cause pain',
          'My normal activities increase pain but I can manage all of them',
          'I can do most activities but pain prevents more physically stressful ones',
          'Pain prevents me from doing anything but light duties',
          'Pain prevents me from doing even light duties',
          'Pain prevents me from performing any job or housework',
        ],
      },
    ],
    calculate: (responses) => {
      const total = responses.reduce((sum, r) => sum + (r ?? 0), 0);
      const max = 50; // 10 sections × 5
      return Math.round((total / max) * 100);
    },
    interpret: (score) => {
      if (score <= 20) return { level: 'Minimal', color: '#4CAF50', text: 'Minimal disability — manage daily activities well' };
      if (score <= 40) return { level: 'Moderate', color: '#FFC107', text: 'Moderate disability — pain and difficulty with some activities' };
      if (score <= 60) return { level: 'Severe', color: '#FF9800', text: 'Severe disability — pain is the main problem' };
      if (score <= 80) return { level: 'Crippled', color: '#F44336', text: 'Pain impinges on all aspects of life' };
      return { level: 'Bed-bound', color: '#B71C1C', text: 'Bed-bound or symptom exaggeration — consult provider' };
    },
  },

  // ════════════════════════════════════════════════════════
  //                          NDI
  // ════════════════════════════════════════════════════════
  {
    id: 'ndi',
    name: 'Neck Disability Index',
    fullName: 'Neck Disability Index (NDI)',
    bodyPart: 'Neck',
    description: '10-section questionnaire measuring how neck pain affects your daily life.',
    instructions: 'For each section, select the statement that best describes you today.',
    estimatedTime: '5 min',
    scoring: 'Lower score = less disability (0-100 scale)',
    questions: [
      {
        id: 'q1', text: 'Pain Intensity', options: [
          'I have no pain at the moment',
          'The pain is very mild',
          'The pain is moderate',
          'The pain is fairly severe',
          'The pain is very severe',
          'The pain is the worst imaginable',
        ],
      },
      {
        id: 'q2', text: 'Personal Care', options: [
          'I can look after myself normally without extra pain',
          'I can look after myself normally but it causes extra pain',
          'It is painful to look after myself, I am slow and careful',
          'I need some help but manage most personal care',
          'I need help daily in most aspects of self care',
          'I do not get dressed, I wash with difficulty, I stay in bed',
        ],
      },
      {
        id: 'q3', text: 'Lifting', options: [
          'I can lift heavy weights without extra pain',
          'I can lift heavy weights but it gives extra pain',
          'Pain prevents heavy lifting but I manage if conveniently positioned',
          'Pain prevents heavy lifting but I can manage light to medium weights',
          'I can lift very light weights',
          'I cannot lift or carry anything',
        ],
      },
      {
        id: 'q4', text: 'Reading', options: [
          'I can read as much as I want with no neck pain',
          'I can read as much as I want with slight neck pain',
          'I can read as much as I want with moderate neck pain',
          'I cannot read as much as I want due to moderate neck pain',
          'I can hardly read at all due to severe neck pain',
          'I cannot read at all',
        ],
      },
      {
        id: 'q5', text: 'Headaches', options: [
          'I have no headaches at all',
          'I have slight headaches that come infrequently',
          'I have moderate headaches that come infrequently',
          'I have moderate headaches that come frequently',
          'I have severe headaches that come frequently',
          'I have headaches almost all the time',
        ],
      },
      {
        id: 'q6', text: 'Concentration', options: [
          'I can concentrate fully when I want with no difficulty',
          'I can concentrate fully when I want with slight difficulty',
          'I have a fair degree of difficulty concentrating',
          'I have a lot of difficulty concentrating',
          'I have a great deal of difficulty concentrating',
          'I cannot concentrate at all',
        ],
      },
      {
        id: 'q7', text: 'Work', options: [
          'I can do as much work as I want',
          'I can only do my usual work but no more',
          'I can do most of my usual work but no more',
          'I cannot do my usual work',
          'I can hardly do any work',
          'I cannot do any work at all',
        ],
      },
      {
        id: 'q8', text: 'Driving', options: [
          'I can drive without any neck pain',
          'I can drive as long as I want with slight pain',
          'I can drive as long as I want with moderate pain',
          'I cannot drive as long as I want due to moderate pain',
          'I can hardly drive due to severe neck pain',
          'I cannot drive at all',
        ],
      },
      {
        id: 'q9', text: 'Sleeping', options: [
          'I have no trouble sleeping',
          'My sleep is slightly disturbed (less than 1 hr sleeplessness)',
          'My sleep is mildly disturbed (1-2 hrs sleeplessness)',
          'My sleep is moderately disturbed (2-3 hrs sleeplessness)',
          'My sleep is greatly disturbed (3-5 hrs sleeplessness)',
          'My sleep is completely disturbed (5-7 hrs sleeplessness)',
        ],
      },
      {
        id: 'q10', text: 'Recreation', options: [
          'I can engage in all my recreation activities with no neck pain',
          'I can engage in all my recreation activities with some pain',
          'I can engage in most but not all due to neck pain',
          'I can engage in only a few of my activities due to neck pain',
          'I can hardly do any recreation due to neck pain',
          'I cannot do any recreation activities at all',
        ],
      },
    ],
    calculate: (responses) => {
      const total = responses.reduce((sum, r) => sum + (r ?? 0), 0);
      const max = 50;
      return Math.round((total / max) * 100);
    },
    interpret: (score) => {
      if (score <= 8) return { level: 'No disability', color: '#4CAF50', text: 'No disability from neck pain' };
      if (score <= 28) return { level: 'Mild', color: '#8BC34A', text: 'Mild disability — usually managed conservatively' };
      if (score <= 48) return { level: 'Moderate', color: '#FFC107', text: 'Moderate disability — focused therapy recommended' };
      if (score <= 68) return { level: 'Severe', color: '#FF9800', text: 'Severe disability — investigation needed' };
      return { level: 'Complete', color: '#F44336', text: 'Complete disability — comprehensive workup' };
    },
  },

  // ════════════════════════════════════════════════════════
  //                       DASH
  // ════════════════════════════════════════════════════════
  {
    id: 'quickdash',
    name: 'QuickDASH (Arm)',
    fullName: 'Quick Disabilities of the Arm, Shoulder and Hand',
    bodyPart: 'Shoulder',
    description: 'Short 11-item questionnaire measuring upper extremity disability.',
    instructions: 'For each item, rate your ability or difficulty over the past week.',
    estimatedTime: '4 min',
    scoring: 'Lower score = better function (0-100)',
    questions: [
      { id: 'q1', text: 'Open a tight or new jar', options: ['No difficulty', 'Mild difficulty', 'Moderate difficulty', 'Severe difficulty', 'Unable'] },
      { id: 'q2', text: 'Do heavy household chores (e.g., wash walls, floors)', options: ['No difficulty', 'Mild difficulty', 'Moderate difficulty', 'Severe difficulty', 'Unable'] },
      { id: 'q3', text: 'Carry a shopping bag or briefcase', options: ['No difficulty', 'Mild difficulty', 'Moderate difficulty', 'Severe difficulty', 'Unable'] },
      { id: 'q4', text: 'Wash your back', options: ['No difficulty', 'Mild difficulty', 'Moderate difficulty', 'Severe difficulty', 'Unable'] },
      { id: 'q5', text: 'Use a knife to cut food', options: ['No difficulty', 'Mild difficulty', 'Moderate difficulty', 'Severe difficulty', 'Unable'] },
      { id: 'q6', text: 'Recreational activities requiring force/impact through arm', options: ['No difficulty', 'Mild difficulty', 'Moderate difficulty', 'Severe difficulty', 'Unable'] },
      { id: 'q7', text: 'Did your arm/shoulder/hand interfere with normal social activities?', options: ['Not at all', 'Slightly', 'Moderately', 'Quite a bit', 'Extremely'] },
      { id: 'q8', text: 'Were you limited in work or other regular activities?', options: ['Not limited', 'Slightly limited', 'Moderately limited', 'Very limited', 'Unable'] },
      { id: 'q9', text: 'Arm/shoulder/hand pain', options: ['None', 'Mild', 'Moderate', 'Severe', 'Extreme'] },
      { id: 'q10', text: 'Tingling (pins and needles) in arm/shoulder/hand', options: ['None', 'Mild', 'Moderate', 'Severe', 'Extreme'] },
      { id: 'q11', text: 'Difficulty sleeping due to arm/shoulder/hand pain', options: ['No difficulty', 'Mild difficulty', 'Moderate difficulty', 'Severe difficulty', 'So much difficulty I cannot sleep'] },
    ],
    calculate: (responses) => {
      const valid = responses.filter(r => r != null);
      if (valid.length < 10) return null;
      const sum = valid.reduce((a, b) => a + b + 1, 0); // QuickDASH uses 1-5 not 0-4
      const score = ((sum / valid.length) - 1) * 25;
      return Math.round(score);
    },
    interpret: (score) => {
      if (score == null) return { level: 'Incomplete', color: '#888', text: 'Need at least 10 of 11 answers' };
      if (score <= 15) return { level: 'Minimal', color: '#4CAF50', text: 'Minimal disability' };
      if (score <= 40) return { level: 'Mild', color: '#8BC34A', text: 'Mild disability' };
      if (score <= 60) return { level: 'Moderate', color: '#FFC107', text: 'Moderate disability' };
      if (score <= 80) return { level: 'Severe', color: '#FF9800', text: 'Severe disability' };
      return { level: 'Extreme', color: '#F44336', text: 'Extreme disability' };
    },
  },

  // ════════════════════════════════════════════════════════
  //                          LEFS
  // ════════════════════════════════════════════════════════
  {
    id: 'lefs',
    name: 'LEFS (Lower Extremity)',
    fullName: 'Lower Extremity Functional Scale',
    bodyPart: 'Hip',
    description: '20-item scale measuring lower extremity function. Use for hip, knee, ankle, foot.',
    instructions: 'Rate the difficulty of each activity TODAY due to your lower limb problem.',
    estimatedTime: '5 min',
    scoring: 'Higher score = better function (0-80)',
    questions: [
      { id: 'q1', text: 'Any of your usual work, housework or school activities', options: ['Extreme difficulty', 'Quite a bit', 'Moderate', 'A little bit', 'No difficulty'] },
      { id: 'q2', text: 'Your usual hobbies, recreational or sporting activities', options: ['Extreme difficulty', 'Quite a bit', 'Moderate', 'A little bit', 'No difficulty'] },
      { id: 'q3', text: 'Getting into or out of the bath', options: ['Extreme difficulty', 'Quite a bit', 'Moderate', 'A little bit', 'No difficulty'] },
      { id: 'q4', text: 'Walking between rooms', options: ['Extreme difficulty', 'Quite a bit', 'Moderate', 'A little bit', 'No difficulty'] },
      { id: 'q5', text: 'Putting on your shoes or socks', options: ['Extreme difficulty', 'Quite a bit', 'Moderate', 'A little bit', 'No difficulty'] },
      { id: 'q6', text: 'Squatting', options: ['Extreme difficulty', 'Quite a bit', 'Moderate', 'A little bit', 'No difficulty'] },
      { id: 'q7', text: 'Lifting an object like a bag of groceries from the floor', options: ['Extreme difficulty', 'Quite a bit', 'Moderate', 'A little bit', 'No difficulty'] },
      { id: 'q8', text: 'Performing light activities around your home', options: ['Extreme difficulty', 'Quite a bit', 'Moderate', 'A little bit', 'No difficulty'] },
      { id: 'q9', text: 'Performing heavy activities around your home', options: ['Extreme difficulty', 'Quite a bit', 'Moderate', 'A little bit', 'No difficulty'] },
      { id: 'q10', text: 'Getting into or out of a car', options: ['Extreme difficulty', 'Quite a bit', 'Moderate', 'A little bit', 'No difficulty'] },
      { id: 'q11', text: 'Walking 2 blocks', options: ['Extreme difficulty', 'Quite a bit', 'Moderate', 'A little bit', 'No difficulty'] },
      { id: 'q12', text: 'Walking a mile', options: ['Extreme difficulty', 'Quite a bit', 'Moderate', 'A little bit', 'No difficulty'] },
      { id: 'q13', text: 'Going up or down 10 stairs', options: ['Extreme difficulty', 'Quite a bit', 'Moderate', 'A little bit', 'No difficulty'] },
      { id: 'q14', text: 'Standing for 1 hour', options: ['Extreme difficulty', 'Quite a bit', 'Moderate', 'A little bit', 'No difficulty'] },
      { id: 'q15', text: 'Sitting for 1 hour', options: ['Extreme difficulty', 'Quite a bit', 'Moderate', 'A little bit', 'No difficulty'] },
      { id: 'q16', text: 'Running on even ground', options: ['Extreme difficulty', 'Quite a bit', 'Moderate', 'A little bit', 'No difficulty'] },
      { id: 'q17', text: 'Running on uneven ground', options: ['Extreme difficulty', 'Quite a bit', 'Moderate', 'A little bit', 'No difficulty'] },
      { id: 'q18', text: 'Making sharp turns while running fast', options: ['Extreme difficulty', 'Quite a bit', 'Moderate', 'A little bit', 'No difficulty'] },
      { id: 'q19', text: 'Hopping', options: ['Extreme difficulty', 'Quite a bit', 'Moderate', 'A little bit', 'No difficulty'] },
      { id: 'q20', text: 'Rolling over in bed', options: ['Extreme difficulty', 'Quite a bit', 'Moderate', 'A little bit', 'No difficulty'] },
    ],
    calculate: (responses) => {
      const total = responses.reduce((sum, r) => sum + (r ?? 0), 0);
      return total; // 0-80
    },
    interpret: (score) => {
      if (score >= 65) return { level: 'Minimal', color: '#4CAF50', text: 'Minimal limitation' };
      if (score >= 50) return { level: 'Mild', color: '#8BC34A', text: 'Mild functional limitation' };
      if (score >= 30) return { level: 'Moderate', color: '#FFC107', text: 'Moderate functional limitation' };
      if (score >= 15) return { level: 'Severe', color: '#FF9800', text: 'Severe functional limitation' };
      return { level: 'Maximum', color: '#F44336', text: 'Maximum limitation — comprehensive evaluation' };
    },
  },
];

export function getMeasureById(id) {
  return OUTCOME_MEASURES.find(m => m.id === id);
}

export function getMeasuresByBodyPart(bodyPart) {
  return OUTCOME_MEASURES.filter(m => m.bodyPart === bodyPart);
}
