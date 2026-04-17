import { useState, useId } from 'react';

// ─── Realistic anatomical exercise illustrations ───
// Uses filled body silhouettes with proper proportions, gradients,
// and smooth CSS-driven joint articulation.

const PALETTE = {
  bodyMain: '#3F5651',       // dark muted teal — body silhouette
  bodyShade: '#2D4039',      // shadow tone
  bodyHighlight: '#5A746D',  // light edge
  bodyOutline: '#1F2E2A',
  shirt: '#708E86',          // shirt accent
  shirtShade: '#5A756D',
  shorts: '#4A615C',
  active: '#D4A853',         // active muscle highlight
  activeGlow: 'rgba(212,168,83,0.35)',
  joint: '#1F2E2A',
  floor: '#C8C5C2',
  mat: '#9FB8B0',
  matEdge: '#7A968D',
  wall: '#D8D5D2',
  wallEdge: '#B8B5B2',
  step: '#A89684',
  stepShade: '#7C6B58',
  guide: '#708E86',
  text: '#4E4E53',
};

// ─── Body part renderers (return JSX) ───

// Tapered limb segment (upper arm, forearm, thigh, shin)
function Limb({ x1, y1, x2, y2, w1 = 11, w2 = 9, fill = PALETTE.bodyMain }) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;
  const ax = x1 + nx * w1, ay = y1 + ny * w1;
  const bx = x2 + nx * w2, by = y2 + ny * w2;
  const cx = x2 - nx * w2, cy = y2 - ny * w2;
  const dxp = x1 - nx * w1, dyp = y1 - ny * w1;
  const d = `M ${ax},${ay} L ${bx},${by} A ${w2},${w2} 0 0 0 ${cx},${cy} L ${dxp},${dyp} A ${w1},${w1} 0 0 0 ${ax},${ay} Z`;
  return <path d={d} fill={fill} stroke={PALETTE.bodyOutline} strokeWidth="0.8" strokeLinejoin="round" />;
}

// Anatomical head (side profile silhouette)
function Head({ cx, cy, r = 13, facing = 'right' }) {
  const flip = facing === 'left' ? -1 : 1;
  // Side-profile head: forehead, nose bump, chin
  const d = `
    M ${cx + flip * r * 0.3},${cy - r}
    Q ${cx + flip * r * 1.0},${cy - r * 0.95} ${cx + flip * r * 1.1},${cy - r * 0.3}
    Q ${cx + flip * r * 1.25},${cy} ${cx + flip * r * 0.95},${cy + r * 0.45}
    Q ${cx + flip * r * 0.6},${cy + r * 1.0} ${cx + flip * r * 0.1},${cy + r * 0.95}
    Q ${cx - flip * r * 0.55},${cy + r * 0.85} ${cx - flip * r * 0.85},${cy + r * 0.3}
    Q ${cx - flip * r * 1.0},${cy - r * 0.4} ${cx - flip * r * 0.55},${cy - r * 0.85}
    Q ${cx - flip * r * 0.1},${cy - r * 1.05} ${cx + flip * r * 0.3},${cy - r} Z
  `;
  return (
    <g>
      <path d={d} fill={PALETTE.bodyMain} stroke={PALETTE.bodyOutline} strokeWidth="0.8" />
      {/* Hair */}
      <path
        d={`M ${cx - r * 0.85},${cy - r * 0.1}
            Q ${cx - r * 0.6},${cy - r * 1.15} ${cx + flip * r * 0.5},${cy - r * 1.1}
            Q ${cx + flip * r * 1.05},${cy - r * 0.95} ${cx + flip * r * 1.05},${cy - r * 0.4}
            Q ${cx + flip * r * 0.7},${cy - r * 0.85} ${cx},${cy - r * 0.7}
            Q ${cx - r * 0.6},${cy - r * 0.6} ${cx - r * 0.85},${cy - r * 0.1} Z`}
        fill={PALETTE.bodyShade}
        stroke={PALETTE.bodyOutline}
        strokeWidth="0.6"
      />
    </g>
  );
}

// Torso shape — natural curve from shoulder to hip
function Torso({ shoulderX, shoulderY, hipX, hipY, sw = 18, hw = 14, fill = PALETTE.shirt, lying = false }) {
  if (lying) {
    // Horizontal lying torso
    return (
      <path
        d={`M ${shoulderX},${shoulderY - sw}
            Q ${(shoulderX + hipX) / 2},${shoulderY - sw - 2} ${hipX},${hipY - hw}
            L ${hipX + 4},${hipY + hw}
            Q ${(shoulderX + hipX) / 2},${shoulderY + sw + 1} ${shoulderX - 2},${shoulderY + sw}
            Z`}
        fill={fill}
        stroke={PALETTE.bodyOutline}
        strokeWidth="0.8"
      />
    );
  }
  return (
    <path
      d={`M ${shoulderX - sw},${shoulderY}
          Q ${shoulderX - sw - 2},${(shoulderY + hipY) / 2} ${hipX - hw},${hipY}
          L ${hipX + hw},${hipY}
          Q ${shoulderX + sw + 2},${(shoulderY + hipY) / 2} ${shoulderX + sw},${shoulderY}
          Z`}
      fill={fill}
      stroke={PALETTE.bodyOutline}
      strokeWidth="0.8"
    />
  );
}

// Foot shape
function Foot({ cx, cy, length = 16, height = 6, facing = 'right' }) {
  const f = facing === 'left' ? -1 : 1;
  return (
    <path
      d={`M ${cx},${cy - height / 2}
          L ${cx + f * length * 0.85},${cy - height / 2}
          Q ${cx + f * (length + 2)},${cy} ${cx + f * length * 0.85},${cy + height / 2}
          L ${cx},${cy + height / 2}
          Q ${cx - f * 2},${cy} ${cx},${cy - height / 2} Z`}
      fill={PALETTE.bodyShade}
      stroke={PALETTE.bodyOutline}
      strokeWidth="0.8"
    />
  );
}

// Joint marker
function Joint({ cx, cy, r = 3 }) {
  return <circle cx={cx} cy={cy} r={r} fill={PALETTE.bodyOutline} opacity="0.6" />;
}

// Active muscle highlight
function MuscleHighlight({ cx, cy, rx = 18, ry = 10, label, className, ps }) {
  return (
    <g className={className} style={{ animationPlayState: ps }}>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry}
        fill={PALETTE.activeGlow}
        stroke={PALETTE.active}
        strokeWidth="1.2"
        strokeDasharray="3 2" />
      {label && (
        <text x={cx} y={cy - ry - 4} fontSize="7.5" fill={PALETTE.active}
          fontWeight="700" textAnchor="middle" fontFamily="Public Sans" letterSpacing="0.5">
          {label}
        </text>
      )}
    </g>
  );
}

// Hold timer badge
function HoldBadge({ cx, cy, text, className, ps }) {
  return (
    <g className={className} style={{ animationPlayState: ps }}>
      <rect x={cx - 36} y={cy - 12} width="72" height="22" rx="11"
        fill="#6BA368" opacity="0.14" />
      <rect x={cx - 36} y={cy - 12} width="72" height="22" rx="11"
        fill="none" stroke="#6BA368" strokeWidth="1" opacity="0.4" />
      <text x={cx} y={cy + 3} fontSize="9.5" fill="#4D7A4A"
        fontWeight="700" textAnchor="middle" fontFamily="Public Sans" letterSpacing="0.5">
        {text}
      </text>
    </g>
  );
}

// Mat
function Mat({ x = 20, y = 248, w = 280, h = 12 }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="3" fill={PALETTE.mat} />
      <rect x={x} y={y} width={w} height="3" rx="2" fill={PALETTE.matEdge} opacity="0.5" />
    </g>
  );
}

// Floor line
function Floor({ y = 264 }) {
  return <line x1="0" y1={y} x2="320" y2={y} stroke={PALETTE.floor} strokeWidth="2" />;
}

// Angle arc indicator
function AngleArc({ cx, cy, r = 24, start, end, label }) {
  const s = (start * Math.PI) / 180;
  const e = (end * Math.PI) / 180;
  const x1 = cx + r * Math.cos(s), y1 = cy + r * Math.sin(s);
  const x2 = cx + r * Math.cos(e), y2 = cy + r * Math.sin(e);
  const large = Math.abs(end - start) > 180 ? 1 : 0;
  const mx = cx + (r + 9) * Math.cos((s + e) / 2);
  const my = cy + (r + 9) * Math.sin((s + e) / 2) + 2;
  return (
    <g opacity="0.7">
      <path d={`M ${x1},${y1} A ${r},${r} 0 ${large} 1 ${x2},${y2}`}
        fill="none" stroke={PALETTE.active} strokeWidth="1.2" strokeDasharray="3 2" />
      {label && (
        <text x={mx} y={my} fontSize="8.5" fill={PALETTE.active}
          fontWeight="700" textAnchor="middle" fontFamily="Public Sans">
          {label}
        </text>
      )}
    </g>
  );
}

// ─── Main Component ───
export default function ExerciseAnimation({ exerciseId }) {
  const [speed, setSpeed] = useState(1);
  const [paused, setPaused] = useState(false);
  const uid = 'a' + useId().replace(/:/g, '');
  const anim = EXERCISES[exerciseId];

  if (!anim) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #F0F5F3, #E2ECE8)',
        borderRadius: '16px', padding: '40px 20px', textAlign: 'center',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🏋️‍♀️</div>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text)' }}>Visual guide coming soon</p>
      </div>
    );
  }

  const dur = (anim.duration || 4) / speed;
  const ps = paused ? 'paused' : 'running';

  return (
    <div style={{
      background: 'white', borderRadius: '16px',
      border: '1px solid var(--color-border)', overflow: 'hidden',
    }}>
      <div style={{
        background: 'linear-gradient(180deg, #F8FAF9 0%, #E8F0EC 100%)',
        padding: '14px 12px 8px',
        position: 'relative',
        minHeight: '270px',
      }}>
        <style>{anim.css(uid, dur)}</style>
        <svg viewBox="0 0 320 280"
          style={{ width: '100%', height: 'auto', maxHeight: '320px', display: 'block' }}>
          <defs>
            <linearGradient id={`${uid}-bodyG`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={PALETTE.bodyHighlight} />
              <stop offset="50%" stopColor={PALETTE.bodyMain} />
              <stop offset="100%" stopColor={PALETTE.bodyShade} />
            </linearGradient>
            <linearGradient id={`${uid}-shirtG`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={PALETTE.shirt} />
              <stop offset="100%" stopColor={PALETTE.shirtShade} />
            </linearGradient>
            <radialGradient id={`${uid}-glow`}>
              <stop offset="0%" stopColor={PALETTE.activeGlow} />
              <stop offset="100%" stopColor="rgba(212,168,83,0)" />
            </radialGradient>
            <filter id={`${uid}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2.5" stdDeviation="2.5" floodColor="#000" floodOpacity="0.12" />
            </filter>
          </defs>
          <g filter={`url(#${uid}-shadow)`}>
            {anim.svg(uid, ps)}
          </g>
        </svg>
        <div style={{
          position: 'absolute', top: '14px', left: '16px',
          fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '1.8px', color: PALETTE.bodyMain, opacity: 0.65,
        }}>
          {anim.title}
        </div>
      </div>

      <div style={{
        padding: '10px 16px',
        borderTop: '1px solid var(--color-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#FAFCFB', gap: '10px',
      }}>
        <button
          onClick={() => setPaused(!paused)}
          style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: paused ? PALETTE.shirt : 'var(--color-bg-alt)',
            border: '1px solid var(--color-border)',
            color: paused ? 'white' : PALETTE.shirt,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: '13px', flexShrink: 0,
          }}
        >
          {paused ? '▶' : '⏸'}
        </button>

        <div style={{
          fontSize: '0.78rem', color: 'var(--color-secondary)',
          fontWeight: 500, textAlign: 'center', flex: 1, lineHeight: 1.35,
        }}>
          {anim.caption}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
          {[0.5, 1, 1.5].map(s => (
            <button key={s} onClick={() => setSpeed(s)} style={{
              padding: '4px 8px', borderRadius: '6px', border: 'none',
              background: speed === s ? PALETTE.shirt : 'transparent',
              color: speed === s ? 'white' : 'var(--color-text)',
              fontSize: '0.62rem', fontWeight: 600, cursor: 'pointer',
              minWidth: '28px',
            }}>
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── EXERCISE DEFINITIONS ───

const EXERCISES = {
  // ============ QUAD SETS ============
  'quad-sets': {
    title: 'Quad Sets',
    caption: 'Press knee down → squeeze quad → hold 5 seconds → relax',
    duration: 5,
    css: (u, d) => `
      @keyframes ${u}-press{0%,100%{transform:translateY(0)}30%,70%{transform:translateY(3px)}}
      @keyframes ${u}-glow{0%,100%{opacity:0;transform:scale(0.6)}30%,70%{opacity:1;transform:scale(1.05)}}
      @keyframes ${u}-badge{0%,18%,82%,100%{opacity:0}30%,70%{opacity:1}}
      @keyframes ${u}-arrow{0%,100%{opacity:0;transform:translateY(-3px)}30%,70%{opacity:1;transform:translateY(0)}}
      .${u}-leg{animation:${u}-press ${d}s ease-in-out infinite;transform-origin:155px 200px}
      .${u}-glow{animation:${u}-glow ${d}s ease-in-out infinite;transform-origin:200px 200px}
      .${u}-badge{animation:${u}-badge ${d}s ease-in-out infinite}
      .${u}-arrow{animation:${u}-arrow ${d}s ease-in-out infinite}
    `,
    svg: (u, ps) => (
      <g>
        <Mat />
        <Floor />
        {/* Pillow under head */}
        <ellipse cx="50" cy="200" rx="22" ry="9" fill="#E8E0D8" stroke={PALETTE.bodyOutline} strokeWidth="0.8" />
        {/* Lying body */}
        <Head cx="48" cy="190" facing="right" />
        {/* Torso (lying) */}
        <Torso shoulderX={62} shoulderY={205} hipX={150} hipY={207} sw={18} hw={16} fill={`url(#${u}-shirtG)`} lying />
        {/* Left arm along body */}
        <Limb x1={75} y1={210} x2={72} y2={232} w1={6} w2={5} />
        {/* Right arm */}
        <Limb x1={130} y1={212} x2={128} y2={234} w1={6} w2={5} />
        {/* Right leg bent (uninjured) */}
        <Limb x1={148} y1={200} x2={185} y2={195} w1={9} w2={8} fill={PALETTE.shorts} />
        <Limb x1={185} y1={195} x2={195} y2={232} w1={8} w2={7} />
        <Joint cx={185} cy={195} r={3.5} />
        <Foot cx={195} cy={235} length={12} height={5} facing="right" />
        {/* Animated left leg pressing down */}
        <g className={`${u}-leg`} style={{ animationPlayState: ps }}>
          <Limb x1={148} y1={208} x2={235} y2={213} w1={10} w2={8} fill={PALETTE.shorts} />
          <Limb x1={235} y1={213} x2={278} y2={210} w1={8} w2={7} />
          <Joint cx={235} cy={213} r={3.5} />
          <Foot cx={282} cy={210} length={11} height={5} facing="right" />
        </g>
        {/* Quad muscle highlight */}
        <MuscleHighlight cx={195} cy={208} rx={28} ry={9} label="QUAD ENGAGED" className={`${u}-glow`} ps={ps} />
        {/* Down arrow */}
        <g className={`${u}-arrow`} style={{ animationPlayState: ps }}>
          <line x1={233} y1={186} x2={233} y2={205} stroke={PALETTE.active} strokeWidth="2" markerEnd={`url(#${u}-ah)`} />
        </g>
        <HoldBadge cx={155} cy={170} text="HOLD 5 SEC" className={`${u}-badge`} ps={ps} />
        <defs>
          <marker id={`${u}-ah`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <polygon points="0 0, 6 3, 0 6" fill={PALETTE.active} />
          </marker>
        </defs>
      </g>
    ),
  },

  // ============ STRAIGHT LEG RAISE ============
  'straight-leg-raise': {
    title: 'Straight Leg Raise',
    caption: 'Lock knee → lift to 45° → hold 3 seconds → lower slowly',
    duration: 5,
    css: (u, d) => `
      @keyframes ${u}-lift{0%,100%{transform:rotate(0deg)}25%,75%{transform:rotate(-32deg)}}
      @keyframes ${u}-badge{0%,18%,82%,100%{opacity:0}30%,70%{opacity:1}}
      .${u}-raise{animation:${u}-lift ${d}s ease-in-out infinite;transform-origin:152px 207px}
      .${u}-badge{animation:${u}-badge ${d}s ease-in-out infinite}
    `,
    svg: (u, ps) => (
      <g>
        <Mat />
        <Floor />
        <ellipse cx="50" cy="200" rx="22" ry="9" fill="#E8E0D8" stroke={PALETTE.bodyOutline} strokeWidth="0.8" />
        <Head cx="48" cy="190" facing="right" />
        <Torso shoulderX={62} shoulderY={205} hipX={150} hipY={207} sw={18} hw={16} fill={`url(#${u}-shirtG)`} lying />
        <Limb x1={75} y1={210} x2={72} y2={232} w1={6} w2={5} />
        {/* Bent leg */}
        <Limb x1={148} y1={200} x2={180} y2={188} w1={9} w2={8} fill={PALETTE.shorts} />
        <Limb x1={180} y1={188} x2={192} y2={232} w1={8} w2={7} />
        <Joint cx={180} cy={188} r={3.5} />
        <Foot cx={192} cy={235} length={12} height={5} facing="right" />
        {/* Ghost of lowered position */}
        <g opacity="0.12">
          <Limb x1={148} y1={213} x2={235} y2={216} w1={9} w2={7} />
          <Limb x1={235} y1={216} x2={278} y2={213} w1={7} w2={6} />
        </g>
        {/* Animated leg lifting */}
        <g className={`${u}-raise`} style={{ animationPlayState: ps }}>
          <Limb x1={152} y1={213} x2={235} y2={216} w1={10} w2={8} fill={PALETTE.shorts} />
          <Limb x1={235} y1={216} x2={278} y2={213} w1={8} w2={7} />
          <Joint cx={235} cy={216} r={3.5} />
          <Foot cx={282} cy={213} length={11} height={5} facing="right" />
        </g>
        <AngleArc cx={152} cy={213} r={32} start={0} end={-32} label="45°" />
        <HoldBadge cx={210} cy={155} text="HOLD 3 SEC" className={`${u}-badge`} ps={ps} />
      </g>
    ),
  },

  // ============ HEEL SLIDES ============
  'heel-slides': {
    title: 'Heel Slides',
    caption: 'Slide heel toward you → bend knee to 90° → slide back out',
    duration: 5,
    css: (u, d) => `
      @keyframes ${u}-bend{0%,100%{transform:translateX(0) rotate(0deg)}30%,70%{transform:translateX(-45px) rotate(-65deg)}}
      .${u}-leg{animation:${u}-bend ${d}s ease-in-out infinite;transform-origin:152px 213px}
    `,
    svg: (u, ps) => (
      <g>
        <Mat />
        <Floor />
        <ellipse cx="50" cy="200" rx="22" ry="9" fill="#E8E0D8" stroke={PALETTE.bodyOutline} strokeWidth="0.8" />
        <Head cx="48" cy="190" facing="right" />
        <Torso shoulderX={62} shoulderY={205} hipX={150} hipY={207} sw={18} hw={16} fill={`url(#${u}-shirtG)`} lying />
        <Limb x1={75} y1={210} x2={72} y2={232} w1={6} w2={5} />
        {/* Other leg straight */}
        <Limb x1={148} y1={200} x2={235} y2={203} w1={9} w2={7} fill={PALETTE.shorts} />
        <Limb x1={235} y1={203} x2={278} y2={200} w1={7} w2={6} />
        <Foot cx={282} cy={200} length={11} height={5} facing="right" />
        {/* Animated leg sliding */}
        <g className={`${u}-leg`} style={{ animationPlayState: ps }}>
          <Limb x1={152} y1={213} x2={240} y2={216} w1={10} w2={8} fill={PALETTE.shorts} />
          <Limb x1={240} y1={216} x2={282} y2={213} w1={8} w2={7} />
          <Joint cx={240} cy={216} r={3.5} />
          <Foot cx={286} cy={213} length={11} height={5} facing="right" />
        </g>
        {/* Slide guide */}
        <g opacity="0.4">
          <line x1={200} y1={245} x2={278} y2={245} stroke={PALETTE.guide} strokeWidth="1" strokeDasharray="3 3" />
          <text x={239} y={258} fontSize="7.5" fill={PALETTE.guide} fontWeight="600" textAnchor="middle" fontFamily="Public Sans" letterSpacing="0.5">
            ← SLIDE HEEL →
          </text>
        </g>
      </g>
    ),
  },

  // ============ WALL SITS ============
  'wall-sits': {
    title: 'Wall Sits',
    caption: 'Slide down wall to 60° knee bend → hold 20 seconds → push up',
    duration: 6,
    css: (u, d) => `
      @keyframes ${u}-slide{0%,100%{transform:translateY(0) translateX(0)}30%,70%{transform:translateY(48px) translateX(28px)}}
      @keyframes ${u}-bend{0%,100%{transform:rotate(0deg)}30%,70%{transform:rotate(0deg)}}
      @keyframes ${u}-badge{0%,18%,82%,100%{opacity:0}30%,70%{opacity:1}}
      .${u}-upper{animation:${u}-slide ${d}s ease-in-out infinite}
      .${u}-badge{animation:${u}-badge ${d}s ease-in-out infinite}
    `,
    svg: (u, ps) => (
      <g>
        {/* Wall */}
        <rect x={48} y={50} width={18} height={220} rx="2" fill={PALETTE.wall} stroke={PALETTE.bodyOutline} strokeWidth="0.8" />
        <rect x={48} y={50} width={5} height={220} fill={PALETTE.wallEdge} opacity="0.4" />
        <Floor />
        {/* Ghost standing position */}
        <g opacity="0.1">
          <Head cx={92} cy={75} facing="right" />
          <Torso shoulderX={92} shoulderY={92} hipX={92} hipY={170} sw={17} hw={14} fill={PALETTE.shirt} />
          <Limb x1={92} y1={170} x2={88} y2={232} w1={11} w2={9} fill={PALETTE.shorts} />
          <Limb x1={88} y1={232} x2={88} y2={262} w1={9} w2={8} />
        </g>
        {/* Active body */}
        <g className={`${u}-upper`} style={{ animationPlayState: ps }}>
          <Head cx={92} cy={75} facing="right" />
          <Torso shoulderX={92} shoulderY={92} hipX={92} hipY={172} sw={17} hw={14} fill={`url(#${u}-shirtG)`} />
          {/* Arms folded forward slightly */}
          <Limb x1={78} y1={102} x2={75} y2={148} w1={7} w2={6} />
          <Limb x1={106} y1={102} x2={109} y2={148} w1={7} w2={6} />
          {/* Thighs going horizontal as we slide */}
          <Limb x1={92} y1={172} x2={138} y2={178} w1={11} w2={10} fill={PALETTE.shorts} />
          <Limb x1={138} y1={178} x2={140} y2={232} w1={10} w2={9} />
          <Joint cx={138} cy={178} r={4} />
          <Foot cx={144} cy={234} length={13} height={5} facing="right" />
        </g>
        {/* Stationary lower legs (planted on floor where slid version goes) */}
        <HoldBadge cx={220} cy={150} text="HOLD 20 SEC" className={`${u}-badge`} ps={ps} />
      </g>
    ),
  },

  // ============ MINI SQUATS ============
  'mini-squats': {
    title: 'Mini Squats',
    caption: 'Sit back → bend knees to 45° → push through heels to stand',
    duration: 4,
    css: (u, d) => `
      @keyframes ${u}-squat{0%,100%{transform:translateY(0)}40%,60%{transform:translateY(38px)}}
      .${u}-body{animation:${u}-squat ${d}s ease-in-out infinite}
    `,
    svg: (u, ps) => (
      <g>
        <Floor />
        <g opacity="0.08">
          <Head cx={160} cy={60} facing="right" />
          <Torso shoulderX={160} shoulderY={77} hipX={160} hipY={155} sw={17} hw={14} fill={PALETTE.shirt} />
        </g>
        <g className={`${u}-body`} style={{ animationPlayState: ps }}>
          <Head cx={160} cy={60} facing="right" />
          <Torso shoulderX={160} shoulderY={77} hipX={158} hipY={158} sw={17} hw={14} fill={`url(#${u}-shirtG)`} />
          {/* Arms forward for balance */}
          <Limb x1={146} y1={87} x2={130} y2={130} w1={7} w2={6} />
          <Limb x1={174} y1={87} x2={190} y2={130} w1={7} w2={6} />
          {/* Front leg */}
          <Limb x1={152} y1={158} x2={132} y2={205} w1={12} w2={10} fill={PALETTE.shorts} />
          <Limb x1={132} y1={205} x2={138} y2={245} w1={10} w2={9} />
          <Joint cx={132} cy={205} r={4} />
          <Foot cx={144} cy={247} length={14} height={5} facing="right" />
          {/* Back leg */}
          <Limb x1={164} y1={158} x2={184} y2={205} w1={12} w2={10} fill={PALETTE.shorts} />
          <Limb x1={184} y1={205} x2={178} y2={245} w1={10} w2={9} />
          <Joint cx={184} cy={205} r={4} />
          <Foot cx={184} cy={247} length={14} height={5} facing="right" />
        </g>
        <text x={160} y={262} fontSize="7" fill={PALETTE.active} fontWeight="700" textAnchor="middle" fontFamily="Public Sans" letterSpacing="0.8" opacity="0.6">
          PUSH THROUGH HEELS
        </text>
      </g>
    ),
  },

  // ============ STEP UPS ============
  'step-ups': {
    title: 'Step Ups',
    caption: 'Step onto platform → drive through heel → stand tall → lower',
    duration: 5,
    css: (u, d) => `
      @keyframes ${u}-up{0%,100%{transform:translateY(0)}30%,70%{transform:translateY(-32px)}}
      .${u}-body{animation:${u}-up ${d}s ease-in-out infinite}
    `,
    svg: (u, ps) => (
      <g>
        <Floor />
        <rect x={115} y={235} width={95} height={28} rx={4} fill={PALETTE.step} stroke={PALETTE.bodyOutline} strokeWidth="0.8" />
        <rect x={115} y={235} width={95} height={5} rx={2} fill={PALETTE.stepShade} opacity="0.4" />
        <g className={`${u}-body`} style={{ animationPlayState: ps }}>
          <Head cx={150} cy={75} facing="right" />
          <Torso shoulderX={150} shoulderY={92} hipX={150} hipY={170} sw={17} hw={14} fill={`url(#${u}-shirtG)`} />
          <Limb x1={136} y1={102} x2={122} y2={138} w1={7} w2={6} />
          <Limb x1={164} y1={102} x2={178} y2={138} w1={7} w2={6} />
          {/* Front leg on step */}
          <Limb x1={144} y1={170} x2={140} y2={210} w1={11} w2={9} fill={PALETTE.shorts} />
          <Limb x1={140} y1={210} x2={142} y2={236} w1={9} w2={8} />
          <Joint cx={140} cy={210} r={4} />
          <Foot cx={150} cy={238} length={13} height={5} facing="right" />
          {/* Back leg on floor */}
          <Limb x1={156} y1={170} x2={170} y2={222} w1={11} w2={9} fill={PALETTE.shorts} />
          <Limb x1={170} y1={222} x2={168} y2={262} w1={9} w2={8} />
          <Joint cx={170} cy={222} r={4} />
          <Foot cx={172} cy={264} length={13} height={5} facing="right" />
        </g>
      </g>
    ),
  },

  // ============ HAMSTRING CURLS ============
  'hamstring-curls': {
    title: 'Standing Hamstring Curls',
    caption: 'Stand tall → curl heel toward buttock → hold → lower slowly',
    duration: 4,
    css: (u, d) => `
      @keyframes ${u}-curl{0%,100%{transform:rotate(0deg)}30%,70%{transform:rotate(-115deg)}}
      .${u}-shin{animation:${u}-curl ${d}s ease-in-out infinite;transform-origin:175px 200px}
    `,
    svg: (u, ps) => (
      <g>
        <Floor />
        {/* Chair for balance */}
        <rect x={62} y={150} width={6} height={114} rx={2} fill={PALETTE.wall} stroke={PALETTE.bodyOutline} strokeWidth="0.7" />
        <rect x={50} y={144} width={28} height={8} rx={3} fill={PALETTE.wallEdge} stroke={PALETTE.bodyOutline} strokeWidth="0.7" />
        {/* Person */}
        <Head cx={140} cy={68} facing="right" />
        <Torso shoulderX={140} shoulderY={85} hipX={140} hipY={163} sw={17} hw={14} fill={`url(#${u}-shirtG)`} />
        {/* Left arm to chair */}
        <Limb x1={126} y1={95} x2={95} y2={130} w1={7} w2={6} />
        <Limb x1={95} y1={130} x2={75} y2={150} w1={6} w2={5} />
        {/* Right arm */}
        <Limb x1={154} y1={95} x2={162} y2={138} w1={7} w2={6} />
        {/* Standing leg */}
        <Limb x1={134} y1={163} x2={130} y2={220} w1={12} w2={10} fill={PALETTE.shorts} />
        <Limb x1={130} y1={220} x2={130} y2={258} w1={10} w2={9} />
        <Joint cx={130} cy={220} r={4} />
        <Foot cx={138} cy={260} length={13} height={5} facing="right" />
        {/* Curling leg — thigh stays vertical */}
        <Limb x1={150} y1={163} x2={175} y2={210} w1={12} w2={10} fill={PALETTE.shorts} />
        <Joint cx={175} cy={210} r={4} />
        {/* Animated shin */}
        <g className={`${u}-shin`} style={{ animationPlayState: ps }}>
          <Limb x1={175} y1={210} x2={175} y2={258} w1={10} w2={9} />
          <Foot cx={183} cy={260} length={13} height={5} facing="right" />
        </g>
      </g>
    ),
  },

  // ============ CLAMSHELLS ============
  'clamshells': {
    title: 'Clamshells',
    caption: 'Side lying → keep feet together → open top knee → close',
    duration: 4,
    css: (u, d) => `
      @keyframes ${u}-open{0%,100%{transform:rotate(0deg)}30%,70%{transform:rotate(-32deg)}}
      @keyframes ${u}-glow{0%,100%{opacity:0;transform:scale(0.6)}30%,70%{opacity:1;transform:scale(1)}}
      .${u}-topleg{animation:${u}-open ${d}s ease-in-out infinite;transform-origin:155px 200px}
      .${u}-glow{animation:${u}-glow ${d}s ease-in-out infinite;transform-origin:155px 200px}
    `,
    svg: (u, ps) => (
      <g>
        <Mat />
        <Floor />
        {/* Side-lying body */}
        <Head cx={50} cy={185} facing="right" />
        {/* Torso lying on side */}
        <Torso shoulderX={64} shoulderY={200} hipX={155} hipY={203} sw={16} hw={14} fill={`url(#${u}-shirtG)`} lying />
        {/* Support arm under head */}
        <Limb x1={56} y1={195} x2={42} y2={210} w1={6} w2={5} />
        {/* Top arm on hip */}
        <Limb x1={120} y1={194} x2={140} y2={205} w1={7} w2={5} />
        {/* Bottom leg */}
        <Limb x1={155} y1={210} x2={205} y2={205} w1={10} w2={9} fill={PALETTE.shorts} />
        <Limb x1={205} y1={205} x2={232} y2={232} w1={9} w2={8} />
        <Joint cx={205} cy={205} r={4} />
        <Foot cx={236} cy={234} length={11} height={5} facing="right" />
        {/* Top leg — animated */}
        <g className={`${u}-topleg`} style={{ animationPlayState: ps }}>
          <Limb x1={155} y1={196} x2={205} y2={196} w1={10} w2={9} fill={PALETTE.shorts} />
          <Limb x1={205} y1={196} x2={232} y2={222} w1={9} w2={8} />
          <Joint cx={205} cy={196} r={4} />
          <Foot cx={236} cy={224} length={11} height={5} facing="right" />
        </g>
        <MuscleHighlight cx={155} cy={200} rx={20} ry={11} label="GLUTE MED" className={`${u}-glow`} ps={ps} />
      </g>
    ),
  },

  // ============ SINGLE LEG BALANCE ============
  'single-leg-balance': {
    title: 'Single Leg Balance',
    caption: 'Stand on injured leg → lift other foot → hold steady 30 seconds',
    duration: 4,
    css: (u, d) => `
      @keyframes ${u}-sway{0%,100%{transform:translateX(0) rotate(0deg)}25%{transform:translateX(-2px) rotate(-0.6deg)}75%{transform:translateX(2px) rotate(0.6deg)}}
      @keyframes ${u}-lift{0%{transform:rotate(0deg)}40%,60%{transform:rotate(-22deg)}100%{transform:rotate(0deg)}}
      .${u}-body{animation:${u}-sway ${d}s ease-in-out infinite;transform-origin:140px 250px}
      .${u}-freeleg{animation:${u}-lift ${d}s ease-in-out infinite;transform-origin:160px 168px}
    `,
    svg: (u, ps) => (
      <g>
        <Floor />
        {/* Wall reference */}
        <rect x={45} y={70} width={6} height={194} rx={1} fill={PALETTE.wall} opacity="0.6" />
        <g className={`${u}-body`} style={{ animationPlayState: ps }}>
          <Head cx={140} cy={75} facing="right" />
          <Torso shoulderX={140} shoulderY={92} hipX={140} hipY={168} sw={17} hw={14} fill={`url(#${u}-shirtG)`} />
          <Limb x1={126} y1={102} x2={108} y2={140} w1={7} w2={6} />
          <Limb x1={154} y1={102} x2={172} y2={140} w1={7} w2={6} />
          {/* Standing leg */}
          <Limb x1={134} y1={168} x2={132} y2={222} w1={12} w2={10} fill={PALETTE.shorts} />
          <Limb x1={132} y1={222} x2={132} y2={262} w1={10} w2={9} />
          <Joint cx={132} cy={222} r={4} />
          <Foot cx={140} cy={264} length={14} height={5} facing="right" />
          {/* Lifted free leg */}
          <g className={`${u}-freeleg`} style={{ animationPlayState: ps }}>
            <Limb x1={148} y1={168} x2={170} y2={210} w1={12} w2={10} fill={PALETTE.shorts} />
            <Limb x1={170} y1={210} x2={172} y2={245} w1={10} w2={9} />
            <Joint cx={170} cy={210} r={4} />
            <Foot cx={180} cy={247} length={13} height={5} facing="right" />
          </g>
        </g>
        <HoldBadge cx={235} cy={130} text="HOLD 30 SEC" />
        <text x={140} y={62} fontSize="7.5" fill={PALETTE.active} fontWeight="700" textAnchor="middle" fontFamily="Public Sans" letterSpacing="0.5" opacity="0.6">
          👁  EYES FORWARD
        </text>
      </g>
    ),
  },

  // ============ GLUTE BRIDGE ============
  'bridge': {
    title: 'Glute Bridge',
    caption: 'Squeeze glutes → drive hips up → straight line → hold → lower',
    duration: 5,
    css: (u, d) => `
      @keyframes ${u}-lift{0%,100%{transform:translateY(0) rotate(0deg)}30%,70%{transform:translateY(-22px) rotate(-8deg)}}
      @keyframes ${u}-glow{0%,100%{opacity:0;transform:scale(0.5)}30%,70%{opacity:0.7;transform:scale(1)}}
      .${u}-hips{animation:${u}-lift ${d}s ease-in-out infinite;transform-origin:80px 215px}
      .${u}-glow{animation:${u}-glow ${d}s ease-in-out infinite;transform-origin:135px 200px}
    `,
    svg: (u, ps) => (
      <g>
        <Mat />
        <Floor />
        {/* Head — stays */}
        <Head cx={45} cy={207} facing="right" r={11} />
        {/* Body that lifts */}
        <g className={`${u}-hips`} style={{ animationPlayState: ps }}>
          <Torso shoulderX={58} shoulderY={215} hipX={150} hipY={216} sw={16} hw={14} fill={`url(#${u}-shirtG)`} lying />
          {/* Arms along body */}
          <Limb x1={72} y1={220} x2={70} y2={244} w1={6} w2={5} />
          <Limb x1={120} y1={222} x2={118} y2={244} w1={6} w2={5} />
          {/* Legs bent */}
          <Limb x1={148} y1={210} x2={195} y2={214} w1={11} w2={10} fill={PALETTE.shorts} />
          <Limb x1={195} y1={214} x2={200} y2={244} w1={10} w2={9} />
          <Joint cx={195} cy={214} r={4} />
          <Foot cx={205} cy={246} length={11} height={5} facing="right" />
          <Limb x1={148} y1={222} x2={203} y2={222} w1={11} w2={10} fill={PALETTE.shorts} />
          <Limb x1={203} y1={222} x2={206} y2={244} w1={10} w2={9} />
          <Joint cx={203} cy={222} r={4} />
        </g>
        <MuscleHighlight cx={130} cy={205} rx={24} ry={10} label="GLUTES" className={`${u}-glow`} ps={ps} />
      </g>
    ),
  },

  // ============ PENDULUM SWINGS ============
  'pendulum': {
    title: 'Pendulum Swings',
    caption: 'Lean forward on table → let arm hang → swing in gentle circles',
    duration: 3,
    css: (u, d) => `
      @keyframes ${u}-swing{0%{transform:rotate(-18deg)}50%{transform:rotate(18deg)}100%{transform:rotate(-18deg)}}
      .${u}-arm{animation:${u}-swing ${d}s ease-in-out infinite;transform-origin:115px 138px}
    `,
    svg: (u, ps) => (
      <g>
        <Floor />
        {/* Table */}
        <rect x={155} y={130} width={70} height={8} rx={2} fill={PALETTE.wallEdge} stroke={PALETTE.bodyOutline} strokeWidth="0.7" />
        <rect x={180} y={138} width={6} height={126} fill={PALETTE.wall} stroke={PALETTE.bodyOutline} strokeWidth="0.7" />
        {/* Person leaning */}
        <Head cx={108} cy={92} facing="right" />
        {/* Tilted torso */}
        <Torso shoulderX={118} shoulderY={108} hipX={138} hipY={188} sw={17} hw={14} fill={`url(#${u}-shirtG)`} />
        {/* Support arm on table */}
        <Limb x1={130} y1={117} x2={158} y2={132} w1={7} w2={6} />
        {/* Standing legs */}
        <Limb x1={132} y1={188} x2={128} y2={236} w1={11} w2={10} fill={PALETTE.shorts} />
        <Limb x1={128} y1={236} x2={128} y2={262} w1={10} w2={9} />
        <Joint cx={128} cy={236} r={4} />
        <Foot cx={136} cy={264} length={13} height={5} facing="right" />
        {/* Hanging arm — animated */}
        <g className={`${u}-arm`} style={{ animationPlayState: ps }}>
          <Limb x1={115} y1={138} x2={108} y2={185} w1={7} w2={6} />
          <Limb x1={108} y1={185} x2={104} y2={222} w1={6} w2={5} />
          <Joint cx={108} cy={185} r={3.5} />
        </g>
        {/* Circle path hint */}
        <ellipse cx={104} cy={228} rx={22} ry={14} fill="none" stroke={PALETTE.guide} strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
      </g>
    ),
  },

  // ============ WALL ANGELS ============
  'wall-angels': {
    title: 'Wall Angels',
    caption: 'Back against wall → arms in goalpost → slide overhead → return',
    duration: 5,
    css: (u, d) => `
      @keyframes ${u}-armL{0%,100%{transform:rotate(0deg)}30%,70%{transform:rotate(40deg)}}
      @keyframes ${u}-armR{0%,100%{transform:rotate(0deg)}30%,70%{transform:rotate(-40deg)}}
      .${u}-armL{animation:${u}-armL ${d}s ease-in-out infinite;transform-origin:75px 110px}
      .${u}-armR{animation:${u}-armR ${d}s ease-in-out infinite;transform-origin:115px 110px}
    `,
    svg: (u, ps) => (
      <g>
        {/* Wall */}
        <rect x={45} y={45} width={18} height={222} rx={2} fill={PALETTE.wall} stroke={PALETTE.bodyOutline} strokeWidth="0.8" />
        <rect x={45} y={45} width={5} height={222} fill={PALETTE.wallEdge} opacity="0.4" />
        <Floor />
        {/* Body facing forward */}
        <Head cx={95} cy={75} facing="right" />
        <Torso shoulderX={95} shoulderY={92} hipX={95} hipY={170} sw={20} hw={16} fill={`url(#${u}-shirtG)`} />
        {/* Legs */}
        <Limb x1={89} y1={170} x2={85} y2={222} w1={11} w2={10} fill={PALETTE.shorts} />
        <Limb x1={85} y1={222} x2={85} y2={262} w1={10} w2={9} />
        <Foot cx={89} cy={264} length={13} height={5} facing="right" />
        <Limb x1={101} y1={170} x2={105} y2={222} w1={11} w2={10} fill={PALETTE.shorts} />
        <Limb x1={105} y1={222} x2={105} y2={262} w1={10} w2={9} />
        <Foot cx={109} cy={264} length={13} height={5} facing="right" />
        {/* Left arm — goalpost rotates open */}
        <g className={`${u}-armL`} style={{ animationPlayState: ps }}>
          <Limb x1={75} y1={110} x2={62} y2={140} w1={7} w2={6} />
          <Limb x1={62} y1={140} x2={62} y2={108} w1={6} w2={5} />
        </g>
        {/* Right arm */}
        <g className={`${u}-armR`} style={{ animationPlayState: ps }}>
          <Limb x1={115} y1={110} x2={128} y2={140} w1={7} w2={6} />
          <Limb x1={128} y1={140} x2={128} y2={108} w1={6} w2={5} />
        </g>
        <text x={210} y={85} fontSize="8" fill={PALETTE.active} fontWeight="600" fontFamily="Public Sans" textAnchor="middle" opacity="0.7">
          KEEP CONTACT
        </text>
        <text x={210} y={97} fontSize="8" fill={PALETTE.active} fontWeight="600" fontFamily="Public Sans" textAnchor="middle" opacity="0.7">
          WITH WALL
        </text>
      </g>
    ),
  },

  // ============ CAT-COW ============
  'cat-cow': {
    title: 'Cat-Cow Stretch',
    caption: 'Cow: drop belly, breathe in → Cat: round back, breathe out',
    duration: 5,
    css: (u, d) => `
      @keyframes ${u}-spine{0%,100%{d:path('M 100,205 Q 155,225 210,205')}50%{d:path('M 100,210 Q 155,180 210,210')}}
      @keyframes ${u}-head{0%,100%{transform:translate(0,5px)}50%{transform:translate(0,-3px)}}
      @keyframes ${u}-bin{0%,40%,90%,100%{opacity:0}10%,30%{opacity:1}}
      @keyframes ${u}-bout{0%,40%,100%{opacity:0}55%,80%{opacity:1}}
      .${u}-spine{animation:${u}-spine ${d}s ease-in-out infinite}
      .${u}-head{animation:${u}-head ${d}s ease-in-out infinite}
      .${u}-bin{animation:${u}-bin ${d}s ease-in-out infinite}
      .${u}-bout{animation:${u}-bout ${d}s ease-in-out infinite}
    `,
    svg: (u, ps) => (
      <g>
        <Mat x={30} y={258} w={260} />
        <Floor y={270} />
        {/* Head */}
        <g className={`${u}-head`} style={{ animationPlayState: ps }}>
          <Head cx={88} cy={195} r={11} facing="left" />
        </g>
        {/* Spine path morph */}
        <path className={`${u}-spine`} d="M 100,205 Q 155,225 210,205"
          fill="none" stroke={PALETTE.shirt} strokeWidth="22" strokeLinecap="round" style={{ animationPlayState: ps }} />
        <path className={`${u}-spine`} d="M 100,205 Q 155,225 210,205"
          fill="none" stroke={PALETTE.bodyOutline} strokeWidth="22" strokeLinecap="round" opacity="0.15" style={{ animationPlayState: ps }} />
        {/* Front arms */}
        <Limb x1={105} y1={210} x2={102} y2={258} w1={7} w2={6} />
        {/* Back legs */}
        <Limb x1={210} y1={210} x2={215} y2={258} w1={10} w2={9} fill={PALETTE.shorts} />
        <Limb x1={210} y1={210} x2={188} y2={258} w1={10} w2={9} fill={PALETTE.shorts} />
        {/* Breath labels */}
        <text className={`${u}-bin`} x={155} y={170} fontSize="9.5" fill="#6BA368"
          fontWeight="700" textAnchor="middle" fontFamily="Public Sans" letterSpacing="0.5" style={{ animationPlayState: ps }}>
          🌬  BREATHE IN  ·  COW
        </text>
        <text className={`${u}-bout`} x={155} y={170} fontSize="9.5" fill={PALETTE.shirtShade}
          fontWeight="700" textAnchor="middle" fontFamily="Public Sans" letterSpacing="0.5" style={{ animationPlayState: ps }}>
          🌬  BREATHE OUT  ·  CAT
        </text>
      </g>
    ),
  },

  // ============ BIRD DOG ============
  'bird-dog': {
    title: 'Bird Dog',
    caption: 'Tabletop position → extend opposite arm and leg → hold 5 seconds',
    duration: 6,
    css: (u, d) => `
      @keyframes ${u}-leg{0%,48%,100%{transform:rotate(0deg)}15%,35%{transform:rotate(-22deg)}}
      @keyframes ${u}-arm{0%,48%,100%{transform:rotate(0deg)}15%,35%{transform:rotate(28deg)}}
      .${u}-leg{animation:${u}-leg ${d}s ease-in-out infinite;transform-origin:200px 210px}
      .${u}-arm{animation:${u}-arm ${d}s ease-in-out infinite;transform-origin:105px 210px}
    `,
    svg: (u, ps) => (
      <g>
        <Mat x={20} y={258} w={280} />
        <Floor y={270} />
        <Head cx={88} cy={195} r={11} facing="left" />
        <path d="M 100,210 L 205,210" stroke={PALETTE.shirt} strokeWidth="22" strokeLinecap="round" />
        {/* Support arm */}
        <Limb x1={105} y1={215} x2={130} y2={258} w1={7} w2={6} />
        {/* Extending arm */}
        <g className={`${u}-arm`} style={{ animationPlayState: ps }}>
          <Limb x1={105} y1={208} x2={62} y2={205} w1={7} w2={6} />
          <Limb x1={62} y1={205} x2={42} y2={200} w1={6} w2={5} />
        </g>
        {/* Support leg */}
        <Limb x1={200} y1={215} x2={208} y2={258} w1={10} w2={9} fill={PALETTE.shorts} />
        {/* Extending leg */}
        <g className={`${u}-leg`} style={{ animationPlayState: ps }}>
          <Limb x1={200} y1={205} x2={258} y2={208} w1={11} w2={9} fill={PALETTE.shorts} />
          <Limb x1={258} y1={208} x2={285} y2={205} w1={9} w2={7} />
        </g>
        <HoldBadge cx={155} cy={155} text="HOLD 5 SEC" />
      </g>
    ),
  },

  // ============ ANKLE ABCs ============
  'ankle-abc': {
    title: 'Ankle ABCs',
    caption: 'Sit with foot lifted → trace each letter A-Z with your big toe',
    duration: 4,
    css: (u, d) => `
      @keyframes ${u}-trace{0%{transform:translate(0,0)}20%{transform:translate(8px,-5px)}40%{transform:translate(-3px,-7px)}60%{transform:translate(-7px,3px)}80%{transform:translate(5px,6px)}100%{transform:translate(0,0)}}
      @keyframes ${u}-abc{0%,100%{opacity:0.2}50%{opacity:0.6}}
      .${u}-foot{animation:${u}-trace ${d}s ease-in-out infinite}
      .${u}-letters{animation:${u}-abc ${d}s ease-in-out infinite}
    `,
    svg: (u, ps) => (
      <g>
        <Floor />
        {/* Chair */}
        <rect x={62} y={180} width={70} height={60} rx={5} fill={PALETTE.wall} stroke={PALETTE.bodyOutline} strokeWidth="0.8" />
        <rect x={56} y={172} width={82} height={11} rx={3} fill={PALETTE.wallEdge} stroke={PALETTE.bodyOutline} strokeWidth="0.8" />
        <rect x={66} y={240} width={6} height={24} rx={1} fill={PALETTE.wall} stroke={PALETTE.bodyOutline} strokeWidth="0.7" />
        <rect x={122} y={240} width={6} height={24} rx={1} fill={PALETTE.wall} stroke={PALETTE.bodyOutline} strokeWidth="0.7" />
        {/* Person sitting */}
        <Head cx={97} cy={130} facing="right" />
        <Torso shoulderX={97} shoulderY={147} hipX={97} hipY={185} sw={17} hw={14} fill={`url(#${u}-shirtG)`} />
        <Limb x1={84} y1={155} x2={68} y2={180} w1={7} w2={6} />
        <Limb x1={110} y1={155} x2={120} y2={182} w1={7} w2={6} />
        {/* Down leg */}
        <Limb x1={92} y1={185} x2={82} y2={228} w1={11} w2={9} fill={PALETTE.shorts} />
        <Limb x1={82} y1={228} x2={80} y2={262} w1={9} w2={8} />
        <Foot cx={88} cy={264} length={12} height={5} facing="right" />
        {/* Extended leg */}
        <Limb x1={102} y1={185} x2={130} y2={222} w1={11} w2={9} fill={PALETTE.shorts} />
        <Limb x1={130} y1={222} x2={155} y2={250} w1={9} w2={8} />
        <Joint cx={130} cy={222} r={4} />
        {/* Animated foot */}
        <g className={`${u}-foot`} style={{ animationPlayState: ps }}>
          <Foot cx={160} cy={252} length={14} height={6} facing="right" />
          <circle cx={170} cy={250} r={2.5} fill={PALETTE.active} />
        </g>
        {/* Floating letters */}
        <g className={`${u}-letters`} style={{ animationPlayState: ps }}>
          <text x={210} y={222} fontSize="32" fill={PALETTE.active} fontFamily="Tenor Sans" opacity="0.4">A</text>
          <text x={235} y={234} fontSize="22" fill={PALETTE.active} fontFamily="Tenor Sans" opacity="0.3">B</text>
          <text x={258} y={220} fontSize="26" fill={PALETTE.active} fontFamily="Tenor Sans" opacity="0.35">C</text>
        </g>
        {/* Trace circle */}
        <ellipse cx={160} cy={252} rx={20} ry={13} fill="none" stroke={PALETTE.active} strokeWidth="1" strokeDasharray="3 2" opacity="0.4" />
      </g>
    ),
  },

  // ════════════════════════════════════════════════════════
  //                    RUNNER EXERCISES
  // ════════════════════════════════════════════════════════

  // ───────── Pre-run / Warmup ─────────
  'leg-swings': {
    title: 'Leg Swings',
    caption: 'Hand on wall → swing leg forward and back like a pendulum',
    duration: 2.5,
    css: (u, d) => `
      @keyframes ${u}-swing{0%{transform:rotate(-30deg)}50%{transform:rotate(35deg)}100%{transform:rotate(-30deg)}}
      .${u}-leg{animation:${u}-swing ${d}s ease-in-out infinite;transform-origin:165px 168px}
    `,
    svg: (u, ps) => (
      <g>
        <Floor />
        <rect x={48} y={70} width={14} height={194} rx={2} fill={PALETTE.wall} stroke={PALETTE.bodyOutline} strokeWidth="0.8" />
        <Head cx={130} cy={75} facing="right" />
        <Torso shoulderX={130} shoulderY={92} hipX={132} hipY={168} sw={17} hw={14} fill={`url(#${u}-shirtG)`} />
        {/* Hand on wall */}
        <Limb x1={116} y1={102} x2={70} y2={130} w1={7} w2={6} />
        <Limb x1={144} y1={102} x2={158} y2={140} w1={7} w2={6} />
        {/* Standing leg */}
        <Limb x1={126} y1={168} x2={124} y2={222} w1={12} w2={10} fill={PALETTE.shorts} />
        <Limb x1={124} y1={222} x2={124} y2={262} w1={10} w2={9} />
        <Foot cx={132} cy={264} length={13} height={5} facing="right" />
        {/* Swinging leg — rotates from hip */}
        <g className={`${u}-leg`} style={{ animationPlayState: ps }}>
          <Limb x1={140} y1={168} x2={140} y2={222} w1={11} w2={9} fill={PALETTE.shorts} />
          <Limb x1={140} y1={222} x2={140} y2={258} w1={9} w2={8} />
          <Foot cx={148} cy={260} length={13} height={5} facing="right" />
        </g>
        {/* Arc path */}
        <path d="M 95,260 Q 165,210 195,250" fill="none" stroke={PALETTE.guide} strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
      </g>
    ),
  },

  'world-greatest-stretch': {
    title: "World's Greatest Stretch",
    caption: 'Deep lunge → hand inside foot → rotate top arm to the ceiling',
    duration: 5,
    css: (u, d) => `
      @keyframes ${u}-rotate{0%,100%{transform:rotate(0deg)}50%{transform:rotate(-65deg)}}
      .${u}-arm{animation:${u}-rotate ${d}s ease-in-out infinite;transform-origin:155px 200px}
    `,
    svg: (u, ps) => (
      <g>
        <Mat x={20} y={258} w={280} />
        <Floor y={270} />
        <Head cx={130} cy={140} facing="right" />
        <Torso shoulderX={130} shoulderY={155} hipX={155} hipY={205} sw={16} hw={14} fill={`url(#${u}-shirtG)`} />
        {/* Front leg lunge */}
        <Limb x1={155} y1={205} x2={195} y2={210} w1={11} w2={9} fill={PALETTE.shorts} />
        <Limb x1={195} y1={210} x2={200} y2={258} w1={10} w2={8} />
        <Joint cx={195} cy={210} r={4} />
        <Foot cx={210} cy={260} length={14} height={5} facing="right" />
        {/* Back leg extended */}
        <Limb x1={155} y1={210} x2={110} y2={235} w1={11} w2={9} fill={PALETTE.shorts} />
        <Limb x1={110} y1={235} x2={75} y2={258} w1={9} w2={8} />
        {/* Support arm down */}
        <Limb x1={140} y1={170} x2={185} y2={220} w1={7} w2={6} />
        {/* Rotating arm */}
        <g className={`${u}-arm`} style={{ animationPlayState: ps }}>
          <Limb x1={155} y1={200} x2={155} y2={150} w1={7} w2={6} />
        </g>
        <text x={155} y={130} fontSize="8" fill={PALETTE.active} fontWeight="600" textAnchor="middle" fontFamily="Public Sans" opacity="0.6">↻ ROTATE</text>
      </g>
    ),
  },

  'walking-lunges': {
    title: 'Walking Lunges',
    caption: 'Step forward → drop into lunge → push through heel → next step',
    duration: 3.5,
    css: (u, d) => `
      @keyframes ${u}-lunge{0%,100%{transform:translateY(0)}50%{transform:translateY(28px)}}
      .${u}-body{animation:${u}-lunge ${d}s ease-in-out infinite}
    `,
    svg: (u, ps) => (
      <g>
        <Floor />
        <g className={`${u}-body`} style={{ animationPlayState: ps }}>
          <Head cx={155} cy={70} facing="right" />
          <Torso shoulderX={155} shoulderY={87} hipX={155} hipY={155} sw={17} hw={14} fill={`url(#${u}-shirtG)`} />
          <Limb x1={141} y1={97} x2={134} y2={138} w1={7} w2={6} />
          <Limb x1={169} y1={97} x2={176} y2={138} w1={7} w2={6} />
          {/* Front leg bent */}
          <Limb x1={148} y1={155} x2={185} y2={205} w1={12} w2={10} fill={PALETTE.shorts} />
          <Limb x1={185} y1={205} x2={195} y2={245} w1={10} w2={9} />
          <Joint cx={185} cy={205} r={4} />
          <Foot cx={205} cy={247} length={13} height={5} facing="right" />
          {/* Back leg */}
          <Limb x1={162} y1={155} x2={130} y2={210} w1={12} w2={10} fill={PALETTE.shorts} />
          <Limb x1={130} y1={210} x2={108} y2={250} w1={10} w2={9} />
          <Joint cx={130} cy={210} r={4} />
          <Foot cx={102} cy={252} length={13} height={5} facing="right" />
        </g>
      </g>
    ),
  },

  'high-knees': {
    title: 'High Knees',
    caption: 'March in place → drive each knee toward chest → pump arms',
    duration: 1.6,
    css: (u, d) => `
      @keyframes ${u}-l{0%,100%{transform:rotate(0deg)}50%{transform:rotate(-65deg)}}
      @keyframes ${u}-r{0%,100%{transform:rotate(-65deg)}50%{transform:rotate(0deg)}}
      .${u}-legL{animation:${u}-l ${d}s ease-in-out infinite;transform-origin:148px 168px}
      .${u}-legR{animation:${u}-r ${d}s ease-in-out infinite;transform-origin:162px 168px}
    `,
    svg: (u, ps) => (
      <g>
        <Floor />
        <Head cx={155} cy={75} facing="right" />
        <Torso shoulderX={155} shoulderY={92} hipX={155} hipY={168} sw={17} hw={14} fill={`url(#${u}-shirtG)`} />
        <Limb x1={141} y1={102} x2={120} y2={130} w1={7} w2={6} />
        <Limb x1={169} y1={102} x2={190} y2={130} w1={7} w2={6} />
        {/* Left leg — animated */}
        <g className={`${u}-legL`} style={{ animationPlayState: ps }}>
          <Limb x1={148} y1={168} x2={148} y2={210} w1={12} w2={10} fill={PALETTE.shorts} />
          <Limb x1={148} y1={210} x2={148} y2={245} w1={10} w2={9} />
          <Foot cx={156} cy={247} length={13} height={5} facing="right" />
        </g>
        {/* Right leg — animated opposite */}
        <g className={`${u}-legR`} style={{ animationPlayState: ps }}>
          <Limb x1={162} y1={168} x2={162} y2={210} w1={12} w2={10} fill={PALETTE.shorts} />
          <Limb x1={162} y1={210} x2={162} y2={245} w1={10} w2={9} />
          <Foot cx={170} cy={247} length={13} height={5} facing="right" />
        </g>
      </g>
    ),
  },

  'butt-kicks': {
    title: 'Butt Kicks',
    caption: 'Kick heels back toward your buttocks alternately',
    duration: 1.4,
    css: (u, d) => `
      @keyframes ${u}-l{0%,100%{transform:rotate(0deg)}50%{transform:rotate(110deg)}}
      @keyframes ${u}-r{0%,100%{transform:rotate(110deg)}50%{transform:rotate(0deg)}}
      .${u}-legL{animation:${u}-l ${d}s ease-in-out infinite;transform-origin:148px 210px}
      .${u}-legR{animation:${u}-r ${d}s ease-in-out infinite;transform-origin:162px 210px}
    `,
    svg: (u, ps) => (
      <g>
        <Floor />
        <Head cx={155} cy={75} facing="right" />
        <Torso shoulderX={155} shoulderY={92} hipX={155} hipY={168} sw={17} hw={14} fill={`url(#${u}-shirtG)`} />
        <Limb x1={141} y1={102} x2={130} y2={140} w1={7} w2={6} />
        <Limb x1={169} y1={102} x2={180} y2={140} w1={7} w2={6} />
        <Limb x1={148} y1={168} x2={148} y2={210} w1={12} w2={10} fill={PALETTE.shorts} />
        <Limb x1={162} y1={168} x2={162} y2={210} w1={12} w2={10} fill={PALETTE.shorts} />
        {/* Left shin animated */}
        <g className={`${u}-legL`} style={{ animationPlayState: ps }}>
          <Limb x1={148} y1={210} x2={148} y2={250} w1={10} w2={9} />
          <Foot cx={156} cy={252} length={13} height={5} facing="right" />
        </g>
        {/* Right shin animated opposite */}
        <g className={`${u}-legR`} style={{ animationPlayState: ps }}>
          <Limb x1={162} y1={210} x2={162} y2={250} w1={10} w2={9} />
          <Foot cx={170} cy={252} length={13} height={5} facing="right" />
        </g>
      </g>
    ),
  },

  'monster-walks': {
    title: 'Monster Walks',
    caption: 'Quarter squat with band above knees → small steps forward',
    duration: 2.2,
    css: (u, d) => `
      @keyframes ${u}-step{0%,100%{transform:translateX(0)}50%{transform:translateX(20px)}}
      .${u}-body{animation:${u}-step ${d}s ease-in-out infinite}
    `,
    svg: (u, ps) => (
      <g>
        <Floor />
        <g className={`${u}-body`} style={{ animationPlayState: ps }}>
          <Head cx={140} cy={95} facing="right" />
          <Torso shoulderX={140} shoulderY={112} hipX={140} hipY={172} sw={17} hw={14} fill={`url(#${u}-shirtG)`} />
          <Limb x1={126} y1={120} x2={108} y2={155} w1={7} w2={6} />
          <Limb x1={154} y1={120} x2={172} y2={155} w1={7} w2={6} />
          {/* Bent legs in quarter squat */}
          <Limb x1={130} y1={172} x2={114} y2={215} w1={12} w2={10} fill={PALETTE.shorts} />
          <Limb x1={114} y1={215} x2={120} y2={250} w1={10} w2={9} />
          <Foot cx={128} cy={252} length={13} height={5} facing="right" />
          <Limb x1={150} y1={172} x2={166} y2={215} w1={12} w2={10} fill={PALETTE.shorts} />
          <Limb x1={166} y1={215} x2={160} y2={250} w1={10} w2={9} />
          <Foot cx={168} cy={252} length={13} height={5} facing="right" />
          {/* Resistance band */}
          <ellipse cx={140} cy={195} rx={32} ry={4} fill="none" stroke={PALETTE.active} strokeWidth="2.5" strokeDasharray="4 2" />
        </g>
        <text x={250} y={200} fontSize="8" fill={PALETTE.active} fontWeight="700" textAnchor="middle" fontFamily="Public Sans" opacity="0.6">→ STEP</text>
      </g>
    ),
  },

  'banded-clamshells': {
    title: 'Banded Clamshells',
    caption: 'Side-lying with band → open top knee against resistance',
    duration: 4,
    css: (u, d) => `
      @keyframes ${u}-open{0%,100%{transform:rotate(0deg)}30%,70%{transform:rotate(-32deg)}}
      .${u}-topleg{animation:${u}-open ${d}s ease-in-out infinite;transform-origin:155px 200px}
    `,
    svg: (u, ps) => (
      <g>
        <Mat />
        <Floor />
        <Head cx={50} cy={185} facing="right" />
        <Torso shoulderX={64} shoulderY={200} hipX={155} hipY={203} sw={16} hw={14} fill={`url(#${u}-shirtG)`} lying />
        <Limb x1={56} y1={195} x2={42} y2={210} w1={6} w2={5} />
        <Limb x1={120} y1={194} x2={140} y2={205} w1={7} w2={5} />
        {/* Bottom leg */}
        <Limb x1={155} y1={210} x2={205} y2={205} w1={10} w2={9} fill={PALETTE.shorts} />
        <Limb x1={205} y1={205} x2={232} y2={232} w1={9} w2={8} />
        <Foot cx={236} cy={234} length={11} height={5} facing="right" />
        {/* Top leg animated */}
        <g className={`${u}-topleg`} style={{ animationPlayState: ps }}>
          <Limb x1={155} y1={196} x2={205} y2={196} w1={10} w2={9} fill={PALETTE.shorts} />
          <Limb x1={205} y1={196} x2={232} y2={222} w1={9} w2={8} />
          <Joint cx={205} cy={196} r={4} />
          <Foot cx={236} cy={224} length={11} height={5} facing="right" />
        </g>
        {/* Band above knees */}
        <ellipse cx={205} cy={196} rx={6} ry={14} fill="none" stroke={PALETTE.active} strokeWidth="2" strokeDasharray="3 2" />
        <text x={205} y={170} fontSize="7.5" fill={PALETTE.active} fontWeight="700" textAnchor="middle" fontFamily="Public Sans" opacity="0.65">↑ BAND</text>
      </g>
    ),
  },

  // ───────── Post-run / Cool-down ─────────
  'standing-quad-stretch': {
    title: 'Standing Quad Stretch',
    caption: 'Pull heel toward buttock → tuck tailbone → hold 30s',
    duration: 4,
    css: (u, d) => `
      @keyframes ${u}-pulse{0%,100%{opacity:0;transform:scale(0.7)}50%{opacity:0.6;transform:scale(1)}}
      .${u}-glow{animation:${u}-pulse ${d}s ease-in-out infinite;transform-origin:170px 195px}
    `,
    svg: (u, ps) => (
      <g>
        <Floor />
        <rect x={40} y={70} width={10} height={194} rx={2} fill={PALETTE.wall} opacity="0.5" />
        <Head cx={140} cy={75} facing="right" />
        <Torso shoulderX={140} shoulderY={92} hipX={140} hipY={170} sw={17} hw={14} fill={`url(#${u}-shirtG)`} />
        {/* Hand on wall */}
        <Limb x1={126} y1={102} x2={62} y2={140} w1={7} w2={6} />
        {/* Arm grabbing foot */}
        <Limb x1={154} y1={102} x2={172} y2={170} w1={7} w2={6} />
        <Limb x1={172} y1={170} x2={185} y2={205} w1={6} w2={5} />
        {/* Standing leg */}
        <Limb x1={134} y1={170} x2={132} y2={222} w1={12} w2={10} fill={PALETTE.shorts} />
        <Limb x1={132} y1={222} x2={132} y2={262} w1={10} w2={9} />
        <Foot cx={140} cy={264} length={13} height={5} facing="right" />
        {/* Bent leg pulled back */}
        <Limb x1={150} y1={170} x2={172} y2={195} w1={12} w2={10} fill={PALETTE.shorts} />
        <Limb x1={172} y1={195} x2={185} y2={210} w1={10} w2={9} />
        <Joint cx={172} cy={195} r={4} />
        {/* Quad highlight */}
        <ellipse className={`${u}-glow`} cx={160} cy={185} rx={18} ry={7} fill={PALETTE.activeGlow} stroke={PALETTE.active} strokeWidth="1" strokeDasharray="3 2" style={{ animationPlayState: ps }} />
        <HoldBadge cx={235} cy={130} text="HOLD 30 SEC" />
      </g>
    ),
  },

  'standing-hamstring-stretch': {
    title: 'Standing Hamstring Stretch',
    caption: 'Heel on step → hinge from hips → flat back',
    duration: 4,
    css: (u, d) => `
      @keyframes ${u}-bow{0%,100%{transform:rotate(0deg)}50%{transform:rotate(28deg)}}
      .${u}-torso{animation:${u}-bow ${d}s ease-in-out infinite;transform-origin:130px 170px}
    `,
    svg: (u, ps) => (
      <g>
        <Floor />
        {/* Step */}
        <rect x={205} y={235} width={75} height={28} rx={4} fill={PALETTE.step} stroke={PALETTE.bodyOutline} strokeWidth="0.8" />
        <rect x={205} y={235} width={75} height={5} rx={2} fill={PALETTE.stepShade} opacity="0.4" />
        <g className={`${u}-torso`} style={{ animationPlayState: ps }}>
          <Head cx={130} cy={75} facing="right" />
          <Torso shoulderX={130} shoulderY={92} hipX={130} hipY={170} sw={17} hw={14} fill={`url(#${u}-shirtG)`} />
          <Limb x1={116} y1={102} x2={108} y2={148} w1={7} w2={6} />
          <Limb x1={144} y1={102} x2={155} y2={150} w1={7} w2={6} />
        </g>
        {/* Standing leg */}
        <Limb x1={124} y1={170} x2={122} y2={222} w1={12} w2={10} fill={PALETTE.shorts} />
        <Limb x1={122} y1={222} x2={122} y2={262} w1={10} w2={9} />
        <Foot cx={130} cy={264} length={13} height={5} facing="right" />
        {/* Stretching leg on step */}
        <Limb x1={136} y1={170} x2={210} y2={232} w1={12} w2={10} fill={PALETTE.shorts} />
        <Foot cx={222} cy={234} length={13} height={5} facing="right" />
        <HoldBadge cx={245} cy={150} text="HOLD 30 SEC" />
      </g>
    ),
  },

  'calf-stretch-wall': {
    title: 'Calf Stretch (Wall)',
    caption: 'Hands on wall → back leg straight → press heel down',
    duration: 4,
    css: (u, d) => `
      @keyframes ${u}-lean{0%,100%{transform:translateX(0)}50%{transform:translateX(6px)}}
      .${u}-body{animation:${u}-lean ${d}s ease-in-out infinite}
    `,
    svg: (u, ps) => (
      <g>
        <Floor />
        <rect x={40} y={50} width={14} height={214} rx={2} fill={PALETTE.wall} stroke={PALETTE.bodyOutline} strokeWidth="0.8" />
        <g className={`${u}-body`} style={{ animationPlayState: ps }}>
          <Head cx={120} cy={95} facing="right" />
          <Torso shoulderX={120} shoulderY={112} hipX={155} hipY={175} sw={17} hw={14} fill={`url(#${u}-shirtG)`} />
          {/* Hands on wall */}
          <Limb x1={107} y1={120} x2={62} y2={130} w1={7} w2={6} />
          <Limb x1={120} y1={128} x2={64} y2={150} w1={7} w2={6} />
          {/* Front leg bent */}
          <Limb x1={155} y1={175} x2={165} y2={222} w1={12} w2={10} fill={PALETTE.shorts} />
          <Limb x1={165} y1={222} x2={155} y2={258} w1={10} w2={9} />
          <Joint cx={165} cy={222} r={4} />
          <Foot cx={160} cy={260} length={13} height={5} facing="right" />
          {/* Back leg straight */}
          <Limb x1={155} y1={180} x2={215} y2={245} w1={12} w2={9} fill={PALETTE.shorts} />
          <Limb x1={215} y1={245} x2={250} y2={260} w1={9} w2={8} />
          <Foot cx={258} cy={262} length={14} height={5} facing="right" />
        </g>
        {/* Calf highlight */}
        <ellipse cx={232} cy={252} rx={14} ry={5} fill={PALETTE.activeGlow} stroke={PALETTE.active} strokeWidth="1" strokeDasharray="3 2" />
        <text x={232} y={278} fontSize="7.5" fill={PALETTE.active} fontWeight="700" textAnchor="middle" fontFamily="Public Sans" opacity="0.6">CALF STRETCH</text>
      </g>
    ),
  },

  'pigeon-pose': {
    title: 'Pigeon Pose',
    caption: 'Front knee bent across body → back leg extended → fold forward',
    duration: 5,
    css: (u, d) => `
      @keyframes ${u}-fold{0%,100%{transform:translateY(0)}50%{transform:translateY(8px)}}
      .${u}-torso{animation:${u}-fold ${d}s ease-in-out infinite}
    `,
    svg: (u, ps) => (
      <g>
        <Mat x={20} y={258} w={280} />
        <Floor y={270} />
        <g className={`${u}-torso`} style={{ animationPlayState: ps }}>
          <Head cx={92} cy={205} r={11} facing="right" />
          <Torso shoulderX={104} shoulderY={215} hipX={155} hipY={232} sw={15} hw={13} fill={`url(#${u}-shirtG)`} lying />
          {/* Forward arms */}
          <Limb x1={108} y1={210} x2={75} y2={245} w1={6} w2={5} />
          <Limb x1={108} y1={222} x2={75} y2={252} w1={6} w2={5} />
        </g>
        {/* Front bent leg crossed */}
        <Limb x1={155} y1={232} x2={205} y2={250} w1={11} w2={9} fill={PALETTE.shorts} />
        <Limb x1={205} y1={250} x2={140} y2={258} w1={9} w2={8} />
        <Joint cx={205} cy={250} r={4} />
        {/* Back leg extended straight */}
        <Limb x1={155} y1={232} x2={235} y2={250} w1={11} w2={9} fill={PALETTE.shorts} />
        <Limb x1={235} y1={250} x2={290} y2={258} w1={9} w2={8} />
        <Foot cx={295} cy={260} length={11} height={5} facing="right" />
        {/* Glute highlight */}
        <ellipse cx={170} cy={232} rx={14} ry={6} fill={PALETTE.activeGlow} stroke={PALETTE.active} strokeWidth="1" strokeDasharray="3 2" />
        <HoldBadge cx={150} cy={185} text="HOLD 60 SEC" />
      </g>
    ),
  },

  'figure-4-stretch': {
    title: 'Figure-4 Stretch',
    caption: 'Cross ankle over opposite knee → pull toward chest',
    duration: 4,
    css: (u, d) => `
      @keyframes ${u}-pull{0%,100%{transform:translateX(0)}50%{transform:translateX(-10px)}}
      .${u}-leg{animation:${u}-pull ${d}s ease-in-out infinite}
    `,
    svg: (u, ps) => (
      <g>
        <Mat x={20} y={258} w={280} />
        <Floor y={270} />
        <Head cx={50} cy={232} r={11} facing="right" />
        <Torso shoulderX={64} shoulderY={245} hipX={155} hipY={250} sw={15} hw={13} fill={`url(#${u}-shirtG)`} lying />
        {/* Arms reaching to grab thigh */}
        <Limb x1={120} y1={245} x2={172} y2={210} w1={6} w2={5} />
        <Limb x1={130} y1={252} x2={180} y2={215} w1={6} w2={5} />
        <g className={`${u}-leg`} style={{ animationPlayState: ps }}>
          {/* Pulled leg (bent toward chest) */}
          <Limb x1={155} y1={250} x2={185} y2={205} w1={11} w2={9} fill={PALETTE.shorts} />
          <Limb x1={185} y1={205} x2={235} y2={220} w1={9} w2={8} />
          <Joint cx={185} cy={205} r={4} />
          {/* Crossed ankle leg */}
          <Limb x1={155} y1={250} x2={200} y2={215} w1={11} w2={9} fill={PALETTE.shorts} />
          <Limb x1={200} y1={215} x2={245} y2={205} w1={9} w2={8} />
          <Foot cx={250} cy={205} length={11} height={5} facing="right" />
        </g>
        <text x={210} y={185} fontSize="7.5" fill={PALETTE.active} fontWeight="700" textAnchor="middle" fontFamily="Public Sans" opacity="0.6">↗ PULL IN</text>
      </g>
    ),
  },

  'foam-roll-it-band': {
    title: 'Foam Roll IT Band',
    caption: 'Side-lying on roller → roll from hip to knee slowly',
    duration: 4,
    css: (u, d) => `
      @keyframes ${u}-roll{0%,100%{transform:translateX(-20px)}50%{transform:translateX(20px)}}
      .${u}-body{animation:${u}-roll ${d}s ease-in-out infinite}
    `,
    svg: (u, ps) => (
      <g>
        <Mat x={20} y={258} w={280} />
        <Floor y={270} />
        {/* Foam roller */}
        <ellipse cx={155} cy={252} rx={20} ry={9} fill={PALETTE.step} stroke={PALETTE.bodyOutline} strokeWidth="0.8" />
        <ellipse cx={155} cy={249} rx={18} ry={4} fill={PALETTE.stepShade} opacity="0.4" />
        <g className={`${u}-body`} style={{ animationPlayState: ps }}>
          <Head cx={50} cy={222} r={11} facing="right" />
          <Torso shoulderX={64} shoulderY={232} hipX={155} hipY={240} sw={14} hw={12} fill={`url(#${u}-shirtG)`} lying />
          {/* Support forearm */}
          <Limb x1={70} y1={228} x2={45} y2={250} w1={6} w2={5} />
          <Limb x1={120} y1={230} x2={130} y2={210} w1={6} w2={5} />
          {/* Top leg crossed forward */}
          <Limb x1={155} y1={235} x2={205} y2={222} w1={10} w2={8} fill={PALETTE.shorts} />
          <Limb x1={205} y1={222} x2={230} y2={252} w1={8} w2={7} />
          {/* Bottom leg straight on roller */}
          <Limb x1={155} y1={250} x2={250} y2={252} w1={10} w2={8} fill={PALETTE.shorts} />
          <Foot cx={258} cy={252} length={11} height={5} facing="right" />
        </g>
        <text x={155} y={278} fontSize="7.5" fill={PALETTE.active} fontWeight="700" textAnchor="middle" fontFamily="Public Sans" opacity="0.6">← ROLL →</text>
      </g>
    ),
  },

  'hip-flexor-stretch': {
    title: 'Hip Flexor Stretch',
    caption: 'Half-kneeling → tuck tailbone → push hips forward',
    duration: 4,
    css: (u, d) => `
      @keyframes ${u}-press{0%,100%{transform:translateX(0)}50%{transform:translateX(8px)}}
      .${u}-body{animation:${u}-press ${d}s ease-in-out infinite}
    `,
    svg: (u, ps) => (
      <g>
        <Floor />
        <Mat x={50} y={258} w={220} />
        <g className={`${u}-body`} style={{ animationPlayState: ps }}>
          <Head cx={130} cy={95} facing="right" />
          <Torso shoulderX={130} shoulderY={112} hipX={140} hipY={185} sw={17} hw={14} fill={`url(#${u}-shirtG)`} />
          <Limb x1={116} y1={122} x2={104} y2={155} w1={7} w2={6} />
          <Limb x1={144} y1={122} x2={156} y2={155} w1={7} w2={6} />
          {/* Front leg bent at 90° */}
          <Limb x1={147} y1={185} x2={195} y2={210} w1={12} w2={10} fill={PALETTE.shorts} />
          <Limb x1={195} y1={210} x2={200} y2={258} w1={10} w2={9} />
          <Joint cx={195} cy={210} r={4} />
          <Foot cx={210} cy={260} length={13} height={5} facing="right" />
          {/* Back kneeling leg */}
          <Limb x1={133} y1={188} x2={95} y2={235} w1={12} w2={10} fill={PALETTE.shorts} />
          <Limb x1={95} y1={235} x2={70} y2={258} w1={10} w2={8} />
          <Joint cx={95} cy={235} r={4} />
        </g>
        {/* Hip flexor highlight */}
        <ellipse cx={120} cy={195} rx={14} ry={6} fill={PALETTE.activeGlow} stroke={PALETTE.active} strokeWidth="1" strokeDasharray="3 2" />
        <HoldBadge cx={235} cy={150} text="HOLD 30 SEC" />
      </g>
    ),
  },

  'terminal-knee-extension': {
    title: 'Terminal Knee Extension',
    caption: 'Band behind knee → push back to lock knee straight',
    duration: 3,
    css: (u, d) => `
      @keyframes ${u}-lock{0%,100%{transform:rotate(0deg)}50%{transform:rotate(8deg)}}
      .${u}-shin{animation:${u}-lock ${d}s ease-in-out infinite;transform-origin:148px 215px}
    `,
    svg: (u, ps) => (
      <g>
        <Floor />
        {/* Anchor point */}
        <rect x={40} y={195} width={14} height={70} rx={2} fill={PALETTE.wall} stroke={PALETTE.bodyOutline} strokeWidth="0.8" />
        <Head cx={140} cy={75} facing="right" />
        <Torso shoulderX={140} shoulderY={92} hipX={140} hipY={170} sw={17} hw={14} fill={`url(#${u}-shirtG)`} />
        <Limb x1={126} y1={102} x2={114} y2={145} w1={7} w2={6} />
        <Limb x1={154} y1={102} x2={166} y2={145} w1={7} w2={6} />
        {/* Standing leg */}
        <Limb x1={134} y1={170} x2={130} y2={222} w1={12} w2={10} fill={PALETTE.shorts} />
        <Limb x1={130} y1={222} x2={130} y2={262} w1={10} w2={9} />
        <Foot cx={138} cy={264} length={13} height={5} facing="right" />
        {/* Working leg — slight knee bend */}
        <Limb x1={150} y1={170} x2={148} y2={215} w1={12} w2={10} fill={PALETTE.shorts} />
        <g className={`${u}-shin`} style={{ animationPlayState: ps }}>
          <Limb x1={148} y1={215} x2={148} y2={262} w1={10} w2={9} />
          <Foot cx={156} cy={264} length={13} height={5} facing="right" />
        </g>
        {/* Resistance band */}
        <path d="M 54,215 Q 100,212 148,215" fill="none" stroke={PALETTE.active} strokeWidth="2.5" strokeDasharray="4 2" />
        {/* VMO highlight */}
        <ellipse cx={148} cy={195} rx={8} ry={5} fill={PALETTE.activeGlow} stroke={PALETTE.active} strokeWidth="1" strokeDasharray="3 2" />
        <text x={148} y={155} fontSize="7" fill={PALETTE.active} fontWeight="700" textAnchor="middle" fontFamily="Public Sans" opacity="0.7">VMO</text>
      </g>
    ),
  },
};
