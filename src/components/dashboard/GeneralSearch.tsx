'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useDebounce } from '@/hooks/use-debounce'

interface GeneralSearchProps {
    placeholderKey?: string
    namespace?: string
    paramName?: string
}

export default function GeneralSearch({
    placeholderKey = 'searchPlaceholder',
    namespace = 'Common',
    paramName = 'q'
}: GeneralSearchProps) {
    const t = useTranslations(namespace as any)
    const router = useRouter()
    const searchParams = useSearchParams()

    const [value, setValue] = useState(searchParams.get(paramName) || '')
    const debouncedValue = useDebounce(value, 500)

    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString())
        if (debouncedValue) {
            params.set(paramName, debouncedValue)
        } else {
            params.delete(paramName)
        }
        router.push(`?${params.toString()}`)
    }, [debouncedValue, router, searchParams, paramName])

    return (
        <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
                placeholder={t(placeholderKey as any) || "Ara..."}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="pl-10 h-10 bg-white border-slate-200 focus:ring-blue-500 rounded-xl transition-all shadow-sm"
            />
        </div>
    )
}
