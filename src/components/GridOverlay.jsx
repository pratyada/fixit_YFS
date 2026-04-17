// ─── Grid Overlay for Camera Recording ───
// Draws alignment grid lines over the camera feed to help patients
// position themselves correctly during exercise recording.

export default function GridOverlay({ style, color = 'rgba(255,255,255,0.25)', lineWidth = 1 }) {
  const lines = [];
  const count = 4; // 4x4 grid

  for (let i = 1; i < count; i++) {
    const pct = `${(i / count) * 100}%`;
    // Vertical lines
    lines.push(
      <div key={`v${i}`} style={{
        position: 'absolute', left: pct, top: 0, bottom: 0,
        width: `${lineWidth}px`, background: color,
      }} />
    );
    // Horizontal lines
    lines.push(
      <div key={`h${i}`} style={{
        position: 'absolute', top: pct, left: 0, right: 0,
        height: `${lineWidth}px`, background: color,
      }} />
    );
  }

  // Center crosshair (slightly bolder)
  lines.push(
    <div key="cv" style={{
      position: 'absolute', left: '50%', top: '30%', bottom: '30%',
      width: '2px', background: 'rgba(112, 142, 134, 0.5)',
      transform: 'translateX(-50%)',
    }} />,
    <div key="ch" style={{
      position: 'absolute', top: '50%', left: '30%', right: '30%',
      height: '2px', background: 'rgba(112, 142, 134, 0.5)',
      transform: 'translateY(-50%)',
    }} />
  );

  return (
    <div style={{
      position: 'absolute', inset: 0,
      pointerEvents: 'none', zIndex: 2,
      ...style,
    }}>
      {lines}
    </div>
  );
}
