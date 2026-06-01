'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    Brain, Star, Phone, Clock, ChevronDown, ChevronUp, Play, FileText,
    Send, Sparkles, CheckCircle2, AlertTriangle, MessageSquare, Shield,
    TrendingUp, BarChart3, ArrowLeft, RefreshCw, Eye, Lock, Zap,
    ThumbsUp, ThumbsDown, Minus, Search
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { submitCallFeedback, generatePromptSuggestion, createPromptVersion, applyPromptVersion } from './actions'
import { MiniAudioPlayer } from '@/components/ui/mini-audio-player'

// ─── Props ───────────────────────────────────────────────────

interface Props {
    calls: any[]
    analytics: any
    promptVersions: any[]
    isAdmin: boolean
    locale: string
}

// ─── Translations ────────────────────────────────────────────

const translations: Record<string, Record<string, string>> = {
    tr: {
        title: 'AI Agent Geri Bildirim',
        subtitle: 'AI aramalarını değerlendir, agent davranışını iyileştir',
        tabCalls: 'Arama İnceleme',
        tabAnalytics: 'Analiz',
        tabPrompts: 'Prompt Yönetimi',
        noCallsYet: 'Henüz değerlendirilecek arama yok',
        submitFeedback: 'Geri Bildirim Gönder',
        feedbackSent: 'Geri bildirim kaydedildi ✓',
        overallRating: 'Genel Performans',
        tone: 'Ton & Üslup',
        accuracy: 'Bilgi Doğruluğu',
        objection: 'İtiraz Yönetimi',
        questions: 'Soru Sorma',
        closing: 'Kapanış Becerisi',
        comment: 'Serbest Yorum',
        suggestion: 'Önerilen Yanıt',
        tags: 'Etiketler',
        generateSuggestion: 'AI ile Prompt İyileştir',
        createVersion: 'Yeni Versiyon Oluştur',
        applyVersion: 'Bu Versiyonu Aktif Yap',
        active: 'Aktif',
        adminOnly: 'Sadece Admin/Owner',
        avgRating: 'Ort. Puan',
        totalFeedbacks: 'Toplam Değerlendirme',
        commonIssues: 'Sık Sorunlar',
        topTags: 'En Çok Etiketler',
        back: 'Geri',
        transcript: 'Transkript',
        summary: 'Özet',
        recording: 'Kayıt',
        duration: 'Süre',
        appropriate: 'Uygun',
        too_formal: 'Çok Resmi',
        too_casual: 'Çok Samimi',
        aggressive: 'Agresif',
        correct: 'Doğru',
        incorrect: 'Yanlış Bilgi',
        incomplete: 'Eksik Bilgi',
        good: 'İyi',
        insufficient: 'Yetersiz',
        wrong_approach: 'Yanlış Yaklaşım',
        adequate: 'Yeterli',
        unnecessary: 'Gereksiz',
        missed_opportunity: 'Fırsatı Kaçırdı',
        too_pushy: 'Çok Israrcı',
    },
    en: {
        title: 'AI Agent Feedback',
        subtitle: 'Review AI calls, improve agent behavior',
        tabCalls: 'Call Review',
        tabAnalytics: 'Analytics',
        tabPrompts: 'Prompt Management',
        noCallsYet: 'No calls to review yet',
        submitFeedback: 'Submit Feedback',
        feedbackSent: 'Feedback saved ✓',
        overallRating: 'Overall Performance',
        tone: 'Tone & Manner',
        accuracy: 'Information Accuracy',
        objection: 'Objection Handling',
        questions: 'Question Asking',
        closing: 'Closing Skill',
        comment: 'Free Comment',
        suggestion: 'Suggested Response',
        tags: 'Tags',
        generateSuggestion: 'AI Prompt Improvement',
        createVersion: 'Create New Version',
        applyVersion: 'Activate This Version',
        active: 'Active',
        adminOnly: 'Admin/Owner Only',
        avgRating: 'Avg Rating',
        totalFeedbacks: 'Total Feedbacks',
        commonIssues: 'Common Issues',
        topTags: 'Top Tags',
        back: 'Back',
        transcript: 'Transcript',
        summary: 'Summary',
        recording: 'Recording',
        duration: 'Duration',
        appropriate: 'Appropriate',
        too_formal: 'Too Formal',
        too_casual: 'Too Casual',
        aggressive: 'Aggressive',
        correct: 'Correct',
        incorrect: 'Incorrect',
        incomplete: 'Incomplete',
        good: 'Good',
        insufficient: 'Insufficient',
        wrong_approach: 'Wrong Approach',
        adequate: 'Adequate',
        unnecessary: 'Unnecessary',
        missed_opportunity: 'Missed Opportunity',
        too_pushy: 'Too Pushy',
    }
}

const FEEDBACK_TAGS = [
    'fiyat_bilgisi', 'ret_yonetimi', 'selamlama', 'proje_tanitimi',
    'odeme_kosullari', 'yonlendirme', 'tonlama', 'bilgi_eksikligi',
    'monolog', 'sure_uzun', 'sure_kisa', 'dil_hatasi'
]

// ─── Main Component ──────────────────────────────────────────

export default function AIFeedbackDashboard({ calls, analytics, promptVersions, isAdmin, locale }: Props) {
    const t = (key: string) => translations[locale]?.[key] || translations.tr[key] || key

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/20">
                        <Brain className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">{t('title')}</h1>
                        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="calls" className="space-y-6">
                <TabsList className="grid w-full max-w-lg grid-cols-3">
                    <TabsTrigger value="calls" className="gap-2">
                        <Phone className="h-4 w-4" /> {t('tabCalls')}
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="gap-2">
                        <BarChart3 className="h-4 w-4" /> {t('tabAnalytics')}
                    </TabsTrigger>
                    <TabsTrigger value="prompts" className="gap-2" disabled={!isAdmin}>
                        <Shield className="h-4 w-4" /> {t('tabPrompts')}
                        {!isAdmin && <Lock className="h-3 w-3 ml-1" />}
                    </TabsTrigger>
                </TabsList>

                {/* Tab 1: Call Review */}
                <TabsContent value="calls">
                    <CallReviewPanel calls={calls} t={t} locale={locale} />
                </TabsContent>

                {/* Tab 2: Analytics */}
                <TabsContent value="analytics">
                    <AnalyticsPanel analytics={analytics} t={t} />
                </TabsContent>

                {/* Tab 3: Prompt Management (Admin Only) */}
                <TabsContent value="prompts">
                    {isAdmin ? (
                        <PromptManagementPanel promptVersions={promptVersions} t={t} />
                    ) : (
                        <Card className="p-12 text-center">
                            <Lock className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                            <p className="text-muted-foreground">{t('adminOnly')}</p>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}


// ─── Call Review Panel ────────────────────────────────────────

function CallReviewPanel({ calls, t, locale }: { calls: any[]; t: (k: string) => string; locale: string }) {
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [feedbackStates, setFeedbackStates] = useState<Record<string, any>>({})
    const [submittedIds, setSubmittedIds] = useState<Set<string>>(new Set())
    const [isPending, startTransition] = useTransition()
    const [searchQuery, setSearchQuery] = useState('')
    const [subTab, setSubTab] = useState<'pending' | 'reviewed'>('pending')

    const handleFeedbackChange = (callId: string, field: string, value: any) => {
        setFeedbackStates(prev => ({
            ...prev,
            [callId]: { ...prev[callId], [field]: value }
        }))
    }

    const handleSubmit = async (call: any) => {
        const fb = { ...(call.existing_feedback || {}), ...(feedbackStates[call.id] || {}) }
        if (!fb.overall_rating) {
            toast.error(locale === 'tr' ? 'Lütfen Genel Performans için 1-5 arası bir yıldız seçin.' : 'Please select an overall rating (1-5 stars).')
            return
        }

        startTransition(async () => {
            const result = await submitCallFeedback({
                step_log_id: call.id,
                call_id: call.call_id,
                overall_rating: fb.overall_rating,
                tone_rating: fb.tone_rating,
                accuracy_rating: fb.accuracy_rating,
                objection_handling: fb.objection_handling,
                question_asking: fb.question_asking,
                closing_skill: fb.closing_skill,
                free_comment: fb.free_comment,
                suggested_response: fb.suggested_response,
                transcript_highlight: fb.transcript_highlight,
                tags: fb.tags || [],
            })
            if (result.success) {
                toast.success(t('feedbackSent'))
                setSubmittedIds(prev => new Set([...prev, call.id]))
            } else {
                toast.error(result.error || 'Kaydedilirken bir hata oluştu.')
            }
        })
    }

    // Filter by search
    const filtered = calls.filter(call => {
        if (!searchQuery.trim()) return true
        const q = searchQuery.toLowerCase()
        return (
            (call.customer_name || '').toLowerCase().includes(q) ||
            (call.customer_phone || '').includes(q) ||
            (call.project_name || '').toLowerCase().includes(q) ||
            (call.workflow_name || '').toLowerCase().includes(q) ||
            (call.call_summary || '').toLowerCase().includes(q) ||
            (call.call_transcript || '').toLowerCase().includes(q)
        )
    })

    // Split into pending / reviewed
    const pendingCalls = filtered.filter(c => !c.existing_feedback && !submittedIds.has(c.id))
    const reviewedCalls = filtered.filter(c => !!c.existing_feedback || submittedIds.has(c.id))

    const activeCalls = subTab === 'pending' ? pendingCalls : reviewedCalls

    if (calls.length === 0) {
        return (
            <Card className="p-12 text-center">
                <Phone className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">{t('noCallsYet')}</p>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            {/* Search + Sub-Tabs */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="relative flex-1 w-full sm:max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Müşteri, telefon, proje ara..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition-shadow"
                    />
                </div>
                <div className="flex rounded-lg border overflow-hidden shrink-0">
                    <button
                        onClick={() => setSubTab('pending')}
                        className={cn(
                            "px-4 py-2 text-xs font-semibold flex items-center gap-1.5 transition-colors",
                            subTab === 'pending'
                                ? "bg-violet-50 text-violet-700 border-r border-violet-200"
                                : "text-muted-foreground hover:bg-muted/50 border-r"
                        )}
                    >
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Bekleyen
                        <span className="ml-1 px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 text-[10px] font-bold tabular-nums">
                            {pendingCalls.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setSubTab('reviewed')}
                        className={cn(
                            "px-4 py-2 text-xs font-semibold flex items-center gap-1.5 transition-colors",
                            subTab === 'reviewed'
                                ? "bg-green-50 text-green-700 border-green-200"
                                : "text-muted-foreground hover:bg-muted/50"
                        )}
                    >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Değerlendirildi
                        <span className="ml-1 px-1.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 text-[10px] font-bold tabular-nums">
                            {reviewedCalls.length}
                        </span>
                    </button>
                </div>
            </div>

            {/* Call List */}
            {activeCalls.length === 0 ? (
                <Card className="p-8 text-center">
                    {subTab === 'pending' ? (
                        <>
                            <CheckCircle2 className="h-10 w-10 mx-auto text-green-500/40 mb-3" />
                            <p className="text-sm text-muted-foreground">Tüm aramalar değerlendirildi! 🎉</p>
                        </>
                    ) : (
                        <>
                            <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                            <p className="text-sm text-muted-foreground">
                                {searchQuery ? 'Aramanızla eşleşen değerlendirilmiş kayıt bulunamadı.' : 'Henüz değerlendirilmiş arama yok.'}
                            </p>
                        </>
                    )}
                </Card>
            ) : (
                <div className="space-y-3">
                    {activeCalls.map(call => {
                        const isExpanded = expandedId === call.id
                        const hasExisting = !!call.existing_feedback
                        const isSubmitted = submittedIds.has(call.id)
                        const fb = { ...(call.existing_feedback || {}), ...(feedbackStates[call.id] || {}) }
                        const durationMin = Math.floor((call.call_duration_seconds || 0) / 60)
                        const durationSec = (call.call_duration_seconds || 0) % 60

                        return (
                            <Card key={call.id} className={cn(
                                "transition-all",
                                isExpanded ? "ring-1 ring-violet-500/30 shadow-lg" : "hover:bg-muted/30"
                            )}>
                                {/* Header Row */}
                                <div className="p-4 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : call.id)}>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-violet-500/15 border border-violet-500/30">
                                            <Phone className="h-4 w-4 text-violet-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-sm">{call.customer_name}</span>
                                                {call.project_name && (
                                                    <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-400">
                                                        {call.project_name}
                                                    </Badge>
                                                )}
                                                {call.workflow_name && (
                                                    <Badge variant="outline" className="text-[10px] border-slate-500/30 text-slate-400">
                                                        {call.workflow_name}
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground">{call.customer_phone}</p>
                                        </div>

                                        {call.call_duration_seconds > 0 && (
                                            <div className="text-right mr-2">
                                                <p className="text-sm font-bold tabular-nums">{durationMin}dk {durationSec}sn</p>
                                                <p className="text-[10px] text-muted-foreground">{t('duration')}</p>
                                            </div>
                                        )}

                                        <Badge variant="outline" className={cn(
                                            "text-[10px]",
                                            call.status === 'converted' ? "border-green-200 text-green-700" :
                                            call.status === 'answered' ? "border-emerald-200 text-emerald-700" :
                                            "border-orange-200 text-orange-600"
                                        )}>
                                            {call.status === 'converted' ? 'İlgilendi ✨' :
                                             call.status === 'answered' ? 'Cevaplandı' : 'Açtı/Kapattı'}
                                        </Badge>

                                        {(hasExisting || isSubmitted) && (
                                            <Badge className="bg-green-50 text-green-700 border-green-200 text-[10px]">
                                                <CheckCircle2 className="h-3 w-3 mr-1" /> Değerlendirildi
                                            </Badge>
                                        )}

                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                            {call.executed_at ? new Date(call.executed_at).toLocaleDateString(locale) : '—'}
                                        </span>

                                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    </div>
                                </div>

                                {/* Expanded Detail */}
                                {isExpanded && (
                                    <div className="px-4 pb-4 border-t space-y-4">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
                                            {/* Left: Call Details */}
                                            <div className="space-y-4">
                                                {/* Recording */}
                                                {call.call_recording_url && (
                                                    <div>
                                                        <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1">
                                                            <Play className="h-3 w-3" /> {t('recording')}
                                                        </h4>
                                                        <MiniAudioPlayer src={call.call_recording_url} className="max-w-md bg-slate-50 border-slate-200" />
                                                    </div>
                                                )}

                                                {/* Summary */}
                                                {call.call_summary && (
                                                    <div>
                                                        <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">{t('summary')}</h4>
                                                        <p className="text-xs leading-relaxed p-3 rounded-lg bg-muted/50 border">{call.call_summary}</p>
                                                    </div>
                                                )}

                                                {/* Transcript */}
                                                {call.call_transcript && (
                                                    <div>
                                                        <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1">
                                                            <FileText className="h-3 w-3" /> {t('transcript')}
                                                        </h4>
                                                        <div className="text-xs leading-relaxed p-3 rounded-lg bg-muted/50 border max-h-72 overflow-y-auto whitespace-pre-wrap">
                                                            {call.call_transcript}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Right: Feedback Form */}
                                            <div className="space-y-4">
                                                <h4 className="text-xs font-semibold text-violet-400 uppercase tracking-wider flex items-center gap-1">
                                                    <Brain className="h-3 w-3" /> Geri Bildirim Formu
                                                </h4>

                                                {/* Star Rating */}
                                                <div>
                                                    <label className="text-xs text-muted-foreground mb-1 block">{t('overallRating')}</label>
                                                    <div className="flex gap-1">
                                                        {[1, 2, 3, 4, 5].map(n => (
                                                            <button
                                                                key={n}
                                                                onClick={() => handleFeedbackChange(call.id, 'overall_rating', n)}
                                                                className="p-1 hover:scale-110 transition-transform"
                                                            >
                                                                <Star className={cn(
                                                                    "h-6 w-6 transition-colors",
                                                                    (fb.overall_rating || 0) >= n
                                                                        ? "fill-amber-400 text-amber-400"
                                                                        : "text-slate-600"
                                                                )} />
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Dropdowns Grid */}
                                                <div className="grid grid-cols-2 gap-3">
                                                    <FeedbackSelect label={t('tone')} value={fb.tone_rating || ''} 
                                                        onChange={v => handleFeedbackChange(call.id, 'tone_rating', v)}
                                                        options={[
                                                            { value: 'appropriate', label: t('appropriate') },
                                                            { value: 'too_formal', label: t('too_formal') },
                                                            { value: 'too_casual', label: t('too_casual') },
                                                            { value: 'aggressive', label: t('aggressive') },
                                                        ]} />
                                                    <FeedbackSelect label={t('accuracy')} value={fb.accuracy_rating || ''}
                                                        onChange={v => handleFeedbackChange(call.id, 'accuracy_rating', v)}
                                                        options={[
                                                            { value: 'correct', label: t('correct') },
                                                            { value: 'incorrect', label: t('incorrect') },
                                                            { value: 'incomplete', label: t('incomplete') },
                                                        ]} />
                                                    <FeedbackSelect label={t('objection')} value={fb.objection_handling || ''}
                                                        onChange={v => handleFeedbackChange(call.id, 'objection_handling', v)}
                                                        options={[
                                                            { value: 'good', label: t('good') },
                                                            { value: 'insufficient', label: t('insufficient') },
                                                            { value: 'wrong_approach', label: t('wrong_approach') },
                                                        ]} />
                                                    <FeedbackSelect label={t('closing')} value={fb.closing_skill || ''}
                                                        onChange={v => handleFeedbackChange(call.id, 'closing_skill', v)}
                                                        options={[
                                                            { value: 'good', label: t('good') },
                                                            { value: 'missed_opportunity', label: t('missed_opportunity') },
                                                            { value: 'too_pushy', label: t('too_pushy') },
                                                        ]} />
                                                </div>

                                                {/* Tags */}
                                                <div>
                                                    <label className="text-xs text-muted-foreground mb-2 block">{t('tags')}</label>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {FEEDBACK_TAGS.map(tag => (
                                                            <button
                                                                key={tag}
                                                                onClick={() => {
                                                                    const current = fb.tags || []
                                                                    const updated = current.includes(tag) 
                                                                        ? current.filter((t: string) => t !== tag)
                                                                        : [...current, tag]
                                                                    handleFeedbackChange(call.id, 'tags', updated)
                                                                }}
                                                                className={cn(
                                                                    "px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors",
                                                                    (fb.tags || []).includes(tag)
                                                                        ? "bg-violet-500/20 border-violet-500/40 text-violet-300"
                                                                        : "border-slate-700 text-slate-500 hover:border-slate-500"
                                                                )}
                                                            >
                                                                {tag.replace(/_/g, ' ')}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Free Comment */}
                                                <div>
                                                    <label className="text-xs text-muted-foreground mb-1 block">{t('comment')}</label>
                                                    <Textarea
                                                        placeholder="Bu aramada neyi farklı yapmalıydı?"
                                                        value={fb.free_comment || ''}
                                                        onChange={e => handleFeedbackChange(call.id, 'free_comment', e.target.value)}
                                                        className="text-xs min-h-[60px]"
                                                    />
                                                </div>

                                                {/* Suggested Response */}
                                                <div>
                                                    <label className="text-xs text-muted-foreground mb-1 block">{t('suggestion')}</label>
                                                    <Textarea
                                                        placeholder="Bu soruya/duruma şöyle yanıt vermeli..."
                                                        value={fb.suggested_response || ''}
                                                        onChange={e => handleFeedbackChange(call.id, 'suggested_response', e.target.value)}
                                                        className="text-xs min-h-[60px]"
                                                    />
                                                </div>

                                                {/* Submit */}
                                                <Button
                                                    onClick={() => handleSubmit(call)}
                                                    disabled={isPending || isSubmitted}
                                                    className="w-full gap-2"
                                                >
                                                    {isSubmitted ? (
                                                        <><CheckCircle2 className="h-4 w-4" /> {t('feedbackSent')}</>
                                                    ) : (
                                                        <><Send className="h-4 w-4" /> {t('submitFeedback')}</>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}


// ─── Analytics Panel ─────────────────────────────────────────

function AnalyticsPanel({ analytics, t }: { analytics: any; t: (k: string) => string }) {
    if (!analytics || analytics.totalFeedbacks === 0) {
        return (
            <Card className="p-12 text-center">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">Henüz yeterli veri yok. Aramaları değerlendirdikçe analiz burada görünecek.</p>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label={t('totalFeedbacks')} value={analytics.totalFeedbacks} icon={MessageSquare} color="violet" />
                <StatCard label={t('avgRating')} value={`${analytics.avgRating}/5`} icon={Star} color="amber" />
                <StatCard label="İyi Ton Oranı" value={`${Math.round(((analytics.toneBreakdown?.appropriate || 0) / analytics.totalFeedbacks) * 100)}%`} icon={ThumbsUp} color="emerald" />
                <StatCard label="Doğru Bilgi" value={`${Math.round(((analytics.accuracyBreakdown?.correct || 0) / analytics.totalFeedbacks) * 100)}%`} icon={CheckCircle2} color="blue" />
            </div>

            {/* Rating Distribution */}
            <Card>
                <CardHeader><CardTitle className="text-sm">Puan Dağılımı</CardTitle></CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {[5, 4, 3, 2, 1].map(n => {
                            const count = analytics.ratingDistribution?.[n] || 0
                            const pct = analytics.totalFeedbacks > 0 ? (count / analytics.totalFeedbacks) * 100 : 0
                            return (
                                <div key={n} className="flex items-center gap-3">
                                    <span className="text-xs font-mono w-8">{n}★</span>
                                    <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className={cn(
                                                "h-full rounded-full transition-all",
                                                n >= 4 ? "bg-emerald-500" : n === 3 ? "bg-amber-500" : "bg-red-500"
                                            )}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                    <span className="text-xs text-muted-foreground w-12 text-right">{count} ({Math.round(pct)}%)</span>
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Top Tags & Issues */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader><CardTitle className="text-sm">{t('topTags')}</CardTitle></CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {analytics.topTags?.map(([tag, count]: [string, number]) => (
                                <Badge key={tag} variant="outline" className="text-xs gap-1">
                                    {tag.replace(/_/g, ' ')} <span className="text-muted-foreground">({count})</span>
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle className="text-sm">Önerilen Yanıtlar</CardTitle></CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {analytics.recentSuggestions?.slice(0, 5).map((s: any, i: number) => (
                                <div key={i} className="text-xs p-3 rounded-lg bg-muted/50 border">
                                    <p className="text-violet-400 mb-1">💡 Öneri:</p>
                                    <p>{s.suggestion}</p>
                                    {s.highlight && <p className="mt-1 text-muted-foreground italic">"{s.highlight}"</p>}
                                </div>
                            ))}
                            {(!analytics.recentSuggestions || analytics.recentSuggestions.length === 0) && (
                                <p className="text-xs text-muted-foreground">Henüz öneri yok</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}


// ─── Prompt Management Panel ─────────────────────────────────

function PromptManagementPanel({ promptVersions, t }: { promptVersions: any[]; t: (k: string) => string }) {
    const [generating, setGenerating] = useState(false)
    const [suggestion, setSuggestion] = useState<{ analysis: string; suggestion: string } | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [promptType, setPromptType] = useState('standard')
    const [isPending, startTransition] = useTransition()

    const handleGenerate = async () => {
        setGenerating(true)
        setError(null)
        const result = await generatePromptSuggestion(promptType)
        if ('error' in result) {
            setError(result.error)
        } else {
            setSuggestion(result)
        }
        setGenerating(false)
    }

    const handleCreateVersion = async () => {
        if (!suggestion) return
        startTransition(async () => {
            await createPromptVersion({
                prompt_type: promptType,
                prompt_content: suggestion.suggestion,
                change_summary: suggestion.analysis.substring(0, 500),
            })
            setSuggestion(null)
            window.location.reload()
        })
    }

    const handleApply = async (id: string) => {
        if (!confirm('Bu prompt versiyonunu aktif yapmak istediğinize emin misiniz?')) return
        startTransition(async () => {
            await applyPromptVersion(id)
            window.location.reload()
        })
    }

    return (
        <div className="space-y-6">
            {/* AI Suggestion Generator */}
            <Card className="border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-purple-500/5">
                <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-violet-400" />
                        {t('generateSuggestion')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Select value={promptType} onValueChange={setPromptType}>
                            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="standard">Standart Arama</SelectItem>
                                <SelectItem value="second_attempt">İkinci Deneme</SelectItem>
                                <SelectItem value="campaign">Kampanya</SelectItem>
                                <SelectItem value="lost_recovery">Kayıp Kazanım</SelectItem>
                                <SelectItem value="voice_rules">Ses Kuralları</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button onClick={handleGenerate} disabled={generating} className="gap-2">
                            {generating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                            {generating ? 'Analiz Ediliyor...' : t('generateSuggestion')}
                        </Button>
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
                            <AlertTriangle className="h-4 w-4 inline mr-2" />{error}
                        </div>
                    )}

                    {suggestion && (
                        <div className="space-y-4">
                            <div className="p-4 rounded-lg bg-muted/50 border">
                                <h4 className="text-xs font-semibold text-violet-400 uppercase mb-2">📊 Analiz</h4>
                                <p className="text-xs leading-relaxed whitespace-pre-wrap">{suggestion.analysis}</p>
                            </div>
                            <div className="p-4 rounded-lg bg-muted/50 border">
                                <h4 className="text-xs font-semibold text-emerald-400 uppercase mb-2">✨ Önerilen Prompt</h4>
                                <pre className="text-xs leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">{suggestion.suggestion}</pre>
                            </div>
                            <Button onClick={handleCreateVersion} disabled={isPending} className="gap-2">
                                <Zap className="h-4 w-4" /> {t('createVersion')}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Existing Versions */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">Prompt Versiyonları</CardTitle>
                </CardHeader>
                <CardContent>
                    {promptVersions.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Henüz versiyon oluşturulmamış. Yukarıdaki AI analiz aracını kullanarak ilk versiyonu oluşturun.</p>
                    ) : (
                        <div className="space-y-3">
                            {promptVersions.map(v => (
                                <div key={v.id} className={cn(
                                    "p-4 rounded-lg border transition-all",
                                    v.is_active ? "ring-1 ring-emerald-500/30 bg-emerald-500/5" : "bg-muted/30"
                                )}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-[10px]">v{v.version}</Badge>
                                            <Badge variant="outline" className="text-[10px] capitalize">{v.prompt_type}</Badge>
                                            {v.is_active && (
                                                <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]">
                                                    <CheckCircle2 className="h-3 w-3 mr-1" /> {t('active')}
                                                </Badge>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-muted-foreground">
                                            {new Date(v.created_at).toLocaleDateString()} — {v.profiles?.full_name || 'Sistem'}
                                        </span>
                                    </div>
                                    {v.change_summary && (
                                        <p className="text-xs text-muted-foreground mb-2">{v.change_summary}</p>
                                    )}
                                    {!v.is_active && (
                                        <Button size="sm" variant="outline" onClick={() => handleApply(v.id)} disabled={isPending} className="gap-1 text-xs">
                                            <CheckCircle2 className="h-3 w-3" /> {t('applyVersion')}
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}


// ─── Sub-components ──────────────────────────────────────────

function FeedbackSelect({ label, value, onChange, options }: {
    label: string; value: string; onChange: (v: string) => void;
    options: { value: string; label: string }[]
}) {
    return (
        <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">{label}</label>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Seçin..." /></SelectTrigger>
                <SelectContent>
                    {options.map(o => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) {
    const colors: Record<string, string> = {
        violet: 'from-violet-500/10 border-violet-500/20 text-violet-400',
        amber: 'from-amber-500/10 border-amber-500/20 text-amber-400',
        emerald: 'from-emerald-500/10 border-emerald-500/20 text-emerald-400',
        blue: 'from-blue-500/10 border-blue-500/20 text-blue-400',
    }
    return (
        <Card className={`bg-gradient-to-br ${colors[color]} border p-4`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-[10px] text-muted-foreground">{label}</p>
                    <p className="text-xl font-bold mt-1">{value}</p>
                </div>
                <Icon className="h-5 w-5 opacity-40" />
            </div>
        </Card>
    )
}
