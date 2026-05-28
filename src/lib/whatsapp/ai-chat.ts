/**
 * WhatsApp Webhook – AI Chat Engine
 *
 * AI sağlayıcı çözümleme, model fallback, Gemini & OpenAI API çağrıları.
 */

import type { ResolvedAiProvider, ChatMessage } from './types';

/**
 * Tenant ayarlarından aktif AI provider, model ve API key'i dinamik olarak çözer.
 * Model adı tenant'ta tanımlıysa onu kullanır, yoksa default kullanır.
 */
export function resolveAiProvider(tenant: any): ResolvedAiProvider | null {
    const geminiModel = tenant.gemini_model || 'gemini-2.5-flash';
    const openaiModel = tenant.openai_model || 'gpt-4o-mini';

    // 1. Gemini aktif ve key varsa
    if (tenant.is_gemini_enabled && tenant.gemini_api_key) {
        return { provider: 'gemini', apiKey: tenant.gemini_api_key, model: geminiModel };
    }
    // 2. OpenAI aktif ve key varsa
    if (tenant.is_openai_enabled && tenant.openai_api_key) {
        return { provider: 'openai', apiKey: tenant.openai_api_key, model: openaiModel };
    }
    // 3. Eski ai_api_key fallback
    if (tenant.ai_api_key) {
        const p = tenant.ai_provider || 'gemini';
        return { provider: p, apiKey: tenant.ai_api_key, model: p === 'openai' ? openaiModel : geminiModel };
    }
    // 4. Key var ama toggle açık değilse yine kullan
    if (tenant.gemini_api_key) {
        return { provider: 'gemini', apiKey: tenant.gemini_api_key, model: geminiModel };
    }
    if (tenant.openai_api_key) {
        return { provider: 'openai', apiKey: tenant.openai_api_key, model: openaiModel };
    }
    return null;
}

/**
 * AI sağlayıcısına göre yanıt üretir (Gemini veya OpenAI)
 */
export async function generateAIReply(
    provider: string,
    apiKey: string,
    systemPrompt: string,
    chatHistory: ChatMessage[],
    modelName?: string
): Promise<string | null> {
    try {
        if (provider === 'openai') {
            return await callOpenAI(apiKey, systemPrompt, chatHistory, modelName || 'gpt-4o-mini');
        }
        return await callGemini(apiKey, systemPrompt, chatHistory, modelName || 'gemini-2.5-flash');
    } catch (error) {
        console.error(`${provider} API Error:`, error);
        return null;
    }
}

/**
 * Google Gemini AI API
 */
async function callGemini(
    apiKey: string,
    systemPrompt: string,
    chatHistory: ChatMessage[],
    modelName: string = 'gemini-2.5-flash'
): Promise<string | null> {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Model fallback list if 404 occurs
    const modelOptions = [
        modelName, 
        'gemini-2.5-flash', 
        'gemini-2.5-pro'
    ];
    
    // Remove duplicates
    const uniqueModels = [...new Set(modelOptions)];
    
    let lastError = null;
    
    for (const currentModel of uniqueModels) {
        try {
            console.log(`[AI] Attempting Gemini model: ${currentModel}`);
            const isLegacy = currentModel === 'gemini-pro';
            
            // Legacy models (gemini-pro) don't support systemInstruction in v1beta via SDK easily
            const modelConfig = isLegacy ? { model: currentModel } : { 
                model: currentModel, 
                systemInstruction: systemPrompt 
            };
            
            const model = genAI.getGenerativeModel(modelConfig);

            let safeHistory = chatHistory.slice(0, -1);
            if (safeHistory.length > 0 && safeHistory[0].role === 'model') {
                safeHistory.unshift({ role: 'user', parts: [{ text: 'Merhaba' }] });
            }

            const chat = model.startChat({ history: safeHistory }); // Son mesaj hariç geçmiş
            const lastMessage = chatHistory[chatHistory.length - 1]?.parts?.[0]?.text || '';
            const result = await chat.sendMessage(lastMessage);
            const text = result.response.text();
            
            console.log(`[AI] Successfully generated response using ${currentModel}`);
            return text || null;
            
        } catch (error: any) {
            console.warn(`[AI] Model ${currentModel} failed:`, error.message);
            lastError = error;
            // If it's a 404, we continue to the next fallback. Otherwise, break.
            if (error.message?.includes('404') || error.message?.includes('not found') || error.message?.includes('not supported')) {
                continue;
            } else {
                break; // E.g., API Key invalid, Rate limit, etc.
            }
        }
    }
    
    console.error(`[AI] All Gemini models failed. Last error:`, lastError);
    throw lastError;
}

/**
 * OpenAI Chat Completion API
 */
async function callOpenAI(
    apiKey: string,
    systemPrompt: string,
    chatHistory: ChatMessage[],
    modelName: string = 'gpt-4o-mini'
): Promise<string | null> {
    const messages = [
        { role: 'system', content: systemPrompt },
        ...chatHistory.map((m) => ({
            role: m.role === 'model' ? 'assistant' : 'user',
            content: m.parts[0].text,
        })),
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: modelName,
            messages,
            max_tokens: 500,
            temperature: 0.7,
        }),
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
}
