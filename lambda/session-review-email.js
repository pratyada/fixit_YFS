// Session Review Email — notifies practitioners when a patient completes a kiosk session
// Called via POST /api/notify-review from the kiosk frontend

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
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

const FROM_EMAIL = process.env.SES_FROM_EMAIL || 'i@yprateek.com';
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

function buildReviewEmailHtml({ patientName, exerciseName, score, faults, duration }) {
  const faultList = (faults || []).map(f => {
    const color = f.severity === 'high' ? '#E53935' : f.severity === 'moderate' ? '#FF9800' : '#4CAF50';
    return `<span style="display:inline-block;padding:4px 10px;border-radius:6px;background:${color}15;color:${color};font-size:12px;font-weight:600;margin:2px 4px 2px 0">${f.name}</span>`;
  }).join('') || '<span style="color:#999;font-size:13px">No issues detected</span>';

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:520px;margin:0 auto;padding:20px">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#708E86,#4E4E53);border-radius:16px 16px 0 0;padding:24px;text-align:center">
      <div style="font-size:22px;font-weight:800;color:white;letter-spacing:3px">FIXIT</div>
      <div style="font-size:12px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:2px;margin-top:4px">New Session to Review</div>
    </div>

    <div style="background:white;padding:28px;border-radius:0 0 16px 16px">
      <!-- Patient + Exercise -->
      <div style="text-align:center;margin-bottom:24px">
        <div style="font-size:14px;color:#666;margin-bottom:4px">Patient</div>
        <div style="font-size:18px;font-weight:700;color:#333">${patientName}</div>
        <div style="font-size:13px;color:#999;margin-top:4px">${exerciseName}${duration ? ` &mdash; ${duration}s` : ''}</div>
      </div>

      <!-- Score -->
      <div style="text-align:center;margin-bottom:24px">
        <div style="display:inline-block;width:100px;height:100px;border-radius:50%;background:${scoreColor(score)}12;border:3px solid ${scoreColor(score)};line-height:100px;text-align:center">
          <span style="font-size:36px;font-weight:800;color:${scoreColor(score)}">${score}</span>
        </div>
        <div style="font-size:15px;font-weight:600;color:${scoreColor(score)};margin-top:8px">${scoreLabel(score)}</div>
      </div>

      <!-- Faults -->
      <div style="margin-bottom:24px">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#999;font-weight:600;margin-bottom:8px">Form Issues</div>
        <div>${faultList}</div>
      </div>

      <!-- CTA -->
      <div style="text-align:center">
        <a href="${APP_URL}" style="display:inline-block;padding:14px 32px;background:#863bff;color:white;text-decoration:none;border-radius:50px;font-weight:700;font-size:14px">
          Review &amp; Give Feedback
        </a>
      </div>
    </div>

    <div style="text-align:center;margin-top:20px;color:#999;font-size:12px">
      Powered by FIXIT AI
    </div>
  </div>
</body>
</html>`;
}

export const handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.requestContext?.http?.method === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { patientId, patientEmail, patientName, exerciseName, score, faults, duration } = body;

    if (!exerciseName || score === undefined) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing exerciseName or score' }) };
    }

    // Find practitioners to notify
    let practitionerEmails = [];

    if (patientId) {
      // Look up patient's assigned practitioners
      const patientDoc = await db.collection('users').doc(patientId).get();
      if (patientDoc.exists) {
        const patientData = patientDoc.data();
        const pracIds = patientData.practitionerIds || (patientData.practitionerId ? [patientData.practitionerId] : []);

        if (pracIds.length > 0) {
          const pracDocs = await Promise.all(pracIds.map(id => db.collection('users').doc(id).get()));
          practitionerEmails = pracDocs.filter(d => d.exists && d.data().email).map(d => d.data().email);
        }
      }
    }

    // Fallback: if no assigned practitioners, email all practitioners
    if (practitionerEmails.length === 0) {
      const allPracs = await db.collection('users').where('roles', 'array-contains', 'practitioner').get();
      practitionerEmails = allPracs.docs.map(d => d.data().email).filter(Boolean);
    }

    if (practitionerEmails.length === 0) {
      console.log('No practitioner emails found — skipping');
      return { statusCode: 200, headers, body: JSON.stringify({ sent: 0 }) };
    }

    const displayName = patientName || patientEmail || 'Guest';
    const html = buildReviewEmailHtml({ patientName: displayName, exerciseName, score, faults, duration });

    const results = await Promise.allSettled(
      practitionerEmails.map(email =>
        ses.send(new SendEmailCommand({
          Source: FROM_EMAIL,
          Destination: { ToAddresses: [email] },
          Message: {
            Subject: { Data: `New FIXIT Session — ${displayName}, ${exerciseName} (Score: ${score})` },
            Body: { Html: { Data: html } },
          },
        }))
      )
    );

    const sent = results.filter(r => r.status === 'fulfilled').length;
    console.log(`Review email: ${sent}/${practitionerEmails.length} sent for ${displayName} - ${exerciseName}`);

    return { statusCode: 200, headers, body: JSON.stringify({ sent }) };
  } catch (err) {
    console.error('Session review email error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
