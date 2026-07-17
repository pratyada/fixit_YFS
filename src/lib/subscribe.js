// Public newsletter signup — deliberately Firebase-free so it can be imported
// by public/guide pages (which render outside the auth providers) without
// pulling the Firebase SDK back into the entry chunk.

const API_BASE = import.meta.env.VITE_MARKETING_API_BASE || import.meta.env.VITE_API_BASE_URL || '';

export async function subscribe(email, name = '', extra = {}) {
  const res = await fetch(`${API_BASE}/api/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name, ...extra }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Subscription failed');
  return data;
}
