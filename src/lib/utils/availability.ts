/**
 * Utility to extract customer availability/time preferences from messages or call transcripts.
 */

export function extractAvailabilityFromText(text: string): string | null {
    if (!text) return null;
    
    const timeKeywords = [
        /saat/i,
        /müsait/i,
        /uygun/i,
        /arar/i,
        /arayın/i,
        /ararsınız/i,
        /arayabilir/i,
        /aranmak/i,
        /ulaş/i,
        /dön/i,
        /akşam/i,
        /sabah/i,
        /öğle/i,
        /yarın/i,
        /hafta sonu/i,
        /haftasonu/i,
        /gün içinde/i,
        /mesai/i,
        /pazartesi/i,
        /salı/i,
        /çarşamba/i,
        /perşembe/i,
        /cuma/i,
        /cumartesi/i,
        /pazar/i,
        /\b\d{1,2}[.:-]\d{2}\b/,
        /\b\d{1,2}\s*(?:dan|den|ten|tan|den sonra|ten sonra|sonra|önce|gibi|civari|dolaylarında)\b/i
    ];

    // Split text into lines/sentences
    const lines = text.split(/[\n\.\?\!\,]/).map(l => l.trim()).filter(Boolean);
    for (const line of lines) {
        const hasKeyword = timeKeywords.some(pattern => pattern.test(line));
        if (hasKeyword) {
            const hasTimeContext = /\d/g.test(line) || 
                                   /akşam|sabah|öğle|yarın|gün içinde|hafta sonu|haftasonu|mesai/i.test(line);
            if (hasTimeContext) {
                return line.substring(0, 100);
            }
        }
    }
    return null;
}

/**
 * Scans user messages in a WhatsApp conversation for availability preferences.
 */
export function extractAvailabilityPreferenceFromMessages(messages: Array<{ role: string; content: string }>): string | null {
    const userMessages = messages.filter(m => m.role === 'user');
    for (const msg of userMessages) {
        const pref = extractAvailabilityFromText(msg.content || '');
        if (pref) return pref;
    }
    return null;
}

/**
 * Scans a Vapi call transcript for availability preferences.
 */
export function extractAvailabilityPreferenceFromTranscript(transcript: string): string | null {
    if (!transcript) return null;
    const lines = transcript.split('\n');
    const userLines: string[] = [];
    for (const line of lines) {
        const lower = line.toLowerCase();
        if (lower.startsWith('user:') || lower.startsWith('customer:') || lower.startsWith('caller:')) {
            const content = line.substring(line.indexOf(':') + 1).trim();
            userLines.push(content);
        } else if (!line.includes(':')) {
            userLines.push(line.trim());
        }
    }

    for (const text of userLines) {
        const pref = extractAvailabilityFromText(text);
        if (pref) return pref;
    }
    return null;
}
