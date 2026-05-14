'use client'

import { createContext, useContext, type ReactNode } from 'react'

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
