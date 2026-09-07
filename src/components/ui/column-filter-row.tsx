'use client'

import { useState, useRef, useEffect } from 'react'
import { Filter, X, Check, ChevronDown, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ColumnFilterRowProps {
    columns: { id: string; label: string; type: 'text' | 'select' | 'date' | 'date_range' | 'multiselect' | 'none'; options?: string[]; optionLabels?: Record<string, string> }[]
    visibleColumns: string[]
    filters: Record<string, string>
    onFilterChange: (columnId: string, value: string) => void
    onClearAll: () => void
    columnWidths: Record<string, number>
}

const formatDateIso = (d: Date): string => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
}

export const getDateRangePresets = () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // Dün
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    // Bu Hafta (Pazartesi başlangıç)
    const dayOfWeek = today.getDay()
    const mondayOffset = (dayOfWeek + 6) % 7
    const thisMonday = new Date(today)
    thisMonday.setDate(thisMonday.getDate() - mondayOffset)
    const thisSunday = new Date(thisMonday)
    thisSunday.setDate(thisSunday.getDate() + 6)

    // Geçen Hafta
    const lastMonday = new Date(thisMonday)
    lastMonday.setDate(lastMonday.getDate() - 7)
    const lastSunday = new Date(thisMonday)
    lastSunday.setDate(lastSunday.getDate() - 1)

    // Bu Ay
    const firstDayThisMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const lastDayThisMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

    // Geçen Ay
    const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0)

    // Son 7 Gün
    const last7Days = new Date(today)
    last7Days.setDate(last7Days.getDate() - 6)

    // Son 30 Gün
    const last30Days = new Date(today)
    last30Days.setDate(last30Days.getDate() - 29)

    return [
        { label: 'Bugün', from: formatDateIso(today), to: formatDateIso(today) },
        { label: 'Dün', from: formatDateIso(yesterday), to: formatDateIso(yesterday) },
        { label: 'Bu Hafta', from: formatDateIso(thisMonday), to: formatDateIso(thisSunday) },
        { label: 'Geçen Hafta', from: formatDateIso(lastMonday), to: formatDateIso(lastSunday) },
        { label: 'Son 7 Gün', from: formatDateIso(last7Days), to: formatDateIso(today) },
        { label: 'Bu Ay', from: formatDateIso(firstDayThisMonth), to: formatDateIso(lastDayThisMonth) },
        { label: 'Geçen Ay', from: formatDateIso(firstDayLastMonth), to: formatDateIso(lastDayLastMonth) },
        { label: 'Son 30 Gün', from: formatDateIso(last30Days), to: formatDateIso(today) },
    ]
}

export function DateRangeDropdown({
    value,
    onChange,
    placeholder = 'Tarih Aralığı'
}: {
    value: string
    onChange: (val: string) => void
    placeholder?: string
}) {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    const parseValue = (val: string) => {
        if (!val) return { from: '', to: '' }
        if (val.includes(':')) {
            const [f, t] = val.split(':')
            return { from: f || '', to: t || '' }
        }
        return { from: val, to: val }
    }

    const currentRange = parseValue(value)
    const [localFrom, setLocalFrom] = useState(currentRange.from)
    const [localTo, setLocalTo] = useState(currentRange.to)

    useEffect(() => {
        const { from, to } = parseValue(value)
        setLocalFrom(from)
        setLocalTo(to)
    }, [value])

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const handleApply = (fromVal?: string, toVal?: string) => {
        const f = fromVal !== undefined ? fromVal : localFrom
        const t = toVal !== undefined ? toVal : localTo
        if (!f && !t) {
            onChange('')
        } else {
            onChange(`${f}:${t}`)
        }
        setOpen(false)
    }

    const handleClear = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation()
        setLocalFrom('')
        setLocalTo('')
        onChange('')
        setOpen(false)
    }

    const handlePreset = (presetFrom: string, presetTo: string) => {
        setLocalFrom(presetFrom)
        setLocalTo(presetTo)
        handleApply(presetFrom, presetTo)
    }

    const formatDisplay = () => {
        const { from, to } = parseValue(value)
        if (!from && !to) return placeholder

        const formatShort = (iso: string) => {
            if (!iso) return ''
            const parts = iso.split('-')
            if (parts.length !== 3) return iso
            return `${parts[2]}.${parts[1]}`
        }

        if (from && to && from === to) {
            const parts = from.split('-')
            return parts.length === 3 ? `${parts[2]}.${parts[1]}.${parts[0].slice(2)}` : from
        }
        if (from && to) {
            return `${formatShort(from)} - ${formatShort(to)}`
        }
        if (from) {
            return `≥ ${formatShort(from)}`
        }
        if (to) {
            return `≤ ${formatShort(to)}`
        }
        return placeholder
    }

    const isSelected = Boolean(value && (parseValue(value).from || parseValue(value).to))
    const presets = getDateRangePresets()

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className={cn(
                    "w-full h-7 text-[11px] rounded-lg border px-2 pr-6 bg-white outline-none transition-all text-left truncate cursor-pointer flex items-center gap-1.5",
                    isSelected
                        ? "border-blue-500 bg-blue-50 text-blue-950 font-bold ring-1 ring-blue-300"
                        : "border-slate-300 text-slate-700 hover:border-slate-400 font-medium"
                )}
            >
                <Calendar className={cn("w-3 h-3 flex-shrink-0", isSelected ? "text-blue-600" : "text-slate-400")} />
                <span className="truncate flex-1">{formatDisplay()}</span>
            </button>
            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
            {isSelected && (
                <button
                    type="button"
                    onClick={handleClear}
                    title="Tarih filtresini temizle"
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-blue-500 hover:text-red-600 transition-colors z-10 p-0.5"
                >
                    <X className="w-3 h-3" />
                </button>
            )}

            {open && (
                <div className="absolute top-full right-0 mt-1 w-[280px] bg-white border border-slate-200 rounded-xl shadow-2xl z-50 p-3 space-y-3 text-slate-800">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-blue-600" />
                            Tarih Aralığı
                        </span>
                        {isSelected && (
                            <button
                                type="button"
                                onClick={handleClear}
                                className="text-[10px] text-red-600 hover:underline font-bold cursor-pointer"
                            >
                                Temizle
                            </button>
                        )}
                    </div>

                    {/* Quick Presets */}
                    <div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                            Hızlı Seçim
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                            {presets.map(p => {
                                const active = (localFrom === p.from && localTo === p.to)
                                return (
                                    <button
                                        key={p.label}
                                        type="button"
                                        onClick={() => handlePreset(p.from, p.to)}
                                        className={cn(
                                            "text-left px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer",
                                            active
                                                ? "bg-blue-600 text-white font-bold shadow-xs"
                                                : "bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900"
                                        )}
                                    >
                                        {p.label}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Inputs */}
                    <div className="space-y-2 pt-1 border-t border-slate-100">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Özel Aralık
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Başlangıç</label>
                                <input
                                    type="date"
                                    value={localFrom}
                                    onChange={(e) => setLocalFrom(e.target.value)}
                                    className="w-full h-7 px-1.5 text-[11px] rounded-md border border-slate-300 focus:outline-none focus:border-blue-500 font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Bitiş</label>
                                <input
                                    type="date"
                                    value={localTo}
                                    min={localFrom || undefined}
                                    onChange={(e) => setLocalTo(e.target.value)}
                                    className="w-full h-7 px-1.5 text-[11px] rounded-md border border-slate-300 focus:outline-none focus:border-blue-500 font-medium"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={handleClear}
                            className="px-2 py-1 text-[11px] text-slate-600 hover:text-slate-900 font-medium rounded hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                            Sıfırla
                        </button>
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="px-2 py-1 text-[11px] text-slate-600 font-medium rounded hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                                Vazgeç
                            </button>
                            <button
                                type="button"
                                onClick={() => handleApply()}
                                className="px-3 py-1 text-[11px] bg-blue-600 hover:bg-blue-700 text-white font-bold rounded shadow-xs transition-colors cursor-pointer"
                            >
                                Uygula
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function MultiSelectDropdown({ 
    options, 
    optionLabels,
    value, 
    onChange, 
    placeholder = 'Tümü' 
}: { 
    options: string[]
    optionLabels?: Record<string, string>
    value: string
    onChange: (val: string) => void
    placeholder?: string 
}) {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)
    const selected = value ? value.split(',') : []

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const toggle = (opt: string) => {
        const next = selected.includes(opt)
            ? selected.filter(s => s !== opt)
            : [...selected, opt]
        onChange(next.join(','))
    }

    const label = selected.length === 0
        ? placeholder
        : selected.length === 1
            ? (optionLabels?.[selected[0]] || selected[0])
            : `${selected.length} seçili`

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(!open)}
                className={cn(
                    "w-full h-7 text-[11px] rounded-lg border px-2 pr-6 bg-white outline-none transition-all text-left truncate cursor-pointer",
                    selected.length > 0
                        ? "border-blue-400 bg-blue-50 text-blue-700 font-bold ring-1 ring-blue-200"
                        : "border-slate-200 text-slate-500 hover:border-slate-300"
                )}
            >
                {label}
            </button>
            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
            {selected.length > 0 && (
                <button
                    onClick={(e) => { e.stopPropagation(); onChange(''); setOpen(false) }}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-blue-400 hover:text-red-500 transition-colors z-10"
                >
                    <X className="w-3 h-3" />
                </button>
            )}
            {open && (
                <div className="absolute top-full left-0 mt-1 w-full min-w-[140px] bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                    {options.map(opt => (
                        <button
                            key={opt}
                            onClick={() => toggle(opt)}
                            className={cn(
                                "w-full flex items-center gap-1.5 px-2 py-1.5 text-[11px] text-left hover:bg-blue-50 transition-colors",
                                selected.includes(opt) ? "text-blue-700 font-bold bg-blue-50/50" : "text-slate-600"
                            )}
                        >
                            <div className={cn(
                                "w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0",
                                selected.includes(opt)
                                    ? "bg-blue-500 border-blue-500"
                                    : "border-slate-300"
                            )}>
                                {selected.includes(opt) && <Check className="w-2.5 h-2.5 text-white" />}
                            </div>
                            {optionLabels?.[opt] || opt}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

function DebouncedTextInput({
    value: initialValue,
    onChange,
    placeholder = 'Filtre...'
}: {
    value: string
    onChange: (val: string) => void
    placeholder?: string
}) {
    const [localVal, setLocalVal] = useState(initialValue || '')

    useEffect(() => {
        setLocalVal(initialValue || '')
    }, [initialValue])

    useEffect(() => {
        const timer = setTimeout(() => {
            if (localVal !== (initialValue || '')) {
                onChange(localVal)
            }
        }, 350)
        return () => clearTimeout(timer)
    }, [localVal, initialValue, onChange])

    return (
        <div className="relative">
            <input
                type="text"
                placeholder={placeholder}
                value={localVal}
                onChange={(e) => setLocalVal(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        onChange(localVal)
                    }
                }}
                className={cn(
                    "w-full h-7 text-[11px] rounded-lg border px-2 pr-6 bg-white outline-none transition-all",
                    localVal
                        ? "border-blue-500 bg-blue-50 text-blue-950 font-bold ring-1 ring-blue-300"
                        : "border-slate-300 text-slate-900 placeholder:text-slate-500 font-medium hover:border-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-400"
                )}
            />
            {localVal && (
                <button
                    onClick={() => { setLocalVal(''); onChange('') }}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-blue-500 hover:text-red-600 transition-colors"
                >
                    <X className="w-3 h-3" />
                </button>
            )}
        </div>
    )
}

export default function ColumnFilterRow({
    columns,
    visibleColumns,
    filters,
    onFilterChange,
    onClearAll,
    columnWidths
}: ColumnFilterRowProps) {
    const activeFilterCount = Object.values(filters).filter(v => v.length > 0).length

    return (
        <tr className="bg-slate-100/70 border-b border-slate-300">
            {columns
                .filter(col => visibleColumns.includes(col.id))
                .map(col => (
                    <td
                        key={col.id}
                        className="px-1.5 py-1.5"
                        style={{ width: columnWidths[col.id], minWidth: columnWidths[col.id] }}
                    >
                        {col.type === 'none' ? null : col.type === 'multiselect' ? (
                            <MultiSelectDropdown
                                options={col.options || []}
                                optionLabels={col.optionLabels}
                                value={filters[col.id] || ''}
                                onChange={(val) => onFilterChange(col.id, val)}
                            />
                        ) : col.type === 'select' ? (
                            <select
                                value={filters[col.id] || ''}
                                onChange={(e) => onFilterChange(col.id, e.target.value)}
                                className={cn(
                                    "w-full h-7 text-[11px] font-semibold rounded-lg border px-2 bg-white outline-none transition-all appearance-none cursor-pointer shadow-2xs",
                                    filters[col.id]
                                        ? "border-blue-500 bg-blue-50 text-blue-950 font-bold ring-1 ring-blue-300"
                                        : "border-slate-300 text-slate-800 hover:border-slate-400"
                                )}
                            >
                                <option value="" className="text-slate-600 font-normal">Tümü</option>
                                {col.options?.map(opt => (
                                    <option key={opt} value={opt} className="text-slate-900 font-medium">{opt}</option>
                                ))}
                            </select>
                        ) : (col.type === 'date' || col.type === 'date_range') ? (
                            <DateRangeDropdown
                                value={filters[col.id] || ''}
                                onChange={(val) => onFilterChange(col.id, val)}
                                placeholder="Tarih Aralığı"
                            />
                        ) : (
                            <DebouncedTextInput
                                placeholder="Filtre..."
                                value={filters[col.id] || ''}
                                onChange={(val) => onFilterChange(col.id, val)}
                            />
                        )}
                    </td>
                ))}
        </tr>
    )
}
