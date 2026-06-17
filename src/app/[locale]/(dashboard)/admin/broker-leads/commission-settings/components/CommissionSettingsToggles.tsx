'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { updateBrokerCommissionSettings } from '@/app/broker/actions'
import { toast } from 'sonner'
import { Settings2, Save, Loader2, Trophy, Key, Activity } from 'lucide-react'

interface CommissionSettingsTogglesProps {
    initialSettings: {
        level_commission_multiplier_enabled: boolean
        level_lead_lock_duration_enabled: boolean
        level_auto_promotion_enabled: boolean
    } | null
}

export function CommissionSettingsToggles({ initialSettings }: CommissionSettingsTogglesProps) {
    const [multiplierEnabled, setMultiplierEnabled] = useState(initialSettings?.level_commission_multiplier_enabled || false)
    const [leadLockEnabled, setLeadLockEnabled] = useState(initialSettings?.level_lead_lock_duration_enabled || false)
    const [autoPromotionEnabled, setAutoPromotionEnabled] = useState(initialSettings?.level_auto_promotion_enabled || false)
    const [isPending, setIsPending] = useState(false)

    async function handleSave() {
        setIsPending(true)
        try {
            const res = await updateBrokerCommissionSettings({
                level_commission_multiplier_enabled: multiplierEnabled,
                level_lead_lock_duration_enabled: leadLockEnabled,
                level_auto_promotion_enabled: autoPromotionEnabled
            })

            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success('Ayarlar başarıyla güncellendi.')
            }
        } catch (err) {
            toast.error('Ayarlar kaydedilirken bir hata oluştu.')
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
            <CardHeader className="pb-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2 mb-1">
                    <Settings2 className="h-5 w-5 text-indigo-600" />
                    <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Broker Seviye Seçenekleri</CardTitle>
                </div>
                <CardDescription className="text-slate-500 font-medium">
                    Bu seçenekleri aktifleştirerek broker seviyelerinin (Junior, Silver, Gold, Platinum) sistem süreçlerini doğrudan etkilemesini sağlayabilirsiniz.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6 px-8">
                {/* Option A: Commission Multiplier */}
                <div className="flex items-start justify-between p-4 rounded-2xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/10 transition-all group">
                    <div className="flex gap-4">
                        <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Trophy className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="multiplier-toggle" className="text-sm font-bold text-slate-900 cursor-pointer">
                                Komisyon Oranı Çarpanı (Seviye Bazlı)
                            </Label>
                            <p className="text-xs text-slate-500 max-w-lg leading-relaxed">
                                Aktif edildiğinde, brokerın hakediş tutarı sahip olduğu seviyenin komisyon çarpanına göre artırılır. (Örn: Gold Seviye %5 bonus veriyorsa, 10.000 ₺ yerine 10.500 ₺ hakediş oluşur).
                            </p>
                        </div>
                    </div>
                    <Switch
                        id="multiplier-toggle"
                        checked={multiplierEnabled}
                        onCheckedChange={setMultiplierEnabled}
                        className="data-[state=checked]:bg-indigo-600"
                    />
                </div>

                {/* Option B: Lead Lock Duration */}
                <div className="flex items-start justify-between p-4 rounded-2xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/10 transition-all group">
                    <div className="flex gap-4">
                        <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Key className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="lead-lock-toggle" className="text-sm font-bold text-slate-900 cursor-pointer">
                                Dinamik Lead Kilitleme Süresi
                            </Label>
                            <p className="text-xs text-slate-500 max-w-lg leading-relaxed">
                                Aktif edildiğinde, yeni aday kaydının rezerve süresi tenant varsayılanı yerine brokerın seviyesindeki gün süresine göre hesaplanır.
                            </p>
                        </div>
                    </div>
                    <Switch
                        id="lead-lock-toggle"
                        checked={leadLockEnabled}
                        onCheckedChange={setLeadLockEnabled}
                        className="data-[state=checked]:bg-indigo-600"
                    />
                </div>

                {/* Option C: Auto-Promotion */}
                <div className="flex items-start justify-between p-4 rounded-2xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/10 transition-all group">
                    <div className="flex gap-4">
                        <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Activity className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="auto-promotion-toggle" className="text-sm font-bold text-slate-900 cursor-pointer">
                                Otomatik Seviye Atlama (Auto-Promotion)
                            </Label>
                            <p className="text-xs text-slate-500 max-w-lg leading-relaxed">
                                Aktif edildiğinde, brokerın onaylanan başarılı satış adedi veya hacmi arttıkça seviyesi sistem tarafından otomatik olarak üst seviyeye yükseltilir.
                            </p>
                        </div>
                    </div>
                    <Switch
                        id="auto-promotion-toggle"
                        checked={autoPromotionEnabled}
                        onCheckedChange={setAutoPromotionEnabled}
                        className="data-[state=checked]:bg-indigo-600"
                    />
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <Button
                        onClick={handleSave}
                        disabled={isPending}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 px-8 rounded-xl shadow-lg shadow-indigo-600/10 active:scale-95 transition-all"
                    >
                        {isPending ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Kaydediliyor...</>
                        ) : (
                            <><Save className="mr-2 h-4 w-4" /> Ayarları Kaydet</>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
