'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { updateNotificationSettings } from '@/app/[locale]/(dashboard)/notifications/actions'
import { Bell, Mail, MessageSquare, RefreshCw, Zap } from 'lucide-react'

interface NotificationSettingsTabProps {
    settings: any
}

export default function NotificationSettingsTab({ settings }: NotificationSettingsTabProps) {
    const [loading, setLoading] = useState(false)
    const [scanning, setScanning] = useState(false)
    const [formData, setFormData] = useState({
        sms_provider: settings?.sms_provider || 'netgsm',
        sms_api_key: settings?.sms_api_key || '',
        sms_api_secret: settings?.sms_api_secret || '',
        sms_header: settings?.sms_header || '',
        email_enabled: settings?.email_enabled ?? true,
        sms_enabled: settings?.sms_enabled ?? false,
        notify_overdue_payments: settings?.notify_overdue_payments ?? true,
        notify_approaching_checks: settings?.notify_approaching_checks ?? true,
        notify_new_leads: settings?.notify_new_leads ?? true
    })

    const handleSave = async () => {
        setLoading(true)
        const res = await updateNotificationSettings(formData)
        setLoading(false)

        if (res.success) {
            toast.success('Bildirim ayarları güncellendi.')
        } else {
            toast.error(res.error || 'Ayarlar kaydedilemedi.')
        }
    }

    const handleManualScan = async () => {
        setScanning(true)
        try {
            const res = await fetch('/api/notifications/scan')
            const data = await res.json()
            if (data.success) {
                const total = (data.expiringReservations || 0) + (data.overduePayments || 0) + (data.approachingPapers || 0) + (data.staleLeads || 0) + (data.newEmails || 0)
                if (total > 0) {
                    toast.success(`Tarama tamamlandı: ${total} yeni bildirim oluşturuldu.`)
                } else {
                    toast.info('Tarama tamamlandı: Yeni bildirim bulunmadı.')
                }
            } else {
                toast.error('Tarama sırasında bir hata oluştu.')
            }
        } catch {
            toast.error('Tarama servisine ulaşılamadı.')
        } finally {
            setScanning(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                {/* 1. Channel Configuration */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-blue-600" />
                            SMS Entegrasyonu
                        </CardTitle>
                        <CardDescription>
                            SMS gönderimi için servis sağlayıcı bilgilerinizi giriniz.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="sms_enabled">SMS Gönderimi Aktif</Label>
                            <Switch
                                id="sms_enabled"
                                checked={formData.sms_enabled}
                                onCheckedChange={(val) => setFormData({ ...formData, sms_enabled: val })}
                            />
                        </div>

                        {formData.sms_enabled && (
                            <>
                                <div className="grid gap-2">
                                    <Label>Servis Sağlayıcı</Label>
                                    <Select
                                        value={formData.sms_provider}
                                        onValueChange={(val) => setFormData({ ...formData, sms_provider: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="netgsm">Netgsm</SelectItem>
                                            <SelectItem value="iletimerkezi">İleti Merkezi</SelectItem>
                                            <SelectItem value="vatansms">VatanSMS</SelectItem>
                                            <SelectItem value="twilio">Twilio</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Başlık (Sender ID)</Label>
                                    <Input
                                        placeholder="Orn: NOVO"
                                        value={formData.sms_header}
                                        onChange={(e) => setFormData({ ...formData, sms_header: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>API Key / Kullanıcı Adı</Label>
                                    <Input
                                        type="password"
                                        value={formData.sms_api_key}
                                        onChange={(e) => setFormData({ ...formData, sms_api_key: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>API Secret / Şifre</Label>
                                    <Input
                                        type="password"
                                        value={formData.sms_api_secret}
                                        onChange={(e) => setFormData({ ...formData, sms_api_secret: e.target.value })}
                                    />
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* 2. Notification Preferences */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5 text-orange-600" />
                            Otomatik Hatırlatmalar
                        </CardTitle>
                        <CardDescription>
                            Sistemin otomatik oluşturacağı uyarıları seçiniz.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Gecikmiş Ödemeler</Label>
                                <p className="text-xs text-muted-foreground">Vadesi geçen ödemeler için müşteriye ve size bildirim gönderir.</p>
                            </div>
                            <Switch
                                checked={formData.notify_overdue_payments}
                                onCheckedChange={(val) => setFormData({ ...formData, notify_overdue_payments: val })}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Yaklaşan Çek/Senetler</Label>
                                <p className="text-xs text-muted-foreground">Vadesine 3 gün kalan evraklar için uyarı oluşturur.</p>
                            </div>
                            <Switch
                                checked={formData.notify_approaching_checks}
                                onCheckedChange={(val) => setFormData({ ...formData, notify_approaching_checks: val })}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Yeni Web Form Talepleri</Label>
                                <p className="text-xs text-muted-foreground">Web sitesinden gelen yeni formlarda bildirim gönderir.</p>
                            </div>
                            <Switch
                                checked={formData.notify_new_leads}
                                onCheckedChange={(val) => setFormData({ ...formData, notify_new_leads: val })}
                            />
                        </div>
                        <div className="pt-4 border-t">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="flex items-center gap-2">
                                        <Mail className="h-4 w-4" />
                                        E-posta Bildirimleri
                                    </Label>
                                    <p className="text-xs text-muted-foreground">SMS kapalıysa veya başarısız olursa E-posta kullan.</p>
                                </div>
                                <Switch
                                    checked={formData.email_enabled}
                                    onCheckedChange={(val) => setFormData({ ...formData, email_enabled: val })}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 3. Manual Scan */}
            <Card className="border-amber-100 bg-gradient-to-r from-amber-50/50 to-white">
                <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5">
                    <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-amber-100 flex-shrink-0">
                            <Zap className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="font-semibold text-sm text-slate-800">Manuel Tarama</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Gecikmiş ödemeler, süresi dolan opsiyonlar, yaklaşan çek/senet vadeleri ve
                                hareketsiz lead&apos;leri şimdi tarayarak bildirim oluşturur.
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={handleManualScan}
                        disabled={scanning}
                        variant="outline"
                        className="gap-2 text-amber-700 border-amber-300 hover:bg-amber-100 min-w-[160px]"
                    >
                        <RefreshCw className={`h-4 w-4 ${scanning ? 'animate-spin' : ''}`} />
                        {scanning ? 'Taranıyor...' : 'Şimdi Tara'}
                    </Button>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-700 min-w-[200px]">
                    {loading ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
                </Button>
            </div>
        </div>
    )
}
