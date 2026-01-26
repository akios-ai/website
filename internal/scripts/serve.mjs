import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const DIST_DIR = path.resolve('dist');
const PORT = 8000;

if (!fs.existsSync(DIST_DIR)) {
    console.error('Error: dist/ directory not found. Run "npm run build" first.');
    process.exit(1);
}

console.log(`Serving site from ${DIST_DIR}`);
console.log(`URL: http://localhost:${PORT}`);

const server = spawn('python3', ['-m', 'http.server', String(PORT)], {
    cwd: DIST_DIR,
    stdio: 'inherit'
});

server.on('close', (code) => {
    console.log(`Server exited with code ${code}`);
});
