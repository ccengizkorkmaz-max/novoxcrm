'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronRight, Copy, Check, Zap, Shield, Globe, Code2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface ApiParam {
    name: string
    type: string
    required?: boolean
    desc: string
}

interface ApiEndpoint {
    method: Method
    path: string
    summary: string
    desc: string
    auth: 'none' | 'bearer' | 'api-key'
    category: string
    params?: ApiParam[]
    body?: string
    response?: string
}

const METHOD_COLORS: Record<Method, string> = {
    GET: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
    POST: 'bg-blue-500/10 text-blue-700 border-blue-500/30',
    PUT: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
    PATCH: 'bg-orange-500/10 text-orange-700 border-orange-500/30',
    DELETE: 'bg-red-500/10 text-red-700 border-red-500/30',
}

const METHOD_DOT: Record<Method, string> = {
    GET: 'bg-emerald-500', POST: 'bg-blue-500', PUT: 'bg-amber-500', PATCH: 'bg-orange-500', DELETE: 'bg-red-500',
}

const ENDPOINTS: ApiEndpoint[] = [
    // Leads
    { method: 'GET', path: '/api/leads/external', summary: 'API Durumunu Kontrol Et', desc: 'External Lead API\'nin çalışıp çalışmadığını kontrol eder.', auth: 'none', category: 'Lead Yönetimi', response: '{ "status": "active", "message": "Novo CRM External Lead API is running." }' },
    { method: 'POST', path: '/api/leads/external', summary: 'Harici Lead Oluştur', desc: 'Web formları, Facebook Ads, Make.com gibi kaynaklardan lead alır. Facebook Ads kaynağı otomatik müşteri+lead oluşturur, diğerleri Gelen Kutusu\'na düşer.', auth: 'none', category: 'Lead Yönetimi',
        params: [
            { name: 'name', type: 'string', desc: 'Müşteri adı soyadı' },
            { name: 'email', type: 'string', desc: 'E-posta adresi' },
            { name: 'phone', type: 'string', desc: 'Telefon numarası' },
            { name: 'source', type: 'string', desc: 'Kaynak: "Facebook Ads", "Website", "External"' },
            { name: 'message', type: 'string', desc: 'Lead mesajı / notları' },
            { name: 'tenant_id', type: 'uuid', desc: 'Hedef tenant ID (opsiyonel)' },
            { name: 'form_name', type: 'string', desc: 'Form adı (Facebook form adı)' },
            { name: 'campaign', type: 'string', desc: 'Kampanya adı' },
            { name: 'lead_date', type: 'string', desc: 'Lead tarihi (ISO/Unix timestamp)' },
        ],
        body: `{
  "name": "Ahmet Yılmaz",
  "email": "ahmet@example.com",
  "phone": "+905551234567",
  "source": "Facebook Ads",
  "form_name": "Novo Park Bilgi Formu",
  "tenant_id": "89b2829e-..."
}`,
        response: `{
  "success": true,
  "message": "New customer and lead created.",
  "lead_id": "uuid-...",
  "recorded_date": "2026-05-04T..."
}`
    },
    // AI
    { method: 'POST', path: '/api/ai/chat', summary: 'AI Sohbet', desc: 'AI Co-Pilot ile sohbet. CRM verileri üzerinden akıllı yanıtlar üretir.', auth: 'bearer', category: 'Yapay Zeka (AI)',
        body: '{ "messages": [{ "role": "user", "content": "..." }] }',
        response: '{ "response": "AI yanıtı..." }'
    },
    { method: 'POST', path: '/api/ai/generate', summary: 'AI İçerik Üret', desc: 'E-posta, SMS, teklif metni gibi içerikler üretir.', auth: 'bearer', category: 'Yapay Zeka (AI)' },
    { method: 'GET', path: '/api/ai/insights', summary: 'AI Öngörüler', desc: 'Dashboard için AI destekli satış öngörüleri ve uyarılar.', auth: 'bearer', category: 'Yapay Zeka (AI)' },
    { method: 'POST', path: '/api/ai/match', summary: 'AI Müşteri-Ünite Eşleştir', desc: 'Müşteri tercihlerine göre en uygun üniteleri AI ile eşleştirir.', auth: 'bearer', category: 'Yapay Zeka (AI)' },
    { method: 'POST', path: '/api/ai/transcribe', summary: 'Ses→Metin Dönüşüm', desc: 'Sesli notları metne çevirir (Whisper API).', auth: 'bearer', category: 'Yapay Zeka (AI)' },
    { method: 'POST', path: '/api/ai/tts', summary: 'Metin→Ses Dönüşüm', desc: 'Metni sesli mesaja çevirir (TTS).', auth: 'bearer', category: 'Yapay Zeka (AI)' },
    // Broker Contracts
    { method: 'GET', path: '/api/broker-contracts', summary: 'Sözleşmeleri Listele', desc: 'Tenant\'a ait tüm broker sözleşmelerini getirir.', auth: 'bearer', category: 'Sözleşmeler' },
    { method: 'POST', path: '/api/broker-contracts', summary: 'Yeni Sözleşme Oluştur', desc: 'Yeni bir broker sözleşmesi oluşturur.', auth: 'bearer', category: 'Sözleşmeler' },
    { method: 'GET', path: '/api/broker-contracts/{id}', summary: 'Sözleşme Detayı', desc: 'Belirli bir sözleşmenin detaylarını getirir.', auth: 'bearer', category: 'Sözleşmeler',
        params: [{ name: 'id', type: 'uuid', required: true, desc: 'Sözleşme ID' }]
    },
    { method: 'POST', path: '/api/broker-contracts/{id}', summary: 'Sözleşme Güncelle', desc: 'Mevcut sözleşmeyi günceller.', auth: 'bearer', category: 'Sözleşmeler' },
    { method: 'GET', path: '/api/broker-contracts/{id}/documents', summary: 'Belgeleri Listele', desc: 'Sözleşmeye ait belgeleri getirir.', auth: 'bearer', category: 'Sözleşmeler' },
    { method: 'POST', path: '/api/broker-contracts/{id}/documents', summary: 'Belge Yükle', desc: 'Sözleşmeye belge ekler.', auth: 'bearer', category: 'Sözleşmeler' },
    // Conversations
    { method: 'POST', path: '/api/conversations/reply', summary: 'Mesaj Yanıtla', desc: 'WhatsApp/SMS konuşmasına yanıt gönderir.', auth: 'bearer', category: 'Mesajlaşma' },
    { method: 'POST', path: '/api/conversations/toggle-ai', summary: 'AI Otomatik Yanıt Aç/Kapat', desc: 'Konuşma için AI otomatik yanıtlama modunu açar/kapatır.', auth: 'bearer', category: 'Mesajlaşma' },
    // WhatsApp
    { method: 'POST', path: '/api/whatsapp/send', summary: 'WhatsApp Mesajı Gönder', desc: 'Belirtilen numaraya WhatsApp mesajı gönderir.', auth: 'bearer', category: 'WhatsApp',
        body: '{ "phone": "+905551234567", "message": "Merhaba!" }' },
    // Webhooks
    { method: 'POST', path: '/api/webhooks/whatsapp', summary: 'WhatsApp Webhook', desc: 'Meta Business API\'den gelen WhatsApp mesaj webhook\'u.', auth: 'none', category: 'Webhooks' },
    { method: 'POST', path: '/api/webhooks/make', summary: 'Make.com Webhook', desc: 'Make.com otomasyon senaryolarından gelen webhook.', auth: 'none', category: 'Webhooks' },
    { method: 'POST', path: '/api/webhooks/vapi', summary: 'Vapi AI Webhook', desc: 'Vapi AI sesli arama sonuçları webhook\'u.', auth: 'none', category: 'Webhooks' },
    // Vapi
    { method: 'GET', path: '/api/vapi', summary: 'Vapi Asistan Bilgisi', desc: 'Vapi AI sesli arama asistanı yapılandırmasını döner.', auth: 'bearer', category: 'Sesli Arama' },
    { method: 'POST', path: '/api/vapi', summary: 'Vapi Arama Başlat', desc: 'AI destekli otomatik sesli arama başlatır.', auth: 'bearer', category: 'Sesli Arama' },
    // Notifications
    { method: 'GET', path: '/api/notifications/scan', summary: 'Bildirim Tarama', desc: 'Yeni bildirimleri tarar ve oluşturur (cron job).', auth: 'api-key', category: 'Sistem' },
    // Cron
    { method: 'GET', path: '/api/cron/outreach', summary: 'Outreach Cron', desc: 'Zamanlanmış outreach kampanyalarını çalıştırır.', auth: 'api-key', category: 'Sistem' },
    // SEO
    { method: 'POST', path: '/api/seo/submit-sitemap', summary: 'Sitemap Gönder', desc: 'Arama motorlarına sitemap bildirir.', auth: 'bearer', category: 'SEO' },
    { method: 'POST', path: '/api/indexnow', summary: 'IndexNow Bildir', desc: 'Arama motorlarına sayfa güncelleme bildirimi gönderir.', auth: 'none', category: 'SEO' },
]

const CATEGORIES = [...new Set(ENDPOINTS.map(e => e.category))]

function EndpointCard({ endpoint }: { endpoint: ApiEndpoint }) {
    const [expanded, setExpanded] = useState(false)
    const [copied, setCopied] = useState(false)

    const copyPath = () => {
        navigator.clipboard.writeText(endpoint.path)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
    }

    return (
        <div className={cn("border rounded-lg transition-all duration-200 hover:shadow-md", expanded && "shadow-md ring-1 ring-black/5")}>
            <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer"
            >
                <Badge variant="outline" className={cn("font-mono text-[11px] font-bold px-2.5 py-0.5 min-w-[52px] justify-center border", METHOD_COLORS[endpoint.method])}>
                    {endpoint.method}
                </Badge>
                <code className="text-sm font-mono text-slate-700 flex-1 truncate">{endpoint.path}</code>
                <span className="text-xs text-muted-foreground hidden sm:block max-w-[240px] truncate">{endpoint.summary}</span>
                {endpoint.auth === 'bearer' && <Shield className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
            </button>

            {expanded && (
                <div className="border-t px-4 py-4 space-y-4 bg-slate-50/50">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h4 className="font-semibold text-sm">{endpoint.summary}</h4>
                            <p className="text-xs text-muted-foreground mt-1">{endpoint.desc}</p>
                        </div>
                        <Button variant="ghost" size="sm" className="shrink-0 h-7 text-xs gap-1" onClick={copyPath}>
                            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            {copied ? 'Kopyalandı' : 'Kopyala'}
                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">
                            {endpoint.auth === 'bearer' ? '🔒 Bearer Token' : endpoint.auth === 'api-key' ? '🔑 API Key' : '🌐 Public'}
                        </Badge>
                    </div>

                    {endpoint.params && (
                        <div>
                            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Parametreler</h5>
                            <div className="border rounded-md overflow-hidden">
                                <table className="w-full text-xs">
                                    <thead><tr className="bg-slate-100"><th className="text-left px-3 py-1.5 font-semibold">Alan</th><th className="text-left px-3 py-1.5 font-semibold">Tip</th><th className="text-left px-3 py-1.5 font-semibold">Açıklama</th></tr></thead>
                                    <tbody>
                                        {endpoint.params.map(p => (
                                            <tr key={p.name} className="border-t">
                                                <td className="px-3 py-1.5 font-mono font-medium">{p.name}{p.required && <span className="text-red-500 ml-0.5">*</span>}</td>
                                                <td className="px-3 py-1.5 text-muted-foreground">{p.type}</td>
                                                <td className="px-3 py-1.5 text-muted-foreground">{p.desc}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {endpoint.body && (
                        <div>
                            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Request Body</h5>
                            <pre className="bg-slate-900 text-slate-100 rounded-md p-3 text-xs font-mono overflow-x-auto">{endpoint.body}</pre>
                        </div>
                    )}

                    {endpoint.response && (
                        <div>
                            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Response</h5>
                            <pre className="bg-slate-900 text-emerald-300 rounded-md p-3 text-xs font-mono overflow-x-auto">{endpoint.response}</pre>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default function ApiDocsClient() {
    const [search, setSearch] = useState('')
    const [activeCategory, setActiveCategory] = useState<string | null>(null)

    const filtered = ENDPOINTS.filter(e => {
        const matchSearch = !search || e.path.toLowerCase().includes(search.toLowerCase()) || e.summary.toLowerCase().includes(search.toLowerCase())
        const matchCat = !activeCategory || e.category === activeCategory
        return matchSearch && matchCat
    })

    const grouped = CATEGORIES.filter(c => !activeCategory || c === activeCategory).map(cat => ({
        category: cat,
        endpoints: filtered.filter(e => e.category === cat),
    })).filter(g => g.endpoints.length > 0)

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg"><Code2 className="h-5 w-5 text-white" /></div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">API Referansı</h1>
                            <p className="text-sm text-muted-foreground">Novo CRM REST API dokümantasyonu</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30 text-xs">v1.0</Badge>
                    <Badge className="bg-blue-500/10 text-blue-700 border-blue-500/30 text-xs">Base: /api</Badge>
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid sm:grid-cols-3 gap-3">
                <Card className="py-4">
                    <CardContent className="flex items-center gap-3 px-4">
                        <Globe className="h-8 w-8 text-blue-500" />
                        <div><div className="text-xs text-muted-foreground">Base URL</div><div className="font-mono text-sm font-semibold">https://novocrm.app/api</div></div>
                    </CardContent>
                </Card>
                <Card className="py-4">
                    <CardContent className="flex items-center gap-3 px-4">
                        <Shield className="h-8 w-8 text-amber-500" />
                        <div><div className="text-xs text-muted-foreground">Kimlik Doğrulama</div><div className="text-sm font-semibold">Bearer Token / Supabase Auth</div></div>
                    </CardContent>
                </Card>
                <Card className="py-4">
                    <CardContent className="flex items-center gap-3 px-4">
                        <Zap className="h-8 w-8 text-emerald-500" />
                        <div><div className="text-xs text-muted-foreground">Toplam Endpoint</div><div className="text-sm font-semibold">{ENDPOINTS.length} endpoint</div></div>
                    </CardContent>
                </Card>
            </div>

            {/* Search + Category Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
                <input
                    type="text"
                    placeholder="Endpoint ara... (ör: /leads, WhatsApp)"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <div className="flex flex-wrap gap-1.5">
                    <Button variant={!activeCategory ? 'default' : 'outline'} size="sm" className="h-8 text-xs" onClick={() => setActiveCategory(null)}>Tümü</Button>
                    {CATEGORIES.map(c => (
                        <Button key={c} variant={activeCategory === c ? 'default' : 'outline'} size="sm" className="h-8 text-xs" onClick={() => setActiveCategory(activeCategory === c ? null : c)}>{c}</Button>
                    ))}
                </div>
            </div>

            {/* Endpoints */}
            {grouped.map(g => (
                <div key={g.category}>
                    <div className="flex items-center gap-2 mb-3">
                        <div className={cn("h-2 w-2 rounded-full", g.category === 'Lead Yönetimi' ? 'bg-emerald-500' : g.category === 'Yapay Zeka (AI)' ? 'bg-violet-500' : g.category === 'Sözleşmeler' ? 'bg-blue-500' : g.category === 'WhatsApp' ? 'bg-green-500' : g.category === 'Webhooks' ? 'bg-orange-500' : 'bg-slate-500')} />
                        <h2 className="text-base font-bold">{g.category}</h2>
                        <span className="text-xs text-muted-foreground">({g.endpoints.length})</span>
                    </div>
                    <div className="space-y-2">
                        {g.endpoints.map((ep, i) => <EndpointCard key={`${ep.method}-${ep.path}-${i}`} endpoint={ep} />)}
                    </div>
                </div>
            ))}

            {filtered.length === 0 && (
                <Card className="py-12"><CardContent className="text-center text-muted-foreground text-sm">Aramanızla eşleşen endpoint bulunamadı.</CardContent></Card>
            )}
        </div>
    )
}
