const { generateKeyPairSync, createSign, createSecureRandom } = require('crypto');
const fs = require('fs');
const path = require('path');

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

// Create a simple self-signed cert using Node's TLS module approach
const certPem = require('selfsigned') || null;
