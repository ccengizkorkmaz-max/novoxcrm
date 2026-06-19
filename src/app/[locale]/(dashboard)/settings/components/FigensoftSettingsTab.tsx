'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Mail, Send, Phone, CreditCard, Info, Save, CheckCircle2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { updateFigensoftSettings } from '../actions'

interface FigensoftSettingsTabProps {
    tenant: {
        id: string
        figensoft_username?: string | null
        figensoft_password?: string | null
        figensoft_sender_id?: string | null
    }
}

export default function FigensoftSettingsTab({ tenant }: FigensoftSettingsTabProps) {
    const [isPending, setIsPending] = useState(false)

    const maskKey = (key?: string | null) => {
        if (!key) return null
        if (key.length <= 10) return "*******"
        return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`
    }

    const isConfigured = !!tenant.figensoft_username && !!tenant.figensoft_password

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center">
                        <Send className="h-4 w-4 text-cyan-700" />
                    </div>
                    Figensoft — Posta Güvercini
                    {isConfigured ? (
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 ml-2">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Bağlı
                        </Badge>
                    ) : (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200 ml-2">
                            <AlertTriangle className="h-3 w-3 mr-1" /> Yapılandırılmamış
                        </Badge>
                    )}
                </CardTitle>
                <CardDescription>
                    Toplu SMS, OTP SMS ve toplu e-posta gönderimleri için Figensoft / Posta Güvercini API entegrasyonunu yönetin.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form
                    action={async (formData) => {
                        setIsPending(true)
                        try {
                            const res = await updateFigensoftSettings(formData)
                            if (res?.error) {
                                toast.error(res.error)
                            } else {
                                toast.success('Figensoft ayarları başarıyla kaydedildi.')
                            }
                        } catch (e: any) {
                            toast.error('Kayıt sırasında bir hata oluştu: ' + e.message)
                        } finally {
                            setIsPending(false)
                        }
                    }}
                    className="space-y-6"
                >
                    {/* API Credentials */}
                    <div className="p-4 rounded-xl border bg-slate-50/50 space-y-4">
                        <div className="flex items-center gap-2 mb-1">
                            <Mail className="h-4 w-4 text-cyan-600" />
                            <Label className="text-base font-semibold">API Bağlantı Bilgileri</Label>
                        </div>
                        <p className="text-xs text-muted-foreground -mt-2">
                            Posta Güvercini panelinden (postaguvercini.com) veya Figensoft destek ekibinden edinebilirsiniz.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="figensoft_username" className="text-xs text-slate-500">API Kullanıcı Adı</Label>
                                <Input
                                    id="figensoft_username"
                                    name="figensoft_username"
                                    defaultValue={tenant.figensoft_username || ''}
                                    placeholder="Kullanıcı adınız"
                                    className="bg-white font-mono text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="figensoft_password" className="text-xs text-slate-500">API Şifresi</Label>
                                    {tenant.figensoft_password && (
                                        <span className="text-[10px] font-mono bg-white border px-2 py-0.5 rounded text-slate-500">
                                            {maskKey(tenant.figensoft_password)}
                                        </span>
                                    )}
                                </div>
                                <Input
                                    id="figensoft_password"
                                    name="figensoft_password"
                                    type="password"
                                    defaultValue={tenant.figensoft_password || ''}
                                    placeholder="••••••••"
                                    className="bg-white"
                                    autoComplete="off"
                                />
                            </div>
                        </div>
                    </div>

                    {/* SMS Settings */}
                    <div className="p-4 rounded-xl border bg-slate-50/50 space-y-4">
                        <div className="flex items-center gap-2 mb-1">
                            <Phone className="h-4 w-4 text-emerald-600" />
                            <Label className="text-base font-semibold">SMS Ayarları</Label>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="figensoft_sender_id" className="text-xs text-slate-500">SMS Başlığı (Originator)</Label>
                                <Input
                                    id="figensoft_sender_id"
                                    name="figensoft_sender_id"
                                    defaultValue={tenant.figensoft_sender_id || 'NOVO INSAAT'}
                                    placeholder="Örn: NOVO INSAAT"
                                    className="bg-white font-mono text-sm"
                                    maxLength={11}
                                />
                                <p className="text-[10px] text-muted-foreground">BTK onaylı alfanümerik SMS başlığınız (max 11 karakter)</p>
                            </div>
                        </div>
                    </div>

                    {/* Servis Listesi */}
                    <div className="p-4 rounded-xl border bg-cyan-50/50 space-y-3">
                        <div className="flex items-center gap-2">
                            <Info className="h-4 w-4 text-cyan-600" />
                            <Label className="text-sm font-semibold text-cyan-900">Desteklenen Servisler</Label>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="flex items-center gap-2 p-2 bg-white rounded-lg border text-sm">
                                <Phone className="h-4 w-4 text-emerald-500" />
                                <span>Toplu SMS</span>
                            </div>
                            <div className="flex items-center gap-2 p-2 bg-white rounded-lg border text-sm">
                                <Phone className="h-4 w-4 text-blue-500" />
                                <span>OTP SMS</span>
                            </div>
                            <div className="flex items-center gap-2 p-2 bg-white rounded-lg border text-sm">
                                <Mail className="h-4 w-4 text-purple-500" />
                                <span>Toplu E-Posta</span>
                            </div>
                            <div className="flex items-center gap-2 p-2 bg-white rounded-lg border text-sm">
                                <CreditCard className="h-4 w-4 text-amber-500" />
                                <span className="text-muted-foreground">TİKo Ödeme <span className="text-[10px]">(yakında)</span></span>
                            </div>
                        </div>
                    </div>

                    <Button type="submit" className="w-full md:w-auto bg-cyan-600 hover:bg-cyan-700" disabled={isPending}>
                        {isPending ? 'Kaydediliyor...' : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Figensoft Ayarlarını Kaydet
                            </>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
