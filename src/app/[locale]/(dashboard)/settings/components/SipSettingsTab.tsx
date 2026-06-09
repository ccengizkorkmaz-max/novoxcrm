'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Phone, Server, Shield, Save, Loader2, Eye, EyeOff, Info } from 'lucide-react'
import { toast } from 'sonner'
import { updateSipSettings } from '../actions'

interface SipSettingsTabProps {
    tenant: {
        id: string
        netgsm_sip_username?: string | null
        netgsm_sip_password?: string | null
        ai_outreach_settings?: Record<string, any> | null
    }
}

export default function SipSettingsTab({ tenant }: SipSettingsTabProps) {
    const [isPending, setIsPending] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const hasConfig = !!(tenant.netgsm_sip_username && tenant.netgsm_sip_password)
    const currentMaxCalls = tenant.ai_outreach_settings?.max_concurrent_calls || 8

    // Derive DID (phone number) from username: 2129099559 → 0212 909 95 59
    const formatDID = (username: string) => {
        if (!username || username.length < 10) return username
        // Format: 0212 909 95 59
        const digits = username.replace(/\D/g, '')
        if (digits.length === 10) {
            return `0${digits.substring(0, 3)} ${digits.substring(3, 6)} ${digits.substring(6, 8)} ${digits.substring(8, 10)}`
        }
        return username
    }

    return (
        <div className="space-y-6">
            <Card className="border-slate-200">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <Phone className="h-5 w-5 text-emerald-600" />
                                SIP Trunk Ayarları
                            </CardTitle>
                            <CardDescription>
                                Netgsm SIP bağlantı bilgileri — AI sesli arama sistemi (Vapi) bu bilgileri kullanır.
                            </CardDescription>
                        </div>
                        <Badge
                            variant="outline"
                            className={hasConfig
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 font-medium"
                                : "bg-amber-50 text-amber-700 border-amber-200 font-medium"
                            }
                        >
                            {hasConfig ? '✓ Yapılandırılmış' : '○ Yapılandırılmamış'}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <form
                        action={async (formData) => {
                            setIsPending(true)
                            try {
                                const res = await updateSipSettings(formData) as any
                                if (res?.error) {
                                    toast.error(res.error)
                                } else {
                                    toast.success('SIP ayarları başarıyla güncellendi.')
                                }
                            } catch (e: any) {
                                toast.error('Hata: ' + e.message)
                            } finally {
                                setIsPending(false)
                            }
                        }}
                        className="space-y-6"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* SIP Credentials */}
                            <div className="space-y-4 pt-2">
                                <div className="space-y-2">
                                    <Label htmlFor="netgsm_sip_username">SIP Kullanıcı Adı / DID</Label>
                                    <Input
                                        id="netgsm_sip_username"
                                        name="netgsm_sip_username"
                                        defaultValue={tenant.netgsm_sip_username || ''}
                                        placeholder="Örn: 2129099559"
                                    />
                                    {tenant.netgsm_sip_username && (
                                        <p className="text-[10px] text-emerald-600 font-medium">
                                            📞 Numara: {formatDID(tenant.netgsm_sip_username)}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="netgsm_sip_password">SIP Şifresi</Label>
                                    <div className="relative">
                                        <Input
                                            id="netgsm_sip_password"
                                            name="netgsm_sip_password"
                                            type={showPassword ? 'text' : 'password'}
                                            defaultValue={tenant.netgsm_sip_password || ''}
                                            placeholder="SIP şifreniz..."
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                            {/* Concurrent Calls Limit */}
                            <div className="space-y-4 pt-2">
                                <div className="space-y-2">
                                    <Label htmlFor="max_concurrent_calls" className="flex items-center gap-2">
                                        Eş Zamanlı Arama Limiti
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Info className="h-3.5 w-3.5 text-slate-400 cursor-help" />
                                                </TooltipTrigger>
                                                <TooltipContent className="max-w-xs">
                                                    <p>Outreach workflow&apos;larının aynı anda kaç arama yapabileceğini belirler. Gelen aramalar için 2 slot boş bırakılması önerilir. Vapi planınız max 10 eş zamanlı arama destekler.</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </Label>
                                    <div className="flex items-center gap-3">
                                        <Input
                                            id="max_concurrent_calls"
                                            name="max_concurrent_calls"
                                            type="number"
                                            min={1}
                                            max={10}
                                            defaultValue={currentMaxCalls}
                                            className="w-24"
                                        />
                                        <span className="text-xs text-slate-500">/ 10 (Vapi limiti)</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400">
                                        Gelen aramalar için en az 2 slot boş bırakılması önerilir.
                                    </p>
                                </div>
                            </div>
                            </div>

                            {/* Info Panel */}
                            <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 flex flex-col justify-between">
                                <div className="space-y-4">
                                    <div className="p-4 bg-white rounded-xl border border-emerald-100/50 space-y-2">
                                        <div className="flex items-center gap-2 text-emerald-700 text-sm font-medium">
                                            <Server className="h-4 w-4" />
                                            SIP Sunucu Bilgileri
                                        </div>
                                        <div className="text-xs text-slate-600 space-y-1.5">
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">Gateway:</span>
                                                <span className="font-mono font-medium">sip.netgsm.com.tr</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">Port:</span>
                                                <span className="font-mono font-medium">5060 (UDP/TCP)</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">Protokol:</span>
                                                <span className="font-mono font-medium">SIP/2.0</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">Servis:</span>
                                                <span className="font-mono font-medium">Netgsm</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-white rounded-xl border border-blue-100/50 space-y-2">
                                        <div className="flex items-center gap-2 text-blue-700 text-sm font-medium">
                                            <Shield className="h-4 w-4" />
                                            AI Sesli Arama (Vapi) Entegrasyonu
                                        </div>
                                        <p className="text-xs text-slate-500 leading-relaxed">
                                            Giden AI aramaları bu SIP bilgileri üzerinden gerçekleştirilir.
                                            Gelen aramalar için Netgsm'den inbound SIP forwarding ayarı gerekir.
                                        </p>
                                    </div>

                                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 space-y-1.5">
                                        <div className="flex items-center gap-2 text-emerald-700 text-xs font-medium">
                                            <Phone className="h-3.5 w-3.5" />
                                            Gelen Arama Durumu
                                        </div>
                                        <p className="text-[11px] text-emerald-600 leading-relaxed">
                                            ✅ Aktif — 0212 numaranıza gelen aramalar AI asistan (Maya) tarafından karşılanıyor.
                                            Netgsm SIP → Vapi entegrasyonu çalışıyor.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t flex justify-end">
                            <Button
                                type="submit"
                                disabled={isPending}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[140px]"
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
