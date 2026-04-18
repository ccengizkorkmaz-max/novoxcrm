import { getAgentPublicProfile } from '../../(dashboard)/agent-website/actions'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
    Phone, Mail, MapPin, Instagram, Linkedin, Youtube, Globe,
    Home, Building2, Award, Briefcase, Calendar, ExternalLink
} from 'lucide-react'

function formatCurrency(amount: number, currency: string = 'TRY') {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}

const PROPERTY_TYPE_LABELS: Record<string, string> = {
    apartment: 'Daire', villa: 'Villa', land: 'Arsa', commercial: 'Ticari', office: 'Ofis'
}

export default async function AgentPublicPage(props: { params: Promise<{ slug: string }> }) {
    const { slug } = await props.params
    const data = await getAgentPublicProfile(slug)

    if (!data) notFound()

    const { agent, portfolios, stats } = data

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Hero */}
            <div className="relative">
                <div className="h-48 md:h-64 bg-gradient-to-br from-blue-700 via-violet-700 to-emerald-600" />
                <div className="max-w-5xl mx-auto px-4 -mt-16 relative z-10">
                    <div className="flex items-end gap-4">
                        <div className="h-28 w-28 rounded-2xl bg-white border-4 border-white shadow-xl flex items-center justify-center text-3xl font-black text-blue-600">
                            {agent.photo ? (
                                <img src={agent.photo} alt={agent.name} className="h-full w-full rounded-2xl object-cover" />
                            ) : (
                                agent.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)
                            )}
                        </div>
                        <div className="pb-2">
                            <h1 className="text-2xl font-black text-slate-900">{agent.name}</h1>
                            <p className="text-sm text-muted-foreground">{agent.title || 'Gayrimenkul Danışmanı'}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
                {/* Stats & Contact Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="border-none shadow-sm text-center">
                        <CardContent className="p-4">
                            <p className="text-2xl font-black text-blue-600">{portfolios.length}</p>
                            <p className="text-xs text-muted-foreground">Aktif İlan</p>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm text-center">
                        <CardContent className="p-4">
                            <p className="text-2xl font-black text-emerald-600">{stats.totalDeals}</p>
                            <p className="text-xs text-muted-foreground">Tamamlanan İşlem</p>
                        </CardContent>
                    </Card>
                    {agent.yearsExperience > 0 && (
                        <Card className="border-none shadow-sm text-center">
                            <CardContent className="p-4">
                                <p className="text-2xl font-black text-violet-600">{agent.yearsExperience}</p>
                                <p className="text-xs text-muted-foreground">Yıl Deneyim</p>
                            </CardContent>
                        </Card>
                    )}
                    <Card className="border-none shadow-sm">
                        <CardContent className="p-4 flex flex-col items-center gap-2">
                            <div className="flex items-center gap-3">
                                {agent.phone && (
                                    <a href={`tel:${agent.phone}`} className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center hover:bg-emerald-200 transition-colors">
                                        <Phone className="h-5 w-5 text-emerald-600" />
                                    </a>
                                )}
                                {agent.email && (
                                    <a href={`mailto:${agent.email}`} className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center hover:bg-blue-200 transition-colors">
                                        <Mail className="h-5 w-5 text-blue-600" />
                                    </a>
                                )}
                                {agent.social?.instagram && (
                                    <a href={`https://instagram.com/${agent.social.instagram.replace('@', '')}`} target="_blank" className="h-10 w-10 rounded-xl bg-pink-100 flex items-center justify-center hover:bg-pink-200 transition-colors">
                                        <Instagram className="h-5 w-5 text-pink-600" />
                                    </a>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">İletişim</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Bio + Specializations */}
                {(agent.bio || agent.specializations?.length > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {agent.bio && (
                            <Card className="border-none shadow-sm">
                                <CardContent className="p-6">
                                    <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
                                        <Briefcase className="h-4 w-4 text-blue-500" /> Hakkımda
                                    </h2>
                                    <p className="text-sm text-muted-foreground leading-relaxed">{agent.bio}</p>
                                </CardContent>
                            </Card>
                        )}
                        <div className="space-y-4">
                            {agent.specializations?.length > 0 && (
                                <Card className="border-none shadow-sm">
                                    <CardContent className="p-6">
                                        <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
                                            <Award className="h-4 w-4 text-violet-500" /> Uzmanlık Alanları
                                        </h2>
                                        <div className="flex flex-wrap gap-2">
                                            {agent.specializations.map((s: string) => (
                                                <Badge key={s} className="bg-violet-100 text-violet-700 border-violet-200 text-xs">{s}</Badge>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                            {agent.serviceAreas?.length > 0 && (
                                <Card className="border-none shadow-sm">
                                    <CardContent className="p-6">
                                        <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-emerald-500" /> Hizmet Bölgeleri
                                        </h2>
                                        <div className="flex flex-wrap gap-2">
                                            {agent.serviceAreas.map((a: string) => (
                                                <Badge key={a} variant="outline" className="text-xs">{a}</Badge>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                )}

                {/* Portfolio Grid */}
                {portfolios.length > 0 && (
                    <div>
                        <h2 className="text-lg font-bold mb-4">📍 Aktif Portföyler</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {portfolios.map((p: any) => {
                                const coverImage = p.portfolio_images?.find((img: any) => img.is_cover)?.url || p.portfolio_images?.[0]?.url
                                return (
                                    <Card key={p.id} className="border-none shadow-sm overflow-hidden hover:shadow-lg transition-all group">
                                        <div className="relative h-48 bg-slate-200">
                                            {coverImage ? (
                                                <img src={coverImage} alt={p.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                            ) : (
                                                <div className="h-full flex items-center justify-center text-slate-400">
                                                    <Home className="h-12 w-12" />
                                                </div>
                                            )}
                                            <Badge className="absolute top-3 left-3 bg-blue-600 text-white text-[10px]">
                                                {p.listing_type === 'sale' ? 'Satılık' : 'Kiralık'}
                                            </Badge>
                                            <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-lg">
                                                <p className="text-sm font-black text-blue-600">{formatCurrency(p.price, p.currency)}</p>
                                            </div>
                                        </div>
                                        <CardContent className="p-4">
                                            <h3 className="text-sm font-bold mb-1">{p.title || `${PROPERTY_TYPE_LABELS[p.property_type] || p.property_type}`}</h3>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                                                <MapPin className="h-3 w-3" /> {p.district}, {p.city}
                                            </p>
                                            <div className="flex items-center gap-3 text-[10px] text-slate-500">
                                                {p.room_count && <span>🛏 {p.room_count}</span>}
                                                {p.area_net && <span>📐 {p.area_net}m²</span>}
                                                {p.floor && <span>🏢 {p.floor}. kat</span>}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="text-center pt-8 pb-4 border-t">
                    <p className="text-xs text-muted-foreground">
                        {agent.name} • {agent.title || 'Gayrimenkul Danışmanı'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">Powered by NOVOCRM</p>
                </div>
            </div>
        </div>
    )
}
