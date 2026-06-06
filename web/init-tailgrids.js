const { spawn } = require('child_process');
const os = require('os');

const child = spawn(os.platform() === 'win32' ? 'npx.cmd' : 'npx', ['@tailgrids/cli@latest', 'init'], {
  stdio: ['pipe', 'inherit', 'inherit']
});

setTimeout(() => {
  // First prompt: Which theme? (Dark) -> Arrow down + Enter
  child.stdin.write('\x1B[B\r');
  
  setTimeout(() => {
    // Second prompt: Import alias? (@) -> Enter
    child.stdin.write('\r');
  }, 3000);
}, 5000);

child.on('close', (code) => {
  console.log(`child process exited with code ${code}`);
});
