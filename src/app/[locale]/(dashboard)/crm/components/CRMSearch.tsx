'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useDebounce } from '@/hooks/use-debounce'

export default function CRMSearch() {
    const t = useTranslations('CRM')
    const router = useRouter()
    const searchParams = useSearchParams()

    const [value, setValue] = useState(searchParams.get('q') || '')
    const debouncedValue = useDebounce(value, 500)

    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString())
        const currentQ = params.get('q') || ''

        if (debouncedValue === currentQ) return

        if (debouncedValue) {
            params.set('q', debouncedValue)
        } else {
            params.delete('q')
        }
        router.push(`?${params.toString()}`)
    }, [debouncedValue, router, searchParams])

    return (
        <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
                placeholder={t('searchPlaceholder') || "İsim, telefon veya e-posta..."}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="pl-10 h-10 bg-white border-slate-200 focus:ring-blue-500 rounded-xl transition-all shadow-sm"
            />
        </div>
    )
}
