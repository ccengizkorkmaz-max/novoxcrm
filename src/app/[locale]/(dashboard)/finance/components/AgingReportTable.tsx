'use client'

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button' // Added Button
import { formatCurrency } from '@/lib/utils'
import { AlertTriangle, Clock, User, CheckCircle2 } from 'lucide-react' // Added CheckCircle2
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { collectInstallment, updateValuablePaperStatus } from '../actions' // Added actions
import { toast } from 'sonner' // Added toast

interface AgingReportTableProps {
    data: any[]
}

export default function AgingReportTable({ data }: AgingReportTableProps) {

    const handleCollect = async (id: string, type: string) => {
        if (!confirm('Bu ödemeyi tahsil etmek istediğinize emin misiniz?')) return

        let result
        if (type === 'Çek/Senet') {
            // ID format: paper-{uuid}
            const paperId = id.replace('paper-', '')
            result = await updateValuablePaperStatus(paperId, 'Collected')
        } else {
            // ID format: crm-{uuid}
            const itemId = id.replace('crm-', '')
            result = await collectInstallment(itemId)
        }

        if (result.success) {
            toast.success('Tahsilat başarıyla kaydedildi.')
        } else {
            toast.error(result.error || 'Tahsilat işlemi başarısız.')
        }
    }

    if (!data || data.length === 0) {
        return (
            <div className="flex h-48 flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl border-slate-100 bg-slate-50/30">
                <Clock className="h-8 w-8 text-slate-300" />
                <p className="text-sm text-muted-foreground italic">Vadesi geçmiş alacak bulunmuyor.</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Desktop View */}
            <div className="hidden sm:block rounded-xl border bg-white shadow-sm overflow-hidden border-slate-200">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/80">
                            <TableHead>Müşteri / Proje</TableHead>
                            <TableHead>Evrak Türü</TableHead>
                            <TableHead>Vade Tarihi</TableHead>
                            <TableHead>Gecikme</TableHead>
                            <TableHead className="text-right">Tutar</TableHead>
                            <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((item) => (
                            <TableRow key={item.id} className="hover:bg-slate-50/50">
                                <TableCell>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-1.5">
                                            <User className="h-3 w-3 text-slate-400" />
                                            <span className="font-semibold text-sm">{item.customer}</span>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground ml-4.5">
                                            {item.project} {item.unit && `(${item.unit})`}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="text-[10px] font-normal">
                                        {item.type}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-sm">
                                    {new Date(item.due_date).toLocaleDateString('tr-TR')}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1.5 text-red-600 font-bold text-xs">
                                        <AlertTriangle className="h-3 w-3" />
                                        {item.delay_days} Gün
                                    </div>
                                </TableCell>
                                <TableCell className="text-right font-mono font-bold text-slate-900 text-sm">
                                    {formatCurrency(item.amount, 'TRY')}
                                </TableCell>
                                <TableCell>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 h-8 px-2"
                                        onClick={() => handleCollect(item.id, item.type)}
                                        title="Tahsil Et"
                                    >
                                        <CheckCircle2 className="h-4 w-4 mr-1.5" /> Tahsil Et
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <div className="p-4 bg-red-50/30 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">Toplam Gecikmiş Alacak</span>
                    <span className="text-lg font-black text-red-600">
                        {formatCurrency(data.reduce((acc, curr) => acc + curr.amount, 0), 'TRY')}
                    </span>
                </div>
            </div>

            {/* Mobile View */}
            <div className="grid grid-cols-1 gap-4 sm:hidden">
                {data.map((item) => (
                    <Card key={item.id} className="border-none shadow-sm overflow-hidden">
                        <CardHeader className="bg-red-50/10 p-4 pb-3 border-b border-red-50/50">
                            <div className="flex justify-between items-start">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-1.5">
                                        <User className="h-3.5 w-3.5 text-slate-400" />
                                        <span className="font-bold text-slate-900 text-sm">{item.customer}</span>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground">
                                        {item.project} {item.unit && `(${item.unit})`}
                                    </span>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <Badge variant="outline" className="text-[9px] font-normal h-4">
                                        {item.type}
                                    </Badge>
                                    <div className="flex items-center gap-1 text-red-600 font-black text-[10px] uppercase">
                                        <AlertTriangle className="h-3 w-3" />
                                        {item.delay_days} Gün Gecikme
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3">
                            <div className="grid grid-cols-2 gap-4 text-xs">
                                <div className="flex flex-col gap-1">
                                    <span className="text-muted-foreground uppercase font-bold tracking-tight text-[10px]">Vade Tarihi</span>
                                    <span className="font-medium">{new Date(item.due_date).toLocaleDateString('tr-TR')}</span>
                                </div>
                                <div className="flex flex-col gap-1 text-right">
                                    <span className="text-muted-foreground uppercase font-bold tracking-tight text-[10px]">Tutar</span>
                                    <span className="font-mono font-black text-slate-900 text-sm">
                                        {formatCurrency(item.amount, 'TRY')}
                                    </span>
                                </div>
                            </div>
                            <Button
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-9 mt-2"
                                onClick={() => handleCollect(item.id, item.type)}
                            >
                                <CheckCircle2 className="h-4 w-4 mr-2" /> Tahsil Et
                            </Button>
                        </CardContent>
                    </Card>
                ))}
                <div className="p-5 bg-red-600 rounded-2xl flex flex-col gap-2 shadow-lg shadow-red-100">
                    <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest text-center">Toplam Gecikmiş Alacak</span>
                    <span className="text-2xl font-black text-white text-center">
                        {formatCurrency(data.reduce((acc, curr) => acc + curr.amount, 0), 'TRY')}
                    </span>
                </div>
            </div>
        </div>
    )
}
