// FIXIT Marketing API — blog drafting, email campaigns, subscribers.
//
// Single Lambda with an action router behind API Gateway:
//   ANY  /api/marketing/{proxy+}   → admin routes (Firebase ID token required)
//   POST /api/subscribe            → public newsletter signup
//   GET  /api/unsubscribe          → public one-click unsubscribe (token)
//   GET  /api/marketing/track/*    → public open/click tracking (Phase 2)
//
// SECURITY: admin routes require a valid Firebase ID token for a user whose
// Firestore profile has an 'admin' role. Public routes are subscribe/unsubscribe
// (+ tracking). Unsubscribe is token-gated so one user can't unsubscribe another.

import { randomUUID } from 'crypto';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand,
  ScanCommand, BatchGetCommand, BatchWriteCommand,
} from '@aws-sdk/lib-dynamodb';

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

const SUBSCRIBERS = process.env.SUBSCRIBERS_TABLE;
const SUPER_ADMIN_EMAIL = (process.env.SUPER_ADMIN_EMAIL || '').toLowerCase();
const APP_URL = process.env.APP_URL || 'https://fixit.yourformsux.com';

const CORS = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
  'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
};
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

function parseBody(event) {
  if (!event.body) return {};
  const raw = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body;
  try { return JSON.parse(raw); } catch { return {}; }
}

// ── Auth: verify Firebase ID token + require an admin role ──
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

// ── Subscriber data ops ──
async function getSubscriber(email) {
  const { Item } = await ddb.send(new GetCommand({ TableName: SUBSCRIBERS, Key: { email } }));
  return Item || null;
}

async function scanAllSubscribers() {
  const items = [];
  let ExclusiveStartKey;
  do {
    const res = await ddb.send(new ScanCommand({ TableName: SUBSCRIBERS, ExclusiveStartKey }));
    items.push(...(res.Items || []));
    ExclusiveStartKey = res.LastEvaluatedKey; // paginate — reference had a truncation bug here
  } while (ExclusiveStartKey);
  return items;
}

// Create or reactivate. Never silently resurrects an explicit unsubscribe unless
// `allowReactivate` (a person re-submitting the form counts as fresh consent).
async function upsertSubscriber({ email, name = '', source = 'website', category = '', tags = [] }, { allowReactivate = true } = {}) {
  const key = normEmail(email);
  if (!EMAIL_RE.test(key)) throw new HttpError(400, 'Invalid email');
  const now = new Date().toISOString();
  const existing = await getSubscriber(key);

  if (existing) {
    if (existing.status === 'unsubscribed' && !allowReactivate) return { status: 'skipped-unsubscribed' };
    await ddb.send(new UpdateCommand({
      TableName: SUBSCRIBERS,
      Key: { email: key },
      UpdateExpression: 'SET #s = :active, #n = :name, category = :cat, tags = :tags, updatedAt = :now, unsubscribeToken = if_not_exists(unsubscribeToken, :tok)',
      ExpressionAttributeNames: { '#s': 'status', '#n': 'name' },
      ExpressionAttributeValues: {
        ':active': 'active',
        ':name': name || existing.name || '',
        ':cat': category || existing.category || '',
        ':tags': tags.length ? tags : (existing.tags || []),
        ':now': now,
        ':tok': randomUUID(),
      },
    }));
    return { status: existing.status === 'active' ? 'already-active' : 'reactivated' };
  }

  await ddb.send(new PutCommand({
    TableName: SUBSCRIBERS,
    Item: {
      email: key, name, status: 'active', source, category, tags,
      unsubscribeToken: randomUUID(), createdAt: now, updatedAt: now,
    },
  }));
  return { status: 'created' };
}

// CASL-safe bulk import: skips addresses that previously unsubscribed.
async function importSubscribers(rows, source = 'import') {
  const clean = [];
  const seen = new Set();
  for (const r of rows) {
    const email = normEmail(r.email);
    if (!EMAIL_RE.test(email) || seen.has(email)) continue;
    seen.add(email);
    clean.push({ email, name: r.name || '', category: r.category || '', tags: Array.isArray(r.tags) ? r.tags : [], phone: r.phone || '' });
  }
  let imported = 0, skipped = 0;
  const now = new Date().toISOString();
  for (let i = 0; i < clean.length; i += 100) {
    const chunk = clean.slice(i, i + 100);
    const { Responses } = await ddb.send(new BatchGetCommand({
      RequestItems: { [SUBSCRIBERS]: { Keys: chunk.map((c) => ({ email: c.email })) } },
    }));
    const existing = new Map((Responses?.[SUBSCRIBERS] || []).map((it) => [it.email, it]));
    const toWrite = [];
    for (const c of chunk) {
      const ex = existing.get(c.email);
      if (ex?.status === 'unsubscribed') { skipped++; continue; } // honor opt-out
      toWrite.push({
        PutRequest: { Item: {
          email: c.email, name: c.name, phone: c.phone, category: c.category, tags: c.tags,
          status: 'active', source, updatedAt: now,
          createdAt: ex?.createdAt || now,
          unsubscribeToken: ex?.unsubscribeToken || randomUUID(),
        } },
      });
    }
    for (let j = 0; j < toWrite.length; j += 25) {
      await ddb.send(new BatchWriteCommand({ RequestItems: { [SUBSCRIBERS]: toWrite.slice(j, j + 25) } }));
    }
    imported += toWrite.length;
  }
  return { imported, skipped, total: rows.length };
}

function unsubscribePage(ok, email) {
  const msg = ok
    ? `<h1>You're unsubscribed</h1><p>${email} will no longer receive FIXIT emails.</p>`
    : `<h1>Link invalid</h1><p>This unsubscribe link is invalid or expired.</p>`;
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="robots" content="noindex">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Unsubscribe — FIXIT</title></head>
<body style="font-family:system-ui,sans-serif;max-width:520px;margin:80px auto;padding:0 24px;text-align:center;color:#4E4E53">
${msg}<p style="margin-top:24px"><a href="${APP_URL}" style="color:#708E86">Back to FIXIT</a></p></body></html>`;
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
      const { email, name } = parseBody(event);
      const r = await upsertSubscriber({ email, name, source: 'website' });
      return json(200, { ok: true, ...r });
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
    if (path.endsWith('/track/open') || path.endsWith('/track/click')) {
      return json(501, { error: 'tracking lands in Phase 2' });
    }

    // ── Admin (Firebase ID token + admin role) ──
    const caller = await requireAdmin(event);

    if (path.endsWith('/marketing/ping')) {
      return json(200, { ok: true, caller, time: new Date().toISOString() });
    }

    if (path.endsWith('/marketing/subscribers/import') && method === 'POST') {
      const { subscribers = [] } = parseBody(event);
      if (!Array.isArray(subscribers)) return json(400, { error: 'subscribers must be an array' });
      const r = await importSubscribers(subscribers, 'import');
      return json(200, r);
    }
    if (path.endsWith('/marketing/subscribers')) {
      if (method === 'GET') {
        const items = await scanAllSubscribers();
        const active = items.filter((s) => s.status === 'active');
        const categories = [...new Set(items.map((s) => s.category).filter(Boolean))];
        return json(200, {
          subscribers: items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')),
          count: items.length,
          activeCount: active.length,
          categories,
        });
      }
      if (method === 'POST') {
        const { email, name, category, tags } = parseBody(event);
        const r = await upsertSubscriber({ email, name, category, tags, source: 'admin' });
        return json(200, { ok: true, ...r });
      }
      if (method === 'DELETE') {
        const { email } = parseBody(event);
        const key = normEmail(email);
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

    // Phase 2: /email/*  Phase 3: /draft, /publish, /upload-image, /posts
    return json(501, { error: `Not implemented: ${method} ${path}` });
  } catch (err) {
    if (err instanceof HttpError) return json(err.status, { error: err.message });
    console.error('[marketing-api] error', err);
    return json(500, { error: 'Internal error' });
  }
};
