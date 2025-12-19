const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
    try {
        // Load env manually
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

        const apiKey = match[1].trim();
        console.log('API Key found (starts with):', apiKey.substring(0, 5) + '...');

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = "Analyze this image. Identify if it contains waste/garbage.";
        // We can't easily test with an image here without a file, but we can test text-only or just see if the model initializes.
        // Actually, gemini-1.5-flash supports text-only prompts too? Or is it multimodal only?
        // Let's try a simple text prompt first.

        console.log('Sending test prompt...');
        const result = await model.generateContent(prompt);
        console.log('Result received!');
        console.log(result.response.text());

    } catch (error) {
        console.error('Error testing Gemini:', error);
        // Log the full error object structure
        if (error.response) {
            console.error('Error Response:', error.response);
        }
    }
}

testGemini();
