'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { updateAgentWebsite } from '../actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
    Globe, Eye, Save, User, Phone, Mail, MapPin,
    Instagram, Linkedin, Youtube, ExternalLink,
    Copy, QrCode, Award, Briefcase, CheckCircle, X, Plus
} from 'lucide-react'

interface Props {
    profile: any
    portfolioCount: number
}

const SPECIALIZATION_OPTIONS = [
    'Konut Satış', 'Konut Kiralama', 'Ticari Gayrimenkul', 'Arsa/Arazi',
    'Yatırım Danışmanlığı', 'Lüks Segment', 'Yeni Projeler', 'İkinci El',
    'Değerleme/Ekspertiz', 'Portföy Yönetimi',
]

export function AgentWebsiteEditor({ profile, portfolioCount }: Props) {
    const router = useRouter()
    const [saving, setSaving] = useState(false)

    const [slug, setSlug] = useState(profile?.agent_slug || '')
    const [title, setTitle] = useState(profile?.agent_title || '')
    const [bio, setBio] = useState(profile?.agent_bio || '')
    const [isPublic, setIsPublic] = useState(profile?.agent_is_public || false)
    const [yearsExp, setYearsExp] = useState(profile?.agent_years_experience || 0)
    const [specializations, setSpecializations] = useState<string[]>(profile?.agent_specializations || [])
    const [serviceAreas, setServiceAreas] = useState<string[]>(profile?.agent_service_areas || [])
    const [certifications, setCertifications] = useState<string[]>(profile?.agent_certifications || [])
    const [social, setSocial] = useState(profile?.agent_social_links || {})
    const [newArea, setNewArea] = useState('')
    const [newCert, setNewCert] = useState('')

    const siteUrl = slug ? `${typeof window !== 'undefined' ? window.location.origin : ''}/p/${slug}` : null

    async function handleSave() {
        setSaving(true)
        try {
            const fd = new FormData()
            fd.set('slug', slug)
            fd.set('title', title)
            fd.set('bio', bio)
            fd.set('is_public', String(isPublic))
            fd.set('years_experience', String(yearsExp))
            fd.set('social_links', JSON.stringify(social))
            fd.set('specializations', JSON.stringify(specializations))
            fd.set('service_areas', JSON.stringify(serviceAreas))
            fd.set('certifications', JSON.stringify(certifications))
            await updateAgentWebsite(fd)
            toast.success('Profil güncellendi!')
            router.refresh()
        } catch (err: any) {
            toast.error(err.message)
        } finally { setSaving(false) }
    }

    return (
        <div className="space-y-6">
            {/* Preview Banner */}
            {isPublic && siteUrl && (
                <Card className="border border-emerald-200 bg-emerald-50/50 shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                                    <Globe className="h-5 w-5 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-emerald-800">Siteniz Yayında! 🎉</p>
                                    <p className="text-[10px] text-emerald-600 font-mono">{siteUrl}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" className="text-[10px] gap-1 border-emerald-300" onClick={() => {
                                    navigator.clipboard.writeText(siteUrl)
                                    toast.success('Link kopyalandı')
                                }}>
                                    <Copy className="h-3 w-3" /> Kopyala
                                </Button>
                                <a href={`/p/${slug}`} target="_blank">
                                    <Button size="sm" className="text-[10px] gap-1 bg-emerald-600 hover:bg-emerald-700">
                                        <Eye className="h-3 w-3" /> Görüntüle
                                    </Button>
                                </a>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Form */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic Info */}
                    <Card className="border shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <User className="h-4 w-4 text-blue-500" />
                                Temel Bilgiler
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs font-bold">Unvan</Label>
                                    <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Gayrimenkul Danışmanı" className="mt-1" />
                                </div>
                                <div>
                                    <Label className="text-xs font-bold">Deneyim (Yıl)</Label>
                                    <Input type="number" value={yearsExp} onChange={e => setYearsExp(Number(e.target.value))} className="mt-1" />
                                </div>
                            </div>
                            <div>
                                <Label className="text-xs font-bold">Site URL Adresi</Label>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-muted-foreground">/p/</span>
                                    <Input value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                                        placeholder="mehmet-yilmaz" className="flex-1" />
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-1">Sadece küçük harf, rakam ve tire kullanın</p>
                            </div>
                            <div>
                                <Label className="text-xs font-bold">Hakkımda</Label>
                                <textarea value={bio} onChange={e => setBio(e.target.value)} rows={4}
                                    className="w-full px-3 py-2 rounded-lg border text-sm resize-none mt-1"
                                    placeholder="Müşterilerinize kendinizi tanıtın..."
                                />
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="rounded accent-emerald-600" />
                                <span className="text-xs font-bold">Web sitesini yayınla (herkes görebilir)</span>
                            </label>
                        </CardContent>
                    </Card>

                    {/* Specializations */}
                    <Card className="border shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Briefcase className="h-4 w-4 text-violet-500" />
                                Uzmanlık Alanları
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {SPECIALIZATION_OPTIONS.map(spec => (
                                    <button key={spec}
                                        onClick={() => {
                                            if (specializations.includes(spec)) setSpecializations(specializations.filter(s => s !== spec))
                                            else setSpecializations([...specializations, spec])
                                        }}
                                        className={cn("px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border",
                                            specializations.includes(spec)
                                                ? "bg-violet-100 text-violet-700 border-violet-300"
                                                : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                                        )}
                                    >
                                        {specializations.includes(spec) && <CheckCircle className="h-3 w-3 inline mr-1" />}
                                        {spec}
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Service Areas & Certifications */}
                    <div className="grid grid-cols-2 gap-4">
                        <Card className="border shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-bold flex items-center gap-1">
                                    <MapPin className="h-3.5 w-3.5 text-emerald-500" /> Hizmet Bölgeleri
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex gap-1.5">
                                    <Input value={newArea} onChange={e => setNewArea(e.target.value)} placeholder="Beşiktaş, İstanbul" className="text-xs h-8" />
                                    <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => {
                                        if (newArea.trim()) { setServiceAreas([...serviceAreas, newArea.trim()]); setNewArea('') }
                                    }}><Plus className="h-3 w-3" /></Button>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {serviceAreas.map((area, i) => (
                                        <Badge key={i} variant="outline" className="text-[9px] gap-1 cursor-pointer" onClick={() => setServiceAreas(serviceAreas.filter((_, j) => j !== i))}>
                                            {area} <X className="h-2.5 w-2.5" />
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-bold flex items-center gap-1">
                                    <Award className="h-3.5 w-3.5 text-amber-500" /> Sertifikalar
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex gap-1.5">
                                    <Input value={newCert} onChange={e => setNewCert(e.target.value)} placeholder="SPK Lisansı" className="text-xs h-8" />
                                    <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => {
                                        if (newCert.trim()) { setCertifications([...certifications, newCert.trim()]); setNewCert('') }
                                    }}><Plus className="h-3 w-3" /></Button>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {certifications.map((cert, i) => (
                                        <Badge key={i} variant="outline" className="text-[9px] gap-1 cursor-pointer" onClick={() => setCertifications(certifications.filter((_, j) => j !== i))}>
                                            {cert} <X className="h-2.5 w-2.5" />
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Social Links */}
                    <Card className="border shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Globe className="h-4 w-4 text-blue-500" />
                                Sosyal Medya
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: '@kullaniciadi' },
                                    { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, placeholder: 'linkedin.com/in/...' },
                                    { key: 'youtube', label: 'YouTube', icon: Youtube, placeholder: 'youtube.com/@...' },
                                    { key: 'website', label: 'Web Sitesi', icon: Globe, placeholder: 'https://...' },
                                ].map(s => (
                                    <div key={s.key}>
                                        <Label className="text-[10px] font-bold flex items-center gap-1">
                                            <s.icon className="h-3 w-3" /> {s.label}
                                        </Label>
                                        <Input
                                            value={social[s.key] || ''}
                                            onChange={e => setSocial({ ...social, [s.key]: e.target.value })}
                                            placeholder={s.placeholder}
                                            className="mt-1 text-xs h-8"
                                        />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Preview & Stats */}
                <div className="space-y-4">
                    {/* Save Button */}
                    <Button onClick={handleSave} disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700 gap-2">
                        <Save className="h-4 w-4" /> {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                    </Button>

                    {/* Preview Card */}
                    <Card className="border shadow-sm overflow-hidden">
                        <div className="h-20 bg-gradient-to-br from-blue-600 via-violet-600 to-emerald-600" />
                        <CardContent className="p-4 -mt-8">
                            <div className="flex items-end gap-3 mb-3">
                                <div className="h-16 w-16 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center text-xl font-black text-blue-600">
                                    {profile?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || '??'}
                                </div>
                                <div className="flex-1 pb-1">
                                    <h3 className="text-sm font-bold">{profile?.full_name}</h3>
                                    <p className="text-[10px] text-muted-foreground">{title || 'Gayrimenkul Danışmanı'}</p>
                                </div>
                            </div>
                            {bio && <p className="text-[10px] text-muted-foreground line-clamp-3 mb-3">{bio}</p>}

                            <div className="grid grid-cols-2 gap-2 mb-3">
                                <div className="p-2 rounded-lg bg-blue-50 text-center">
                                    <p className="text-lg font-black text-blue-600">{portfolioCount}</p>
                                    <p className="text-[9px] text-blue-500 font-bold">Aktif Portföy</p>
                                </div>
                                <div className="p-2 rounded-lg bg-emerald-50 text-center">
                                    <p className="text-lg font-black text-emerald-600">{yearsExp || 0}</p>
                                    <p className="text-[9px] text-emerald-500 font-bold">Yıl Deneyim</p>
                                </div>
                            </div>

                            {specializations.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-2">
                                    {specializations.slice(0, 3).map(s => (
                                        <Badge key={s} variant="outline" className="text-[8px]">{s}</Badge>
                                    ))}
                                </div>
                            )}

                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                {profile?.phone && <Phone className="h-3 w-3" />}
                                {profile?.email && <Mail className="h-3 w-3" />}
                                {social.instagram && <Instagram className="h-3 w-3" />}
                                {social.linkedin && <Linkedin className="h-3 w-3" />}
                            </div>
                        </CardContent>
                    </Card>

                    {/* QR Code placeholder */}
                    {siteUrl && isPublic && (
                        <Card className="border shadow-sm">
                            <CardContent className="p-4 text-center">
                                <QrCode className="h-24 w-24 mx-auto text-slate-300 mb-2" />
                                <p className="text-[10px] text-muted-foreground">QR kodunuzu indirip kartvizitinize ekleyin</p>
                                <p className="text-[9px] font-mono text-blue-600 mt-1 break-all">/p/{slug}</p>
                            </CardContent>
                        </Card>
                    )}

                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                        <p className="text-[10px] text-amber-700 font-medium">
                            💡 <strong>İpucu:</strong> Profilinizi tamamlayın, portföyleriniz otomatik olarak sayfanızda listelenir. Linkinizi müşterilerinizle WhatsApp ve sosyal medyada paylaşın.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
