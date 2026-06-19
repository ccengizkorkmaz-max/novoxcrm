'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
    Mail, Plus, Search, Trash2, RefreshCw, Send, Eye, MousePointerClick,
    AlertTriangle, FileText, ArrowRight, BarChart3, Clock, CheckCircle2
} from 'lucide-react'
import { toast } from 'sonner'
import { getCampaigns, getTemplates, deleteCampaign, deleteTemplate } from '../actions'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

export function EmailDashboard({ tenantId }: { tenantId: string }) {
    const [campaigns, setCampaigns] = useState<any[]>([])
    const [templates, setTemplates] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState<'campaigns' | 'templates'>('campaigns')
    const [search, setSearch] = useState('')
    const [newTplName, setNewTplName] = useState('')
    const [newTplOpen, setNewTplOpen] = useState(false)
    const [creating, setCreating] = useState(false)
    const router = useRouter()

    const loadData = useCallback(async () => {
        setLoading(true)
        const [c, t] = await Promise.all([getCampaigns(), getTemplates()])
        setCampaigns(c)
        setTemplates(t)
        setLoading(false)
    }, [])

    useEffect(() => { loadData() }, [loadData])

    const handleDeleteCampaign = async (id: string) => {
        if (!confirm('Bu kampanyayı silmek istediğinize emin misiniz?')) return
        const res = await deleteCampaign(id)
        if (res.error) return toast.error(res.error)
        toast.success('Kampanya silindi')
        loadData()
    }

    const handleDeleteTemplate = async (id: string) => {
        if (!confirm('Bu şablonu silmek istediğinize emin misiniz?')) return
        const res = await deleteTemplate(id)
        if (res.error) return toast.error(res.error)
        toast.success('Şablon silindi')
        loadData()
    }

    const handleCreateTemplate = async () => {
        if (!newTplName.trim()) return toast.error('Şablon adı gerekli')
        setCreating(true)
        const { createTemplate } = await import('../actions')
        const res = await createTemplate({ name: newTplName.trim() })
        setCreating(false)
        if (res.error) return toast.error(res.error)
        setNewTplOpen(false)
        setNewTplName('')
        toast.success('Şablon oluşturuldu')
        router.push(`/email/templates/${res.data?.id}`)
    }

    const statusBadge = (status: string) => {
        const map: Record<string, { label: string; className: string }> = {
            draft: { label: 'Taslak', className: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
            scheduled: { label: 'Planlandı', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
            sending: { label: 'Gönderiliyor', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
            sent: { label: 'Gönderildi', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
            cancelled: { label: 'İptal', className: 'bg-red-500/10 text-red-400 border-red-500/20' },
        }
        const s = map[status] || map.draft
        return <Badge variant="outline" className={`text-[10px] ${s.className}`}>{s.label}</Badge>
    }

    // Toplam istatistikler
    const sentCampaigns = campaigns.filter(c => c.status === 'sent')
    const totalSent = sentCampaigns.reduce((a, c) => a + (c.total_sent || 0), 0)
    const totalOpened = sentCampaigns.reduce((a, c) => a + (c.total_opened || 0), 0)
    const totalClicked = sentCampaigns.reduce((a, c) => a + (c.total_clicked || 0), 0)
    const openRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : '0'
    const clickRate = totalOpened > 0 ? ((totalClicked / totalOpened) * 100).toFixed(1) : '0'

    const filteredCampaigns = campaigns.filter(c => 
        !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.subject?.toLowerCase().includes(search.toLowerCase())
    )
    const filteredTemplates = templates.filter(t => 
        !search || t.name?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/20">
                            <Mail className="h-6 w-6 text-blue-400" />
                        </div>
                        Email Kampanya
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Toplu email gönderimi, şablon yönetimi ve istatistikler
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <Card className="p-3 bg-gradient-to-br from-blue-500/5 to-blue-600/5 border-blue-500/20">
                    <div className="flex items-center gap-2">
                        <Send className="h-4 w-4 text-blue-400" />
                        <div>
                            <p className="text-lg font-bold">{campaigns.length}</p>
                            <p className="text-[10px] text-muted-foreground">Kampanya</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-3 bg-gradient-to-br from-emerald-500/5 to-emerald-600/5 border-emerald-500/20">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        <div>
                            <p className="text-lg font-bold">{totalSent.toLocaleString()}</p>
                            <p className="text-[10px] text-muted-foreground">Gönderildi</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-3 bg-gradient-to-br from-purple-500/5 to-purple-600/5 border-purple-500/20">
                    <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-purple-400" />
                        <div>
                            <p className="text-lg font-bold">{openRate}%</p>
                            <p className="text-[10px] text-muted-foreground">Açılma Oranı</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-3 bg-gradient-to-br from-amber-500/5 to-amber-600/5 border-amber-500/20">
                    <div className="flex items-center gap-2">
                        <MousePointerClick className="h-4 w-4 text-amber-400" />
                        <div>
                            <p className="text-lg font-bold">{clickRate}%</p>
                            <p className="text-[10px] text-muted-foreground">Tıklanma Oranı</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-3 bg-gradient-to-br from-slate-500/5 to-slate-600/5 border-slate-500/20">
                    <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-slate-400" />
                        <div>
                            <p className="text-lg font-bold">{templates.length}</p>
                            <p className="text-[10px] text-muted-foreground">Şablon</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Tab Toggle + Toolbar */}
            <div className="flex items-center gap-2 flex-wrap">
                <div className="flex bg-muted/50 rounded-lg p-0.5 gap-0.5">
                    <button
                        onClick={() => setTab('campaigns')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                            tab === 'campaigns' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Send className="h-3.5 w-3.5 inline mr-1.5" />
                        Kampanyalar ({campaigns.length})
                    </button>
                    <button
                        onClick={() => setTab('templates')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                            tab === 'templates' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <FileText className="h-3.5 w-3.5 inline mr-1.5" />
                        Şablonlar ({templates.length})
                    </button>
                </div>
                <div className="relative flex-1 min-w-[180px]">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input placeholder="Ara..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-xs" />
                </div>
                <Button variant="outline" size="sm" onClick={loadData} className="h-8 gap-1 text-xs">
                    <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                </Button>
                {tab === 'campaigns' ? (
                    <Button size="sm" onClick={() => router.push('/email/campaigns/new')} className="h-8 gap-1 text-xs bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-3 w-3" /> Yeni Kampanya
                    </Button>
                ) : (
                    <Button size="sm" onClick={() => setNewTplOpen(true)} className="h-8 gap-1 text-xs bg-purple-600 hover:bg-purple-700">
                        <Plus className="h-3 w-3" /> Yeni Şablon
                    </Button>
                )}
            </div>

            {/* Campaign List */}
            {tab === 'campaigns' && (
                <div className="space-y-2">
                    {loading ? (
                        <Card className="p-8 text-center text-muted-foreground text-sm">Yükleniyor...</Card>
                    ) : filteredCampaigns.length === 0 ? (
                        <Card className="p-8 text-center border-dashed">
                            <Send className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                            <p className="text-sm text-muted-foreground">Henüz kampanya yok</p>
                            <Button size="sm" className="mt-3 bg-blue-600" onClick={() => router.push('/email/campaigns/new')}>
                                <Plus className="h-3.5 w-3.5 mr-1" /> İlk Kampanyanı Oluştur
                            </Button>
                        </Card>
                    ) : (
                        filteredCampaigns.map(c => (
                            <Card key={c.id} className="p-3 hover:bg-muted/30 transition-colors cursor-pointer group" onClick={() => router.push(`/email/campaigns/${c.id}`)}>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-blue-500/10">
                                        <Mail className="h-4 w-4 text-blue-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold truncate">{c.name}</span>
                                            {statusBadge(c.status)}
                                        </div>
                                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
                                            <span>📧 {c.subject}</span>
                                            {c.email_templates?.name && <span>📄 {c.email_templates.name}</span>}
                                        </div>
                                    </div>
                                    {c.status === 'sent' && (
                                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                                            <span className="flex items-center gap-1"><Send className="h-3 w-3" /> {c.total_sent}</span>
                                            <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {c.total_opened}</span>
                                            <span className="flex items-center gap-1"><MousePointerClick className="h-3 w-3" /> {c.total_clicked}</span>
                                        </div>
                                    )}
                                    <div className="text-[10px] text-muted-foreground">
                                        {new Date(c.created_at).toLocaleDateString('tr-TR')}
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); handleDeleteCampaign(c.id) }}>
                                        <Trash2 className="h-3 w-3 text-red-400" />
                                    </Button>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            )}

            {/* Templates List */}
            {tab === 'templates' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {loading ? (
                        <Card className="p-8 text-center text-muted-foreground text-sm col-span-full">Yükleniyor...</Card>
                    ) : filteredTemplates.length === 0 ? (
                        <Card className="p-8 text-center border-dashed col-span-full">
                            <FileText className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                            <p className="text-sm text-muted-foreground">Henüz şablon yok</p>
                            <Button size="sm" className="mt-3 bg-purple-600" onClick={() => setNewTplOpen(true)}>
                                <Plus className="h-3.5 w-3.5 mr-1" /> İlk Şablonunu Oluştur
                            </Button>
                        </Card>
                    ) : (
                        filteredTemplates.map(t => (
                            <Card key={t.id} className="p-4 hover:bg-muted/30 transition-colors cursor-pointer group" onClick={() => router.push(`/email/templates/${t.id}`)}>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 rounded-lg bg-purple-500/10">
                                            <FileText className="h-4 w-4 text-purple-400" />
                                        </div>
                                        <div>
                                            <span className="text-sm font-semibold block">{t.name}</span>
                                            <span className="text-[10px] text-muted-foreground">
                                                {new Date(t.updated_at).toLocaleDateString('tr-TR')}
                                            </span>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(t.id) }}>
                                        <Trash2 className="h-3 w-3 text-red-400" />
                                    </Button>
                                </div>
                                {t.subject && <p className="text-xs text-muted-foreground mt-2 truncate">Konu: {t.subject}</p>}
                            </Card>
                        ))
                    )}
                </div>
            )}

            {/* New Template Dialog */}
            <Dialog open={newTplOpen} onOpenChange={setNewTplOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-purple-500" /> Yeni Şablon
                        </DialogTitle>
                    </DialogHeader>
                    <div>
                        <label className="text-xs font-medium mb-1 block">Şablon Adı</label>
                        <Input placeholder="Örn: Yeni Proje Duyurusu" value={newTplName} onChange={e => setNewTplName(e.target.value)} />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setNewTplOpen(false)}>İptal</Button>
                        <Button onClick={handleCreateTemplate} disabled={creating} className="bg-purple-600 hover:bg-purple-700">
                            {creating ? 'Oluşturuluyor...' : 'Oluştur ve Düzenle'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
