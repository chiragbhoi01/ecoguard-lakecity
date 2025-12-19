const fs = require('fs');
const path = require('path');

async function listModelsRaw() {
    try {
        const envPath = path.join(__dirname, '.env.local');
        if (!fs.existsSync(envPath)) {
            console.error('.env.local not found');
            return;
        }

        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/GEMINI_API_KEY=(.*)/);
        if (!match) {
            console.error('GEMINI_API_KEY not found in .env.local');
            return;
        }

        let apiKey = match[1].trim();
        // Strip quotes if present
        if (apiKey.startsWith('"') && apiKey.endsWith('"')) {
            apiKey = apiKey.slice(1, -1);
        }

        console.log(`Using API Key: ${apiKey.substring(0, 5)}...`);

        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

        console.log('Fetching models via REST API:', url.replace(apiKey, 'HIDDEN'));

        const response = await fetch(url);

        if (!response.ok) {
            const text = await response.text();
            console.error(`❌ API Request Failed: ${response.status} ${response.statusText}`);
            console.error('Response Body:', text);
            return;
        }

        const data = await response.json();
        if (data.models) {
            const modelNames = data.models
                .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
                .map(m => m.name);
            fs.writeFileSync('models.json', JSON.stringify(modelNames, null, 2));
            console.log('✅ Models saved to models.json');
        } else {
            console.log('No models found, response saved to models.json');
            fs.writeFileSync('models.json', JSON.stringify(data, null, 2));
        }

    } catch (error) {
        console.error('Script Error:', error);
    }
}

listModelsRaw();
