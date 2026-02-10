'use client'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LayoutDashboard, List, LayoutGrid, Map, BarChart3, TrendingUp } from 'lucide-react'
import * as React from 'react'

export function InventoryTabs({ children, defaultValue }: { children: React.ReactNode, defaultValue: string }) {
    // Initialize state with the default value passed from the server
    const [activeTab, setActiveTab] = React.useState(defaultValue)

    const handleTabChange = (value: string) => {
        setActiveTab(value)

        // Update the URL query parameter without triggering a server request/page reload
        // This makes tab switching instant
        const url = new URL(window.location.href)
        url.searchParams.set('tab', value)
        window.history.pushState({}, '', url)
    }

    return (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-col h-full gap-6">
            <TabsList className="grid w-full grid-cols-6 lg:w-[850px] overflow-x-auto">
                <TabsTrigger value="dashboard" className="gap-2 text-xs md:text-sm">
                    <LayoutDashboard className="h-4 w-4" /> <span className="hidden sm:inline">Dashboard</span>
                </TabsTrigger>
                <TabsTrigger value="list" className="gap-2 text-xs md:text-sm">
                    <List className="h-4 w-4" /> <span className="hidden sm:inline">Liste</span>
                </TabsTrigger>
                <TabsTrigger value="grid" className="gap-2 text-xs md:text-sm">
                    <LayoutGrid className="h-4 w-4" /> <span className="hidden sm:inline">Grid</span>
                </TabsTrigger>
                <TabsTrigger value="plans" className="gap-2 text-xs md:text-sm">
                    <Map className="h-4 w-4" /> <span className="hidden sm:inline">Planlar</span>
                </TabsTrigger>
                <TabsTrigger value="forecasts" className="gap-2 text-xs md:text-sm">
                    <TrendingUp className="h-4 w-4" /> <span className="hidden sm:inline">Satış Hızı</span>
                </TabsTrigger>
                <TabsTrigger value="reports" className="gap-2 text-xs md:text-sm">
                    <BarChart3 className="h-4 w-4" /> <span className="hidden sm:inline">Raporlar</span>
                </TabsTrigger>
            </TabsList>
            {children}
        </Tabs>
    )
}
