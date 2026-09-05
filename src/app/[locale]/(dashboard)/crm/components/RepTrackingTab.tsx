'use client'
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Users, AlertTriangle, Check, StickyNote, Phone as PhoneIcon, Loader2, Headphones, Download } from 'lucide-react'
import { exportToExcel } from '@/lib/report-export'
import CallRecordingModal from './CallRecordingModal'
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
import { Button } from "@/components/ui/button"
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
    const [activities, setActivities] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [fetchError, setFetchError] = useState<string | null>(null)

    // Excel Export Handler
    const handleExportExcel = () => {
        if (!filteredSales || filteredSales.length === 0) {
            toast.error('Dışa aktarılacak kayıt bulunamadı.')
            return
        }

        const data = filteredSales.map((s: any) => ({
            'Tarih': s.assigned_at || s.created_at ? new Date(s.assigned_at || s.created_at).toLocaleString('tr-TR') : '-',
            'Müşteri Adı': s.customers?.full_name || '-',
            'Müşteri No': s.customers?.customer_number || '-',
            'Telefon': s.customers?.phone || '-',
            'Proje': s.units?.projects?.name || s.projects?.name || '-',
            'Temsilci': s.profiles?.full_name || (profiles.find(p => p.id === s.assigned_to)?.full_name || 'Atanmamış'),
            'İlk Temas Durumu': s.first_contact || 'Aranmadı',
            'Süreç Notu': s.process_note || '',
            'Son Güncelleme': s.updated_at ? new Date(s.updated_at).toLocaleString('tr-TR') : '-'
        }))

        exportToExcel(data, `ilk_temas_takip_raporu_${new Date().toISOString().slice(0, 10)}`)
        toast.success(`${data.length} kayıt Excel olarak indirildi.`)
    }

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
                    setSales(result.sales || [])
                    setActivities(result.activities || [])
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
            } else if (filterFc === 'all_ulasam') {
                if (!s.first_contact || (!s.first_contact.startsWith('Ulaş') && !s.first_contact.includes('Cevap'))) return false
            } else if (filterFc === 'all_hatali') {
                if (!s.first_contact || (!s.first_contact.includes('Hatalı') && !s.first_contact.includes('Kullanılmıyor') && !s.first_contact.includes('Yanlış'))) return false
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
        if (!value) return 'bg-slate-50 text-slate-400 border-slate-200'
        if (value === 'Aradım, Olumlu') return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold'
        if (value === 'Aradım, Olumsuz') return 'bg-red-100 text-red-800 border-red-300 font-semibold'
        if (value === 'Tekrar Aranacak') return 'bg-blue-100 text-blue-800 border-blue-300 font-semibold'
        if (value === 'Değerlendiriyor') return 'bg-purple-100 text-purple-800 border-purple-300 font-semibold'
        if (value.includes('Hatalı') || value.includes('Kullanılmıyor')) return 'bg-rose-100 text-rose-800 border-rose-300 font-bold'
        if (value.includes('Yanlış Kişi')) return 'bg-slate-100 text-slate-800 border-slate-300 font-medium'
        if (value.includes('WhatsApp') || value.includes('SMS')) return 'bg-teal-100 text-teal-800 border-teal-300 font-medium'
        if (value.startsWith('Ulaşamadım') || value.includes('Cevap') || value.includes('Meşgul') || value.includes('Kapalı')) {
            return 'bg-amber-100 text-amber-800 border-amber-300 font-semibold'
        }
        return 'bg-slate-50 text-slate-600 border-slate-200'
    }

    const getFcLabel = (value: string | null) => {
        if (!value) return '—'
        if (value === 'Aradım, Olumlu') return '🟢 Olumlu'
        if (value === 'Aradım, Olumsuz') return '🔴 Olumsuz'
        if (value === 'Tekrar Aranacak') return '🔄 Tekrar Aranacak'
        if (value === 'Değerlendiriyor') return '🤔 Değerlendiriyor'
        if (value === 'Ulaşamadım - Hatalı Numara') return '🚫 Hatalı Numara'
        if (value === 'Ulaşamadım - Cevap Vermiyor') return '📵 Cevap Yok'
        if (value === 'Ulaşamadım - Meşgul / Reddetti') return '⏳ Meşgul'
        if (value === 'Ulaşamadım - Kapalı / Ulaşılamıyor') return '📴 Kapalı'
        if (value === 'Ulaşamadım - Numara Kullanılmıyor') return '❌ Kullanılmıyor'
        if (value === 'Ulaşamadım - Yanlış Kişi') return '👤 Yanlış Kişi'
        if (value === 'Ulaşamadım - WhatsApp / SMS Atıldı') return '💬 WhatsApp Atıldı'
        if (value === 'Ulaşamadım') return '📵 Ulaşamadım'
        return value
    }

    return (
        <div className="flex h-[calc(100vh-130px)] border rounded-xl overflow-hidden bg-card shadow-sm">
            <div className="w-[200px] shrink-0 border-r bg-white flex flex-col">
                <div className="flex-1 overflow-y-auto">
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

            <div className="flex-1 overflow-auto">
                {selectedRepId === '__all__' && (() => {
                    const totalSalesCount = sales.length
                    const totalProcessed = sales.filter((s: any) => s.first_contact).length
                    const totalOlumlu = sales.filter((s: any) => s.first_contact === 'Aradım, Olumlu').length
                    const totalHatali = sales.filter((s: any) => s.first_contact && (s.first_contact.includes('Hatalı') || s.first_contact.includes('Kullanılmıyor'))).length
                    const totalUlasam = sales.filter((s: any) => s.first_contact && (s.first_contact.startsWith('Ulaş') || s.first_contact.includes('Cevap')) && !s.first_contact.includes('Hatalı') && !s.first_contact.includes('Kullanılmıyor')).length
                    const totalPending = totalSalesCount - totalProcessed
                    const totalCalls = activities.filter((a: any) => a.type === 'Call').length
                    const totalDurationSec = activities.filter((a: any) => a.type === 'Call').reduce((acc, a) => acc + (a.duration_seconds || 0), 0)
                    const totalDurationMin = Math.round(totalDurationSec / 60)
                    const totalMeetings = activities.filter((a: any) => a.type === 'Meeting' || a.type === 'OnlineMeeting').length

                    return (
                        <div className="p-3 bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <div className="h-7 w-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                                    👥
                                </div>
                                <div>
                                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight">Ekip Genel Arama & Lead Özeti</h3>
                                    <p className="text-[10px] text-slate-500 font-medium">Sayaçlara tıklayarak alt tabloyu anında filtreleyebilirsiniz</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                                <button
                                    onClick={() => setFilterFc('')}
                                    className={cn(
                                        "px-2.5 py-1.5 rounded-lg bg-white border shadow-2xs text-center cursor-pointer transition-all hover:border-blue-400",
                                        filterFc === '' && "ring-2 ring-blue-500 border-transparent bg-blue-50/40 font-bold"
                                    )}
                                    title="Tüm kayıtları listele"
                                >
                                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Toplam Lead</span>
                                    <span className="text-xs font-black text-slate-800">{totalSalesCount}</span>
                                </button>

                                <div className="px-2.5 py-1.5 rounded-lg bg-blue-50/80 border border-blue-200/80 shadow-2xs text-center">
                                    <span className="text-[9px] font-bold text-blue-600 uppercase block">📞 Aramalar</span>
                                    <span className="text-xs font-black text-blue-700">{totalCalls > 0 ? totalCalls : totalProcessed} Adet</span>
                                </div>

                                {totalDurationMin > 0 && (
                                    <div className="px-2.5 py-1.5 rounded-lg bg-indigo-50/80 border border-indigo-200/80 shadow-2xs text-center">
                                        <span className="text-[9px] font-bold text-indigo-600 uppercase block">⏱️ Konuşma</span>
                                        <span className="text-xs font-black text-indigo-700">{totalDurationMin} Dk</span>
                                    </div>
                                )}

                                {totalMeetings > 0 && (
                                    <div className="px-2.5 py-1.5 rounded-lg bg-violet-50/80 border border-violet-200/80 shadow-2xs text-center">
                                        <span className="text-[9px] font-bold text-violet-600 uppercase block">🏛️ Toplantı</span>
                                        <span className="text-xs font-black text-violet-700">{totalMeetings} Adet</span>
                                    </div>
                                )}

                                <button
                                    onClick={() => setFilterFc(filterFc === 'Aradım, Olumlu' ? '' : 'Aradım, Olumlu')}
                                    className={cn(
                                        "px-2.5 py-1.5 rounded-lg bg-emerald-50/80 border border-emerald-200/80 shadow-2xs text-center cursor-pointer transition-all hover:border-emerald-500",
                                        filterFc === 'Aradım, Olumlu' && "ring-2 ring-emerald-500 border-transparent bg-emerald-100 font-bold"
                                    )}
                                    title="Sadece Olumlu olanları filtrele"
                                >
                                    <span className="text-[9px] font-bold text-emerald-600 uppercase block">🟢 Olumlu</span>
                                    <span className="text-xs font-black text-emerald-700">{totalOlumlu}</span>
                                </button>

                                <button
                                    onClick={() => setFilterFc(filterFc === 'all_ulasam' ? '' : 'all_ulasam')}
                                    className={cn(
                                        "px-2.5 py-1.5 rounded-lg bg-amber-50/80 border border-amber-200/80 shadow-2xs text-center cursor-pointer transition-all hover:border-amber-500",
                                        filterFc === 'all_ulasam' && "ring-2 ring-amber-500 border-transparent bg-amber-100 font-bold"
                                    )}
                                    title="Ulaşılamayanları filtrele"
                                >
                                    <span className="text-[9px] font-bold text-amber-600 uppercase block">📵 Ulaşılamadı</span>
                                    <span className="text-xs font-black text-amber-700">{totalUlasam}</span>
                                </button>

                                {totalHatali > 0 && (
                                    <button
                                        onClick={() => setFilterFc(filterFc === 'all_hatali' ? '' : 'all_hatali')}
                                        className={cn(
                                            "px-2.5 py-1.5 rounded-lg bg-rose-50/80 border border-rose-200/80 shadow-2xs text-center cursor-pointer transition-all hover:border-rose-500",
                                            filterFc === 'all_hatali' && "ring-2 ring-rose-500 border-transparent bg-rose-100 font-bold"
                                        )}
                                        title="Hatalı / Geçersiz numaraları filtrele"
                                    >
                                        <span className="text-[9px] font-bold text-rose-600 uppercase block">🚫 Hatalı No</span>
                                        <span className="text-xs font-black text-rose-700">{totalHatali}</span>
                                    </button>
                                )}

                                <button
                                    onClick={() => setFilterFc(filterFc === 'none' ? '' : 'none')}
                                    className={cn(
                                        "px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200/80 shadow-2xs text-center cursor-pointer transition-all hover:border-slate-400",
                                        filterFc === 'none' && "ring-2 ring-slate-600 border-transparent bg-slate-100 font-bold"
                                    )}
                                    title="Henüz aranmayanları filtrele"
                                >
                                    <span className="text-[9px] font-bold text-slate-500 uppercase block">⏳ Bekleyen</span>
                                    <span className="text-xs font-black text-slate-700">{totalPending}</span>
                                </button>

                                <Button
                                    onClick={handleExportExcel}
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs font-bold gap-1 text-slate-700 hover:text-emerald-700 border-slate-300 ml-1"
                                    title="Tablodaki verileri Excel olarak indir"
                                >
                                    <Download className="w-3.5 h-3.5 text-emerald-600" /> Excel
                                </Button>
                            </div>
                        </div>
                    )
                })()}

                {selectedRepId !== '__all__' && selectedRepId !== '__unassigned__' && (() => {
                    const repName = internalProfiles.find((p: any) => p.id === selectedRepId)?.full_name
                    const repAllSales = sales.filter((s: any) => s.assigned_to === selectedRepId)
                    const repActivities = activities.filter((a: any) => a.owner_id === selectedRepId || a.user_id === selectedRepId)
                    const now = new Date()
                    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
                    const yesterdayStart = new Date(todayStart.getTime() - 86400000)
                    const weekStart = new Date(todayStart)
                    weekStart.setDate(todayStart.getDate() - todayStart.getDay() + 1)
                    if (todayStart.getDay() === 0) weekStart.setDate(weekStart.getDate() - 7)
                    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

                    const periods = [
                        { label: 'Genel', icon: '📊', saleFilter: () => true, actFilter: () => true },
                        { label: 'Bu Ay', icon: '📅', saleFilter: (s: any) => new Date(s.assigned_at || s.created_at) >= monthStart, actFilter: (a: any) => new Date(a.created_at || a.due_date) >= monthStart },
                        { label: 'Bu Hafta', icon: '📆', saleFilter: (s: any) => new Date(s.assigned_at || s.created_at) >= weekStart, actFilter: (a: any) => new Date(a.created_at || a.due_date) >= weekStart },
                        { label: 'Dün', icon: '⏪', saleFilter: (s: any) => { const d = new Date(s.assigned_at || s.created_at); return d >= yesterdayStart && d < todayStart }, actFilter: (a: any) => { const d = new Date(a.created_at || a.due_date); return d >= yesterdayStart && d < todayStart } },
                        { label: 'Bugün', icon: '🔥', saleFilter: (s: any) => new Date(s.assigned_at || s.created_at) >= todayStart, actFilter: (a: any) => new Date(a.created_at || a.due_date) >= todayStart },
                    ]

                    return (
                        <div className="px-3 py-2.5 bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b flex items-center justify-between gap-2.5 overflow-x-auto">
                            <div className="flex items-center gap-2.5">
                                <div className="flex flex-col justify-center mr-2 shrink-0">
                                    <span className="text-xs font-black text-slate-800">{repName}</span>
                                    <span className="text-[10px] text-slate-400 font-semibold">Temsilci Performansı</span>
                                </div>
                                {periods.map(period => {
                                    const periodSales = repAllSales.filter(period.saleFilter)
                                    const periodActs = repActivities.filter(period.actFilter)
                                    const totalLeads = periodSales.length
                                    const processed = periodSales.filter((s: any) => s.first_contact).length
                                    const olumlu = periodSales.filter((s: any) => s.first_contact === 'Aradım, Olumlu').length
                                    const olumsuz = periodSales.filter((s: any) => s.first_contact === 'Aradım, Olumsuz').length
                                    const hatali = periodSales.filter((s: any) => s.first_contact && (s.first_contact.includes('Hatalı') || s.first_contact.includes('Kullanılmıyor'))).length
                                    const ulasam = periodSales.filter((s: any) => s.first_contact && (s.first_contact.startsWith('Ulaş') || s.first_contact.includes('Cevap')) && !s.first_contact.includes('Hatalı') && !s.first_contact.includes('Kullanılmıyor')).length
                                    const pending = totalLeads - processed
                                    const pct = totalLeads > 0 ? Math.round((processed / totalLeads) * 100) : 0
                                    const actCalls = periodActs.filter(a => a.type === 'Call').length
                                    const totalCalls = actCalls > 0 ? actCalls : processed
                                    const durationSec = periodActs.filter(a => a.type === 'Call').reduce((acc, a) => acc + (a.duration_seconds || 0), 0)
                                    const durationMin = Math.round(durationSec / 60)

                                    return (
                                        <div key={period.label} className="flex-shrink-0 min-w-[155px] rounded-xl border border-slate-200/90 bg-white p-2.5 shadow-2xs hover:shadow-xs transition-shadow">
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-1">
                                                    <span className="text-xs">{period.icon}</span>
                                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight">{period.label}</span>
                                                </div>
                                                {durationMin > 0 && (
                                                    <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-1 py-0.2 rounded border border-indigo-100">
                                                        ⏱️ {durationMin} dk
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-baseline justify-between mt-1">
                                                <div>
                                                    <span className="text-base font-black text-blue-700 leading-none">{totalCalls}</span>
                                                    <span className="text-[9px] font-bold text-slate-400 ml-1">arama</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-xs font-bold text-slate-700 leading-none">{totalLeads}</span>
                                                    <span className="text-[9px] text-slate-400 ml-0.5">lead</span>
                                                </div>
                                            </div>
                                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden my-1.5">
                                                <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all" style={{ width: `${pct}%` }} />
                                            </div>
                                            <div className="flex justify-between items-center text-[9px] pt-0.5 border-t border-slate-100">
                                                <span className="text-emerald-600 font-bold" title="Olumlu">🟢 {olumlu}</span>
                                                <span className="text-red-500 font-bold" title="Olumsuz">🔴 {olumsuz}</span>
                                                <span className="text-amber-600 font-bold" title="Ulaşamadım">📵 {ulasam}</span>
                                                {hatali > 0 && <span className="text-rose-600 font-bold" title="Hatalı Numara">🚫 {hatali}</span>}
                                                {pending > 0 && <span className="text-slate-400 font-semibold" title="Bekleyen">⏳ {pending}</span>}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            <Button
                                onClick={handleExportExcel}
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs font-bold gap-1 text-slate-700 hover:text-emerald-700 border-slate-300 shrink-0 ml-2"
                                title="Bu temsilcinin kayıtlarını Excel olarak indir"
                            >
                                <Download className="w-3.5 h-3.5 text-emerald-600" /> Excel
                            </Button>
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

const STORAGE_KEY = 'rep-tracking-col-config'
const DEFAULT_COL_ORDER = ['tarih', 'musteri', 'proje', 'ilk_temas', 'surec_notu', 'guncelleme']
const DEFAULT_COL_WIDTHS: Record<string, number> = {
    tarih: 120, musteri: 210, proje: 150, ilk_temas: 140, surec_notu: 0, guncelleme: 130
}
const COL_LABELS: Record<string, string> = {
    tarih: 'Tarih', musteri: 'Müşteri', proje: 'Proje', ilk_temas: 'İlk Temas & Gerekçe', surec_notu: 'Süreç Notu', guncelleme: 'Güncelleme'
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
    const [recordingModalOpen, setRecordingModalOpen] = useState(false)
    const [recordingPhone, setRecordingPhone] = useState('')
    const [recordingCustomerName, setRecordingCustomerName] = useState('')
    const [colOrder, setColOrder] = useState<string[]>(() => loadColConfig().order)
    const [colWidths, setColWidths] = useState<Record<string, number>>(() => loadColConfig().widths)
    const [dragCol, setDragCol] = useState<string | null>(null)
    const [dragOverCol, setDragOverCol] = useState<string | null>(null)
    const resizingRef = useRef<{ col: string; startX: number; startW: number } | null>(null)

    useEffect(() => {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ order: colOrder, widths: colWidths })) } catch {}
    }, [colOrder, colWidths])

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
                        <SelectItem value="none">⏳ Aranmadı (Boş)</SelectItem>
                        <SelectItem value="Aradım, Olumlu">🟢 Olumlu</SelectItem>
                        <SelectItem value="Değerlendiriyor">🤔 Değerlendiriyor</SelectItem>
                        <SelectItem value="Tekrar Aranacak">🔄 Tekrar Aranacak</SelectItem>
                        <SelectItem value="Aradım, Olumsuz">🔴 Olumsuz</SelectItem>
                        <SelectItem value="all_ulasam">📵 Ulaşılamayanlar (Tümü)</SelectItem>
                        <SelectItem value="all_hatali">🚫 Hatalı / Yanlış No (Tümü)</SelectItem>
                        <SelectItem value="Ulaşamadım - Hatalı Numara">🚫 Ulaşamadım - Hatalı Numara</SelectItem>
                        <SelectItem value="Ulaşamadım - Cevap Vermiyor">📵 Ulaşamadım - Cevap Vermiyor</SelectItem>
                        <SelectItem value="Ulaşamadım - Meşgul / Reddetti">⏳ Ulaşamadım - Meşgul</SelectItem>
                        <SelectItem value="Ulaşamadım - Kapalı / Ulaşılamıyor">📴 Ulaşamadım - Kapalı</SelectItem>
                        <SelectItem value="Ulaşamadım - Numara Kullanılmıyor">❌ Ulaşamadım - Kullanılmıyor</SelectItem>
                        <SelectItem value="Ulaşamadım - Yanlış Kişi">👤 Ulaşamadım - Yanlış Kişi</SelectItem>
                        <SelectItem value="Ulaşamadım - WhatsApp / SMS Atıldı">💬 Ulaşamadım - WhatsApp Atıldı</SelectItem>
                    </SelectContent>
                </Select>
            )
            case 'surec_notu': return <Input placeholder="Filtre..." value={filterNote} onChange={(e: any) => setFilterNote(e.target.value)} className="h-7 text-[11px] bg-white" />
            default: return <span className="text-[10px] text-slate-400">—</span>
        }
    }

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
                            {sale.customers?.phone && (
                                <>
                                    <span className="text-[9px] text-slate-400 truncate"><PhoneIcon className="w-2.5 h-2.5 inline mr-0.5" />{sale.customers.phone}</span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setRecordingPhone(sale.customers.phone)
                                            setRecordingCustomerName(sale.customers.full_name || 'Müşteri')
                                            setRecordingModalOpen(true)
                                        }}
                                        className="shrink-0 p-0.5 rounded hover:bg-indigo-100 text-indigo-400 hover:text-indigo-600 transition-colors"
                                        title="Arama kayıtlarını dinle"
                                    >
                                        <Headphones className="w-3 h-3" />
                                    </button>
                                </>
                            )}
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
                            else { toast.success('İlk temas durumu kaydedildi'); router.refresh() }
                        }}>
                            <SelectTrigger className={cn("h-7 text-[11px] font-semibold border rounded-md px-2 gap-1 w-full truncate", getFcColor(sale.first_contact))}>
                                <SelectValue>{getFcLabel(sale.first_contact)}</SelectValue>
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                                <SelectItem value="__empty__">— Seçiniz (Temizle)</SelectItem>
                                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/80 my-0.5 rounded">Görüşme Sonuçları</div>
                                <SelectItem value="Aradım, Olumlu">🟢 Aradım, Olumlu</SelectItem>
                                <SelectItem value="Değerlendiriyor">🤔 Değerlendiriyor / Düşünüyor</SelectItem>
                                <SelectItem value="Tekrar Aranacak">🔄 Tekrar Aranacak (Takipte)</SelectItem>
                                <SelectItem value="Aradım, Olumsuz">🔴 Aradım, Olumsuz / İlgilenmiyor</SelectItem>
                                <div className="px-2 py-1 text-[10px] font-bold text-amber-600 uppercase tracking-wider bg-amber-50/80 my-0.5 rounded">Ulaşılamadı Gerekçeleri</div>
                                <SelectItem value="Ulaşamadım - Hatalı Numara" className="text-rose-700 font-semibold">🚫 Ulaşamadım - Hatalı / Yanlış No</SelectItem>
                                <SelectItem value="Ulaşamadım - Cevap Vermiyor">📵 Ulaşamadım - Cevap Vermiyor</SelectItem>
                                <SelectItem value="Ulaşamadım - Meşgul / Reddetti">⏳ Ulaşamadım - Meşgul / Reddetti</SelectItem>
                                <SelectItem value="Ulaşamadım - Kapalı / Ulaşılamıyor">📴 Ulaşamadım - Kapalı / Kapsama Dışı</SelectItem>
                                <SelectItem value="Ulaşamadım - Numara Kullanılmıyor" className="text-rose-700">❌ Ulaşamadım - Numara İptal / Kullanılmıyor</SelectItem>
                                <SelectItem value="Ulaşamadım - Yanlış Kişi">👤 Ulaşamadım - Yanlış Kişi / Başkası</SelectItem>
                                <SelectItem value="Ulaşamadım - WhatsApp / SMS Atıldı">💬 Ulaşamadım - WhatsApp / SMS Atıldı</SelectItem>
                                <SelectItem value="Ulaşamadım">📵 Ulaşamadım (Genel)</SelectItem>
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
        <>
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
                                className="absolute top-0 right-0 w-[3px] h-full cursor-col-resize bg-slate-500/30 hover:bg-blue-400 hover:w-[5px] transition-all"
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

        {/* Call Recording Modal */}
        <CallRecordingModal
            open={recordingModalOpen}
            onOpenChange={setRecordingModalOpen}
            phone={recordingPhone}
            customerName={recordingCustomerName}
        />

        </>
    )
}
