// CloudFront Function (viewer-request) — source of truth, version-controlled.
//
// The FIXIT distribution serves a prerendered SPA from S3 via OAC. S3 does not
// resolve subfolder index.html, and the distribution maps 403/404 → /index.html.
// Without this rewrite, /guides/<slug> misses in S3 → 403 → the empty CSR shell,
// so prerendered pages are never served to crawlers.
//
// This appends index.html for directory/extensionless requests so the
// prerendered guides/<slug>/index.html is returned. Real (non-prerendered) app
// routes still fall through to /index.html via the 403 handler — correct.
function handler(event) {
  var request = event.request;
  var uri = request.uri;
  if (uri.endsWith('/')) {
    request.uri = uri + 'index.html';
  } else if (uri.lastIndexOf('.') < uri.lastIndexOf('/')) {
    // Last path segment has no file extension → treat as a page.
    request.uri = uri + '/index.html';
  }
  return request;
}
