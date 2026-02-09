'use client'

import { useState, useEffect } from 'react'
import { Bell, Check, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSystemNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/app/[locale]/(dashboard)/notifications/actions'

interface Notification {
    id: string
    type: string
    title: string
    message: string
    link?: string
    is_read: boolean
    created_at: string
}

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const unreadCount = notifications.filter(n => !n.is_read).length

    // Polling or simple fetch on mount/open
    const fetchNotifications = async () => {
        setLoading(true)
        const data = await getSystemNotifications()
        if (data) setNotifications(data as Notification[])
        setLoading(false)
    }

    useEffect(() => {
        // Initial fetch
        fetchNotifications()

        // Simple polling every 60s
        const interval = setInterval(fetchNotifications, 60000)
        return () => clearInterval(interval)
    }, [])

    const handleMarkAsRead = async (id: string, link?: string) => {
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
        await markNotificationAsRead(id)

        if (link) {
            setOpen(false)
            router.push(link)
        }
    }

    const handleMarkAllRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
        await markAllNotificationsAsRead()
    }

    return (
        <Popover open={open} onOpenChange={(val) => {
            setOpen(val)
            if (val) fetchNotifications()
        }}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative group">
                    <Bell className="h-5 w-5 text-slate-500 group-hover:text-slate-800 transition-colors" />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-600 border-2 border-white animate-pulse" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50/50">
                    <h4 className="font-semibold text-sm">Bildirimler</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto text-[10px] text-blue-600 font-medium px-2 py-0.5 hover:bg-blue-50"
                            onClick={handleMarkAllRead}
                        >
                            Tümünü Okundu İşaretle
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground p-6">
                            <Bell className="h-8 w-8 opacity-20" />
                            <p className="text-xs">Yeni bildiriminiz yok.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col divide-y">
                            {notifications.map((n) => (
                                <div
                                    key={n.id}
                                    className={`flex flex-col gap-1 p-4 text-sm hover:bg-slate-50 transition-colors cursor-pointer ${!n.is_read ? 'bg-blue-50/30' : ''}`}
                                    onClick={() => handleMarkAsRead(n.id, n.link)}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <p className={`font-medium ${!n.is_read ? 'text-blue-900' : 'text-slate-700'}`}>
                                            {n.title}
                                        </p>
                                        {!n.is_read && (
                                            <span className="h-2 w-2 rounded-full bg-blue-600 flex-shrink-0 mt-1.5" />
                                        )}
                                    </div>
                                    <p className="text-slate-500 leading-snug line-clamp-2 text-xs">
                                        {n.message}
                                    </p>
                                    <div className="flex items-center justify-between mt-1.5">
                                        <span className="text-[10px] text-muted-foreground">
                                            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: tr })}
                                        </span>
                                        {n.link && (
                                            <ExternalLink className="h-3 w-3 text-slate-400" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                <div className="p-2 border-t bg-slate-50/50 text-center">
                    <Link href="/notifications" className="text-[10px] text-muted-foreground hover:text-slate-900 underline" onClick={() => setOpen(false)}>
                        Tüm Geçmişi Gör
                    </Link>
                </div>
            </PopoverContent>
        </Popover>
    )
}
