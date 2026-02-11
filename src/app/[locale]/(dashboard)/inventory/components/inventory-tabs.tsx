'use client'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useRouter } from 'next/navigation'
import { LayoutDashboard, List, LayoutGrid, Map, BarChart3, TrendingUp } from 'lucide-react'
import * as React from 'react'

export function InventoryTabs({ children, defaultValue }: { children: React.ReactNode, defaultValue: string }) {
    // Initialize state with the default value passed from the server
    const [activeTab, setActiveTab] = React.useState(defaultValue)
    const router = useRouter() // Initialized useRouter

    const handleTabChange = (value: string) => {
        setActiveTab(value)

        // Update URL search param for 'tab' WITHOUT browser reload
        // Since buttons are now inside TabsContent, we don't need a server-side re-render
        const url = new URL(window.location.href)
        url.searchParams.set('tab', value)
        window.history.pushState({}, '', url.toString())
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
