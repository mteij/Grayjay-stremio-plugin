const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const pluginDir = path.join(__dirname, 'web', 'public', 'plugin');
const configPath = path.join(pluginDir, 'Config.json');
const scriptPath = path.join(pluginDir, 'Script.js');

try {
    // 1. Read existing config
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    // 2. Increment version
    config.version = (config.version || 0) + 1;
    console.log(`Bumping plugin version to ${config.version}...`);

    // 3. Normalize Script.js line endings to LF to prevent signature tampering by Git
    let scriptContent = fs.readFileSync(scriptPath, 'utf8');
    scriptContent = scriptContent.replace(/\r\n/g, '\n');
    fs.writeFileSync(scriptPath, scriptContent);

    // 4. Generate RSA Key Pair
    console.log('Generating RSA 2048-bit key pair...');
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'der' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });

    // 5. Sign normalized Script.js
    console.log('Signing Script.js...');
    const scriptBytes = fs.readFileSync(scriptPath);
    const sign = crypto.createSign('SHA256');
    sign.update(scriptBytes);
    sign.end();
    const signature = sign.sign(privateKey).toString('base64');
    const pubKeyBase64 = publicKey.toString('base64');

    // 6. Update Config.json
    config.scriptPublicKey = pubKeyBase64;
    config.scriptSignature = signature;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 4));

    // 7. Add files to git index so they are committed
    try {
      execSync(`git add "${configPath}" "${scriptPath}"`);
      console.log('Successfully added updated plugin files to git commit.');
    } catch (e) {
      console.warn('Warning: Could not automatically git add files.');
    }

    console.log(`Success! Plugin version ${config.version} signed and ready.`);
} catch (err) {
    console.error("Error during plugin sign & bump:", err.message);
    process.exit(1); // Fail the commit if something goes wrong
}
