'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
    Building2, Search, Plus, Pencil, Trash2, Phone, Mail, FileText
} from 'lucide-react'
import { deleteCompany } from './company-actions'

interface Company {
    id: string
    name: string
    tax_number: string | null
    tax_office: string | null
    trade_registry_no: string | null
    sector: string | null
    website: string | null
    phone: string | null
    email: string | null
    status: string
    notes: string | null
    created_at: string
    customers?: { count: number }[] | null
}

interface CompaniesPageClientProps {
    companies: Company[]
    userRole: string
}

export default function CompaniesPageClient({ companies, userRole }: CompaniesPageClientProps) {
    const router = useRouter()
    const [search, setSearch] = useState('')
    const [isPending, startTransition] = useTransition()

    const filtered = useMemo(() => {
        if (!search) return companies
        const q = search.toLowerCase()
        return companies.filter(c =>
            c.name.toLowerCase().includes(q) ||
            c.tax_number?.includes(q) ||
            c.phone?.includes(q) ||
            c.email?.toLowerCase().includes(q)
        )
    }, [companies, search])

    const stats = useMemo(() => ({
        total: companies.length,
    }), [companies])

    const openNew = () => {
        router.push('/companies/new')
    }

    const openEdit = (company: Company) => {
        router.push(`/companies/${company.id}`)
    }

    const handleDelete = (company: Company) => {
        if (!confirm(`"${company.name}" firmasını silmek istediğinize emin misiniz?`)) return
        startTransition(async () => { await deleteCompany(company.id) })
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Building2 className="h-6 w-6 text-blue-500" />
                        Firmalar
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Kurumsal müşterilerinizi yönetin
                    </p>
                </div>
                <Button onClick={openNew} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Yeni Firma
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Card className="p-3">
                    <div className="text-xs text-muted-foreground">Toplam Firma</div>
                    <div className="text-2xl font-bold text-slate-700">{stats.total}</div>
                </Card>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Firma adı, vergi no, telefon..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[220px]">Firma</TableHead>
                                <TableHead>Vergi Bilgileri</TableHead>
                                <TableHead>İletişim</TableHead>
                                <TableHead>Sektör</TableHead>
                                <TableHead className="text-right">İşlemler</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        {search ? 'Sonuç bulunamadı' : 'Henüz firma kaydı yok'}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filtered.map(company => {
                                    return (
                                        <TableRow key={company.id} className="hover:bg-muted/30">
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                                    <div className="font-medium">{company.name}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm space-y-0.5">
                                                    {company.tax_number && (
                                                        <div className="flex items-center gap-1 text-muted-foreground">
                                                            <FileText className="h-3 w-3" />
                                                            VKN: {company.tax_number}
                                                        </div>
                                                    )}
                                                    {company.tax_office && (
                                                        <div className="text-xs text-muted-foreground">{company.tax_office}</div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm space-y-0.5">
                                                    {company.phone && (
                                                        <span className="flex items-center gap-1 text-muted-foreground">
                                                            <Phone className="h-3 w-3" /> {company.phone}
                                                        </span>
                                                    )}
                                                    {company.email && (
                                                        <span className="flex items-center gap-1 text-muted-foreground">
                                                            <Mail className="h-3 w-3" /> {company.email}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-muted-foreground">{company.sector || '-'}</span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center gap-1 justify-end">
                                                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(company)}>
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                    {(userRole === 'owner' || userRole === 'admin') && (
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => handleDelete(company)}>
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

        </div>
    )
}
