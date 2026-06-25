// Daily Summary Email — sends practitioners a "Daily Scorecard" of kiosk sessions
// Triggered by EventBridge schedule (daily at midnight UTC = 8 PM ET)

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

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
const ses = new SESClient({ region: process.env.AWS_REGION || 'us-east-1' });

const FROM_EMAIL = process.env.SES_FROM_EMAIL || 'noreply@yourformsux.com';
const APP_URL = process.env.APP_URL || 'https://fixit.yourformsux.com';

function scoreColor(s) {
  if (s >= 80) return '#4CAF50';
  if (s >= 60) return '#FFC107';
  if (s >= 40) return '#FF9800';
  return '#F44336';
}

function scoreLabel(s) {
  if (s >= 80) return 'Excellent';
  if (s >= 60) return 'Good';
  if (s >= 40) return 'Needs Work';
  return 'Keep Practicing';
}

function buildEmailHtml(date, sessions, practitionerName) {
  const uniquePatients = new Set(sessions.map(s => s.patientId).filter(Boolean));
  const totalSessions = sessions.length;
  const avgScore = totalSessions ? Math.round(sessions.reduce((a, s) => a + (s.score || 0), 0) / totalSessions) : 0;

  // Group by patient
  const byPatient = {};
  sessions.forEach(s => {
    const key = s.patientEmail || s.patientId || 'anonymous';
    if (!byPatient[key]) byPatient[key] = { name: s.patientName || s.patientEmail || 'Guest', sessions: [] };
    byPatient[key].sessions.push(s);
  });

  const patientRows = Object.values(byPatient).map(p => {
    const rows = p.sessions.map(s => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-size:14px">${s.exerciseName}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:center">
          <span style="display:inline-block;padding:4px 12px;border-radius:20px;background:${scoreColor(s.score)}18;color:${scoreColor(s.score)};font-weight:700;font-size:14px">${s.score}</span>
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#666">${s.faults?.length || 0} issues</td>
      </tr>
    `).join('');

    return `
      <div style="margin-bottom:20px">
        <div style="font-size:15px;font-weight:600;color:#333;margin-bottom:8px;padding:8px 12px;background:#f8f9fa;border-radius:8px">
          ${p.name}
        </div>
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="background:#fafafa">
              <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#999;font-weight:600">Exercise</th>
              <th style="padding:8px 12px;text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#999;font-weight:600">Score</th>
              <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#999;font-weight:600">Faults</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:20px">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#708E86,#4E4E53);border-radius:16px 16px 0 0;padding:32px;text-align:center">
      <div style="font-size:28px;font-weight:800;color:white;letter-spacing:3px;margin-bottom:4px">FIXIT</div>
      <div style="font-size:13px;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:2px">Daily Scorecard</div>
      <div style="font-size:15px;color:rgba(255,255,255,0.8);margin-top:8px">${date}</div>
    </div>

    <!-- Stats -->
    <div style="background:white;padding:24px;display:flex;border-bottom:1px solid #f0f0f0">
      <table style="width:100%"><tr>
        <td style="text-align:center;padding:8px">
          <div style="font-size:28px;font-weight:800;color:#333">${uniquePatients.size}</div>
          <div style="font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1px">Patients</div>
        </td>
        <td style="text-align:center;padding:8px;border-left:1px solid #f0f0f0;border-right:1px solid #f0f0f0">
          <div style="font-size:28px;font-weight:800;color:#333">${totalSessions}</div>
          <div style="font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1px">Sessions</div>
        </td>
        <td style="text-align:center;padding:8px">
          <div style="font-size:28px;font-weight:800;color:${scoreColor(avgScore)}">${avgScore}</div>
          <div style="font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1px">Avg Score</div>
        </td>
      </tr></table>
    </div>

    <!-- Patient Details -->
    <div style="background:white;padding:24px;border-radius:0 0 16px 16px">
      <h3 style="margin:0 0 16px;font-size:16px;color:#333">Session Details</h3>
      ${patientRows || '<p style="color:#999;font-size:14px">No sessions recorded today.</p>'}
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin-top:24px">
      <a href="${APP_URL}" style="display:inline-block;padding:14px 32px;background:#863bff;color:white;text-decoration:none;border-radius:50px;font-weight:700;font-size:14px;letter-spacing:0.5px">
        Review Sessions in Dashboard
      </a>
    </div>

    <!-- Footer -->
    <div style="text-align:center;margin-top:24px;padding:16px;color:#999;font-size:12px">
      Powered by FIXIT AI &mdash; ${APP_URL}
    </div>
  </div>
</body>
</html>`;
}

export const handler = async () => {
  try {
    // Get today's date range (UTC — adjust if clinic needs specific timezone)
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // Query today's kiosk sessions
    const sessionsSnap = await db.collection('kioskSessions')
      .where('createdAt', '>=', Timestamp.fromDate(startOfDay))
      .where('createdAt', '<=', Timestamp.fromDate(endOfDay))
      .orderBy('createdAt', 'desc')
      .get();

    const sessions = sessionsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (sessions.length === 0) {
      console.log('No kiosk sessions today — skipping email');
      return { statusCode: 200, body: 'No sessions today' };
    }

    // Get all practitioners
    const practitionersSnap = await db.collection('users')
      .where('roles', 'array-contains', 'practitioner')
      .get();

    const practitioners = practitionersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (practitioners.length === 0) {
      console.log('No practitioners found — skipping email');
      return { statusCode: 200, body: 'No practitioners' };
    }

    const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    // Send email to each practitioner
    const results = await Promise.allSettled(
      practitioners.map(async (prac) => {
        if (!prac.email) return;

        // Filter sessions to this practitioner's patients (or show all if no assignment filter)
        const pracSessions = sessions.filter(s => {
          if (!s.patientId) return true; // include anonymous/guest sessions for everyone
          // Check if patient is assigned to this practitioner
          // For now, send all sessions to all practitioners (clinic-wide view)
          return true;
        });

        if (pracSessions.length === 0) return;

        const html = buildEmailHtml(dateStr, pracSessions, prac.name);

        const cmd = new SendEmailCommand({
          Source: FROM_EMAIL,
          Destination: { ToAddresses: [prac.email] },
          Message: {
            Subject: { Data: `FIXIT Daily Scorecard — ${dateStr}` },
            Body: { Html: { Data: html } },
          },
        });

        await ses.send(cmd);
        console.log(`Sent daily summary to ${prac.email}`);
      })
    );

    const sent = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    console.log(`Daily summary: ${sent} sent, ${failed} failed, ${sessions.length} sessions`);

    return { statusCode: 200, body: JSON.stringify({ sent, failed, sessions: sessions.length }) };
  } catch (err) {
    console.error('Daily summary email error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
