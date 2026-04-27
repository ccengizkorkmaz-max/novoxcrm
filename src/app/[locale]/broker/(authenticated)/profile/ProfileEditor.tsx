'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Camera, Save, Loader2, ExternalLink, Copy, Check, User } from 'lucide-react'
import toast from 'react-hot-toast'

interface ProfileData {
    id: string
    full_name: string
    email: string
    phone: string
    profile_photo_url: string | null
    agent_title: string | null
    agent_bio: string | null
    slug: string
    agent_social_links: any
    agent_specializations: string[] | null
    agent_service_areas: string[] | null
    company_name?: string
}

export function ProfileEditor({ profile }: { profile: ProfileData }) {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [copied, setCopied] = useState(false)

    const [form, setForm] = useState({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        agent_title: profile.agent_title || '',
        agent_bio: profile.agent_bio || '',
        broker_slug: profile.slug || '',
        profile_photo_url: profile.profile_photo_url || '',
    })

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        const fileExt = file.name.split('.').pop()
        const filePath = `broker-photos/${profile.id}.${fileExt}`

        const { error: uploadError } = await supabase.storage
            .from('crm-images')
            .upload(filePath, file, { upsert: true })

        if (uploadError) {
            toast.error('Fotoğraf yüklenemedi: ' + uploadError.message)
            setUploading(false)
            return
        }

        const { data: { publicUrl } } = supabase.storage
            .from('crm-images')
            .getPublicUrl(filePath)

        // Add cache buster
        const photoUrl = `${publicUrl}?t=${Date.now()}`
        setForm(prev => ({ ...prev, profile_photo_url: photoUrl }))

        // Save immediately
        await supabase.from('profiles').update({ profile_photo_url: photoUrl }).eq('id', profile.id)
        toast.success('Profil fotoğrafı güncellendi!')
        setUploading(false)
        router.refresh()
    }

    const handleSave = async () => {
        setSaving(true)

        // Check slug uniqueness
        if (form.broker_slug) {
            const { data: existing } = await supabase
                .from('profiles')
                .select('id')
                .or(`broker_slug.ilike.${form.broker_slug},agent_slug.ilike.${form.broker_slug}`)
                .neq('id', profile.id)
                .limit(1)

            if (existing && existing.length > 0) {
                toast.error('Bu profil linki başka bir kullanıcı tarafından kullanılıyor. Lütfen farklı bir isim seçin.')
                setSaving(false)
                return
            }
        }

        const { error } = await supabase
            .from('profiles')
            .update({
                full_name: form.full_name,
                phone: form.phone,
                agent_title: form.agent_title,
                agent_bio: form.agent_bio,
                broker_slug: form.broker_slug,
                profile_photo_url: form.profile_photo_url || null,
            })
            .eq('id', profile.id)

        if (error) {
            if (error.code === '23505') {
                toast.error('Bu profil linki zaten alınmış. Lütfen farklı bir isim seçin.')
            } else {
                toast.error('Kayıt başarısız: ' + error.message)
            }
        } else {
            toast.success('Profil bilgileri kaydedildi!')
            router.refresh()
        }
        setSaving(false)
    }

    const profileUrl = form.broker_slug ? `https://www.novoxcrm.com/p/${form.broker_slug}` : ''

    const handleCopyLink = () => {
        if (profileUrl) {
            navigator.clipboard.writeText(profileUrl)
            setCopied(true)
            toast.success('Link panoya kopyalandı!')
            setTimeout(() => setCopied(false), 2000)
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Photo + Slug */}
            <div className="space-y-6">
                {/* Photo Upload */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
                    <div className="relative inline-block">
                        <div className="h-32 w-32 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-100 to-violet-100 mx-auto flex items-center justify-center">
                            {form.profile_photo_url ? (
                                <img src={form.profile_photo_url} alt="Profil" className="h-full w-full object-cover" />
                            ) : (
                                <User className="h-16 w-16 text-blue-300" />
                            )}
                        </div>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="absolute -bottom-2 -right-2 h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors shadow-lg"
                        >
                            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="hidden"
                        />
                    </div>
                    <p className="text-sm font-bold text-slate-900 mt-4">{form.full_name}</p>
                    <p className="text-xs text-slate-500">{form.agent_title || 'Gayrimenkul Danışmanı'}</p>
                    <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">📸 Profil fotoğrafınız paylaşımlı sayfanızda ve kartvizit kartınızda görünür. Profesyonel bir fotoğraf güven oluşturur.</p>
                </div>

                {/* Profile Link */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <h3 className="text-sm font-bold text-slate-900 mb-3">Profil Linki</h3>
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs text-slate-500 font-medium mb-1 block">Slug (URL)</label>
                            <input
                                value={form.broker_slug}
                                onChange={(e) => setForm(prev => ({ ...prev, broker_slug: e.target.value.toLowerCase().replace(/[^a-z0-9\-]/g, '') }))}
                                placeholder="isim-soyisim"
                                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-400"
                            />
                            <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">💡 Bu link müşterilerinize WhatsApp'tan paylaşabileceğiniz kişisel sayfanızdır. Gelen iletişim talepleri <strong>Mesajlarım</strong>'a düşer.</p>
                        </div>
                        {profileUrl && (
                            <div className="bg-slate-50 rounded-xl p-3">
                                <p className="text-[10px] text-slate-400 font-medium mb-1">Paylaşılabilir Link</p>
                                <div className="flex items-center gap-2">
                                    <p className="text-xs text-blue-600 font-medium truncate flex-1">{profileUrl}</p>
                                    <button onClick={handleCopyLink} className="h-8 w-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-blue-50 transition-colors">
                                        {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
                                    </button>
                                    <a href={profileUrl} target="_blank" className="h-8 w-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-blue-50 transition-colors">
                                        <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right: Profile Fields */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="text-sm font-bold text-slate-900 mb-5">Profil Bilgileri</h3>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Ad Soyad</label>
                            <input
                                value={form.full_name}
                                onChange={(e) => setForm(prev => ({ ...prev, full_name: e.target.value }))}
                                className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Telefon</label>
                            <input
                                value={form.phone}
                                onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                                placeholder="+90 555 123 45 67"
                                className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                            />
                            <p className="text-[10px] text-slate-400 mt-1">📞 Paylaşım sayfanızda "Ara" ve "WhatsApp" butonları bu numarayla oluşturulur.</p>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">E-posta</label>
                        <input
                            value={profile.email}
                            disabled
                            className="w-full h-11 px-4 rounded-xl border border-slate-100 bg-slate-50 text-sm text-slate-400"
                        />
                    </div>
                    {profile.company_name && (
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Firma</label>
                            <input
                                value={profile.company_name}
                                disabled
                                className="w-full h-11 px-4 rounded-xl border border-slate-100 bg-slate-50 text-sm text-slate-400"
                            />
                            <p className="text-[10px] text-slate-400 mt-1">🏢 CRM broker başvurunuzdan alınan firma bilgisi. Değiştirmek için yöneticinize başvurun.</p>
                        </div>
                    )}
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Unvan</label>
                        <input
                            value={form.agent_title}
                            onChange={(e) => setForm(prev => ({ ...prev, agent_title: e.target.value }))}  
                            placeholder="Gayrimenkul Danışmanı"
                            className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">🏷️ Profil sayfanızda adınızın altında görünür. Örn: "Kıdemli Gayrimenkul Danışmanı"</p>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Hakkımda</label>
                        <textarea
                            value={form.agent_bio}
                            onChange={(e) => setForm(prev => ({ ...prev, agent_bio: e.target.value }))}
                            rows={4}
                            placeholder="Kendinizi tanıtın..."
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 resize-none"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">✍️ Deneyiminizi ve uzmanlık alanlarınızı kısaca anlatın. Bu metin profil sayfanızda "Hakkımda" bölümünde görünecektir.</p>
                    </div>

                    <div className="pt-2">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="h-12 px-8 rounded-xl font-bold text-white text-sm flex items-center gap-2 transition-all disabled:opacity-60"
                            style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
                        >
                            {saving ? (
                                <><Loader2 className="h-4 w-4 animate-spin" /> Kaydediliyor...</>
                            ) : (
                                <><Save className="h-4 w-4" /> Değişiklikleri Kaydet</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
