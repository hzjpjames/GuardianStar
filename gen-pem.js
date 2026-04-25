const selfsigned = require('./node_modules/selfsigned');
const fs = require('fs');
const path = require('path');

async function main() {
  const attrs = [{ name: 'commonName', value: '192.168.0.123' }];
  const p = await selfsigned.generate(attrs, { days: 3650, keySize: 2048, algorithm: 'sha256' });
  const keyPath = path.join(__dirname, 'server', 'key.pem');
  const certPath = path.join(__dirname, 'server', 'cert.pem');
  fs.writeFileSync(keyPath, p.private);
  fs.writeFileSync(certPath, p.cert);
  console.log('done');
  console.log('key exists:', fs.existsSync(keyPath));
  console.log('cert exists:', fs.existsSync(certPath));
}

main().catch(e => { console.error(e); process.exit(1); });
