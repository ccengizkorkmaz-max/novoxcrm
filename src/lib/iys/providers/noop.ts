import { BaseIYSProvider, IYSSyncResult } from './base';

export class NoopIYSProvider extends BaseIYSProvider {
    async checkConsent(
        phoneOrEmail: string, 
        channel: 'sms' | 'email' | 'call'
    ): Promise<{ consent: 'yes' | 'no' | 'unknown'; last_updated_at?: Date }> {
        console.log(`[NoopIYSProvider] Checking consent locally only for ${phoneOrEmail} (${channel})`);
        return { consent: 'unknown' };
    }

    async updateConsent(
        phoneOrEmail: string, 
        channel: 'sms' | 'email' | 'call', 
        consent: 'yes' | 'no',
        consentDate: Date
    ): Promise<IYSSyncResult> {
        console.log(`[NoopIYSProvider] Simulated sync to IYS for ${phoneOrEmail} (${channel}) -> ${consent}`);
        return {
            success: true,
            raw_response: { message: "Simulated success (No provider active)" }
        };
    }
}
