// GuardianStar 鍚庣鏈嶅姟 - 鏈湴娴嬭瘯鐗?const express = require('express');
const cors = require('cors');
const https = require('https');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// ========== 鍐呭瓨鏁版嵁瀛樺偍 ==========
const users = {};           // userId -> { nickname, role, lastLogin }
const locations = {};       // uid -> { latitude, longitude, accuracy, speed, altitude, timestamp }
const locationHistory = {}; // uid -> [{ ...loc }]
const bindings = {};        // bindingId -> { id, guardianUid, trackedUid, nickname }

// ========== 鐧诲綍 ==========
app.post('/api/login', (req, res) => {
  const { userId, nickname, role } = req.body;
  if (!userId) return res.status(400).json({ success: false, message: 'userId required' });
  users[userId] = {
    nickname: nickname || userId,
    role: role || 'tracked',
    lastLogin: new Date().toISOString()
  };
  console.log(`[LOGIN] ${userId} (${role}) - ${users[userId].nickname}`);
  res.json({ success: true, user: users[userId] });
});

// ========== 浣嶇疆涓婃姤 ==========
app.post('/api/location', (req, res) => {
  const { uid, latitude, longitude, accuracy, speed, altitude, timestamp } = req.body;
  if (!uid || latitude == null || longitude == null) {
    return res.status(400).json({ success: false, message: 'uid, latitude, longitude required' });
  }
  const loc = {
    latitude,
    longitude,
    accuracy: accuracy || null,
    speed: speed != null ? speed : null,
    altitude: altitude || null,
    timestamp: timestamp || Date.now()
  };
  locations[uid] = loc;
  if (!locationHistory[uid]) locationHistory[uid] = [];
  locationHistory[uid].push({ ...loc });
  // 淇濈暀鏈€杩?2000 鏉?  if (locationHistory[uid].length > 2000) {
    locationHistory[uid] = locationHistory[uid].slice(-2000);
  }
  console.log(`[LOC] ${uid}: ${latitude.toFixed(5)},${longitude.toFixed(5)} 卤${(accuracy || 0).toFixed(0)}m`);
  res.json({ success: true });
});

// ========== 鑾峰彇鏈€鏂颁綅缃?==========
app.get('/api/location/:uid', (req, res) => {
  const loc = locations[req.params.uid];
  if (loc) {
    res.json({ success: true, location: loc });
  } else {
    res.json({ success: false, message: '鏆傛棤浣嶇疆鏁版嵁' });
  }
});

// ========== 鑾峰彇鍘嗗彶杞ㄨ抗 ==========
app.get('/api/history/:uid', (req, res) => {
  const hours = parseInt(req.query.hours) || 24;
  const history = locationHistory[req.params.uid] || [];
  const cutoff = Date.now() - hours * 3600 * 1000;
  const filtered = history.filter(loc => (loc.timestamp || 0) > cutoff);
  console.log(`[HISTORY] ${req.params.uid}: ${filtered.length} records (${hours}h)`);
  res.json({ success: true, locations: filtered });
});

// ========== 鍒涘缓缁戝畾 ==========
app.post('/api/bind', (req, res) => {
  const { guardianUid, trackedUid, nickname } = req.body;
  if (!guardianUid || !trackedUid) {
    return res.status(400).json({ success: false, message: 'guardianUid and trackedUid required' });
  }
  // 妫€鏌ユ槸鍚﹀凡缁戝畾
  const existing = Object.values(bindings).find(
    b => b.guardianUid === guardianUid && b.trackedUid === trackedUid
  );
  if (existing) {
    return res.json({ success: true, binding: existing, bindingId: existing.id });
  }
  const id = `bind_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  bindings[id] = { id, guardianUid, trackedUid, nickname: nickname || trackedUid };
  console.log(`[BIND] ${guardianUid} -> ${trackedUid} (${nickname || trackedUid})`);
  res.json({ success: true, binding: bindings[id], bindingId: id });
});

// ========== 鑾峰彇缁戝畾鍒楄〃 ==========
app.get('/api/bindings/:uid', (req, res) => {
  const uid = req.params.uid;
  const result = Object.values(bindings).filter(b => b.guardianUid === uid);
  res.json({ success: true, bindings: result });
});

// ========== 瑙ｉ櫎缁戝畾 ==========
app.delete('/api/bind/:bindingId', (req, res) => {
  const id = req.params.bindingId;
  if (bindings[id]) {
    console.log(`[UNBIND] ${id}`);
    delete bindings[id];
    res.json({ success: true });
  } else {
    res.json({ success: false, message: '缁戝畾涓嶅瓨鍦? });
  }
});

// ========== 鍋ュ悍妫€鏌?==========
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    users: Object.keys(users).length,
    locations: Object.keys(locations).length,
    bindings: Object.keys(bindings).length,
    uptime: process.uptime()
  });
});

// ========== 鍚姩 ==========
const PORT = 3000;
const SSLPORT = 3443;
const SSLOPTS = {
  key: fs.readFileSync(path.join(__dirname, 'key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'cert.pem')),
};

// HTTP
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  馃洝锔? GuardianStar Server`);
  console.log(`  鉁?HTTP:  http://0.0.0.0:${PORT}`);
});

// HTTPS
https.createServer(SSLOPTS, app).listen(SSLPORT, '0.0.0.0', () => {
  console.log(`  馃敀 HTTPS: https://0.0.0.0:${SSLPORT}`);
  console.log(`  馃摫 App connects to: https://192.168.0.123:${SSLPORT}`);
  console.log(`  馃敆 Health: https://localhost:${SSLPORT}/api/health\n`);
});
