'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, FileText, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import StatementView from './StatementView'
import TransactionForm from './TransactionForm'
import AccountForm from './AccountForm'

interface AccountsTableProps {
    accounts: any[]
}

export default function AccountsTable({ accounts }: AccountsTableProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)

    const filteredAccounts = accounts.filter(acc =>
        acc.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (acc.account_code && acc.account_code.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Hesap adı veya kodu ile ara..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50">
                                <Plus className="h-4 w-4 mr-2" /> Yeni Hesap Tanımla
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <AccountForm />
                        </DialogContent>
                    </Dialog>

                    <Dialog>
                        <DialogTrigger asChild>
                            <Button className="bg-blue-600 hover:bg-blue-700">
                                <Plus className="h-4 w-4 mr-2" /> Yeni İşlem Girişi
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <TransactionForm accounts={accounts} />
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Desktop View */}
            <div className="hidden sm:block rounded-md border bg-white overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50">
                            <TableHead className="w-[250px]">Cari Hesap / Ünvan</TableHead>
                            <TableHead>Tür</TableHead>
                            <TableHead>Proje / Ünite</TableHead>
                            <TableHead>Vergi / TC</TableHead>
                            <TableHead className="text-right">Bakiye</TableHead>
                            <TableHead className="text-right">İşlemler</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredAccounts.length > 0 ? (
                            filteredAccounts.map((acc) => (
                                <TableRow key={acc.id} className="hover:bg-slate-50/50">
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span>{acc.account_name}</span>
                                            {acc.account_code && <span className="text-[10px] text-muted-foreground">{acc.account_code}</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="text-[10px] uppercase">
                                            {acc.owner_type === 'Customer' ? 'Müşteri' :
                                                acc.owner_type === 'Employee' ? 'Personel' :
                                                    acc.owner_type === 'Broker' ? 'Broker' :
                                                        acc.owner_type === 'Tedarikçi' ? 'Tedarikçi' : acc.owner_type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {acc.project?.name ? (
                                            <div className="flex flex-col text-[11px]">
                                                <span className="font-medium">{acc.project.name}</span>
                                                {acc.unit && <span className="text-muted-foreground">{acc.unit.block} - {acc.unit.unit_number}</span>}
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-[11px] font-mono">
                                        {acc.tax_no || '-'}
                                    </TableCell>
                                    <TableCell className={`text-right font-mono font-bold ${acc.balance > 0 ? 'text-emerald-600' : acc.balance < 0 ? 'text-red-600' : ''}`}>
                                        <div className="flex items-center justify-end gap-1">
                                            {acc.balance > 0 && <ArrowUpRight className="h-3 w-3" />}
                                            {acc.balance < 0 && <ArrowDownLeft className="h-3 w-3" />}
                                            {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(Math.abs(acc.balance))}
                                            <span className="text-[10px] ml-1 text-muted-foreground">{acc.balance > 0 ? '(A)' : acc.balance < 0 ? '(B)' : ''}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-8 text-blue-600">
                                                    <FileText className="h-4 w-4 mr-2" /> Ekstre
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                                <StatementView account={acc} />
                                            </DialogContent>
                                        </Dialog>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground italic">
                                    Hesap bulunamadı.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile Card View */}
            <div className="grid grid-cols-1 gap-4 sm:hidden">
                {filteredAccounts.length > 0 ? (
                    filteredAccounts.map((acc) => (
                        <Card key={acc.id} className="border-none shadow-sm overflow-hidden">
                            <CardHeader className="bg-slate-50/50 p-4 pb-3 border-b border-slate-100">
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-900">{acc.account_name}</span>
                                        {acc.account_code && <span className="text-[10px] text-muted-foreground font-mono">{acc.account_code}</span>}
                                    </div>
                                    <Badge variant="outline" className="text-[9px] uppercase px-1.5 h-4">
                                        {acc.owner_type === 'Customer' ? 'Müşteri' :
                                            acc.owner_type === 'Employee' ? 'Personel' :
                                                acc.owner_type === 'Broker' ? 'Broker' :
                                                    acc.owner_type === 'Tedarikçi' ? 'Tedarikçi' : acc.owner_type}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 space-y-3">
                                <div className="grid gap-2 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground uppercase font-bold tracking-tight text-[10px]">Proje / Ünite</span>
                                        <span className="font-medium">
                                            {acc.project?.name ? `${acc.project.name} ${acc.unit ? `(${acc.unit.unit_number})` : ''}` : '-'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center pt-1 border-t border-slate-50">
                                        <span className="text-muted-foreground uppercase font-bold tracking-tight text-[10px]">Bakiye</span>
                                        <div className={`font-mono font-bold text-sm ${acc.balance > 0 ? 'text-emerald-600' : acc.balance < 0 ? 'text-red-600' : ''}`}>
                                            <div className="flex items-center gap-1">
                                                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(Math.abs(acc.balance))}
                                                <span className="text-[9px] font-bold">{acc.balance > 0 ? '(A)' : acc.balance < 0 ? '(B)' : ''}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" className="w-full h-9 text-xs border-blue-100 text-blue-600 hover:bg-blue-50">
                                                <FileText className="h-3.5 w-3.5 mr-2" /> İşlem Ekstresini Görüntüle
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] rounded-2xl">
                                            <StatementView account={acc} />
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="bg-card border-none shadow-sm rounded-xl p-8 text-center text-muted-foreground italic">
                        Hesap bulunamadı.
                    </div>
                )}
            </div>
        </div>
    )
}
