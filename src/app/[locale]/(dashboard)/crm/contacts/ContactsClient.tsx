'use client'

import { useState, useMemo, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Search, Phone, Mail, User, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
    Plus, Upload, Download, Tag, Trash2, Building2, MapPin, Loader2, FileSpreadsheet,
    X, Filter, Users, UserPlus
} from 'lucide-react'
import { toast } from 'sonner'
import {
    createContact, deleteContact, deleteContacts,
    updateContactTags, bulkUpdateContactTags,
    importContactsFromExcel, exportContacts
} from './actions'

// ── Tag presets ──
const TAG_PRESETS = [
    { value: 'VIP', label: '⭐ VIP', color: 'bg-amber-100 text-amber-800 border-amber-300' },
    { value: 'Sıcak', label: '🔥 Sıcak', color: 'bg-red-100 text-red-700 border-red-300' },
    { value: 'Soğuk', label: '❄️ Soğuk', color: 'bg-blue-100 text-blue-700 border-blue-300' },
    { value: 'Yeni', label: '🆕 Yeni', color: 'bg-green-100 text-green-700 border-green-300' },
    { value: 'Takipte', label: '👁️ Takipte', color: 'bg-purple-100 text-purple-700 border-purple-300' },
    { value: 'Potansiyel', label: '🎯 Potansiyel', color: 'bg-cyan-100 text-cyan-700 border-cyan-300' },
    { value: 'Yatırımcı', label: '💰 Yatırımcı', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
    { value: 'Broker', label: '🏢 Broker', color: 'bg-indigo-100 text-indigo-700 border-indigo-300' },
    { value: 'Referans', label: '🤝 Referans', color: 'bg-orange-100 text-orange-700 border-orange-300' },
    { value: 'Pasif', label: '💤 Pasif', color: 'bg-slate-100 text-slate-600 border-slate-300' },
]

function getTagStyle(tag: string) {
    const preset = TAG_PRESETS.find(t => t.value === tag)
    return preset?.color || 'bg-slate-100 text-slate-700 border-slate-200'
}

function getTagLabel(tag: string) {
    const preset = TAG_PRESETS.find(t => t.value === tag)
    return preset?.label || tag
}

export function ContactsClient({ contacts, locale, userRole }: {
    contacts: any[]
    locale: string
    userRole?: string
}) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const fileInputRef = useRef<HTMLInputElement>(null)

    // ── Filters ──
    const [search, setSearch] = useState('')
    const [filterSource, setFilterSource] = useState('__all__')
    const [filterTag, setFilterTag] = useState('__all__')
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(25)

    // ── Selection ──
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

    // ── Modals ──
    const [showAddModal, setShowAddModal] = useState(false)
    const [showImportModal, setShowImportModal] = useState(false)
    const [showBulkTagModal, setShowBulkTagModal] = useState(false)
    const [importFile, setImportFile] = useState<File | null>(null)
    const [importTags, setImportTags] = useState('')

    // ── New Contact Form ──
    const [newName, setNewName] = useState('')
    const [newPhone, setNewPhone] = useState('')
    const [newEmail, setNewEmail] = useState('')
    const [newCompany, setNewCompany] = useState('')
    const [newTitle, setNewTitle] = useState('')
    const [newSource, setNewSource] = useState('Manuel Giriş')
    const [newTags, setNewTags] = useState<string[]>([])
    const [newNotes, setNewNotes] = useState('')
    const [newCity, setNewCity] = useState('')

    // ── Bulk tag ──
    const [bulkTags, setBulkTags] = useState<string[]>([])

    // ── Derived data ──
    const allSources = useMemo(() => {
        const sources = new Set(contacts.map(c => c.source).filter(Boolean))
        return Array.from(sources).sort()
    }, [contacts])

    const allTags = useMemo(() => {
        const tags = new Set<string>()
        contacts.forEach(c => (c.tags || []).forEach((t: string) => tags.add(t)))
        return Array.from(tags).sort()
    }, [contacts])

    // ── Filtering ──
    const filteredContacts = useMemo(() => {
        let result = contacts

        // Search
        const term = search.toLowerCase().trim()
        if (term) {
            result = result.filter(c =>
                (c.full_name && c.full_name.toLowerCase().includes(term)) ||
                (c.phone && c.phone.includes(term)) ||
                (c.email && c.email.toLowerCase().includes(term)) ||
                (c.company && c.company.toLowerCase().includes(term))
            )
        }

        // Source filter
        if (filterSource !== '__all__') {
            result = result.filter(c => c.source === filterSource)
        }

        // Tag filter
        if (filterTag !== '__all__') {
            result = result.filter(c => (c.tags || []).includes(filterTag))
        }

        return result
    }, [contacts, search, filterSource, filterTag])

    // ── Pagination ──
    const totalCount = filteredContacts.length
    const totalPages = Math.ceil(totalCount / pageSize) || 1
    const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages)
    const startIndex = (safeCurrentPage - 1) * pageSize
    const endIndex = Math.min(startIndex + pageSize, totalCount)
    const paginatedContacts = filteredContacts.slice(startIndex, endIndex)

    // ── Selection helpers ──
    const allOnPageSelected = paginatedContacts.length > 0 && paginatedContacts.every(c => selectedIds.has(c.id))
    const someSelected = selectedIds.size > 0

    const toggleSelect = (id: string) => {
        const next = new Set(selectedIds)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        setSelectedIds(next)
    }

    const toggleSelectAll = () => {
        if (allOnPageSelected) {
            const next = new Set(selectedIds)
            paginatedContacts.forEach(c => next.delete(c.id))
            setSelectedIds(next)
        } else {
            const next = new Set(selectedIds)
            paginatedContacts.forEach(c => next.add(c.id))
            setSelectedIds(next)
        }
    }

    // ── Handlers ──
    const resetNewForm = () => {
        setNewName(''); setNewPhone(''); setNewEmail(''); setNewCompany('')
        setNewTitle(''); setNewSource('Manuel Giriş'); setNewTags([]); setNewNotes(''); setNewCity('')
    }

    const handleCreateContact = () => {
        if (!newName.trim()) { toast.error('Ad Soyad zorunludur.'); return }

        startTransition(async () => {
            const fd = new FormData()
            fd.append('full_name', newName.trim())
            if (newPhone.trim()) fd.append('phone', newPhone.trim())
            if (newEmail.trim()) fd.append('email', newEmail.trim())
            if (newCompany.trim()) fd.append('company', newCompany.trim())
            if (newTitle.trim()) fd.append('title', newTitle.trim())
            fd.append('source', newSource)
            if (newTags.length > 0) fd.append('tags', newTags.join(','))
            if (newNotes.trim()) fd.append('notes', newNotes.trim())
            if (newCity.trim()) fd.append('city', newCity.trim())

            const res = await createContact(fd)
            if (res?.error) toast.error(res.error)
            else {
                toast.success(`"${newName}" kontağı eklendi!`)
                setShowAddModal(false)
                resetNewForm()
                router.refresh()
            }
        })
    }

    const handleDelete = (id: string, name: string) => {
        if (!confirm(`"${name}" kontağını silmek istediğinize emin misiniz?`)) return
        startTransition(async () => {
            const res = await deleteContact(id)
            if (res?.error) toast.error(res.error)
            else { toast.success('Kontak silindi'); router.refresh() }
        })
    }

    const handleBulkDelete = () => {
        if (!confirm(`${selectedIds.size} kontağı silmek istediğinize emin misiniz?`)) return
        startTransition(async () => {
            const res = await deleteContacts(Array.from(selectedIds))
            if (res?.error) toast.error(res.error)
            else {
                toast.success(`${res.count} kontak silindi`)
                setSelectedIds(new Set())
                router.refresh()
            }
        })
    }

    const handleBulkTag = () => {
        startTransition(async () => {
            const res = await bulkUpdateContactTags(Array.from(selectedIds), bulkTags)
            if (res?.error) toast.error(res.error)
            else {
                toast.success(`${res.count} kontak etiketlendi`)
                setShowBulkTagModal(false)
                setSelectedIds(new Set())
                setBulkTags([])
                router.refresh()
            }
        })
    }

    const handleTagToggle = (contactId: string, currentTags: string[], tag: string) => {
        const newTags = currentTags.includes(tag)
            ? currentTags.filter(t => t !== tag)
            : [...currentTags, tag]
        startTransition(async () => {
            const res = await updateContactTags(contactId, newTags)
            if (res?.error) toast.error(res.error)
            else router.refresh()
        })
    }

    const handleImport = () => {
        if (!importFile) { toast.error('Lütfen bir dosya seçin.'); return }
        startTransition(async () => {
            const fd = new FormData()
            fd.append('file', importFile)
            if (importTags.trim()) fd.append('import_tags', importTags.trim())

            const res = await importContactsFromExcel(fd)
            if (res?.error) toast.error(res.error)
            else {
                toast.success(res.message || `${res.inserted} kontak aktarıldı`)
                setShowImportModal(false)
                setImportFile(null)
                setImportTags('')
                router.refresh()
            }
        })
    }

    const handleExport = () => {
        startTransition(async () => {
            const filters: any = {}
            if (filterSource !== '__all__') filters.source = filterSource
            if (filterTag !== '__all__') filters.tag = filterTag

            const res = await exportContacts(Object.keys(filters).length > 0 ? filters : undefined)
            if (res?.error) { toast.error(res.error); return }
            if (res?.base64) {
                const blob = new Blob(
                    [Uint8Array.from(atob(res.base64), c => c.charCodeAt(0))],
                    { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
                )
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = res.filename || 'kontaklar.xlsx'
                a.click()
                URL.revokeObjectURL(url)
                toast.success(`${res.count} kontak dışa aktarıldı`)
            }
        })
    }

    const toggleNewTag = (tag: string) => {
        setNewTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
    }

    const toggleBulkTag = (tag: string) => {
        setBulkTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
    }

    // ── Stats ──
    const stats = useMemo(() => ({
        total: contacts.length,
        thisWeek: contacts.filter(c => {
            const d = new Date(c.created_at)
            const now = new Date()
            const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
            return diff <= 7
        }).length,
        tagged: contacts.filter(c => c.tags && c.tags.length > 0).length
    }), [contacts])

    return (
        <div className="space-y-4">
            {/* ── Header ── */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Users className="h-6 w-6 text-blue-600" />
                        Kontak Rehberi
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Toplam <strong>{stats.total}</strong> kontak · Bu hafta <strong>{stats.thisWeek}</strong> yeni · <strong>{stats.tagged}</strong> etiketli
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Import */}
                    <Button variant="outline" size="sm" onClick={() => setShowImportModal(true)} className="gap-1.5">
                        <Upload className="h-3.5 w-3.5" />
                        Excel Import
                    </Button>
                    {/* Export */}
                    <Button variant="outline" size="sm" onClick={handleExport} disabled={isPending} className="gap-1.5">
                        <Download className="h-3.5 w-3.5" />
                        Export
                    </Button>
                    {/* Add Contact */}
                    <Button size="sm" onClick={() => setShowAddModal(true)} className="gap-1.5 bg-blue-600 hover:bg-blue-700">
                        <UserPlus className="h-3.5 w-3.5" />
                        Yeni Kontak
                    </Button>
                </div>
            </div>

            {/* ── Filters ── */}
            <Card className="shadow-sm border-slate-200">
                <CardContent className="py-3 px-4">
                    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="İsim, telefon, e-posta veya firma ara..."
                                className="pl-9 bg-white h-9"
                                value={search}
                                onChange={e => { setSearch(e.target.value); setCurrentPage(1) }}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Select value={filterSource} onValueChange={v => { setFilterSource(v); setCurrentPage(1) }}>
                                <SelectTrigger className="h-9 w-[160px] text-xs">
                                    <Filter className="h-3 w-3 mr-1" />
                                    <SelectValue placeholder="Kaynak" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__all__">Tüm Kaynaklar</SelectItem>
                                    {allSources.map(s => (
                                        <SelectItem key={s} value={s}>{s}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={filterTag} onValueChange={v => { setFilterTag(v); setCurrentPage(1) }}>
                                <SelectTrigger className="h-9 w-[160px] text-xs">
                                    <Tag className="h-3 w-3 mr-1" />
                                    <SelectValue placeholder="Etiket" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__all__">Tüm Etiketler</SelectItem>
                                    {allTags.map(t => (
                                        <SelectItem key={t} value={t}>{getTagLabel(t)}</SelectItem>
                                    ))}
                                    {TAG_PRESETS.filter(tp => !allTags.includes(tp.value)).map(tp => (
                                        <SelectItem key={tp.value} value={tp.value} className="text-muted-foreground">{tp.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {(filterSource !== '__all__' || filterTag !== '__all__' || search) && (
                                <Button variant="ghost" size="sm" onClick={() => { setFilterSource('__all__'); setFilterTag('__all__'); setSearch(''); setCurrentPage(1) }} className="h-9 px-2">
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Bulk actions bar */}
                    {someSelected && (
                        <div className="mt-3 flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                            <span className="text-xs font-medium text-blue-700">{selectedIds.size} kontak seçili</span>
                            <Button variant="outline" size="sm" onClick={() => setShowBulkTagModal(true)} className="h-7 text-xs gap-1">
                                <Tag className="h-3 w-3" /> Etiketle
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleBulkDelete} disabled={isPending} className="h-7 text-xs gap-1 text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50">
                                <Trash2 className="h-3 w-3" /> Sil
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())} className="h-7 text-xs">
                                Seçimi Temizle
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ── Table ── */}
            <Card className="shadow-sm border-slate-200">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 border-b text-slate-500 text-xs">
                                <tr>
                                    <th className="px-3 py-2.5 w-10">
                                        <Checkbox
                                            checked={allOnPageSelected}
                                            onCheckedChange={toggleSelectAll}
                                        />
                                    </th>
                                    <th className="px-3 py-2.5 font-medium">Ad Soyad</th>
                                    <th className="px-3 py-2.5 font-medium">İletişim</th>
                                    <th className="px-3 py-2.5 font-medium">Firma</th>
                                    <th className="px-3 py-2.5 font-medium">Kaynak</th>
                                    <th className="px-3 py-2.5 font-medium">Etiketler</th>
                                    <th className="px-3 py-2.5 font-medium">Tarih</th>
                                    <th className="px-3 py-2.5 font-medium w-16">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedContacts.length > 0 ? paginatedContacts.map(contact => (
                                    <tr key={contact.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-3 py-2.5">
                                            <Checkbox
                                                checked={selectedIds.has(contact.id)}
                                                onCheckedChange={() => toggleSelect(contact.id)}
                                            />
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-600 font-semibold text-xs flex-shrink-0">
                                                    {(contact.full_name || '?')[0]?.toUpperCase()}
                                                </div>
                                                <div>
                                                    <span className="font-medium text-slate-900 text-sm">{contact.full_name || 'İsimsiz'}</span>
                                                    {contact.title && (
                                                        <p className="text-[10px] text-muted-foreground">{contact.title}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <div className="space-y-0.5">
                                                {contact.phone && (
                                                    <div className="flex items-center gap-1 text-slate-600">
                                                        <Phone className="h-3 w-3 flex-shrink-0" />
                                                        <span className="text-xs">{contact.phone}</span>
                                                    </div>
                                                )}
                                                {contact.email && (
                                                    <div className="flex items-center gap-1 text-slate-600">
                                                        <Mail className="h-3 w-3 flex-shrink-0" />
                                                        <span className="text-xs truncate max-w-[180px]">{contact.email}</span>
                                                    </div>
                                                )}
                                                {!contact.phone && !contact.email && (
                                                    <span className="text-xs text-muted-foreground">—</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2.5">
                                            {contact.company ? (
                                                <div className="flex items-center gap-1 text-xs text-slate-600">
                                                    <Building2 className="h-3 w-3 flex-shrink-0" />
                                                    <span className="truncate max-w-[140px]">{contact.company}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">—</span>
                                            )}
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <Badge variant="outline" className="text-[10px] font-normal whitespace-nowrap">
                                                {contact.source || 'Bilinmiyor'}
                                            </Badge>
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <div className="flex items-center gap-1 flex-wrap">
                                                {(contact.tags || []).map((tag: string) => (
                                                    <span
                                                        key={tag}
                                                        className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-semibold rounded border cursor-pointer hover:opacity-70 ${getTagStyle(tag)}`}
                                                        onClick={() => handleTagToggle(contact.id, contact.tags || [], tag)}
                                                        title="Kaldırmak için tıklayın"
                                                    >
                                                        {getTagLabel(tag)}
                                                    </span>
                                                ))}
                                                <Select onValueChange={v => handleTagToggle(contact.id, contact.tags || [], v)}>
                                                    <SelectTrigger className="h-5 w-5 p-0 border-dashed border-slate-300 opacity-0 group-hover:opacity-100 transition-opacity [&>svg]:hidden">
                                                        <Plus className="h-3 w-3 text-muted-foreground" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {TAG_PRESETS.filter(tp => !(contact.tags || []).includes(tp.value)).map(tp => (
                                                            <SelectItem key={tp.value} value={tp.value} className="text-xs">{tp.label}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2.5 text-[11px] text-muted-foreground whitespace-nowrap">
                                            {contact.created_at ? new Date(contact.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => handleDelete(contact.id, contact.full_name)}
                                                disabled={isPending}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-12 text-center">
                                            <Users className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                                            <p className="text-sm text-muted-foreground">
                                                {search || filterSource !== '__all__' || filterTag !== '__all__'
                                                    ? 'Filtre kriterlerine uygun kontak bulunamadı.'
                                                    : 'Henüz kontak eklenmemiş.'}
                                            </p>
                                            {!search && filterSource === '__all__' && filterTag === '__all__' && (
                                                <div className="flex items-center gap-2 justify-center mt-3">
                                                    <Button size="sm" onClick={() => setShowAddModal(true)} className="gap-1.5">
                                                        <UserPlus className="h-3.5 w-3.5" /> Kontak Ekle
                                                    </Button>
                                                    <Button variant="outline" size="sm" onClick={() => setShowImportModal(true)} className="gap-1.5">
                                                        <Upload className="h-3.5 w-3.5" /> Excel İçe Aktar
                                                    </Button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalCount > 0 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3 border-t text-xs text-slate-600">
                            <div className="flex items-center gap-2">
                                <span>Sayfa başına:</span>
                                <Select value={String(pageSize)} onValueChange={v => { setPageSize(Number(v)); setCurrentPage(1) }}>
                                    <SelectTrigger className="h-7 w-16 text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="25">25</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                    </SelectContent>
                                </Select>
                                <span>Toplam <strong>{totalCount}</strong> kayıt · {startIndex + 1}-{endIndex}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button variant="outline" size="icon" className="h-7 w-7" disabled={safeCurrentPage <= 1} onClick={() => setCurrentPage(1)}>
                                    <ChevronsLeft className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="outline" size="icon" className="h-7 w-7" disabled={safeCurrentPage <= 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                </Button>
                                <span className="px-3 py-1 font-medium bg-slate-50 border rounded text-xs">{safeCurrentPage} / {totalPages}</span>
                                <Button variant="outline" size="icon" className="h-7 w-7" disabled={safeCurrentPage >= totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="outline" size="icon" className="h-7 w-7" disabled={safeCurrentPage >= totalPages} onClick={() => setCurrentPage(totalPages)}>
                                    <ChevronsRight className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ════════ ADD CONTACT MODAL ════════ */}
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5 text-blue-600" /> Yeni Kontak Ekle</DialogTitle>
                        <DialogDescription>Kontak bilgilerini girin</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs">Ad Soyad *</Label>
                                <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ahmet Yılmaz" className="h-9" />
                            </div>
                            <div>
                                <Label className="text-xs">Telefon</Label>
                                <Input value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="05XX XXX XX XX" className="h-9" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs">E-Posta</Label>
                                <Input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="ornek@mail.com" className="h-9" />
                            </div>
                            <div>
                                <Label className="text-xs">Firma</Label>
                                <Input value={newCompany} onChange={e => setNewCompany(e.target.value)} placeholder="Şirket adı" className="h-9" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs">Ünvan</Label>
                                <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Genel Müdür" className="h-9" />
                            </div>
                            <div>
                                <Label className="text-xs">Şehir</Label>
                                <Input value={newCity} onChange={e => setNewCity(e.target.value)} placeholder="İstanbul" className="h-9" />
                            </div>
                        </div>
                        <div>
                            <Label className="text-xs">Kaynak</Label>
                            <Select value={newSource} onValueChange={setNewSource}>
                                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Manuel Giriş">Manuel Giriş</SelectItem>
                                    <SelectItem value="Referans">Referans</SelectItem>
                                    <SelectItem value="Fuar">Fuar</SelectItem>
                                    <SelectItem value="Networking">Networking</SelectItem>
                                    <SelectItem value="Sosyal Medya">Sosyal Medya</SelectItem>
                                    <SelectItem value="Web Sitesi">Web Sitesi</SelectItem>
                                    <SelectItem value="Telefon">Telefon</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="text-xs mb-1.5 block">Etiketler</Label>
                            <div className="flex flex-wrap gap-1.5">
                                {TAG_PRESETS.map(tp => (
                                    <button
                                        key={tp.value}
                                        type="button"
                                        onClick={() => toggleNewTag(tp.value)}
                                        className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded border cursor-pointer transition-all ${
                                            newTags.includes(tp.value)
                                                ? tp.color + ' ring-2 ring-offset-1 ring-blue-400'
                                                : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
                                        }`}
                                    >
                                        {tp.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <Label className="text-xs">Not</Label>
                            <Textarea value={newNotes} onChange={e => setNewNotes(e.target.value)} placeholder="Ek notlar..." rows={2} className="text-sm" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddModal(false)}>İptal</Button>
                        <Button onClick={handleCreateContact} disabled={isPending} className="gap-1.5 bg-blue-600 hover:bg-blue-700">
                            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                            Ekle
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ════════ IMPORT MODAL ════════ */}
            <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><FileSpreadsheet className="h-5 w-5 text-green-600" /> Excel İçe Aktarma</DialogTitle>
                        <DialogDescription>Excel veya CSV dosyasından toplu kontak aktarın</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label className="text-xs mb-2 block">Dosya Seçin (.xlsx, .xls, .csv)</Label>
                            <div
                                className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer hover:bg-slate-50 transition-colors"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {importFile ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <FileSpreadsheet className="h-5 w-5 text-green-600" />
                                        <span className="text-sm font-medium">{importFile.name}</span>
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={e => { e.stopPropagation(); setImportFile(null) }}>
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div>
                                        <Upload className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                                        <p className="text-sm text-muted-foreground">Dosya seçmek için tıklayın</p>
                                        <p className="text-[10px] text-muted-foreground mt-1">Otomatik sütun algılama aktif</p>
                                    </div>
                                )}
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                className="hidden"
                                onChange={e => setImportFile(e.target.files?.[0] || null)}
                            />
                        </div>
                        <div>
                            <Label className="text-xs">İçe aktarılan kontaklara etiket ekle (opsiyonel)</Label>
                            <Input
                                value={importTags}
                                onChange={e => setImportTags(e.target.value)}
                                placeholder="VIP, Potansiyel"
                                className="h-9 mt-1"
                            />
                            <p className="text-[10px] text-muted-foreground mt-1">Virgülle ayırarak birden fazla etiket ekleyebilirsiniz</p>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-xs text-blue-700 font-medium mb-1">📋 Desteklenen Sütunlar:</p>
                            <p className="text-[10px] text-blue-600">Ad Soyad, Telefon, E-Posta, Firma, Kaynak, Not, Şehir, Etiket</p>
                            <p className="text-[10px] text-blue-600 mt-1">Sütun isimleri otomatik algılanır. Mükerrer telefon/e-posta atlanır.</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowImportModal(false)}>İptal</Button>
                        <Button onClick={handleImport} disabled={isPending || !importFile} className="gap-1.5 bg-green-600 hover:bg-green-700">
                            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                            İçe Aktar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ════════ BULK TAG MODAL ════════ */}
            <Dialog open={showBulkTagModal} onOpenChange={setShowBulkTagModal}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><Tag className="h-5 w-5 text-purple-600" /> Toplu Etiketleme</DialogTitle>
                        <DialogDescription>{selectedIds.size} kontak etiketlenecek</DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-wrap gap-1.5 py-4">
                        {TAG_PRESETS.map(tp => (
                            <button
                                key={tp.value}
                                type="button"
                                onClick={() => toggleBulkTag(tp.value)}
                                className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded border cursor-pointer transition-all ${
                                    bulkTags.includes(tp.value)
                                        ? tp.color + ' ring-2 ring-offset-1 ring-blue-400'
                                        : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
                                }`}
                            >
                                {tp.label}
                            </button>
                        ))}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowBulkTagModal(false)}>İptal</Button>
                        <Button onClick={handleBulkTag} disabled={isPending} className="gap-1.5">
                            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Tag className="h-4 w-4" />}
                            Etiketle
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
