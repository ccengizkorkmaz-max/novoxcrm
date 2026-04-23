import { GoogleGenerativeAI } from '@google/generative-ai';
async function main() {
    const key = "AIzaSyAXeR_rvaozeb7E_l772keF1WsuAZWk9vE";
    const genAI = new GoogleGenerativeAI(key);
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        await model.generateContent('test');
        console.log('✅ Key works!');
    } catch (e: any) {
        console.log('❌ Key error:', e.message);
    }
}
main();
