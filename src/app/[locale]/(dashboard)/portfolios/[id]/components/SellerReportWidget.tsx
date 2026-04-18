'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
    Send, MessageSquare, Eye, Users, Calendar, Copy, Check
} from 'lucide-react'

interface Props {
    portfolio: any
}

export function SellerReportWidget({ portfolio }: Props) {
    const [copied, setCopied] = useState(false)
    const p = portfolio

    // Generate seller report text
    function generateReport(): string {
        const lines = [
            `📊 *Portföy Durum Raporu*`,
            `━━━━━━━━━━━━━━━━━━`,
            `🏠 *${p.title}*`,
            ``,
            `📍 Konum: ${[p.neighborhood, p.district, p.city].filter(Boolean).join(', ') || 'Belirtilmemiş'}`,
            `💰 Fiyat: ${p.price ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: p.currency || 'TRY', maximumFractionDigits: 0 }).format(p.price) : 'Belirtilmemiş'}`,
            ``,
            `📈 *Bu Dönem İstatistikler:*`,
            `👁️ Görüntülenme: ${p.view_count || 0}`,
            `💬 Sorgu: ${p.inquiry_count || 0}`,
            `🏃 Gezme Randevusu: ${p.showing_count || 0}`,
            ``,
        ]

        if (p.authorization_end) {
            const daysLeft = Math.ceil((new Date(p.authorization_end).getTime() - Date.now()) / 86400000)
            if (daysLeft > 0) {
                lines.push(`📅 Yetki bitiş: ${new Date(p.authorization_end).toLocaleDateString('tr-TR')} (${daysLeft} gün kaldı)`)
            } else {
                lines.push(`⚠️ Yetki süresi ${Math.abs(daysLeft)} gün önce doldu!`)
            }
        }

        lines.push(``)
        lines.push(`_Rapor tarihi: ${new Date().toLocaleDateString('tr-TR')}_`)
        lines.push(`_Novo CRM ile oluşturuldu_`)

        return lines.join('\n')
    }

    function handleCopy() {
        navigator.clipboard.writeText(generateReport())
        setCopied(true)
        toast.success('Rapor panoya kopyalandı!')
        setTimeout(() => setCopied(false), 2000)
    }

    function handleWhatsApp() {
        const phone = p.owner_phone?.replace(/\D/g, '') || ''
        if (!phone) {
            toast.error('Ev sahibi telefon numarası bulunamadı')
            return
        }
        const text = encodeURIComponent(generateReport())
        window.open(`https://wa.me/${phone}?text=${text}`, '_blank')
    }

    return (
        <Card className="border shadow-sm overflow-hidden">
            <CardHeader className="pb-3 bg-gradient-to-r from-emerald-50 to-green-50">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Send className="h-4 w-4 text-emerald-600" />
                    Satıcı Raporu
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
                <p className="text-[10px] text-muted-foreground">
                    Ev sahibine portföy istatistiklerini içeren hazır raporu WhatsApp veya mesaj olarak gönderin.
                </p>

                {/* Preview */}
                <div className="bg-slate-50 rounded-xl p-3 border text-xs leading-relaxed whitespace-pre-wrap font-mono max-h-48 overflow-y-auto">
                    {generateReport()}
                </div>

                {/* Stats summary */}
                <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 rounded-lg bg-blue-50 border border-blue-200">
                        <Eye className="h-3.5 w-3.5 mx-auto text-blue-500 mb-0.5" />
                        <p className="text-sm font-black text-blue-600">{p.view_count || 0}</p>
                        <p className="text-[9px] text-blue-500">Görüntülenme</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                        <Users className="h-3.5 w-3.5 mx-auto text-emerald-500 mb-0.5" />
                        <p className="text-sm font-black text-emerald-600">{p.inquiry_count || 0}</p>
                        <p className="text-[9px] text-emerald-500">Sorgu</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-violet-50 border border-violet-200">
                        <Calendar className="h-3.5 w-3.5 mx-auto text-violet-500 mb-0.5" />
                        <p className="text-sm font-black text-violet-600">{p.showing_count || 0}</p>
                        <p className="text-[9px] text-violet-500">Gezme</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs gap-1.5"
                        onClick={handleCopy}
                    >
                        {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                        {copied ? 'Kopyalandı!' : 'Kopyala'}
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        className="flex-1 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                        onClick={handleWhatsApp}
                    >
                        <MessageSquare className="h-3.5 w-3.5" />
                        WhatsApp Gönder
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
