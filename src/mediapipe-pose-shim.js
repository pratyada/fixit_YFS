// Shim for @mediapipe/pose — MoveNet with TFJS backend doesn't use it,
// but pose-detection imports it at module level. We provide empty exports
// so the import resolves without error.
export class Pose {
  constructor() { throw new Error('MediaPipe Pose is not available. Use MoveNet with TFJS backend instead.'); }
}
export const POSE_CONNECTIONS = [];
export const POSE_LANDMARKS = {};
export const POSE_LANDMARKS_LEFT = {};
export const POSE_LANDMARKS_RIGHT = {};
export const POSE_LANDMARKS_NEUTRAL = {};
export const VERSION = '0.0.0-shim';
export default { Pose, POSE_CONNECTIONS, VERSION };
