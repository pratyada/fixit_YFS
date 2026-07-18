// Export the procedural knee to a GLB so <model-viewer> can show it in AR.
// Geometry mirrors src/pages/Anatomy.jsx STRUCTURES (AR is view-only, so we
// don't need per-mesh selection here). Swap for a bought GLB later.
import { writeFileSync, mkdirSync } from 'node:fs';
// GLTFExporter's binary path uses the browser FileReader/Blob — polyfill for Node.
globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    Promise.resolve(blob.arrayBuffer()).then((buf) => {
      this.result = buf;
      this.onloadend && this.onloadend();
      this.onload && this.onload({ target: this });
    });
  }
};
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

const LAYER_COLORS = { muscle: '#cf7b6e', tendon: '#ddc59c', ligament: '#cbbd97', cartilage: '#a9c4d6', nerve: '#ecd35a', vessel: '#c0555a', bone: '#e9e3d5' };
const S = [
  ['bone', [['cyl', [0.33, 0.36, 2.2, 20], [0, 1.55, 0]], ['sph', [0.5, 24, 20], [-0.42, 0.35, 0], [1, 0.8, 1.15]], ['sph', [0.5, 24, 20], [0.42, 0.35, 0], [1, 0.8, 1.15]]]],
  ['bone', [['cyl', [0.3, 0.34, 2.0, 20], [0, -1.5, 0]], ['cyl', [0.6, 0.55, 0.3, 24], [0, -0.42, 0]]]],
  ['bone', [['cyl', [0.11, 0.13, 1.9, 14], [0.63, -1.45, -0.05]]]],
  ['bone', [['sph', [0.34, 24, 20], [0, 0.2, 0.62], [1, 1.25, 0.55]]]],
  ['ligament', [['cyl', [0.08, 0.08, 1.1, 12], [0.03, -0.02, 0.06], null, [0.5, 0, 0.4]]]],
  ['ligament', [['cyl', [0.085, 0.085, 1.1, 12], [-0.03, -0.02, -0.12], null, [-0.55, 0, -0.35]]]],
  ['ligament', [['cyl', [0.075, 0.075, 1.45, 12], [-0.62, -0.05, 0.02], null, [0, 0, 0.08]]]],
  ['ligament', [['cyl', [0.07, 0.07, 1.4, 12], [0.67, -0.05, -0.05], null, [0, 0, -0.08]]]],
  ['cartilage', [['tor', [0.34, 0.09, 10, 22], [-0.2, -0.27, 0.02], [1, 1, 0.5], [1.5708, 0, 0]]]],
  ['cartilage', [['tor', [0.34, 0.09, 10, 22], [0.2, -0.27, 0.02], [1, 1, 0.5], [1.5708, 0, 0]]]],
  ['tendon', [['cyl', [0.09, 0.09, 0.8, 12], [0, -0.4, 0.5], null, [0.35, 0, 0]]]],
  ['muscle', [['cyl', [0.44, 0.34, 1.5, 18], [0, 1.0, 0.32], null, [0.12, 0, 0]]]],
  ['muscle', [['cyl', [0.34, 0.28, 1.6, 16], [0, 0.6, -0.45], null, [-0.12, 0, 0]]]],
  ['muscle', [['cyl', [0.26, 0.18, 1.4, 14], [-0.24, -1.35, -0.35], null, [-0.05, 0, 0.05]], ['cyl', [0.26, 0.18, 1.4, 14], [0.24, -1.35, -0.35], null, [-0.05, 0, -0.05]]]],
  ['nerve', [['cyl', [0.05, 0.05, 3.4, 8], [-0.05, 0, -0.32], null, [0.03, 0, 0.02]]]],
  ['nerve', [['cyl', [0.045, 0.045, 1.3, 8], [0.5, -0.6, -0.18], null, [0.4, 0, -0.35]]]],
  ['vessel', [['cyl', [0.06, 0.06, 2.2, 8], [0.06, -0.15, -0.3], null, [0.02, 0, -0.02]]]],
];
const geo = (t, a) => t === 'cyl' ? new THREE.CylinderGeometry(...a) : t === 'sph' ? new THREE.SphereGeometry(...a) : new THREE.TorusGeometry(...a);

const scene = new THREE.Scene();
for (const [layer, parts] of S) {
  const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(LAYER_COLORS[layer]), roughness: 0.5, metalness: 0.05,
    transparent: layer === 'muscle', opacity: layer === 'muscle' ? 0.55 : 1 });
  for (const [t, a, pos, scale, rot] of parts) {
    const m = new THREE.Mesh(geo(t, a), mat);
    m.position.set(...pos);
    if (scale) m.scale.set(...scale);
    if (rot) m.rotation.set(...rot);
    scene.add(m);
  }
}

new GLTFExporter().parse(scene, (out) => {
  mkdirSync('public/models', { recursive: true });
  writeFileSync('public/models/knee.glb', Buffer.from(out));
  console.log('[export] public/models/knee.glb written:', out.byteLength, 'bytes');
}, (e) => { console.error('[export] failed', e); process.exit(1); }, { binary: true });
