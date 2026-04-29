import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Build script for Firefox distribution.
 *
 * Steps:
 * 1. Clean dist-firefox/
 * 2. Copy dist/ → dist-firefox/
 * 3. Replace manifest.json with manifest-firefox.json
 */

const __filename = fileURLToPath(import.meta.url);
const root = path.dirname(path.dirname(__filename));
const chromeDist = path.join(root, 'dist');
const firefoxDist = path.join(root, 'dist-firefox');
const firefoxManifest = path.join(root, 'manifest-firefox.json');

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

if (!fs.existsSync(chromeDist)) {
  console.error('Error: dist/ does not exist. Run "npm run build" first.');
  process.exit(1);
}

if (!fs.existsSync(firefoxManifest)) {
  console.error('Error: manifest-firefox.json does not exist.');
  process.exit(1);
}

// Clean and copy
if (fs.existsSync(firefoxDist)) {
  fs.rmSync(firefoxDist, { recursive: true });
}
copyDir(chromeDist, firefoxDist);

// Swap manifest
const manifestContent = fs.readFileSync(firefoxManifest, 'utf-8');
fs.writeFileSync(path.join(firefoxDist, 'manifest.json'), manifestContent);

console.log(`✅ Firefox build ready at ${firefoxDist}/`);
console.log(`📦 Manifest: ${firefoxManifest}`);
