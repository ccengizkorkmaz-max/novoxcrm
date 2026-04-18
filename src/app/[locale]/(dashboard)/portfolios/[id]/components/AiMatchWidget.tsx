'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { findMatchingCustomers } from '../../actions'
import { toast } from 'sonner'
import {
    Sparkles, Users, Phone, Mail, Loader2, ChevronRight, Star
} from 'lucide-react'

interface Props {
    portfolioId: string
}

export function AiMatchWidget({ portfolioId }: Props) {
    const [matches, setMatches] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [searched, setSearched] = useState(false)

    async function handleSearch() {
        setLoading(true)
        try {
            const results = await findMatchingCustomers(portfolioId)
            setMatches(results)
            setSearched(true)
            if (results.length === 0) {
                toast.info('Eşleşen müşteri bulunamadı')
            } else {
                toast.success(`${results.length} potansiyel müşteri bulundu!`)
            }
        } catch (err: any) {
            toast.error('Arama başarısız: ' + (err.message || ''))
        } finally {
            setLoading(false)
        }
    }

    const getScoreColor = (score: number) => {
        if (score >= 4) return 'bg-emerald-100 text-emerald-700 border-emerald-200'
        if (score >= 3) return 'bg-blue-100 text-blue-700 border-blue-200'
        if (score >= 2) return 'bg-amber-100 text-amber-700 border-amber-200'
        return 'bg-slate-100 text-slate-700 border-slate-200'
    }

    const getScoreLabel = (score: number) => {
        if (score >= 4) return 'Çok Yüksek'
        if (score >= 3) return 'Yüksek'
        if (score >= 2) return 'Orta'
        return 'Düşük'
    }

    return (
        <Card className="border shadow-sm overflow-hidden">
            <CardHeader className="pb-3 bg-gradient-to-r from-violet-50 to-purple-50">
                <CardTitle className="text-sm font-bold flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-violet-600" />
                        AI Müşteri Eşleştirme
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-[10px] h-7 gap-1.5 border-violet-200 text-violet-700 hover:bg-violet-50"
                        onClick={handleSearch}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-3 w-3 animate-spin" /> Taranıyor...
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-3 w-3" /> {searched ? 'Yeniden Tara' : 'Müşteri Tara'}
                            </>
                        )}
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                {!searched && !loading && (
                    <div className="p-6 text-center">
                        <Sparkles className="h-8 w-8 mx-auto text-violet-300 mb-2" />
                        <p className="text-xs text-muted-foreground">
                            Bu portföyle eşleşen müşterileri bulmak için <strong>"Müşteri Tara"</strong> butonuna tıklayın.
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                            Sistem; şehir, ilçe, oda sayısı ve mülk tipine göre CRM veritabanınızı tarar.
                        </p>
                    </div>
                )}

                {searched && matches.length === 0 && (
                    <div className="p-6 text-center">
                        <Users className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                        <p className="text-xs text-muted-foreground">Eşleşen müşteri bulunamadı.</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                            Müşteri notlarında konum veya mülk tipi bilgisi olan kayıtlar eşleştirilir.
                        </p>
                    </div>
                )}

                {matches.length > 0 && (
                    <div className="divide-y max-h-80 overflow-y-auto">
                        {matches.map((customer) => (
                            <div key={customer.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                                <div className="flex-shrink-0">
                                    <Badge className={cn("text-[9px] font-black border", getScoreColor(customer.matchScore))}>
                                        <Star className="h-2.5 w-2.5 mr-0.5" />
                                        {getScoreLabel(customer.matchScore)}
                                    </Badge>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold truncate">{customer.full_name}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        {customer.phone && (
                                            <a href={`tel:${customer.phone}`} className="flex items-center gap-1 text-[10px] text-blue-600 hover:underline">
                                                <Phone className="h-2.5 w-2.5" /> {customer.phone}
                                            </a>
                                        )}
                                        {customer.email && (
                                            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                <Mail className="h-2.5 w-2.5" /> {customer.email}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <a href={`https://wa.me/${customer.phone?.replace(/\D/g, '')}`} target="_blank" className="text-[10px] text-emerald-600 font-bold hover:underline flex items-center gap-0.5">
                                    WhatsApp <ChevronRight className="h-3 w-3" />
                                </a>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
