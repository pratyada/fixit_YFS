import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SITE, absUrl, getRouteMeta } from '../seo/routes.js';

// ─── Per-route <head> manager ───
//
// Imperatively upserts head tags so there is always EXACTLY ONE of each
// (title, description, canonical, robots, OG, Twitter). This is what kills the
// original bug: index.html hardcoded a single canonical → homepage on every route,
// so Google folded all 20 guide URLs into the homepage and never indexed them.
//
// Imperative (vs. React 19 metadata hoisting) is deliberate: it REPLACES the
// existing static tags from index.html instead of appending duplicates, and the
// final DOM is what the prerender crawl snapshots.

const useIsoLayoutEffect = typeof window === 'undefined' ? () => {} : useLayoutEffect;

function upsertMeta(attr, key, content) {
  if (content == null) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

const ARTICLE_LD_ID = 'seo-article-ld';

function applyArticleSchema(meta, canonical) {
  const existing = document.getElementById(ARTICLE_LD_ID);
  if (!meta.article) {
    if (existing) existing.remove();
    return;
  }
  const a = meta.article;
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.title,
    description: a.description,
    datePublished: a.datePublished,
    dateModified: a.datePublished,
    author: { '@type': 'Organization', name: a.author, url: SITE.baseUrl },
    publisher: {
      '@type': 'Organization',
      name: SITE.name,
      logo: { '@type': 'ImageObject', url: SITE.defaultImage },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    articleSection: a.section,
    keywords: Array.isArray(a.tags) ? a.tags.join(', ') : undefined,
    image: SITE.defaultImage,
  };
  let el = existing;
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = ARTICLE_LD_ID;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

/**
 * Apply SEO meta for a resolved route. `meta` comes from getRouteMeta(), but any
 * page can also render <Seo title=... description=... /> directly to override.
 */
function applySeo(meta) {
  const canonical = absUrl(meta.canonicalPath || meta.path || '/');
  const title = meta.title || SITE.defaultTitle;
  const description = meta.description || SITE.defaultDescription;
  const image = absUrl(meta.image || SITE.defaultImage);
  const type = meta.type || 'website';
  const robots = meta.noindex ? 'noindex, follow' : 'index, follow';

  document.title = title;
  upsertMeta('name', 'description', description);
  upsertMeta('name', 'robots', robots);
  upsertLink('canonical', canonical);

  // Open Graph
  upsertMeta('property', 'og:title', title);
  upsertMeta('property', 'og:description', description);
  upsertMeta('property', 'og:url', canonical);
  upsertMeta('property', 'og:image', image);
  upsertMeta('property', 'og:type', type);
  upsertMeta('property', 'og:site_name', SITE.siteName);
  upsertMeta('property', 'og:locale', SITE.locale);

  // Twitter
  upsertMeta('name', 'twitter:card', SITE.twitterCard);
  upsertMeta('name', 'twitter:title', title);
  upsertMeta('name', 'twitter:description', description);
  upsertMeta('name', 'twitter:image', image);

  applyArticleSchema(meta, canonical);

  // Signal for the prerender crawler that head is settled for this route.
  if (typeof window !== 'undefined') window.__SEO_READY__ = canonical;
}

/** Explicit per-page override. Optional — RouteSeo already covers every route. */
export default function Seo(props) {
  useIsoLayoutEffect(() => {
    applySeo(props);
  }, [props.title, props.description, props.canonicalPath, props.path, props.image, props.type, props.noindex]);
  return null;
}

/**
 * Single global integration point. Mounted once above <App/> in main.jsx, it
 * resolves meta for the current pathname (including future routes/guides) and
 * applies it on every navigation. No per-page wiring required.
 */
export function RouteSeo() {
  const { pathname } = useLocation();
  useIsoLayoutEffect(() => {
    applySeo(getRouteMeta(pathname));
  }, [pathname]);
  return null;
}
