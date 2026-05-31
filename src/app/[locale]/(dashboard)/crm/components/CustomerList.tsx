'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from '@/lib/utils'
import { UserPlus, Pencil, Trash, Mail, Phone, Tag, CalendarPlus, AlertTriangle, Users, Search, ArrowUpDown, ArrowUp, ArrowDown, PieChart, Target, TrendingUp, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Filter, X } from 'lucide-react'
import ColumnVisibilityPicker from '@/components/ui/column-visibility-picker'
import ColumnFilterRow from '@/components/ui/column-filter-row'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from "@/components/ui/card"
import { createCustomer, updateCustomer, deleteCustomer } from '../actions'
import CustomerDemands from './CustomerDemands'
import { CustomerImportDialog } from '@/components/customers/customer-import-dialog'
import { CustomerEditDialog, type Customer } from './CustomerEditDialog'
import { MergeDuplicatesDialog } from './MergeDuplicatesDialog'
import { ActivityForm } from '@/components/activities/activity-form'
import { toast } from 'sonner'
import { useRouter, useSearchParams } from 'next/navigation'

type SortKey = 'full_name' | 'created_at'
type SortOrder = 'asc' | 'desc'

type ColumnId = 'name' | 'phone' | 'email' | 'source' | 'status' | 'date' | 'actions'

const DEFAULT_COLUMN_ORDER: ColumnId[] = ['name', 'phone', 'email', 'source', 'status', 'date', 'actions']
const COLUMN_STORAGE_KEY = 'customer_list_column_order'
const COLUMN_WIDTHS_KEY = 'customer_list_column_widths'

const DEFAULT_WIDTHS: Record<ColumnId, number> = {
    name: 250, phone: 150, email: 200, source: 150, status: 120, date: 140, actions: 110
}
const CUSTOMER_HIDDEN_COLS_KEY = 'customer_list_hidden_cols'
const CUSTOMER_COL_LABELS: Record<ColumnId, string> = {
    name: 'Müşteri Adı', phone: 'Telefon', email: 'E-posta', source: 'Kaynak', status: 'Durum', date: 'Kayıt Tarihi', actions: 'İşlemler'
}

export default function CustomerList({
    customers,
    totalRecords = 0,
    initialPage = 1,
    sourceStats = {},
    profiles = [],
    projects = [],
    isManager = false,
    initialSort = { key: 'created_at' as const, order: 'desc' as const }
}: {
    customers: Customer[],
    totalRecords?: number,
    initialPage?: number,
    sourceStats?: Record<string, number>,
    profiles?: any[],
    projects?: any[],
    isManager?: boolean,
    initialSort?: { key: 'full_name' | 'created_at'; order: 'asc' | 'desc' }
}) {
    const t = useTranslations('Customers')
    const router = useRouter()
    const searchParams = useSearchParams()
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [isMergeOpen, setIsMergeOpen] = useState(false)
    const [isActivityOpen, setIsActivityOpen] = useState(false)
    const [selectedCustomerForActivity, setSelectedCustomerForActivity] = useState<Customer | null>(null)
    const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null)
    const [isPending, setIsPending] = useState(false)
    const [customerType, setCustomerType] = useState<'individual' | 'corporate'>('individual')

    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; order: SortOrder }>({
        key: initialSort.key,
        order: initialSort.order
    })

    const [currentPage, setCurrentPage] = useState(initialPage)
    const [pageInputValue, setPageInputValue] = useState(initialPage.toString())
    const itemsPerPage = 50

    // Hidden columns
    const [hiddenCols, setHiddenCols] = useState<string[]>(() => {
        if (typeof window !== 'undefined') {
            try {
                const saved = localStorage.getItem(CUSTOMER_HIDDEN_COLS_KEY)
                if (saved) return JSON.parse(saved)
            } catch {}
        }
        return []
    })

    const toggleColVisibility = (colId: string) => {
        setHiddenCols(prev => {
            const next = prev.includes(colId) ? prev.filter(c => c !== colId) : [...prev, colId]
            try { localStorage.setItem(CUSTOMER_HIDDEN_COLS_KEY, JSON.stringify(next)) } catch {}
            return next
        })
    }

    const resetColVisibility = () => {
        setHiddenCols([])
        try { localStorage.removeItem(CUSTOMER_HIDDEN_COLS_KEY) } catch {}
    }

    const customerColumns = DEFAULT_COLUMN_ORDER.map(colId => ({
        id: colId,
        label: CUSTOMER_COL_LABELS[colId],
        required: colId === 'name'
    }))

    // Column ordering (drag & drop)
    const [columnOrder, setColumnOrder] = useState<ColumnId[]>(() => {
        if (typeof window !== 'undefined') {
            try {
                const saved = localStorage.getItem(COLUMN_STORAGE_KEY)
                if (saved) {
                    const parsed = JSON.parse(saved) as ColumnId[]
                    // Validate saved order contains all expected columns
                    if (DEFAULT_COLUMN_ORDER.every(c => parsed.includes(c)) && parsed.length === DEFAULT_COLUMN_ORDER.length) {
                        return parsed
                    }
                }
            } catch {}
        }
        return DEFAULT_COLUMN_ORDER
    })
    const dragColRef = useRef<ColumnId | null>(null)
    const [dragOverCol, setDragOverCol] = useState<ColumnId | null>(null)

    const handleDragStart = useCallback((col: ColumnId) => {
        dragColRef.current = col
    }, [])

    const handleDragOver = useCallback((e: React.DragEvent, col: ColumnId) => {
        e.preventDefault()
        if (dragColRef.current && dragColRef.current !== col) {
            setDragOverCol(col)
        }
    }, [])

    const handleDrop = useCallback((targetCol: ColumnId) => {
        const draggedCol = dragColRef.current
        if (!draggedCol || draggedCol === targetCol) {
            setDragOverCol(null)
            return
        }
        setColumnOrder(prev => {
            const next = [...prev]
            const fromIdx = next.indexOf(draggedCol)
            const toIdx = next.indexOf(targetCol)
            next.splice(fromIdx, 1)
            next.splice(toIdx, 0, draggedCol)
            try { localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(next)) } catch {}
            return next
        })
        setDragOverCol(null)
        dragColRef.current = null
    }, [])

    const handleDragEnd = useCallback(() => {
        setDragOverCol(null)
        dragColRef.current = null
    }, [])

    // Column resizing
    const [columnWidths, setColumnWidths] = useState<Record<ColumnId, number>>(() => {
        if (typeof window !== 'undefined') {
            try {
                const saved = localStorage.getItem(COLUMN_WIDTHS_KEY)
                if (saved) {
                    const parsed = JSON.parse(saved)
                    // merge with defaults to handle new columns
                    return { ...DEFAULT_WIDTHS, ...parsed }
                }
            } catch {}
        }
        return { ...DEFAULT_WIDTHS }
    })

    const resizeRef = useRef<{ col: ColumnId; startX: number; startW: number } | null>(null)

    const handleResizeMouseDown = useCallback((e: React.MouseEvent, col: ColumnId) => {
        e.preventDefault()
        e.stopPropagation()
        const startX = e.clientX
        const startW = columnWidths[col]
        resizeRef.current = { col, startX, startW }

        const onMouseMove = (ev: MouseEvent) => {
            const delta = ev.clientX - startX
            const newW = Math.max(60, startW + delta)
            setColumnWidths(prev => {
                const next = { ...prev, [col]: newW }
                try { localStorage.setItem(COLUMN_WIDTHS_KEY, JSON.stringify(next)) } catch {}
                return next
            })
        }

        const onMouseUp = () => {
            resizeRef.current = null
            document.removeEventListener('mousemove', onMouseMove)
            document.removeEventListener('mouseup', onMouseUp)
        }

        document.addEventListener('mousemove', onMouseMove)
        document.addEventListener('mouseup', onMouseUp)
    }, [columnWidths])

    // Auto-search after 600ms of typing to hit backend instead of strictly requiring ENTER
    useEffect(() => {
        const timer = setTimeout(() => {
            const url = new URL(window.location.href)
            if (searchQuery) {
                if (url.searchParams.get('q') !== searchQuery) {
                    url.searchParams.set('q', searchQuery)
                    url.searchParams.delete('page')
                    window.history.pushState({}, '', url)
                    router.refresh()
                }
            } else if (url.searchParams.has('q')) {
                url.searchParams.delete('q')
                window.history.pushState({}, '', url)
                router.refresh()
            }
        }, 600)

        return () => clearTimeout(timer)
    }, [searchQuery, router])

    // Stats Calculation
    const totalCount = totalRecords
    const sourceCounts = Object.keys(sourceStats).length > 0 ? sourceStats : customers.reduce((acc: Record<string, number>, c) => {
        const src = c.source || 'Belirtilmemiş'
        acc[src] = (acc[src] || 0) + 1
        return acc
    }, {})

    const sortedSources = Object.entries(sourceCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6) // Updated to show more sources as requested

    const handleEditClick = (customer: Customer) => {
        setEditingCustomer(customer)
        setIsEditOpen(true)
    }

    const handleCreateActivity = (customer: Customer) => {
        setSelectedCustomerForActivity(customer)
        setIsActivityOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (!customerToDelete) return

        setIsPending(true)
        const formData = new FormData()
        formData.append('id', customerToDelete.id)

        try {
            const res = await deleteCustomer(formData)
            if (res?.error) {
                toast.error(res.error)
            } else {
                toast.success(t('messages.deleted') || 'Müşteri başarıyla silindi')
                router.refresh()
                setCustomerToDelete(null)
            }
        } catch (error) {
            toast.error('Müşteri silinirken bir sunucu hatası oluştu.')
        } finally {
            setIsPending(false)
        }
    }

    const toggleSort = (key: SortKey) => {
        const newOrder = sortConfig.key === key && sortConfig.order === 'desc' ? 'asc' : 'desc'
        setSortConfig({ key, order: newOrder })
        // Push to URL so server re-fetches the entire dataset sorted
        const params = new URLSearchParams(searchParams.toString())
        params.set('sort', key)
        params.set('order', newOrder)
        params.set('page', '1')
        router.push(`?${params.toString()}`)
    }

    // Data comes pre-sorted from server — just apply local text filter for client-side search
    const filteredAndSortedCustomers = searchQuery
        ? customers.filter(c => {
            const query = searchQuery.toLowerCase()
            return (
                c.full_name?.toLowerCase().includes(query) ||
                c.phone?.includes(query) ||
                c.email?.toLowerCase().includes(query) ||
                c.customer_number?.toLowerCase().includes(query)
            )
        })
        : customers

    const totalPages = Math.ceil(totalRecords / itemsPerPage)

    // Column filters
    const [colFilters, setColFilters] = useState<Record<string, string>>({})
    const [showFilters, setShowFilters] = useState(false)

    const handleColFilter = (colId: string, value: string) => {
        setColFilters(prev => {
            const next = { ...prev }
            if (value) next[colId] = value
            else delete next[colId]
            return next
        })
    }

    const clearAllFilters = () => setColFilters({})
    const activeFilterCount = Object.values(colFilters).filter(v => v.length > 0).length

    // Unique values for select-type filters
    const uniqueSources = [...new Set(customers.map(c => c.source).filter(Boolean))]
    const uniqueStatusTypes = ['Müşteri', 'Aday', 'İletişim']

    const filterableColumns = columnOrder
        .filter(colId => !hiddenCols.includes(colId))
        .map(colId => {
            if (colId === 'source') return { id: colId, label: 'Kaynak', type: 'select' as const, options: uniqueSources }
            if (colId === 'status') return { id: colId, label: 'Durum', type: 'select' as const, options: uniqueStatusTypes }
            if (colId === 'name') return { id: colId, label: 'Ad', type: 'text' as const }
            if (colId === 'phone') return { id: colId, label: 'Tel', type: 'text' as const }
            if (colId === 'email') return { id: colId, label: 'E-posta', type: 'text' as const }
            if (colId === 'date') return { id: colId, label: 'Tarih', type: 'text' as const }
            return { id: colId, label: colId, type: 'text' as const }
        })

    // Apply column filters on top of search filter
    const currentItems = filteredAndSortedCustomers.filter(c => {
        for (const [colId, filterVal] of Object.entries(colFilters)) {
            if (!filterVal) continue
            const q = filterVal.toLowerCase()
            if (colId === 'name') {
                const name = (c.full_name || '').toLowerCase()
                const custNum = (c.customer_number || '').toLowerCase()
                if (!name.includes(q) && !custNum.includes(q)) return false
            } else if (colId === 'phone') {
                if (!(c.phone || '').toLowerCase().includes(q)) return false
            } else if (colId === 'email') {
                if (!(c.email || '').toLowerCase().includes(q)) return false
            } else if (colId === 'source') {
                if ((c.source || '') !== filterVal) return false
            } else if (colId === 'status') {
                const hasContract = c.contract_customers && c.contract_customers.length > 0
                const hasDemands = c.customer_demands && c.customer_demands.length > 0
                const statusLabel = hasContract ? 'Müşteri' : hasDemands ? 'Aday' : 'İletişim'
                if (statusLabel !== filterVal) return false
            } else if (colId === 'date') {
                const dateStr = new Date(c.created_at).toLocaleDateString('tr-TR')
                if (!dateStr.includes(q)) return false
            }
        }
        return true
    })

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('page', newPage.toString())
        router.push(`?${params.toString()}`)
        setCurrentPage(newPage)
    }

    const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
        if (sortConfig.key !== columnKey) return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
        return sortConfig.order === 'asc' ? <ArrowUp className="ml-2 h-4 w-4 text-blue-600" /> : <ArrowDown className="ml-2 h-4 w-4 text-blue-600" />
    }

    return (
        <div className="space-y-6">
            {/* Mini Dashboard — compact */}
            <div className="flex flex-wrap gap-2">
                <Card className="flex-1 min-w-[110px] rounded-lg border-none shadow-sm bg-gradient-to-br from-blue-600 to-blue-700 text-white overflow-hidden">
                    <CardContent className="px-3 py-2">
                        <div className="flex items-center justify-between gap-2">
                            <div>
                                <p className="text-blue-100 text-[9px] font-black uppercase tracking-widest">Toplam</p>
                                <h3 className="text-base font-black leading-tight">{totalCount}</h3>
                            </div>
                            <Users className="h-4 w-4 text-white/60 flex-shrink-0" />
                        </div>
                    </CardContent>
                </Card>

                {sortedSources.map(([source, count], idx) => (
                    <Card key={source} className="flex-1 min-w-[110px] rounded-lg border-none shadow-sm bg-white overflow-hidden">
                        <CardContent className="px-3 py-2">
                            <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest truncate" title={source}>{source}</p>
                                    <h3 className="text-base font-black text-slate-900 leading-tight">{count}</h3>
                                </div>
                                <div className={cn(
                                    "h-5 w-5 rounded flex items-center justify-center flex-shrink-0",
                                    idx === 0 ? "bg-emerald-50 text-emerald-600" :
                                        idx === 1 ? "bg-amber-50 text-amber-600" : "bg-purple-50 text-purple-600"
                                )}>
                                    <Target className="h-3 w-3" />
                                </div>
                            </div>
                            <div className="mt-1.5 h-0.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className={cn(
                                        "h-full rounded-full",
                                        idx === 0 ? "bg-emerald-500" :
                                            idx === 1 ? "bg-amber-500" : "bg-purple-500"
                                    )}
                                    style={{ width: `${(count / totalCount) * 100}%` }}
                                />
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {sortedSources.length < 3 && Array.from({ length: 3 - sortedSources.length }).map((_, i) => (
                    <Card key={`empty-${i}`} className="flex-1 min-w-[110px] rounded-lg border-dashed border border-slate-200 bg-slate-50/50 flex items-center justify-center px-3 py-2">
                        <p className="text-[9px] font-bold uppercase text-slate-300">Veri Bekleniyor</p>
                    </Card>
                ))}
            </div>

            <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
                <div className="flex items-center gap-2 flex-shrink-0 overflow-x-auto pb-1 md:pb-0">
                    <Button variant="outline" className="shadow-sm border-slate-200 text-red-600 hover:bg-red-50 hover:text-red-700 h-11 px-6 rounded-xl font-bold transition-all active:scale-95 whitespace-nowrap" onClick={() => setIsMergeOpen(true)}>
                        <Users className="mr-2 h-5 w-5" /> Mükerrerleri Birleştir
                    </Button>

                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button variant="default" className="shadow-lg shadow-blue-100 bg-blue-600 hover:bg-blue-700 h-11 px-6 rounded-xl font-bold transition-all active:scale-95 whitespace-nowrap">
                                <UserPlus className="mr-2 h-5 w-5" /> {t('addCustomer')}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl w-[95vw] rounded-2xl p-0 overflow-hidden border-none shadow-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader className="p-5 bg-slate-50 border-b border-slate-100">
                                <DialogTitle className="text-xl font-black text-slate-900">{t('createModal.title')}</DialogTitle>
                            </DialogHeader>
                            <form action={async (formData) => {
                                formData.set('customer_type', customerType)
                                setIsPending(true)
                                try {
                                    const res = await createCustomer(formData)
                                    if (res?.error) {
                                        toast.error(res.error)
                                    } else {
                                        toast.success(t('messages.created') || 'Müşteri oluşturuldu')
                                        setIsCreateOpen(false)
                                        setCustomerType('individual')
                                        router.refresh()
                                    }
                                } finally {
                                    setIsPending(false)
                                }
                            }}>
                                <div className="p-5">
                                    {/* Customer Type Toggle */}
                                    <div className="flex items-center gap-3 mb-5 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Müşteri Tipi</Label>
                                        <div className="flex gap-1 bg-white rounded-lg border border-slate-200 p-0.5">
                                            <button type="button" onClick={() => setCustomerType('individual')}
                                                className={cn("px-4 py-1.5 rounded-md text-xs font-bold transition-all", customerType === 'individual' ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-700")}>
                                                Bireysel
                                            </button>
                                            <button type="button" onClick={() => setCustomerType('corporate')}
                                                className={cn("px-4 py-1.5 rounded-md text-xs font-bold transition-all", customerType === 'corporate' ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-700")}>
                                                Kurumsal
                                            </button>
                                        </div>
                                        <input type="hidden" name="customer_type" value={customerType} />
                                    </div>

                                    <Tabs defaultValue="general" className="w-full">
                                        <TabsList className={cn("grid w-full mb-5 bg-slate-100 p-1 rounded-xl", customerType === 'corporate' ? "grid-cols-3" : "grid-cols-2")}>
                                            <TabsTrigger value="general" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">{t('tabs.details')}</TabsTrigger>
                                            {customerType === 'corporate' && (
                                                <TabsTrigger value="company" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Firma Bilgileri</TabsTrigger>
                                            )}
                                            <TabsTrigger value="demands" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">{t('tabs.demands')}</TabsTrigger>
                                        </TabsList>
                                        <TabsContent value="general" forceMount={true} className="data-[state=inactive]:hidden space-y-3">
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="grid gap-1.5">
                                                    <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('form.fullName')}</Label>
                                                    <Input name="full_name" required className="h-10 bg-slate-50 border-slate-200 rounded-xl" />
                                                </div>
                                                <div className="grid gap-1.5">
                                                    <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('form.phone')}</Label>
                                                    <Input name="phone" required className="h-10 bg-slate-50 border-slate-200 rounded-xl" />
                                                </div>
                                                <div className="grid gap-1.5">
                                                    <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('form.email')}</Label>
                                                    <Input name="email" type="email" className="h-10 bg-slate-50 border-slate-200 rounded-xl" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="grid gap-1.5">
                                                    <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('form.source')}</Label>
                                                    <Input name="source" placeholder={t('form.sourcePlaceholder')} className="h-10 bg-slate-50 border-slate-200 rounded-xl" />
                                                </div>
                                                <div className="grid gap-1.5">
                                                    <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('form.city')}</Label>
                                                    <Input name="city" className="h-10 bg-slate-50 border-slate-200 rounded-xl" />
                                                </div>
                                                <div className="grid gap-1.5">
                                                    <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('form.district')}</Label>
                                                    <Input name="district" className="h-10 bg-slate-50 border-slate-200 rounded-xl" />
                                                </div>
                                            </div>
                                            <div className="grid gap-1.5">
                                                <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('form.address')}</Label>
                                                <Textarea name="address" className="bg-slate-50 border-slate-200 rounded-xl resize-none min-h-[60px]" />
                                            </div>
                                            <div className="pt-3 border-t mt-2">
                                                <Label className="text-blue-600 font-black text-[10px] uppercase tracking-widest">Portal Erişimi</Label>
                                                <div className="grid grid-cols-2 gap-4 mt-2">
                                                    <div className="grid gap-1">
                                                        <Label className="text-[10px] font-bold text-slate-400 ml-1">{t('form.username')}</Label>
                                                        <Input name="portal_username" placeholder={t('form.username')} className="h-9 bg-white border-slate-200 rounded-xl" />
                                                    </div>
                                                    <div className="grid gap-1">
                                                        <Label className="text-[10px] font-bold text-slate-400 ml-1">{t('form.password')}</Label>
                                                        <Input name="portal_password" type="password" placeholder={t('form.password')} className="h-9 bg-white border-slate-200 rounded-xl" />
                                                    </div>
                                                </div>
                                            </div>
                                        </TabsContent>
                                        {customerType === 'corporate' && (
                                            <TabsContent value="company" forceMount={true} className="data-[state=inactive]:hidden space-y-3">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="grid gap-1.5">
                                                        <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Firma Adı <span className="text-red-500">*</span></Label>
                                                        <Input name="company_name" required={customerType === 'corporate'} className="h-10 bg-slate-50 border-slate-200 rounded-xl" />
                                                    </div>
                                                    <div className="grid gap-1.5">
                                                        <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Firma Telefonu</Label>
                                                        <Input name="company_phone" className="h-10 bg-slate-50 border-slate-200 rounded-xl" />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="grid gap-1.5">
                                                        <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Vergi Dairesi <span className="text-red-500">*</span></Label>
                                                        <Input name="tax_office" required={customerType === 'corporate'} className="h-10 bg-slate-50 border-slate-200 rounded-xl" />
                                                    </div>
                                                    <div className="grid gap-1.5">
                                                        <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Vergi Numarası <span className="text-red-500">*</span></Label>
                                                        <Input name="tax_number" required={customerType === 'corporate'} className="h-10 bg-slate-50 border-slate-200 rounded-xl" />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="grid gap-1.5">
                                                        <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Firma E-posta</Label>
                                                        <Input name="company_email" type="email" className="h-10 bg-slate-50 border-slate-200 rounded-xl" />
                                                    </div>
                                                    <div className="grid gap-1.5">
                                                        <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Web Sitesi</Label>
                                                        <Input name="company_website" placeholder="https://" className="h-10 bg-slate-50 border-slate-200 rounded-xl" />
                                                    </div>
                                                </div>
                                                <div className="grid gap-1.5">
                                                    <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Firma Adresi</Label>
                                                    <Textarea name="company_address" className="bg-slate-50 border-slate-200 rounded-xl resize-none min-h-[60px]" />
                                                </div>
                                            </TabsContent>
                                        )}
                                        <TabsContent value="demands" forceMount={true} className="data-[state=inactive]:hidden space-y-3">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('form.minBudget')}</Label>
                                                    <Input name="min_price" type="number" placeholder="0" className="h-10 bg-slate-50 border-slate-200 rounded-xl" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('form.maxBudget')}</Label>
                                                    <Input name="max_price" type="number" placeholder="0" className="h-10 bg-slate-50 border-slate-200 rounded-xl" />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('form.roomCount')}</Label>
                                                <div className="flex gap-2 flex-wrap">
                                                    {['1+1', '2+1', '3+1', '4+1', 'Villa'].map(type => (
                                                        <label key={type} className="flex items-center space-x-2 border border-slate-100 bg-slate-50/50 p-2 px-3 rounded-xl cursor-pointer hover:bg-white hover:border-blue-200 transition-all">
                                                            <input type="checkbox" name="room_count" value={type} className="h-4 w-4 rounded-md border-slate-300 text-blue-600" />
                                                            <span className="text-sm font-bold text-slate-700">{type}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('form.location')}</Label>
                                                    <Input name="location_preference" placeholder={t('form.locationPlaceholder')} className="h-10 bg-slate-50 border-slate-200 rounded-xl" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('form.propertyType')}</Label>
                                                    <Select name="property_type">
                                                        <SelectTrigger className="h-10 bg-slate-50 border-slate-200 rounded-xl"><SelectValue placeholder={t('form.select')} /></SelectTrigger>
                                                        <SelectContent className="rounded-xl shadow-xl">
                                                            <SelectItem value="Apartment">{t('types.Apartment')}</SelectItem>
                                                            <SelectItem value="Villa">{t('types.Villa')}</SelectItem>
                                                            <SelectItem value="Office">{t('types.Office')}</SelectItem>
                                                            <SelectItem value="Shop">{t('types.Shop')}</SelectItem>
                                                            <SelectItem value="Commercial">{t('types.Commercial')}</SelectItem>
                                                            <SelectItem value="Land">{t('types.Land')}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('form.investmentPurpose')}</Label>
                                                    <Select name="investment_purpose">
                                                        <SelectTrigger className="h-10 bg-slate-50 border-slate-200 rounded-xl"><SelectValue placeholder={t('form.select')} /></SelectTrigger>
                                                        <SelectContent className="rounded-xl shadow-xl">
                                                            <SelectItem value="Living">{t('purposes.Living')}</SelectItem>
                                                            <SelectItem value="Investment">{t('purposes.Investment')}</SelectItem>
                                                            <SelectItem value="Holiday">{t('purposes.Holiday')}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('form.notes')}</Label>
                                                <Textarea name="notes" placeholder={t('form.notesPlaceholder')} className="bg-slate-50 border-slate-200 rounded-xl resize-none min-h-[70px]" />
                                            </div>
                                        </TabsContent>
                                    </Tabs>
                                </div>
                                <DialogFooter className="p-5 bg-slate-50 border-t border-slate-100">
                                    <Button type="submit" disabled={isPending} className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-100 transition-all">
                                        {isPending ? (
                                            <div className="flex items-center gap-2">
                                                <span className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full" />
                                                <span>{t('createModal.submitting') || 'Kaydediliyor...'}</span>
                                            </div>
                                        ) : t('createModal.submit')}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
                <div className="relative flex-1 min-w-[220px] max-w-[400px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="İsim, Tel, E-posta ile tüm kayıtlarda ara..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value)
                            setCurrentPage(1)
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                const url = new URL(window.location.href)
                                if (searchQuery) url.searchParams.set('q', searchQuery)
                                else url.searchParams.delete('q')
                                window.history.pushState({}, '', url)
                                router.refresh()
                            }
                        }}
                        className="pl-10 h-11 bg-white border-slate-200 focus:ring-blue-500 rounded-xl transition-all shadow-sm w-full"
                    />
                </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                {/* Column order hint */}
                <div className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-50/60 border-b border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sütunları sürükle &amp; bırak ile sırala · Kenarını sürükle genişlet</span>
                    {columnOrder.join(',') !== DEFAULT_COLUMN_ORDER.join(',') && (
                        <button
                            onClick={() => {
                                setColumnOrder(DEFAULT_COLUMN_ORDER)
                                try { localStorage.removeItem(COLUMN_STORAGE_KEY) } catch {}
                            }}
                            className="text-[10px] font-bold text-blue-500 hover:text-blue-700 underline underline-offset-2 ml-2"
                        >
                            Sırala sıfırla
                        </button>
                    )}
                    {JSON.stringify(columnWidths) !== JSON.stringify(DEFAULT_WIDTHS) && (
                        <button
                            onClick={() => {
                                setColumnWidths({ ...DEFAULT_WIDTHS })
                                try { localStorage.removeItem(COLUMN_WIDTHS_KEY) } catch {}
                            }}
                            className="text-[10px] font-bold text-slate-400 hover:text-blue-600 underline underline-offset-2 ml-1"
                        >
                            Genişlikleri sıfırla
                        </button>
                    )}
                    <ColumnVisibilityPicker
                        columns={customerColumns}
                        hiddenColumns={hiddenCols}
                        onToggle={toggleColVisibility}
                        onReset={resetColVisibility}
                        storageKey={CUSTOMER_HIDDEN_COLS_KEY}
                    />
                    <Button
                        variant={showFilters ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => { setShowFilters(!showFilters); if (showFilters) clearAllFilters() }}
                        className={cn(
                            "gap-1.5 h-7 text-[10px] font-bold shadow-sm transition-all",
                            showFilters
                                ? "bg-blue-600 hover:bg-blue-700 text-white"
                                : activeFilterCount > 0
                                    ? "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
                                    : "border-slate-200"
                        )}
                    >
                        <Filter className="w-3 h-3" />
                        Filtre
                        {activeFilterCount > 0 && (
                            <span className="bg-white/20 text-[9px] font-black px-1.5 py-0.5 rounded-full">
                                {activeFilterCount}
                            </span>
                        )}
                    </Button>
                </div>
                <div className="relative w-full overflow-auto max-h-[calc(100vh-380px)]">
                    <Table>
                        <TableHeader className="bg-slate-50/80 sticky top-0 z-20">
                            <TableRow>
                                {columnOrder.filter(colId => !hiddenCols.includes(colId)).map((colId) => {
                                    const isOver = dragOverCol === colId
                                    const baseHead = "font-bold text-[11px] uppercase tracking-wider text-slate-400 select-none transition-colors relative overflow-visible"
                                    const dragHead = "cursor-grab active:cursor-grabbing"
                                    const overStyle = isOver ? "border-l-2 border-l-blue-500 bg-blue-50/60" : ""
                                    const w = columnWidths[colId]

                                    const commonProps = {
                                        draggable: true,
                                        onDragStart: () => handleDragStart(colId),
                                        onDragOver: (e: React.DragEvent) => handleDragOver(e, colId),
                                        onDrop: () => handleDrop(colId),
                                        onDragEnd: handleDragEnd,
                                        style: { width: w, minWidth: w, maxWidth: w },
                                    }

                                    // Resize handle element
                                    const ResizeHandle = colId !== 'actions' ? (
                                        <div
                                            className="absolute right-0 top-0 h-full w-2 cursor-col-resize z-10 flex items-center justify-center group/rh"
                                            onMouseDown={(e) => handleResizeMouseDown(e, colId)}
                                            onClick={(e) => e.stopPropagation()}
                                            onDragStart={(e) => e.preventDefault()}
                                            draggable={false}
                                        >
                                            <div className="h-4 w-px bg-slate-300 group-hover/rh:bg-blue-400 group-hover/rh:w-0.5 transition-all" />
                                        </div>
                                    ) : null

                                    if (colId === 'name') return (
                                        <TableHead key="name" {...commonProps} className={cn(baseHead, dragHead, overStyle, "cursor-pointer hover:text-blue-600")} onClick={() => toggleSort('full_name')}>
                                            <div className="flex items-center gap-1">
                                                <span className="opacity-30 text-slate-500">⠿</span>
                                                ID / {t('table.fullName')}
                                                <SortIcon columnKey="full_name" />
                                            </div>
                                            {ResizeHandle}
                                        </TableHead>
                                    )
                                    if (colId === 'phone') return (
                                        <TableHead key="phone" {...commonProps} className={cn(baseHead, dragHead, overStyle)}>
                                            <div className="flex items-center gap-1"><span className="opacity-30">⠿</span>{t('table.phone')}</div>
                                            {ResizeHandle}
                                        </TableHead>
                                    )
                                    if (colId === 'email') return (
                                        <TableHead key="email" {...commonProps} className={cn(baseHead, dragHead, overStyle)}>
                                            <div className="flex items-center gap-1"><span className="opacity-30">⠿</span>{t('table.email')}</div>
                                            {ResizeHandle}
                                        </TableHead>
                                    )
                                    if (colId === 'source') return (
                                        <TableHead key="source" {...commonProps} className={cn(baseHead, dragHead, overStyle)}>
                                            <div className="flex items-center gap-1"><span className="opacity-30">⠿</span>{t('table.source')}</div>
                                            {ResizeHandle}
                                        </TableHead>
                                    )
                                    if (colId === 'status') return (
                                        <TableHead key="status" {...commonProps} className={cn(baseHead, dragHead, overStyle)}>
                                            <div className="flex items-center gap-1"><span className="opacity-30">⠿</span>{t('table.status')}</div>
                                            {ResizeHandle}
                                        </TableHead>
                                    )
                                    if (colId === 'date') return (
                                        <TableHead key="date" {...commonProps} className={cn(baseHead, dragHead, overStyle, "cursor-pointer hover:text-blue-600")} onClick={() => toggleSort('created_at')}>
                                            <div className="flex items-center gap-1">
                                                <span className="opacity-30">⠿</span>
                                                {t('table.date') || 'Kayıt Tarihi'}
                                                <SortIcon columnKey="created_at" />
                                            </div>
                                            {ResizeHandle}
                                        </TableHead>
                                    )
                                    if (colId === 'actions') return (
                                        <TableHead key="actions" className={cn(baseHead, overStyle, "text-right")} style={{ width: columnWidths.actions, minWidth: columnWidths.actions }}>
                                            {t('table.actions')}
                                        </TableHead>
                                    )
                                    return null
                                })}
                            </TableRow>
                        </TableHeader>
                        {showFilters && (
                            <thead>
                                <ColumnFilterRow
                                    columns={filterableColumns}
                                    visibleColumns={columnOrder.filter(c => !hiddenCols.includes(c))}
                                    filters={colFilters}
                                    onFilterChange={handleColFilter}
                                    onClearAll={clearAllFilters}
                                    columnWidths={columnWidths}
                                />
                            </thead>
                        )}
                        <TableBody>
                            {currentItems && currentItems.length > 0 ? (
                                currentItems.map((c) => (
                                    <TableRow key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                                        {columnOrder.filter(colId => !hiddenCols.includes(colId)).map((colId) => {
                                            if (colId === 'name') return (
                                                <TableCell key="name" className="py-2">
                                                    <Link href={`/customers/${c.id}`} className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-black border border-blue-100 shadow-inner group-hover:scale-110 transition-transform">
                                                            {c.full_name.substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <div className="flex flex-col gap-0.5">
                                                            <div className="flex items-center gap-2">
                                                                {c.customer_number && (
                                                                    <span className="text-[9px] font-black px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-md border border-blue-100 flex-shrink-0">
                                                                        {c.customer_number}
                                                                    </span>
                                                                )}
                                                                <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight text-xs">{c.full_name}</span>
                                                            </div>
                                                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{new Date(c.created_at).toLocaleDateString('tr-TR')}</span>
                                                        </div>
                                                    </Link>
                                                </TableCell>
                                            )
                                            if (colId === 'phone') return (
                                                <TableCell key="phone" className="font-bold text-slate-700 text-xs">{c.phone}</TableCell>
                                            )
                                            if (colId === 'email') return (
                                                <TableCell key="email" className="text-slate-500 text-xs font-medium">{c.email || '-'}</TableCell>
                                            )
                                            if (colId === 'source') return (
                                                <TableCell key="source" className="py-2">
                                                    <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider bg-slate-50 border-slate-200 text-slate-400 group-hover:bg-white group-hover:border-blue-200 group-hover:text-blue-600 transition-all">
                                                        {c.source || '-'}
                                                    </Badge>
                                                </TableCell>
                                            )
                                            if (colId === 'status') return (
                                                <TableCell key="status" className="py-2">
                                                    {c.contract_customers && c.contract_customers.length > 0 ? (
                                                        <Badge className="bg-blue-600 hover:bg-blue-700 text-[9px] font-black px-2 py-0.5 uppercase tracking-wide border-none shadow-sm shadow-blue-100">{t('badges.customer')}</Badge>
                                                    ) : c.customer_demands && c.customer_demands.length > 0 ? (
                                                        <Badge className="bg-emerald-600 hover:bg-emerald-700 text-[9px] font-black px-2 py-0.5 uppercase tracking-wide border-none shadow-sm shadow-emerald-100">{t('badges.lead')}</Badge>
                                                    ) : (
                                                        <Badge variant="secondary" className="bg-slate-100 text-slate-500 text-[9px] font-black px-2 py-0.5 uppercase tracking-wide border-none">{t('badges.contact')}</Badge>
                                                    )}
                                                </TableCell>
                                            )
                                            if (colId === 'date') return (
                                                <TableCell key="date" className="py-2">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-xs font-bold text-slate-700">
                                                            {new Date(c.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-medium">
                                                            {new Date(c.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                            )
                                            if (colId === 'actions') return (
                                                <TableCell key="actions" className="text-right py-2" style={{ width: columnWidths.actions, minWidth: columnWidths.actions }}>
                                                    <div className="flex justify-end gap-1">
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" onClick={() => handleCreateActivity(c)} title="Aktivite Ekle">
                                                            <CalendarPlus className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" onClick={() => handleEditClick(c)} title={t('table.edit')}>
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                        {isManager && (
                                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg" onClick={() => setCustomerToDelete(c)} title={t('table.delete')}>
                                                                <Trash className="h-3.5 w-3.5" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            )
                                            return null
                                        })}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columnOrder.length} className="text-center h-48 text-muted-foreground bg-slate-50/30">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="h-12 w-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-300">
                                                <Users className="w-6 h-6" />
                                            </div>
                                            <span className="font-bold text-sm tracking-tight">{t('table.empty')}</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="flex flex-col gap-4 md:hidden">
                {currentItems && currentItems.length > 0 ? (
                    currentItems.map((c) => (
                        <div key={c.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 relative overflow-hidden active:scale-[0.98] transition-all">
                            <div className="flex justify-between items-start">
                                <Link href={`/customers/${c.id}`} className="flex items-center gap-3">
                                    <div className="h-11 w-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-xs font-black shadow-lg shadow-blue-100">
                                        {c.full_name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            {c.customer_number && (
                                                <span className="text-[9px] font-black px-1.5 bg-blue-100 text-blue-700 rounded-lg">
                                                    {c.customer_number}
                                                </span>
                                            )}
                                            <span className="font-black text-slate-900 text-[16px] leading-tight uppercase tracking-tight">{c.full_name}</span>
                                        </div>
                                        <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-0.5">
                                            {new Date(c.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </Link>
                                <div>
                                    {c.contract_customers && c.contract_customers.length > 0 ? (
                                        <Badge className="bg-blue-600 text-[9px] px-2 py-0.5 uppercase tracking-widest font-black border-none">{t('badges.customer')}</Badge>
                                    ) : (c.customer_demands && c.customer_demands.length > 0) ? (
                                        <Badge className="bg-emerald-600 text-[9px] px-2 py-0.5 uppercase tracking-widest font-black border-none">{t('badges.lead')}</Badge>
                                    ) : (
                                        <Badge variant="secondary" className="bg-slate-100 text-slate-400 text-[9px] px-2 py-0.5 uppercase tracking-widest font-black border-none">{t('badges.contact')}</Badge>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <div className="flex items-center gap-2.5 text-[13px] text-slate-600">
                                    <Phone className="h-3.5 w-3.5 text-blue-500" />
                                    <span className="font-bold">{c.phone}</span>
                                </div>
                                {c.email && (
                                    <div className="flex items-center gap-2.5 text-[13px] text-slate-600">
                                        <Mail className="h-3.5 w-3.5 text-blue-500" />
                                        <span className="truncate font-medium">{c.email}</span>
                                    </div>
                                )}
                                {c.source && (
                                    <div className="flex items-center gap-2.5 text-[13px] text-slate-600">
                                        <Tag className="h-3.5 w-3.5 text-blue-500" />
                                        <span className="font-bold text-[11px] uppercase tracking-wider">{c.source}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-between gap-2 pt-1">
                                <div className="flex gap-2 flex-1">
                                    <Button variant="outline" size="sm" className="h-10 px-4 rounded-xl flex-1 border-blue-100 text-blue-600 font-black text-xs uppercase transition-all active:scale-95" onClick={() => handleCreateActivity(c)}>
                                        <CalendarPlus className="h-4 w-4 mr-2" /> Aktivite
                                    </Button>
                                    <Button variant="outline" size="sm" className="h-10 px-4 rounded-xl flex-1 border-slate-200 text-slate-700 font-black text-xs uppercase transition-all active:scale-95" onClick={() => handleEditClick(c)}>
                                        <Pencil className="h-4 w-4 mr-2" /> Düzenle
                                    </Button>
                                </div>
                                {isManager && (
                                    <Button variant="ghost" size="icon" className="h-10 w-10 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-90" onClick={() => setCustomerToDelete(c)}>
                                        <Trash className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="p-12 text-center bg-slate-50/50 border border-slate-100 rounded-2xl flex flex-col items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-300">
                            <Users className="w-6 h-6" />
                        </div>
                        <p className="text-sm text-slate-400 font-bold tracking-tight">{t('table.empty')}</p>
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 mt-4 shadow-sm">
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 rounded-xl border-slate-200 hover:bg-slate-50 active:scale-95 text-slate-600"
                            onClick={() => {
                                handlePageChange(1)
                                window.scrollTo({ top: 0, behavior: 'smooth' })
                            }}
                            disabled={currentPage === 1}
                            title="İlk Sayfa"
                        >
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 rounded-xl border-slate-200 hover:bg-slate-50 active:scale-95 text-slate-600"
                            onClick={() => {
                                handlePageChange(Math.max(1, currentPage - 1))
                                window.scrollTo({ top: 0, behavior: 'smooth' })
                            }}
                            disabled={currentPage === 1}
                            title="Önceki"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        {/* Manual Page Input */}
                        <div className="hidden sm:flex items-center gap-1">
                            <Input 
                                className="h-9 w-16 text-center text-xs font-bold rounded-xl" 
                                value={pageInputValue}
                                onChange={(e) => setPageInputValue(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const page = parseInt(pageInputValue)
                                        if (!isNaN(page) && page >= 1 && page <= totalPages) {
                                            handlePageChange(page)
                                            window.scrollTo({ top: 0, behavior: 'smooth' })
                                        } else {
                                            setPageInputValue(currentPage.toString())
                                        }
                                    }
                                }}
                            />
                            <Button
                                variant="secondary"
                                size="sm"
                                className="h-9 px-3 rounded-xl border-slate-200 font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700"
                                onClick={() => {
                                    const page = parseInt(pageInputValue)
                                    if (!isNaN(page) && page >= 1 && page <= totalPages) {
                                        handlePageChange(page)
                                        window.scrollTo({ top: 0, behavior: 'smooth' })
                                    } else {
                                        setPageInputValue(currentPage.toString())
                                    }
                                }}
                            >
                                Git
                            </Button>
                        </div>

                        <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 rounded-xl border-slate-200 hover:bg-slate-50 active:scale-95 text-slate-600"
                            onClick={() => {
                                handlePageChange(Math.min(totalPages, currentPage + 1))
                                window.scrollTo({ top: 0, behavior: 'smooth' })
                            }}
                            disabled={currentPage === totalPages}
                            title="Sonraki"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 rounded-xl border-slate-200 hover:bg-slate-50 active:scale-95 text-slate-600"
                            onClick={() => {
                                handlePageChange(totalPages)
                                window.scrollTo({ top: 0, behavior: 'smooth' })
                            }}
                            disabled={currentPage === totalPages}
                            title="Son Sayfa"
                        >
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl text-xs font-black uppercase tracking-wider border border-blue-100 shadow-sm">
                        <Filter className="w-3.5 h-3.5 text-blue-500" />
                        Filtreye Uygun: <span className="text-blue-800 font-black ml-1">{totalRecords} Kayıt</span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 mt-2 sm:mt-0">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest hidden sm:block">
                            Sayfa <span className="text-blue-600 font-black">{currentPage}</span> / {totalPages}
                            <span className="mx-2 text-slate-200">|</span>
                            Görüntülenen: {currentItems.length} / {totalRecords}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block sm:hidden">
                            {currentPage} / {totalPages} • {currentItems.length}/{totalRecords}
                        </p>
                    </div>
                </div>
            )}

            <CustomerEditDialog
                customer={editingCustomer}
                isOpen={isEditOpen}
                onOpenChange={setIsEditOpen}
            />

            <ActivityForm
                open={isActivityOpen}
                onOpenChange={setIsActivityOpen}
                mode="create"
                activity={{ customer_id: selectedCustomerForActivity?.id }}
                customers={customers}
                profiles={profiles}
                projects={projects}
            />

            {/* Delete Confirmation */}
            <AlertDialog open={!!customerToDelete} onOpenChange={(open) => !open && setCustomerToDelete(null)}>
                <AlertDialogContent className="rounded-2xl border-none shadow-2xl p-0 overflow-hidden sm:max-w-[400px]">
                    <div className="p-8 space-y-4 text-center">
                        <div className="h-16 w-16 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-4 animate-bounce">
                            <AlertTriangle className="w-8 h-8" />
                        </div>
                        <AlertDialogHeader className="space-y-2">
                            <AlertDialogTitle className="text-xl font-black text-slate-900 leading-tight">
                                {t('deleteConfirmTitle') || 'Müşteriyi Sil'}
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-500 font-medium leading-relaxed">
                                <span className="text-slate-900 font-bold uppercase tracking-tight">"{customerToDelete?.full_name}"</span> {t('table.confirmDelete') || 'isimli müşteriyi kalıcı olarak silmek istediğinize emin misiniz?'}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                    </div>
                    <AlertDialogFooter className="p-6 bg-slate-50 flex flex-col sm:flex-row gap-2 border-t border-slate-100">
                        <AlertDialogCancel className="w-full sm:w-1/2 h-11 rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-white active:scale-95 transition-all outline-none">
                            {t('cancel') || 'Vazgeç'}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="w-full sm:w-1/2 h-11 rounded-xl bg-red-500 hover:bg-red-600 shadow-lg shadow-red-100 text-white font-bold active:scale-95 transition-all"
                            disabled={isPending}
                        >
                            {isPending ? (
                                <div className="flex items-center gap-2">
                                    <span className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full" />
                                    <span>{t('deleting') || 'Siliniyor...'}</span>
                                </div>
                            ) : (
                                t('deleteConfirmAction') || 'Evet, Sil'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <MergeDuplicatesDialog open={isMergeOpen} onClose={() => setIsMergeOpen(false)} />
        </div>
    )
}
