import { BaseIYSProvider, IYSConfig, IYSSyncResult } from './base';

/**
 * Poli Dijital İYS Provider
 * 
 * API Auth: x-api-key header → "username:token"
 * Endpoint: {api_url}/api/iys/add-consent
 * Docs: https://polidijital.izin.app/api/docs
 * 
 * consentType: 0 = ARAMA, 1 = MESAJ (SMS), 2 = EPOSTA
 * recipientType: 0 = BIREYSEL, 1 = TACIR
 * source: 6 = HS_WEB (Web üzerinden alınan izin)
 * status: 1 = ONAY, 2 = RET
 */
export class PoliDijitalProvider extends BaseIYSProvider {
    private getBaseUrl(): string {
        return (this.config.api_url || 'https://polidijital.izin.app').replace(/\/+$/, '');
    }

    private getApiKey(): string {
        const username = this.config.username || '';
        const token = this.config.api_key || '';
        return `${username}:${token}`;
    }

    private mapChannelToConsentType(channel: 'sms' | 'email' | 'call'): number {
        switch (channel) {
            case 'call': return 0;   // ARAMA
            case 'sms': return 1;    // MESAJ
            case 'email': return 2;  // EPOSTA
            default: return 1;
        }
    }

    async checkConsent(
        phoneOrEmail: string, 
        channel: 'sms' | 'email' | 'call'
    ): Promise<{ consent: 'yes' | 'no' | 'unknown'; last_updated_at?: Date }> {
        try {
            // Poli Dijital doesn't have a dedicated status check endpoint in the provided docs.
            // We use add-consent with status query or return unknown and rely on local DB.
            console.log(`[PoliDijital] checkConsent for ${phoneOrEmail} (${channel}) — using local DB only`);
            return { consent: 'unknown' };
        } catch (e) {
            console.error('[PoliDijital] Error checking consent:', e);
            return { consent: 'unknown' };
        }
    }

    async updateConsent(
        phoneOrEmail: string, 
        channel: 'sms' | 'email' | 'call', 
        consent: 'yes' | 'no',
        consentDate: Date
    ): Promise<IYSSyncResult> {
        try {
            const endpoint = this.config.consent_endpoint 
                || `${this.getBaseUrl()}/api/iys/add-consent`;

            console.log(`[PoliDijital] Updating consent for ${phoneOrEmail} (${channel}) -> ${consent} on ${endpoint}`);

            const body = {
                iysCode: Number(this.config.iys_code) || 111111,
                brandCode: Number(this.config.brand_code) || 111111,
                consentType: this.mapChannelToConsentType(channel),
                recipientType: 1, // TACIR (B2B default — configurable if needed)
                source: 6,        // HS_WEB
                status: consent === 'yes' ? 1 : 2,  // 1=ONAY, 2=RET
                list: [
                    { recipient: phoneOrEmail }
                ]
            };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.getApiKey(),
                },
                body: JSON.stringify(body),
            });

            const raw_response = await response.text();
            let parsedResponse: any = {};
            try {
                parsedResponse = JSON.parse(raw_response);
            } catch(e) {}

            if (!response.ok) {
                console.error(`[PoliDijital] API error ${response.status}:`, raw_response);
                return {
                    success: false,
                    error_message: parsedResponse.message || parsedResponse.error || `API error: ${response.status} ${response.statusText}`,
                    raw_response: parsedResponse
                };
            }

            console.log(`[PoliDijital] Consent updated successfully for ${phoneOrEmail}`);
            return {
                success: true,
                raw_response: parsedResponse
            };
        } catch (e: any) {
            console.error('[PoliDijital] Sync connection error:', e);
            return {
                success: false,
                error_message: e.message || 'Unknown network error',
                raw_response: e
            };
        }
    }
}
