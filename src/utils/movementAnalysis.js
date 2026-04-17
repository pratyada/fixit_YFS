// ─── Movement Analysis Engine ───
// Processes recorded pose frames and generates a comprehensive
// GymScore-style analysis report with scores, form faults, and tips.

function angle(a, b, c) {
  if (!a || !b || !c) return null;
  const rad = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let deg = Math.abs(rad * 180 / Math.PI);
  if (deg > 180) deg = 360 - deg;
  return Math.round(deg);
}

function kpMap(keypoints) {
  const m = {};
  keypoints.forEach(k => { if (k.score > 0.3) m[k.name] = k; });
  return m;
}

function avg(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stdDev(arr) {
  if (arr.length < 2) return 0;
  const mean = avg(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length);
}

function clamp(v, min = 0, max = 100) {
  return Math.max(min, Math.min(max, v));
}

// ─── Main analysis function ───
export function analyzeMovement(frames, exerciseName = '') {
  if (!frames || frames.length < 5) {
    return { error: 'Not enough frames captured. Record for at least 3 seconds.' };
  }

  const duration = frames.length > 1
    ? (frames[frames.length - 1].timestamp - frames[0].timestamp) / 1000
    : 0;

  // Extract per-frame angles
  const frameData = frames.map(f => {
    const kp = kpMap(f.keypoints);
    return {
      timestamp: f.timestamp,
      leftKnee: angle(kp.left_hip, kp.left_knee, kp.left_ankle),
      rightKnee: angle(kp.right_hip, kp.right_knee, kp.right_ankle),
      leftHip: angle(kp.left_shoulder, kp.left_hip, kp.left_knee),
      rightHip: angle(kp.right_shoulder, kp.right_hip, kp.right_knee),
      leftShoulder: angle(kp.left_elbow, kp.left_shoulder, kp.left_hip),
      rightShoulder: angle(kp.right_elbow, kp.right_shoulder, kp.right_hip),
      leftElbow: angle(kp.left_shoulder, kp.left_elbow, kp.left_wrist),
      rightElbow: angle(kp.right_shoulder, kp.right_elbow, kp.right_wrist),
      // Alignment metrics
      shoulderLevel: kp.left_shoulder && kp.right_shoulder
        ? Math.abs(kp.left_shoulder.y - kp.right_shoulder.y) : null,
      hipLevel: kp.left_hip && kp.right_hip
        ? Math.abs(kp.left_hip.y - kp.right_hip.y) : null,
      kneeCaveL: kp.left_knee && kp.left_ankle
        ? kp.left_knee.x - kp.left_ankle.x : null,
      kneeCaveR: kp.right_knee && kp.right_ankle
        ? kp.right_ankle.x - kp.right_knee.x : null,
      torsoLean: kp.left_shoulder && kp.left_hip
        ? Math.abs(kp.left_shoulder.x - kp.left_hip.x) : null,
    };
  });

  // ─── 1. Range of Motion Score ───
  const kneeAngles = frameData.flatMap(f => [f.leftKnee, f.rightKnee]).filter(Boolean);
  const hipAngles = frameData.flatMap(f => [f.leftHip, f.rightHip]).filter(Boolean);
  const minKnee = kneeAngles.length ? Math.min(...kneeAngles) : 180;
  const maxKnee = kneeAngles.length ? Math.max(...kneeAngles) : 180;
  const kneeROM = maxKnee - minKnee;
  const hipROM = hipAngles.length ? Math.max(...hipAngles) - Math.min(...hipAngles) : 0;
  const totalROM = kneeROM + hipROM;
  // Score: 20° ROM = low, 60°+ = excellent
  const romScore = clamp(Math.round((totalROM / 120) * 100));

  // ─── 2. Posture Score ───
  const shoulderLevels = frameData.map(f => f.shoulderLevel).filter(Boolean);
  const hipLevels = frameData.map(f => f.hipLevel).filter(Boolean);
  const torsoLeans = frameData.map(f => f.torsoLean).filter(Boolean);
  const avgShoulderTilt = avg(shoulderLevels);
  const avgHipTilt = avg(hipLevels);
  const avgTorsoLean = avg(torsoLeans);
  // Lower tilt = better posture
  const shoulderPosture = clamp(100 - avgShoulderTilt * 3);
  const hipPosture = clamp(100 - avgHipTilt * 3);
  const leanPosture = clamp(100 - avgTorsoLean * 1.5);
  const postureScore = clamp(Math.round((shoulderPosture + hipPosture + leanPosture) / 3));

  // ─── 3. Stability Score ───
  const kneeStdL = stdDev(frameData.map(f => f.leftKnee).filter(Boolean));
  const kneeStdR = stdDev(frameData.map(f => f.rightKnee).filter(Boolean));
  const hipStdL = stdDev(frameData.map(f => f.leftHip).filter(Boolean));
  const shoulderStd = stdDev(shoulderLevels);
  // Lower variance = more stable. StdDev of 2 = excellent, 15+ = poor
  const stabilityScore = clamp(Math.round(100 - ((kneeStdL + kneeStdR + hipStdL + shoulderStd) / 4) * 4));

  // ─── 4. Joint Angles Score ───
  const avgLeftKnee = avg(frameData.map(f => f.leftKnee).filter(Boolean));
  const avgRightKnee = avg(frameData.map(f => f.rightKnee).filter(Boolean));
  const kneeSymmetry = Math.abs(avgLeftKnee - avgRightKnee);
  const avgLeftHip = avg(frameData.map(f => f.leftHip).filter(Boolean));
  const avgRightHip = avg(frameData.map(f => f.rightHip).filter(Boolean));
  const hipSymmetry = Math.abs(avgLeftHip - avgRightHip);
  // Lower asymmetry = better. 0° diff = 100, 20°+ diff = 0
  const jointScore = clamp(Math.round(100 - (kneeSymmetry + hipSymmetry) * 2.5));

  // ─── 5. Movement Pattern Score ───
  // Based on overall smoothness, consistency, and symmetry combined
  const kneeCavesL = frameData.map(f => f.kneeCaveL).filter(Boolean);
  const kneeCavesR = frameData.map(f => f.kneeCaveR).filter(Boolean);
  const avgCaveL = avg(kneeCavesL);
  const avgCaveR = avg(kneeCavesR);
  const caveScore = clamp(100 - Math.max(0, -avgCaveL) * 8 - Math.max(0, -avgCaveR) * 8);
  const smoothness = clamp(100 - stdDev(kneeAngles) * 2);
  const patternScore = clamp(Math.round((caveScore + smoothness + jointScore) / 3));

  // ─── Overall Score (weighted) ───
  const overall = clamp(Math.round(
    romScore * 0.20 +
    postureScore * 0.25 +
    stabilityScore * 0.20 +
    jointScore * 0.15 +
    patternScore * 0.20
  ));

  // ─── Form Faults ───
  const faults = [];

  // Knee cave
  if (avgCaveL < -8 || avgCaveR < -8) {
    faults.push({
      id: 'knee-cave',
      name: 'Knee Cave (Valgus)',
      severity: avgCaveL < -15 || avgCaveR < -15 ? 'high' : 'moderate',
      description: 'Your knees are collapsing inward past your ankles. This puts stress on the ACL and meniscus.',
      tip: 'Push your knees out over your toes. Strengthen glute medius with banded clamshells and monster walks.',
    });
  }

  // Asymmetry
  if (kneeSymmetry > 12) {
    faults.push({
      id: 'asymmetry',
      name: 'Left/Right Asymmetry',
      severity: kneeSymmetry > 20 ? 'high' : 'moderate',
      description: `Your knee angles differ by ${Math.round(kneeSymmetry)}° between left and right. This indicates uneven loading.`,
      tip: 'Focus on loading both legs evenly. Try single-leg exercises to address the weaker side.',
    });
  }

  // Poor depth
  if (kneeROM < 25 && kneeAngles.length > 0) {
    faults.push({
      id: 'poor-depth',
      name: 'Limited Range of Motion',
      severity: kneeROM < 15 ? 'high' : 'moderate',
      description: `Your knee only moved through ${kneeROM}° of range. This may indicate limited mobility or guarding.`,
      tip: 'Work on mobility with heel slides and wall slides. Depth will improve gradually.',
    });
  }

  // Forward lean
  if (avgTorsoLean > 40) {
    faults.push({
      id: 'forward-lean',
      name: 'Excessive Forward Lean',
      severity: avgTorsoLean > 60 ? 'high' : 'moderate',
      description: 'Your torso is leaning too far forward, which shifts load onto your back.',
      tip: 'Engage your core and keep your chest up. Strengthen your posterior chain with glute bridges.',
    });
  }

  // Shoulder imbalance
  if (avgShoulderTilt > 20) {
    faults.push({
      id: 'shoulder-tilt',
      name: 'Uneven Shoulders',
      severity: avgShoulderTilt > 35 ? 'high' : 'moderate',
      description: `Your shoulders are tilted by ~${Math.round(avgShoulderTilt)}px. This can indicate muscular imbalance or compensatory movement.`,
      tip: 'Practice scapular squeezes and focus on symmetrical arm positioning.',
    });
  }

  // Hip shift
  if (avgHipTilt > 18) {
    faults.push({
      id: 'hip-shift',
      name: 'Hip Shift',
      severity: avgHipTilt > 30 ? 'high' : 'moderate',
      description: 'Your hips are shifting to one side during the movement.',
      tip: 'Strengthen the weaker side glute with single-leg bridges. Ensure equal weight distribution.',
    });
  }

  if (faults.length === 0) {
    faults.push({
      id: 'none',
      name: 'No Major Faults Detected',
      severity: 'low',
      description: 'Your form looks solid! Minor improvements can always be made — see the tips below.',
      tip: 'Continue with your current form and gradually increase difficulty.',
    });
  }

  // ─── Tips ───
  const tips = [];
  if (romScore < 60) tips.push('Your range of motion is limited. Warm up longer and work on mobility exercises before your set.');
  if (postureScore < 60) tips.push('Focus on keeping your shoulders level and your core engaged throughout the movement.');
  if (stabilityScore < 60) tips.push('Your movement has significant wobble. Slow down and focus on control. Try lighter load.');
  if (jointScore < 70) tips.push('Work on symmetry — your left and right sides are moving differently.');
  if (overall >= 80) tips.push('Great form! Keep this up and progressively challenge yourself.');
  if (overall >= 60 && overall < 80) tips.push('Good effort! Focus on the highlighted faults to break through to excellent form.');
  if (overall < 60) tips.push('Your form needs attention. Consider reviewing the exercise tutorial and working with lighter resistance.');

  // ─── Angle timeline (for chart) ───
  const timeline = frameData.filter((_, i) => i % 3 === 0).map((f, i) => ({
    frame: i,
    time: ((f.timestamp - frameData[0].timestamp) / 1000).toFixed(1),
    leftKnee: f.leftKnee,
    rightKnee: f.rightKnee,
    leftHip: f.leftHip,
    rightHip: f.rightHip,
  }));

  return {
    overall,
    duration: Math.round(duration),
    totalFrames: frames.length,
    categories: [
      { name: 'Range of Motion', score: romScore, icon: '📐', desc: `${kneeROM}° knee ROM, ${Math.round(hipROM)}° hip ROM` },
      { name: 'Posture', score: postureScore, icon: '🧍', desc: `Shoulder tilt: ${Math.round(avgShoulderTilt)}px, torso lean: ${Math.round(avgTorsoLean)}px` },
      { name: 'Stability', score: stabilityScore, icon: '⚖️', desc: `Movement variance: ±${Math.round((kneeStdL + kneeStdR) / 2)}°` },
      { name: 'Joint Angles', score: jointScore, icon: '🔄', desc: `L/R knee diff: ${Math.round(kneeSymmetry)}°, hip diff: ${Math.round(hipSymmetry)}°` },
      { name: 'Movement Pattern', score: patternScore, icon: '🎯', desc: `Smoothness: ${Math.round(smoothness)}%, symmetry: ${Math.round(caveScore)}%` },
    ],
    faults,
    tips,
    angles: {
      leftKnee: { avg: Math.round(avgLeftKnee), min: Math.round(Math.min(...frameData.map(f => f.leftKnee).filter(Boolean))), max: Math.round(Math.max(...frameData.map(f => f.leftKnee).filter(Boolean))) },
      rightKnee: { avg: Math.round(avgRightKnee), min: Math.round(Math.min(...frameData.map(f => f.rightKnee).filter(Boolean))), max: Math.round(Math.max(...frameData.map(f => f.rightKnee).filter(Boolean))) },
      leftHip: { avg: Math.round(avgLeftHip), min: Math.round(Math.min(...frameData.map(f => f.leftHip).filter(Boolean))), max: Math.round(Math.max(...frameData.map(f => f.leftHip).filter(Boolean))) },
      rightHip: { avg: Math.round(avgRightHip), min: Math.round(Math.min(...frameData.map(f => f.rightHip).filter(Boolean))), max: Math.round(Math.max(...frameData.map(f => f.rightHip).filter(Boolean))) },
    },
    timeline,
  };
}
