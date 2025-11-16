const https = require('https');
const fs = require('fs').promises;
const path = require('path');

const GEMINI_API_KEY = 'AIzaSyCb0i8SWhCQwff8MBmiJH3fUbwtdRikXTM';

// Helper function to make HTTPS requests
function makeRequest(url, options, postData) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
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

async function testGeminiImagen() {
  console.log('🧪 Testing Gemini 2.5 Flash Image API (Nano Banana)...\n');

  try {
    // Test prompt for English Breakfast
    const prompt = 'Professional food photography of full English breakfast, sunny-side up eggs with runny yolk, sautéed mushrooms, grilled tomatoes, baked beans, golden artisan toast, overhead 3/4 angle, warm morning light, white plate on rustic wooden table, appetizing restaurant presentation';

    console.log(`📝 Prompt: ${prompt.substring(0, 80)}...\n`);

    // Correct Gemini 2.5 Flash Image endpoint
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent`;

    const requestBody = JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        responseModalities: ["Image"],
        imageConfig: {
          aspectRatio: "3:2"
        }
      }
    });

    const url = new URL(apiUrl);
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

    console.log('🌐 Making API request to Gemini 2.5 Flash Image...\n');
    const { data } = await makeRequest(url, options, requestBody);

    const response = JSON.parse(data.toString());
    console.log('✅ API Response received!\n');

    // Check if we got an image
    if (response.candidates && response.candidates[0]) {
      const parts = response.candidates[0].content.parts;

      for (const part of parts) {
        if (part.inlineData) {
          const imageData = part.inlineData.data;
          const mimeType = part.inlineData.mimeType;

          console.log(`📸 Image received (${mimeType})`);

          // Save the test image
          const imageBuffer = Buffer.from(imageData, 'base64');
          const testPath = path.join(__dirname, 'test-gemini-image.png');
          await fs.writeFile(testPath, imageBuffer);
          console.log(`\n✅ Test image saved to: ${testPath}`);
          console.log(`   Size: ${Math.round(imageBuffer.length / 1024)}KB`);

          return true;
        }
      }
    }

    console.log('⚠️  No image found in response');
    console.log('Response:', JSON.stringify(response, null, 2));
    return false;

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    return false;
  }
}

testGeminiImagen();
