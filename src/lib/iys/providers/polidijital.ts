import { BaseIYSProvider, IYSConfig, IYSSyncResult } from './base';

export class PoliDijitalProvider extends BaseIYSProvider {
    private getApiUrl(): string {
        return this.config.api_url || 'https://api.poli.com.tr/v1'; // Poli Dijital API base
    }

    async checkConsent(
        phoneOrEmail: string, 
        channel: 'sms' | 'email' | 'call'
    ): Promise<{ consent: 'yes' | 'no' | 'unknown'; last_updated_at?: Date }> {
        try {
            const url = `${this.getApiUrl()}/iys/status`;
            console.log(`[PoliDijital] Querying consent status for ${phoneOrEmail} on ${url}`);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.api_key || ''}`
                },
                body: JSON.stringify({
                    recipient: phoneOrEmail,
                    channel: channel === 'email' ? 'EPOSTA' : (channel === 'sms' ? 'SMS' : 'ARAMA'),
                    brand_code: this.config.brand_code,
                    iys_code: this.config.iys_code
                })
            });

            if (!response.ok) {
                console.error(`[PoliDijital] Status check failed: ${response.statusText}`);
                return { consent: 'unknown' };
            }

            const data = await response.json();
            const status = data.status === 'ONAY' ? 'yes' : (data.status === 'RET' ? 'no' : 'unknown');
            return {
                consent: status,
                last_updated_at: data.consentDate ? new Date(data.consentDate) : new Date()
            };
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
            const url = `${this.getApiUrl()}/iys/consent`;
            console.log(`[PoliDijital] Updating consent for ${phoneOrEmail} (${channel}) -> ${consent} on ${url}`);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.api_key || ''}`
                },
                body: JSON.stringify({
                    recipient: phoneOrEmail,
                    channel: channel === 'email' ? 'EPOSTA' : (channel === 'sms' ? 'SMS' : 'ARAMA'),
                    status: consent === 'yes' ? 'ONAY' : 'RET',
                    consent_date: consentDate.toISOString(),
                    brand_code: this.config.brand_code,
                    iys_code: this.config.iys_code,
                    source: 'HS_WEB'
                })
            });

            const raw_response = await response.text();
            let parsedResponse: any = {};
            try {
                parsedResponse = JSON.parse(raw_response);
            } catch(e) {}

            if (!response.ok) {
                return {
                    success: false,
                    error_message: parsedResponse.message || `API error: ${response.statusText}`,
                    raw_response: parsedResponse
                };
            }

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
