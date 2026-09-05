'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { BackButton } from '@/components/back-button'
import { ProjectSaveButton } from '@/components/projects/ProjectSaveButton'
import { Home, FileText, Users, Building2 } from 'lucide-react'

interface ProjectDetailTabsProps {
    projectId: string
    projectName: string
    initialTab?: string
    unitsCount?: number
    documentsCount?: number
    children: React.ReactNode
}

export function ProjectDetailTabs({
    projectId,
    projectName,
    initialTab = 'info',
    unitsCount = 0,
    documentsCount = 0,
    children
}: ProjectDetailTabsProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const urlTab = searchParams.get('tab')
    const storageKey = `project_tab_${projectId}`

    // Determine initial active tab
    const [activeTab, setActiveTab] = useState<string>(() => {
        if (urlTab) return urlTab
        if (typeof window !== 'undefined') {
            const saved = sessionStorage.getItem(storageKey)
            if (saved) return saved
        }
        return initialTab
    })

    // Sync with URL or storage on mount / param changes
    useEffect(() => {
        if (urlTab) {
            setActiveTab(urlTab)
            sessionStorage.setItem(storageKey, urlTab)
        } else {
            // If URL doesn't specify tab, check sessionStorage
            const saved = sessionStorage.getItem(storageKey)
            if (saved && saved !== 'info') {
                setActiveTab(saved)
                const currentParams = new URLSearchParams(window.location.search)
                currentParams.set('tab', saved)
                window.history.replaceState(null, '', `${window.location.pathname}?${currentParams.toString()}`)
            }
        }
    }, [urlTab, storageKey])

    const handleTabChange = useCallback((newTab: string) => {
        setActiveTab(newTab)
        sessionStorage.setItem(storageKey, newTab)

        // Update URL query parameter without a jarring full page navigation
        const currentParams = new URLSearchParams(window.location.search)
        currentParams.set('tab', newTab)
        const newUrl = `${pathname}?${currentParams.toString()}`
        window.history.replaceState(null, '', newUrl)
    }, [pathname, storageKey])

    return (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <BackButton variant="outline" label="Listeye Dön" href="/projects" />
                    <h1 className="text-2xl font-bold tracking-tight">
                        Proje Detayları: <span className="text-blue-600">{projectName}</span>
                    </h1>
                    {activeTab === 'info' && <ProjectSaveButton />}
                </div>
            </div>

            <TabsList className="mb-6">
                <TabsTrigger value="info">Proje Bilgileri</TabsTrigger>
                <TabsTrigger value="units">
                    <Home className="w-4 h-4 mr-2" />
                    Üniteler
                    {unitsCount > 0 && (
                        <Badge variant="secondary" className="ml-2">{unitsCount}</Badge>
                    )}
                </TabsTrigger>
                <TabsTrigger value="documents">
                    <FileText className="w-4 h-4 mr-2" />
                    Proje Dokümanları
                    {documentsCount > 0 && (
                        <Badge variant="secondary" className="ml-2">{documentsCount}</Badge>
                    )}
                </TabsTrigger>
                <TabsTrigger value="teams">
                    <Users className="w-4 h-4 mr-2" />
                    Satış Ekipleri
                </TabsTrigger>
                <TabsTrigger value="broker-access">
                    <Users className="w-4 h-4 mr-2" />
                    Broker Erişimi
                </TabsTrigger>
                <TabsTrigger value="construction">
                    <Building2 className="w-4 h-4 mr-2" />
                    Şantiye & İlerleme
                </TabsTrigger>
            </TabsList>

            {children}
        </Tabs>
    )
}
