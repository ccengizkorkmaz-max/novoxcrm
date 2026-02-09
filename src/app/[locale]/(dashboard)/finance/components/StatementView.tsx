'use client'

import { useState, useEffect } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { getAccountStatement } from '../actions'
import { formatCurrency } from '@/lib/utils'
import { Loader2, ArrowUpCircle, ArrowDownCircle, Info } from 'lucide-react'

interface StatementViewProps {
    account: any
}

export default function StatementView({ account }: StatementViewProps) {
    const [transactions, setTransactions] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function load() {
            const data = await getAccountStatement(account.id)
            setTransactions(data)
            setIsLoading(false)
        }
        load()
    }, [account.id])

    if (isLoading) {
        return (
            <div className="flex h-64 flex-col items-center justify-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-sm text-muted-foreground italic">Ekstre yükleniyor...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6 p-1">
            <div className="flex items-center justify-between border-b pb-4">
                <div>
                    <h2 className="text-xl font-bold">{account.account_name}</h2>
                    <p className="text-sm text-muted-foreground uppercase tracking-tight font-medium">Hesap Ekstresi</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-muted-foreground">Güncel Bakiye</p>
                    <p className={`text-2xl font-black ${account.balance > 0 ? 'text-emerald-600' : account.balance < 0 ? 'text-red-600' : ''}`}>
                        {formatCurrency(Math.abs(account.balance), account.currency)}
                        <span className="text-xs ml-1 font-medium">{account.balance > 0 ? '(Alacak)' : account.balance < 0 ? '(Borç)' : ''}</span>
                    </p>
                </div>
            </div>

            <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/80">
                            <TableHead className="w-[120px]">Tarih</TableHead>
                            <TableHead className="w-[100px]">Tür</TableHead>
                            <TableHead>Açıklama</TableHead>
                            <TableHead className="text-right">Tutar</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.length > 0 ? (
                            transactions.map((tx) => (
                                <TableRow key={tx.id} className="hover:bg-slate-50/50">
                                    <TableCell className="text-xs font-medium">
                                        {new Date(tx.transaction_date).toLocaleDateString('tr-TR')}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {tx.type === 'Debit' ? (
                                                <ArrowDownCircle className="h-4 w-4 text-red-500" />
                                            ) : (
                                                <ArrowUpCircle className="h-4 w-4 text-emerald-500" />
                                            )}
                                            <span className={`text-[10px] font-bold uppercase ${tx.type === 'Debit' ? 'text-red-600' : 'text-emerald-600'}`}>
                                                {tx.type === 'Debit' ? 'Borç' : 'Alacak'}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-sm">{tx.description}</span>
                                            {tx.reference_type && (
                                                <div className="flex items-center gap-1 mt-0.5 opacity-60">
                                                    <Info className="h-3 w-3" />
                                                    <span className="text-[10px] italic">Kaynak: {tx.reference_type}</span>
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className={`text-right font-mono font-bold ${tx.type === 'Debit' ? 'text-red-600' : 'text-emerald-600'}`}>
                                        {tx.type === 'Debit' ? '-' : '+'}
                                        {formatCurrency(tx.amount, tx.currency)}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground italic">
                                    Henüz işlem hareketi bulunmuyor.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg flex justify-between items-center text-xs">
                <div className="flex gap-4">
                    <span className="text-muted-foreground uppercase font-bold">Toplam Borç 🔥: <span className="text-red-600 ml-1">{formatCurrency(transactions.filter(t => t.type === 'Debit').reduce((acc, t) => acc + t.amount, 0), account.currency)}</span></span>
                    <span className="text-muted-foreground uppercase font-bold">Toplam Alacak ✅: <span className="text-emerald-600 ml-1">{formatCurrency(transactions.filter(t => t.type === 'Credit').reduce((acc, t) => acc + t.amount, 0), account.currency)}</span></span>
                </div>
            </div>
        </div>
    )
}
