'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Bell, Check, ExternalLink, DollarSign, Users, Settings, Package, Clock, AlertTriangle, CheckCircle2, Info, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSystemNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/app/[locale]/(dashboard)/notifications/actions'
import { createClient } from '@/lib/supabase/client'

interface Notification {
    id: string
    type: string       // Info, Warning, Alert, Success
    category: string   // CRM, Finance, System, HR, Inventory
    title: string
    message: string
    link?: string
    is_read: boolean
    created_at: string
}

const categoryConfig: Record<string, { icon: any; color: string; bg: string }> = {
    CRM: { icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    Finance: { icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    System: { icon: Settings, color: 'text-slate-600', bg: 'bg-slate-100' },
    HR: { icon: Users, color: 'text-purple-600', bg: 'bg-purple-100' },
    Inventory: { icon: Package, color: 'text-amber-600', bg: 'bg-amber-100' },
}

const typeConfig: Record<string, { color: string; bg: string; icon: any }> = {
    Info: { color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: Info },
    Warning: { color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: AlertTriangle },
    Alert: { color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: AlertTriangle },
    Success: { color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
}

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [hadInitialFetch, setHadInitialFetch] = useState(false)
    const isFetching = useRef(false)
    const router = useRouter()

    const unreadCount = notifications.filter(n => !n.is_read).length

    const fetchNotifications = useCallback(async () => {
        if (isFetching.current) return
        try {
            isFetching.current = true
            setLoading(true)
            const data = await getSystemNotifications()
            console.log('🔔 Notifications received:', data?.length, data)
            if (data) setNotifications(data as Notification[])
        } catch (err) {
            console.error('Fetch notifications error:', err)
        } finally {
            setLoading(false)
            isFetching.current = false
            setHadInitialFetch(true)
        }
    }, [])

    // Add Real-time listener for new notifications
    useEffect(() => {
        const supabase = createClient()

        const channel = supabase
            .channel('system_notifications_changes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'system_notifications'
                },
                () => {
                    // When a new notification arrives, refresh the list
                    fetchNotifications()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [fetchNotifications])

    useEffect(() => {
        if (!hadInitialFetch) {
            fetchNotifications()
        }
        const interval = setInterval(fetchNotifications, 120000) // 2 minutes backup
        return () => clearInterval(interval)
    }, [fetchNotifications, hadInitialFetch])

    const handleMarkAsRead = async (id: string, link?: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
        await markNotificationAsRead(id)

        if (link) {
            setOpen(false)
            // Fix known broken links from legacy notifications
            const sanitizedLink = link.startsWith('/finance/reports') ? '/finance' : link
            router.push(sanitizedLink)
        }
    }

    const handleMarkAllRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
        await markAllNotificationsAsRead()
    }

    const getCategoryIcon = (category: string) => {
        const config = categoryConfig[category] || categoryConfig.System
        const Icon = config.icon
        return (
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${config.bg} flex-shrink-0`}>
                <Icon className={`h-3.5 w-3.5 ${config.color}`} />
            </div>
        )
    }

    const getTypeBadge = (type: string) => {
        const config = typeConfig[type] || typeConfig.Info
        return (
            <span className={`inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${config.bg} ${config.color}`}>
                {type === 'Alert' ? 'Uyarı' : type === 'Warning' ? 'Dikkat' : type === 'Success' ? 'Başarılı' : 'Bilgi'}
            </span>
        )
    }

    const groupNotifications = (items: Notification[]) => {
        const now = new Date()
        const todayAt = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
        const yesterdayAt = todayAt - 86400000

        const groups = [
            { label: 'Bugün', items: [] as Notification[] },
            { label: 'Dün', items: [] as Notification[] },
            { label: 'Daha Önce', items: [] as Notification[] },
        ]

        items.forEach(n => {
            const time = new Date(n.created_at).getTime()
            if (time >= todayAt) groups[0].items.push(n)
            else if (time >= yesterdayAt) groups[1].items.push(n)
            else groups[2].items.push(n)
        })

        return groups.filter(g => g.items.length > 0)
    }

    const groups = groupNotifications(notifications)

    return (
        <Popover open={open} onOpenChange={(val) => {
            setOpen(val)
            if (val) fetchNotifications()
        }}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-8 w-8 group"
                    aria-label="Bildirimler"
                >
                    <Bell className="h-[18px] w-[18px] text-slate-400 group-hover:text-white transition-colors" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center">
                            <span className="absolute h-4 w-4 rounded-full bg-red-500/30 animate-ping" />
                            <span className="relative flex items-center justify-center h-4 w-4 rounded-full bg-red-600 text-[9px] font-bold text-white border border-slate-950">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[380px] p-0 shadow-2xl border-slate-200" align="end" sideOffset={8}>
                <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-slate-50 to-white">
                    <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-800">Bildirimler</h4>
                        {unreadCount > 0 && (
                            <span className="flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-red-600 text-[10px] font-bold text-white">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto text-[10px] text-blue-600 font-semibold px-2 py-1 hover:bg-blue-50 rounded-md"
                            onClick={handleMarkAllRead}
                        >
                            <Check className="h-3 w-3 mr-1" />
                            Tümünü Okundu İşaretle
                        </Button>
                    )}
                </div>

                <ScrollArea className="h-[360px]">
                    {!hadInitialFetch && loading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3 p-6">
                            <div className="h-6 w-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                            <p className="text-xs text-muted-foreground">Yükleniyor...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground p-8">
                            <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center">
                                <Bell className="h-7 w-7 text-slate-200" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-medium text-slate-500">Bildirim yok</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">Yeni bildirimler burada görünecek.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {groups.map((group) => (
                                <div key={group.label}>
                                    <div className="sticky top-0 z-10 px-4 py-1.5 bg-slate-50/90 backdrop-blur-sm border-b">
                                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                            {group.label}
                                        </span>
                                    </div>
                                    {group.items.map((n) => (
                                        <div
                                            key={n.id}
                                            className={`
                                                flex items-start gap-3 p-3.5 text-sm cursor-pointer transition-all duration-150
                                                hover:bg-slate-50 border-b border-slate-50
                                                ${!n.is_read ? 'bg-blue-50/40' : ''}
                                            `}
                                            onClick={() => handleMarkAsRead(n.id, n.link)}
                                        >
                                            {getCategoryIcon(n.category)}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className={`text-xs font-semibold leading-snug ${!n.is_read ? 'text-slate-900' : 'text-slate-600'}`}>
                                                        {n.title}
                                                    </p>
                                                    {!n.is_read && (
                                                        <span className="h-2 w-2 rounded-full bg-blue-600 flex-shrink-0 mt-1 animate-pulse" />
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2 mt-0.5">
                                                    {n.message}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    {getTypeBadge(n.type)}
                                                    <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                                                        <Clock className="h-2.5 w-2.5" />
                                                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: tr })}
                                                    </span>
                                                    {n.link && (
                                                        <ChevronRight className="h-3 w-3 text-slate-300 ml-auto" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                <div className="p-2.5 border-t bg-gradient-to-r from-slate-50 to-white text-center">
                    <Link
                        href="/notifications"
                        className="inline-flex items-center gap-1.5 text-[11px] text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                        onClick={() => setOpen(false)}
                    >
                        Tüm Bildirimleri Görüntüle
                        <ExternalLink className="h-3 w-3" />
                    </Link>
                </div>
            </PopoverContent>
        </Popover>
    )
}
