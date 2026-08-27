'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Headphones, Save, Loader2, Eye, EyeOff, CheckCircle2, XCircle, Server } from 'lucide-react'
import { toast } from 'sonner'
import { updateCdrSettings } from '../actions'

interface CdrSettingsTabProps {
    tenant: {
        id: string
        netgsm_cdr_usercode?: string | null
        netgsm_cdr_password?: string | null
    }
}

export default function CdrSettingsTab({ tenant }: CdrSettingsTabProps) {
    const [isPending, setIsPending] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [testingCdr, setTestingCdr] = useState(false)
    const [cdrTestResult, setCdrTestResult] = useState<{ success: boolean; message: string } | null>(null)

    const hasConfig = !!(tenant.netgsm_cdr_usercode && tenant.netgsm_cdr_password)

    // Test CDR API connection
    const handleTestCdr = async () => {
        setTestingCdr(true)
        setCdrTestResult(null)
        try {
            const res = await fetch(`/api/netgsm-cdr?phone=5550000000&days=1`)
            const data = await res.json()
            if (!res.ok) {
                setCdrTestResult({ success: false, message: data.error || 'Bağlantı hatası' })
            } else {
                setCdrTestResult({
                    success: true,
                    message: `Bağlantı başarılı! API yanıt verdi.`
                })
            }
        } catch (err: any) {
            setCdrTestResult({ success: false, message: err.message || 'Bağlantı kurulamadı' })
        } finally {
            setTestingCdr(false)
        }
    }

    return (
        <div className="space-y-6">
            <Card className="border-slate-200">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <Headphones className="h-5 w-5 text-indigo-600" />
                                Arama Kayıtları (CDR) Ayarları
                            </CardTitle>
                            <CardDescription>
                                Netgsm Netsantral arama kayıtlarını dinleme — Temsilci takip ekranından müşteri aramalarını dinleyebilirsiniz.
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
                            setCdrTestResult(null)
                            try {
                                const res = await updateCdrSettings(formData) as any
                                if (res?.error) {
                                    toast.error(res.error)
                                } else {
                                    toast.success('CDR ayarları başarıyla güncellendi.')
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
                            {/* CDR Credentials */}
                            <div className="space-y-4 pt-2">
                                <div className="space-y-2">
                                    <Label htmlFor="netgsm_cdr_usercode">API Alt Kullanıcı Adı (Usercode)</Label>
                                    <Input
                                        id="netgsm_cdr_usercode"
                                        name="netgsm_cdr_usercode"
                                        defaultValue={tenant.netgsm_cdr_usercode || ''}
                                        placeholder="Örn: 2129099559"
                                    />
                                    <p className="text-[10px] text-slate-400">
                                        Netgsm panelinden alınan API alt kullanıcı adı
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="netgsm_cdr_password">API Alt Kullanıcı Şifresi (Password)</Label>
                                    <div className="relative">
                                        <Input
                                            id="netgsm_cdr_password"
                                            name="netgsm_cdr_password"
                                            type={showPassword ? 'text' : 'password'}
                                            defaultValue={tenant.netgsm_cdr_password || ''}
                                            placeholder="API şifreniz..."
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
                            </div>

                            {/* Info Panel */}
                            <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 flex flex-col justify-between">
                                <div className="space-y-4">
                                    <div className="p-4 bg-white rounded-xl border border-indigo-100/50 space-y-2">
                                        <div className="flex items-center gap-2 text-indigo-700 text-sm font-medium">
                                            <Server className="h-4 w-4" />
                                            CDR API Bilgileri
                                        </div>
                                        <div className="text-xs text-slate-600 space-y-1.5">
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">API Endpoint:</span>
                                                <span className="font-mono font-medium text-[11px]">api.netgsm.com.tr/netsantral/report</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">Kayıt Türü:</span>
                                                <span className="font-medium">Gelen + Giden Aramalar</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">Ses Kaydı:</span>
                                                <span className="font-medium">Varsa dinlenebilir</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-white rounded-xl border border-violet-100/50 space-y-2">
                                        <div className="flex items-center gap-2 text-violet-700 text-sm font-medium">
                                            <Headphones className="h-4 w-4" />
                                            Nasıl Kullanılır?
                                        </div>
                                        <p className="text-xs text-slate-500 leading-relaxed">
                                            CRM → Temsilci Takip ekranında her müşterinin telefon numarasının yanındaki 🎧 ikonuna tıklayarak arama kayıtlarını dinleyebilirsiniz.
                                            AI destekli transkript ve duygu analizi de yapılabilir.
                                        </p>
                                    </div>

                                    {/* Test Connection Button */}
                                    {hasConfig && (
                                        <div className="p-4 bg-white rounded-xl border border-slate-100 space-y-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="w-full h-8 text-xs gap-1.5 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                                                disabled={testingCdr}
                                                onClick={handleTestCdr}
                                            >
                                                {testingCdr ? (
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : (
                                                    <Headphones className="h-3 w-3" />
                                                )}
                                                {testingCdr ? 'Test Ediliyor...' : 'CDR Bağlantısını Test Et'}
                                            </Button>
                                            {cdrTestResult && (
                                                <div className={`flex items-start gap-1.5 text-[11px] ${cdrTestResult.success ? 'text-emerald-600' : 'text-red-500'}`}>
                                                    {cdrTestResult.success ? (
                                                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                                    ) : (
                                                        <XCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                                    )}
                                                    <span>{cdrTestResult.message}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t flex justify-end">
                            <Button
                                type="submit"
                                disabled={isPending}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[140px]"
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
