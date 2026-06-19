'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Send, FileText, Users, Loader2, CheckCircle2, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { getTemplates, getSegmentsForEmail, createCampaign, getSegmentRecipientCount, launchCampaign } from '../actions'
import { useRouter } from '@/i18n/routing'

export function NewCampaignForm() {
    const [step, setStep] = useState(1) // 1: Bilgiler, 2: Şablon, 3: Segment, 4: Onay
    const [templates, setTemplates] = useState<any[]>([])
    const [segments, setSegments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [launching, setLaunching] = useState(false)
    const [recipientCount, setRecipientCount] = useState<number | null>(null)

    // Form state
    const [name, setName] = useState('')
    const [subject, setSubject] = useState('')
    const [templateId, setTemplateId] = useState('')
    const [segmentId, setSegmentId] = useState('')
    const [fromName, setFromName] = useState('Novo İnşaat')
    const [fromEmail, setFromEmail] = useState('onboarding@novoxcrm.com')

    const router = useRouter()

    useEffect(() => {
        async function load() {
            const [t, s] = await Promise.all([getTemplates(), getSegmentsForEmail()])
            setTemplates(t)
            setSegments(s)
            setLoading(false)
        }
        load()
    }, [])

    useEffect(() => {
        if (segmentId) {
            getSegmentRecipientCount(segmentId).then(c => setRecipientCount(c))
        }
    }, [segmentId])

    const selectedTemplate = templates.find(t => t.id === templateId)
    const selectedSegment = segments.find(s => s.id === segmentId)

    const canProceedStep1 = name.trim() && subject.trim()
    const canProceedStep2 = !!templateId
    const canProceedStep3 = !!segmentId

    const handleLaunch = async () => {
        setLaunching(true)
        // Önce kampanyayı oluştur
        const res = await createCampaign({
            name, subject, template_id: templateId, segment_id: segmentId,
            from_name: fromName, from_email: fromEmail,
            html: selectedTemplate?.html || '',
        })
        if (res.error) {
            toast.error(res.error)
            setLaunching(false)
            return
        }

        // Gönder
        const campaignId = res.data?.id
        if (!campaignId) {
            toast.error('Kampanya oluşturulamadı')
            setLaunching(false)
            return
        }

        const launchRes = await launchCampaign(campaignId)
        setLaunching(false)
        
        if (launchRes.error) {
            toast.error(launchRes.error)
        } else {
            toast.success(`✅ ${'sent' in launchRes ? launchRes.sent : 0} email gönderildi!`)
            router.push(`/email/campaigns/${campaignId}`)
        }
    }

    const handleSaveDraft = async () => {
        const res = await createCampaign({
            name, subject, template_id: templateId, segment_id: segmentId,
            from_name: fromName, from_email: fromEmail,
            html: selectedTemplate?.html || '',
        })
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success('Kampanya taslak olarak kaydedildi')
            router.push('/email')
        }
    }

    return (
        <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => router.push('/email')} className="gap-1 text-xs">
                    <ArrowLeft className="h-3.5 w-3.5" /> Geri
                </Button>
                <div>
                    <h1 className="text-xl font-bold">Yeni Email Kampanyası</h1>
                    <p className="text-xs text-muted-foreground">Adım {step}/4</p>
                </div>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4].map(s => (
                    <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${
                        s <= step ? 'bg-blue-500' : 'bg-muted'
                    }`} />
                ))}
            </div>

            {/* Step 1: Bilgiler */}
            {step === 1 && (
                <Card className="p-6 space-y-4">
                    <h2 className="text-sm font-bold flex items-center gap-2">
                        <Send className="h-4 w-4 text-blue-400" /> Kampanya Bilgileri
                    </h2>
                    <div>
                        <label className="text-xs font-medium mb-1 block">Kampanya Adı *</label>
                        <Input placeholder="Örn: Haziran Proje Tanıtımı" value={name} onChange={e => setName(e.target.value)} />
                    </div>
                    <div>
                        <label className="text-xs font-medium mb-1 block">Email Konusu *</label>
                        <Input placeholder="Örn: Yeni Projemiz Hakkında Bilgi" value={subject} onChange={e => setSubject(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium mb-1 block">Gönderici Adı</label>
                            <Input value={fromName} onChange={e => setFromName(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs font-medium mb-1 block">Gönderici Email</label>
                            <Input value={fromEmail} onChange={e => setFromEmail(e.target.value)} />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button onClick={() => setStep(2)} disabled={!canProceedStep1} className="gap-1 bg-blue-600">
                            Devam <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </Card>
            )}

            {/* Step 2: Şablon */}
            {step === 2 && (
                <Card className="p-6 space-y-4">
                    <h2 className="text-sm font-bold flex items-center gap-2">
                        <FileText className="h-4 w-4 text-purple-400" /> Şablon Seçin
                    </h2>
                    {loading ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">Yükleniyor...</div>
                    ) : templates.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-sm text-muted-foreground mb-3">Henüz şablon yok</p>
                            <Button size="sm" onClick={() => router.push('/email')} className="bg-purple-600">
                                Önce Şablon Oluşturun
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {templates.map(t => (
                                <Card 
                                    key={t.id} 
                                    className={`p-3 cursor-pointer transition-all ${
                                        templateId === t.id 
                                            ? 'ring-2 ring-purple-500 bg-purple-500/5' 
                                            : 'hover:bg-muted/30'
                                    }`}
                                    onClick={() => setTemplateId(t.id)}
                                >
                                    <div className="flex items-center gap-2">
                                        {templateId === t.id ? (
                                            <CheckCircle2 className="h-4 w-4 text-purple-500" />
                                        ) : (
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                        )}
                                        <span className="text-sm font-medium">{t.name}</span>
                                    </div>
                                    {t.subject && <p className="text-[10px] text-muted-foreground mt-1 ml-6">{t.subject}</p>}
                                </Card>
                            ))}
                        </div>
                    )}
                    <div className="flex justify-between">
                        <Button variant="outline" onClick={() => setStep(1)}>Geri</Button>
                        <Button onClick={() => setStep(3)} disabled={!canProceedStep2} className="gap-1 bg-blue-600">
                            Devam <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </Card>
            )}

            {/* Step 3: Segment */}
            {step === 3 && (
                <Card className="p-6 space-y-4">
                    <h2 className="text-sm font-bold flex items-center gap-2">
                        <Users className="h-4 w-4 text-emerald-400" /> Hedef Segment
                    </h2>
                    {segments.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-sm text-muted-foreground mb-3">Henüz segment yok</p>
                            <Button size="sm" onClick={() => router.push('/outreach/segments')} className="bg-emerald-600">
                                Segment Oluşturun
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {segments.map(s => (
                                <Card 
                                    key={s.id} 
                                    className={`p-3 cursor-pointer transition-all ${
                                        segmentId === s.id 
                                            ? 'ring-2 ring-emerald-500 bg-emerald-500/5' 
                                            : 'hover:bg-muted/30'
                                    }`}
                                    onClick={() => setSegmentId(s.id)}
                                >
                                    <div className="flex items-center gap-2">
                                        {segmentId === s.id ? (
                                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                        ) : (
                                            <Users className="h-4 w-4 text-muted-foreground" />
                                        )}
                                        <span className="text-sm font-medium">{s.name}</span>
                                    </div>
                                    {s.description && <p className="text-[10px] text-muted-foreground mt-1 ml-6">{s.description}</p>}
                                </Card>
                            ))}
                        </div>
                    )}
                    {recipientCount !== null && segmentId && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-center">
                            <p className="text-sm font-semibold text-emerald-400">{recipientCount.toLocaleString()} alıcı</p>
                            <p className="text-[10px] text-muted-foreground">Email adresi olan, iletişime açık müşteriler</p>
                        </div>
                    )}
                    <div className="flex justify-between">
                        <Button variant="outline" onClick={() => setStep(2)}>Geri</Button>
                        <Button onClick={() => setStep(4)} disabled={!canProceedStep3} className="gap-1 bg-blue-600">
                            Devam <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </Card>
            )}

            {/* Step 4: Onay & Gönder */}
            {step === 4 && (
                <Card className="p-6 space-y-4">
                    <h2 className="text-sm font-bold flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-blue-400" /> Kampanya Özeti
                    </h2>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between py-1.5 border-b border-border/50">
                            <span className="text-muted-foreground">Kampanya Adı</span>
                            <span className="font-medium">{name}</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-border/50">
                            <span className="text-muted-foreground">Konu</span>
                            <span className="font-medium">{subject}</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-border/50">
                            <span className="text-muted-foreground">Gönderici</span>
                            <span className="font-medium">{fromName} &lt;{fromEmail}&gt;</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-border/50">
                            <span className="text-muted-foreground">Şablon</span>
                            <Badge variant="outline" className="text-purple-400">{selectedTemplate?.name}</Badge>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-border/50">
                            <span className="text-muted-foreground">Segment</span>
                            <Badge variant="outline" className="text-emerald-400">{selectedSegment?.name}</Badge>
                        </div>
                        <div className="flex justify-between py-1.5">
                            <span className="text-muted-foreground">Tahmini Alıcı</span>
                            <span className="font-bold text-blue-400">{recipientCount?.toLocaleString() || '?'} kişi</span>
                        </div>
                    </div>

                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-center text-xs text-amber-400">
                        ⚠️ Gönder'e bastığınızda emailler hemen gönderilmeye başlayacak
                    </div>

                    <div className="flex justify-between gap-2">
                        <Button variant="outline" onClick={() => setStep(3)}>Geri</Button>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={handleSaveDraft}>
                                Taslak Olarak Kaydet
                            </Button>
                            <Button 
                                onClick={handleLaunch} 
                                disabled={launching} 
                                className="gap-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                            >
                                {launching ? (
                                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Gönderiliyor...</>
                                ) : (
                                    <><Send className="h-3.5 w-3.5" /> Gönder</>
                                )}
                            </Button>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    )
}
