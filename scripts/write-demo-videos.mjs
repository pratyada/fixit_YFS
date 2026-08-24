// Batch-write demo video links into the Firestore `exercises` collection.
// Input: scripts/demo-videos.txt — pipe rows "id | https://youtube watch url | channel | note"
// Each row's URL is normalised to an embeddable form and stored as demoVideoUrl,
// exactly like the in-app "paste a link" flow, so ExerciseDetail renders it.
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { EXERCISE_LIBRARY } from '../src/data/exercises.js';
import { FIXIT_EXERCISES } from '../src/data/fixit-exercises.js';

const sa = JSON.parse(readFileSync('./key/fixit-6167d-firebase-adminsdk-fbsvc-67b83f4693.json', 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

// id → {name, bodyPart} so we can backfill these onto the exercise doc.
// getExercises() orders by `name`, so a doc WITHOUT a name is invisible to the app.
const META = {};
for (const e of [...FIXIT_EXERCISES, ...EXERCISE_LIBRARY]) META[e.id] = { name: e.name, bodyPart: e.bodyPart };

function normalizeVideoUrl(raw) {
  const u = raw.trim();
  const yt = u.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vim = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vim) return `https://player.vimeo.com/video/${vim[1]}`;
  return u;
}

const rows = readFileSync('./scripts/demo-videos.txt', 'utf8')
  .split('\n').map(l => l.trim()).filter(l => l && l.includes('|'));

let written = 0, skipped = 0;
for (const line of rows) {
  const [id, url, channel = '', note = ''] = line.split('|').map(s => s.trim());
  if (!id || !url || /^NONE$/i.test(url)) { console.log('SKIP', id, '(no url)'); skipped++; continue; }
  const embed = normalizeVideoUrl(url);
  const meta = META[id] || {};
  await db.collection('exercises').doc(id).set({
    ...(meta.name ? { name: meta.name } : {}),          // required so getExercises() (orderBy name) returns it
    ...(meta.bodyPart ? { bodyPart: meta.bodyPart } : {}),
    demoVideoUrl: embed,
    demoVideoPath: null,
    demoVideoSource: 'youtube-curated',
    demoVideoChannel: channel,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
  console.log('OK  ', id, '→', embed, channel ? '(' + channel + ')' : '');
  written++;
}
console.log(`\nDONE — wrote ${written}, skipped ${skipped}`);
process.exit(0);
