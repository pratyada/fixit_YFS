// Generate a quality FAQ for a guide from its OWN section headings/content —
// only where a heading naturally reads as a question, so answers stay accurate
// (no clunky auto-phrasing). Powers the on-page FAQ + FAQPage structured data.

const strip = (s) => (s || '')
  .replace(/\*\*/g, '')            // bold markers
  .replace(/^[\s>-]+/gm, '')       // list bullets / quotes
  .replace(/\s+/g, ' ')
  .trim();

function firstSentences(s, n = 2) {
  const t = strip(s);
  const parts = t.split(/(?<=[.!?])\s+/);
  return parts.slice(0, n).join(' ');
}

const isQuestionHeading = (h) =>
  /\?\s*$/.test(h) || /^(what|why|how|when|where|is|are|do|does|can|should|which|who)\b/i.test(h);

export function enrichGuideFaqs(guide) {
  const faqs = [];
  // Lead: a reliable, accurate summary FAQ from the guide's own subtitle/meta.
  const summary = strip(guide.subtitle || guide.metaDescription);
  if (summary && summary.length > 20) {
    faqs.push({ q: 'What does this guide cover?', a: summary });
  }
  // Plus genuine question-style sections turned into FAQs.
  for (const sec of guide.sections || []) {
    if (!sec.heading || !sec.content) continue;
    if (isQuestionHeading(sec.heading)) {
      const q = /\?\s*$/.test(sec.heading) ? sec.heading.trim() : `${sec.heading.trim()}?`;
      const a = firstSentences(sec.content, 2);
      if (a && a.length > 20) faqs.push({ q, a });
    }
    if (faqs.length >= 5) break;
  }
  return faqs;
}
