'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { updateCustomerProfile, parseCustomerNote } from '../actions'
import { Loader2, Sparkles, Send, ClipboardList } from 'lucide-react'
import { cn } from '@/lib/utils'

// Preset tag categories
const TAG_CATEGORIES = [
    {
        label: '💰 Segment',
        tags: ['Premium', 'Orta-Üst', 'Orta', 'Ekonomik']
    },
    {
        label: '🎯 Amaç',
        tags: ['Yatırımcı', 'Oturum', 'Tatil', 'Çocuk İçin']
    },
    {
        label: '👨‍👩‍👧‍👦 Aile',
        tags: ['Aile', 'Bekar', 'Çift']
    },
    {
        label: '💳 Ödeme',
        tags: ['Nakit', 'Kredi', 'Taksit', 'Takas']
    },
    {
        label: '🏢 Meslek',
        tags: ['Doktor', 'Avukat', 'Mühendis', 'İşadamı', 'Memur', 'Emekli', 'Serbest Meslek']
    },
    {
        label: '🚗 Araç',
        tags: ['SUV', 'Lüks Sedan', 'Ekonomik Araç', 'Araç Yok']
    }
]

interface CustomerProfileTabProps {
    customerId: string
    initialTags: string[]
    initialProfileData: Record<string, any>
    onClose?: () => void
    surveys?: { id: string; title: string }[]
    sentSurveys?: { id: string; template_id: string; status: string; sent_at: string; template_title?: string }[]
    onSendSurvey?: (templateId: string) => void
}

export default function CustomerProfileTab({
    customerId,
    initialTags,
    initialProfileData,
    onClose,
    surveys = [],
    sentSurveys = [],
    onSendSurvey
}: CustomerProfileTabProps) {
    const [tags, setTags] = useState<string[]>(initialTags || [])
    const [profileData, setProfileData] = useState<Record<string, any>>(initialProfileData || {})
    const [aiNote, setAiNote] = useState('')
    const [isPending, startTransition] = useTransition()
    const [isParsing, setIsParsing] = useState(false)
    const [customTag, setCustomTag] = useState('')

    const toggleTag = (tag: string) => {
        const newTags = tags.includes(tag)
            ? tags.filter(t => t !== tag)
            : [...tags, tag]
        setTags(newTags)
        // Auto-save tags immediately
        startTransition(async () => {
            const res = await updateCustomerProfile(customerId, profileData, newTags)
            if (res?.error) toast.error(res.error)
        })
    }

    const addCustomTag = () => {
        const trimmed = customTag.trim()
        if (!trimmed || tags.includes(trimmed)) return
        const newTags = [...tags, trimmed]
        setTags(newTags)
        setCustomTag('')
        startTransition(async () => {
            const res = await updateCustomerProfile(customerId, profileData, newTags)
            if (res?.error) toast.error(res.error)
        })
    }

    const updateField = (field: string, value: any) => {
        setProfileData(prev => ({ ...prev, [field]: value }))
    }

    const saveProfile = () => {
        startTransition(async () => {
            const res = await updateCustomerProfile(customerId, profileData, tags)
            if (res?.error) {
                toast.error(res.error)
            } else {
                toast.success('Profil güncellendi.')
            }
        })
    }

    const handleAiParse = async () => {
        if (!aiNote.trim()) {
            toast.error('Lütfen bir not giriniz.')
            return
        }
        setIsParsing(true)
        try {
            const result = await parseCustomerNote(customerId, aiNote)
            if (result?.error) {
                toast.error(result.error)
            } else if (result?.parsed) {
                // Merge parsed data
                const newProfileData = { ...profileData, ...result.parsed.profile_data, notes_ai: aiNote }
                const newTags = [...new Set([...tags, ...(result.parsed.tags || [])])]
                setProfileData(newProfileData)
                setTags(newTags)
                setAiNote('')
                toast.success(`AI ${result.parsed.tags?.length || 0} etiket ve profil bilgisi çıkardı.`)
            }
        } catch (err) {
            toast.error('AI analiz hatası.')
        } finally {
            setIsParsing(false)
        }
    }

    return (
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-5">
            {/* Quick Tags Section */}
            <div className="space-y-3">
                <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Hızlı Etiketler</Label>
                {TAG_CATEGORIES.map(category => (
                    <div key={category.label} className="space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400">{category.label}</span>
                        <div className="flex flex-wrap gap-1.5">
                            {category.tags.map(tag => {
                                const isActive = tags.includes(tag)
                                return (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => toggleTag(tag)}
                                        className={cn(
                                            "px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border",
                                            isActive
                                                ? "bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-200"
                                                : "bg-white text-slate-500 border-slate-200 hover:border-amber-300 hover:text-amber-600"
                                        )}
                                    >
                                        {tag}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                ))}

                {/* Custom tag input */}
                <div className="flex items-center gap-2 pt-1">
                    <Input
                        placeholder="Özel etiket ekle..."
                        value={customTag}
                        onChange={(e) => setCustomTag(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
                        className="h-8 text-xs flex-1"
                    />
                    <Button type="button" size="sm" variant="outline" className="h-8 text-xs" onClick={addCustomTag}>
                        Ekle
                    </Button>
                </div>

                {/* Active tags display */}
                {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                        {tags.map(tag => (
                            <Badge
                                key={tag}
                                variant="secondary"
                                className="text-[10px] px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 cursor-pointer hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                                onClick={() => toggleTag(tag)}
                                title="Kaldırmak için tıkla"
                            >
                                {tag} ×
                            </Badge>
                        ))}
                    </div>
                )}
            </div>

            {/* Profile Data Fields */}
            <div className="space-y-3 pt-2 border-t">
                <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Profil Bilgileri</Label>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-slate-400">Meslek</Label>
                        <Input
                            value={profileData.occupation || ''}
                            onChange={(e) => updateField('occupation', e.target.value)}
                            placeholder="Örn: Avukat"
                            className="h-8 text-xs"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-slate-400">Eğitim / Üniversite</Label>
                        <Input
                            value={profileData.education || ''}
                            onChange={(e) => updateField('education', e.target.value)}
                            placeholder="Örn: Boğaziçi Üniversitesi"
                            className="h-8 text-xs"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-slate-400">Medeni Hal</Label>
                        <Select
                            value={profileData.marital_status || ''}
                            onValueChange={(val) => updateField('marital_status', val)}
                        >
                            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Seçin" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="married">Evli</SelectItem>
                                <SelectItem value="single">Bekar</SelectItem>
                                <SelectItem value="divorced">Boşanmış</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-slate-400">Çocuk Sayısı</Label>
                        <Input
                            type="number"
                            min={0}
                            value={profileData.children_count ?? ''}
                            onChange={(e) => updateField('children_count', e.target.value ? parseInt(e.target.value) : null)}
                            className="h-8 text-xs"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-slate-400">Yaş Aralığı</Label>
                        <Select
                            value={profileData.age_range || ''}
                            onValueChange={(val) => updateField('age_range', val)}
                        >
                            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Seçin" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="18-25">18-25</SelectItem>
                                <SelectItem value="25-35">25-35</SelectItem>
                                <SelectItem value="35-45">35-45</SelectItem>
                                <SelectItem value="45-55">45-55</SelectItem>
                                <SelectItem value="55-65">55-65</SelectItem>
                                <SelectItem value="65+">65+</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-slate-400">Araç Marka/Model</Label>
                        <Input
                            value={profileData.vehicle_info || ''}
                            onChange={(e) => updateField('vehicle_info', e.target.value)}
                            placeholder="Örn: BMW X5"
                            className="h-8 text-xs"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-slate-400">Tuttuğu Takım</Label>
                        <Input
                            value={profileData.team || ''}
                            onChange={(e) => updateField('team', e.target.value)}
                            placeholder="Örn: Fenerbahçe"
                            className="h-8 text-xs"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-slate-400">Gelir Segmenti</Label>
                        <Select
                            value={profileData.income_segment || ''}
                            onValueChange={(val) => updateField('income_segment', val)}
                        >
                            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Seçin" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="A+">A+ (Ultra Premium)</SelectItem>
                                <SelectItem value="A">A (Premium)</SelectItem>
                                <SelectItem value="B+">B+ (Orta-Üst)</SelectItem>
                                <SelectItem value="B">B (Orta)</SelectItem>
                                <SelectItem value="C">C (Ekonomik)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-slate-400">Hobiler</Label>
                        <Input
                            value={profileData.hobbies || ''}
                            onChange={(e) => updateField('hobbies', e.target.value)}
                            placeholder="Örn: golf, yüzme, tenis"
                            className="h-8 text-xs"
                        />
                    </div>
                </div>

                <Button
                    type="button"
                    onClick={saveProfile}
                    disabled={isPending}
                    className="w-full h-9 text-xs font-bold bg-blue-600 hover:bg-blue-700"
                >
                    {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : null}
                    Profil Bilgilerini Kaydet
                </Button>
            </div>

            {/* AI Note Parse Section */}
            <div className="space-y-2 pt-2 border-t">
                <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                    AI Profil Notu
                </Label>
                <p className="text-[10px] text-slate-400">
                    Müşteri hakkında serbest metin girin. AI otomatik olarak etiket ve profil bilgisi çıkaracaktır.
                </p>
                <Textarea
                    value={aiNote}
                    onChange={(e) => setAiNote(e.target.value)}
                    placeholder="Örn: Ahmet Bey BMW X5 ile geldi, eşi ve 2 çocuğuyla birlikte baktılar. Boğaziçi mezunu, avukat. Fenerbahçeli. Nakit ödeme yapabilir, yatırım amaçlı bakıyor..."
                    className="text-xs min-h-[80px] resize-none"
                />
                <Button
                    type="button"
                    onClick={handleAiParse}
                    disabled={isParsing || !aiNote.trim()}
                    variant="outline"
                    className="w-full h-9 text-xs font-bold border-violet-200 text-violet-600 hover:bg-violet-50"
                >
                    {isParsing ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                    ) : (
                        <Sparkles className="h-3.5 w-3.5 mr-2" />
                    )}
                    AI ile Analiz Et
                </Button>

                {/* Show AI-extracted notes if present */}
                {profileData.notes_ai && (
                    <div className="p-3 bg-violet-50 rounded-lg border border-violet-100">
                        <p className="text-[10px] font-bold text-violet-500 uppercase tracking-widest mb-1">Son AI Notu</p>
                        <p className="text-xs text-violet-700">{profileData.notes_ai}</p>
                    </div>
                )}
            </div>

            {/* Survey Section */}
            {(surveys.length > 0 || sentSurveys.length > 0) && (
                <div className="space-y-2 pt-2 border-t">
                    <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        <ClipboardList className="h-3.5 w-3.5 text-blue-500" />
                        Anket Gönder
                    </Label>

                    {surveys.length > 0 && onSendSurvey && (
                        <div className="flex flex-wrap gap-2">
                            {surveys.map(s => (
                                <Button
                                    key={s.id}
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-[11px] font-bold border-blue-200 text-blue-600 hover:bg-blue-50 gap-1.5"
                                    onClick={() => onSendSurvey(s.id)}
                                >
                                    <Send className="h-3 w-3" />
                                    {s.title}
                                </Button>
                            ))}
                        </div>
                    )}

                    {sentSurveys.length > 0 && (
                        <div className="space-y-1.5">
                            <p className="text-[10px] font-bold text-slate-400">Gönderilmiş Anketler</p>
                            {sentSurveys.map(sr => (
                                <div key={sr.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border text-xs">
                                    <span className="font-medium text-slate-700">{sr.template_title || 'Anket'}</span>
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            "text-[9px] px-1.5 py-0",
                                            sr.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                            sr.status === 'expired' ? 'bg-red-50 text-red-600 border-red-200' :
                                            'bg-amber-50 text-amber-600 border-amber-200'
                                        )}
                                    >
                                        {sr.status === 'completed' ? 'Yanıtlandı' : sr.status === 'expired' ? 'Süresi Doldu' : 'Bekliyor'}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
