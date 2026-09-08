// Generates rich, UNIQUE per-exercise content from each exercise's own data
// (muscles, goals, conditions, difficulty, equipment, sets/reps, tips…), so the
// public /exercise/<id> pages read as substantial + distinct rather than
// templated. Shared by PublicExercise.jsx (render) and routes.js (FAQ schema).

const list = (arr) => {
  const a = (arr || []).filter(Boolean);
  if (!a.length) return '';
  if (a.length === 1) return a[0];
  if (a.length === 2) return `${a[0]} and ${a[1]}`;
  return `${a.slice(0, -1).join(', ')}, and ${a[a.length - 1]}`;
};
const lower = (s) => (s || '').toString().toLowerCase();

export function enrichExercise(ex) {
  const region = ex.bodyPart || 'body';
  const muscles = ex.musclesTargeted || [];
  const goals = ex.goals || [];
  const conditions = ex.conditions || [];
  const diff = ex.difficulty || 'all-level';
  const equip = ex.equipment && ex.equipment !== 'None' ? ex.equipment : null;

  // Intro — woven from the exercise's real attributes.
  const introParts = [];
  introParts.push(`The ${ex.name} is a ${lower(diff)} ${lower(region)} exercise${muscles.length ? ` that targets the ${list(muscles).toLowerCase()}` : ''}.`);
  if (ex.description) introParts.push(ex.description);
  if (conditions.length) introParts.push(`It's commonly prescribed during rehabilitation for ${list(conditions).toLowerCase()}.`);
  else if (goals.length) introParts.push(`It's used to build ${list(goals).toLowerCase()}.`);
  introParts.push(`Below is how to do the ${ex.name} with correct form, plus the benefits, common mistakes, and how many reps to aim for.`);
  const intro = introParts.join(' ');

  // Benefits — from goals, muscles, conditions.
  const benefits = [];
  if (muscles.length) benefits.push(`Strengthens and activates the ${list(muscles).toLowerCase()}`);
  goals.forEach((g) => benefits.push(`Improves ${lower(g)}`));
  if (conditions.length) benefits.push(`Supports recovery and rehab for ${list(conditions).toLowerCase()}`);
  benefits.push(`Can be done ${equip ? `with simple equipment (${lower(equip)})` : 'at home with no equipment'}`);
  if (ex.position) benefits.push(`Performed ${lower(ex.position)}, so it's easy to set up`);

  // Sets & reps guidance.
  let dosage = '';
  if (ex.sets && ex.reps) dosage = `A common starting point is ${ex.sets} sets of ${ex.reps} reps`;
  if (ex.holdSeconds) dosage += `${dosage ? ', ' : 'Hold '}holding each for about ${ex.holdSeconds} seconds`;
  dosage = (dosage || 'Follow your practitioner\'s prescription for volume') + '. Progress gradually and stop if you feel sharp pain.';

  // Who it's for.
  const whoFor = conditions.length
    ? `The ${ex.name} is often included in programs for people recovering from ${list(conditions).toLowerCase()}, and for anyone wanting to strengthen the ${lower(region)}. It's rated ${lower(diff)}.`
    : `The ${ex.name} suits ${lower(diff)} exercisers looking to strengthen the ${lower(region)}${goals.length ? ` and improve ${list(goals).toLowerCase()}` : ''}.`;

  // FAQs — data-true, unique per exercise. Also power FAQPage structured data.
  const faqs = [];
  if (muscles.length) faqs.push({ q: `What muscles does the ${ex.name} work?`, a: `The ${ex.name} primarily targets the ${list(muscles).toLowerCase()}.` });
  faqs.push({ q: `How many sets and reps of the ${ex.name} should I do?`, a: dosage });
  if (conditions.length) faqs.push({ q: `Is the ${ex.name} good for ${lower(conditions[0])}?`, a: `Yes — the ${ex.name} is commonly used in rehab for ${lower(conditions[0])}${conditions.length > 1 ? ` and ${lower(conditions[1])}` : ''}. Confirm with your clinician before starting, especially if you have pain.` });
  faqs.push({ q: `Do I need equipment for the ${ex.name}?`, a: equip ? `You'll need: ${lower(equip)}.` : `No — the ${ex.name} needs no equipment and can be done at home.` });
  if (ex.contraindications?.length) faqs.push({ q: `When should I avoid the ${ex.name}?`, a: `Take care or skip it if you have: ${list(ex.contraindications).toLowerCase()}. When in doubt, check with your physiotherapist.` });

  return { intro, benefits, dosage, whoFor, faqs };
}
