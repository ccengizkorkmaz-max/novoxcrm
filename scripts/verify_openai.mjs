import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Manually read .env.local because dotenv might not be set up for this script context
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');

const envVars = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        envVars[key.trim()] = value.trim();
    }
});

const apiKey = envVars['OPENAI_API_KEY'];

if (!apiKey) {
    console.error('OPENAI_API_KEY not found in .env.local');
    process.exit(1);
}

console.log('Testing with API Key:', apiKey.substring(0, 10) + '...');

const openai = new OpenAI({
    apiKey: apiKey,
});

async function test() {
    try {
        console.log('Testing Chat Completion...');
        const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content: "You are a helpful assistant." }, { role: "user", content: "Hello!" }],
            model: "gpt-4o-mini",
        });
        console.log('Chat Completion Success:', completion.choices[0].message.content);
    } catch (error) {
        console.error('Chat Completion Failed:', error);
    }
}

test();
