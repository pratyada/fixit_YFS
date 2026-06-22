// Update Leaderboard — computes rankings for the current 15-day period
// Triggered by EventBridge schedule (every 4 hours)

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}
const db = getFirestore();

function getCurrentPeriod() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  const day = now.getDate();

  let periodStart, periodEnd;
  if (day <= 15) {
    periodStart = new Date(year, month, 1);
    periodEnd = new Date(year, month, 15, 23, 59, 59, 999);
  } else {
    periodStart = new Date(year, month, 16);
    periodEnd = new Date(year, month + 1, 0, 23, 59, 59, 999); // last day of month
  }

  const periodId = `${periodStart.toISOString().split('T')[0]}_${periodEnd.toISOString().split('T')[0]}`;
  const periodLabel = `${periodStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${periodEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  return { periodId, periodStart, periodEnd, periodLabel };
}

function privacyName(name, email) {
  if (name) {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0]} ${parts[parts.length - 1][0]}.`;
    return parts[0];
  }
  if (email) return email.split('@')[0];
  return 'Anonymous';
}

export const handler = async () => {
  try {
    const { periodId, periodStart, periodEnd, periodLabel } = getCurrentPeriod();
    const now = new Date();

    // Check if period has ended — if so, finalize previous period
    const prevPeriodSnap = await db.collection('leaderboards')
      .where('status', '==', 'active')
      .get();

    for (const doc of prevPeriodSnap.docs) {
      const data = doc.data();
      const end = data.periodEnd?.toDate ? data.periodEnd.toDate() : new Date(data.periodEnd);
      if (end < now && doc.id !== periodId) {
        // Finalize this old period
        const winners = {};
        if (data.bestForm?.length > 0) winners.bestForm = data.bestForm[0];
        if (data.mostSessions?.length > 0) winners.mostSessions = data.mostSessions[0];
        if (data.mostConsistent?.length > 0) winners.mostConsistent = data.mostConsistent[0];
        await doc.ref.update({ status: 'finalized', winners, updatedAt: FieldValue.serverTimestamp() });
        console.log(`Finalized period: ${doc.id}`);
      }
    }

    // Query kiosk sessions for the current period
    const sessionsSnap = await db.collection('kioskSessions')
      .where('createdAt', '>=', Timestamp.fromDate(periodStart))
      .where('createdAt', '<=', Timestamp.fromDate(periodEnd))
      .get();

    const sessions = sessionsSnap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(s => s.patientId); // only identified patients

    if (sessions.length === 0) {
      console.log('No identified sessions in current period');
      // Still create/update the doc so UI can show empty state
      await db.collection('leaderboards').doc(periodId).set({
        periodStart: Timestamp.fromDate(periodStart),
        periodEnd: Timestamp.fromDate(periodEnd),
        periodLabel,
        clinicId: 'fixit',
        status: 'active',
        bestForm: [],
        mostSessions: [],
        mostConsistent: [],
        totalSessions: 0,
        totalPatients: 0,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      return { statusCode: 200, body: 'No sessions' };
    }

    // Aggregate by patient
    const patients = {};
    sessions.forEach(s => {
      const pid = s.patientId;
      if (!patients[pid]) {
        patients[pid] = {
          patientId: pid,
          patientName: s.patientName || '',
          patientEmail: s.patientEmail || '',
          bestScore: 0,
          bestExercise: '',
          sessionCount: 0,
          activeDays: new Set(),
        };
      }
      const p = patients[pid];
      p.sessionCount++;
      if (s.score > p.bestScore) {
        p.bestScore = s.score;
        p.bestExercise = s.exerciseName || '';
      }
      // Track unique active days
      const date = s.createdAt?.toDate ? s.createdAt.toDate() : new Date(s.createdAt);
      p.activeDays.add(date.toISOString().split('T')[0]);
      // Use latest name/email
      if (s.patientName) p.patientName = s.patientName;
      if (s.patientEmail) p.patientEmail = s.patientEmail;
    });

    const patientList = Object.values(patients);

    // Best Form — highest single-session score
    const bestForm = [...patientList]
      .sort((a, b) => b.bestScore - a.bestScore)
      .slice(0, 10)
      .map(p => ({
        patientId: p.patientId,
        displayName: privacyName(p.patientName, p.patientEmail),
        fullName: p.patientName || p.patientEmail,
        bestScore: p.bestScore,
        exercise: p.bestExercise,
      }));

    // Most Sessions — total pose checks
    const mostSessions = [...patientList]
      .sort((a, b) => b.sessionCount - a.sessionCount)
      .slice(0, 10)
      .map(p => ({
        patientId: p.patientId,
        displayName: privacyName(p.patientName, p.patientEmail),
        fullName: p.patientName || p.patientEmail,
        sessionCount: p.sessionCount,
      }));

    // Most Consistent — unique active days
    const totalDays = Math.ceil((Math.min(now, periodEnd) - periodStart) / (1000 * 60 * 60 * 24)) + 1;
    const mostConsistent = [...patientList]
      .sort((a, b) => b.activeDays.size - a.activeDays.size)
      .slice(0, 10)
      .map(p => ({
        patientId: p.patientId,
        displayName: privacyName(p.patientName, p.patientEmail),
        fullName: p.patientName || p.patientEmail,
        activeDays: p.activeDays.size,
        totalDays,
      }));

    // Save leaderboard
    await db.collection('leaderboards').doc(periodId).set({
      periodStart: Timestamp.fromDate(periodStart),
      periodEnd: Timestamp.fromDate(periodEnd),
      periodLabel,
      clinicId: 'fixit',
      status: 'active',
      bestForm,
      mostSessions,
      mostConsistent,
      totalSessions: sessions.length,
      totalPatients: patientList.length,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    console.log(`Leaderboard updated: ${periodId} — ${sessions.length} sessions, ${patientList.length} patients`);
    return { statusCode: 200, body: JSON.stringify({ periodId, sessions: sessions.length, patients: patientList.length }) };
  } catch (err) {
    console.error('Leaderboard update error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
