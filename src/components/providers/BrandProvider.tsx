'use client'

import { createContext, useContext, useCallback, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'

interface BrandContextType {
    brandName: string
    /** Short brand identifier without "CRM" suffix, e.g. "Novo" or "Oikos" */
    brandShort: string
    /** Full domain, e.g. "novoxcrm.com" or "oikoscrm.com" */
    brandDomain: string
}

const BrandContext = createContext<BrandContextType>({
    brandName: 'Novo CRM',
    brandShort: 'Novo',
    brandDomain: 'novoxcrm.com',
})

export function BrandProvider({
    brandName,
    brandDomain,
    children,
}: {
    brandName: string
    brandDomain: string
    children: ReactNode
}) {
    // Extract short name: "Oikos CRM" -> "Oikos", "Novo CRM" -> "Novo"
    const brandShort = brandName.replace(/\s*CRM\s*/i, '').trim() || brandName

    return (
        <BrandContext.Provider value={{ brandName, brandShort, brandDomain }}>
            {children}
        </BrandContext.Provider>
    )
}

export function useBrand() {
    return useContext(BrandContext)
}

/**
 * Hook that wraps useTranslations and auto-replaces "Novo CRM" / "Novo"
 * with the current brand name in all translation outputs.
 * Supports: bt(key), bt.raw(key), bt.has(key)
 */
export function useBrandedTranslations(namespace: string) {
    const t = useTranslations(namespace)
    const { brandName, brandShort } = useBrand()

    const replaceBrand = useCallback(
        (text: string): string => {
            if (brandName === 'Novo CRM') return text
            return text
                .replace(/Novo CRM/g, brandName)
                .replace(/NovoCRM/g, brandName.replace(' ', ''))
                .replace(/\bNovo\b/g, brandShort)
        },
        [brandName, brandShort]
    )

    // Deep-replace brand in any JSON structure returned by t.raw()
    const deepReplace = useCallback(
        (value: any): any => {
            if (brandName === 'Novo CRM') return value
            if (typeof value === 'string') return replaceBrand(value)
            if (Array.isArray(value)) return value.map(deepReplace)
            if (value && typeof value === 'object') {
                const result: any = {}
                for (const k of Object.keys(value)) {
                    result[k] = deepReplace(value[k])
                }
                return result
            }
            return value
        },
        [brandName, replaceBrand]
    )

    // Build a callable function with .raw() and .has() attached
    const bt = useCallback(
        (key: string, values?: Record<string, any>) => {
            return replaceBrand(t(key, values))
        },
        [t, replaceBrand]
    )

    // Attach raw method
    return Object.assign(bt, {
        raw: (key: string) => deepReplace(t.raw(key)),
        has: (key: string) => t.has(key),
    })
}
