const { spawn } = require('child_process');
const path = require('path');

// Start the backend server
const backend = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true
});

// Start the React development server
const frontend = spawn('npm', ['start'], {
  stdio: 'inherit',
  shell: true,
  cwd: path.join(__dirname, 'src')
});

// Handle process termination
process.on('SIGINT', () => {
  backend.kill();
  frontend.kill();
  process.exit();
});

backend.on('close', (code) => {
  console.log(`Backend process exited with code ${code}`);
  frontend.kill();
  process.exit(code);
});

frontend.on('close', (code) => {
  console.log(`Frontend process exited with code ${code}`);
  backend.kill();
  process.exit(code);
}); 