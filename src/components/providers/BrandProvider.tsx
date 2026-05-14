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
 * Usage: const bt = useBrandedTranslations('Hero')
 *        bt('description') // "Novo CRM" in translation → "Oikos CRM"
 */
export function useBrandedTranslations(namespace: string) {
    const t = useTranslations(namespace)
    const { brandName, brandShort } = useBrand()

    return useCallback(
        (key: string, values?: Record<string, any>) => {
            const raw = t(key, values)
            if (brandName === 'Novo CRM') return raw // no replacement needed
            return raw
                .replace(/Novo CRM/g, brandName)
                .replace(/NovoCRM/g, brandName.replace(' ', ''))
                .replace(/\bNovo\b/g, brandShort)
        },
        [t, brandName, brandShort]
    )
}

