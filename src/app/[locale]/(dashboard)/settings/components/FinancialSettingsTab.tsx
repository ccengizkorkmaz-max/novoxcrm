
'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { toast } from 'sonner'
import { updateFinancialSettings } from '../actions'
import { CalendarDays, Save, Loader2 } from 'lucide-react'

interface FinancialSettingsTabProps {
    tenant: {
        id: string
        installment_start_rule: string
    }
}

export function FinancialSettingsTab({ tenant }: FinancialSettingsTabProps) {
    const [rule, setRule] = useState(tenant?.installment_start_rule || 'NextMonth15th')
    const [isPending, setIsPending] = useState(false)

    async function handleSave() {
        setIsPending(true)
        const formData = new FormData()
        formData.append('installment_start_rule', rule)
        
        const result = await updateFinancialSettings(formData)
        setIsPending(false)
        
        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success('Finansal ayarlar güncellendi')
        }
    }

    return (
        <Card className="border-none shadow-sm">
            <CardHeader>
                <div className="flex items-center gap-2 mb-1">
                    <CalendarDays className="h-5 w-5 text-blue-500" />
                    <CardTitle>Finansal Tanımlar</CardTitle>
                </div>
                <CardDescription>
                    Ödeme planı hesaplamalarında kullanılacak genel kuralları buradan belirleyebilirsiniz.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                <div className="space-y-4">
                    <Label className="text-sm font-bold text-slate-700">İlk Taksit Başlangıç Kuralı</Label>
                    <div className="grid gap-4">
                        <div 
                            onClick={() => setRule('NextMonth15th')}
                            className={`flex items-start space-x-3 p-4 rounded-xl border transition-all cursor-pointer group ${
                                rule === 'NextMonth15th' 
                                ? 'border-blue-500 bg-blue-50/50 shadow-sm' 
                                : 'border-slate-100 bg-slate-50/50 hover:bg-white'
                            }`}
                        >
                            <div className={`mt-1 h-4 w-4 rounded-full border flex items-center justify-center ${
                                rule === 'NextMonth15th' ? 'border-blue-500' : 'border-slate-300'
                            }`}>
                                {rule === 'NextMonth15th' && <div className="h-2 w-2 rounded-full bg-blue-500" />}
                            </div>
                            <div className="flex-1">
                                <div className={`font-bold transition-colors ${
                                    rule === 'NextMonth15th' ? 'text-blue-700' : 'text-slate-900 group-hover:text-blue-600'
                                }`}>Takip Eden Ayın 15. Günü</div>
                                <div className="text-xs text-slate-500 mt-1 leading-relaxed">
                                    Örn: Peşinat 1 Ocak ise ilk taksit 15 Şubat olur. Peşinat 31 Ocak ise ilk taksit 15 Şubat olur.
                                </div>
                            </div>
                        </div>
                        
                        <div 
                            onClick={() => setRule('None')}
                            className={`flex items-start space-x-3 p-4 rounded-xl border transition-all cursor-pointer group ${
                                rule === 'None' 
                                ? 'border-blue-500 bg-blue-50/50 shadow-sm' 
                                : 'border-slate-100 bg-slate-50/50 hover:bg-white'
                            }`}
                        >
                            <div className={`mt-1 h-4 w-4 rounded-full border flex items-center justify-center ${
                                rule === 'None' ? 'border-blue-500' : 'border-slate-300'
                            }`}>
                                {rule === 'None' && <div className="h-2 w-2 rounded-full bg-blue-500" />}
                            </div>
                            <div className="flex-1">
                                <div className={`font-bold transition-colors ${
                                    rule === 'None' ? 'text-blue-700' : 'text-slate-900 group-hover:text-blue-600'
                                }`}>Standart (Tam 1 Ay Sonra)</div>
                                <div className="text-xs text-slate-500 mt-1 leading-relaxed">
                                    Örn: Peşinat 1 Ocak ise ilk taksit 1 Şubat olur.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <Button 
                        onClick={handleSave} 
                        disabled={isPending}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold h-11 px-8 rounded-xl shadow-lg shadow-slate-900/10 active:scale-95 transition-all"
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
