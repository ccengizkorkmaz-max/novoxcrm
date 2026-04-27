import { unstable_noStore as noStore } from 'next/cache'
import { getAgentPublicProfile } from './actions'
import { notFound } from 'next/navigation'
import { ContactForm } from './ContactForm'
import {
    Phone, Mail, MapPin, Instagram, Linkedin, Youtube, Globe,
    Home, Building2, Award, Briefcase, Calendar, ExternalLink, MessageCircle, Star, Shield
} from 'lucide-react'

function formatCurrency(amount: number, currency: string = 'TRY') {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}

const PROPERTY_TYPE_LABELS: Record<string, string> = {
    apartment: 'Daire', villa: 'Villa', land: 'Arsa', commercial: 'Ticari', office: 'Ofis'
}

export default async function AgentPublicPage(props: { params: Promise<{ slug: string }> }) {
    noStore()
    const { slug } = await props.params
    const data = await getAgentPublicProfile(slug)

    if (!data) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)' }}>
                <div className="text-center max-w-md p-8">
                    <div className="h-20 w-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
                        <Building2 className="h-10 w-10 text-slate-500" />
                    </div>
                    <h1 className="text-2xl font-black text-white mb-2">Profil Bulunamadı</h1>
                    <p className="text-sm text-slate-400">
                        <strong className="text-slate-300">/p/{slug}</strong> adresinde yayınlanmış bir danışman profili bulunamadı.
                    </p>
                </div>
            </div>
        )
    }

    const { agent, portfolios, projects, stats } = data
    const initials = agent.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?'

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Hero Section */}
            <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #0f172a 100%)' }}>
                {/* Decorative elements */}
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #3b82f6 0%, transparent 50%), radial-gradient(circle at 80% 50%, #8b5cf6 0%, transparent 50%)' }} />
                <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.02\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />

                <div className="max-w-5xl mx-auto px-4 pt-16 pb-20 relative z-10">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                        {/* Photo */}
                        <div className="flex-shrink-0">
                            <div className="h-32 w-32 md:h-40 md:w-40 rounded-3xl border-4 border-white/10 shadow-2xl overflow-hidden bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
                                {agent.photo ? (
                                    <img src={agent.photo} alt={agent.name} className="h-full w-full object-cover" />
                                ) : (
                                    <span className="text-4xl md:text-5xl font-black text-white/90">{initials}</span>
                                )}
                            </div>
                        </div>

                        {/* Info */}
                        <div className="text-center md:text-left flex-1">
                            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">{agent.name}</h1>
                            <p className="text-blue-300 font-medium mt-1 text-lg">{agent.title || 'Gayrimenkul Danışmanı'}</p>
                            
                            {/* Contact icons */}
                            <div className="flex items-center gap-3 mt-5 justify-center md:justify-start">
                                {agent.phone && (
                                    <a href={`tel:${agent.phone}`} className="h-11 w-11 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center hover:bg-emerald-500/20 hover:border-emerald-400/30 transition-all group" title="Ara">
                                        <Phone className="h-5 w-5 text-slate-300 group-hover:text-emerald-400 transition-colors" />
                                    </a>
                                )}
                                {agent.email && (
                                    <a href={`mailto:${agent.email}`} className="h-11 w-11 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center hover:bg-blue-500/20 hover:border-blue-400/30 transition-all group" title="E-posta">
                                        <Mail className="h-5 w-5 text-slate-300 group-hover:text-blue-400 transition-colors" />
                                    </a>
                                )}
                                {agent.phone && (
                                    <a href={`https://wa.me/${agent.phone.replace(/[\s\-\(\)]/g, '')}`} target="_blank" className="h-11 w-11 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center hover:bg-green-500/20 hover:border-green-400/30 transition-all group" title="WhatsApp">
                                        <MessageCircle className="h-5 w-5 text-slate-300 group-hover:text-green-400 transition-colors" />
                                    </a>
                                )}
                                {(agent.social as any)?.instagram && (
                                    <a href={`https://instagram.com/${(agent.social as any).instagram.replace('@', '')}`} target="_blank" className="h-11 w-11 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center hover:bg-pink-500/20 hover:border-pink-400/30 transition-all group">
                                        <Instagram className="h-5 w-5 text-slate-300 group-hover:text-pink-400 transition-colors" />
                                    </a>
                                )}
                            </div>

                            {/* Stats */}
                            <div className="flex items-center gap-4 mt-6 justify-center md:justify-start">
                                <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                                    <p className="text-xl font-black text-white">{portfolios.length}</p>
                                    <p className="text-[10px] text-slate-400 font-medium">Aktif İlan</p>
                                </div>
                                <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                                    <p className="text-xl font-black text-emerald-400">{stats.totalDeals}</p>
                                    <p className="text-[10px] text-slate-400 font-medium">Tamamlanan</p>
                                </div>
                                {(agent.yearsExperience || 0) > 0 && (
                                    <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                                        <p className="text-xl font-black text-violet-400">{agent.yearsExperience}</p>
                                        <p className="text-[10px] text-slate-400 font-medium">Yıl Deneyim</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 -mt-6 pb-12 space-y-8 relative z-20">
                {/* Bio + Specializations */}
                {(agent.bio || (agent.specializations as any)?.length > 0 || (agent.serviceAreas as any)?.length > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {agent.bio && (
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                                <h2 className="text-sm font-bold mb-3 flex items-center gap-2 text-slate-900">
                                    <Briefcase className="h-4 w-4 text-blue-500" /> Hakkımda
                                </h2>
                                <p className="text-sm text-slate-600 leading-relaxed">{agent.bio}</p>
                            </div>
                        )}
                        <div className="space-y-4">
                            {(agent.specializations as any)?.length > 0 && (
                                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                                    <h2 className="text-sm font-bold mb-3 flex items-center gap-2 text-slate-900">
                                        <Award className="h-4 w-4 text-violet-500" /> Uzmanlık Alanları
                                    </h2>
                                    <div className="flex flex-wrap gap-2">
                                        {(agent.specializations as any).map((s: string) => (
                                            <span key={s} className="px-3 py-1 rounded-full bg-violet-50 text-violet-700 text-xs font-medium border border-violet-100">{s}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {(agent.serviceAreas as any)?.length > 0 && (
                                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                                    <h2 className="text-sm font-bold mb-3 flex items-center gap-2 text-slate-900">
                                        <MapPin className="h-4 w-4 text-emerald-500" /> Hizmet Bölgeleri
                                    </h2>
                                    <div className="flex flex-wrap gap-2">
                                        {(agent.serviceAreas as any).map((a: string) => (
                                            <span key={a} className="px-3 py-1 rounded-full bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200">{a}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Projects */}
                {projects.length > 0 && (
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-blue-500" /> Projeler
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {projects.map((p: any) => (
                                <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-lg transition-all group">
                                    <div className="relative h-40 bg-gradient-to-br from-blue-100 to-violet-100">
                                        {p.cover_image_url ? (
                                            <img src={p.cover_image_url} alt={p.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                        ) : (
                                            <div className="h-full flex items-center justify-center">
                                                <Building2 className="h-12 w-12 text-blue-300" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-bold text-sm text-slate-900">{p.name}</h3>
                                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                            <MapPin className="h-3 w-3" /> {p.district}, {p.city}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Portfolio Grid */}
                {portfolios.length > 0 && (
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Home className="h-5 w-5 text-emerald-500" /> Aktif Portföyler
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {portfolios.map((p: any) => {
                                const coverImage = p.portfolio_images?.find((img: any) => img.is_cover)?.url || p.portfolio_images?.[0]?.url
                                return (
                                    <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-lg transition-all group">
                                        <div className="relative h-48 bg-slate-100">
                                            {coverImage ? (
                                                <img src={coverImage} alt={p.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                            ) : (
                                                <div className="h-full flex items-center justify-center text-slate-300">
                                                    <Home className="h-12 w-12" />
                                                </div>
                                            )}
                                            <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                                                {p.listing_type === 'sale' ? 'Satılık' : 'Kiralık'}
                                            </span>
                                            <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-lg">
                                                <p className="text-sm font-black text-blue-600">{formatCurrency(p.price, p.currency)}</p>
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            <h3 className="text-sm font-bold text-slate-900 mb-1">{p.title || `${PROPERTY_TYPE_LABELS[p.property_type] || p.property_type}`}</h3>
                                            <p className="text-xs text-slate-500 flex items-center gap-1 mb-2">
                                                <MapPin className="h-3 w-3" /> {p.district}, {p.city}
                                            </p>
                                            <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium">
                                                {p.room_count && <span>🛏 {p.room_count}</span>}
                                                {p.area_net && <span>📐 {p.area_net}m²</span>}
                                                {p.floor_number && <span>🏢 {p.floor_number}. kat</span>}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Contact Form */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    <div className="md:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
                        <h2 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
                            <MessageCircle className="h-5 w-5 text-blue-500" /> Bana Ulaşın
                        </h2>
                        <p className="text-sm text-slate-500 mb-6">Gayrimenkul danışmanlığı için iletişime geçin</p>
                        <ContactForm
                            brokerId={agent.id}
                            brokerEmail={agent.email}
                            brokerName={agent.name}
                            tenantId={agent.tenantId}
                        />
                    </div>
                    <div className="md:col-span-2 space-y-4">
                        {/* Quick Contact Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                            <h3 className="text-sm font-bold text-slate-900 mb-4">İletişim Bilgileri</h3>
                            <div className="space-y-3">
                                {agent.phone && (
                                    <a href={`tel:${agent.phone}`} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 transition-colors group">
                                        <div className="h-9 w-9 rounded-lg bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                                            <Phone className="h-4 w-4 text-emerald-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 font-medium">Telefon</p>
                                            <p className="text-sm font-semibold text-slate-700">{agent.phone}</p>
                                        </div>
                                    </a>
                                )}
                                {agent.email && (
                                    <a href={`mailto:${agent.email}`} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-blue-50 transition-colors group">
                                        <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                            <Mail className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 font-medium">E-posta</p>
                                            <p className="text-sm font-semibold text-slate-700">{agent.email}</p>
                                        </div>
                                    </a>
                                )}
                                {agent.phone && (
                                    <a href={`https://wa.me/${agent.phone.replace(/[\s\-\(\)]/g, '')}`} target="_blank" className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-green-50 transition-colors group">
                                        <div className="h-9 w-9 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                                            <MessageCircle className="h-4 w-4 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 font-medium">WhatsApp</p>
                                            <p className="text-sm font-semibold text-green-600">Mesaj Gönder</p>
                                        </div>
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Trust badges */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                            <div className="flex items-center gap-2 mb-3">
                                <Shield className="h-4 w-4 text-blue-500" />
                                <h3 className="text-sm font-bold text-slate-900">Güvenli İletişim</h3>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <Star className="h-3 w-3 text-amber-400" />
                                    <span>Lisanslı Gayrimenkul Danışmanı</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <Shield className="h-3 w-3 text-blue-400" />
                                    <span>Bilgileriniz güvenle korunur</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <Calendar className="h-3 w-3 text-emerald-400" />
                                    <span>Hızlı geri dönüş garantisi</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center pt-6 pb-4 border-t border-slate-100">
                    <p className="text-xs text-slate-400">
                        {agent.name} • {agent.title || 'Gayrimenkul Danışmanı'}
                    </p>
                    <p className="text-[10px] text-slate-300 mt-1">Powered by <span className="font-semibold">Novo CRM</span></p>
                </div>
            </div>
        </div>
    )
}
