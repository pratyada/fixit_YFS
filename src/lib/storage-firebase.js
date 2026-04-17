// ─── Firebase Storage helpers for video uploads ───

import { ref, uploadBytes, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

// Upload a video blob and return the download URL
export async function uploadVideo(uid, sessionId, angle, blob, onProgress) {
  const path = `sessions/${uid}/${sessionId}/${angle}.webm`;
  const storageRef = ref(storage, path);

  if (onProgress) {
    return new Promise((resolve, reject) => {
      const task = uploadBytesResumable(storageRef, blob, {
        contentType: 'video/webm',
      });
      task.on('state_changed',
        snap => onProgress(snap.bytesTransferred / snap.totalBytes),
        reject,
        async () => {
          const url = await getDownloadURL(task.snapshot.ref);
          resolve({ url, path });
        }
      );
    });
  }

  const snap = await uploadBytes(storageRef, blob, { contentType: 'video/webm' });
  const url = await getDownloadURL(snap.ref);
  return { url, path };
}

// Upload a report/MRI file
export async function uploadReport(uid, file, onProgress) {
  const ext = file.name.split('.').pop();
  const path = `reports/${uid}/${Date.now()}.${ext}`;
  const storageRef = ref(storage, path);

  if (onProgress) {
    return new Promise((resolve, reject) => {
      const task = uploadBytesResumable(storageRef, file, {
        contentType: file.type,
      });
      task.on('state_changed',
        snap => onProgress(snap.bytesTransferred / snap.totalBytes),
        reject,
        async () => {
          const url = await getDownloadURL(task.snapshot.ref);
          resolve({ url, path, name: file.name });
        }
      );
    });
  }

  const snap = await uploadBytes(storageRef, file, { contentType: file.type });
  const url = await getDownloadURL(snap.ref);
  return { url, path, name: file.name };
}

// Get a signed download URL for a storage path
export async function getVideoURL(path) {
  return getDownloadURL(ref(storage, path));
}
