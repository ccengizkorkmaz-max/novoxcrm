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
import { formatCurrency } from '@/lib/utils'
import { AlertTriangle, Clock, User } from 'lucide-react'

interface AgingReportTableProps {
    data: any[]
}

export default function AgingReportTable({ data }: AgingReportTableProps) {
    if (!data || data.length === 0) {
        return (
            <div className="flex h-48 flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl border-slate-100 bg-slate-50/30">
                <Clock className="h-8 w-8 text-slate-300" />
                <p className="text-sm text-muted-foreground italic">Vadesi geçmiş alacak bulunmuyor.</p>
            </div>
        )
    }

    return (
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden border-slate-200">
            <Table>
                <TableHeader>
                    <TableRow className="bg-slate-50/80">
                        <TableHead>Müşteri / Proje</TableHead>
                        <TableHead>Evrak Türü</TableHead>
                        <TableHead>Vade Tarihi</TableHead>
                        <TableHead>Gecikme</TableHead>
                        <TableHead className="text-right">Tutar</TableHead>
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
    )
}
