'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, ArrowUpCircle, Bell, CheckCircle2, Loader2, MessageSquare, Rocket, Target, Trophy, Users } from 'lucide-react'
import { upgradeCrmMode, updateLeadNotificationMode, updateWaLeadAssignmentNotification } from '../crm-mode-actions'

interface CrmModeTabProps {
    currentMode: 'basic' | 'advance'
    userRole: string
    leadNotificationMode?: 'immediate' | 'on_conversion'
    waLeadAssignmentNotificationEnabled?: boolean
    leadAssignmentMode?: 'manual' | 'round_robin'
}

export default function CrmModeTab({ 
    currentMode, 
    userRole, 
    leadNotificationMode = 'immediate',
    waLeadAssignmentNotificationEnabled = false,
    leadAssignmentMode = 'manual'
}: CrmModeTabProps) {
    const [isUpgrading, setIsUpgrading] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [result, setResult] = useState<{ success: boolean; error?: string; migratedLeadCount?: number } | null>(null)
    
    // Hoş geldin bildirim modu
    const [notifMode, setNotifMode] = useState<'immediate' | 'on_conversion'>(leadNotificationMode)
    const [isPendingNotif, startNotifTransition] = useTransition()
    const [notifSaved, setNotifSaved] = useState(false)

    // Aday atama modu
    const [assignMode, setAssignMode] = useState<'manual' | 'round_robin'>(leadAssignmentMode)
    const [isPendingAssignMode, startAssignModeTransition] = useTransition()
    const [assignModeSaved, setAssignModeSaved] = useState(false)

    // Aday atama bildirimi
    const [waLeadAssignNotif, setWaLeadAssignNotif] = useState<boolean>(waLeadAssignmentNotificationEnabled)
    const [isPendingAssignNotif, startAssignNotifTransition] = useTransition()
    const [assignNotifSaved, setAssignNotifSaved] = useState(false)

    const handleAssignModeChange = (mode: 'manual' | 'round_robin') => {
        setAssignMode(mode)
        setAssignModeSaved(false)
        startAssignModeTransition(async () => {
            const { updateLeadAssignmentMode } = await import('../crm-mode-actions')
            const res = await updateLeadAssignmentMode(mode)
            if (res.success) setAssignModeSaved(true)
        })
    }

    const handleNotifModeChange = (mode: 'immediate' | 'on_conversion') => {
        setNotifMode(mode)
        setNotifSaved(false)
        startNotifTransition(async () => {
            const res = await updateLeadNotificationMode(mode)
            if (res.success) setNotifSaved(true)
        })
    }

    const handleAssignNotifChange = (enabled: boolean) => {
        setWaLeadAssignNotif(enabled)
        setAssignNotifSaved(false)
        startAssignNotifTransition(async () => {
            const res = await updateWaLeadAssignmentNotification(enabled)
            if (res.success) setAssignNotifSaved(true)
        })
    }

    const canUpgrade = (userRole === 'owner' || userRole === 'admin') && currentMode === 'basic'

    const handleUpgrade = async () => {
        setIsUpgrading(true)
        try {
            const res = await upgradeCrmMode()
            setResult(res)
            if (res.success) {
                setShowConfirm(false)
                // Sayfayı yenile ki sidebar güncellensin
                setTimeout(() => window.location.reload(), 2000)
            }
        } catch (err: any) {
            setResult({ success: false, error: err.message })
        } finally {
            setIsUpgrading(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Mevcut Mod Göstergesi */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">CRM Çalışma Modu</CardTitle>
                            <CardDescription>
                                Firmanızın CRM süreç derinliğini belirleyin
                            </CardDescription>
                        </div>
                        <Badge 
                            variant={currentMode === 'advance' ? 'default' : 'secondary'}
                            className={currentMode === 'advance' 
                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200 text-sm px-3 py-1' 
                                : 'text-sm px-3 py-1'
                            }
                        >
                            {currentMode === 'advance' ? '✓ Gelişmiş CRM' : 'Temel CRM'}
                        </Badge>
                    </div>
                </CardHeader>
            </Card>

            {/* Karşılaştırma */}
            <div className="grid md:grid-cols-2 gap-4">
                {/* Basic */}
                <Card className={currentMode === 'basic' ? 'ring-2 ring-blue-500/30' : 'opacity-60'}>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Users className="h-5 w-5 text-blue-500" />
                            Temel CRM (Basic)
                            {currentMode === 'basic' && (
                                <Badge variant="outline" className="ml-auto text-xs">Aktif</Badge>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground space-y-2">
                        <p>✓ Müşteri kaydı ve takibi</p>
                        <p>✓ Satış pipeline (Lead → Satış)</p>
                        <p>✓ Gelen lead&apos;ler doğrudan müşteri olarak kayıt</p>
                        <p>✓ Aktivite ve görev yönetimi</p>
                        <p className="text-xs text-muted-foreground/60 mt-4">
                            Küçük ve orta ölçekli firmalar için idealdir.
                        </p>
                    </CardContent>
                </Card>

                {/* Advance */}
                <Card className={currentMode === 'advance' ? 'ring-2 ring-emerald-500/30' : 'border-dashed'}>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Rocket className="h-5 w-5 text-emerald-500" />
                            Gelişmiş CRM (Advance)
                            {currentMode === 'advance' && (
                                <Badge variant="outline" className="ml-auto text-xs border-emerald-300 text-emerald-600">Aktif</Badge>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground space-y-2">
                        <p>✓ Temel CRM&apos;in tüm özellikleri</p>
                        <p className="text-emerald-600 font-medium">
                            <Target className="h-3.5 w-3.5 inline mr-1" />
                            Müşteri Adayları (Leads) — ayrı modül
                        </p>
                        <p className="text-emerald-600 font-medium">
                            <Trophy className="h-3.5 w-3.5 inline mr-1" />
                            Fırsatlar (Opportunities) — satış hunisi
                        </p>
                        <p>✓ Lead → Müşteri dönüştürme akışı</p>
                        <p>✓ Çoklu para birimi desteği (TRY, USD, EUR, GBP)</p>
                        <p>✓ Özelleştirilebilir pipeline aşamaları</p>
                        <p className="text-xs text-muted-foreground/60 mt-4">
                            Büyüyen ve kurumsal firmalar için önerilir.
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Yükseltme Aksiyonu */}
            {currentMode === 'basic' && (
                <Card>
                    <CardContent className="pt-6">
                        {!showConfirm ? (
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Gelişmiş CRM&apos;e yükseltmek ister misiniz?</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Mevcut verileriniz korunur. Ek modüller aktif hale gelir.
                                    </p>
                                </div>
                                <Button 
                                    onClick={() => setShowConfirm(true)} 
                                    disabled={!canUpgrade}
                                    className="bg-emerald-600 hover:bg-emerald-700"
                                >
                                    <ArrowUpCircle className="h-4 w-4 mr-2" />
                                    Yükselt
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold text-amber-800">Bu işlem geri alınamaz!</p>
                                        <p className="text-sm text-amber-700 mt-1">
                                            Advance CRM moduna geçtikten sonra Basic moda geri dönemezsiniz.
                                            Mevcut müşteri verileriniz korunacak ve reklam kaynaklı kayıtlar 
                                            &quot;Müşteri Adayları&quot; modülüne otomatik olarak taşınacaktır.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 justify-end">
                                    <Button 
                                        variant="outline" 
                                        onClick={() => setShowConfirm(false)}
                                        disabled={isUpgrading}
                                    >
                                        Vazgeç
                                    </Button>
                                    <Button 
                                        onClick={handleUpgrade}
                                        disabled={isUpgrading}
                                        className="bg-emerald-600 hover:bg-emerald-700"
                                    >
                                        {isUpgrading ? (
                                            <>
                                                <span className="animate-spin mr-2">⏳</span>
                                                Yükseltiliyor...
                                            </>
                                        ) : (
                                            <>
                                                <Rocket className="h-4 w-4 mr-2" />
                                                Evet, Advance Moda Geç
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Sonuç Mesajı */}
            {result && (
                <Card className={result.success ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}>
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            {result.success ? (
                                <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
                            ) : (
                                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                            )}
                            <div>
                                <p className={`font-medium ${result.success ? 'text-emerald-800' : 'text-red-800'}`}>
                                    {result.success 
                                        ? 'Gelişmiş CRM modu aktif edildi!' 
                                        : 'Yükseltme başarısız oldu'
                                    }
                                </p>
                                {result.success && result.migratedLeadCount !== undefined && (
                                    <p className="text-sm text-emerald-700 mt-1">
                                        {result.migratedLeadCount} geçmiş lead kaydı migre edildi. Sayfa yenileniyor...
                                    </p>
                                )}
                                {result.error && (
                                    <p className="text-sm text-red-700 mt-1">{result.error}</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Lead Bildirim Modu — Advance modda göster */}
            {currentMode === 'advance' && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Bell className="h-4 w-4 text-orange-500" />
                            Lead Bildirim Zamanlaması
                        </CardTitle>
                        <CardDescription>
                            Yeni lead geldiğinde WhatsApp hoş geldin mesajı ne zaman gönderilsin?
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid gap-3">
                            {/* Hemen Gönder */}
                            <button
                                type="button"
                                onClick={() => handleNotifModeChange('immediate')}
                                disabled={isPendingNotif}
                                className={`flex items-start gap-3 p-3 rounded-lg border-2 text-left transition-all ${
                                    notifMode === 'immediate'
                                        ? 'border-emerald-500 bg-emerald-50/50'
                                        : 'border-border hover:border-muted-foreground/30'
                                }`}
                            >
                                <div className={`mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                    notifMode === 'immediate' ? 'border-emerald-500' : 'border-muted-foreground/40'
                                }`}>
                                    {notifMode === 'immediate' && <div className="h-2 w-2 rounded-full bg-emerald-500" />}
                                </div>
                                <div>
                                    <p className="font-medium text-sm flex items-center gap-1.5">
                                        <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                                        Lead Oluştuğu Anda Gönder
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Webhook&apos;tan gelen lead anında WhatsApp mesajı alır. &quot;Sıcak lead&quot; prensibi — soğumadan iletişim.
                                    </p>
                                </div>
                            </button>

                            {/* Dönüştürme Sonrası */}
                            <button
                                type="button"
                                onClick={() => handleNotifModeChange('on_conversion')}
                                disabled={isPendingNotif}
                                className={`flex items-start gap-3 p-3 rounded-lg border-2 text-left transition-all ${
                                    notifMode === 'on_conversion'
                                        ? 'border-blue-500 bg-blue-50/50'
                                        : 'border-border hover:border-muted-foreground/30'
                                }`}
                            >
                                <div className={`mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                    notifMode === 'on_conversion' ? 'border-blue-500' : 'border-muted-foreground/40'
                                }`}>
                                    {notifMode === 'on_conversion' && <div className="h-2 w-2 rounded-full bg-blue-500" />}
                                </div>
                                <div>
                                    <p className="font-medium text-sm flex items-center gap-1.5">
                                        <Target className="h-3.5 w-3.5 text-blue-600" />
                                        Müşteriye Dönüştürüldüğünde Gönder
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Önce lead niteliklendirilir, dönüştürüldükten sonra WhatsApp gider. Daha kontrollü süreç.
                                    </p>
                                </div>
                            </button>
                        </div>

                        {/* Kayıt durumu */}
                        <div className="flex items-center gap-2 h-5">
                            {isPendingNotif && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Loader2 className="h-3 w-3 animate-spin" /> Kaydediliyor...
                                </span>
                            )}
                            {notifSaved && !isPendingNotif && (
                                <span className="text-xs text-emerald-600 flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" /> Kaydedildi
                                </span>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Otomatik Aday Dağıtımı — Advance modda göster */}
            {currentMode === 'advance' && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-500" />
                            Otomatik Aday Dağıtımı
                        </CardTitle>
                        <CardDescription>
                            Yeni gelen müşteri adayları (leads) satış ekibine nasıl atansın?
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid gap-3">
                            {/* Manuel */}
                            <button
                                type="button"
                                onClick={() => handleAssignModeChange('manual')}
                                disabled={isPendingAssignMode}
                                className={`flex items-start gap-3 p-3 rounded-lg border-2 text-left transition-all ${
                                    assignMode === 'manual'
                                        ? 'border-slate-500 bg-slate-50/50'
                                        : 'border-border hover:border-muted-foreground/30'
                                }`}
                            >
                                <div className={`mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                    assignMode === 'manual' ? 'border-slate-500' : 'border-muted-foreground/40'
                                }`}>
                                    {assignMode === 'manual' && <div className="h-2 w-2 rounded-full bg-slate-500" />}
                                </div>
                                <div>
                                    <p className="font-medium text-sm flex items-center gap-1.5">
                                        Manuel Atama (Auto-Assign Yok)
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Yeni adaylar herhangi bir temsilciye atanmaz. CRM yöneticisi adayları elle yönlendirir.
                                    </p>
                                </div>
                            </button>

                            {/* Round Robin */}
                            <button
                                type="button"
                                onClick={() => handleAssignModeChange('round_robin')}
                                disabled={isPendingAssignMode}
                                className={`flex items-start gap-3 p-3 rounded-lg border-2 text-left transition-all ${
                                    assignMode === 'round_robin'
                                        ? 'border-emerald-500 bg-emerald-50/50'
                                        : 'border-border hover:border-muted-foreground/30'
                                }`}
                            >
                                <div className={`mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                    assignMode === 'round_robin' ? 'border-emerald-500' : 'border-muted-foreground/40'
                                }`}>
                                    {assignMode === 'round_robin' && <div className="h-2 w-2 rounded-full bg-emerald-500" />}
                                </div>
                                <div>
                                    <p className="font-medium text-sm flex items-center gap-1.5">
                                        Sırayla Dağıtım (Round-Robin)
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Yeni adaylar, aktif tüm satış danışmanlarına eşit ve sırayla otomatik olarak atanır.
                                    </p>
                                </div>
                            </button>
                        </div>

                        {/* Kayıt durumu */}
                        <div className="flex items-center gap-2 h-5">
                            {isPendingAssignMode && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Loader2 className="h-3 w-3 animate-spin" /> Kaydediliyor...
                                </span>
                            )}
                            {assignModeSaved && !isPendingAssignMode && (
                                <span className="text-xs text-emerald-600 flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" /> Kaydedildi
                                </span>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Aday Atama Bildirimi — Advance modda göster */}
            {currentMode === 'advance' && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Users className="h-4 w-4 text-indigo-500" />
                            Aday Atama Bildirimi
                        </CardTitle>
                        <CardDescription>
                            Bir temsilciye müşteri adayı (lead) atandığında, temsilciye WhatsApp ile bildirim gönderilsin mi?
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid gap-3">
                            {/* Gönder */}
                            <button
                                type="button"
                                onClick={() => handleAssignNotifChange(true)}
                                disabled={isPendingAssignNotif}
                                className={`flex items-start gap-3 p-3 rounded-lg border-2 text-left transition-all ${
                                    waLeadAssignNotif === true
                                        ? 'border-emerald-500 bg-emerald-50/50'
                                        : 'border-border hover:border-muted-foreground/30'
                                }`}
                            >
                                <div className={`mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                    waLeadAssignNotif === true ? 'border-emerald-500' : 'border-muted-foreground/40'
                                }`}>
                                    {waLeadAssignNotif === true && <div className="h-2 w-2 rounded-full bg-emerald-500" />}
                                </div>
                                <div>
                                    <p className="font-medium text-sm flex items-center gap-1.5">
                                        <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                                        WhatsApp Bildirimi Gönder
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Temsilciye atanan adayın ismi, telefonu ve atama bilgisi WhatsApp şablon mesajı olarak anında iletilir.
                                    </p>
                                </div>
                            </button>

                            {/* Gönderme */}
                            <button
                                type="button"
                                onClick={() => handleAssignNotifChange(false)}
                                disabled={isPendingAssignNotif}
                                className={`flex items-start gap-3 p-3 rounded-lg border-2 text-left transition-all ${
                                    waLeadAssignNotif === false
                                        ? 'border-slate-500 bg-slate-50/50'
                                        : 'border-border hover:border-muted-foreground/30'
                                }`}
                            >
                                <div className={`mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                    waLeadAssignNotif === false ? 'border-slate-500' : 'border-muted-foreground/40'
                                }`}>
                                    {waLeadAssignNotif === false && <div className="h-2 w-2 rounded-full bg-slate-500" />}
                                </div>
                                <div>
                                    <p className="font-medium text-sm flex items-center gap-1.5">
                                        <Bell className="h-3.5 w-3.5 text-slate-500" />
                                        Sadece Uygulama İçi Bildirim Gönder (WhatsApp Gönderme)
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Temsilciye sadece web uygulaması içi bildirim zili aracılığıyla bildirim gider, WhatsApp gönderilmez.
                                    </p>
                                </div>
                            </button>
                        </div>

                        {/* Kayıt durumu */}
                        <div className="flex items-center gap-2 h-5">
                            {isPendingAssignNotif && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Loader2 className="h-3 w-3 animate-spin" /> Kaydediliyor...
                                </span>
                            )}
                            {assignNotifSaved && !isPendingAssignNotif && (
                                <span className="text-xs text-emerald-600 flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" /> Kaydedildi
                                </span>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Advance Mod Aktifse Bilgi */}
            {currentMode === 'advance' && (
                <Card className="border-emerald-200 bg-emerald-50/50">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
                            <div>
                                <p className="font-medium text-emerald-800">Gelişmiş CRM modu aktif</p>
                                <p className="text-sm text-emerald-700 mt-1">
                                    Sidebar menüsünde &quot;Müşteri Adayları&quot; ve &quot;Fırsatlar&quot; modülleri kullanılabilir durumda.
                                    Pipeline aşamalarını ayarlardan özelleştirebilirsiniz.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
