'use client'

import { useState, useRef, useEffect } from 'react'
import { Columns3, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ColumnVisibilityPickerProps {
    columns: { id: string; label: string; required?: boolean }[]
    hiddenColumns: string[]
    onToggle: (columnId: string) => void
    onReset: () => void
    storageKey: string
}

export default function ColumnVisibilityPicker({
    columns,
    hiddenColumns,
    onToggle,
    onReset,
    storageKey
}: ColumnVisibilityPickerProps) {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [])

    const visibleCount = columns.length - hiddenColumns.length

    return (
        <div className="relative" ref={ref}>
            <Button
                variant="outline"
                size="sm"
                onClick={() => setOpen(!open)}
                className={cn(
                    "gap-1.5 h-8 text-xs font-bold border-slate-200 shadow-sm transition-all",
                    hiddenColumns.length > 0 && "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
                )}
            >
                <Columns3 className="w-3.5 h-3.5" />
                Kolonlar
                {hiddenColumns.length > 0 && (
                    <span className="bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full ml-0.5">
                        {visibleCount}/{columns.length}
                    </span>
                )}
            </Button>

            {open && (
                <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-xl border border-slate-200 shadow-2xl shadow-slate-200/60 p-1 min-w-[220px] animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-150">
                    <div className="px-3 py-2 border-b border-slate-100">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Görünür Kolonlar</span>
                            {hiddenColumns.length > 0 && (
                                <button
                                    onClick={() => { onReset(); }}
                                    className="text-[10px] font-bold text-blue-600 hover:text-blue-800 underline underline-offset-2"
                                >
                                    Tümünü Göster
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="py-1 max-h-[300px] overflow-y-auto">
                        {columns.map(col => {
                            const isVisible = !hiddenColumns.includes(col.id)
                            const isRequired = col.required
                            return (
                                <button
                                    key={col.id}
                                    onClick={() => !isRequired && onToggle(col.id)}
                                    disabled={isRequired}
                                    className={cn(
                                        "w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs font-medium rounded-lg transition-all",
                                        isRequired
                                            ? "text-slate-300 cursor-not-allowed"
                                            : isVisible
                                                ? "text-slate-700 hover:bg-slate-50"
                                                : "text-slate-400 hover:bg-red-50"
                                    )}
                                >
                                    <div className={cn(
                                        "w-4 h-4 rounded-md border flex items-center justify-center flex-shrink-0 transition-all",
                                        isRequired
                                            ? "bg-slate-100 border-slate-200"
                                            : isVisible
                                                ? "bg-blue-600 border-blue-600"
                                                : "bg-white border-slate-300"
                                    )}>
                                        {(isVisible || isRequired) && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <span className={cn(isVisible ? "font-bold" : "font-normal")}>{col.label}</span>
                                    {isRequired && <span className="text-[9px] text-slate-300 ml-auto">zorunlu</span>}
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
