'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Info, Search } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface Commission {
    id: string
    sale_id: string
    user_id: string
    amount: number
    status: string
    calculated_at: string
    paid_at?: string | null
    rule_snapshot: any
    profiles?: { full_name: string }
    sales?: {
        id: string
        projects?: { name: string }
        units?: { unit_no: string }
        customers?: { full_name: string }
    }
}

interface CommissionListProps {
    commissions: Commission[]
}

export default function CommissionList({ commissions }: CommissionListProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')

    const filteredCommissions = commissions.filter(c => {
        const matchesSearch =
            c.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.sales?.customers?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.sales?.projects?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.sales?.units?.unit_no?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || c.status === statusFilter;

        return matchesSearch && matchesStatus;
    })

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY'
        }).format(amount)
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'paid': return <Badge className="bg-green-600">Ödendi</Badge>
            case 'approved': return <Badge className="bg-blue-600">Onaylandı</Badge>
            case 'pending': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Bekliyor</Badge>
            case 'cancelled': return <Badge variant="destructive">İptal</Badge>
            default: return <Badge variant="outline">{status}</Badge>
        }
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <CardTitle>Prim Hareketleri</CardTitle>
                        <CardDescription>
                            Tüm prim kayıtları ve detayları.
                        </CardDescription>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Personel, proje veya müşteri ara..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Durum" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tümü</SelectItem>
                                <SelectItem value="pending">Bekliyor</SelectItem>
                                <SelectItem value="approved">Onaylandı</SelectItem>
                                <SelectItem value="paid">Ödendi</SelectItem>
                                <SelectItem value="cancelled">İptal</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tarih</TableHead>
                                <TableHead>Personel</TableHead>
                                <TableHead>Satış Detayı</TableHead>
                                <TableHead>Tutar</TableHead>
                                <TableHead>Durum</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredCommissions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        Kayıt bulunamadı.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredCommissions.map((commission) => (
                                    <TableRow key={commission.id}>
                                        <TableCell>
                                            <div className="text-sm">
                                                {format(new Date(commission.calculated_at), 'd MMM yyyy', { locale: tr })}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {format(new Date(commission.calculated_at), 'HH:mm', { locale: tr })}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {commission.profiles?.full_name || 'Bilinmiyor'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm font-medium">
                                                {commission.sales?.projects?.name || '-'} / {commission.sales?.units?.unit_no || '-'}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {commission.sales?.customers?.full_name || '-'}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-bold text-green-700">
                                            {formatCurrency(commission.amount)}
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(commission.status)}
                                        </TableCell>
                                        <TableCell>
                                            {commission.rule_snapshot && (
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <button className="text-muted-foreground hover:text-foreground">
                                                            <Info className="h-4 w-4" />
                                                        </button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-80">
                                                        <div className="grid gap-2">
                                                            <div className="space-y-2">
                                                                <h4 className="font-medium leading-none">Prim Detayı</h4>
                                                                <p className="text-sm text-muted-foreground">
                                                                    Uygulanan kural bilgileri.
                                                                </p>
                                                            </div>
                                                            <div className="grid gap-2 text-sm">
                                                                <div className="grid grid-cols-3 items-center gap-4">
                                                                    <span className="font-medium">Oran:</span>
                                                                    <span className="col-span-2">%{((commission.rule_snapshot.rate || 0) * 100).toFixed(2)}</span>
                                                                </div>
                                                                <div className="grid grid-cols-3 items-center gap-4">
                                                                    <span className="font-medium">Tip:</span>
                                                                    <span className="col-span-2 capitalize">{commission.rule_snapshot.payment_type}</span>
                                                                </div>
                                                                <div className="grid grid-cols-3 items-center gap-4">
                                                                    <span className="font-medium">Kaynak:</span>
                                                                    <span className="col-span-2 capitalize">{commission.rule_snapshot.source_category}</span>
                                                                </div>
                                                                {commission.rule_snapshot.description && (
                                                                    <div className="grid grid-cols-3 items-center gap-4">
                                                                        <span className="font-medium">Not:</span>
                                                                        <span className="col-span-2 text-xs">{commission.rule_snapshot.description}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}
