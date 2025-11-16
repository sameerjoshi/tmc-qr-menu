const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const imagesDir = path.join(__dirname, 'public/images/tmc-item-images');

async function getFileSize(filePath) {
  const stats = await fs.stat(filePath);
  return stats.size;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

async function optimizeImage(filePath) {
  const fileName = path.basename(filePath);
  const originalSize = await getFileSize(filePath);

  try {
    // Read the original image
    const image = sharp(filePath);
    const metadata = await image.metadata();

    // Optimize the image
    // - Resize to max 1536px width (maintains 3:2 aspect ratio)
    // - Quality 85 for good balance between size and quality
    // - Strip metadata to reduce size
    // - Progressive JPEG for better web loading
    await image
      .resize({
        width: 1536,
        height: 1024,
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({
        quality: 85,
        progressive: true,
        mozjpeg: true
      })
      .toFile(filePath + '.tmp');

    // Replace original with optimized
    await fs.rename(filePath + '.tmp', filePath);

    const newSize = await getFileSize(filePath);
    const savings = originalSize - newSize;
    const savingsPercent = Math.round((savings / originalSize) * 100);

    console.log(`✓ ${fileName}`);
    console.log(`  ${formatBytes(originalSize)} → ${formatBytes(newSize)} (${savingsPercent}% smaller)`);

    return {
      fileName,
      originalSize,
      newSize,
      savings,
      savingsPercent
    };
  } catch (error) {
    console.error(`✗ ${fileName}: ${error.message}`);
    // Clean up tmp file if it exists
    try {
      await fs.unlink(filePath + '.tmp');
    } catch {}
    return null;
  }
}

async function optimizeAllImages() {
  console.log('🎨 Optimizing images for web...\n');

  try {
    // Get all JPEG images
    const files = await fs.readdir(imagesDir);
    const imageFiles = files.filter(file =>
      file.endsWith('.jpeg') || file.endsWith('.jpg')
    );

    console.log(`Found ${imageFiles.length} images to optimize\n`);

    let totalOriginalSize = 0;
    let totalNewSize = 0;
    let optimizedCount = 0;

    // Optimize each image
    for (const file of imageFiles) {
      const filePath = path.join(imagesDir, file);
      const result = await optimizeImage(filePath);

      if (result) {
        totalOriginalSize += result.originalSize;
        totalNewSize += result.newSize;
        optimizedCount++;
      }
    }

    const totalSavings = totalOriginalSize - totalNewSize;
    const totalSavingsPercent = Math.round((totalSavings / totalOriginalSize) * 100);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Optimization Complete!\n');
    console.log(`   Images optimized: ${optimizedCount}/${imageFiles.length}`);
    console.log(`   Original size:    ${formatBytes(totalOriginalSize)}`);
    console.log(`   Optimized size:   ${formatBytes(totalNewSize)}`);
    console.log(`   Total savings:    ${formatBytes(totalSavings)} (${totalSavingsPercent}% reduction)`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

optimizeAllImages();
