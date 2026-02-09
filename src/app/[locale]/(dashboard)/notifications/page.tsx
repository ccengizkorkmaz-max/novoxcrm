import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Bell, Check, ExternalLink } from 'lucide-react'
import { getSystemNotifications, markNotificationAsRead, markAllNotificationsAsRead } from './actions'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function NotificationsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const notifications = await getSystemNotifications()

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Bildirimler</h1>
                <p className="text-muted-foreground">Sistem tarafından oluşturulan tüm uyarı ve hatırlatmalar.</p>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-lg">Bildirim Geçmişi</CardTitle>
                        <CardDescription>Son 20 bildiriminiz aşağıda listelenmiştir.</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-4 border border-dashed rounded-lg bg-slate-50/50">
                            <Bell className="h-12 w-12 opacity-20" />
                            <p>Henüz bir bildiriminiz bulunmuyor.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {notifications.map((n) => (
                                <div
                                    key={n.id}
                                    className={`flex items-start gap-4 p-4 rounded-lg border ${n.is_read ? 'bg-white border-slate-100' : 'bg-blue-50/30 border-blue-100'}`}
                                >
                                    <div className={`mt-1 h-2 w-2 rounded-full ${n.is_read ? 'bg-slate-200' : 'bg-blue-600'}`} />

                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <p className={`font-medium ${n.is_read ? 'text-slate-700' : 'text-blue-900'}`}>
                                                {n.title}
                                            </p>
                                            <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                                {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: tr })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-600">
                                            {n.message}
                                        </p>
                                        {n.link && (
                                            <Link
                                                href={n.link}
                                                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-2"
                                            >
                                                Detayları Gör <ExternalLink className="h-3 w-3" />
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
