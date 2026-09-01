/**
 * Generates placeholder icon assets (minimal valid PNGs).
 * Run: node scripts/generate-icons.js
 * No dependencies required.
 */
const fs = require('fs');
const path = require('path');

// Minimal 67-byte valid 1x1 PNG (Expo will scale; replace with real 1024x1024 later)
const MINIMAL_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const MINIMAL_PNG = Buffer.from(MINIMAL_PNG_BASE64, 'base64');

const ASSETS_DIR = path.join(__dirname, '..', 'assets');

function main() {
  if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
  }
  fs.writeFileSync(path.join(ASSETS_DIR, 'icon.png'), MINIMAL_PNG);
  fs.writeFileSync(path.join(ASSETS_DIR, 'adaptive-icon.png'), MINIMAL_PNG);
  fs.writeFileSync(path.join(ASSETS_DIR, 'splash-icon.png'), MINIMAL_PNG);
  console.log('Generated assets/icon.png, assets/adaptive-icon.png, assets/splash-icon.png');
  console.log('Replace with 1024x1024 (icon, adaptive-icon) and splash image for production.');
}

main();
