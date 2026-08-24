// Regenerate src/data/exercise-videos.js — a static snapshot of demo video URLs
// (from Firestore) for the PUBLIC, Firebase-free exercise pages + prerender.
import admin from 'firebase-admin';
import { readFileSync, writeFileSync } from 'fs';
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(readFileSync('./key/fixit-6167d-firebase-adminsdk-fbsvc-67b83f4693.json','utf8'))) });
const db = admin.firestore();
const snap = await db.collection('exercises').get();
const map = {};
snap.forEach(d => { const v = d.data().demoVideoUrl; if (v) map[d.id] = v; });
const keys = Object.keys(map).sort();
const body = keys.map(k => '  ' + JSON.stringify(k) + ': ' + JSON.stringify(map[k]) + ',').join('\n');
writeFileSync('./src/data/exercise-videos.js',
  '// AUTO-GENERATED snapshot of exercise demo video URLs (from Firestore) so the\n// PUBLIC (Firebase-free) exercise pages + prerender can embed them for SEO.\n// Regenerate: node scripts/gen-exercise-videos.mjs\nexport const EXERCISE_VIDEOS = {\n' + body + '\n};\n');
console.log('wrote', keys.length, 'video URLs');
process.exit(0);
