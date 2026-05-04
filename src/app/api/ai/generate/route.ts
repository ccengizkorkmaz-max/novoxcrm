import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    const { prompt, maxTokens = 300 } = await request.json();

    if (!prompt) {
        return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: maxTokens,
                temperature: 0.7,
            }),
        });

        const data = await res.json();
        const text = data.choices?.[0]?.message?.content || '';
        return NextResponse.json({ text });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'AI generation failed' }, { status: 500 });
    }
}
