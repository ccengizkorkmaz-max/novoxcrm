'use client'

import { useState, useMemo, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Users, AlertTriangle, Check, StickyNote, Phone as PhoneIcon, Loader2 } from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { updateFirstContact, updateProcessNote, fetchTrackingSales } from '../actions'

export default function RepTrackingTab({
    sales: initialSales,
    profiles,
    projects,
}: {
    sales: any[]
    profiles: any[]
    projects: any[]
}) {
    const router = useRouter()
    const [selectedRepId, setSelectedRepId] = useState<string>('__all__')
    const [sales, setSales] = useState<any[]>(initialSales || [])
    const [loading, setLoading] = useState(true)
    const [fetchError, setFetchError] = useState<string | null>(null)

    // Fetch data via server action on mount
    useEffect(() => {
        async function loadData() {
            setLoading(true)
            try {
                const result = await fetchTrackingSales()
                if (result.error) {
                    setFetchError(result.error)
                    console.error('[RepTrackingTab] Server action error:', result.error)
                } else {
                    setSales(result.sales)
                    setFetchError(null)
                }
            } catch (err: any) {
                setFetchError(err.message)
                console.error('[RepTrackingTab] Fetch error:', err)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [])

    // Filters
    const [filterDate, setFilterDate] = useState('')
    const [filterCustomer, setFilterCustomer] = useState('')
    const [filterProject, setFilterProject] = useState('')
    const [filterFc, setFilterFc] = useState('')
    const [filterNote, setFilterNote] = useState('')

    // Filter out external brokers and Maya
    const internalProfiles = profiles.filter((p: any) => {
        if (p.is_external === true) return false
        if ((p.full_name || '').toUpperCase() === 'MAYA') return false
        return true
    })

    // Get unique project names from sales
    const uniqueProjects = useMemo(() => {
        const names = new Set<string>()
        sales.forEach((s: any) => {
            const pName = s.units?.projects?.name || s.projects?.name
            if (pName) names.add(pName)
        })
        return Array.from(names).sort()
    }, [sales])

    // Filter sales by selected rep
    let filteredSales = selectedRepId === '__all__'
        ? sales
        : selectedRepId === '__unassigned__'
            ? sales.filter((s: any) => !s.assigned_to)
            : sales.filter((s: any) => s.assigned_to === selectedRepId)

    // Apply column filters
    filteredSales = filteredSales.filter((s: any) => {
        if (filterDate) {
            const saleDate = new Date(s.assigned_at || s.created_at)
            const y = saleDate.getFullYear()
            const m = String(saleDate.getMonth() + 1).padStart(2, '0')
            const d = String(saleDate.getDate()).padStart(2, '0')
            if (`${y}-${m}-${d}` !== filterDate) return false
        }
        if (filterCustomer) {
            const name = (s.customers?.full_name || '').toLowerCase()
            const phone = (s.customers?.phone || '').toLowerCase()
            if (!name.includes(filterCustomer.toLowerCase()) && !phone.includes(filterCustomer.toLowerCase())) return false
        }
        if (filterProject) {
            const pName = s.units?.projects?.name || s.projects?.name || ''
            if (pName !== filterProject) return false
        }
        if (filterFc) {
            if (filterFc === 'none') {
                if (s.first_contact) return false
            } else {
                if (s.first_contact !== filterFc) return false
            }
        }
        if (filterNote) {
            const note = (s.process_note || '').toLowerCase()
            if (!note.includes(filterNote.toLowerCase())) return false
        }
        return true
    })

    // Sort by most recent update
    filteredSales.sort((a: any, b: any) => {
        const dateA = new Date(a.updated_at || a.assigned_at || a.created_at).getTime()
        const dateB = new Date(b.updated_at || b.assigned_at || b.created_at).getTime()
        return dateB - dateA
    })

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-'
        return new Date(dateStr).toLocaleString('tr-TR', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        })
    }

    const getFcColor = (value: string | null) => {
        if (value === 'Aradım, Olumlu') return 'bg-emerald-100 text-emerald-700 border-emerald-200'
        if (value === 'Aradım, Olumsuz') return 'bg-red-100 text-red-700 border-red-200'
        if (value === 'Ulaşamadım') return 'bg-amber-100 text-amber-700 border-amber-200'
        return 'bg-slate-50 text-slate-400 border-slate-200'
    }

    const getFcLabel = (value: string | null) => {
        if (value === 'Aradım, Olumlu') return '🟢 Olumlu'
        if (value === 'Aradım, Olumsuz') return '🔴 Olumsuz'
        if (value === 'Ulaşamadım') return '📵 Ulaşamadım'
        return '—'
    }

    return (
        <div className="flex h-[calc(100vh-130px)] border rounded-xl overflow-hidden bg-card shadow-sm">
            {/* Left: Rep List — Simple folder-style */}
            <div className="w-[200px] shrink-0 border-r bg-white flex flex-col">
                <div className="flex-1 overflow-y-auto">
                    {/* Tüm Temsilciler */}
                    <button
                        onClick={() => setSelectedRepId('__all__')}
                        className={cn(
                            "w-full text-left px-3 py-2 text-xs font-semibold flex items-center gap-2 hover:bg-slate-50 border-b border-slate-100",
                            selectedRepId === '__all__' ? "text-blue-700 bg-blue-50/50" : "text-slate-700"
                        )}
                    >
                        <Users className="w-3.5 h-3.5 text-blue-500" />
                        <span>Tüm Temsilciler</span>
                        {selectedRepId === '__all__' && <Check className="w-3.5 h-3.5 ml-auto text-blue-500" />}
                    </button>

                    {/* Atanmamış */}
                    <button
                        onClick={() => setSelectedRepId('__unassigned__')}
                        className={cn(
                            "w-full text-left px-3 py-2 text-xs font-semibold flex items-center gap-2 hover:bg-slate-50 border-b border-slate-100",
                            selectedRepId === '__unassigned__' ? "text-amber-700 bg-amber-50/50" : "text-amber-600"
                        )}
                    >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Atanmamış</span>
                        {selectedRepId === '__unassigned__' && <Check className="w-3.5 h-3.5 ml-auto text-amber-500" />}
                    </button>

                    {/* Rep Names */}
                    {internalProfiles.map((p: any) => (
                        <button
                            key={p.id}
                            onClick={() => setSelectedRepId(p.id)}
                            className={cn(
                                "w-full text-left px-3 py-2 text-xs hover:bg-slate-50 transition-colors border-b border-slate-50",
                                selectedRepId === p.id
                                    ? "text-blue-700 bg-blue-50/40 font-bold"
                                    : "text-slate-700 font-medium"
                            )}
                        >
                            {p.full_name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Right: Data Table */}
            <div className="flex-1 overflow-auto">
                {/* Mini Performance Dashboard — only for specific rep */}
                {selectedRepId !== '__all__' && selectedRepId !== '__unassigned__' && (() => {
                    const repName = internalProfiles.find((p: any) => p.id === selectedRepId)?.full_name
                    const repAllSales = sales.filter((s: any) => s.assigned_to === selectedRepId)
                    const now = new Date()
                    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
                    const yesterdayStart = new Date(todayStart.getTime() - 86400000)
                    const weekStart = new Date(todayStart)
                    weekStart.setDate(todayStart.getDate() - todayStart.getDay() + 1)
                    if (todayStart.getDay() === 0) weekStart.setDate(weekStart.getDate() - 7)
                    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

                    const periods = [
                        { label: 'Genel', icon: '📊', filter: () => true },
                        { label: 'Bu Ay', icon: '📅', filter: (s: any) => new Date(s.assigned_at || s.created_at) >= monthStart },
                        { label: 'Bu Hafta', icon: '📆', filter: (s: any) => new Date(s.assigned_at || s.created_at) >= weekStart },
                        { label: 'Dün', icon: '⏪', filter: (s: any) => { const d = new Date(s.assigned_at || s.created_at); return d >= yesterdayStart && d < todayStart } },
                        { label: 'Bugün', icon: '🔥', filter: (s: any) => new Date(s.assigned_at || s.created_at) >= todayStart },
                    ]

                    return (
                        <div className="px-3 py-2.5 bg-gradient-to-r from-slate-50 to-white border-b flex gap-2 overflow-x-auto">
                            <div className="flex items-center mr-2 shrink-0">
                                <span className="text-xs font-bold text-slate-700">{repName}</span>
                            </div>
                            {periods.map(period => {
                                const periodSales = repAllSales.filter(period.filter)
                                const total = periodSales.length
                                const processed = periodSales.filter((s: any) => s.first_contact).length
                                const olumlu = periodSales.filter((s: any) => s.first_contact === 'Aradım, Olumlu').length
                                const olumsuz = periodSales.filter((s: any) => s.first_contact === 'Aradım, Olumsuz').length
                                const ulasam = periodSales.filter((s: any) => s.first_contact === 'Ulaşamadım').length
                                const pending = total - processed
                                const pct = total > 0 ? Math.round((processed / total) * 100) : 0

                                return (
                                    <div key={period.label} className="flex-shrink-0 min-w-[120px] rounded-lg border bg-white p-2 shadow-sm">
                                        <div className="flex items-center gap-1 mb-1">
                                            <span className="text-sm">{period.icon}</span>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{period.label}</span>
                                        </div>
                                        <div className="text-lg font-black text-slate-800 leading-none">{total}</div>
                                        <div className="text-[9px] text-slate-400 mb-1">toplam lead</div>
                                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-1">
                                            <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all" style={{ width: `${pct}%` }} />
                                        </div>
                                        <div className="flex justify-between text-[9px]">
                                            <span className="text-emerald-600 font-bold">🟢{olumlu}</span>
                                            <span className="text-red-500 font-bold">🔴{olumsuz}</span>
                                            <span className="text-amber-600 font-bold">📵{ulasam}</span>
                                        </div>
                                        {pending > 0 && (
                                            <div className="text-[9px] text-slate-400 font-semibold text-center mt-0.5">⏳ {pending} bekliyor</div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )
                })()}
                <TrackingTable
                    filteredSales={filteredSales}
                    sales={sales}
                    loading={loading}
                    fetchError={fetchError}
                    uniqueProjects={uniqueProjects}
                    filterDate={filterDate} setFilterDate={setFilterDate}
                    filterCustomer={filterCustomer} setFilterCustomer={setFilterCustomer}
                    filterProject={filterProject} setFilterProject={setFilterProject}
                    filterFc={filterFc} setFilterFc={setFilterFc}
                    filterNote={filterNote} setFilterNote={setFilterNote}
                    formatDate={formatDate}
                    getFcColor={getFcColor}
                    getFcLabel={getFcLabel}
                    router={router}
                />
            </div>
        </div>
    )
}

// ─── Resizable + Reorderable Table ─────────────────────────────────────────
import React, { useCallback, useRef } from 'react'

const STORAGE_KEY = 'rep-tracking-col-config'
const DEFAULT_COL_ORDER = ['tarih', 'musteri', 'proje', 'ilk_temas', 'surec_notu', 'guncelleme']
const DEFAULT_COL_WIDTHS: Record<string, number> = {
    tarih: 120, musteri: 210, proje: 150, ilk_temas: 85, surec_notu: 0, guncelleme: 130
}
const COL_LABELS: Record<string, string> = {
    tarih: 'Tarih', musteri: 'Müşteri', proje: 'Proje', ilk_temas: 'İlk Temas', surec_notu: 'Süreç Notu', guncelleme: 'Güncelleme'
}

function loadColConfig() {
    if (typeof window === 'undefined') return { order: DEFAULT_COL_ORDER, widths: DEFAULT_COL_WIDTHS }
    try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
            const p = JSON.parse(saved)
            return {
                order: Array.isArray(p.order) ? p.order : DEFAULT_COL_ORDER,
                widths: p.widths && typeof p.widths === 'object' ? { ...DEFAULT_COL_WIDTHS, ...p.widths } : DEFAULT_COL_WIDTHS,
            }
        }
    } catch {}
    return { order: DEFAULT_COL_ORDER, widths: DEFAULT_COL_WIDTHS }
}

function TrackingTable({
    filteredSales, sales, loading, fetchError, uniqueProjects,
    filterDate, setFilterDate, filterCustomer, setFilterCustomer,
    filterProject, setFilterProject, filterFc, setFilterFc,
    filterNote, setFilterNote, formatDate, getFcColor, getFcLabel, router,
}: any) {
    const [colOrder, setColOrder] = useState<string[]>(() => loadColConfig().order)
    const [colWidths, setColWidths] = useState<Record<string, number>>(() => loadColConfig().widths)
    const [dragCol, setDragCol] = useState<string | null>(null)
    const [dragOverCol, setDragOverCol] = useState<string | null>(null)
    const resizingRef = useRef<{ col: string; startX: number; startW: number } | null>(null)

    // Save to localStorage on change
    useEffect(() => {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ order: colOrder, widths: colWidths })) } catch {}
    }, [colOrder, colWidths])

    // Resize via mouse
    const onResizeStart = useCallback((col: string, e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        const startX = e.clientX
        const startW = colWidths[col] || 120
        resizingRef.current = { col, startX, startW }

        const onMove = (ev: MouseEvent) => {
            if (!resizingRef.current) return
            const delta = ev.clientX - resizingRef.current.startX
            const newW = Math.max(50, resizingRef.current.startW + delta)
            setColWidths(prev => ({ ...prev, [resizingRef.current!.col]: newW }))
        }
        const onUp = () => {
            resizingRef.current = null
            document.removeEventListener('mousemove', onMove)
            document.removeEventListener('mouseup', onUp)
            document.body.style.cursor = ''
            document.body.style.userSelect = ''
        }
        document.body.style.cursor = 'col-resize'
        document.body.style.userSelect = 'none'
        document.addEventListener('mousemove', onMove)
        document.addEventListener('mouseup', onUp)
    }, [colWidths])

    // Drag & drop reorder
    const handleDrop = (targetId: string) => {
        if (!dragCol || dragCol === targetId) return
        setColOrder(prev => {
            const arr = [...prev]
            const from = arr.indexOf(dragCol)
            const to = arr.indexOf(targetId)
            if (from < 0 || to < 0) return prev
            arr.splice(from, 1)
            arr.splice(to, 0, dragCol)
            return arr
        })
        setDragCol(null)
        setDragOverCol(null)
    }

    // Render filter for column
    const renderFilter = (colId: string) => {
        switch (colId) {
            case 'tarih': return <Input type="date" value={filterDate} onChange={(e: any) => setFilterDate(e.target.value)} className="h-7 text-[11px] bg-white" />
            case 'musteri': return <Input placeholder="Filtre..." value={filterCustomer} onChange={(e: any) => setFilterCustomer(e.target.value)} className="h-7 text-[11px] bg-white" />
            case 'proje': return (
                <Select value={filterProject || '__all__'} onValueChange={(v: string) => setFilterProject(v === '__all__' ? '' : v)}>
                    <SelectTrigger className="h-7 text-[11px] bg-white"><SelectValue placeholder="Tümü" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__all__">Tümü</SelectItem>
                        {uniqueProjects.map((p: string) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                </Select>
            )
            case 'ilk_temas': return (
                <Select value={filterFc || '__all__'} onValueChange={(v: string) => setFilterFc(v === '__all__' ? '' : v)}>
                    <SelectTrigger className="h-7 text-[11px] bg-white"><SelectValue placeholder="Tümü" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__all__">Tümü</SelectItem>
                        <SelectItem value="none">⏳ Aranmadı</SelectItem>
                        <SelectItem value="Aradım, Olumlu">🟢 Olumlu</SelectItem>
                        <SelectItem value="Aradım, Olumsuz">🔴 Olumsuz</SelectItem>
                        <SelectItem value="Ulaşamadım">📵 Ulaşamadım</SelectItem>
                    </SelectContent>
                </Select>
            )
            case 'surec_notu': return <Input placeholder="Filtre..." value={filterNote} onChange={(e: any) => setFilterNote(e.target.value)} className="h-7 text-[11px] bg-white" />
            default: return <span className="text-[10px] text-slate-400">—</span>
        }
    }

    // Render cell for column
    const renderCell = (colId: string, sale: any) => {
        switch (colId) {
            case 'tarih':
                return <td key={colId} className="px-3 py-2 text-slate-500 font-medium whitespace-nowrap text-[11px]" suppressHydrationWarning>{formatDate(sale.assigned_at || sale.created_at)}</td>
            case 'musteri':
                return (
                    <td key={colId} className="px-3 py-2">
                        <div className="font-bold text-slate-800 truncate">{sale.customers?.full_name || '-'}</div>
                        <div className="flex items-center gap-1 mt-0.5 overflow-hidden">
                            {sale.customers?.customer_number && <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-purple-100 text-purple-700 shrink-0">{sale.customers.customer_number}</span>}
                            {sale.customers?.phone && <span className="text-[9px] text-slate-400 truncate"><PhoneIcon className="w-2.5 h-2.5 inline mr-0.5" />{sale.customers.phone}</span>}
                        </div>
                    </td>
                )
            case 'proje':
                return <td key={colId} className="px-3 py-2 font-semibold text-slate-700 truncate text-[11px]">{sale.units?.projects?.name || sale.projects?.name || '-'}</td>
            case 'ilk_temas':
                return (
                    <td key={colId} className="px-3 py-2">
                        <Select value={sale.first_contact || '__empty__'} onValueChange={async (val: string) => {
                            const newVal = val === '__empty__' ? null : val
                            const res = await updateFirstContact(sale.id, newVal)
                            if (res?.error) toast.error(res.error)
                            else { toast.success('İlk temas güncellendi'); router.refresh() }
                        }}>
                            <SelectTrigger className={cn("h-7 text-[11px] font-semibold border rounded-md px-2 gap-1 w-full", getFcColor(sale.first_contact))}>
                                <SelectValue>{getFcLabel(sale.first_contact)}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__empty__">— Seçiniz</SelectItem>
                                <SelectItem value="Aradım, Olumlu">🟢 Aradım, Olumlu</SelectItem>
                                <SelectItem value="Aradım, Olumsuz">🔴 Aradım, Olumsuz</SelectItem>
                                <SelectItem value="Ulaşamadım">📵 Ulaşamadım</SelectItem>
                            </SelectContent>
                        </Select>
                    </td>
                )
            case 'surec_notu':
                return (
                    <td key={colId} className="px-3 py-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <button className={cn("w-full text-left text-[11px] px-1.5 py-1 rounded border transition-colors min-h-[28px] max-h-[36px] overflow-hidden", sale.process_note ? "border-slate-200 bg-slate-50 text-slate-700 hover:bg-blue-50 hover:border-blue-200" : "border-dashed border-slate-200 text-slate-400 hover:bg-slate-50")} title={sale.process_note || 'Not ekle'}>
                                    {sale.process_note ? <span className="line-clamp-2 whitespace-pre-wrap break-words">{sale.process_note}</span> : <span className="flex items-center gap-1"><StickyNote className="w-3 h-3" /> Not ekle</span>}
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-72 p-3" align="start">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-600">📝 Süreç Notu</label>
                                    <textarea className="w-full min-h-[100px] text-xs border rounded-md p-2 resize-y focus:outline-none focus:ring-2 focus:ring-blue-400" defaultValue={sale.process_note || ''} placeholder="Notlarınızı buraya yazın..." onBlur={async (e: any) => {
                                        const val = e.target.value.trim()
                                        if (val !== (sale.process_note || '')) {
                                            const res = await updateProcessNote(sale.id, val)
                                            if (res?.error) toast.error(res.error)
                                            else { toast.success('Süreç notu kaydedildi'); router.refresh() }
                                        }
                                    }} />
                                    <p className="text-[10px] text-slate-400">Alandan çıkınca otomatik kaydedilir</p>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </td>
                )
            case 'guncelleme':
                return <td key={colId} className="px-3 py-2 text-slate-400 text-[10px] whitespace-nowrap" suppressHydrationWarning>{sale.updated_at ? formatDate(sale.updated_at) : '-'}</td>
            default:
                return <td key={colId} className="px-3 py-2">-</td>
        }
    }

    const colCount = colOrder.length

    return (
        <table className="w-full text-xs border-collapse table-fixed">
            <colgroup>
                {colOrder.map(id => (
                    <col key={id} style={colWidths[id] > 0 ? { width: `${colWidths[id]}px` } : undefined} />
                ))}
            </colgroup>
            <thead className="sticky top-0 z-10">
                <tr className="bg-slate-800">
                    {colOrder.map(id => (
                        <th
                            key={id}
                            className={cn(
                                "py-2 font-bold text-white uppercase tracking-wider text-[10px] relative select-none group",
                                id === 'ilk_temas' ? 'text-center' : 'text-left',
                                dragOverCol === id && dragCol !== id ? 'bg-blue-600' : '',
                            )}
                            style={{ paddingLeft: 12, paddingRight: 16 }}
                            draggable
                            onDragStart={() => setDragCol(id)}
                            onDragOver={(e) => { e.preventDefault(); setDragOverCol(id) }}
                            onDragLeave={() => setDragOverCol(null)}
                            onDrop={(e) => { e.preventDefault(); handleDrop(id) }}
                            onDragEnd={() => { setDragCol(null); setDragOverCol(null) }}
                        >
                            <span className="cursor-grab active:cursor-grabbing">{COL_LABELS[id] || id}</span>
                            <div
                                className="absolute top-0 right-0 w-[5px] h-full cursor-col-resize opacity-0 group-hover:opacity-100 bg-blue-400/50 hover:bg-blue-400 transition-opacity"
                                onMouseDown={(e) => onResizeStart(id, e)}
                            />
                        </th>
                    ))}
                </tr>
                <tr className="bg-slate-50 border-b">
                    {colOrder.map(id => (
                        <td key={id} className="px-2 py-1.5">{renderFilter(id)}</td>
                    ))}
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {filteredSales.map((sale: any) => (
                    <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                        {colOrder.map(id => renderCell(id, sale))}
                    </tr>
                ))}
                {loading && (
                    <tr><td colSpan={colCount} className="px-4 py-8 text-center text-slate-400">
                        <div className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Veriler yükleniyor...</div>
                    </td></tr>
                )}
                {!loading && fetchError && (
                    <tr><td colSpan={colCount} className="px-4 py-8 text-center text-red-500">Hata: {fetchError}</td></tr>
                )}
                {!loading && !fetchError && filteredSales.length === 0 && (
                    <tr><td colSpan={colCount} className="px-4 py-8 text-center text-slate-400">Kayıt bulunamadı ({sales.length} toplam kayıt yüklendi)</td></tr>
                )}
            </tbody>
        </table>
    )
}
