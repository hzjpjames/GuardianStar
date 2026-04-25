const QRCode = require('qrcode');
const fs = require('fs');
const path = 'C:/Users/Administrator/.qclaw/workspace-agent-e87418f0/GuardianNew/qrcodes/expo-qr.png';
const url = 'exp://192.168.0.123:8081';

QRCode.toFile(path, url, { width: 400 }, function(err) {
  if (err) {
    console.error('ERROR:', err.message);
    process.exit(1);
  }
  console.log('QR saved OK, size:', fs.statSync(path).size, 'bytes');
});
