'use client'

import { useState } from 'react'
import { Copy, Check, Share2, MessageCircle, ExternalLink, Building2, Link2, User, QrCode } from 'lucide-react'
import toast from 'react-hot-toast'

interface Project {
    id: string
    name: string
    city: string
    district: string
    cover_image_url: string | null
}

interface SharingToolsProps {
    brokerName: string
    brokerSlug: string
    brokerPhone: string
    brokerEmail: string
    projects: Project[]
}

export function SharingTools({ brokerName, brokerSlug, brokerPhone, brokerEmail, projects }: SharingToolsProps) {
    const [copiedId, setCopiedId] = useState<string | null>(null)

    const baseUrl = 'https://www.novoxcrm.com'
    const profileUrl = brokerSlug ? `${baseUrl}/p/${brokerSlug}` : ''

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text)
        setCopiedId(id)
        toast.success('Panoya kopyalandı!')
        setTimeout(() => setCopiedId(null), 2000)
    }

    const shareViaWhatsApp = (text: string) => {
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
    }

    // Pre-built messages
    const profileShareMsg = `Merhaba! 👋\n\nBen ${brokerName}, gayrimenkul danışmanınız.\nPortföyüme ve iletişim bilgilerime aşağıdaki linkten ulaşabilirsiniz:\n\n🔗 ${profileUrl}\n\n📞 ${brokerPhone}`

    const leadFormMsg = `Merhaba! 🏠\n\nGayrimenkul ile ilgileniyorsanız, size en uygun seçenekleri sunmak isterim.\n\nAşağıdaki formu doldurarak bilgilerinizi bana iletebilirsiniz:\n\n📋 ${profileUrl}\n\nBen ${brokerName}, her konuda yardımcı olmaktan memnuniyet duyarım! 🤝`

    return (
        <div className="space-y-6">
            {/* Profile Link Card */}
            {profileUrl && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                            <Link2 className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">Profil Linkim</h3>
                            <p className="text-xs text-slate-500">Müşterilerinize paylaşın</p>
                        </div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-3 mb-4">
                        <p className="text-sm text-blue-600 font-medium flex-1 truncate">{profileUrl}</p>
                        <button onClick={() => copyToClipboard(profileUrl, 'profile-link')} className="h-9 px-3 rounded-lg bg-white border border-slate-200 flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:bg-blue-50 transition-colors">
                            {copiedId === 'profile-link' ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                            {copiedId === 'profile-link' ? 'Kopyalandı' : 'Kopyala'}
                        </button>
                        <a href={profileUrl} target="_blank" className="h-9 w-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-blue-50 transition-colors">
                            <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                        </a>
                    </div>
                </div>
            )}

            {/* WhatsApp Ready Messages */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Profile Share */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center">
                            <MessageCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">Profil Tanıtım Mesajı</h3>
                            <p className="text-xs text-slate-500">WhatsApp'tan kendinizi tanıtın</p>
                        </div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 mb-4">
                        <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">{profileShareMsg}</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => copyToClipboard(profileShareMsg, 'profile-msg')} className="flex-1 h-10 rounded-xl bg-slate-100 flex items-center justify-center gap-2 text-xs font-medium text-slate-600 hover:bg-slate-200 transition-colors">
                            {copiedId === 'profile-msg' ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                            Kopyala
                        </button>
                        <button onClick={() => shareViaWhatsApp(profileShareMsg)} className="flex-1 h-10 rounded-xl bg-green-600 flex items-center justify-center gap-2 text-xs font-bold text-white hover:bg-green-700 transition-colors">
                            <MessageCircle className="h-3.5 w-3.5" />
                            WhatsApp'la Paylaş
                        </button>
                    </div>
                </div>

                {/* Lead Collection */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center">
                            <User className="h-5 w-5 text-violet-600" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">Lead Toplama Mesajı</h3>
                            <p className="text-xs text-slate-500">Potansiyel müşterilerinize gönderin</p>
                        </div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 mb-4">
                        <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">{leadFormMsg}</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => copyToClipboard(leadFormMsg, 'lead-msg')} className="flex-1 h-10 rounded-xl bg-slate-100 flex items-center justify-center gap-2 text-xs font-medium text-slate-600 hover:bg-slate-200 transition-colors">
                            {copiedId === 'lead-msg' ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                            Kopyala
                        </button>
                        <button onClick={() => shareViaWhatsApp(leadFormMsg)} className="flex-1 h-10 rounded-xl bg-green-600 flex items-center justify-center gap-2 text-xs font-bold text-white hover:bg-green-700 transition-colors">
                            <MessageCircle className="h-3.5 w-3.5" />
                            WhatsApp'la Paylaş
                        </button>
                    </div>
                </div>
            </div>

            {/* Project Cards */}
            {projects.length > 0 && (
                <div>
                    <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-blue-500" /> Proje Tanıtım Kartları
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {projects.map((project) => {
                            const projectMsg = `🏗️ *${project.name}*\n📍 ${project.district}, ${project.city}\n\n🔗 Detaylar ve iletişim: ${profileUrl}\n\n👤 ${brokerName}\n📞 ${brokerPhone}`

                            return (
                                <div key={project.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                                    <div className="h-32 bg-gradient-to-br from-blue-100 to-violet-100">
                                        {project.cover_image_url ? (
                                            <img src={project.cover_image_url} alt={project.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="h-full flex items-center justify-center">
                                                <Building2 className="h-10 w-10 text-blue-300" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <h3 className="text-sm font-bold text-slate-900">{project.name}</h3>
                                        <p className="text-xs text-slate-500 mb-3">{project.district}, {project.city}</p>
                                        <div className="flex gap-2">
                                            <button onClick={() => copyToClipboard(projectMsg, `proj-${project.id}`)} className="flex-1 h-9 rounded-lg bg-slate-100 flex items-center justify-center gap-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-200 transition-colors">
                                                {copiedId === `proj-${project.id}` ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                                                Kopyala
                                            </button>
                                            <button onClick={() => shareViaWhatsApp(projectMsg)} className="flex-1 h-9 rounded-lg bg-green-600 flex items-center justify-center gap-1.5 text-[11px] font-bold text-white hover:bg-green-700 transition-colors">
                                                <MessageCircle className="h-3 w-3" />
                                                Paylaş
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {!profileUrl && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
                    <p className="text-sm text-amber-800 font-medium">
                        ⚠️ Paylaşım araçlarını kullanabilmek için önce <strong>Profilim</strong> sayfasından bir profil slug'ı belirleyin.
                    </p>
                </div>
            )}
        </div>
    )
}
