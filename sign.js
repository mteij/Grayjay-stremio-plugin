const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const pluginDir = path.join(__dirname, 'web', 'public', 'plugin');
const configPath = path.join(pluginDir, 'Config.json');
const scriptPath = path.join(pluginDir, 'Script.js');

console.log('Generating RSA 2048-bit key pair...');
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'der' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

console.log('Signing Script.js...');
const script = fs.readFileSync(scriptPath);
const sign = crypto.createSign('SHA256');
sign.update(script);
sign.end();
const signature = sign.sign(privateKey).toString('base64');
const pubKeyBase64 = publicKey.toString('base64');

console.log('Updating Config.json...');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
config.scriptPublicKey = pubKeyBase64;
config.scriptSignature = signature;
fs.writeFileSync(configPath, JSON.stringify(config, null, 4));

console.log('Success! The plugin is now fully signed and secure.');
