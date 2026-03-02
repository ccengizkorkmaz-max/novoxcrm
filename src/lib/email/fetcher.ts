import imaps from 'imap-simple';
import { simpleParser } from 'mailparser';

export interface EmailAuth {
    host: string;
    port: number;
    user: string;
    pass: string;
    tls: boolean;
}

export interface FetchedEmail {
    subject: string;
    from: string;
    date: Date;
    text: string;
    html: string;
}

/**
 * Fetches unread emails from the specified account
 */
export async function fetchUnreadEmails(auth: EmailAuth): Promise<FetchedEmail[]> {
    const config = {
        imap: {
            user: auth.user,
            password: auth.pass,
            host: auth.host,
            port: auth.port,
            tls: auth.tls,
            authTimeout: 3000,
            tlsOptions: { rejectUnauthorized: false } // Common for some corporate hosts
        }
    };

    try {
        const connection = await imaps.connect(config);
        await connection.openBox('INBOX');

        const searchCriteria = ['UNSEEN'];
        const fetchOptions = {
            bodies: ['HEADER', 'TEXT', ''],
            markSeen: true
        };

        const messages = await connection.search(searchCriteria, fetchOptions);
        const results: FetchedEmail[] = [];

        for (const message of messages) {
            const all = message.parts.find(part => part.which === '');
            if (!all) continue;

            const parsed = await simpleParser(all.body);
            results.push({
                subject: parsed.subject || '(Konu Yok)',
                from: parsed.from?.text || '',
                date: parsed.date || new Date(),
                text: parsed.text || '',
                html: parsed.html || ''
            });
        }

        connection.end();
        return results;
    } catch (error: any) {
        console.error('Email Fetcher Error:', error.message);
        throw error;
    }
}
