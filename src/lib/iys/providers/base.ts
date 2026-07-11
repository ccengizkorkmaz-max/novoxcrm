export interface IYSConfig {
    username?: string;
    password?: string;
    api_key?: string;
    brand_code?: string;
    iys_code?: string;
    [key: string]: any;
}

export interface IYSSyncResult {
    success: boolean;
    error_message?: string;
    raw_response?: any;
}

export abstract class BaseIYSProvider {
    protected config: IYSConfig;
    protected tenantId: string;

    constructor(tenantId: string, config: IYSConfig) {
        this.tenantId = tenantId;
        this.config = config;
    }

    /**
     * Checks the consent status for a recipient directly from the provider.
     */
    abstract checkConsent(
        phoneOrEmail: string, 
        channel: 'sms' | 'email' | 'call'
    ): Promise<{ consent: 'yes' | 'no' | 'unknown'; last_updated_at?: Date }>;

    /**
     * Sends a consent approval/rejection to the provider/IYS.
     */
    abstract updateConsent(
        phoneOrEmail: string, 
        channel: 'sms' | 'email' | 'call', 
        consent: 'yes' | 'no',
        consentDate: Date
    ): Promise<IYSSyncResult>;
}
