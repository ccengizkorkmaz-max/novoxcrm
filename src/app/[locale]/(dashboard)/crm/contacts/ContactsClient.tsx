'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Phone, Mail, User, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

import NewContactModal from '@/app/[locale]/(dashboard)/crm/components/NewContactModal'

export function ContactsClient({ contacts, profiles = [], locale }: { contacts: any[], profiles?: any[], locale: string }) {
    const [search, setSearch] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(25)

    const filteredContacts = useMemo(() => {
        const term = search.toLowerCase().trim()
        if (!term) return contacts

        return contacts.filter(c => {
            return (c.full_name && c.full_name.toLowerCase().includes(term)) ||
                   (c.phone && c.phone.includes(term)) ||
                   (c.email && c.email.toLowerCase().includes(term))
        })
    }, [contacts, search])

    const totalCount = filteredContacts.length
    const totalPages = Math.ceil(totalCount / pageSize) || 1
    const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages)

    const startIndex = (safeCurrentPage - 1) * pageSize
    const endIndex = Math.min(startIndex + pageSize, totalCount)
    const paginatedContacts = useMemo(() => {
        return filteredContacts.slice(startIndex, endIndex)
    }, [filteredContacts, startIndex, endIndex])

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value)
        setCurrentPage(1)
    }

    const handlePageSizeChange = (val: string) => {
        setPageSize(Number(val))
        setCurrentPage(1)
    }

    return (
        <Card className="shadow-sm border-slate-200">
            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between pb-4 gap-4">
                <div className="flex items-center gap-3">
                    <CardTitle className="text-xl">Rehber</CardTitle>
                    <NewContactModal profiles={profiles} triggerText="Yeni Kontak Ekle" />
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-72">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="İsim, telefon veya e-posta ara..."
                            className="pl-9 bg-white"
                            value={search}
                            onChange={handleSearchChange}
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="rounded-md border overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 border-b text-slate-500">
                            <tr>
                                <th className="px-4 py-3 font-medium">Ad Soyad</th>
                                <th className="px-4 py-3 font-medium">İletişim</th>
                                <th className="px-4 py-3 font-medium">Kaynak</th>
                                <th className="px-4 py-3 font-medium">Durum</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {paginatedContacts.length > 0 ? paginatedContacts.map(contact => (
                                <tr key={contact.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                <User className="h-4 w-4" />
                                            </div>
                                            <span className="font-medium text-slate-900">{contact.full_name || 'İsimsiz'}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 space-y-1">
                                        {contact.phone && (
                                            <div className="flex items-center gap-1.5 text-slate-600">
                                                <Phone className="h-3 w-3" />
                                                <span className="text-xs">{contact.phone}</span>
                                            </div>
                                        )}
                                        {contact.email && (
                                            <div className="flex items-center gap-1.5 text-slate-600">
                                                <Mail className="h-3 w-3" />
                                                <span className="text-xs">{contact.email}</span>
                                            </div>
                                        )}
                                        {!contact.phone && !contact.email && (
                                            <span className="text-xs text-muted-foreground">Belirtilmedi</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge variant="outline" className="text-xs font-normal">
                                            {contact.source === 'Inbox' ? 'Gelen Kutusu' :
                                             contact.source === 'PreEval' ? 'Ön Değerlendirme' : 
                                             contact.source === 'Customer' ? 'Müşteri Kaydı' : contact.source || 'Bilinmiyor'}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3">
                                        {contact.isCustomer ? (
                                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200">
                                                Müşteri
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200">
                                                Kontak
                                            </Badge>
                                        )}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                                        Arama kriterlerine uygun kontak bulunamadı.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalCount > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                            <span>Sayfa başına:</span>
                            <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                                <SelectTrigger className="h-8 w-16 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                            <span>
                                Toplam <strong>{totalCount}</strong> kayıttan <strong>{startIndex + 1}</strong> - <strong>{endIndex}</strong> arası gösteriliyor
                            </span>
                        </div>

                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                disabled={safeCurrentPage <= 1}
                                onClick={() => setCurrentPage(1)}
                                title="İlk Sayfa"
                            >
                                <ChevronsLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                disabled={safeCurrentPage <= 1}
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                title="Önceki Sayfa"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>

                            <span className="px-3 py-1 font-medium bg-slate-50 border rounded-md">
                                {safeCurrentPage} / {totalPages}
                            </span>

                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                disabled={safeCurrentPage >= totalPages}
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                title="Sonraki Sayfa"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                disabled={safeCurrentPage >= totalPages}
                                onClick={() => setCurrentPage(totalPages)}
                                title="Son Sayfa"
                            >
                                <ChevronsRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
