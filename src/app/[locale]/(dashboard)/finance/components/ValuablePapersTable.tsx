'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileDown, Calendar, User, Search, CheckCircle2, XCircle, RotateCcw } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { updateValuablePaperStatus } from '../actions'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Plus } from 'lucide-react'
import ValuablePaperForm from './ValuablePaperForm'

interface ValuablePapersTableProps {
    papers: any[]
}

export default function ValuablePapersTable({ papers }: ValuablePapersTableProps) {
    const [searchTerm, setSearchTerm] = useState('')

    const filteredPapers = papers.filter(p =>
        p.paper_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.issue_number && p.issue_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.customers?.full_name && p.customers.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        const res = await updateValuablePaperStatus(id, newStatus)
        if (res.success) {
            toast.success(`Evrak durumu güncellendi: ${newStatus}`)
        } else {
            toast.error(res.error || 'Güncelleme başarısız.')
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Portföyde': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">Portföyde</Badge>
            case 'Tahsil Edildi': return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">Tahsil Edildi</Badge>
            case 'İade': return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">İade Edildi</Badge>
            case 'Ödendi': return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 border-slate-200">Ödendi</Badge>
            case 'Karşılıksız': return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200">Karşılıksız</Badge>
            // Fallback for old data
            case 'Portfolio': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">Portföyde</Badge>
            case 'Collected': return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">Tahsil Edildi</Badge>
            default: return <Badge variant="outline">{status}</Badge>
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Müşteri veya evrak no ile ara..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button className="bg-emerald-600 hover:bg-emerald-700">
                                <Plus className="h-4 w-4 mr-2" /> Yeni Evrak Girişi
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <ValuablePaperForm />
                        </DialogContent>
                    </Dialog>

                    <Button variant="outline" size="sm">
                        <FileDown className="h-4 w-4 mr-2" /> Dışa Aktar
                    </Button>
                </div>
            </div>

            <div className="rounded-md border bg-white overflow-hidden shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50">
                            <TableHead>Vade Tarihi</TableHead>
                            <TableHead>Evrak Detayı</TableHead>
                            <TableHead>Keşideci / Borçlu</TableHead>
                            <TableHead>Cari / Proje</TableHead>
                            <TableHead className="text-right">Tutar</TableHead>
                            <TableHead>Durum</TableHead>
                            <TableHead className="text-right">İşlemler</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredPapers.length > 0 ? (
                            filteredPapers.map((paper) => {
                                const isExpired = new Date(paper.due_date) < new Date() && (paper.status === 'Portföyde' || paper.status === 'Portfolio')

                                return (
                                    <TableRow key={paper.id} className="hover:bg-slate-50/50">
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Calendar className={`h-4 w-4 ${isExpired ? 'text-red-500' : 'text-slate-400'}`} />
                                                <span className={`text-sm font-medium ${isExpired ? 'text-red-600 font-bold' : ''}`}>
                                                    {new Date(paper.due_date).toLocaleDateString('tr-TR')}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-1">
                                                    <Badge variant="outline" className="text-[9px] py-0 px-1 font-normal">
                                                        {paper.direction || 'Alınan'}
                                                    </Badge>
                                                    <span className="text-sm font-semibold">{paper.paper_type === 'Check' ? 'Çek' : 'Senet'}</span>
                                                </div>
                                                <span className="text-[10px] text-muted-foreground">No: {paper.issue_number || '-'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm">{paper.issuer || '-'}</span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-1">
                                                    <User className="h-3 w-3 text-slate-400" />
                                                    <span className="text-sm">{paper.customers?.full_name}</span>
                                                </div>
                                                {paper.project?.name && (
                                                    <span className="text-[10px] text-muted-foreground ml-4">
                                                        {paper.project.name} {paper.unit && `(${paper.unit.block}-${paper.unit.unit_number})`}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className="font-mono font-black text-slate-900">
                                                {formatCurrency(paper.amount, paper.currency)}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(paper.status)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {(paper.status === 'Portföyde' || paper.status === 'Portfolio') && (
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-emerald-600 hover:bg-emerald-50"
                                                        onClick={() => handleStatusUpdate(paper.id, 'Tahsil Edildi')}
                                                        title="Tahsil Edildi"
                                                    >
                                                        <CheckCircle2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-600 hover:bg-red-50"
                                                        onClick={() => handleStatusUpdate(paper.id, 'İade')}
                                                        title="İade Et"
                                                    >
                                                        <XCircle className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}
                                            {(paper.status !== 'Portföyde' && paper.status !== 'Portfolio') && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400"
                                                    onClick={() => handleStatusUpdate(paper.id, 'Portföyde')}
                                                    title="Geri Al"
                                                >
                                                    <RotateCcw className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground italic">
                                    Kıymetli evrak bulunamadı.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
