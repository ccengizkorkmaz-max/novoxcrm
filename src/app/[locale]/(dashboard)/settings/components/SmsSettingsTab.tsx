'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { MessageSquare, ShieldCheck, Send, Loader2, Save, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { updateSmsSettings, testSms } from '../actions'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface SmsSettingsTabProps {
    tenant: {
        id: string
        sms_provider?: string | null
        sms_api_user?: string | null
        sms_api_password?: string | null
        sms_sender_id?: string | null
        is_sms_notifications_enabled?: boolean
        brand_config?: any
    }
}

export default function SmsSettingsTab({ tenant }: SmsSettingsTabProps) {
    const [isPending, setIsPending] = useState(false)
    const [isTesting, setIsTesting] = useState(false)
    const [testPhone, setTestPhone] = useState('')

    const smsSettings = (tenant.brand_config?.sms_settings || {}) as Record<string, { user?: string; pass?: string; sender_id?: string }>
    const initialProvider = tenant.sms_provider || 'polidijital'
    
    if (initialProvider && !smsSettings[initialProvider]) {
        smsSettings[initialProvider] = {
            user: tenant.sms_api_user || '',
            pass: tenant.sms_api_password || '',
            sender_id: tenant.sms_sender_id || ''
        }
    }

    const [smsProvider, setSmsProvider] = useState(initialProvider)
    const [smsApiUser, setSmsApiUser] = useState(smsSettings[initialProvider]?.user || '')
    const [smsApiPassword, setSmsApiPassword] = useState(smsSettings[initialProvider]?.pass || '')
    const [smsSenderId, setSmsSenderId] = useState(smsSettings[initialProvider]?.sender_id || '')

    const handleProviderChange = (newProvider: string) => {
        smsSettings[smsProvider] = {
            user: smsApiUser,
            pass: smsApiPassword,
            sender_id: smsSenderId
        }

        setSmsProvider(newProvider)
        const saved = smsSettings[newProvider] || {}
        setSmsApiUser(saved.user || '')
        setSmsApiPassword(saved.pass || '')
        setSmsSenderId(saved.sender_id || '')
    }

    const handleTestSms = async () => {
        setIsTesting(true)
        try {
            const res = await testSms(testPhone) as any
            if (res.success) {
                toast.success('Test mesajı başarıyla gönderildi! Lütfen belirttiğiniz numarayı kontrol edin.')
            } else {
                toast.error(res.error || 'Test mesajı gönderilemedi.')
            }
        } catch (e: any) {
            toast.error('Hata: ' + e.message)
        } finally {
            setIsTesting(false)
        }
    }

    return (
        <div className="space-y-6">
            <Card className="border-slate-200">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <MessageSquare className="h-5 w-5 text-blue-600" />
                                SMS Gateway Ayarları
                            </CardTitle>
                            <CardDescription>
                                Tercih ettiğiniz SMS altyapısını kullanarak müşterilerinize otomatik bildirimler gönderebilirsiniz.
                            </CardDescription>
                        </div>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-medium">
                            {smsProvider === 'postaguvercini' ? 'Posta Güvercini Aktif' : smsProvider === 'postaguvercini_otp' ? 'Posta Güvercini OTP Aktif' : 'Poli Dijital Aktif'}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <form
                        action={async (formData) => {
                            setIsPending(true)
                            try {
                                const res = await updateSmsSettings(formData)
                                if (res?.error) {
                                    toast.error(res.error)
                                } else {
                                    toast.success('SMS ayarları başarıyla güncellendi.')
                                }
                            } catch (e: any) {
                                toast.error('Hata: ' + e.message)
                            } finally {
                                setIsPending(false)
                            }
                        }}
                        className="space-y-6"
                    >
                        <input type="hidden" name="sms_provider" value={smsProvider} />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* User Credentials */}
                            <div className="space-y-4 pt-2">
                                <div className="space-y-2">
                                    <Label htmlFor="sms_provider_select">SMS Servis Sağlayıcı</Label>
                                    <Select value={smsProvider} onValueChange={handleProviderChange}>
                                        <SelectTrigger id="sms_provider_select" className="w-full">
                                            <SelectValue placeholder="Sağlayıcı seçiniz" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="polidijital">Poli Dijital</SelectItem>
                                            <SelectItem value="postaguvercini">Posta Güvercini (Bulk)</SelectItem>
                                            <SelectItem value="postaguvercini_otp">Posta Güvercini (OTP)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="sms_api_user">API Kullanıcı Adı</Label>
                                    <Input
                                        id="sms_api_user"
                                        name="sms_api_user"
                                        value={smsApiUser}
                                        onChange={(e) => setSmsApiUser(e.target.value)}
                                        placeholder="Kullanıcı adınız..."
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="sms_api_password">API Şifresi</Label>
                                    <Input
                                        id="sms_api_password"
                                        name="sms_api_password"
                                        type="password"
                                        value={smsApiPassword}
                                        onChange={(e) => setSmsApiPassword(e.target.value)}
                                        placeholder="Şifreniz..."
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="sms_sender_id">Mesaj Başlığı (Sender ID)</Label>
                                    <Input
                                        id="sms_sender_id"
                                        name="sms_sender_id"
                                        value={smsSenderId}
                                        onChange={(e) => setSmsSenderId(e.target.value)}
                                        placeholder="Örn: NOVOEMLAK"
                                        required
                                    />
                                    <p className="text-[10px] text-muted-foreground italic">
                                        Operatör tarafından onaylanmış başlığınızı giriniz.
                                    </p>
                                </div>
                            </div>

                            {/* Status & Options */}
                            <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 flex flex-col justify-between">
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-base">SMS Servisi</Label>
                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                Tüm sistem bildirimleri ve aktivasyonlar için SMS gönderimini açın.
                                            </p>
                                        </div>
                                        <Switch
                                            name="is_sms_notifications_enabled"
                                            defaultChecked={tenant.is_sms_notifications_enabled}
                                        />
                                    </div>

                                    <div className="p-4 bg-white rounded-xl border border-blue-100/50 space-y-2">
                                        <div className="flex items-center gap-2 text-blue-700 text-sm font-medium">
                                            <ShieldCheck className="h-4 w-4" />
                                            Entegrasyon Bilgisi
                                        </div>
                                        <p className="text-xs text-slate-500 leading-relaxed">
                                            {smsProvider === 'postaguvercini' || smsProvider === 'postaguvercini_otp'
                                                ? 'Bilgileriniz doğrudan Posta Güvercini REST API sunucuları ile HTTPS protokolü üzerinden şifreli olarak iletilir. Verileriniz CRM güvenliği altındadır.'
                                                : 'Bilgileriniz doğrudan Poli Dijital sunucuları ile 9588 portu üzerinden şifreli (SSL) olarak iletilir. Verileriniz CRM güvenliği altındadır.'}
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-4 space-y-3">
                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="test_phone" className="text-xs text-slate-500">Test Numarası</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="test_phone"
                                                value={testPhone}
                                                onChange={(e) => setTestPhone(e.target.value)}
                                                placeholder="5xx..."
                                                className="h-9 text-sm"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={handleTestSms}
                                                disabled={isTesting || isPending}
                                                className="border-blue-200 text-blue-700 hover:bg-blue-50 whitespace-nowrap h-9"
                                            >
                                                {isTesting ? (
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                ) : (
                                                    <Send className="h-3.5 w-3.5 mr-2" />
                                                )}
                                                {isTesting ? '...' : 'Gönder'}
                                            </Button>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground italic">
                                        Boş bırakılırsa profil numaranız kullanılır.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t flex justify-end">
                            <Button
                                type="submit"
                                disabled={isPending}
                                className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]"
                            >
                                {isPending ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4 mr-2" />
                                )}
                                {isPending ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
