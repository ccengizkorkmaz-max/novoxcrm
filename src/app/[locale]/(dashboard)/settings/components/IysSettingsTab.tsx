'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ShieldCheck, Loader2, Save, ExternalLink, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { updateIysSettings, testIysConnection } from '../actions/iys-actions'

interface IysSettingsTabProps {
    tenant: {
        id: string
        iys_provider?: string | null
        iys_config?: {
            username?: string
            password?: string
            api_url?: string
            api_key?: string
            brand_code?: string
            iys_code?: string
            consent_endpoint?: string
        } | null
        iys_sync_enabled?: boolean | null
    }
}

export default function IysSettingsTab({ tenant }: IysSettingsTabProps) {
    const config = tenant.iys_config || {}

    const [isSaving, setIsSaving] = useState(false)
    const [isTesting, setIsTesting] = useState(false)
    const [syncEnabled, setSyncEnabled] = useState(tenant.iys_sync_enabled ?? false)
    const [provider, setProvider] = useState(tenant.iys_provider || 'none')
    const [apiUrl, setApiUrl] = useState(config.api_url || '')
    const [apiKey, setApiKey] = useState(config.api_key || '')
    const [username, setUsername] = useState(config.username || '')
    const [password, setPassword] = useState(config.password || '')
    const [brandCode, setBrandCode] = useState(config.brand_code || '')
    const [iysCode, setIysCode] = useState(config.iys_code || '')
    const [consentEndpoint, setConsentEndpoint] = useState(config.consent_endpoint || '')
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

    const isConfigured = !!apiUrl && !!apiKey && !!brandCode && !!iysCode

    async function handleSave() {
        setIsSaving(true)
        try {
            const result = await updateIysSettings({
                iys_provider: provider,
                iys_sync_enabled: syncEnabled,
                iys_config: {
                    username,
                    password,
                    api_url: apiUrl,
                    api_key: apiKey,
                    brand_code: brandCode,
                    iys_code: iysCode,
                    consent_endpoint: consentEndpoint,
                }
            })
            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success('İYS ayarları kaydedildi.')
            }
        } catch (e: any) {
            toast.error(e.message || 'Bir hata oluştu.')
        } finally {
            setIsSaving(false)
        }
    }

    async function handleTestConnection() {
        setIsTesting(true)
        setTestResult(null)
        try {
            const result = await testIysConnection({
                api_url: apiUrl,
                api_key: apiKey,
                brand_code: brandCode,
                iys_code: iysCode,
            })
            setTestResult(result)
            if (result.success) {
                toast.success('Bağlantı başarılı!')
            } else {
                toast.error(result.message || 'Bağlantı başarısız.')
            }
        } catch (e: any) {
            setTestResult({ success: false, message: e.message || 'Bağlantı hatası.' })
            toast.error('Bağlantı testi başarısız.')
        } finally {
            setIsTesting(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-100">
                                <ShieldCheck className="w-5 h-5 text-emerald-700" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">İYS Entegrasyonu</CardTitle>
                                <CardDescription>
                                    İleti Yönetim Sistemi (İYS) entegrasyonu ile SMS, arama ve e-posta izin yönetimini otomatikleştirin.
                                </CardDescription>
                            </div>
                        </div>
                        <Badge variant={syncEnabled && isConfigured ? 'default' : 'secondary'} className={syncEnabled && isConfigured ? 'bg-emerald-600' : ''}>
                            {syncEnabled && isConfigured ? 'Aktif' : 'Pasif'}
                        </Badge>
                    </div>
                </CardHeader>
            </Card>

            {/* Provider & Toggle */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Sağlayıcı Ayarları</CardTitle>
                    <CardDescription>İYS entegratörünüzü seçin ve senkronizasyonu etkinleştirin.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Sync Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-lg border bg-slate-50">
                        <div>
                            <Label className="font-medium">İYS Senkronizasyonu</Label>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                Aktif olduğunda, müşteri izin değişiklikleri otomatik olarak İYS sağlayıcınıza iletilir.
                            </p>
                        </div>
                        <Switch
                            checked={syncEnabled}
                            onCheckedChange={setSyncEnabled}
                        />
                    </div>

                    {/* Provider Select */}
                    <div className="space-y-2">
                        <Label>İYS Sağlayıcısı</Label>
                        <Select value={provider} onValueChange={setProvider}>
                            <SelectTrigger className="w-full max-w-sm">
                                <SelectValue placeholder="Sağlayıcı seçin" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Yok (Devre Dışı)</SelectItem>
                                <SelectItem value="polidijital">Poli Dijital</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* API Credentials */}
            {provider !== 'none' && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base">API Bilgileri</CardTitle>
                                <CardDescription>
                                    {provider === 'polidijital' ? 'Poli Dijital' : provider} hesap bilgilerinizi girin.
                                </CardDescription>
                            </div>
                            {provider === 'polidijital' && (
                                <a
                                    href="https://polidijital.izin.app/api/docs#/en_US/_home?id=general-notes"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                                >
                                    API Dokümantasyonu <ExternalLink className="w-3 h-3" />
                                </a>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="iys_api_url">API URL</Label>
                                <Input
                                    id="iys_api_url"
                                    value={apiUrl}
                                    onChange={(e) => setApiUrl(e.target.value)}
                                    placeholder="https://polidijital.izin.app"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="iys_api_key">API Token</Label>
                                <Input
                                    id="iys_api_key"
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="••••••••••••"
                                />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="iys_username">Kullanıcı Adı</Label>
                                <Input
                                    id="iys_username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="novoinsaatdemo"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="iys_password">Panel Şifresi</Label>
                                <Input
                                    id="iys_password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••••••"
                                />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="iys_brand_code">Marka Kodu</Label>
                                <Input
                                    id="iys_brand_code"
                                    value={brandCode}
                                    onChange={(e) => setBrandCode(e.target.value)}
                                    placeholder="111111"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="iys_code">İYS Kodu</Label>
                                <Input
                                    id="iys_code"
                                    value={iysCode}
                                    onChange={(e) => setIysCode(e.target.value)}
                                    placeholder="111111"
                                />
                            </div>
                        </div>

                        {/* Consent Endpoint */}
                        <div className="space-y-2">
                            <Label htmlFor="iys_consent_endpoint">İzin Gönderim Endpoint</Label>
                            <Input
                                id="iys_consent_endpoint"
                                value={consentEndpoint}
                                onChange={(e) => setConsentEndpoint(e.target.value)}
                                placeholder="https://polidijital.izin.app/api/iys/add-consent"
                            />
                            <p className="text-xs text-muted-foreground">
                                İzin onay/ret bilgilerinin gönderileceği API endpoint adresi.
                            </p>
                        </div>
                        {/* Test Result */}
                        {testResult && (
                            <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${testResult.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                                {testResult.success ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                {testResult.message}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-3 pt-2">
                            <Button
                                onClick={handleTestConnection}
                                variant="outline"
                                disabled={isTesting || !apiUrl || !apiKey}
                                className="gap-2"
                            >
                                {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                                Bağlantıyı Test Et
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Info Box */}
            <Card className="border-amber-200 bg-amber-50/50">
                <CardContent className="pt-6">
                    <div className="flex gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="text-sm text-amber-800 space-y-1">
                            <p className="font-medium">İYS Senkronizasyonu Nasıl Çalışır?</p>
                            <ul className="list-disc list-inside space-y-0.5 text-amber-700">
                                <li>Müşteri iletişim bilgilerine izin verildiğinde veya reddedildiğinde kayıt oluşturulur.</li>
                                <li>Oluşturulan kayıtlar periyodik olarak (cron job) İYS sağlayıcısına iletilir.</li>
                                <li>SMS, arama ve e-posta kanalları ayrı ayrı yönetilir.</li>
                                <li>Senkronizasyon logları İşlem Logları sekmesinden takip edilebilir.</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="gap-2"
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Kaydet
                </Button>
            </div>
        </div>
    )
}
