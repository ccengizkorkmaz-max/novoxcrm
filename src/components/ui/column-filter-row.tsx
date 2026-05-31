'use client'

import { useState, useRef, useEffect } from 'react'
import { Filter, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ColumnFilterRowProps {
    columns: { id: string; label: string; type: 'text' | 'select' | 'date'; options?: string[] }[]
    visibleColumns: string[]
    filters: Record<string, string>
    onFilterChange: (columnId: string, value: string) => void
    onClearAll: () => void
    columnWidths: Record<string, number>
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
                        {col.type === 'select' ? (
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
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder={`Filtre...`}
                                    value={filters[col.id] || ''}
                                    onChange={(e) => onFilterChange(col.id, e.target.value)}
                                    className={cn(
                                        "w-full h-7 text-[11px] rounded-lg border px-2 pr-6 bg-white outline-none transition-all",
                                        filters[col.id]
                                            ? "border-blue-400 bg-blue-50 text-blue-700 font-bold ring-1 ring-blue-200"
                                            : "border-slate-200 text-slate-600 placeholder:text-slate-300 hover:border-slate-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
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
                        )}
                    </td>
                ))}
        </tr>
    )
}
