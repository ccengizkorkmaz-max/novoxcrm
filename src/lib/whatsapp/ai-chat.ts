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
 * AI tarafından üretilen yanıttan dahili düşünme (THOUGHT / Reasoning / Thinking) bloklarını temizler.
 */
export function cleanAiResponse(text: string | null): string | null {
    if (!text) return text;

    let cleaned = text.trim();

    // 1. <thought>...</thought>, <thinking>...</thinking>, <reasoning>...</reasoning> etiketlerini temizle
    cleaned = cleaned.replace(/<(thought|thinking|reasoning)>[\s\S]*?<\/\1>/gi, '').trim();

    // 2. "THOUGHT", "Thinking:", "Düşünce:", "Reasoning:" bloklarını temizle
    if (/^\s*(THOUGHT|Thinking|Düşünce|Reasoning)/i.test(cleaned)) {
        const splitParts = cleaned.split(/\n\s*\n/);
        if (splitParts.length > 1) {
            const nonThoughtParts = splitParts.filter(part => !/^\s*(THOUGHT|Thinking|Düşünce|Reasoning)/i.test(part.trim()));
            if (nonThoughtParts.length > 0) {
                cleaned = nonThoughtParts.join('\n\n').trim();
            }
        }
        cleaned = cleaned.replace(/^\s*(THOUGHT|Thinking|Düşünce|Reasoning)[:\s]*[\s\S]*?(?=\n\n[A-ZÇĞİÖŞÜa-zçğıöşü]|\[LEAD_|$)/i, '').trim();
        cleaned = cleaned.replace(/^\s*(THOUGHT|Thinking|Düşünce|Reasoning)[:\s]*/i, '').trim();
    }

    // 3. Etiket taşımayan ama İngilizce/Sistem Düşünce/Analiz cümlelerini temizle
    if (/^(Knowledge Base entry|I should|I need to|I must|The general rules|According to|In this scenario|The user asks)/i.test(cleaned)) {
        const paragraphs = cleaned.split('\n').map(p => p.trim()).filter(Boolean);
        const turkishParagraphs = paragraphs.filter(p => {
            const isEnglishReasoning = /^(Knowledge Base entry|I should|I need to|I must|The general rules|The rules state|I also need|I must not use|Knowledge Base)/i.test(p) ||
                /["'](MAKSİMUM 1-2 CÜMLE|CEVAP SONRASI|PAS KURALI|GİZLİ|DÜŞÜNME)/i.test(p);
            return !isEnglishReasoning;
        });

        if (turkishParagraphs.length > 0) {
            cleaned = turkishParagraphs.join('\n').trim();
        }
    }

    // 4. Kendi kendine "I must not use THOUGHT..." deyip Türkçe yanıta yapışan önekleri temizle
    cleaned = cleaned.replace(/^(?:Knowledge Base entry for[^\n\.]*[\n\.]?|I should [^\n\.]*[\n\.]?|The general rules state[^\n\.]*[\n\.]?|I also need to [^\n\.]*[\n\.]?|I must not use [^\n\.]*[\n\.]?)+/gi, '').trim();

    return cleaned || null;
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
        let reply: string | null = null;
        if (provider === 'openai') {
            reply = await callOpenAI(apiKey, systemPrompt, chatHistory, modelName || 'gpt-4o-mini');
        } else {
            reply = await callGemini(apiKey, systemPrompt, chatHistory, modelName || 'gemini-2.5-flash');
        }
        return cleanAiResponse(reply);
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
