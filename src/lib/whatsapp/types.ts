/**
 * WhatsApp Webhook – Shared Types
 */

export interface IncomingPayload {
    channel: 'whatsapp' | 'messenger';
    phone: string;
    external_user_id: string;
    name: string;
    message: string;
    timestamp: string;
    message_id: string;
    phoneNumberId: string;
    button_reply_id?: string;
}

export interface ResolvedAiProvider {
    provider: string;
    apiKey: string;
    model: string;
}

export interface ChatMessage {
    role: string;
    parts: { text: string }[];
}
