'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

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

/**
 * Inline profile fields for the customer creation form.
 * Stores tags + profile data as hidden JSON inputs so they travel with the form submission.
 */
export default function InlineProfileFields() {
    const [tags, setTags] = useState<string[]>([])
    const [customTag, setCustomTag] = useState('')
    const [profileData, setProfileData] = useState<Record<string, any>>({})

    const toggleTag = (tag: string) => {
        setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
    }

    const addCustomTag = () => {
        const trimmed = customTag.trim()
        if (!trimmed || tags.includes(trimmed)) return
        setTags(prev => [...prev, trimmed])
        setCustomTag('')
    }

    const updateField = (field: string, value: any) => {
        setProfileData(prev => ({ ...prev, [field]: value }))
    }

    return (
        <div className="space-y-4">
            {/* Hidden inputs to carry data with form submission */}
            <input type="hidden" name="tags_json" value={JSON.stringify(tags)} />
            <input type="hidden" name="profile_data_json" value={JSON.stringify(profileData)} />

            {/* Quick Tags */}
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

                {/* Custom tag */}
                <div className="flex items-center gap-2 pt-1">
                    <Input
                        placeholder="Özel etiket ekle..."
                        value={customTag}
                        onChange={(e) => setCustomTag(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
                        className="h-8 text-xs flex-1 bg-slate-50 border-slate-200 rounded-xl"
                    />
                    <button
                        type="button"
                        onClick={addCustomTag}
                        className="h-8 px-3 text-xs font-bold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
                    >
                        Ekle
                    </button>
                </div>

                {/* Active tags */}
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
            <div className="space-y-3 pt-3 border-t">
                <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Profil Bilgileri</Label>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-slate-400">Meslek</Label>
                        <Input
                            value={profileData.occupation || ''}
                            onChange={(e) => updateField('occupation', e.target.value)}
                            placeholder="Örn: Avukat"
                            className="h-9 text-xs bg-slate-50 border-slate-200 rounded-xl"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-slate-400">Eğitim / Üniversite</Label>
                        <Input
                            value={profileData.education || ''}
                            onChange={(e) => updateField('education', e.target.value)}
                            placeholder="Örn: Boğaziçi Üniversitesi"
                            className="h-9 text-xs bg-slate-50 border-slate-200 rounded-xl"
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
                            <SelectTrigger className="h-9 text-xs bg-slate-50 border-slate-200 rounded-xl"><SelectValue placeholder="Seçin" /></SelectTrigger>
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
                            className="h-9 text-xs bg-slate-50 border-slate-200 rounded-xl"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-slate-400">Yaş Aralığı</Label>
                        <Select
                            value={profileData.age_range || ''}
                            onValueChange={(val) => updateField('age_range', val)}
                        >
                            <SelectTrigger className="h-9 text-xs bg-slate-50 border-slate-200 rounded-xl"><SelectValue placeholder="Seçin" /></SelectTrigger>
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
                            className="h-9 text-xs bg-slate-50 border-slate-200 rounded-xl"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-slate-400">Tuttuğu Takım</Label>
                        <Input
                            value={profileData.team || ''}
                            onChange={(e) => updateField('team', e.target.value)}
                            placeholder="Örn: Fenerbahçe"
                            className="h-9 text-xs bg-slate-50 border-slate-200 rounded-xl"
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
                            <SelectTrigger className="h-9 text-xs bg-slate-50 border-slate-200 rounded-xl"><SelectValue placeholder="Seçin" /></SelectTrigger>
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
                            className="h-9 text-xs bg-slate-50 border-slate-200 rounded-xl"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
