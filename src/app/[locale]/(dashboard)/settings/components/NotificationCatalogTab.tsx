'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'
import {
    Bell, Mail, MessageSquare, Phone, Flame, CreditCard,
    FileText, Globe, Briefcase, ArrowRightLeft, PenTool,
    AlertTriangle, RotateCcw, CheckCircle2, Loader2,
    Monitor, Smartphone, Users, ChevronDown, ChevronRight
} from 'lucide-react'
import { getNotificationPreferences, upsertNotificationPreference, resetNotificationPreferences } from '../actions'

// ── Notification Type Definitions ──

interface NotificationType {
    id: string
    name: string
    description: string
    trigger: string
    icon: React.ReactNode
    defaultRecipient: string
    supportedChannels: ('in_app' | 'email' | 'whatsapp' | 'sms')[]
    category: 'sales' | 'finance' | 'broker' | 'system'
}

const NOTIFICATION_TYPES: NotificationType[] = [
    {
        id: 'hot_lead',
        name: 'Hot/Warm Lead Tespiti',
        description: 'AI mesaj analizi sonucu müşteri sıcak veya ılık lead olarak tespit edildiğinde',
        trigger: 'AI → [LEAD_SCORE:hot/warm]',
        icon: <Flame className="h-4 w-4 text-red-500" />,
        defaultRecipient: 'Hot Lead Manager',
        supportedChannels: ['in_app', 'email', 'whatsapp'],
        category: 'sales'
    },
    {
        id: 'call_requested',
        name: 'Arama Talebi',
        description: 'Müşteri "evet beni arayın" dediğinde otomatik bildirim',
        trigger: 'Müşteri yanıtı → call_requested',
        icon: <Phone className="h-4 w-4 text-purple-500" />,
        defaultRecipient: 'Hot Lead Manager',
        supportedChannels: ['in_app', 'email', 'whatsapp'],
        category: 'sales'
    },
    {
        id: 'overdue_payment',
        name: 'Gecikmiş Ödeme',
        description: 'Vadesi geçen ödeme tespit edildiğinde yöneticiye ve müşteriye bildirim',
        trigger: 'Scanner cron: vade < bugün',
        icon: <CreditCard className="h-4 w-4 text-red-600" />,
        defaultRecipient: 'Admin + Müşteri',
        supportedChannels: ['in_app', 'email', 'whatsapp', 'sms'],
        category: 'finance'
    },
    {
        id: 'approaching_check',
        name: 'Yaklaşan Çek/Senet',
        description: '3 gün içinde vadesi dolacak çek/senet tespit edildiğinde',
        trigger: 'Scanner cron: vade ≤ 3 gün',
        icon: <FileText className="h-4 w-4 text-amber-500" />,
        defaultRecipient: 'Admin',
        supportedChannels: ['in_app', 'email', 'whatsapp'],
        category: 'finance'
    },
    {
        id: 'new_web_form',
        name: 'Yeni Web Form Talebi',
        description: 'Web sitesinden yeni bir müşteri form doldurduğunda',
        trigger: 'Web form submit',
        icon: <Globe className="h-4 w-4 text-blue-500" />,
        defaultRecipient: 'Admin',
        supportedChannels: ['in_app', 'email', 'whatsapp'],
        category: 'sales'
    },
    {
        id: 'broker_new_lead',
        name: 'Broker Yeni Lead',
        description: 'Dış broker paylaşılan form üzerinden yeni müşteri başvurusu yaptığında',
        trigger: 'Broker form başvurusu',
        icon: <Briefcase className="h-4 w-4 text-teal-500" />,
        defaultRecipient: 'İlgili Broker',
        supportedChannels: ['in_app', 'email', 'whatsapp'],
        category: 'broker'
    },
    {
        id: 'broker_status_change',
        name: 'Broker Lead Durum Değişikliği',
        description: 'Broker lead\'inin durumu admin tarafından güncellendiğinde',
        trigger: 'Admin durum güncelleme',
        icon: <ArrowRightLeft className="h-4 w-4 text-indigo-500" />,
        defaultRecipient: 'İlgili Broker',
        supportedChannels: ['in_app', 'email', 'whatsapp'],
        category: 'broker'
    },
    {
        id: 'outreach_low_balance',
        name: 'Outreach Bakiye Yetersiz',
        description: 'Outreach (WhatsApp/SMS) kampanyası bakiye yetersizliği nedeniyle durdurulduğunda',
        trigger: 'Engine → bakiye kontrol',
        icon: <AlertTriangle className="h-4 w-4 text-orange-500" />,
        defaultRecipient: 'Admin',
        supportedChannels: ['in_app', 'email', 'whatsapp'],
        category: 'system'
    },
    {
        id: 'lead_assigned',
        name: 'Yeni Lead Ataması',
        description: 'Bir lead yeni bir temsilciye atandığında bildirim',
        trigger: 'Lead atama işlemi',
        icon: <Users className="h-4 w-4 text-sky-500" />,
        defaultRecipient: 'Atanan Temsilci',
        supportedChannels: ['in_app', 'email', 'whatsapp'],
        category: 'sales'
    },
    {
        id: 'contract_signed',
        name: 'Sözleşme İmzalandı',
        description: 'Bir satışın durumu "Sözleşme İmzalandı" olarak güncellendiğinde',
        trigger: 'Satış durumu → Contract Signed',
        icon: <PenTool className="h-4 w-4 text-emerald-500" />,
        defaultRecipient: 'Admin + Temsilci',
        supportedChannels: ['in_app', 'email', 'whatsapp'],
        category: 'sales'
    }
]

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
    sales: { label: 'Satış', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    finance: { label: 'Finans', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    broker: { label: 'Broker', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    system: { label: 'Sistem', color: 'bg-slate-100 text-slate-700 border-slate-200' }
}

const CHANNEL_INFO = {
    in_app: { label: 'Uygulama', icon: <Monitor className="h-3.5 w-3.5" />, color: 'text-blue-600' },
    email: { label: 'E-posta', icon: <Mail className="h-3.5 w-3.5" />, color: 'text-amber-600' },
    whatsapp: { label: 'WhatsApp', icon: <MessageSquare className="h-3.5 w-3.5" />, color: 'text-green-600' },
    sms: { label: 'SMS', icon: <Smartphone className="h-3.5 w-3.5" />, color: 'text-purple-600' }
}

// ── Component ──

interface NotificationCatalogTabProps {
    users: { id: string; full_name: string; email: string; role: string; phone?: string; is_active?: boolean }[]
    currentUserId: string
}

interface PrefMap {
    [userId: string]: {
        [notificationType: string]: {
            channel_in_app: boolean
            channel_email: boolean
            channel_whatsapp: boolean
            channel_sms: boolean
            is_enabled: boolean
        }
    }
}

export default function NotificationCatalogTab({ users, currentUserId }: NotificationCatalogTabProps) {
    const isAdmin = true // This tab is only rendered for admin/owner users
    const [preferences, setPreferences] = useState<PrefMap>({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState<string | null>(null)
    const [expandedUser, setExpandedUser] = useState<string | null>(currentUserId)
    const [resetting, setResetting] = useState(false)

    const activeUsers = users.filter(u => u.is_active !== false)

    // Load preferences
    const loadPreferences = useCallback(async () => {
        setLoading(true)
        const result = await getNotificationPreferences()
        if (result.data) {
            const map: PrefMap = {}
            for (const pref of result.data) {
                if (!map[pref.user_id]) map[pref.user_id] = {}
                map[pref.user_id][pref.notification_type] = {
                    channel_in_app: pref.channel_in_app ?? true,
                    channel_email: pref.channel_email ?? true,
                    channel_whatsapp: pref.channel_whatsapp ?? false,
                    channel_sms: pref.channel_sms ?? false,
                    is_enabled: pref.is_enabled ?? true
                }
            }
            setPreferences(map)
        }
        setLoading(false)
    }, [])

    useEffect(() => { loadPreferences() }, [loadPreferences])

    // Get preference for a user/type (with defaults — all OFF by default)
    const getPref = (userId: string, notifType: string) => {
        return preferences[userId]?.[notifType] ?? {
            channel_in_app: false,
            channel_email: false,
            channel_whatsapp: false,
            channel_sms: false,
            is_enabled: false
        }
    }

    // Toggle a channel
    const handleToggle = async (userId: string, notifType: string, channel: string, value: boolean) => {
        const key = `${userId}-${notifType}-${channel}`
        setSaving(key)

        // Optimistic update
        setPreferences(prev => {
            const copy = { ...prev }
            if (!copy[userId]) copy[userId] = {}
            if (!copy[userId][notifType]) {
                copy[userId][notifType] = { channel_in_app: false, channel_email: false, channel_whatsapp: false, channel_sms: false, is_enabled: false }
            }
            copy[userId][notifType] = { ...copy[userId][notifType], [channel]: value }
            return copy
        })

        const result = await upsertNotificationPreference(userId, notifType, { [channel]: value })
        if (result.error) {
            toast.error('Tercih kaydedilemedi: ' + result.error)
            loadPreferences() // rollback
        }
        setSaving(null)
    }

    // Toggle is_enabled (master switch)
    const handleMasterToggle = async (userId: string, notifType: string, value: boolean) => {
        const key = `${userId}-${notifType}-master`
        setSaving(key)

        setPreferences(prev => {
            const copy = { ...prev }
            if (!copy[userId]) copy[userId] = {}
            if (!copy[userId][notifType]) {
                copy[userId][notifType] = { channel_in_app: false, channel_email: false, channel_whatsapp: false, channel_sms: false, is_enabled: false }
            }
            copy[userId][notifType] = { ...copy[userId][notifType], is_enabled: value }
            return copy
        })

        const result = await upsertNotificationPreference(userId, notifType, { is_enabled: value })
        if (result.error) {
            toast.error('Tercih kaydedilemedi: ' + result.error)
            loadPreferences()
        }
        setSaving(null)
    }

    const handleReset = async () => {
        if (!confirm('Tüm kullanıcıların bildirim tercihleri varsayılana sıfırlanacak. Devam etmek istiyor musunuz?')) return
        setResetting(true)
        const result = await resetNotificationPreferences()
        if (result.error) {
            toast.error('Sıfırlama başarısız: ' + result.error)
        } else {
            toast.success('Tüm bildirim tercihleri varsayılana sıfırlandı.')
            setPreferences({})
        }
        setResetting(false)
    }

    // Group notification types by category
    const groupedTypes = NOTIFICATION_TYPES.reduce((acc, nt) => {
        if (!acc[nt.category]) acc[nt.category] = []
        acc[nt.category].push(nt)
        return acc
    }, {} as Record<string, NotificationType[]>)

    return (
        <div className="space-y-6">
            {/* ─── 1. Notification Catalog ─── */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5 text-orange-500" />
                        Bildirim Kataloğu
                    </CardTitle>
                    <CardDescription>
                        Uygulamada otomatik üretilen tüm bildirim türleri ve tetiklenme koşulları.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-5">
                        {Object.entries(groupedTypes).map(([category, types]) => {
                            const catInfo = CATEGORY_LABELS[category]
                            return (
                                <div key={category}>
                                    <div className="flex items-center gap-2 mb-2.5">
                                        <Badge variant="outline" className={`text-[10px] font-bold ${catInfo.color}`}>
                                            {catInfo.label}
                                        </Badge>
                                        <div className="h-px flex-1 bg-border" />
                                    </div>
                                    <div className="grid gap-2">
                                        {types.map(nt => (
                                            <div
                                                key={nt.id}
                                                className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                                            >
                                                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-muted/50 shrink-0 mt-0.5">
                                                    {nt.icon}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-semibold text-sm">{nt.name}</span>
                                                        <span className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded font-mono">
                                                            {nt.trigger}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-0.5">{nt.description}</p>
                                                    <div className="flex items-center gap-3 mt-1.5">
                                                        <span className="text-[10px] text-muted-foreground">Alıcı: <span className="font-medium text-foreground">{nt.defaultRecipient}</span></span>
                                                        <span className="text-muted-foreground">·</span>
                                                        <div className="flex items-center gap-1.5">
                                                            {nt.supportedChannels.map(ch => {
                                                                const info = CHANNEL_INFO[ch]
                                                                return (
                                                                    <TooltipProvider key={ch} delayDuration={200}>
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted/60 ${info.color}`}>
                                                                                    {info.icon}
                                                                                    {info.label}
                                                                                </span>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent side="top" className="text-xs">
                                                                                {info.label} kanalı destekleniyor
                                                                            </TooltipContent>
                                                                        </Tooltip>
                                                                    </TooltipProvider>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* ─── 2. User Preferences Matrix ─── */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-blue-500" />
                                Kullanıcı Bildirim Tercihleri
                            </CardTitle>
                            <CardDescription>
                                Her kullanıcı için hangi bildirimi hangi kanaldan alacağını yönetin.
                            </CardDescription>
                        </div>
                        {isAdmin && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleReset}
                                disabled={resetting}
                                className="text-red-600 border-red-200 hover:bg-red-50 gap-1.5"
                            >
                                {resetting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                                Varsayılana Sıfırla
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span className="text-sm">Tercihler yükleniyor...</span>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {(isAdmin ? activeUsers : activeUsers.filter(u => u.id === currentUserId)).map(user => {
                                const isExpanded = expandedUser === user.id
                                return (
                                    <div key={user.id} className="border rounded-lg overflow-hidden">
                                        {/* User Header */}
                                        <button
                                            onClick={() => setExpandedUser(isExpanded ? null : user.id)}
                                            className="w-full flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors text-left"
                                        >
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                                                {user.full_name?.substring(0, 2).toUpperCase() || '??'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-sm truncate">{user.full_name}</span>
                                                    <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                                                        {user.role}
                                                    </Badge>
                                                    {user.id === currentUserId && (
                                                        <Badge className="text-[9px] px-1.5 py-0 bg-blue-100 text-blue-700 border-blue-200">
                                                            Sen
                                                        </Badge>
                                                    )}
                                                </div>
                                                <span className="text-[11px] text-muted-foreground">{user.email}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {/* Summary badges */}
                                                {!isExpanded && (
                                                    <div className="hidden sm:flex items-center gap-1">
                                                        {(() => {
                                                            const userPrefs = preferences[user.id] || {}
                                                            const disabledCount = Object.values(userPrefs).filter(p => !p.is_enabled).length
                                                            const waCount = Object.values(userPrefs).filter(p => p.channel_whatsapp).length
                                                            return (
                                                                <>
                                                                    {waCount > 0 && (
                                                                        <span className="text-[10px] text-green-600 bg-green-50 border border-green-200 rounded px-1.5 py-0.5">
                                                                            WA: {waCount}
                                                                        </span>
                                                                    )}
                                                                    {disabledCount > 0 && (
                                                                        <span className="text-[10px] text-red-600 bg-red-50 border border-red-200 rounded px-1.5 py-0.5">
                                                                            Kapalı: {disabledCount}
                                                                        </span>
                                                                    )}
                                                                </>
                                                            )
                                                        })()}
                                                    </div>
                                                )}
                                                {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                                            </div>
                                        </button>

                                        {/* Expanded: Notification preferences */}
                                        {isExpanded && (
                                            <div className="border-t bg-muted/10">
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-xs">
                                                        <thead>
                                                            <tr className="border-b bg-muted/30">
                                                                <th className="text-left px-3 py-2 font-semibold text-muted-foreground min-w-[200px]">Bildirim</th>
                                                                <th className="text-center px-2 py-2 font-semibold text-muted-foreground w-14">Aktif</th>
                                                                {Object.entries(CHANNEL_INFO).map(([chId, info]) => (
                                                                    <th key={chId} className="text-center px-2 py-2 font-semibold text-muted-foreground w-20">
                                                                        <div className={`flex items-center justify-center gap-1 ${info.color}`}>
                                                                            {info.icon}
                                                                            <span className="hidden lg:inline">{info.label}</span>
                                                                        </div>
                                                                    </th>
                                                                ))}
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {NOTIFICATION_TYPES.map(nt => {
                                                                const pref = getPref(user.id, nt.id)
                                                                const isEnabled = pref.is_enabled
                                                                return (
                                                                    <tr key={nt.id} className={`border-b last:border-0 transition-colors ${!isEnabled ? 'opacity-40' : 'hover:bg-muted/20'}`}>
                                                                        <td className="px-3 py-2">
                                                                            <div className="flex items-center gap-2">
                                                                                {nt.icon}
                                                                                <span className="font-medium">{nt.name}</span>
                                                                            </div>
                                                                        </td>
                                                                        <td className="text-center px-2 py-2">
                                                                            <div className="flex justify-center">
                                                                                <Switch
                                                                                    checked={isEnabled}
                                                                                    onCheckedChange={(v) => handleMasterToggle(user.id, nt.id, v)}
                                                                                    disabled={saving === `${user.id}-${nt.id}-master`}
                                                                                    className="scale-75"
                                                                                />
                                                                            </div>
                                                                        </td>
                                                                        {Object.entries(CHANNEL_INFO).map(([chId]) => {
                                                                            const channelKey = `channel_${chId}` as keyof typeof pref
                                                                            const isSupported = nt.supportedChannels.includes(chId as any)
                                                                            const isChecked = pref[channelKey] as boolean
                                                                            const isSaving = saving === `${user.id}-${nt.id}-${channelKey}`

                                                                            return (
                                                                                <td key={chId} className="text-center px-2 py-2">
                                                                                    {isSupported ? (
                                                                                        <div className="flex justify-center">
                                                                                            <Switch
                                                                                                checked={isChecked}
                                                                                                onCheckedChange={(v) => handleToggle(user.id, nt.id, channelKey, v)}
                                                                                                disabled={!isEnabled || isSaving}
                                                                                                className="scale-75"
                                                                                            />
                                                                                        </div>
                                                                                    ) : (
                                                                                        <span className="text-muted-foreground/30">—</span>
                                                                                    )}
                                                                                </td>
                                                                            )
                                                                        })}
                                                                    </tr>
                                                                )
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                                {/* Quick info */}
                                                <div className="flex items-center gap-2 px-3 py-2 border-t bg-muted/20">
                                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                                    <span className="text-[10px] text-muted-foreground">
                                                        Değişiklikler otomatik kaydedilir. WhatsApp bildirimleri için kullanıcının telefon numarası gereklidir.
                                                        {user.phone ? ` (📱 ${user.phone})` : ' ⚠️ Telefon numarası tanımlı değil.'}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
