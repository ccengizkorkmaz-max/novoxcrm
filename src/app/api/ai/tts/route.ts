import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    try {
        const { text, gender } = await req.json()
        const apiKey = process.env.GOOGLE_TTS_API_KEY

        if (!apiKey) {
            return NextResponse.json({ error: 'Google TTS API Key missing' }, { status: 500 })
        }

        const cleanText = text.replace(/\*\*/g, '').replace(/\[LEAD_CAPTURE_EVENT\]/g, '').trim()
        if (!cleanText) return NextResponse.json({ error: 'No text to speak' })

        // Switching to WAVENET-C and WAVENET-D which are high-quality and universally supported
        // Female: tr-TR-Wavenet-C is very professional and warm
        // Male: tr-TR-Wavenet-B is solid
        const voiceName = gender === 'male' ? 'tr-TR-Wavenet-B' : 'tr-TR-Wavenet-C'

        const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                input: { text: cleanText },
                voice: {
                    languageCode: 'tr-TR',
                    name: voiceName,
                },
                audioConfig: {
                    audioEncoding: 'MP3',
                    // Corporate calibration for Wavenet-C
                    pitch: -1.0, // Slightly lower for more authoritative feel
                    speakingRate: 1.0,
                    volumeGainDb: 0.0
                }
            })
        })

        const data = await response.json()

        if (!response.ok) {
            console.error('Google Cloud TTS Error:', data)
            const errorMsg = data.error?.message || 'Google TTS Error'
            return NextResponse.json({ error: errorMsg }, { status: response.status })
        }

        return NextResponse.json({ audioContent: data.audioContent })

    } catch (error: any) {
        console.error('TTS Route Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
