const fs = require('fs');
const path = require('path');
const forge = require('node-forge');

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

let envKey = process.env.PLUGIN_PRIVATE_KEY;

if (!envKey) {
    console.warn('WARNING: PLUGIN_PRIVATE_KEY is not set. Skipping plugin signing & versioning.');
    process.exit(0);
}

console.log(`Loaded private key from environment. Length: ${envKey.length} characters.`);

try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    // 1. Generate version based on Unix timestamp (ensures auto-update triggers on every deployment)
    const newVersion = Math.floor(Date.now() / 1000);
    config.version = newVersion;
    
    // Append cache-buster to bypass Grayjay app cache
    config.scriptUrl = `https://greyjay-stremio.netlify.app/plugin/Script.js?v=${newVersion}`;
    console.log(`Bumping plugin version to timestamp ${newVersion}...`);

    // 2. Decode private key
    let privateKeyPem = envKey;
    
    // Aggressively extract pure PEM block, ignoring quotes, spaces, or anything else
    const pemMatch = envKey.match(/-----BEGIN [\s\S]+?-----END [^-]+-----/);
    
    if (pemMatch) {
        privateKeyPem = pemMatch[0];
    } else {
        // If no PEM found, try decoding it as raw base64
        privateKeyPem = Buffer.from(envKey.replace(/[^A-Za-z0-9+/=]/g, ''), 'base64').toString('utf8');
        const fallbackMatch = privateKeyPem.match(/-----BEGIN [\s\S]+?-----END [^-]+-----/);
        if (fallbackMatch) {
            privateKeyPem = fallbackMatch[0];
        } else {
            throw new Error('The private key is truncated or invalid! No valid PEM headers found.');
        }
    }
    
    // Pure Javascript RSA decoding using node-forge (bypasses ALL OpenSSL FIPS bugs on Netlify)
    const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
    const publicKey = forge.pki.setRsaPublicKey(privateKey.n, privateKey.e);
    
    // Export Public Key to SPKI DER Base64 format for Grayjay
    // publicKeyToPem generates standard SPKI format
    let pubKeyBase64 = forge.pki.publicKeyToPem(publicKey);
    pubKeyBase64 = pubKeyBase64
        .replace('-----BEGIN PUBLIC KEY-----', '')
        .replace('-----END PUBLIC KEY-----', '')
        .replace(/\s+/g, '');

    // 3. Normalize Script.js line endings to pure LF
    let scriptContent = fs.readFileSync(scriptPath, 'utf8');
    scriptContent = scriptContent.replace(/\r\n/g, '\n');
    fs.writeFileSync(scriptPath, scriptContent);

    // 4. Sign the EXACT raw bytes of the file using SHA-512 (required by Grayjay)
    const scriptBytes = fs.readFileSync(scriptPath);
    const md = forge.md.sha512.create();
    md.update(scriptBytes.toString('binary'));
    const signatureBytes = privateKey.sign(md);
    const signatureBase64 = forge.util.encode64(signatureBytes);

    // 5. Save the updated config
    config.scriptPublicKey = pubKeyBase64;
    config.scriptSignature = signatureBase64;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 4));

    console.log('Successfully updated Config.json with new signature and timestamp-based version!');
} catch (err) {
    console.error('Failed to sign plugin:', err);
    process.exit(1);
}
