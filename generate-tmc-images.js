const fs = require('fs').promises;
const path = require('path');
const https = require('https');

// Gemini 2.5 Flash Image (Nano Banana) API configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyCb0i8SWhCQwff8MBmiJH3fUbwtdRikXTM';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent';
const IMAGE_ASPECT_RATIO = '3:2';  // 3:2 landscape aspect ratio (produces ~1536x1024)

// Load The Misty Cup menu
const menuPath = path.join(__dirname, 'data/misty-cup.json');
const outputDir = path.join(__dirname, 'public/images/tmc-item-images');

// Create optimized food photography prompt
function createFoodImagePrompt(itemTitle, category, description) {
  // Special handling for breakfast items to avoid bacon/beef/pork
  const breakfastDescriptions = {
    'English Breakfast': 'A traditional English breakfast beautifully plated on a white ceramic plate: two perfectly fried eggs with golden runny yolks, grilled tomato halves with caramelized edges, sautéed mushrooms (button and portobello), golden hash browns, baked beans in rich tomato sauce, and buttered whole grain toast. Optional: grilled chicken sausages (halal-certified). The eggs are the centerpiece with whites fully set and yolks glistening. Fresh parsley garnish.',
    'Egg and Toast': 'A minimalist yet elegant breakfast scene: two perfectly poached eggs with silky whites and molten golden yolks resting on artisanal sourdough toast, lightly buttered and toasted to golden-brown perfection. The eggs are garnished with freshly cracked black pepper, a sprinkle of flaky sea salt, and fresh microgreens (pea shoots or arugula). Optional: sliced avocado arranged in a fan, halved cherry tomatoes, or sautéed spinach. A small pat of butter melting on the toast.'
  };

  // Use specific description for breakfast items if available
  const itemDescription = (category === 'Breakfast' && breakfastDescriptions[itemTitle])
    ? breakfastDescriptions[itemTitle]
    : description;

  // Category-specific photography parameters
  const categoryStyles = {
    'Breakfast': {
      lighting: 'warm morning sunlight, golden hour glow',
      perspective: '45-degree angle',
      surface: 'rustic wooden table with light grain',
      mood: 'fresh, energizing, morning warmth',
      context: 'vegetarian-friendly morning breakfast with warm natural lighting'
    },
    'Pasta': {
      lighting: 'soft overhead lighting with subtle side fill',
      perspective: 'overhead flat lay or 30-degree angle',
      surface: 'dark slate or marble surface',
      mood: 'rich, hearty, Italian restaurant quality',
      context: 'Italian pasta dish with rich sauce, fresh herbs, and garnishes'
    },
    'Salads': {
      lighting: 'bright natural daylight, crisp and clean',
      perspective: 'overhead flat lay',
      surface: 'white ceramic or light marble',
      mood: 'fresh, vibrant, health-focused',
      context: 'fresh, colorful salad with vibrant vegetables and greens'
    },
    'Ice Creams': {
      lighting: 'soft diffused studio lighting, cool tones',
      perspective: 'straight-on eye level or slight overhead',
      surface: 'clean white or pastel background',
      mood: 'creamy, indulgent, perfectly frozen',
      context: 'creamy ice cream dessert in a modern cup'
    },
    'Hot Coffee': {
      lighting: 'warm side lighting with steam backlit',
      perspective: '45-degree angle showing steam',
      surface: 'dark wood or concrete surface',
      mood: 'cozy, aromatic, café ambiance',
      context: 'steaming hot coffee in a professional ceramic cup'
    },
    'Cold Coffee': {
      lighting: 'bright natural light showing condensation',
      perspective: 'straight-on or slight overhead',
      surface: 'light wood or white marble',
      mood: 'refreshing, iced, perfectly chilled',
      context: 'refreshing iced coffee with condensed milk'
    },
    'Iced Cold Coffee': {
      lighting: 'bright natural light showing condensation',
      perspective: 'straight-on or slight overhead',
      surface: 'light wood or white marble',
      mood: 'refreshing, iced, perfectly chilled',
      context: 'cold coffee beverage with ice cubes'
    },
    'Milkshakes': {
      lighting: 'soft studio lighting, even illumination',
      perspective: 'straight-on eye level',
      surface: 'clean café counter or white surface',
      mood: 'thick, creamy, indulgent dessert',
      context: 'thick creamy milkshake in a tall glass'
    },
    'Teas': {
      lighting: 'natural window light, warm and gentle',
      perspective: '45-degree angle in transparent cup',
      surface: 'wooden tray or light stone surface',
      mood: 'calming, aromatic, tea house quality',
      context: 'hot tea beverage in an elegant cup'
    },
    'Iced Teas': {
      lighting: 'bright natural light showing clarity',
      perspective: 'straight-on showing full glass',
      surface: 'light wood or white surface',
      mood: 'refreshing, cool, tea house quality',
      context: 'refreshing iced tea in a clear glass'
    },
    'Non Coffee': {
      lighting: 'soft warm lighting',
      perspective: '45-degree angle',
      surface: 'dark wood surface',
      mood: 'cozy, comforting, café quality',
      context: 'specialty hot beverage with marshmallows'
    },
    'Mojito': {
      lighting: 'bright natural light showing bubbles and ice',
      perspective: 'straight-on showing full glass height',
      surface: 'bar counter or tropical surface',
      mood: 'refreshing, vibrant, cocktail bar quality',
      context: 'refreshing mocktail with fresh mint leaves and lime'
    },
    'Juice': {
      lighting: 'bright backlit natural light showing clarity',
      perspective: 'straight-on or slight angle',
      surface: 'clean white or light wood surface',
      mood: 'fresh-pressed, vibrant, healthy',
      context: 'fresh fruit juice in a clear glass'
    },
    'Wellness Juices': {
      lighting: 'bright backlit natural light showing clarity',
      perspective: 'straight-on or slight angle',
      surface: 'clean white or light wood surface',
      mood: 'fresh-pressed, vibrant, healthy',
      context: 'healthy fresh-pressed juice blend with vibrant colors'
    },
    'Extra Syrup Shot': {
      lighting: 'soft studio lighting',
      perspective: 'straight-on or slight angle',
      surface: 'café counter or clean surface',
      mood: 'professional, café quality',
      context: 'coffee syrup in a small glass bottle'
    }
  };

  // Get category-specific style or use default
  const style = categoryStyles[category] || {
    lighting: 'soft natural lighting',
    perspective: '45-degree angle',
    surface: 'neutral wooden surface',
    mood: 'appetizing, professional quality',
    context: 'delicious food item'
  };

  // Optimized prompt structure for Gemini
  let prompt = `Professional food photography: ${itemTitle}

SUBJECT: ${itemTitle} - ${itemDescription}
CONTEXT: ${style.context}

TECHNICAL SPECIFICATIONS:
Camera: Full-frame DSLR, 50mm f/1.8 lens, shallow depth of field (f/2.8)
Lighting: ${style.lighting}, color temperature 5000-5500K
Composition: ${style.perspective}, rule of thirds, minimal negative space
Surface: ${style.surface}
Focus: Tack-sharp on main subject, soft bokeh background

VISUAL STYLE:
${style.mood}, editorial food magazine quality, Bon Appétit aesthetic
Colors: accurate, saturated but natural, appetizing
Styling: minimalist, one hero item, subtle garnish only
Atmosphere: professional studio quality, commercial menu photography

IMAGE QUALITY:
Photorealistic, high resolution, no compression artifacts
Perfect exposure and white balance
Clean, uncluttered, Instagram-worthy presentation

NEGATIVE PROMPT (exclude):
No text, watermarks, logos, or typography
No human hands, people, or body parts
No cluttered backgrounds or busy patterns
No artificial filters or oversaturation
No low-quality rendering or blur
No multiple items unless specified in description
No unrealistic proportions or distortions`;

  // Add specific negative prompts for breakfast items to avoid bacon/beef/pork
  if (category === 'Breakfast') {
    prompt += `

CRITICAL BREAKFAST EXCLUSIONS:
No bacon, no pork, no ham, no beef, no pork sausages, no streaky bacon, no back bacon, no black pudding, no blood sausage, no pork belly, no gammon, no pancetta, no prosciutto, no salami, no chorizo, no processed meats, no deli meats, no cured meats, no reddish-brown crispy strips, no meat strips, no charred meat strips, no fatty meat strips
ONLY eggs, vegetables, chicken sausages (if any meat), plant-based proteins`;
  }

  return prompt;
}

// Helper function to make HTTP/HTTPS requests with redirect support
function makeRequest(url, options, postData, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      // Handle redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        if (maxRedirects === 0) {
          reject(new Error('Too many redirects'));
          return;
        }

        const redirectUrl = new URL(res.headers.location, url);
        makeRequest(redirectUrl, options, null, maxRedirects - 1)
          .then(resolve)
          .catch(reject);
        return;
      }

      const chunks = [];

      res.on('data', (chunk) => {
        chunks.push(chunk);
      });

      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ statusCode: res.statusCode, data: buffer });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${buffer.toString()}`));
        }
      });
    });

    req.on('error', reject);

    if (postData) {
      req.write(postData);
    }

    req.end();
  });
}

// Search keywords mapping for better Unsplash results
const searchKeywords = {
  'English Breakfast': 'english breakfast plate eggs toast',
  'Egg and Toast': 'poached eggs toast breakfast',
  'Pomodoro Pasta': 'pasta tomato sauce basil',
  'Alfredo Pasta': 'fettuccine alfredo creamy pasta',
  'Rosatella Pasta': 'pink pasta rose sauce',
  'Aglio e Olio Spaghetti': 'spaghetti aglio olio garlic',
  'Caesar Salad': 'caesar salad romaine parmesan',
  'Mediterranean Salad': 'mediterranean salad olives feta',
  'Watermelon Feta Salad': 'watermelon feta salad mint',
  'Fruit Bowl with Yogurt & Muesli': 'fruit bowl yogurt granola',
  'Vanilla Ice Cream': 'vanilla ice cream scoop',
  'Chocolate Ice Cream': 'chocolate ice cream scoop',
  'Mango Ice Cream': 'mango ice cream scoop',
  'Strawberry Ice Cream': 'strawberry ice cream scoop',
  'Butterscotch Ice Cream': 'butterscotch ice cream scoop',
  'Special Ice Cream': 'gourmet ice cream dessert',
  'Espresso': 'espresso cup coffee',
  'Doppio': 'double espresso shot',
  'Americano': 'americano coffee cup',
  'Cappuccino': 'cappuccino foam latte art',
  'Flat White': 'flat white coffee milk',
  'Latte': 'latte coffee milk foam',
  'Mocha': 'mocha chocolate coffee',
  'Spanish Latte': 'spanish latte condensed milk',
  'Vietnamese Latte': 'vietnamese coffee condensed milk',
  'Affogato': 'affogato ice cream espresso'
};

// Generate image using Gemini 2.5 Flash Image (Nano Banana) API
async function generateImage(prompt, itemName, category) {
  console.log(`🎨 Generating with Gemini Nano Banana: ${itemName}...`);

  try {
    // Build Gemini API request
    const requestBody = JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        responseModalities: ["Image"],
        imageConfig: {
          aspectRatio: IMAGE_ASPECT_RATIO
        }
      }
    });

    const url = new URL(GEMINI_API_URL);
    const options = {
      method: 'POST',
      hostname: url.hostname,
      path: url.pathname,
      headers: {
        'x-goog-api-key': GEMINI_API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody)
      }
    };

    const { data } = await makeRequest(url, options, requestBody);
    const response = JSON.parse(data.toString());

    // Extract image from response
    if (response.candidates && response.candidates[0]) {
      const parts = response.candidates[0].content.parts;

      for (const part of parts) {
        if (part.inlineData) {
          const imageData = part.inlineData.data;
          const mimeType = part.inlineData.mimeType;

          console.log(`✓ Generated image for ${itemName} (${mimeType})`);

          // Convert base64 to buffer
          const imageBuffer = Buffer.from(imageData, 'base64');

          return {
            data: imageBuffer,
            type: 'gemini-binary',
            mimeType: mimeType
          };
        }
      }
    }

    throw new Error('No image data in Gemini response');

  } catch (error) {
    // Handle quota errors specifically
    if (error.message.includes('429') || error.message.includes('quota')) {
      console.log(`⚠️  Quota exceeded for ${itemName}`);
      console.log(`   Gemini API quota limit reached. Using placeholder.`);
    } else {
      console.log(`⚠️  Error generating image for ${itemName}: ${error.message}`);
    }

    // Fallback to placeholder with 3:2 aspect ratio
    const seed = `${itemName}`.toLowerCase().replace(/[^a-z0-9]/g, '');
    return {
      data: `https://picsum.photos/seed/tmc-${seed}/1536/1024`,
      type: 'fallback-placeholder'
    };
  }
}

// Save image (either binary data or download from URL)
async function saveImage(imageData, itemName, type) {
  const fileName = `${itemName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.jpeg`;
  const filePath = path.join(outputDir, fileName);

  try {
    if (type === 'gemini-binary' || type === 'sdxl-binary') {
      // Data is already binary from Gemini or Hugging Face
      const source = type === 'gemini-binary' ? 'Gemini' : 'SDXL';
      console.log(`💾 Saving ${source} image: ${fileName}`);
      await fs.writeFile(filePath, imageData);
      console.log(`✓ Saved: ${fileName} (${Math.round(imageData.length / 1024)}KB)`);
    } else {
      // Download from URL (placeholder)
      const downloadType = 'placeholder';
      console.log(`📥 Downloading ${downloadType} image: ${fileName}`);
      const url = new URL(imageData);

      const options = {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      };

      const { data } = await makeRequest(url, options);
      await fs.writeFile(filePath, data);
      console.log(`✓ Saved: ${fileName} (${Math.round(data.length / 1024)}KB)`);
    }

    return fileName;
  } catch (error) {
    console.error(`❌ Failed to save ${fileName}: ${error.message}`);
    return null;
  }
}

// Main generation function
async function generateAllImages() {
  try {
    // Create output directory
    await fs.mkdir(outputDir, { recursive: true });
    console.log(`📁 Output directory: ${outputDir}\n`);

    // Load menu data
    const menuContent = await fs.readFile(menuPath, 'utf8');
    const menu = JSON.parse(menuContent);

    console.log(`🎨 Generating images for ${menu.brandName}...\n`);

    const imageMapping = {};
    let successCount = 0;
    let errorCount = 0;

    // Generate images for each menu item
    for (const category of menu.categories) {
      console.log(`\n📂 Category: ${category.name}`);

      for (const item of category.items) {
        const prompt = createFoodImagePrompt(item.title, category.name, item.description);
        const imageResult = await generateImage(prompt, item.title, category.name);

        if (imageResult) {
          const fileName = await saveImage(imageResult.data, item.title, imageResult.type);

          if (fileName) {
            imageMapping[fileName] = {
              title: item.title,
              category: category.name,
              type: imageResult.type
            };
            successCount++;
          } else {
            errorCount++;
          }
        } else {
          errorCount++;
        }

        // Rate limiting: wait 5 seconds between requests (Gemini free tier: conservative)
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    // Save mapping file
    const mappingPath = path.join(__dirname, 'public/images/tmc-image-map.json');
    await fs.writeFile(mappingPath, JSON.stringify(imageMapping, null, 2));

    console.log(`\n✅ Generation Complete!`);
    console.log(`   Success: ${successCount} images`);
    console.log(`   Errors: ${errorCount} images`);
    console.log(`   Mapping: ${mappingPath}`);

  } catch (error) {
    console.error(`❌ Fatal error: ${error.message}`);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the generator
generateAllImages();
