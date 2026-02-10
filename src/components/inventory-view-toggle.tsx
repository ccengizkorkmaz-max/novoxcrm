'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { LayoutGrid, List } from 'lucide-react'
import { InventoryGridView } from '@/components/inventory-grid-view'

interface InventoryViewWrapperProps {
    units: any[]
    tableView: React.ReactNode
    mobileView: React.ReactNode
}

export function InventoryViewWrapper({ units, tableView, mobileView }: InventoryViewWrapperProps) {
    const [view, setView] = useState<'table' | 'grid'>('table')

    return (
        <>
            {/* Toggle Buttons */}
            <div className="flex items-center border rounded-lg overflow-hidden">
                <Button
                    variant={view === 'table' ? 'default' : 'ghost'}
                    size="sm"
                    className="h-8 px-3 rounded-none text-xs font-bold gap-1.5"
                    onClick={() => setView('table')}
                >
                    <List className="h-3.5 w-3.5" />
                    Tablo
                </Button>
                <Button
                    variant={view === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    className="h-8 px-3 rounded-none text-xs font-bold gap-1.5"
                    onClick={() => setView('grid')}
                >
                    <LayoutGrid className="h-3.5 w-3.5" />
                    Grid
                </Button>
            </div>

            {/* Conditional rendering */}
            {view === 'grid' ? (
                <div className="w-full">
                    <InventoryGridView units={units} />
                </div>
            ) : (
                <>
                    {/* Desktop Table */}
                    <div className="hidden md:block">{tableView}</div>
                    {/* Mobile Cards */}
                    <div className="md:hidden">{mobileView}</div>
                </>
            )}
        </>
    )
}
