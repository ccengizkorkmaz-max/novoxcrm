import { GoogleGenerativeAI } from '@google/generative-ai';

async function main() {
    const genAI = new GoogleGenerativeAI('AIzaSyAVcp9IdyThcjf8idPGOLwY1NwPbcGBuiM');
    
    const models = ['gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-pro', 'gemini-2.0-flash'];
    
    for (const m of models) {
        try {
            console.log(`Testing model ${m}...`);
            const model = genAI.getGenerativeModel({ model: m });
            const result = await model.generateContent('Merhaba');
            console.log(`✅ Success for ${m}:`, result.response.text().slice(0, 50));
        } catch (e: any) {
            console.log(`❌ Failed for ${m}:`, e.message);
        }
    }
}

main();
