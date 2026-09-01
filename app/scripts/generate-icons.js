/**
 * Generates MYTracker app icon assets from the source artwork.
 * Run: npm run generate-icons
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ASSETS_DIR = path.join(__dirname, '..', 'assets');
const SOURCE = path.join(ASSETS_DIR, 'icon-source.png');
const BG = '#1a1a2e';

async function ensureSource() {
  if (!fs.existsSync(SOURCE)) {
    throw new Error(
      `Missing ${SOURCE}. Place a 1024x1024 source image at assets/icon-source.png`
    );
  }
}

async function writeIcon(output, size, fit = 'cover') {
  await sharp(SOURCE)
    .resize(size, size, { fit, background: BG })
    .png()
    .toFile(path.join(ASSETS_DIR, output));
}

async function writeAdaptiveForeground(output, size) {
  // Android adaptive icon safe zone is ~66% — scale logo to fit center.
  const logoSize = Math.round(size * 0.72);
  const logo = await sharp(SOURCE).resize(logoSize, logoSize, { fit: 'contain' }).png().toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: logo, gravity: 'centre' }])
    .png()
    .toFile(path.join(ASSETS_DIR, output));
}

async function writeSplashIcon(output, size) {
  const logoSize = Math.round(size * 0.55);
  const logo = await sharp(SOURCE).resize(logoSize, logoSize, { fit: 'contain' }).png().toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 26, g: 26, b: 46, alpha: 1 },
    },
  })
    .composite([{ input: logo, gravity: 'centre' }])
    .png()
    .toFile(path.join(ASSETS_DIR, output));
}

async function main() {
  if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
  }

  await ensureSource();

  await writeIcon('icon.png', 1024);
  await writeAdaptiveForeground('adaptive-icon.png', 1024);
  await writeSplashIcon('splash-icon.png', 512);

  console.log('Generated:');
  console.log('  assets/icon.png           (1024×1024 — iOS & store)');
  console.log('  assets/adaptive-icon.png  (1024×1024 — Android foreground)');
  console.log('  assets/splash-icon.png    (512×512 — splash screen)');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
