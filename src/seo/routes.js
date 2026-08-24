// ─── SEO route manifest — single source of truth ───
//
// Consumed by THREE things, so it never drifts:
//   1. RouteSeo (runtime)      → per-route <title>/description/canonical/robots/OG
//   2. scripts/generate-sitemap.mjs → sitemap.xml
//   3. scripts/prerender.mjs        → which routes get static HTML at build
//
// Pure ESM, no JSX / browser globals, so Node build scripts can import it directly.
//
// Adding a new indexable page = add one entry to STATIC_ROUTES.
// Adding a new guide = just add it to src/data/guides.js — it flows here automatically.

import { GUIDES, getGuideBySlug } from '../data/guides.js';
import { EXERCISE_LIBRARY } from '../data/exercises.js';
import { FIXIT_EXERCISES } from '../data/fixit-exercises.js';
import { GYM_EXERCISES } from '../data/gym-exercises.js';
import { EXERCISE_VIDEOS } from '../data/exercise-videos.js';

const ALL_EXERCISES = [...FIXIT_EXERCISES, ...EXERCISE_LIBRARY, ...GYM_EXERCISES];
export const getExerciseById = (id) => ALL_EXERCISES.find((e) => e.id === id);

// Build the SEO meta for one exercise (shared by the static list + dynamic resolver).
function exerciseMeta(e, path = `/exercise/${e.id}`) {
  const region = e.bodyPart && !/body$/i.test(e.bodyPart) ? ` ${e.bodyPart}` : '';
  const desc = (e.description || `Learn how to do the ${e.name} with proper form.`).replace(/\s+/g, ' ').trim().slice(0, 155);
  return {
    path,
    title: `${e.name} — How to Do It, Proper Form & Video | FIXIT`,
    description: desc,
    changefreq: 'monthly',
    priority: 0.7,
    type: 'exercise',
    exercise: {
      name: e.name,
      bodyPart: e.bodyPart,
      difficulty: e.difficulty,
      video: EXERCISE_VIDEOS[e.id] || null,
      instructions: e.instructions || [],
      description: desc,
      muscles: e.musclesTargeted || [],
    },
  };
}

export const SITE = {
  baseUrl: 'https://fixit.yourformsux.com',
  name: 'FIXIT',
  defaultTitle: 'FIXIT — AI Health Tracker | Exercise Form Analysis & Progress Tracking',
  defaultDescription:
    'FIXIT — Your AI health tracker. Track exercises, analyze form with AI pose detection, monitor pain, and visualize progress. 100+ guided exercises for rehab, fitness, and wellness. Free to start.',
  defaultImage: 'https://fixit.yourformsux.com/og-image.png',
  twitterCard: 'summary_large_image',
  locale: 'en_US',
  siteName: 'FIXIT by YourFormSux',
};

// Absolute URL for a canonical/OG tag from a path.
export function absUrl(path = '/') {
  if (/^https?:\/\//.test(path)) return path;
  return SITE.baseUrl + (path.startsWith('/') ? path : `/${path}`);
}

// ── Static, hand-curated indexable routes ──
// noindex: true  → emit <meta robots="noindex,follow">, exclude from sitemap.
const STATIC_ROUTES = [
  {
    path: '/',
    title: SITE.defaultTitle,
    description: SITE.defaultDescription,
    changefreq: 'weekly',
    priority: 1.0,
    type: 'website',
  },
  {
    path: '/guides',
    title: 'Fitness & Training Guides for Toronto & the GTA | FIXIT',
    description:
      'Free training guides for Toronto and GTA athletes — Hyrox, marathon, CrossFit, calisthenics, nutrition, and body recomposition. Backed by AI-tracked workouts.',
    changefreq: 'weekly',
    priority: 0.9,
    type: 'website',
  },
  {
    path: '/privacy',
    title: 'Privacy Policy | FIXIT AI Health Tracker',
    description:
      'How FIXIT collects, stores, and protects your health and exercise data. PIPEDA-compliant, stored in Canada.',
    changefreq: 'yearly',
    priority: 0.3,
    type: 'website',
  },
  {
    path: '/login',
    title: 'Sign In | FIXIT AI Health Tracker',
    description: 'Sign in to FIXIT to track exercises, log health metrics, and analyze your form with AI.',
    noindex: true, // thin utility page — indexable content lives elsewhere
    type: 'website',
  },
];

// ── Guide article routes, derived from data ──
function guideRoutes() {
  return GUIDES.map((g) => ({
    path: `/guides/${g.slug}`,
    title: `${g.title} | FIXIT`,
    description: g.metaDescription || g.subtitle,
    changefreq: 'monthly',
    priority: 0.8,
    lastmod: g.date,
    type: 'article',
    article: {
      title: g.title,
      description: g.metaDescription || g.subtitle,
      datePublished: g.date,
      author: g.author || 'FIXIT Team',
      section: g.category,
      tags: g.tags,
    },
  }));
}

// ── Public exercise pages, derived from data (the SEO acquisition funnel) ──
function exerciseRoutes() {
  return ALL_EXERCISES.map((e) => exerciseMeta(e));
}

// A public hub that lists every exercise (internal-linking + its own ranking).
const EXERCISE_HUB = {
  path: '/exercise',
  title: 'Exercise Library — How-To Videos & Proper Form | FIXIT',
  description: 'Free exercise library: how-to demo videos and step-by-step form cues for knee, hip, shoulder, back, neck, core and more. Rehab, physio and strength exercises.',
  changefreq: 'weekly',
  priority: 0.9,
  type: 'website',
};

// Full list of routes we generate HTML + sitemap entries for.
export const ROUTES = [...STATIC_ROUTES, EXERCISE_HUB, ...guideRoutes(), ...exerciseRoutes()];

// Just the paths that should be prerendered to static HTML.
export const PRERENDER_PATHS = ROUTES.map((r) => r.path);

// Routes that belong in sitemap.xml (indexable only).
export const SITEMAP_ROUTES = ROUTES.filter((r) => !r.noindex);

// Runtime lookup: resolve the meta for any pathname, including dynamic guide slugs
// and unknown/private app routes (which default to noindex).
export function getRouteMeta(pathname) {
  const path = pathname.replace(/\/+$/, '') || '/';

  const exact = ROUTES.find((r) => r.path === path);
  if (exact) return exact;

  // Dynamic guide detail not in the prebuilt list (shouldn't happen, but safe).
  if (path.startsWith('/guides/')) {
    const slug = path.slice('/guides/'.length);
    const g = getGuideBySlug(slug);
    if (g) {
      return {
        path,
        title: `${g.title} | FIXIT`,
        description: g.metaDescription || g.subtitle,
        type: 'article',
        article: {
          title: g.title,
          description: g.metaDescription || g.subtitle,
          datePublished: g.date,
          author: g.author || 'FIXIT Team',
          section: g.category,
          tags: g.tags,
        },
      };
    }
  }

  // Dynamic public exercise page.
  if (path.startsWith('/exercise/')) {
    const e = getExerciseById(path.slice('/exercise/'.length));
    if (e) return exerciseMeta(e, path);
  }

  // Everything else = private, user-specific app screen → don't index.
  return {
    path,
    title: SITE.defaultTitle,
    description: SITE.defaultDescription,
    noindex: true,
    type: 'website',
  };
}
