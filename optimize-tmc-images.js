#!/usr/bin/env node
/**
 * Image Optimization Script for TMC Menu Images
 * Uses Sharp to optimize and compress images
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const IMAGE_DIR = './public/images/tmc-item-images';
const BACKUP_DIR = './public/images/tmc-item-images-backup';
const MAX_WIDTH = 1200; // Maximum width for images
const QUALITY = 85; // Quality for JPEG/WebP

// Create backup directory if it doesn't exist
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  console.log('✓ Created backup directory');
}

// Get all image files
const imageFiles = fs.readdirSync(IMAGE_DIR).filter(file => {
  const ext = path.extname(file).toLowerCase();
  return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
});

console.log(`Found ${imageFiles.length} images to optimize\n`);

async function optimizeImage(filename) {
  const inputPath = path.join(IMAGE_DIR, filename);
  const backupPath = path.join(BACKUP_DIR, filename);
  const ext = path.extname(filename).toLowerCase();
  const baseName = path.basename(filename, ext);

  try {
    // Get original file size
    const originalStats = fs.statSync(inputPath);
    const originalSize = originalStats.size;

    // Create backup if it doesn't exist
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(inputPath, backupPath);
    }

    // Load image
    const image = sharp(inputPath);
    const metadata = await image.metadata();

    // Determine if resize is needed
    let processedImage = image;
    if (metadata.width > MAX_WIDTH) {
      processedImage = image.resize(MAX_WIDTH, null, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }

    // Optimize based on format
    if (ext === '.png') {
      // For PNG, keep as PNG but optimize
      await processedImage
        .png({ quality: QUALITY, compressionLevel: 9 })
        .toFile(inputPath + '.tmp');
    } else {
      // For JPEG/JPG, optimize as JPEG
      await processedImage
        .jpeg({ quality: QUALITY, progressive: true })
        .toFile(inputPath + '.tmp');
    }

    // Replace original with optimized
    fs.renameSync(inputPath + '.tmp', inputPath);

    // Get new file size
    const newStats = fs.statSync(inputPath);
    const newSize = newStats.size;
    const savedBytes = originalSize - newSize;
    const savedPercent = ((savedBytes / originalSize) * 100).toFixed(1);

    const originalKB = (originalSize / 1024).toFixed(1);
    const newKB = (newSize / 1024).toFixed(1);

    console.log(`✓ ${filename}`);
    console.log(`  ${originalKB} KB → ${newKB} KB (saved ${savedPercent}%)`);

    return { originalSize, newSize, savedBytes };
  } catch (error) {
    console.error(`✗ Error optimizing ${filename}:`, error.message);
    return { originalSize: 0, newSize: 0, savedBytes: 0 };
  }
}

// Process all images
(async () => {
  console.log('Starting optimization...\n');
  console.log('═'.repeat(50));

  let totalOriginal = 0;
  let totalNew = 0;
  let successCount = 0;

  for (const file of imageFiles) {
    const result = await optimizeImage(file);
    totalOriginal += result.originalSize;
    totalNew += result.newSize;
    if (result.savedBytes > 0) successCount++;
    console.log(''); // Empty line between files
  }

  const totalSaved = totalOriginal - totalNew;
  const totalSavedPercent = ((totalSaved / totalOriginal) * 100).toFixed(1);

  console.log('═'.repeat(50));
  console.log('\n📊 Summary:');
  console.log(`   Images processed: ${successCount}/${imageFiles.length}`);
  console.log(`   Original size: ${(totalOriginal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   New size: ${(totalNew / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Saved: ${(totalSaved / 1024 / 1024).toFixed(2)} MB (${totalSavedPercent}%)`);
  console.log(`\n✓ Optimization complete!`);
  console.log(`✓ Backups saved to: ${BACKUP_DIR}`);
})();
