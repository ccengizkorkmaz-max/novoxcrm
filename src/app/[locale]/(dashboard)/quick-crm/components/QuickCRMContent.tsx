'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { CustomerSelector } from './CustomerSelector'
import { QuickInventory } from './QuickInventory'
import { ActionCenter } from './ActionCenter'
import { Card } from '@/components/ui/card'

interface Props {
    initialProjects: any[]
    initialCustomers: any[]
    initialUnits: any[]
    templates: any[]
}

export function QuickCRMContent({ initialProjects, initialCustomers, initialUnits, templates }: Props) {
    const t = useTranslations('QuickCRM')
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
    const [selectedUnit, setSelectedUnit] = useState<any>(null)

    return (
        <div className="grid grid-cols-12 gap-4 h-full overflow-hidden pb-4">
            {/* Left: Customer Selection (3 cols) */}
            <div className="col-span-12 lg:col-span-3 flex flex-col gap-4 overflow-hidden h-full">
                <CustomerSelector
                    initialCustomers={initialCustomers}
                    onSelect={setSelectedCustomer}
                    selectedCustomer={selectedCustomer}
                />
            </div>

            {/* Middle: Inventory (6 cols) */}
            <div className="col-span-12 lg:col-span-6 flex flex-col gap-4 overflow-hidden h-full">
                <QuickInventory
                    projects={initialProjects}
                    initialUnits={initialUnits}
                    onSelect={setSelectedUnit}
                    selectedUnit={selectedUnit}
                />
            </div>

            {/* Right: Action Center (3 cols) */}
            <div className="col-span-12 lg:col-span-3 flex flex-col gap-4 overflow-hidden h-full">
                <ActionCenter
                    customer={selectedCustomer}
                    unit={selectedUnit}
                    templates={templates}
                    onClearCustomer={() => setSelectedCustomer(null)}
                    onClearUnit={() => setSelectedUnit(null)}
                />
            </div>
        </div>
    )
}
