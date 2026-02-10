import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bell, ExternalLink, DollarSign, Users, Settings, Package, Clock, AlertTriangle, CheckCircle2, Info, Filter } from 'lucide-react'
import { getSystemNotifications } from './actions'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { NotificationFilters } from './notification-filters'

// Category config
const categoryConfig: Record<string, { icon: string; color: string; bg: string; label: string }> = {
    CRM: { icon: 'users', color: 'text-blue-600', bg: 'bg-blue-100', label: 'CRM' },
    Finance: { icon: 'dollar', color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Finans' },
    System: { icon: 'settings', color: 'text-slate-600', bg: 'bg-slate-100', label: 'Sistem' },
    HR: { icon: 'users', color: 'text-purple-600', bg: 'bg-purple-100', label: 'İK' },
    Inventory: { icon: 'package', color: 'text-amber-600', bg: 'bg-amber-100', label: 'Envanter' },
}

// Type config
const typeConfig: Record<string, { color: string; bg: string; borderColor: string; label: string }> = {
    Info: { color: 'text-blue-700', bg: 'bg-blue-50', borderColor: 'border-blue-200', label: 'Bilgi' },
    Warning: { color: 'text-amber-700', bg: 'bg-amber-50', borderColor: 'border-amber-200', label: 'Dikkat' },
    Alert: { color: 'text-red-700', bg: 'bg-red-50', borderColor: 'border-red-200', label: 'Uyarı' },
    Success: { color: 'text-emerald-700', bg: 'bg-emerald-50', borderColor: 'border-emerald-200', label: 'Başarılı' },
}

function getCategoryIcon(category: string) {
    const config = categoryConfig[category] || categoryConfig.System
    switch (config.icon) {
        case 'users': return <Users className={`h-4 w-4 ${config.color}`} />
        case 'dollar': return <DollarSign className={`h-4 w-4 ${config.color}`} />
        case 'settings': return <Settings className={`h-4 w-4 ${config.color}`} />
        case 'package': return <Package className={`h-4 w-4 ${config.color}`} />
        default: return <Bell className={`h-4 w-4 ${config.color}`} />
    }
}

function getTypeIcon(type: string) {
    switch (type) {
        case 'Alert': return <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
        case 'Warning': return <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
        case 'Success': return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
        default: return <Info className="h-3.5 w-3.5 text-blue-500" />
    }
}

export default async function NotificationsPage(props: {
    params: Promise<{ locale: string }>
    searchParams: Promise<{ category?: string; type?: string }>
}) {
    const { locale } = await props.params
    const searchParams = await props.searchParams
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    let notifications = await getSystemNotifications()

    // Apply filters from searchParams
    const filterCategory = searchParams.category
    const filterType = searchParams.type

    if (filterCategory && filterCategory !== 'all') {
        notifications = notifications.filter((n: any) => n.category === filterCategory)
    }
    if (filterType && filterType !== 'all') {
        notifications = notifications.filter((n: any) => n.type === filterType)
    }

    // Stats
    const allNotifs = await getSystemNotifications()
    const unreadCount = allNotifs.filter((n: any) => !n.is_read).length
    const todayCount = allNotifs.filter((n: any) => {
        const date = new Date(n.created_at)
        const today = new Date()
        return date.toDateString() === today.toDateString()
    }).length
    const alertCount = allNotifs.filter((n: any) => n.type === 'Alert' && !n.is_read).length

    // Group notifications by date
    const groupByDate = (items: any[]) => {
        const groups: Record<string, any[]> = {}
        items.forEach(n => {
            const date = new Date(n.created_at).toLocaleDateString('tr-TR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
            if (!groups[date]) groups[date] = []
            groups[date].push(n)
        })
        return groups
    }

    const grouped = groupByDate(notifications)

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">🔔 Bildirimler</h1>
                    <p className="text-muted-foreground text-sm">Sistem tarafından oluşturulan tüm uyarı ve hatırlatmalar</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-blue-100 bg-gradient-to-br from-blue-50 to-white">
                    <CardContent className="flex items-center gap-4 p-4">
                        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-100">
                            <Bell className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-blue-900">{unreadCount}</p>
                            <p className="text-[11px] text-blue-600 font-medium">Okunmamış</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-emerald-100 bg-gradient-to-br from-emerald-50 to-white">
                    <CardContent className="flex items-center gap-4 p-4">
                        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-emerald-100">
                            <Clock className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-emerald-900">{todayCount}</p>
                            <p className="text-[11px] text-emerald-600 font-medium">Bugünkü</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-red-100 bg-gradient-to-br from-red-50 to-white">
                    <CardContent className="flex items-center gap-4 p-4">
                        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-red-100">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-red-900">{alertCount}</p>
                            <p className="text-[11px] text-red-600 font-medium">Kritik Uyarı</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <NotificationFilters
                currentCategory={filterCategory || 'all'}
                currentType={filterType || 'all'}
            />

            {/* Notification List */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">Bildirim Geçmişi</CardTitle>
                            <CardDescription className="text-xs">
                                {notifications.length} bildirim gösteriliyor
                                {filterCategory && filterCategory !== 'all' ? ` • ${categoryConfig[filterCategory]?.label || filterCategory}` : ''}
                                {filterType && filterType !== 'all' ? ` • ${typeConfig[filterType]?.label || filterType}` : ''}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-4 border border-dashed rounded-lg bg-slate-50/50">
                            <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center">
                                <Bell className="h-8 w-8 text-slate-200" />
                            </div>
                            <div className="text-center">
                                <p className="font-medium text-slate-500">Bildirim bulunamadı</p>
                                <p className="text-xs text-slate-400 mt-1">
                                    {filterCategory || filterType ? 'Filtre kriterlerine uygun bildirim yok.' : 'Henüz bir bildiriminiz bulunmuyor.'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {Object.entries(grouped).map(([date, items]) => (
                                <div key={date}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="h-px flex-1 bg-slate-100" />
                                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap px-2">
                                            {date}
                                        </span>
                                        <div className="h-px flex-1 bg-slate-100" />
                                    </div>
                                    <div className="space-y-2">
                                        {items.map((n: any) => {
                                            const catConfig = categoryConfig[n.category] || categoryConfig.System
                                            const typConfig = typeConfig[n.type] || typeConfig.Info
                                            return (
                                                <div
                                                    key={n.id}
                                                    className={`
                                                        flex items-start gap-4 p-4 rounded-xl border transition-all duration-200
                                                        ${n.is_read
                                                            ? 'bg-white border-slate-100 hover:border-slate-200'
                                                            : `${typConfig.bg} ${typConfig.borderColor} hover:shadow-sm`
                                                        }
                                                    `}
                                                >
                                                    {/* Category Icon */}
                                                    <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${catConfig.bg} flex-shrink-0 mt-0.5`}>
                                                        {getCategoryIcon(n.category)}
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0 space-y-1.5">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex items-center gap-2">
                                                                {!n.is_read && (
                                                                    <span className="h-2 w-2 rounded-full bg-blue-600 flex-shrink-0 animate-pulse" />
                                                                )}
                                                                <p className={`font-semibold text-sm ${n.is_read ? 'text-slate-700' : 'text-slate-900'}`}>
                                                                    {n.title}
                                                                </p>
                                                            </div>
                                                            <span className="text-[10px] text-muted-foreground whitespace-nowrap flex items-center gap-1">
                                                                <Clock className="h-2.5 w-2.5" />
                                                                {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: tr })}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-slate-600 leading-relaxed">
                                                            {n.message}
                                                        </p>
                                                        <div className="flex items-center gap-2 pt-0.5">
                                                            {/* Type Badge */}
                                                            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${typConfig.bg} ${typConfig.borderColor} ${typConfig.color}`}>
                                                                {getTypeIcon(n.type)}
                                                                {typConfig.label}
                                                            </span>
                                                            {/* Category Badge */}
                                                            <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${catConfig.bg} ${catConfig.color}`}>
                                                                {catConfig.label}
                                                            </span>
                                                            {/* Link */}
                                                            {n.link && (
                                                                <Link
                                                                    href={n.link}
                                                                    className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-800 hover:underline ml-auto font-medium"
                                                                >
                                                                    Detayları Gör <ExternalLink className="h-2.5 w-2.5" />
                                                                </Link>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
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
