// FIXIT Marketing API — blog drafting, email campaigns, subscribers.
//
//   ANY  /api/marketing/{proxy+}   → admin routes (Firebase ID token required)
//   POST /api/subscribe            → public newsletter signup
//   GET  /api/unsubscribe          → public one-click unsubscribe (token)
//   GET  /api/marketing/track/open → public open pixel
//   GET  /api/marketing/track/click→ public click redirect
//
// SECURITY: admin routes require a valid Firebase ID token for a user with an
// 'admin' role. Unsubscribe is token-gated. Click-redirect only follows http(s).

import { randomUUID } from 'crypto';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand,
  ScanCommand, BatchGetCommand, BatchWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { PollyClient, SynthesizeSpeechCommand } from '@aws-sdk/client-polly';

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
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' }));
const ses = new SESClient({ region: process.env.AWS_REGION || 'us-east-1' });
const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const polly = new PollyClient({ region: process.env.AWS_REGION || 'us-east-1' });
const SITE_BUCKET = process.env.SITE_BUCKET;

const SUBSCRIBERS = process.env.SUBSCRIBERS_TABLE;
const HISTORY = process.env.EMAIL_HISTORY_TABLE;
const SUPER_ADMIN_EMAIL = (process.env.SUPER_ADMIN_EMAIL || '').toLowerCase();
const APP_URL = process.env.APP_URL || 'https://fixit.yourformsux.com';
const FROM = process.env.MARKETING_FROM_EMAIL || 'yourformsux@gmail.com';
const REPLY_TO = process.env.MARKETING_REPLY_TO || FROM;
const ADDRESS = process.env.MARKETING_ADDRESS || 'FIXIT, Toronto, ON, Canada';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

const CORS = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
  'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
};
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GIF = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');

function json(statusCode, body, extraHeaders = {}) {
  return { statusCode, headers: { 'Content-Type': 'application/json', ...CORS, ...extraHeaders }, body: JSON.stringify(body) };
}
function html(statusCode, page) {
  return { statusCode, headers: { 'Content-Type': 'text/html; charset=utf-8' }, body: page };
}
class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const normEmail = (e) => (e || '').trim().toLowerCase();
const enc = encodeURIComponent;

function parseBody(event) {
  if (!event.body) return {};
  const raw = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body;
  try { return JSON.parse(raw); } catch { return {}; }
}
function selfBase(event) {
  const host = event.requestContext?.domainName;
  return host ? `https://${host}` : '';
}
async function mapLimit(items, limit, fn) {
  const out = []; let i = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) { const idx = i++; out[idx] = await fn(items[idx], idx); }
  }));
  return out;
}

// ── Auth ──
async function requireAdmin(event) {
  const authz = event.headers?.authorization || event.headers?.Authorization || '';
  const token = authz.startsWith('Bearer ') ? authz.slice(7) : null;
  if (!token) throw new HttpError(401, 'Missing bearer token');
  let decoded;
  try { decoded = await getAuth().verifyIdToken(token); }
  catch { throw new HttpError(401, 'Invalid or expired token'); }
  const email = normEmail(decoded.email);
  if (SUPER_ADMIN_EMAIL && email === SUPER_ADMIN_EMAIL) return { uid: decoded.uid, email };
  const snap = await db.collection('users').doc(decoded.uid).get();
  const prof = snap.exists ? snap.data() : null;
  const roles = prof?.roles && Array.isArray(prof.roles) ? prof.roles : [prof?.role].filter(Boolean);
  if (!roles.includes('admin')) throw new HttpError(403, 'Admin role required');
  return { uid: decoded.uid, email };
}

// ── Subscriber ops (Phase 1) ──
async function getSubscriber(email) {
  const { Item } = await ddb.send(new GetCommand({ TableName: SUBSCRIBERS, Key: { email } }));
  return Item || null;
}
async function scanAll(table, params = {}) {
  const items = []; let ExclusiveStartKey;
  do {
    const res = await ddb.send(new ScanCommand({ TableName: table, ExclusiveStartKey, ...params }));
    items.push(...(res.Items || []));
    ExclusiveStartKey = res.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return items;
}
async function upsertSubscriber({ email, name = '', source = 'website', category = '', tags = [] }) {
  const key = normEmail(email);
  if (!EMAIL_RE.test(key)) throw new HttpError(400, 'Invalid email');
  const now = new Date().toISOString();
  const existing = await getSubscriber(key);
  if (existing) {
    await ddb.send(new UpdateCommand({
      TableName: SUBSCRIBERS, Key: { email: key },
      UpdateExpression: 'SET #s = :active, #n = :name, category = :cat, tags = :tags, updatedAt = :now, unsubscribeToken = if_not_exists(unsubscribeToken, :tok)',
      ExpressionAttributeNames: { '#s': 'status', '#n': 'name' },
      ExpressionAttributeValues: {
        ':active': 'active', ':name': name || existing.name || '', ':cat': category || existing.category || '',
        ':tags': tags.length ? tags : (existing.tags || []), ':now': now, ':tok': randomUUID(),
      },
    }));
    return { status: existing.status === 'active' ? 'already-active' : 'reactivated' };
  }
  await ddb.send(new PutCommand({
    TableName: SUBSCRIBERS,
    Item: { email: key, name, status: 'active', source, category, tags, unsubscribeToken: randomUUID(), createdAt: now, updatedAt: now },
  }));
  return { status: 'created' };
}
async function importSubscribers(rows, source = 'import') {
  const clean = []; const seen = new Set();
  for (const r of rows) {
    const email = normEmail(r.email);
    if (!EMAIL_RE.test(email) || seen.has(email)) continue;
    seen.add(email);
    clean.push({ email, name: r.name || '', category: r.category || '', tags: Array.isArray(r.tags) ? r.tags : [], phone: r.phone || '' });
  }
  let imported = 0, skipped = 0; const now = new Date().toISOString();
  for (let i = 0; i < clean.length; i += 100) {
    const chunk = clean.slice(i, i + 100);
    const { Responses } = await ddb.send(new BatchGetCommand({ RequestItems: { [SUBSCRIBERS]: { Keys: chunk.map((c) => ({ email: c.email })) } } }));
    const existing = new Map((Responses?.[SUBSCRIBERS] || []).map((it) => [it.email, it]));
    const toWrite = [];
    for (const c of chunk) {
      const ex = existing.get(c.email);
      if (ex?.status === 'unsubscribed') { skipped++; continue; }
      toWrite.push({ PutRequest: { Item: {
        email: c.email, name: c.name, phone: c.phone, category: c.category, tags: c.tags,
        status: 'active', source, updatedAt: now, createdAt: ex?.createdAt || now,
        unsubscribeToken: ex?.unsubscribeToken || randomUUID(),
      } } });
    }
    for (let j = 0; j < toWrite.length; j += 25) {
      await ddb.send(new BatchWriteCommand({ RequestItems: { [SUBSCRIBERS]: toWrite.slice(j, j + 25) } }));
    }
    imported += toWrite.length;
  }
  return { imported, skipped, total: rows.length };
}

// ── Email (Phase 2) ──
const DEFAULT_AUTHOR = 'The FIXIT Health Team';
const DEFAULT_AUTHOR_TITLE = 'Evidence-based physiotherapy, chiropractic & performance';

function brandedEmail({ subject, preheader = '', bodyHtml, unsubscribeUrl, heroImageUrl = '', authorName = DEFAULT_AUTHOR, authorTitle = DEFAULT_AUTHOR_TITLE }) {
  const hero = heroImageUrl
    ? `<tr><td><img src="${heroImageUrl}" width="600" alt="" style="display:block;width:100%;max-width:600px;height:auto"></td></tr>`
    : '';
  const monogram = 'YFS'; // YourFormSux brand mark in the signature
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${subject}</title></head>
<body style="margin:0;background:#eef2f1;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#3f4a47;-webkit-font-smoothing:antialiased">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${preheader}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f1;padding:28px 0">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 6px 24px rgba(78,78,83,0.08)">
  <tr><td style="background:linear-gradient(135deg,#708E86,#4E4E53);padding:24px 32px">
    <span style="font-size:22px;font-weight:800;letter-spacing:-0.5px;color:#fff">FIXIT</span>
    <span style="font-size:12px;color:rgba(255,255,255,0.75);margin-left:8px">by YourFormSux</span>
  </td></tr>
  ${hero}
  <tr><td style="padding:32px 32px 8px;font-size:16px;line-height:1.7;color:#3f4a47">${bodyHtml}</td></tr>
  <tr><td style="padding:4px 32px 28px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #eef0ef"><tr>
      <td style="padding-top:18px;width:44px;vertical-align:top">
        <div style="width:44px;height:44px;border-radius:50%;background:#708E86;color:#fff;font-weight:800;font-size:13px;letter-spacing:0.5px;text-align:center;line-height:44px">${monogram}</div>
      </td>
      <td style="padding:18px 0 0 12px;vertical-align:top">
        <div style="font-weight:700;color:#4E4E53;font-size:14px">${authorName}</div>
        <div style="font-size:12px;color:#8a938f">${authorTitle}</div>
      </td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:18px 32px;background:#f7faf9;border-top:1px solid #eef0ef;font-size:11px;color:#98a2a0;text-align:center;line-height:1.6">
    <p style="margin:0 0 6px">You're receiving this because you subscribed to FIXIT — evidence-based training & recovery.</p>
    <p style="margin:0 0 6px">${ADDRESS}</p>
    <p style="margin:0"><a href="${unsubscribeUrl}" style="color:#708E86;font-weight:600">Unsubscribe</a> &nbsp;·&nbsp; <a href="${APP_URL}" style="color:#708E86;font-weight:600">${APP_URL.replace(/^https?:\/\//, '')}</a></p>
  </td></tr>
</table></td></tr></table></body></html>`;
}

function injectTracking(htmlBody, emailId, email, base) {
  const to = enc(email); const id = enc(emailId);
  let out = htmlBody.replace(/href="(https?:\/\/[^"]+)"/g, (m, url) => {
    if (url.includes('/track/') || url.includes('/api/unsubscribe')) return m;
    return `href="${base}/api/marketing/track/click?id=${id}&to=${to}&url=${enc(url)}"`;
  });
  const pixel = `<img src="${base}/api/marketing/track/open?id=${id}&to=${to}" width="1" height="1" style="display:none" alt="">`;
  return out.includes('</body>') ? out.replace('</body>', pixel + '</body>') : out + pixel;
}

async function handleEmailSend(event) {
  const { type = 'all', to, subject, bodyHtml, preheader = '', category, heroImageUrl = '', authorName, authorTitle } = parseBody(event);
  if (!subject || !bodyHtml) throw new HttpError(400, 'subject and bodyHtml required');
  const base = selfBase(event);

  let recipients;
  if (type === 'single') {
    const s = await getSubscriber(normEmail(to));
    if (!s || s.status !== 'active') throw new HttpError(400, 'Recipient not an active subscriber');
    recipients = [s];
  } else {
    const all = await scanAll(SUBSCRIBERS);
    recipients = all.filter((s) => s.status === 'active' && (type !== 'category' || s.category === category));
  }
  if (!recipients.length) throw new HttpError(400, 'No active recipients');

  const emailId = randomUUID();
  const results = await mapLimit(recipients, 5, async (sub) => {
    try {
      const unsub = `${base}/api/unsubscribe?email=${enc(sub.email)}&token=${enc(sub.unsubscribeToken || '')}`;
      const personalized = bodyHtml.replaceAll('{{firstName}}', sub.name || 'there');
      const wrapped = brandedEmail({ subject, preheader, bodyHtml: personalized, unsubscribeUrl: unsub, heroImageUrl, authorName, authorTitle });
      const tracked = injectTracking(wrapped, emailId, sub.email, base);
      await ses.send(new SendEmailCommand({
        Source: FROM,
        Destination: { ToAddresses: [sub.email] },
        ReplyToAddresses: [REPLY_TO],
        Message: { Subject: { Data: subject }, Body: { Html: { Data: tracked } } },
      }));
      return { email: sub.email, ok: true };
    } catch (e) { return { email: sub.email, ok: false, error: e.message }; }
  });

  const sent = results.filter((r) => r.ok);
  const failed = results.filter((r) => !r.ok);
  await ddb.send(new PutCommand({
    TableName: HISTORY,
    Item: {
      emailId, kind: 'campaign', subject, type, category: category || '', sentAt: new Date().toISOString(),
      recipientCount: recipients.length, sentCount: sent.length, failedCount: failed.length,
      sentTo: sent.map((r) => r.email), opens: [], openCount: 0, clicks: [], clickCount: 0,
      // Saved so the campaign can be reused (sent again to others) from Sent History.
      preheader: preheader || '', bodyHtml, heroImageUrl: heroImageUrl || '',
    },
  }));
  return json(200, { ok: true, emailId, sent: sent.length, failed: failed.length, failures: failed.slice(0, 10) });
}

async function handleEmailHistory() {
  const rows = (await scanAll(HISTORY)).filter((r) => r.kind === 'campaign');
  rows.sort((a, b) => (b.sentAt || '').localeCompare(a.sentAt || ''));
  return json(200, { emails: rows });
}

async function handleTrackOpen(event) {
  const q = event.queryStringParameters || {};
  const id = q.id; const to = normEmail(q.to);
  try {
    const { Item } = await ddb.send(new GetCommand({ TableName: HISTORY, Key: { emailId: id } }));
    if (Item && !(Item.opens || []).some((o) => o.email === to)) {
      await ddb.send(new UpdateCommand({
        TableName: HISTORY, Key: { emailId: id },
        UpdateExpression: 'SET opens = list_append(if_not_exists(opens, :e), :o), openCount = if_not_exists(openCount, :z) + :one',
        ExpressionAttributeValues: { ':o': [{ email: to, at: new Date().toISOString() }], ':e': [], ':z': 0, ':one': 1 },
      }));
    }
  } catch { /* never break the pixel */ }
  return { statusCode: 200, headers: { 'Content-Type': 'image/gif', 'Cache-Control': 'no-store' }, body: GIF.toString('base64'), isBase64Encoded: true };
}

async function handleTrackClick(event) {
  const q = event.queryStringParameters || {};
  const id = q.id; const to = normEmail(q.to);
  let url = q.url || APP_URL;
  if (!/^https?:\/\//i.test(url)) url = APP_URL; // no open-redirect
  try {
    await ddb.send(new UpdateCommand({
      TableName: HISTORY, Key: { emailId: id },
      UpdateExpression: 'SET clicks = list_append(if_not_exists(clicks, :e), :c), clickCount = if_not_exists(clickCount, :z) + :one',
      ExpressionAttributeValues: { ':c': [{ email: to, url, at: new Date().toISOString() }], ':e': [], ':z': 0, ':one': 1 },
    }));
  } catch { /* still redirect */ }
  return { statusCode: 302, headers: { Location: url, 'Cache-Control': 'no-store' }, body: '' };
}

async function handleEmailGenerate(event) {
  if (!ANTHROPIC_API_KEY) throw new HttpError(400, 'ANTHROPIC_API_KEY not set — configure the stack to enable AI generation');
  const { topic } = parseBody(event);
  if (!topic) throw new HttpError(400, 'topic required');
  const system = `You are the lead health writer for FIXIT (an AI health & fitness tracking app, Toronto, Canada). Write with the depth and authority of a clinician-scientist with 20+ years across physiotherapy, chiropractic care, and evidence-based strength & conditioning: accurate physiological mechanisms, specific protocols (sets/reps/tempo/frequency/load), and what the research broadly shows — but warm, clear, and practical for a general audience. Never make unsafe or absolute medical claims; frame as general educational guidance.

Write a RICH newsletter (350–550 words) as email-safe inline-styled HTML for the "bodyHtml" field: no <html>/<head>/<body>, no <style> tags, no class attributes — INLINE styles only. Structure:
- Open with a short paragraph addressing {{firstName}} (use it exactly once): <p style="margin:0 0 14px">…</p>
- 2–4 sections, each led by <h2 style="font-size:19px;color:#4E4E53;margin:22px 0 8px">…</h2>, with <p style="margin:0 0 14px">…</p> and where useful <ul style="margin:0 0 14px;padding-left:20px;line-height:1.7">…</ul>.
- Include AT LEAST TWO of these infographic blocks, using EXACTLY this inline HTML (fill CAPS placeholders with real, specific content):
  • Stat: <div style="background:#f4f7f6;border-left:4px solid #708E86;border-radius:10px;padding:16px 18px;margin:18px 0"><div style="font-size:30px;font-weight:800;color:#708E86;line-height:1">NUMBER</div><div style="font-size:13px;color:#6b746f;margin-top:4px">LABEL</div></div>
  • Research: <div style="background:#eef5f2;border-radius:12px;padding:16px 18px;margin:18px 0"><div style="font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#708E86;margin-bottom:6px">🔬 What the research shows</div><div style="font-size:14px;color:#44504c;line-height:1.6">EVIDENCE</div></div>
  • Protocol: <div style="background:#fbfaf6;border:1px solid #ece7d9;border-radius:12px;padding:16px 18px;margin:18px 0"><div style="font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#b08948;margin-bottom:8px">✅ The protocol</div><ol style="margin:0;padding-left:18px;font-size:14px;color:#44504c;line-height:1.8">STEPS</ol></div>
- End with a CTA button: <div style="text-align:center;margin:26px 0 6px"><a href="${APP_URL}" style="display:inline-block;background:#4E4E53;color:#fff;text-decoration:none;padding:13px 30px;border-radius:10px;font-weight:700;font-size:15px">Track this in FIXIT →</a></div>

Be credible and specific — real numbers, real mechanisms. Do NOT include the header, footer, or signature (the template adds those).`;
  // Use tool-use so Claude returns validated structured JSON (avoids brittle
  // JSON.parse of model prose, which breaks on unescaped quotes in HTML).
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-5', max_tokens: 3000, system,
      tools: [{
        name: 'draft_email',
        description: 'Return the drafted marketing email.',
        input_schema: {
          type: 'object',
          properties: {
            subject: { type: 'string' },
            preheader: { type: 'string', description: 'inbox preview text' },
            bodyHtml: { type: 'string', description: 'inner HTML email body' },
          },
          required: ['subject', 'preheader', 'bodyHtml'],
        },
      }],
      tool_choice: { type: 'tool', name: 'draft_email' },
      messages: [{ role: 'user', content: `Write a marketing email about: ${topic}` }],
    }),
  });
  if (!res.ok) throw new HttpError(502, `Anthropic error ${res.status}`);
  const data = await res.json();
  const tool = (data.content || []).find((c) => c.type === 'tool_use');
  if (!tool) throw new HttpError(502, 'AI did not return a draft');
  return json(200, tool.input);
}

// Full branded email HTML for the admin preview — identical to what's sent
// (with a sample name / unsubscribe), so what you see is what recipients get.
async function handleEmailPreview(event) {
  const { subject = '(subject)', preheader = '', bodyHtml = '', heroImageUrl = '', authorName, authorTitle } = parseBody(event);
  const html = brandedEmail({
    subject, preheader,
    bodyHtml: (bodyHtml || '').replaceAll('{{firstName}}', 'there'),
    unsubscribeUrl: '#', heroImageUrl, authorName, authorTitle,
  });
  return json(200, { html });
}

// AI social-creative copy for the Creatives studio. Returns structured fields
// the frontend renders into the FIXIT-branded poster templates.
async function handleCreativeGenerate(event) {
  if (!ANTHROPIC_API_KEY) throw new HttpError(400, 'ANTHROPIC_API_KEY not set — configure the stack to enable AI generation');
  const { brief } = parseBody(event);
  if (!brief) throw new HttpError(400, 'brief required');
  const system = `You write punchy, on-brand social-media creative copy for FIXIT — an AI health & fitness tracking app by YourFormSux (Toronto). Given a brief, return copy for a poster/banner. Be concrete, energetic, specific to the brief, never generic.
- eyebrow: short UPPERCASE label (2-4 words)
- headline: 1-3 short words, big display
- headlineAccent: ONE word (from or right after the headline) to highlight
- tagline: one punchy line
- statNumber: a striking figure relevant to the brief (e.g. "1 in 3", "80%", "2x")
- statText: short context for the stat
- dateLine + venue: ONLY if the brief is an event (else empty strings)
- demoLine: optional secondary line (else empty)
- ctaText: short action ending in " →" (e.g. "RSVP in FIXIT →", "Start free →")`;
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-5', max_tokens: 1000, system,
      tools: [{
        name: 'creative',
        description: 'Return social creative copy.',
        input_schema: {
          type: 'object',
          properties: {
            eyebrow: { type: 'string' }, headline: { type: 'string' }, headlineAccent: { type: 'string' },
            tagline: { type: 'string' }, dateLine: { type: 'string' }, venue: { type: 'string' },
            statNumber: { type: 'string' }, statText: { type: 'string' }, demoLine: { type: 'string' }, ctaText: { type: 'string' },
          },
          required: ['eyebrow', 'headline', 'headlineAccent', 'tagline', 'statNumber', 'statText', 'ctaText'],
        },
      }],
      tool_choice: { type: 'tool', name: 'creative' },
      messages: [{ role: 'user', content: `Brief: ${brief}` }],
    }),
  });
  if (!res.ok) throw new HttpError(502, `Anthropic error ${res.status}`);
  const data = await res.json();
  const tool = (data.content || []).find((c) => c.type === 'tool_use');
  if (!tool) throw new HttpError(502, 'AI did not return creative copy');
  return json(200, tool.input);
}

// Store an uploaded (browser-resized) image to S3 → returns a CloudFront URL
// usable in emails and blog posts. IAM already grants s3:PutObject on the bucket.
async function handleUploadImage(event) {
  const { base64, ext = 'jpg', contentType = 'image/jpeg' } = parseBody(event);
  if (!base64) throw new HttpError(400, 'base64 image required');
  const buf = Buffer.from(base64.replace(/^data:[^;]+;base64,/, ''), 'base64');
  if (!buf.length) throw new HttpError(400, 'empty image');
  if (buf.length > 5 * 1024 * 1024) throw new HttpError(400, 'Image too large (max 5MB)');
  const safeExt = /^(jpe?g|png|webp|gif)$/i.test(ext) ? ext.toLowerCase() : 'jpg';
  const key = `email-assets/${randomUUID()}.${safeExt}`;
  await s3.send(new PutObjectCommand({
    Bucket: SITE_BUCKET, Key: key, Body: buf, ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable',
  }));
  return json(200, { url: `${APP_URL}/${key}` });
}

function unsubscribePage(ok, email) {
  const msg = ok
    ? `<h1>You're unsubscribed</h1><p>${email} will no longer receive FIXIT emails.</p>`
    : `<h1>Link invalid</h1><p>This unsubscribe link is invalid or expired.</p>`;
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Unsubscribe — FIXIT</title></head>
<body style="font-family:system-ui,sans-serif;max-width:520px;margin:80px auto;padding:0 24px;text-align:center;color:#4E4E53">
${msg}<p style="margin-top:24px"><a href="${APP_URL}" style="color:#708E86">Back to FIXIT</a></p></body></html>`;
}

// ── Kiosk (voice) ──
// AWS Polly generative TTS → base64 mp3 the kiosk plays. "Ruth" = warm US voice.
async function handleKioskSpeak(event) {
  const { text, voice = 'Ruth', engine = 'generative' } = parseBody(event);
  if (!text || !text.trim()) throw new HttpError(400, 'text required');
  const out = await polly.send(new SynthesizeSpeechCommand({
    Text: text.slice(0, 2800), VoiceId: voice, Engine: engine, OutputFormat: 'mp3',
  }));
  const bytes = await out.AudioStream.transformToByteArray();
  return json(200, { audio: Buffer.from(bytes).toString('base64'), mime: 'audio/mpeg' });
}

// ── Router ──
export const handler = async (event) => {
  const method = event.requestContext?.http?.method || 'GET';
  const path = (event.rawPath || event.requestContext?.http?.path || '').replace(/\/+$/, '');
  const q = event.queryStringParameters || {};

  if (method === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };

  try {
    // ── Public ──
    if (method === 'POST' && path === '/api/subscribe') {
      const { email, name, category, source } = parseBody(event);
      return json(200, { ok: true, ...(await upsertSubscriber({ email, name, category: category || '', source: source || 'website' })) });
    }
    if (method === 'GET' && path === '/api/unsubscribe') {
      const email = normEmail(q.email);
      const sub = email ? await getSubscriber(email) : null;
      const valid = sub && q.token && sub.unsubscribeToken === q.token;
      if (valid && sub.status !== 'unsubscribed') {
        await ddb.send(new UpdateCommand({
          TableName: SUBSCRIBERS, Key: { email },
          UpdateExpression: 'SET #s = :u, unsubscribedAt = :now',
          ExpressionAttributeNames: { '#s': 'status' },
          ExpressionAttributeValues: { ':u': 'unsubscribed', ':now': new Date().toISOString() },
        }));
      }
      return html(200, unsubscribePage(!!valid, email));
    }
    // `return await` (not bare return) so a rejected handler is caught here and
    // mapped to the right status instead of escaping as an uncaught 500.
    if (path.endsWith('/track/open')) return await handleTrackOpen(event);
    if (path.endsWith('/track/click')) return await handleTrackClick(event);

    // ── Admin ──
    const caller = await requireAdmin(event);
    if (path.endsWith('/marketing/ping')) return json(200, { ok: true, caller, time: new Date().toISOString() });

    // Email (Phase 2)
    if (path.endsWith('/marketing/email/send') && method === 'POST') return await handleEmailSend(event);
    if (path.endsWith('/marketing/email/generate') && method === 'POST') return await handleEmailGenerate(event);
    if (path.endsWith('/marketing/email/preview') && method === 'POST') return await handleEmailPreview(event);
    if (path.endsWith('/marketing/upload-image') && method === 'POST') return await handleUploadImage(event);
    if (path.endsWith('/marketing/creative/generate') && method === 'POST') return await handleCreativeGenerate(event);
    if (path.endsWith('/marketing/kiosk/speak') && method === 'POST') return await handleKioskSpeak(event);
    if (path.endsWith('/marketing/email/history') && method === 'GET') return await handleEmailHistory();

    // Subscribers (Phase 1)
    if (path.endsWith('/marketing/subscribers/import') && method === 'POST') {
      const { subscribers = [] } = parseBody(event);
      if (!Array.isArray(subscribers)) return json(400, { error: 'subscribers must be an array' });
      return json(200, await importSubscribers(subscribers, 'import'));
    }
    if (path.endsWith('/marketing/subscribers')) {
      if (method === 'GET') {
        const items = await scanAll(SUBSCRIBERS);
        const active = items.filter((s) => s.status === 'active');
        return json(200, {
          subscribers: items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')),
          count: items.length, activeCount: active.length,
          categories: [...new Set(items.map((s) => s.category).filter(Boolean))],
        });
      }
      if (method === 'POST') {
        const { email, name, category, tags } = parseBody(event);
        return json(200, { ok: true, ...(await upsertSubscriber({ email, name, category, tags, source: 'admin' })) });
      }
      if (method === 'DELETE') {
        const key = normEmail(parseBody(event).email);
        if (!key) return json(400, { error: 'email required' });
        await ddb.send(new UpdateCommand({
          TableName: SUBSCRIBERS, Key: { email: key },
          UpdateExpression: 'SET #s = :u, unsubscribedAt = :now',
          ExpressionAttributeNames: { '#s': 'status' },
          ExpressionAttributeValues: { ':u': 'unsubscribed', ':now': new Date().toISOString() },
        }));
        return json(200, { ok: true });
      }
    }

    // Phase 3: /draft, /publish, /upload-image, /posts
    return json(501, { error: `Not implemented: ${method} ${path}` });
  } catch (err) {
    if (err instanceof HttpError) return json(err.status, { error: err.message });
    console.error('[marketing-api] error', err);
    return json(500, { error: 'Internal error' });
  }
};
