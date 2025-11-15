const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Load image mappings
const crispyDaysImageMapPath = path.join(__dirname, 'public/images/crispy-days-image-map.json');
const tmcImageMapPath = path.join(__dirname, 'public/images/tmc-image-map.json');
const descriptionsPath = path.join(__dirname, 'menu-descriptions.json');

let crispyDaysImageMapping = {};
let tmcImageMapping = {};
let menuDescriptions = { 'crispy-days': {}, 'misty-cup': {} };

if (fs.existsSync(crispyDaysImageMapPath)) {
  crispyDaysImageMapping = JSON.parse(fs.readFileSync(crispyDaysImageMapPath, 'utf8'));
}

if (fs.existsSync(tmcImageMapPath)) {
  tmcImageMapping = JSON.parse(fs.readFileSync(tmcImageMapPath, 'utf8'));
}

if (fs.existsSync(descriptionsPath)) {
  menuDescriptions = JSON.parse(fs.readFileSync(descriptionsPath, 'utf8'));
}

// Read Excel file
const workbook = XLSX.readFile('Crispy Days Kompally Menu.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

// Column indices from the Excel
const COL = {
  SHORT_CODE: 0,
  TITLE: 1,
  FOOD_TYPE: 3,
  CATEGORY: 4,
  SUB_CATEGORY: 5,
  DESCRIPTION: 7,
  PRICE: 9,
  IS_ACTIVE: 10,
  ITEM_TYPE: 11
};

// Convert text to title case
function toTitleCase(str) {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => {
      // Handle special cases for hyphens
      if (word.includes('-')) {
        return word.split('-')
          .map(part => part.charAt(0).toUpperCase() + part.slice(1))
          .join('-');
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

// Logical category ordering
function getCategoryOrder(categoryName, brandId) {
  const orderMaps = {
    'crispy-days': {
      'Fried Chicken': 1,
      'Burgers': 2,
      'Pizzas': 3,
      'Wraps': 4,
      'Grilled Sandwiches': 5,
      'Momos (fried/steamed)': 6,
      'Veg Starters': 7,
      'Bread Omelette': 8,
      'Maggi': 9,
      'Fries': 10,
      'Garlic Breads': 11,
      'Combos': 12,
      'Make A Meal': 13,
      'Desserts': 14,
      'Soft Drinks': 15,
      'Dip Sauces': 16,
      'Add-Ons': 17
    },
    'misty-cup': {
      // Food first
      'Breakfast': 1,
      'Pasta': 2,
      'Salads': 3,
      'Ice Creams': 4,

      // Coffee section
      'Hot Coffee': 5,
      'Cold Coffee': 6,
      'Iced Cold Coffee': 7,      // Right after Cold Coffee

      // Shakes & beverages
      'Milkshakes': 8,

      // Tea section
      'Teas': 9,
      'Iced Teas': 10,

      // Alternatives
      'Non Coffee': 11,           // Hot chocolate, matcha, turmeric latte

      // Refreshers & juices
      'Mojito': 12,
      'Juice': 13,
      'Wellness Juices': 14,

      // Add-ons
      'Extra Syrup Shot': 15
    }
  };

  const orderMap = orderMaps[brandId] || {};
  return orderMap[categoryName] || 999; // Unknown categories go to the end
}

// Parse items and group variations
function parseMenuData(prefix, brandName, brandId) {
  const categories = {};
  let currentMainItem = null;

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const shortCode = row[COL.SHORT_CODE] || '';

    if (!shortCode.startsWith(prefix)) continue;
    if (row[COL.IS_ACTIVE] !== 1) continue; // Skip inactive items

    const title = row[COL.TITLE] || '';
    // For TMC items, use Sub Category; for CKK items, use Category
    const categoryRaw = prefix === 'TMC'
      ? (row[COL.SUB_CATEGORY] || 'Other')
      : (row[COL.CATEGORY] || 'Other');
    const category = toTitleCase(categoryRaw);
    const itemType = row[COL.ITEM_TYPE];
    const price = row[COL.PRICE] || 0;
    const description = row[COL.DESCRIPTION] || '';
    let foodType = row[COL.FOOD_TYPE] || 'Veg';

    // Intelligently detect egg items from title
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('egg') || lowerTitle.includes('omelette')) {
      foodType = 'Egg';
    }

    // Main item (itemType = 0)
    if (itemType === 0) {
      // Find image for this item
      let imagePath = '';
      if (prefix === 'CKK') {
        // Find matching image from Crispy Days mapping
        const matchingImage = Object.entries(crispyDaysImageMapping).find(([_, itemTitle]) => itemTitle === title);
        if (matchingImage) {
          imagePath = `/images/crispy-days-item-images/${matchingImage[0]}`;
        }
      } else if (prefix === 'TMC') {
        // Find matching image from TMC mapping
        const matchingImage = Object.entries(tmcImageMapping).find(([filename, itemData]) => itemData.title === title);
        if (matchingImage) {
          imagePath = `/images/tmc-item-images/${matchingImage[0]}`;
        }
      }

      // Get exciting description from menu-descriptions.json
      const brandDescriptions = menuDescriptions[brandId] || {};
      const excitingDescription = brandDescriptions[title] || description || `Delicious ${title.toLowerCase()}`;

      currentMainItem = {
        title: title,
        description: excitingDescription,
        price: price,
        image: imagePath,
        foodType: foodType,
        variations: []
      };

      // Initialize category if not exists
      if (!categories[category]) {
        categories[category] = {
          name: category,
          description: '',
          items: []
        };
      }

      categories[category].items.push(currentMainItem);
    }
    // Variation (itemType = 1)
    else if (itemType === 1 && currentMainItem) {
      // Start with parent item's food type as default (inherit from parent)
      let variationFoodType = currentMainItem.foodType;

      // Override if variation name has specific keywords
      const lowerVarTitle = title.toLowerCase();
      if (lowerVarTitle.includes('chicken') || lowerVarTitle.includes('non veg')) {
        variationFoodType = 'Non Veg';
      } else if (lowerVarTitle.includes('egg')) {
        variationFoodType = 'Egg';
      } else if (lowerVarTitle.includes('veg') && !lowerVarTitle.includes('non veg')) {
        variationFoodType = 'Veg';
      }

      currentMainItem.variations.push({
        name: title,
        price: price,
        foodType: variationFoodType
      });
    }
  }

  // Clean up items without variations (use base item as single option)
  Object.values(categories).forEach(category => {
    category.items.forEach(item => {
      if (item.variations.length === 0) {
        // No variations, remove the variations array
        delete item.variations;
      }
    });
  });

  // Convert categories object to array and sort by logical order
  const categoriesArray = Object.values(categories)
    .filter(cat => cat.items.length > 0)
    .sort((a, b) => getCategoryOrder(a.name, brandId) - getCategoryOrder(b.name, brandId));

  return {
    brandName: brandName,
    brandId: brandId,
    categories: categoriesArray
  };
}

// Generate Crispy Days menu
console.log('Generating Crispy Days menu...');
const crispyDaysMenu = parseMenuData('CKK', 'Crispy Days', 'crispy-days');
console.log(`- Found ${crispyDaysMenu.categories.length} categories`);
console.log(`- Total items: ${crispyDaysMenu.categories.reduce((sum, cat) => sum + cat.items.length, 0)}`);

// Generate The Misty Cup menu
console.log('\nGenerating The Misty Cup Coffee Room menu...');
const mistyCupMenu = parseMenuData('TMC', 'The Misty Cup Coffee Room', 'misty-cup');
console.log(`- Found ${mistyCupMenu.categories.length} categories`);
console.log(`- Total items: ${mistyCupMenu.categories.reduce((sum, cat) => sum + cat.items.length, 0)}`);

// Save JSON files
fs.writeFileSync('data/crispy-days.json', JSON.stringify(crispyDaysMenu, null, 2));
console.log('\n✓ Saved data/crispy-days.json');

fs.writeFileSync('data/misty-cup.json', JSON.stringify(mistyCupMenu, null, 2));
console.log('✓ Saved data/misty-cup.json');

console.log('\n✓ Menu JSON files generated successfully!');
