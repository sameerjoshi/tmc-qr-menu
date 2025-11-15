const fs = require('fs').promises;
const path = require('path');
const https = require('https');

// OpenRouter configuration
const OPENROUTER_API_KEY = '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';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'google/gemini-2.5-flash-image-preview'; // Image generation model

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

      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ statusCode: res.statusCode, data: data });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
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

// Generate image using Gemini Flash Image Preview
async function generateImage(prompt, itemName, maxRetries = 3) {
  console.log(`🎨 Generating image for: ${itemName}...`);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const requestBody = JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        modalities: ['image', 'text'], // Required for image generation
        image_config: {
          aspect_ratio: '3:2' // Landscape format like Crispy Days (600x400)
        },
        max_tokens: 2000,
        temperature: 0.8
      });

      const options = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(requestBody),
          'HTTP-Referer': 'http://localhost:4445',
          'X-Title': 'TMC Menu Image Generator'
        }
      };

      const { data } = await makeRequest(OPENROUTER_API_URL, options, requestBody);
      const response = JSON.parse(data);

      // Extract image data from response
      const assistantMessage = response.choices?.[0]?.message;
      const images = assistantMessage?.images;

      if (images && images.length > 0) {
        const imageObject = images[0];

        // Per OpenRouter docs: images[0].image_url.url contains base64 data URI
        let imageData = null;
        if (imageObject?.image_url?.url) {
          imageData = imageObject.image_url.url;
        } else if (imageObject?.data?.image_url?.url) {
          imageData = imageObject.data.image_url.url;
        } else if (imageObject?.url) {
          imageData = imageObject.url;
        } else if (typeof imageObject === 'string') {
          imageData = imageObject;
        }

        if (imageData) {
          console.log(`✓ Generated image for ${itemName}`);
          return { data: imageData, type: 'ai-generated' };
        }
      }

      // If no image in response, use placeholder
      console.log(`⚠️  No image in response for ${itemName}, using placeholder`);
      const seed = `${itemName}`.toLowerCase().replace(/[^a-z0-9]/g, '');
      return {
        data: `https://picsum.photos/seed/tmc-${seed}/1024/1024`,
        type: 'placeholder'
      };

    } catch (error) {
      console.log(`Attempt ${attempt}/${maxRetries} failed: ${error.message}`);

      if (attempt === maxRetries) {
        console.log(`❌ Failed after ${maxRetries} attempts, using placeholder`);
        const seed = `${itemName}`.toLowerCase().replace(/[^a-z0-9]/g, '');
        return {
          data: `https://picsum.photos/seed/tmc-${seed}/1024/1024`,
          type: 'fallback-placeholder'
        };
      }

      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
}

// Download image from URL or convert base64 to file
async function saveImage(imageData, itemName) {
  const fileName = `${itemName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.jpeg`;
  const filePath = path.join(outputDir, fileName);

  try {
    let buffer;

    // Check if it's base64 data URL
    if (imageData.startsWith('data:image/')) {
      console.log(`📝 Saving AI-generated base64 image: ${fileName}`);
      const [header, base64Data] = imageData.split(',');
      buffer = Buffer.from(base64Data, 'base64');
    } else {
      // Download from URL
      console.log(`📥 Downloading image: ${fileName}`);
      const url = new URL(imageData);

      const options = {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      };

      const { data } = await makeRequest(url, options);
      buffer = Buffer.from(data, 'binary');
    }

    await fs.writeFile(filePath, buffer);
    console.log(`✓ Saved: ${fileName} (${Math.round(buffer.length / 1024)}KB)`);

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
        const imageResult = await generateImage(prompt, item.title);

        if (imageResult) {
          const fileName = await saveImage(imageResult.data, item.title);

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

        // Rate limiting: wait 2 seconds between requests
        await new Promise(resolve => setTimeout(resolve, 2000));
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
