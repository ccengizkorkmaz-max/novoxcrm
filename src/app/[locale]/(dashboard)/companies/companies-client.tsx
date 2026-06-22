'use client'

import { useState, useMemo, useTransition } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
    Building2, Search, Plus, Pencil, Trash2, Phone, Mail, Globe,
    Loader2, FileText
} from 'lucide-react'
import { createCompany, updateCompany, deleteCompany } from './company-actions'
import AddressManager from '@/components/shared/AddressManager'

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

const emptyForm = {
    name: '', tax_number: '', tax_office: '', trade_registry_no: '',
    sector: '', website: '', phone: '', email: '', notes: ''
}

export default function CompaniesPageClient({ companies, userRole }: CompaniesPageClientProps) {
    const [search, setSearch] = useState('')
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editCompany, setEditCompany] = useState<Company | null>(null)
    const [form, setForm] = useState(emptyForm)
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
        setForm(emptyForm)
        setEditCompany(null)
        setDialogOpen(true)
    }

    const openEdit = (company: Company) => {
        setForm({
            name: company.name,
            tax_number: company.tax_number || '',
            tax_office: company.tax_office || '',
            trade_registry_no: company.trade_registry_no || '',
            sector: company.sector || '',
            website: company.website || '',
            phone: company.phone || '',
            email: company.email || '',
            notes: company.notes || ''
        })
        setEditCompany(company)
        setDialogOpen(true)
    }

    const handleSave = () => {
        if (!form.name.trim()) return
        startTransition(async () => {
            if (editCompany) {
                await updateCompany(editCompany.id, {
                    name: form.name,
                    tax_number: form.tax_number || null,
                    tax_office: form.tax_office || null,
                    trade_registry_no: form.trade_registry_no || null,
                    sector: form.sector || null,
                    website: form.website || null,
                    phone: form.phone || null,
                    email: form.email || null,
                    notes: form.notes || null,
                })
            } else {
                await createCompany({
                    name: form.name,
                    tax_number: form.tax_number || undefined,
                    tax_office: form.tax_office || undefined,
                    trade_registry_no: form.trade_registry_no || undefined,
                    sector: form.sector || undefined,
                    website: form.website || undefined,
                    phone: form.phone || undefined,
                    email: form.email || undefined,
                    notes: form.notes || undefined,
                })
            }
            setDialogOpen(false)
        })
    }

    const handleDelete = (company: Company) => {
        if (!confirm(`"${company.name}" firmasını silmek istediğinize emin misiniz?`)) return
        startTransition(async () => { await deleteCompany(company.id) })
    }

    const f = (key: keyof typeof form) => ({
        value: form[key],
        onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
            setForm(prev => ({ ...prev, [key]: e.target.value }))
    })

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

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editCompany ? 'Firma Düzenle' : 'Yeni Firma'}</DialogTitle>
                        <DialogDescription>Kurumsal müşteri bilgilerini girin.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
                        <div className="space-y-2">
                            <Label>Firma Adı *</Label>
                            <Input placeholder="ABC Holding A.Ş." {...f('name')} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label>Vergi No</Label>
                                <Input placeholder="1234567890" {...f('tax_number')} />
                            </div>
                            <div className="space-y-2">
                                <Label>Vergi Dairesi</Label>
                                <Input placeholder="Beyoğlu VD" {...f('tax_office')} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label>Ticaret Sicil No</Label>
                                <Input {...f('trade_registry_no')} />
                            </div>
                            <div className="space-y-2">
                                <Label>Sektör</Label>
                                <Input placeholder="İnşaat, Gayrimenkul..." {...f('sector')} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Website</Label>
                            <Input placeholder="https://..." {...f('website')} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label>Telefon</Label>
                                <Input {...f('phone')} />
                            </div>
                            <div className="space-y-2">
                                <Label>E-posta</Label>
                                <Input type="email" {...f('email')} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Notlar</Label>
                            <Textarea rows={2} {...f('notes')} />
                        </div>
                        {editCompany && (
                            <div className="pt-4 border-t mt-4">
                                <AddressManager addresses={[]} ownerId={editCompany.id} ownerType="company" />
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Vazgeç</Button>
                        <Button onClick={handleSave} disabled={isPending || !form.name.trim()}>
                            {isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Kaydediliyor...</> : 'Kaydet'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
