'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import {
    createTenantWebhook, deleteTenantWebhook, toggleTenantWebhook, testWebhook
} from '@/lib/webhooks/engine'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
    Plus, Webhook, Trash2, Zap, Globe, CheckCircle, XCircle,
    Send, Loader2, MessageSquare, BrainCircuit, Phone, Settings2
} from 'lucide-react'

interface Props {
    webhooks: any[]
    integrations: any[]
}

const EVENT_TYPES = [
    { value: 'new_lead', label: 'Yeni Talep', description: 'Yeni müşteri kaydı oluşturulduğunda', icon: '👤' },
    { value: 'lead_assigned', label: 'Talep Atandı', description: 'Müşteri danışmana atandığında', icon: '🎯' },
    { value: 'portfolio_created', label: 'Yeni Portföy', description: 'Yeni portföy eklendiğinde', icon: '🏠' },
    { value: 'portfolio_updated', label: 'Portföy Güncellendi', description: 'Portföy bilgileri değiştiğinde', icon: '✏️' },
    { value: 'portfolio_sold', label: 'Portföy Satıldı', description: 'Portföy "Satıldı" olarak işaretlendiğinde', icon: '🎉' },
    { value: 'sale_completed', label: 'Satış Tamamlandı', description: 'Hak ediş kaydı oluşturulduğunda', icon: '💰' },
    { value: 'commission_paid', label: 'Komisyon Ödendi', description: 'Komisyon ödeme yapıldığında', icon: '💵' },
]

const INTEGRATION_TYPES = [
    { provider: 'sms', label: 'SMS Servisi', icon: Phone, color: 'text-blue-600 bg-blue-50' },
    { provider: 'whatsapp', label: 'WhatsApp Business', icon: MessageSquare, color: 'text-emerald-600 bg-emerald-50' },
    { provider: 'ai', label: 'AI API', icon: BrainCircuit, color: 'text-violet-600 bg-violet-50' },
    { provider: 'make', label: 'Make.com', icon: Zap, color: 'text-amber-600 bg-amber-50' },
]

export function WebhookSettingsView({ webhooks, integrations }: Props) {
    const router = useRouter()
    const [showNewDialog, setShowNewDialog] = useState(false)
    const [loading, setLoading] = useState(false)
    const [testingId, setTestingId] = useState<string | null>(null)

    async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        try {
            const formData = new FormData(e.currentTarget)
            const eventType = formData.get('event_type') as string
            const targetUrl = formData.get('target_url') as string

            const authHeader = formData.get('auth_header') as string
            const headers = authHeader ? { 'Authorization': authHeader } : undefined

            await createTenantWebhook(eventType, targetUrl, headers)
            toast.success('Webhook oluşturuldu!')
            setShowNewDialog(false)
            router.refresh()
        } catch (err: any) {
            toast.error(err.message || 'Webhook oluşturulamadı')
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Bu webhook\'u silmek istediğinize emin misiniz?')) return
        try {
            await deleteTenantWebhook(id)
            toast.success('Webhook silindi')
            router.refresh()
        } catch {
            toast.error('Silme başarısız')
        }
    }

    async function handleToggle(id: string, currentState: boolean) {
        try {
            await toggleTenantWebhook(id, !currentState)
            toast.success(!currentState ? 'Webhook aktif edildi' : 'Webhook devre dışı bırakıldı')
            router.refresh()
        } catch {
            toast.error('Güncelleme başarısız')
        }
    }

    async function handleTest(id: string) {
        setTestingId(id)
        try {
            const result = await testWebhook(id)
            if (result.success) {
                toast.success(`Test başarılı! HTTP ${result.status}`)
            } else {
                toast.error(`Test başarısız: ${result.error || `HTTP ${result.status}`}`)
            }
        } catch (err: any) {
            toast.error(`Test hatası: ${err.message}`)
        } finally {
            setTestingId(null)
        }
    }

    return (
        <div className="space-y-6">
            {/* Integrations */}
            <Card className="border shadow-sm">
                <CardHeader className="pb-3 bg-slate-50">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Settings2 className="h-4 w-4 text-blue-600" />
                        Tenant Entegrasyonları
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {INTEGRATION_TYPES.map((intType) => {
                            const existing = integrations.find(i => i.provider === intType.provider)
                            const IntIcon = intType.icon
                            return (
                                <div key={intType.provider} className={cn(
                                    "flex items-center gap-3 p-4 rounded-xl border transition-all",
                                    existing?.is_active ? "bg-emerald-50/50 border-emerald-200" : "border-dashed border-slate-300"
                                )}>
                                    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", intType.color)}>
                                        <IntIcon className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold">{intType.label}</p>
                                        {existing ? (
                                            <p className="text-[10px] text-muted-foreground">
                                                {existing.config?.endpoint ? `Endpoint: ${existing.config.endpoint.substring(0, 30)}...` : 'Yapılandırılmış'}
                                            </p>
                                        ) : (
                                            <p className="text-[10px] text-muted-foreground">Henüz yapılandırılmadı</p>
                                        )}
                                    </div>
                                    <Badge className={cn("text-[9px]", existing?.is_active ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200")}>
                                        {existing?.is_active ? 'Aktif' : 'Pasif'}
                                    </Badge>
                                </div>
                            )
                        })}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-3">
                        💡 Entegrasyon yapılandırması için <strong>Ayarlar → Entegrasyonlar</strong> sekmesini kullanabilir veya destek ekibiyle iletişime geçebilirsiniz.
                    </p>
                </CardContent>
            </Card>

            {/* Webhooks */}
            <Card className="border shadow-sm">
                <CardHeader className="pb-3 bg-slate-50 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Webhook className="h-4 w-4 text-violet-600" />
                        Webhook Bildirimleri
                    </CardTitle>
                    <Button size="sm" className="text-xs gap-1.5 bg-violet-600 hover:bg-violet-700" onClick={() => setShowNewDialog(true)}>
                        <Plus className="h-3.5 w-3.5" /> Webhook Ekle
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    {webhooks.length > 0 ? (
                        <div className="divide-y">
                            {webhooks.map((wh) => {
                                const eventCfg = EVENT_TYPES.find(e => e.value === wh.event_type)
                                return (
                                    <div key={wh.id} className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50 transition-colors">
                                        <div className="text-xl flex-shrink-0">{eventCfg?.icon || '🔔'}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold">{eventCfg?.label || wh.event_type}</span>
                                                <Badge className={cn("text-[9px]", wh.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500")}>
                                                    {wh.is_active ? 'Aktif' : 'Pasif'}
                                                </Badge>
                                                {wh.last_status_code && (
                                                    <Badge variant="outline" className={cn("text-[9px]", wh.last_status_code >= 200 && wh.last_status_code < 300 ? "border-emerald-300 text-emerald-600" : "border-red-300 text-red-600")}>
                                                        HTTP {wh.last_status_code}
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-muted-foreground truncate mt-0.5 flex items-center gap-1">
                                                <Globe className="h-2.5 w-2.5" /> {wh.target_url}
                                            </p>
                                            {wh.last_triggered_at && (
                                                <p className="text-[9px] text-muted-foreground mt-0.5">
                                                    Son tetiklenme: {new Date(wh.last_triggered_at).toLocaleString('tr-TR')}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                            <Button
                                                variant="ghost" size="icon" className="h-7 w-7"
                                                onClick={() => handleTest(wh.id)}
                                                disabled={testingId === wh.id}
                                            >
                                                {testingId === wh.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5 text-blue-600" />}
                                            </Button>
                                            <Switch
                                                checked={wh.is_active}
                                                onCheckedChange={() => handleToggle(wh.id, wh.is_active)}
                                                className="scale-75"
                                            />
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700" onClick={() => handleDelete(wh.id)}>
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="p-8 text-center">
                            <Webhook className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                            <p className="text-sm font-medium text-muted-foreground">Henüz webhook tanımlanmamış</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Belirli olaylar gerçekleştiğinde dış servislere otomatik bildirim gönderin.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* New Webhook Dialog */}
            <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Webhook className="h-5 w-5 text-violet-600" />
                            Yeni Webhook Ekle
                        </DialogTitle>
                        <DialogDescription>
                            Belirli bir olay gerçekleştiğinde HTTP POST isteği gönderilecek URL'yi belirleyin.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="grid gap-2">
                            <Label className="text-xs font-bold">Olay Tipi *</Label>
                            <select name="event_type" required className="h-10 px-3 rounded-lg border text-sm bg-white w-full">
                                <option value="">Seçin...</option>
                                {EVENT_TYPES.map(et => (
                                    <option key={et.value} value={et.value}>{et.icon} {et.label} — {et.description}</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-xs font-bold">Hedef URL *</Label>
                            <Input name="target_url" type="url" required placeholder="https://hooks.example.com/webhook" />
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-xs font-bold">Authorization Header (Opsiyonel)</Label>
                            <Input name="auth_header" placeholder="Bearer xxxx-xxxx-xxxx" />
                            <p className="text-[10px] text-muted-foreground">HTTP isteğine Authorization header'ı eklenecektir.</p>
                        </div>
                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button type="button" variant="ghost" onClick={() => setShowNewDialog(false)}>İptal</Button>
                            <Button type="submit" disabled={loading} className="bg-violet-600 hover:bg-violet-700 font-bold">
                                {loading ? 'Oluşturuluyor...' : 'Webhook Oluştur'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
