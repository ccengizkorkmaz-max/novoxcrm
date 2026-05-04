'use client'

import React, { useRef, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Sparkles, Save, Eye, Undo, ChevronDown, Layout, FileText } from 'lucide-react'

// Dynamic import to avoid SSR issues
const EmailEditor = dynamic(() => import('react-email-editor').then(mod => mod.default || mod), {
    ssr: false,
    loading: () => (
        <div className="h-[600px] flex items-center justify-center bg-slate-50 rounded-xl border border-dashed">
            <div className="text-center">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
                <p className="text-sm text-muted-foreground font-medium">Editör yükleniyor...</p>
            </div>
        </div>
    )
})

// Pre-built real estate email templates
const REAL_ESTATE_TEMPLATES = [
    {
        id: 'new_listing',
        name: 'Yeni Portföy Duyurusu',
        emoji: '🏠',
        description: 'Yeni eklenen portföyü müşterilere duyurun',
        design: {
            body: {
                rows: [
                    {
                        cells: [1],
                        columns: [{
                            contents: [
                                { type: 'image', values: { src: { url: 'https://placehold.co/600x300/1e40af/ffffff?text=Portf%C3%B6y+G%C3%B6rseli' }, containerPadding: '0px' } },
                                { type: 'heading', values: { text: '{{portfoy_baslik}}', fontSize: '24px', fontWeight: 700, textAlign: 'center', padding: '20px 20px 5px' } },
                                { type: 'text', values: { text: '<p style="text-align:center;color:#64748b;">📍 {{sehir}}, {{ilce}} · {{oda_sayisi}} · {{net_m2}} m²</p>', padding: '0px 20px 10px' } },
                                { type: 'text', values: { text: '<p style="text-align:center;font-size:28px;font-weight:800;color:#1e40af;">{{fiyat}} {{para_birimi}}</p>', padding: '10px 20px' } },
                                { type: 'text', values: { text: '<p>{{aciklama}}</p>', padding: '10px 20px' } },
                                { type: 'button', values: { text: 'Detayları İncele →', backgroundColor: '#1e40af', borderRadius: '8px', padding: '20px', href: { url: '{{detay_link}}' } } },
                                { type: 'divider', values: { padding: '20px' } },
                                { type: 'text', values: { text: '<p style="text-align:center;font-size:12px;color:#94a3b8;">Bu e-posta NovoCRM üzerinden gönderilmiştir.</p>', padding: '10px 20px' } }
                            ]
                        }]
                    }
                ],
                values: { backgroundColor: '#f1f5f9', contentWidth: '600px', fontFamily: { label: 'Inter', value: "'Inter', sans-serif" } }
            }
        }
    },
    {
        id: 'price_drop',
        name: 'Fiyat Düşüşü Bildirimi',
        emoji: '📉',
        description: 'Fiyatı düşen portföyü ilgili müşterilere bildirin',
        design: null
    },
    {
        id: 'open_house',
        name: 'Açık Ev Daveti',
        emoji: '🏡',
        description: 'Müşterilerinizi yerinde gezmeye davet edin',
        design: null
    },
    {
        id: 'market_report',
        name: 'Piyasa Raporu',
        emoji: '📊',
        description: 'Aylık bölge piyasa analizi paylaşın',
        design: null
    },
    {
        id: 'welcome',
        name: 'Hoş Geldiniz',
        emoji: '👋',
        description: 'Yeni müşterilere hoş geldin mesajı',
        design: null
    }
]

interface Props {
    initialDesign?: any
    initialHtml?: string
    onSave: (html: string, design: any) => void
    portfolios?: any[]
}

export function CampaignEmailEditor({ initialDesign, initialHtml, onSave, portfolios = [] }: Props) {
    const emailEditorRef = useRef<any>(null)
    const [editorReady, setEditorReady] = useState(false)
    const [showTemplates, setShowTemplates] = useState(!initialDesign)
    const [generating, setGenerating] = useState(false)
    const [previewHtml, setPreviewHtml] = useState<string | null>(null)

    const onReady = useCallback(() => {
        setEditorReady(true)
        if (initialDesign) {
            emailEditorRef.current?.editor?.loadDesign(initialDesign)
        }
    }, [initialDesign])

    const handleSave = useCallback(() => {
        emailEditorRef.current?.editor?.exportHtml((data: any) => {
            const { design, html } = data
            onSave(html, design)
            toast.success('Kampanya içeriği kaydedildi!')
        })
    }, [onSave])

    const handlePreview = useCallback(() => {
        emailEditorRef.current?.editor?.exportHtml((data: any) => {
            setPreviewHtml(data.html)
        })
    }, [])

    const loadTemplate = useCallback((template: typeof REAL_ESTATE_TEMPLATES[0]) => {
        if (template.design) {
            emailEditorRef.current?.editor?.loadDesign(template.design)
            toast.success(`"${template.name}" şablonu yüklendi`)
        } else {
            toast.info('Bu şablon yakında eklenecek')
        }
        setShowTemplates(false)
    }, [])

    const generateAIContent = useCallback(async () => {
        setGenerating(true)
        try {
            const res = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: 'Bir emlak firması için profesyonel bir e-posta kampanya metni oluştur. Portföy duyurusu tarzında, ikna edici ve profesyonel olsun. Türkçe yaz. Kısa paragraflar kullan. Başlık, giriş, özellikler ve çağrı aksiyonu bölümleri olsun.',
                    type: 'email_campaign'
                })
            })
            const data = await res.json()
            if (data.text) {
                // Insert the AI text into a simple design
                const aiDesign = {
                    body: {
                        rows: [{
                            cells: [1],
                            columns: [{
                                contents: [
                                    { type: 'heading', values: { text: '🏠 Yeni Portföy Fırsatı', fontSize: '24px', fontWeight: 700, textAlign: 'center', padding: '30px 20px 10px' } },
                                    { type: 'divider', values: { padding: '5px 40px' } },
                                    { type: 'text', values: { text: data.text.replace(/\n/g, '<br/>'), padding: '15px 30px', fontSize: '14px', lineHeight: '180%' } },
                                    { type: 'button', values: { text: 'Portföyleri İncele →', backgroundColor: '#1e40af', borderRadius: '8px', padding: '20px 30px', href: { url: '#' } } },
                                    { type: 'text', values: { text: '<p style="text-align:center;font-size:11px;color:#94a3b8;margin-top:20px;">Bu e-posta NovoCRM üzerinden gönderilmiştir.</p>', padding: '15px 20px' } }
                                ]
                            }]
                        }],
                        values: { backgroundColor: '#f1f5f9', contentWidth: '600px' }
                    }
                }
                emailEditorRef.current?.editor?.loadDesign(aiDesign)
                toast.success('AI içerik oluşturuldu ve editöre yüklendi!')
            } else {
                toast.error('AI içerik oluşturulamadı')
            }
        } catch {
            toast.error('AI servisi şu an kullanılamıyor (OPENAI_API_KEY gerekli)')
        } finally {
            setGenerating(false)
        }
    }, [])

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => setShowTemplates(!showTemplates)}>
                        <Layout className="h-3.5 w-3.5" /> Şablonlar <ChevronDown className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs gap-1.5 text-violet-600 border-violet-200 hover:bg-violet-50" onClick={generateAIContent} disabled={generating || !editorReady}>
                        <Sparkles className="h-3.5 w-3.5" /> {generating ? 'Oluşturuluyor...' : 'AI ile İçerik Oluştur'}
                    </Button>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={handlePreview} disabled={!editorReady}>
                        <Eye className="h-3.5 w-3.5" /> Önizle
                    </Button>
                    <Button size="sm" className="text-xs gap-1.5 bg-blue-600 hover:bg-blue-700" onClick={handleSave} disabled={!editorReady}>
                        <Save className="h-3.5 w-3.5" /> İçeriği Kaydet
                    </Button>
                </div>
            </div>

            {/* Template Selector */}
            {showTemplates && (
                <Card className="border shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-500" /> Hazır Şablonlar
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                            {REAL_ESTATE_TEMPLATES.map(t => (
                                <button key={t.id} onClick={() => loadTemplate(t)}
                                    className="p-3 rounded-xl border hover:border-blue-300 hover:bg-blue-50/50 transition-all text-left group">
                                    <span className="text-2xl block mb-1">{t.emoji}</span>
                                    <p className="text-xs font-bold text-slate-800 group-hover:text-blue-700">{t.name}</p>
                                    <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{t.description}</p>
                                    {t.design ? (
                                        <Badge className="mt-1.5 text-[8px] bg-emerald-100 text-emerald-700 border-none">Hazır</Badge>
                                    ) : (
                                        <Badge variant="outline" className="mt-1.5 text-[8px]">Yakında</Badge>
                                    )}
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Email Editor */}
            <div className="border rounded-xl overflow-hidden shadow-sm bg-white" style={{ minHeight: 650 }}>
                <EmailEditor
                    ref={emailEditorRef}
                    onReady={onReady}
                    minHeight={650}
                    options={{
                        locale: 'tr-TR',
                        appearance: { theme: 'modern_light' },
                        features: { textEditor: { spellChecker: false } },
                        tools: { form: { enabled: false } },
                        mergeTags: {
                            musteri_adi: { name: 'Müşteri Adı', value: '{{musteri_adi}}' },
                            portfoy_baslik: { name: 'Portföy Başlık', value: '{{portfoy_baslik}}' },
                            sehir: { name: 'Şehir', value: '{{sehir}}' },
                            ilce: { name: 'İlçe', value: '{{ilce}}' },
                            fiyat: { name: 'Fiyat', value: '{{fiyat}}' },
                            para_birimi: { name: 'Para Birimi', value: '{{para_birimi}}' },
                            oda_sayisi: { name: 'Oda Sayısı', value: '{{oda_sayisi}}' },
                            net_m2: { name: 'Net m²', value: '{{net_m2}}' },
                            firma_adi: { name: 'Firma Adı', value: '{{firma_adi}}' },
                            danisman_adi: { name: 'Danışman Adı', value: '{{danisman_adi}}' },
                        }
                    }}
                />
            </div>

            {/* Merge Tags Info */}
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                <p className="text-[10px] text-amber-700 font-medium">
                    💡 <strong>Değişken kullanımı:</strong> Metin yazarken {`{{musteri_adi}}`}, {`{{portfoy_baslik}}`}, {`{{fiyat}}`} gibi değişkenler ekleyebilirsiniz. Gönderim sırasında bunlar otomatik doldurulur.
                </p>
            </div>

            {/* Preview Modal */}
            {previewHtml && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-8" onClick={() => setPreviewHtml(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
                            <h3 className="text-sm font-bold">📧 E-posta Önizleme</h3>
                            <Button variant="ghost" size="sm" onClick={() => setPreviewHtml(null)}>✕</Button>
                        </div>
                        <div className="p-6" dangerouslySetInnerHTML={{ __html: previewHtml }} />
                    </div>
                </div>
            )}
        </div>
    )
}
