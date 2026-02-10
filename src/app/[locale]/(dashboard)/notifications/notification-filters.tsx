'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Bell, Users, DollarSign, Package, Settings, AlertTriangle, CheckCircle2, Info, Filter, X } from 'lucide-react'

interface FilterProps {
    currentCategory: string
    currentType: string
}

const categories = [
    { value: 'all', label: 'Tümü', icon: Bell },
    { value: 'CRM', label: 'CRM', icon: Users },
    { value: 'Finance', label: 'Finans', icon: DollarSign },
    { value: 'Inventory', label: 'Envanter', icon: Package },
    { value: 'System', label: 'Sistem', icon: Settings },
]

const types = [
    { value: 'all', label: 'Tümü', icon: Bell },
    { value: 'Info', label: 'Bilgi', icon: Info },
    { value: 'Warning', label: 'Dikkat', icon: AlertTriangle },
    { value: 'Alert', label: 'Uyarı', icon: AlertTriangle },
    { value: 'Success', label: 'Başarılı', icon: CheckCircle2 },
]

export function NotificationFilters({ currentCategory, currentType }: FilterProps) {
    const router = useRouter()
    const pathname = usePathname()

    const updateFilter = (key: string, value: string) => {
        const params = new URLSearchParams()
        if (key === 'category') {
            if (value !== 'all') params.set('category', value)
            if (currentType !== 'all') params.set('type', currentType)
        } else {
            if (currentCategory !== 'all') params.set('category', currentCategory)
            if (value !== 'all') params.set('type', value)
        }
        const queryString = params.toString()
        router.push(queryString ? `${pathname}?${queryString}` : pathname)
    }

    const clearFilters = () => {
        router.push(pathname)
    }

    const hasFilters = currentCategory !== 'all' || currentType !== 'all'

    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-xl bg-white border">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <Filter className="h-3.5 w-3.5" />
                Filtrele:
            </div>

            {/* Category Filters */}
            <div className="flex items-center gap-1 flex-wrap">
                {categories.map(cat => {
                    const Icon = cat.icon
                    const isActive = currentCategory === cat.value
                    return (
                        <Button
                            key={cat.value}
                            variant={isActive ? 'default' : 'outline'}
                            size="sm"
                            className={`h-7 text-[11px] font-medium gap-1.5 rounded-full px-3 ${isActive
                                    ? 'bg-slate-900 text-white hover:bg-slate-800'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                }`}
                            onClick={() => updateFilter('category', cat.value)}
                        >
                            <Icon className="h-3 w-3" />
                            {cat.label}
                        </Button>
                    )
                })}
            </div>

            <div className="hidden sm:block h-6 w-px bg-slate-200" />

            {/* Type Filters */}
            <div className="flex items-center gap-1 flex-wrap">
                {types.map(typ => {
                    const Icon = typ.icon
                    const isActive = currentType === typ.value
                    return (
                        <Button
                            key={typ.value}
                            variant={isActive ? 'default' : 'outline'}
                            size="sm"
                            className={`h-7 text-[11px] font-medium gap-1.5 rounded-full px-3 ${isActive
                                    ? 'bg-slate-900 text-white hover:bg-slate-800'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                }`}
                            onClick={() => updateFilter('type', typ.value)}
                        >
                            <Icon className="h-3 w-3" />
                            {typ.label}
                        </Button>
                    )
                })}
            </div>

            {/* Clear */}
            {hasFilters && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[11px] text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full gap-1 ml-auto"
                    onClick={clearFilters}
                >
                    <X className="h-3 w-3" />
                    Temizle
                </Button>
            )}
        </div>
    )
}
