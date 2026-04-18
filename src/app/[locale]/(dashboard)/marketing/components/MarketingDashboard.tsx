'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { createCampaign, updateCampaignStatus, deleteCampaign, sendCampaignEmails, sendCampaignSMS, createEmailTemplate, deleteEmailTemplate } from '../actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
    Mail, MessageSquare, Phone, Plus, Send, Pause, Play,
    Trash2, FileText, Users, BarChart3, Clock, CheckCircle,
    AlertTriangle, Edit, Eye, Layers, Globe, Zap
} from 'lucide-react'

interface Props {
    campaigns: any[]
    templates: any[]
    customers: any[]
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
    draft: { label: 'Taslak', color: 'bg-slate-100 text-slate-600 border-slate-200', icon: Edit },
    active: { label: 'Aktif', color: 'bg-blue-100 text-blue-600 border-blue-200', icon: Play },
    paused: { label: 'Duraklatıldı', color: 'bg-amber-100 text-amber-600 border-amber-200', icon: Pause },
    completed: { label: 'Tamamlandı', color: 'bg-emerald-100 text-emerald-600 border-emerald-200', icon: CheckCircle },
    archived: { label: 'Arşiv', color: 'bg-slate-100 text-slate-400 border-slate-200', icon: FileText },
}

const TYPE_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
    email: { label: 'E-posta', icon: Mail, color: 'text-blue-600' },
    sms: { label: 'SMS', icon: MessageSquare, color: 'text-emerald-600' },
    whatsapp: { label: 'WhatsApp', icon: Phone, color: 'text-green-600' },
}

const TEMPLATE_CATEGORIES: Record<string, string> = {
    general: 'Genel',
    listing: 'İlan Tanıtım',
    follow_up: 'Takip',
    welcome: 'Hoş Geldiniz',
    birthday: 'Doğum Günü',
    anniversary: 'Yıldönümü',
    price_change: 'Fiyat Değişikliği',
}

export function MarketingDashboard({ campaigns, templates, customers }: Props) {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<'campaigns' | 'templates'>('campaigns')
    const [showNewCampaign, setShowNewCampaign] = useState(false)
    const [showNewTemplate, setShowNewTemplate] = useState(false)

    // Campaign form
    const [cName, setCName] = useState('')
    const [cType, setCType] = useState('email')
    const [cSubject, setCSubject] = useState('')
    const [cBody, setCBody] = useState('')
    const [cSchedule, setCSchedule] = useState('immediate')
    const [saving, setSaving] = useState(false)

    // Template form
    const [tName, setTName] = useState('')
    const [tCategory, setTCategory] = useState('general')
    const [tSubject, setTSubject] = useState('')
    const [tBody, setTBody] = useState('')

    // Stats
    const totalSent = campaigns.reduce((s, c) => s + (c.sent_count || 0), 0)
    const totalOpened = campaigns.reduce((s, c) => s + (c.opened_count || 0), 0)
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length

    async function handleCreateCampaign() {
        setSaving(true)
        try {
            const fd = new FormData()
            fd.set('name', cName)
            fd.set('type', cType)
            fd.set('subject', cSubject)
            fd.set('body', cBody)
            fd.set('schedule_type', cSchedule)
            await createCampaign(fd)
            toast.success('Kampanya oluşturuldu')
            setShowNewCampaign(false)
            setCName(''); setCSubject(''); setCBody('')
            router.refresh()
        } catch (err: any) { toast.error(err.message) }
        finally { setSaving(false) }
    }

    async function handleSend(campaignId: string, type: string) {
        if (!confirm('Bu kampanyayı göndermek istediğinize emin misiniz?')) return
        try {
            const result = type === 'sms'
                ? await sendCampaignSMS(campaignId)
                : await sendCampaignEmails(campaignId)
            toast.success(result.message)
            if (result.note) toast.info(result.note, { duration: 8000 })
            router.refresh()
        } catch (err: any) { toast.error(err.message) }
    }

    async function handleCreateTemplate() {
        setSaving(true)
        try {
            const fd = new FormData()
            fd.set('name', tName)
            fd.set('category', tCategory)
            fd.set('subject', tSubject)
            fd.set('body', tBody)
            await createEmailTemplate(fd)
            toast.success('Şablon oluşturuldu')
            setShowNewTemplate(false)
            setTName(''); setTSubject(''); setTBody('')
            router.refresh()
        } catch (err: any) { toast.error(err.message) }
        finally { setSaving(false) }
    }

    return (
        <div className="space-y-6">
            {/* KPI Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                <Send className="h-4 w-4 text-blue-600" />
                            </div>
                        </div>
                        <p className="text-2xl font-black text-blue-600">{campaigns.length}</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase">Toplam Kampanya</p>
                    </CardContent>
                </Card>
                <Card className="border shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                                <CheckCircle className="h-4 w-4 text-emerald-600" />
                            </div>
                        </div>
                        <p className="text-2xl font-black text-emerald-600">{totalSent}</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase">Gönderilen</p>
                    </CardContent>
                </Card>
                <Card className="border shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="h-8 w-8 rounded-lg bg-violet-50 flex items-center justify-center">
                                <Eye className="h-4 w-4 text-violet-600" />
                            </div>
                        </div>
                        <p className="text-2xl font-black text-violet-600">{totalOpened}</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase">Açılan</p>
                    </CardContent>
                </Card>
                <Card className="border shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center">
                                <FileText className="h-4 w-4 text-amber-600" />
                            </div>
                        </div>
                        <p className="text-2xl font-black text-amber-600">{templates.length}</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase">Şablon</p>
                    </CardContent>
                </Card>
            </div>

            {/* Tab Switcher */}
            <div className="flex items-center gap-2">
                <button onClick={() => setActiveTab('campaigns')} className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all", activeTab === 'campaigns' ? "bg-slate-900 text-white" : "bg-white text-slate-500 border hover:bg-slate-50")}>
                    Kampanyalar
                </button>
                <button onClick={() => setActiveTab('templates')} className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all", activeTab === 'templates' ? "bg-slate-900 text-white" : "bg-white text-slate-500 border hover:bg-slate-50")}>
                    E-posta Şablonları
                </button>
                <div className="flex-1" />
                {activeTab === 'campaigns' ? (
                    <Button onClick={() => setShowNewCampaign(true)} className="text-xs gap-1.5 bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4" /> Yeni Kampanya
                    </Button>
                ) : (
                    <Button onClick={() => setShowNewTemplate(true)} className="text-xs gap-1.5 bg-amber-600 hover:bg-amber-700">
                        <Plus className="h-4 w-4" /> Yeni Şablon
                    </Button>
                )}
            </div>

            {/* Campaigns Tab */}
            {activeTab === 'campaigns' && (
                <div className="space-y-3">
                    {campaigns.length > 0 ? campaigns.map(campaign => {
                        const sc = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.draft
                        const tc = TYPE_CONFIG[campaign.type] || TYPE_CONFIG.email
                        const StatusIcon = sc.icon
                        const TypeIcon = tc.icon
                        return (
                            <Card key={campaign.id} className="border shadow-sm hover:shadow-md transition-all">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                                            <TypeIcon className={cn("h-5 w-5", tc.color)} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <h3 className="text-sm font-bold truncate">{campaign.name}</h3>
                                                <Badge className={cn("text-[9px] border font-bold", sc.color)}>{sc.label}</Badge>
                                                <Badge variant="outline" className="text-[9px]">{tc.label}</Badge>
                                            </div>
                                            {campaign.subject && <p className="text-[11px] text-muted-foreground truncate">📧 {campaign.subject}</p>}
                                            <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                                                <span><Users className="h-3 w-3 inline mr-0.5" /> {campaign.target_count || 0} alıcı</span>
                                                <span><Send className="h-3 w-3 inline mr-0.5" /> {campaign.sent_count || 0} gönderildi</span>
                                                <span><Eye className="h-3 w-3 inline mr-0.5" /> {campaign.opened_count || 0} açıldı</span>
                                                <span className="ml-auto">{new Date(campaign.created_at).toLocaleDateString('tr-TR')}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            {campaign.status === 'draft' && (
                                                <Button variant="outline" size="sm" className="text-xs gap-1 text-blue-600 border-blue-200"
                                                    onClick={() => handleSend(campaign.id, campaign.type)}>
                                                    <Send className="h-3 w-3" /> Gönder
                                                </Button>
                                            )}
                                            {campaign.status === 'active' && (
                                                <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => updateCampaignStatus(campaign.id, 'paused').then(() => { toast.info('Duraklatıldı'); router.refresh() })}>
                                                    <Pause className="h-3 w-3" />
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={async () => {
                                                if (confirm('Kampanyayı silmek istediğinize emin misiniz?')) {
                                                    await deleteCampaign(campaign.id); toast.success('Silindi'); router.refresh()
                                                }
                                            }}>
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    }) : (
                        <div className="text-center py-16 text-muted-foreground">
                            <Mail className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                            <p className="font-medium">Henüz kampanya yok</p>
                            <p className="text-sm mt-1">İlk kampanyanızı oluşturun.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Templates Tab */}
            {activeTab === 'templates' && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {templates.length > 0 ? templates.map(tpl => (
                        <Card key={tpl.id} className="border shadow-sm hover:shadow-md transition-all">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xs font-bold">{tpl.name}</CardTitle>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={async () => {
                                        if (confirm('Şablonu silmek istediğinize emin misiniz?')) {
                                            await deleteEmailTemplate(tpl.id); toast.success('Silindi'); router.refresh()
                                        }
                                    }}>
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Badge variant="outline" className="text-[9px]">{TEMPLATE_CATEGORIES[tpl.category] || tpl.category}</Badge>
                                <p className="text-[11px] font-medium">📧 {tpl.subject}</p>
                                <p className="text-[10px] text-muted-foreground line-clamp-3">{tpl.body?.replace(/<[^>]+>/g, '').slice(0, 150)}...</p>
                            </CardContent>
                        </Card>
                    )) : (
                        <div className="col-span-full text-center py-16 text-muted-foreground">
                            <FileText className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                            <p className="font-medium">Henüz şablon yok</p>
                        </div>
                    )}

                    {/* Built-in templates */}
                    <Card className="border-2 border-dashed border-blue-200 shadow-sm hover:border-blue-400 transition-all cursor-pointer" onClick={() => setShowNewTemplate(true)}>
                        <CardContent className="p-6 text-center">
                            <Zap className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                            <p className="text-xs font-bold text-blue-600">Hazır Şablonlar</p>
                            <p className="text-[10px] text-muted-foreground mt-1">Yeni ilan, takip, hoş geldiniz şablonları</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* New Campaign Dialog */}
            <Dialog open={showNewCampaign} onOpenChange={setShowNewCampaign}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Yeni Kampanya</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label className="text-xs font-bold">Kampanya Adı *</Label>
                            <Input value={cName} onChange={e => setCName(e.target.value)} placeholder="Örn: Mart Ayı İlan Tanıtımı" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-bold">Kanal</Label>
                                <select value={cType} onChange={e => setCType(e.target.value)} className="w-full h-10 px-3 rounded-lg border text-sm bg-white mt-1">
                                    <option value="email">📧 E-posta</option>
                                    <option value="sms">💬 SMS</option>
                                    <option value="whatsapp">📱 WhatsApp</option>
                                </select>
                            </div>
                            <div>
                                <Label className="text-xs font-bold">Zamanlama</Label>
                                <select value={cSchedule} onChange={e => setCSchedule(e.target.value)} className="w-full h-10 px-3 rounded-lg border text-sm bg-white mt-1">
                                    <option value="immediate">Hemen</option>
                                    <option value="scheduled">Zamanlanmış</option>
                                    <option value="drip">Drip Serisi</option>
                                </select>
                            </div>
                        </div>
                        {cType === 'email' && (
                            <div className="grid gap-2">
                                <Label className="text-xs font-bold">E-posta Konusu</Label>
                                <Input value={cSubject} onChange={e => setCSubject(e.target.value)} placeholder="Konu satırı..." />
                            </div>
                        )}
                        <div className="grid gap-2">
                            <Label className="text-xs font-bold">{cType === 'sms' ? 'SMS Metni' : 'İçerik'}</Label>
                            <textarea value={cBody} onChange={e => setCBody(e.target.value)} rows={5}
                                className="w-full px-3 py-2 rounded-lg border text-sm resize-none"
                                placeholder={cType === 'sms' ? 'SMS metniniz... (160 karakter)' : 'E-posta içeriğiniz... {{musteri_adi}} gibi değişkenler kullanabilirsiniz.'}
                            />
                            {cType === 'sms' && <p className="text-[10px] text-muted-foreground">{cBody.length}/160 karakter</p>}
                        </div>
                        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-[10px] text-blue-700 space-y-1">
                            <p className="font-bold">💡 Kullanılabilir Değişkenler:</p>
                            <p>{'{{musteri_adi}}'} • {'{{telefon}}'} • {'{{email}}'} • {'{{portfoy_baslik}}'} • {'{{fiyat}}'} • {'{{adres}}'}</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowNewCampaign(false)}>İptal</Button>
                        <Button onClick={handleCreateCampaign} disabled={saving || !cName} className="bg-blue-600 hover:bg-blue-700">
                            {saving ? 'Oluşturuluyor...' : 'Kampanya Oluştur'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* New Template Dialog */}
            <Dialog open={showNewTemplate} onOpenChange={setShowNewTemplate}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Yeni E-posta Şablonu</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-bold">Şablon Adı *</Label>
                                <Input value={tName} onChange={e => setTName(e.target.value)} placeholder="Şablon adı" />
                            </div>
                            <div>
                                <Label className="text-xs font-bold">Kategori</Label>
                                <select value={tCategory} onChange={e => setTCategory(e.target.value)} className="w-full h-10 px-3 rounded-lg border text-sm bg-white mt-1">
                                    {Object.entries(TEMPLATE_CATEGORIES).map(([k, v]) => (
                                        <option key={k} value={k}>{v}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-xs font-bold">Konu Satırı *</Label>
                            <Input value={tSubject} onChange={e => setTSubject(e.target.value)} placeholder="E-posta konusu" />
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-xs font-bold">İçerik *</Label>
                            <textarea value={tBody} onChange={e => setTBody(e.target.value)} rows={8}
                                className="w-full px-3 py-2 rounded-lg border text-sm resize-none"
                                placeholder="HTML veya düz metin..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowNewTemplate(false)}>İptal</Button>
                        <Button onClick={handleCreateTemplate} disabled={saving || !tName || !tSubject || !tBody} className="bg-amber-600 hover:bg-amber-700">
                            {saving ? 'Kaydediliyor...' : 'Şablon Oluştur'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
