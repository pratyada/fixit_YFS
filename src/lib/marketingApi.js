// Client for the FIXIT marketing API (fixit-marketing-api Lambda).
// Admin calls attach the caller's Firebase ID token; the Lambda verifies it and
// checks for an 'admin' role. Public subscribe needs no auth.

import { auth } from './firebase';

// Marketing runs in its own stack (own API Gateway) — point at it explicitly.
const API_BASE = import.meta.env.VITE_MARKETING_API_BASE || import.meta.env.VITE_API_BASE_URL || '';

async function authedFetch(path, { method = 'GET', body } = {}) {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('Not signed in');
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const marketing = {
  ping: () => authedFetch('/api/marketing/ping'),
  listSubscribers: () => authedFetch('/api/marketing/subscribers'),
  addSubscriber: (sub) => authedFetch('/api/marketing/subscribers', { method: 'POST', body: sub }),
  removeSubscriber: (email) => authedFetch('/api/marketing/subscribers', { method: 'DELETE', body: { email } }),
  importSubscribers: (subscribers) => authedFetch('/api/marketing/subscribers/import', { method: 'POST', body: { subscribers } }),

  generateEmail: (topic, extra = {}) => authedFetch('/api/marketing/email/generate', { method: 'POST', body: { topic, ...extra } }),
  previewEmail: (payload) => authedFetch('/api/marketing/email/preview', { method: 'POST', body: payload }),
  uploadImage: (base64, ext = 'jpg', contentType = 'image/jpeg') => authedFetch('/api/marketing/upload-image', { method: 'POST', body: { base64, ext, contentType } }),
  generateCreative: (brief) => authedFetch('/api/marketing/creative/generate', { method: 'POST', body: { brief } }),
  sendEmail: (payload) => authedFetch('/api/marketing/email/send', { method: 'POST', body: payload }),
  emailHistory: () => authedFetch('/api/marketing/email/history'),
  parseAnatomy: (note, structures, exercises) => authedFetch('/api/marketing/anatomy/parse', { method: 'POST', body: { note, structures, exercises } }),
  summarizePatient: (payload) => authedFetch('/api/marketing/anatomy/summary', { method: 'POST', body: payload }),
  // Email a patient that exercises were assigned to them.
  notifyAssignment: (payload) => authedFetch('/api/marketing/notify-assignment', { method: 'POST', body: payload }),
};

// Public newsletter signup lives in ./subscribe (Firebase-free) so public/guide
// pages can use it without pulling the Firebase SDK into the entry chunk.
