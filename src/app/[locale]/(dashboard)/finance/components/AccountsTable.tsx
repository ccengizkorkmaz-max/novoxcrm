'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, FileText, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import StatementView from './StatementView'
import TransactionForm from './TransactionForm'

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

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50">
                            <TableHead className="w-[300px]">Hesap Adı</TableHead>
                            <TableHead>Tür</TableHead>
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
                                                    acc.owner_type === 'Broker' ? 'Broker' : acc.owner_type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className={`text-right font-mono font-bold ${acc.balance > 0 ? 'text-emerald-600' : acc.balance < 0 ? 'text-red-600' : ''}`}>
                                        <div className="flex items-center justify-end gap-1">
                                            {acc.balance > 0 && <ArrowUpRight className="h-3 w-3" />}
                                            {acc.balance < 0 && <ArrowDownLeft className="h-3 w-3" />}
                                            {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(Math.abs(acc.balance))}
                                            <span className="text-[10px] ml-1 text-muted-foreground">{acc.balance > 0 ? '(Alacaklı)' : acc.balance < 0 ? '(Borçlu)' : ''}</span>
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
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground italic">
                                    Hesap bulunamadı.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
