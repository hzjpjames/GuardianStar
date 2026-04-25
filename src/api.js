// src/api.js - 鏈湴鍚庣 API

// APK 鐩磋繛灞€鍩熺綉鍚庣锛坲sesCleartextTraffic 宸查厤缃級
// Expo Go 娴嬭瘯鏃舵敼鍥?ngrok URL
// APK 鐢?HTTP锛坲sesCleartextTraffic 宸插紑鍚級锛孍xpo Go 鍚屾牱鍙敤
const SERVER_URL = 'http://192.168.0.123:3000';
// HTTPS 鑷鍚嶈瘉涔?React Native 涓嶄俊浠伙紝涓嶅缓璁敤

export async function login(userId, nickname, role) {
  const res = await fetch(`${SERVER_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, nickname, role })
  });
  return res.json();
}

export async function reportLocation(uid, location) {
  const res = await fetch(`${SERVER_URL}/api/location`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid, ...location })
  });
  return res.json();
}

export async function getLocation(uid) {
  const res = await fetch(`${SERVER_URL}/api/location/${uid}`);
  return res.json();
}

export async function getHistory(uid, hours = 24) {
  const res = await fetch(`${SERVER_URL}/api/history/${uid}?hours=${hours}`);
  return res.json();
}

export async function createBinding(guardianUid, trackedUid, nickname) {
  const res = await fetch(`${SERVER_URL}/api/bind`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ guardianUid, trackedUid, nickname })
  });
  return res.json();
}

export async function getBindings(uid) {
  const res = await fetch(`${SERVER_URL}/api/bindings/${uid}`);
  return res.json();
}

export async function removeBinding(bindingId) {
  const res = await fetch(`${SERVER_URL}/api/bind/${bindingId}`, {
    method: 'DELETE'
  });
  return res.json();
}