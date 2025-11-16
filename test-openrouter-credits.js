const https = require('https');

const OPENROUTER_API_KEY = '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';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/auth/key';

function checkCredits() {
  return new Promise((resolve, reject) => {
    const url = new URL(OPENROUTER_API_URL);

    const options = {
      method: 'GET',
      hostname: url.hostname,
      path: url.pathname,
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const response = JSON.parse(data);
            console.log('\n✅ OpenRouter API Key Status:\n');
            console.log(JSON.stringify(response, null, 2));

            if (response.data) {
              const credits = response.data;
              console.log('\n📊 Credit Summary:');
              console.log(`   Label: ${credits.label || 'N/A'}`);
              console.log(`   Limit: $${credits.limit || 'N/A'}`);
              console.log(`   Usage: $${credits.usage || 'N/A'}`);
              console.log(`   Remaining: $${credits.limit - credits.usage || 'N/A'}`);
              console.log(`   Rate Limit: ${credits.rate_limit || 'N/A'}`);
            }

            resolve(response);
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });

    req.end();
  });
}

// Test with a minimal generation request
function testGeneration() {
  return new Promise((resolve, reject) => {
    const requestBody = JSON.stringify({
      model: 'google/gemini-2.5-flash-image-preview',
      messages: [
        {
          role: 'user',
          content: 'A simple red apple on a white background'
        }
      ],
      modalities: ['image', 'text'],
      image_config: {
        aspect_ratio: '1:1'
      },
      max_tokens: 100
    });

    const url = new URL('https://openrouter.ai/api/v1/chat/completions');

    const options = {
      method: 'POST',
      hostname: url.hostname,
      path: url.pathname,
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody),
        'HTTP-Referer': 'http://localhost:4445',
        'X-Title': 'TMC Menu Image Generator'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('\n✅ Test generation successful!');
          console.log('   API is working and credits are available.\n');
          resolve(true);
        } else if (res.statusCode === 402) {
          console.log('\n❌ Credits exhausted (HTTP 402)');
          console.log('   Please add credits to your OpenRouter account.\n');
          resolve(false);
        } else {
          console.log(`\n⚠️  Test returned HTTP ${res.statusCode}`);
          console.log(`   Response: ${data.substring(0, 200)}\n`);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });

    req.write(requestBody);
    req.end();
  });
}

async function main() {
  console.log('🔍 Checking OpenRouter API status...\n');

  try {
    // First check the key info
    await checkCredits();

    // Then test actual generation
    console.log('\n🎨 Testing image generation capability...');
    await testGeneration();

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

main();
