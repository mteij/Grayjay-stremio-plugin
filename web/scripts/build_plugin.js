const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const pluginDir = path.join(__dirname, '..', 'public', 'plugin');
const configPath = path.join(pluginDir, 'Config.json');
const scriptPath = path.join(pluginDir, 'Script.js');

console.log('--- Netlify Plugin Builder ---');

// Load .env.local if running locally
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
    const envLines = fs.readFileSync(envPath, 'utf8').split('\n');
    envLines.forEach(line => {
        if (line.startsWith('PLUGIN_PRIVATE_KEY=')) {
            process.env.PLUGIN_PRIVATE_KEY = line.split('=')[1].replace(/"/g, '').trim();
        }
    });
}

let privateKeyBase64 = process.env.PLUGIN_PRIVATE_KEY;
if (privateKeyBase64) {
    privateKeyBase64 = privateKeyBase64.replace(/['"]/g, '').trim();
}

if (!privateKeyBase64) {
    console.warn('WARNING: PLUGIN_PRIVATE_KEY is not set. Skipping plugin signing & versioning.');
    process.exit(0);
}

try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    // 1. Generate version based on Unix timestamp (ensures auto-update triggers on every deployment)
    const newVersion = Math.floor(Date.now() / 1000);
    config.version = newVersion;
    
    // Append cache-buster to bypass Grayjay app cache
    config.scriptUrl = `https://greyjay-stremio.netlify.app/plugin/Script.js?v=${newVersion}`;
    console.log(`Bumping plugin version to timestamp ${newVersion}...`);

    // 2. Decode private key and extract public key
    const privateKeyPem = Buffer.from(privateKeyBase64, 'base64').toString('utf8');
    
    // Extract the raw DER payload from the PEM string to bypass OpenSSL PEM decoder bugs
    const derBase64 = privateKeyPem
        .replace('-----BEGIN PRIVATE KEY-----', '')
        .replace('-----END PRIVATE KEY-----', '')
        .replace(/\s+/g, ''); // strip all newlines and spaces
        
    const privateKeyDerBuffer = Buffer.from(derBase64, 'base64');
    
    const privateKey = crypto.createPrivateKey({
        key: privateKeyDerBuffer,
        format: 'der',
        type: 'pkcs8'
    });
    
    const publicKey = crypto.createPublicKey(privateKey);
    const pubKeyBase64 = publicKey.export({ type: 'spki', format: 'der' }).toString('base64');

    // 3. Normalize Script.js line endings to pure LF
    let scriptContent = fs.readFileSync(scriptPath, 'utf8');
    scriptContent = scriptContent.replace(/\r\n/g, '\n');
    fs.writeFileSync(scriptPath, scriptContent);

    // 4. Sign the file
    const scriptBytes = fs.readFileSync(scriptPath);
    const sign = crypto.createSign('SHA256');
    sign.update(scriptBytes);
    sign.end();
    const signature = sign.sign(privateKey).toString('base64');

    // 5. Save the updated config
    config.scriptPublicKey = pubKeyBase64;
    config.scriptSignature = signature;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 4));

    console.log('Successfully updated Config.json with new signature and timestamp-based version!');
} catch (err) {
    console.error('Failed to sign plugin:', err);
    process.exit(1);
}
