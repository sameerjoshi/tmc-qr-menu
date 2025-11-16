const fs = require('fs').promises;
const path = require('path');

// Function to convert title to filename
function titleToFilename(title) {
  return title
    .toLowerCase()
    .replace(/\n/g, ' ')  // Replace newlines with spaces
    .replace(/[^a-z0-9\s-]/g, '')  // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-')  // Replace spaces with hyphens
    .replace(/-+/g, '-')  // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '')  // Remove leading/trailing hyphens
    + '.jpeg';
}

async function updateImagePaths() {
  const menuPath = path.join(__dirname, 'data/misty-cup.json');

  // Read the menu file
  const menuContent = await fs.readFile(menuPath, 'utf8');
  const menu = JSON.parse(menuContent);

  let updateCount = 0;

  // Update each item's image path
  for (const category of menu.categories) {
    for (const item of category.items) {
      const filename = titleToFilename(item.title);
      const imagePath = `/images/tmc-item-images/${filename}`;

      if (item.image !== imagePath) {
        console.log(`Updating: ${item.title}`);
        console.log(`  From: ${item.image}`);
        console.log(`  To:   ${imagePath}`);
        item.image = imagePath;
        updateCount++;
      }
    }
  }

  // Save the updated menu
  await fs.writeFile(menuPath, JSON.stringify(menu, null, 2) + '\n');

  console.log(`\n✅ Updated ${updateCount} image paths`);
  console.log(`📁 Saved to: ${menuPath}`);
}

updateImagePaths().catch(console.error);
