'use client'

import { useState, useRef, useEffect } from 'react'
import { Filter, X, Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ColumnFilterRowProps {
    columns: { id: string; label: string; type: 'text' | 'select' | 'date' | 'multiselect' | 'none'; options?: string[]; optionLabels?: Record<string, string> }[]
    visibleColumns: string[]
    filters: Record<string, string>
    onFilterChange: (columnId: string, value: string) => void
    onClearAll: () => void
    columnWidths: Record<string, number>
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
                        ? "border-blue-400 bg-blue-50 text-blue-700 font-bold ring-1 ring-blue-200"
                        : "border-slate-200 text-slate-600 placeholder:text-slate-300 hover:border-slate-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
                )}
            />
            {localVal && (
                <button
                    onClick={() => { setLocalVal(''); onChange('') }}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-blue-400 hover:text-red-500 transition-colors"
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
        <tr className="bg-slate-50/50 border-b border-slate-200">
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
                                    "w-full h-7 text-[11px] rounded-lg border px-2 bg-white outline-none transition-all appearance-none cursor-pointer",
                                    filters[col.id]
                                        ? "border-blue-400 bg-blue-50 text-blue-700 font-bold ring-1 ring-blue-200"
                                        : "border-slate-200 text-slate-500 hover:border-slate-300"
                                )}
                            >
                                <option value="">Tümü</option>
                                {col.options?.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        ) : col.type === 'date' ? (
                            <div className="relative">
                                <input
                                    type="date"
                                    value={filters[col.id] || ''}
                                    onChange={(e) => onFilterChange(col.id, e.target.value)}
                                    className={cn(
                                        "w-full h-7 text-[11px] rounded-lg border px-2 bg-white outline-none transition-all",
                                        filters[col.id]
                                            ? "border-blue-400 bg-blue-50 text-blue-700 font-bold ring-1 ring-blue-200"
                                            : "border-slate-200 text-slate-600 hover:border-slate-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
                                    )}
                                />
                                {filters[col.id] && (
                                    <button
                                        onClick={() => onFilterChange(col.id, '')}
                                        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-blue-400 hover:text-red-500 transition-colors"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        ) : (
                            <DebouncedTextInput
                                value={filters[col.id] || ''}
                                onChange={(val) => onFilterChange(col.id, val)}
                                placeholder="Filtre..."
                            />
                        )}
                    </td>
                ))}
        </tr>
    )
}
