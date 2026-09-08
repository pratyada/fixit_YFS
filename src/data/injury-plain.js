// Plain-language translations so a patient understands THEIR OWN injury —
// "what is it, what does it mean, what do I do" — without clinical jargon.
// Used by the patient Know Your Injury page.

// Per-structure everyday explanations (knee-first; extend as regions are added).
export const STRUCTURE_PLAIN = {
  acl: { layer: 'ligament', emoji: '🎗️', what: 'Your ACL is a strong band deep inside your knee that stops your shin bone from sliding forward. It keeps your knee stable when you turn, pivot, or land — which is why athletes often injure it.' },
  pcl: { layer: 'ligament', emoji: '🎗️', what: 'Your PCL is a band inside the knee that stops your shin from sliding backward. It works together with the ACL to keep the knee steady.' },
  mcl: { layer: 'ligament', emoji: '🎗️', what: 'Your MCL runs along the inner side of your knee and stops it buckling inward. It\'s often sprained by a blow to the outside of the knee.' },
  lcl: { layer: 'ligament', emoji: '🎗️', what: 'Your LCL runs along the outer side of your knee and stops it bowing outward.' },
  medial_meniscus: { layer: 'cartilage', emoji: '🛡️', what: 'Your meniscus is a C-shaped cushion of cartilage that sits between your thigh and shin bones — a shock absorber for the knee. This is the inner one, commonly injured by twisting.' },
  lateral_meniscus: { layer: 'cartilage', emoji: '🛡️', what: 'Your meniscus is a C-shaped cushion of cartilage that absorbs shock in the knee. This is the outer one.' },
  patellar_tendon: { layer: 'tendon', emoji: '🔗', what: 'Your patellar tendon connects your kneecap to your shin bone. It\'s what lets you straighten your knee and absorb impact when you jump or run.' },
  patella: { layer: 'bone', emoji: '🦴', what: 'Your patella is your kneecap. It glides in front of the knee and protects the joint while helping your thigh muscles straighten the leg.' },
  femur: { layer: 'bone', emoji: '🦴', what: 'Your femur is your thigh bone — it forms the top half of the knee joint.' },
  tibia: { layer: 'bone', emoji: '🦴', what: 'Your tibia is your shin bone — the main weight-bearing bone below the knee.' },
  fibula: { layer: 'bone', emoji: '🦴', what: 'Your fibula is the slender bone on the outer side of your lower leg.' },
  quadriceps: { layer: 'muscle', emoji: '💪', what: 'Your quadriceps are the muscles on the front of your thigh. They straighten your knee and are key to walking, squatting, and stairs.' },
  hamstrings: { layer: 'muscle', emoji: '💪', what: 'Your hamstrings are the muscles at the back of your thigh. They bend your knee and support the ACL.' },
  gastrocnemius: { layer: 'muscle', emoji: '💪', what: 'Your calf muscle helps point your foot and stabilise the knee and ankle.' },
};

// Fallback by tissue type when a specific structure isn't mapped.
export const LAYER_PLAIN = {
  ligament: 'A ligament is a tough band that connects bone to bone and keeps the joint stable.',
  tendon: 'A tendon is a strong cord that connects muscle to bone so your muscles can move the joint.',
  cartilage: 'Cartilage is smooth, cushioning tissue that lets the joint glide and absorbs shock.',
  bone: 'A bone gives your body structure and forms the joint.',
  muscle: 'A muscle contracts to move and stabilise the joint.',
  nerve: 'A nerve carries signals between your brain and body — for movement and sensation.',
  vessel: 'A blood vessel carries blood to and from the tissues to help them work and heal.',
};

// What the injury type means, in everyday words.
export const INJURY_TYPE_PLAIN = {
  Tear: 'a tear means the tissue is partly or fully split',
  Sprain: 'a sprain means a ligament has been overstretched or partly torn',
  Strain: 'a strain means a muscle or tendon has been overstretched',
  Inflammation: 'inflammation means the area is irritated and swollen',
  Arthritis: 'arthritis means the joint\'s cushioning has worn down over time',
  Tendinopathy: 'tendinopathy means the tendon is irritated and weakened from overuse',
  Rupture: 'a rupture means the tissue is completely torn',
  Fracture: 'a fracture means the bone is cracked or broken',
};

export const GRADE_PLAIN = {
  '1': 'mild', '2': 'moderate', '3': 'severe', 'I': 'mild', 'II': 'moderate', 'III': 'severe',
};

export const STATUS_PLAIN = {
  acute: { label: 'Recently injured', tone: 'red', note: 'This is fresh. Protect it, avoid aggravating movements, and do only the gentle exercises your practitioner assigned.' },
  healing: { label: 'Healing', tone: 'amber', note: 'You\'re on the mend. Keep doing your exercises consistently — that\'s what rebuilds strength and stability.' },
  recovered: { label: 'Recovered', tone: 'green', note: 'Great progress! Keep up maintenance exercises to stay strong and avoid re-injury.' },
};

// Build a friendly summary for one injury record.
export function plainInjury(inj) {
  const key = inj.structureId || '';
  const s = STRUCTURE_PLAIN[key] || {};
  const layer = s.layer || 'ligament';
  const what = s.what || LAYER_PLAIN[layer] || '';
  const emoji = s.emoji || '🩹';

  const grade = inj.grade ? (GRADE_PLAIN[String(inj.grade)] || `grade ${inj.grade}`) : '';
  const typePlain = INJURY_TYPE_PLAIN[inj.injuryType] || (inj.injuryType ? `${inj.injuryType.toLowerCase()}` : 'an injury');
  const meaning = `You have ${grade ? grade + ' ' : ''}${(inj.injuryType || 'damage').toLowerCase()}${inj.side ? ` in your ${inj.side.toLowerCase()} side` : ''} — ${typePlain}.`;

  const status = STATUS_PLAIN[inj.status] || STATUS_PLAIN.acute;
  const title = `${inj.structureName || 'Injury'}${inj.injuryType ? ` — ${inj.injuryType}` : ''}${grade ? ` (${grade})` : ''}`;

  return { emoji, title, what, meaning, status };
}
