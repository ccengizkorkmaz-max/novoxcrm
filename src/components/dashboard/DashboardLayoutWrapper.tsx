'use client'

import React, { useState, useEffect } from 'react'
import { Link } from '@/i18n/routing'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Building2, Menu, Settings, ChevronLeft, ChevronRight } from 'lucide-react'
import { NovoxSidebar } from '@/components/dashboard/NovoxSidebar'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import NotificationBell from '@/components/notifications/NotificationBell'
import { TooltipProvider } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface DashboardLayoutWrapperProps {
    children: React.ReactNode
    brand: any
    cssVars: any
    tenantType: string
    tenantName: string
    profile: any
    userEmail: string
    sidebarLabels: any
    hasBrokerModule: boolean
    hasOutreachModule: boolean
    isAuthorizedForSettings: boolean
    logoutForm: React.ReactNode
}

export function DashboardLayoutWrapper({
    children,
    brand,
    cssVars,
    tenantType,
    tenantName,
    profile,
    userEmail,
    sidebarLabels,
    hasBrokerModule,
    hasOutreachModule,
    isAuthorizedForSettings,
    logoutForm
}: DashboardLayoutWrapperProps) {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [mounted, setMounted] = useState(false)

    // Load collapsed state from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('sidebar_collapsed')
        if (saved === 'true') {
            setIsCollapsed(true)
        }
        setMounted(true)
    }, [])

    const toggleSidebar = () => {
        const nextState = !isCollapsed
        setIsCollapsed(nextState)
        localStorage.setItem('sidebar_collapsed', String(nextState))
    }

    if (!mounted) {
        return (
            <div className="flex h-screen w-full bg-muted/40 font-sans opacity-0" style={cssVars as React.CSSProperties} />
        )
    }

    return (
        <TooltipProvider delayDuration={100}>
            <div className="flex h-screen w-full bg-muted/40 font-sans transition-all duration-300" style={cssVars as React.CSSProperties} data-ui-style={brand.uiStyle || 'default'}>
                {/* Sidebar */}
                <aside 
                    className={cn(
                        "fixed inset-y-0 left-0 z-10 hidden flex-col border-r md:flex print:hidden transition-all duration-300",
                        isCollapsed ? "w-[70px]" : "w-64"
                    )}
                    style={{ backgroundColor: brand.sidebarBg, borderColor: brand.sidebarBorder }}
                >
                    <div 
                        className={cn(
                            "flex flex-col px-4 relative transition-all duration-300",
                            isCollapsed ? "h-[73px] justify-center py-2" : "py-4 justify-between min-h-[90px]"
                        )} 
                        style={{ borderBottomWidth: '1px', borderColor: brand.sidebarBorder }}
                    >
                        <div className="flex items-center justify-between">
                            <Link href="/" className="flex items-center gap-2 font-bold text-white overflow-hidden">
                                {brand.logoUrl ? (
                                    <img src={brand.logoUrl} alt={brand.appName} className="h-6 w-6 object-contain flex-shrink-0" />
                                ) : (
                                    <Building2 className="h-6 w-6 flex-shrink-0" style={{ color: brand.primaryColor }} />
                                )}
                                {!isCollapsed && (
                                    <>
                                        <span className="text-lg tracking-tight truncate">{brand.appName}</span>
                                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md flex-shrink-0" style={{ backgroundColor: brand.badgeBg, color: brand.badgeText }}>
                                            {tenantType === 'broker' ? '.bro' : brand.badgeLabel}
                                        </span>
                                    </>
                                )}
                            </Link>
                        </div>
                        {!isCollapsed && (
                            <div className="mt-1.5 flex flex-col overflow-hidden leading-tight">
                                <span className="text-xs font-bold text-slate-200 truncate">{tenantName}</span>
                                <span className="text-[10px] text-slate-400 truncate mt-0.5">{profile?.full_name || userEmail}</span>
                            </div>
                        )}
                        
                        {/* Collapse Button */}
                        <button 
                            onClick={toggleSidebar}
                            className="absolute -right-3 top-6 h-6 w-6 rounded-full border bg-background hover:bg-accent flex items-center justify-center shadow-md z-30 transition-transform duration-200"
                            style={{ borderColor: brand.sidebarBorder }}
                        >
                            {isCollapsed ? (
                                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                            ) : (
                                <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                        </button>
                    </div>
                    <div className="flex-1 overflow-auto py-2 scrollbar-premium">
                        <NovoxSidebar 
                            role={profile?.role || 'sales'} 
                            labels={sidebarLabels} 
                            tenantType={tenantType} 
                            hasBrokerModule={hasBrokerModule} 
                            hasOutreachModule={hasOutreachModule} 
                            isCollapsed={isCollapsed}
                        />
                    </div>
                    <div className="p-4 flex items-center justify-between gap-2" style={{ borderTopWidth: '1px', borderColor: brand.sidebarBorder }}>
                        {!isCollapsed && (
                            <div className="flex items-center gap-1 overflow-hidden">
                                <span className="text-[10px] text-slate-500 truncate max-w-[120px]">{userEmail}</span>
                            </div>
                        )}
                        <div className={cn("flex w-full items-center", isCollapsed ? "justify-center" : "justify-end")}>
                            {logoutForm}
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <div 
                    className={cn(
                        "flex-1 min-w-0 flex flex-col md:py-2 print:pl-0 transition-all duration-300 relative",
                        isCollapsed ? "md:pl-[70px]" : "md:pl-64"
                    )}
                >
                    <header className="sticky top-0 z-30 flex min-h-[calc(3.5rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] items-center gap-4 border-b bg-background px-4 md:static md:h-auto md:border-0 md:bg-transparent md:px-6 md:hidden print:hidden">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button size="icon" variant="outline" className="md:hidden" suppressHydrationWarning>
                                    <Menu className="h-5 w-5" />
                                    <span className="sr-only">Toggle Menu</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="sm:max-w-xs flex flex-col p-0 border-r-0" style={{ backgroundColor: brand.sidebarBg }}>
                                <div className="flex flex-col px-4 py-3" style={{ borderBottomWidth: '1px', borderColor: brand.sidebarBorder }}>
                                    <div className="flex items-center justify-between mb-2">
                                        <Link href="/" className="flex items-center gap-2 font-bold text-white">
                                            {brand.logoUrl ? (
                                                <img src={brand.logoUrl} alt={brand.appName} className="h-6 w-6 object-contain" />
                                            ) : (
                                                <Building2 className="h-6 w-6" style={{ color: brand.primaryColor }} />
                                            )}
                                            <span className="text-lg tracking-tight">{brand.appName}</span>
                                            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md" style={{ backgroundColor: brand.badgeBg, color: brand.badgeText }}>
                                                {tenantType === 'broker' ? '.bro' : brand.badgeLabel}
                                            </span>
                                        </Link>
                                    </div>
                                    <div className="mt-1 flex flex-col">
                                        <span className="text-xs font-bold text-slate-200">{tenantName}</span>
                                        <span className="text-[10px] text-slate-400">{profile?.full_name}</span>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-auto py-2 scrollbar-premium">
                                    <NovoxSidebar role={profile?.role || 'sales'} labels={sidebarLabels} tenantType={tenantType} hasBrokerModule={hasBrokerModule} hasOutreachModule={hasOutreachModule} isCollapsed={false} />
                                </div>
                                <div className="px-4 py-2">
                                    <LanguageSwitcher variant="light" />
                                </div>
                                <div className="p-4 flex items-center justify-between" style={{ borderTopWidth: '1px', borderColor: brand.sidebarBorder }}>
                                    {isAuthorizedForSettings && (
                                        <Link href="/settings" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white">
                                            <Settings className="h-4 w-4" />
                                            Settings
                                        </Link>
                                    )}
                                    {logoutForm}
                                </div>
                            </SheetContent>
                        </Sheet>
                        <div className="flex flex-col ml-2 flex-1">
                            <div className="flex items-center justify-between w-full">
                                <span className="font-bold text-sm leading-none">{brand.appName}</span>
                                <span className="text-[8px] font-black uppercase px-1 py-0.5 rounded" style={{ backgroundColor: brand.badgeBg, color: brand.badgeText }}>
                                    {tenantType === 'broker' ? '.bro' : brand.badgeLabel}
                                </span>
                                <div className="flex items-center gap-2">
                                    <NotificationBell />
                                </div>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-muted-foreground font-medium">{tenantName}</span>
                                <span className="text-[10px] text-muted-foreground/60">•</span>
                                <span className="text-[10px] text-muted-foreground/60">{profile?.full_name || userEmail}</span>
                            </div>
                        </div>
                    </header>

                    {/* Top Right Utilities — flow-based, not absolute */}
                    <div className="hidden md:flex items-center justify-end gap-2 px-4 pt-2 pb-0 print:hidden shrink-0">
                        <LanguageSwitcher />
                        {isAuthorizedForSettings && (
                            <Link href="/settings">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent">
                                    <Settings className="h-4 w-4" />
                                </Button>
                            </Link>
                        )}
                        <NotificationBell />
                    </div>

                    <main className="flex-1 items-start p-2 sm:px-4 sm:py-2 md:pr-4 overflow-auto">
                        {children}
                    </main>
                </div>
            </div>
        </TooltipProvider>
    )
}
