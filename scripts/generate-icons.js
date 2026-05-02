const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '../quality_logos/logo-nobackground.png');
const publicDir = path.join(__dirname, '../public');

async function generateIcons() {
  console.log('Generating icons...');
  
  // Create 512x512 main icon
  await sharp(inputPath)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toFile(path.join(publicDir, 'icon-logo.png'));
    
  console.log('Generated icon-logo.png');

  // Create favicon sizes
  await sharp(inputPath)
    .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toFile(path.join(publicDir, 'favicon-32x32.png'));
    
  await sharp(inputPath)
    .resize(16, 16, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toFile(path.join(publicDir, 'favicon-16x16.png'));

  // Apple touch icon
  await sharp(inputPath)
    .resize(180, 180, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  console.log('Generated favicons and apple-touch-icon.png');
}

generateIcons().catch(console.error);
