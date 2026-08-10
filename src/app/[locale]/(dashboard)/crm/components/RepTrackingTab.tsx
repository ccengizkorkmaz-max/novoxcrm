'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { User, Phone, StickyNote, ChevronRight, Clock } from 'lucide-react'
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
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { updateFirstContact, updateProcessNote } from '../actions'

const FIRST_CONTACT_OPTIONS = [
    { value: '__empty__', label: '— Seçiniz', color: 'bg-slate-50 text-slate-400 border-slate-200' },
    { value: 'Aradım, Olumlu', label: '🟢 Olumlu', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    { value: 'Aradım, Olumsuz', label: '🔴 Olumsuz', color: 'bg-red-100 text-red-700 border-red-200' },
    { value: 'Ulaşamadım', label: '📵 Ulaşamadım', color: 'bg-amber-100 text-amber-700 border-amber-200' },
]

export default function RepTrackingTab({
    sales,
    profiles,
    projects,
}: {
    sales: any[]
    profiles: any[]
    projects: any[]
}) {
    const router = useRouter()
    const [selectedRepId, setSelectedRepId] = useState<string | null>(null)

    // Auto-select first rep
    useEffect(() => {
        if (!selectedRepId && profiles.length > 0) {
            setSelectedRepId(profiles[0].id)
        }
    }, [profiles, selectedRepId])

    // Group sales by rep and compute stats
    const repStats = profiles.map((p: any) => {
        const repSales = sales.filter((s: any) => s.assigned_to === p.id)
        const lastUpdated = repSales.length > 0
            ? repSales.reduce((latest: any, s: any) => {
                const d = new Date(s.updated_at || s.assigned_at || s.created_at).getTime()
                return d > latest ? d : latest
            }, 0)
            : 0
        const pendingCount = repSales.filter((s: any) => !s.first_contact).length
        const totalCount = repSales.length
        return { ...p, lastUpdated, pendingCount, totalCount, repSales }
    }).sort((a: any, b: any) => b.lastUpdated - a.lastUpdated)

    // Get selected rep's sales sorted by most recent update
    const selectedRep = repStats.find((r: any) => r.id === selectedRepId)
    const repSales = selectedRep?.repSales
        ?.sort((a: any, b: any) => {
            const dateA = new Date(a.updated_at || a.assigned_at || a.created_at).getTime()
            const dateB = new Date(b.updated_at || b.assigned_at || b.created_at).getTime()
            return dateB - dateA
        }) || []

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-'
        return new Date(dateStr).toLocaleString('tr-TR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        })
    }

    const getFcInfo = (value: string | null) => {
        const opt = FIRST_CONTACT_OPTIONS.find(o => o.value === value) || FIRST_CONTACT_OPTIONS[0]
        return opt
    }

    return (
        <div className="flex gap-0 h-[calc(100vh-220px)] border rounded-xl overflow-hidden bg-card shadow-sm">
            {/* Left: Rep List */}
            <div className="w-[240px] shrink-0 border-r bg-slate-50/50 overflow-y-auto">
                <div className="p-2.5 border-b bg-slate-800">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" /> Temsilciler
                    </h3>
                </div>
                <div className="divide-y divide-slate-100">
                    {repStats.map((rep: any) => (
                        <button
                            key={rep.id}
                            onClick={() => setSelectedRepId(rep.id)}
                            className={cn(
                                "w-full text-left px-3 py-2.5 transition-all text-xs hover:bg-blue-50/80",
                                selectedRepId === rep.id
                                    ? "bg-blue-50 border-l-[3px] border-l-blue-500"
                                    : "border-l-[3px] border-l-transparent"
                            )}
                        >
                            <div className="flex items-center justify-between">
                                <span className={cn(
                                    "font-semibold truncate",
                                    selectedRepId === rep.id ? "text-blue-700" : "text-slate-700"
                                )}>
                                    {rep.full_name}
                                </span>
                                <ChevronRight className={cn(
                                    "w-3.5 h-3.5 shrink-0 transition-colors",
                                    selectedRepId === rep.id ? "text-blue-500" : "text-slate-300"
                                )} />
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-600">
                                    {rep.totalCount} lead
                                </span>
                                {rep.pendingCount > 0 && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                                        ⏳ {rep.pendingCount} bekliyor
                                    </span>
                                )}
                            </div>
                            {rep.lastUpdated > 0 && (
                                <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400">
                                    <Clock className="w-2.5 h-2.5" />
                                    {formatDate(new Date(rep.lastUpdated).toISOString())}
                                </div>
                            )}
                        </button>
                    ))}
                    {repStats.length === 0 && (
                        <div className="p-4 text-center text-xs text-slate-400">Temsilci bulunamadı</div>
                    )}
                </div>
            </div>

            {/* Right: Lead Table */}
            <div className="flex-1 overflow-auto">
                {selectedRep ? (
                    <>
                        <div className="sticky top-0 z-10 bg-slate-800 px-4 py-2.5 flex items-center justify-between">
                            <h3 className="text-sm font-bold text-white">
                                {selectedRep.full_name}
                                <span className="ml-2 text-xs font-normal text-slate-300">
                                    ({repSales.length} lead)
                                </span>
                            </h3>
                            {selectedRep.pendingCount > 0 && (
                                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    ⏳ {selectedRep.pendingCount} aranmadı
                                </span>
                            )}
                        </div>

                        <table className="w-full text-xs border-collapse">
                            <thead className="sticky top-[42px] z-[9]">
                                <tr className="bg-slate-100 border-b">
                                    <th className="px-3 py-2 text-left font-bold text-slate-600 uppercase tracking-wider text-[10px] w-[200px]">Müşteri</th>
                                    <th className="px-3 py-2 text-left font-bold text-slate-600 uppercase tracking-wider text-[10px] w-[160px]">Proje</th>
                                    <th className="px-3 py-2 text-center font-bold text-slate-600 uppercase tracking-wider text-[10px] w-[140px]">İlk Temas</th>
                                    <th className="px-3 py-2 text-left font-bold text-slate-600 uppercase tracking-wider text-[10px] w-[200px]">Süreç Notu</th>
                                    <th className="px-3 py-2 text-right font-bold text-slate-600 uppercase tracking-wider text-[10px] w-[140px]">Güncelleme</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {repSales.map((sale: any) => {
                                    const fcInfo = getFcInfo(sale.first_contact)
                                    return (
                                        <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                                            {/* Müşteri */}
                                            <td className="px-3 py-2">
                                                <div className="font-semibold text-slate-800 truncate">{sale.customers?.full_name || '-'}</div>
                                                {sale.customers?.phone && (
                                                    <span className="text-[10px] text-slate-400">{sale.customers.phone}</span>
                                                )}
                                            </td>
                                            {/* Proje */}
                                            <td className="px-3 py-2">
                                                <span className="text-slate-600">{sale.units?.projects?.name || sale.projects?.name || '-'}</span>
                                            </td>
                                            {/* İlk Temas */}
                                            <td className="px-3 py-2">
                                                <Select
                                                    value={sale.first_contact || '__empty__'}
                                                    onValueChange={async (val) => {
                                                        const newVal = val === '__empty__' ? null : val
                                                        const res = await updateFirstContact(sale.id, newVal)
                                                        if (res?.error) toast.error(res.error)
                                                        else {
                                                            toast.success('İlk temas güncellendi')
                                                            router.refresh()
                                                        }
                                                    }}
                                                >
                                                    <SelectTrigger className={cn("h-7 text-[11px] font-semibold border rounded-md px-2 gap-1 w-full", fcInfo.color)}>
                                                        <SelectValue>{fcInfo.label}</SelectValue>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="__empty__">— Seçiniz</SelectItem>
                                                        <SelectItem value="Aradım, Olumlu">🟢 Aradım, Olumlu</SelectItem>
                                                        <SelectItem value="Aradım, Olumsuz">🔴 Aradım, Olumsuz</SelectItem>
                                                        <SelectItem value="Ulaşamadım">📵 Ulaşamadım</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </td>
                                            {/* Süreç Notu */}
                                            <td className="px-3 py-2">
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <button
                                                            className={cn(
                                                                "w-full text-left text-[11px] px-1.5 py-1 rounded border transition-colors min-h-[28px] max-h-[36px] overflow-hidden",
                                                                sale.process_note
                                                                    ? "border-slate-200 bg-slate-50 text-slate-700 hover:bg-blue-50 hover:border-blue-200"
                                                                    : "border-dashed border-slate-200 text-slate-400 hover:bg-slate-50"
                                                            )}
                                                            title={sale.process_note || 'Not ekle'}
                                                        >
                                                            {sale.process_note ? (
                                                                <span className="line-clamp-2 whitespace-pre-wrap break-words">{sale.process_note}</span>
                                                            ) : (
                                                                <span className="flex items-center gap-1">
                                                                    <StickyNote className="w-3 h-3" /> Not ekle
                                                                </span>
                                                            )}
                                                        </button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-72 p-3" align="start">
                                                        <div className="space-y-2">
                                                            <label className="text-xs font-bold text-slate-600">📝 Süreç Notu</label>
                                                            <textarea
                                                                className="w-full min-h-[100px] text-xs border rounded-md p-2 resize-y focus:outline-none focus:ring-2 focus:ring-blue-400"
                                                                defaultValue={sale.process_note || ''}
                                                                placeholder="Notlarınızı buraya yazın..."
                                                                onBlur={async (e) => {
                                                                    const val = e.target.value.trim()
                                                                    if (val !== (sale.process_note || '')) {
                                                                        const res = await updateProcessNote(sale.id, val)
                                                                        if (res?.error) toast.error(res.error)
                                                                        else {
                                                                            toast.success('Süreç notu kaydedildi')
                                                                            router.refresh()
                                                                        }
                                                                    }
                                                                }}
                                                            />
                                                            <p className="text-[10px] text-slate-400">Alandan çıkınca otomatik kaydedilir</p>
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>
                                            </td>
                                            {/* Güncelleme Tarihi */}
                                            <td className="px-3 py-2 text-right">
                                                <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap" suppressHydrationWarning>
                                                    {formatDate(sale.updated_at || sale.assigned_at || sale.created_at)}
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                })}
                                {repSales.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                                            Bu temsilciye atanmış lead bulunmuyor
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                        Soldaki listeden bir temsilci seçin
                    </div>
                )}
            </div>
        </div>
    )
}
