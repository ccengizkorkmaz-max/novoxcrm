'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Link } from '@/i18n/routing'
import { updatePortfolioStatus } from '../../actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft, MapPin, Home, Building2, TreePine, Store, Landmark,
    User, Phone, Mail, Calendar, Eye, MessageSquare, Banknote,
    Edit, ExternalLink, Share2, CheckCircle, Clock
} from 'lucide-react'
import { SellerReportWidget } from './SellerReportWidget'
import { PortfolioImageGallery } from './PortfolioImageGallery'
import { DocumentManager } from '@/components/documents/DocumentManager'

interface Props {
    portfolio: any
    agent: any | null
    transactions: any[]
    activities: any[]
    userRole: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    active: { label: 'Aktif', color: 'bg-emerald-600 text-white' },
    pending: { label: 'Onay Bekliyor', color: 'bg-amber-500 text-white' },
    sold: { label: 'Satıldı', color: 'bg-rose-600 text-white' },
    rented: { label: 'Kiralandı', color: 'bg-cyan-600 text-white' },
    withdrawn: { label: 'Geri Çekildi', color: 'bg-slate-500 text-white' },
    expired: { label: 'Süresi Doldu', color: 'bg-red-800 text-white' },
}

const PROPERTY_TYPE_LABELS: Record<string, string> = {
    apartment: 'Daire', villa: 'Villa', land: 'Arsa', commercial: 'Ticari', office: 'Ofis'
}

function formatCurrency(amount: number | null, currency: string = 'TRY') {
    if (!amount) return '-'
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}

export function PortfolioDetailView({ portfolio, agent, transactions, activities, userRole }: Props) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const p = portfolio
    const images = p.portfolio_images?.sort((a: any, b: any) => a.order_index - b.order_index) || []
    const coverImage = images.find((img: any) => img.is_cover) || images[0]
    const statusCfg = STATUS_CONFIG[p.status] || { label: p.status, color: 'bg-slate-400 text-white' }

    const isManager = ['manager', 'admin', 'owner'].includes(userRole)

    // Authorization days remaining
    const authDaysLeft = p.authorization_end
        ? Math.ceil((new Date(p.authorization_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null

    async function handleStatusChange(status: string) {
        setLoading(true)
        try {
            await updatePortfolioStatus(p.id, status)
            toast.success('Portföy durumu güncellendi')
            router.refresh()
        } catch {
            toast.error('Güncelleme başarısız')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto w-full">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link href="/portfolios">
                        <Button variant="ghost" size="icon" className="h-9 w-9">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">{p.title}</h1>
                        <div className="flex items-center gap-2 mt-0.5">
                            <Badge className={cn("text-[10px] border-none font-bold", statusCfg.color)}>{statusCfg.label}</Badge>
                            <Badge variant="outline" className="text-[10px]">
                                {p.listing_type === 'sale' ? 'Satılık' : 'Kiralık'} • {PROPERTY_TYPE_LABELS[p.property_type] || p.property_type}
                            </Badge>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isManager && p.status === 'active' && (
                        <>
                            <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => handleStatusChange('sold')} disabled={loading}>
                                <CheckCircle className="h-3.5 w-3.5" /> Satıldı
                            </Button>
                            <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => handleStatusChange('withdrawn')} disabled={loading}>
                                Geri Çek
                            </Button>
                        </>
                    )}
                    <Link href={`/portfolios/${p.id}/edit`}>
                        <Button variant="outline" size="sm" className="text-xs gap-1.5">
                            <Edit className="h-3.5 w-3.5" /> Düzenle
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Image Gallery with Upload */}
                    <PortfolioImageGallery portfolioId={p.id} images={p.portfolio_images || []} />

                    {/* Details Grid */}
                    <Card className="border shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-bold">Mülk Detayları</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { label: 'Oda Sayısı', value: p.room_count || '-', icon: '🏠' },
                                    { label: 'Brüt m²', value: p.area_gross ? `${p.area_gross} m²` : '-', icon: '📐' },
                                    { label: 'Net m²', value: p.area_net ? `${p.area_net} m²` : '-', icon: '📏' },
                                    { label: 'Bulunduğu Kat', value: p.floor_number != null ? `${p.floor_number}/${p.total_floors || '?'}` : '-', icon: '🏢' },
                                    { label: 'Bina Yaşı', value: p.building_age != null ? `${p.building_age} yıl` : '-', icon: '📅' },
                                    { label: 'Fiyat/m²', value: p.price && p.area_net ? formatCurrency(p.price / p.area_net, p.currency) : '-', icon: '💰' },
                                ].map((item, i) => (
                                    <div key={i} className="p-3 rounded-xl bg-slate-50 border">
                                        <span className="text-lg mb-1 block">{item.icon}</span>
                                        <p className="text-xs font-black text-slate-900">{item.value}</p>
                                        <p className="text-[10px] text-muted-foreground">{item.label}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Amenities / Features */}
                    {p.features && Object.keys(p.features).length > 0 && (
                        <Card className="border shadow-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-bold">Özellikler</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {(() => {
                                        const FEATURE_LABELS: Record<string, { label: string; emoji: string }> = {
                                            balcony: { label: 'Balkon', emoji: '🏗️' },
                                            elevator: { label: 'Asansör', emoji: '🛗' },
                                            parking_indoor: { label: 'Kapalı Otopark', emoji: '🅿️' },
                                            parking_outdoor: { label: 'Açık Otopark', emoji: '🚗' },
                                            security: { label: 'Güvenlik', emoji: '🔒' },
                                            pool: { label: 'Yüzme Havuzu', emoji: '🏊' },
                                            gym: { label: 'Spor Salonu', emoji: '🏋️' },
                                            generator: { label: 'Jeneratör', emoji: '⚡' },
                                            terrace: { label: 'Teras', emoji: '☀️' },
                                            garden: { label: 'Bahçe', emoji: '🌳' },
                                            sea_view: { label: 'Deniz Manzarası', emoji: '🌊' },
                                            city_view: { label: 'Şehir Manzarası', emoji: '🏙️' },
                                            furnished: { label: 'Eşyalı', emoji: '🪑' },
                                            air_conditioning: { label: 'Klima', emoji: '❄️' },
                                            fireplace: { label: 'Şömine', emoji: '🔥' },
                                            storage: { label: 'Depo / Kiler', emoji: '📦' },
                                            smart_home: { label: 'Akıllı Ev', emoji: '🤖' },
                                            fiber_internet: { label: 'Fiber İnternet', emoji: '🌐' },
                                            satellite: { label: 'Uydu / Kablo TV', emoji: '📡' },
                                            disabled_access: { label: 'Engelli Erişimi', emoji: '♿' },
                                        }
                                        const HEATING_LABELS: Record<string, string> = {
                                            central: 'Merkezi Sistem', combi: 'Kombi', floor: 'Yerden Isıtma',
                                            stove: 'Soba', ac: 'Klima', none: 'Yok'
                                        }
                                        const features = p.features as Record<string, any>
                                        const items: JSX.Element[] = []
                                        
                                        if (features.heating && features.heating !== 'none') {
                                            items.push(
                                                <span key="heating" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-xs font-medium text-orange-700">
                                                    🔥 {HEATING_LABELS[features.heating] || features.heating}
                                                </span>
                                            )
                                        }
                                        
                                        Object.entries(features).forEach(([key, val]) => {
                                            if (key === 'heating' || !val) return
                                            const info = FEATURE_LABELS[key]
                                            if (info) {
                                                items.push(
                                                    <span key={key} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-700">
                                                        {info.emoji} {info.label}
                                                    </span>
                                                )
                                            }
                                        })
                                        return items
                                    })()}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Description */}
                    {p.description && (
                        <Card className="border shadow-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-bold">Açıklama</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{p.description}</p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Stats */}
                    <Card className="border shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-bold">İstatistikler</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-center p-3 rounded-xl bg-blue-50 border border-blue-200">
                                    <Eye className="h-4 w-4 mx-auto text-blue-500 mb-1" />
                                    <p className="text-xl font-black text-blue-600">{p.view_count || 0}</p>
                                    <p className="text-[10px] text-blue-500 font-bold">Görüntülenme</p>
                                </div>
                                <div className="text-center p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                                    <MessageSquare className="h-4 w-4 mx-auto text-emerald-500 mb-1" />
                                    <p className="text-xl font-black text-emerald-600">{p.inquiry_count || 0}</p>
                                    <p className="text-[10px] text-emerald-500 font-bold">Sorgu</p>
                                </div>
                                <div className="text-center p-3 rounded-xl bg-violet-50 border border-violet-200">
                                    <Calendar className="h-4 w-4 mx-auto text-violet-500 mb-1" />
                                    <p className="text-xl font-black text-violet-600">{p.showing_count || 0}</p>
                                    <p className="text-[10px] text-violet-500 font-bold">Gezme</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                    {/* Location */}
                    <Card className="border shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-rose-500" /> Konum
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-1.5">
                            {p.city && <p className="text-sm font-medium">{[p.neighborhood, p.district, p.city].filter(Boolean).join(', ')}</p>}
                            {p.address && <p className="text-xs text-muted-foreground">{p.address}</p>}
                            <div className="mt-3 bg-slate-100 rounded-xl p-6 flex items-center justify-center text-xs text-muted-foreground border border-dashed">
                                <MapPin className="h-4 w-4 mr-2" /> Harita yakında
                            </div>
                        </CardContent>
                    </Card>

                    {/* Owner */}
                    <Card className="border shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <User className="h-4 w-4 text-blue-500" /> Ev Sahibi
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {p.owner_name && (
                                <div className="flex items-center gap-2 text-sm">
                                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="font-medium">{p.owner_name}</span>
                                </div>
                            )}
                            {p.owner_phone && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                    <a href={`tel:${p.owner_phone}`} className="text-blue-600 hover:underline">{p.owner_phone}</a>
                                </div>
                            )}
                            {p.owner_email && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span>{p.owner_email}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Authorization */}
                    <Card className="border shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-violet-500" /> Yetkilendirme
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Tür:</span>
                                <Badge variant="outline" className="text-[10px]">
                                    {p.authorization_type === 'exclusive' ? 'Münhasır' : 'Açık Yetki'}
                                </Badge>
                            </div>
                            {p.authorization_start && (
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Başlangıç:</span>
                                    <span className="font-medium">{new Date(p.authorization_start).toLocaleDateString('tr-TR')}</span>
                                </div>
                            )}
                            {p.authorization_end && (
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Bitiş:</span>
                                    <span className={cn("font-bold", authDaysLeft != null && authDaysLeft < 0 ? 'text-red-600' : authDaysLeft != null && authDaysLeft < 30 ? 'text-amber-600' : '')}>
                                        {new Date(p.authorization_end).toLocaleDateString('tr-TR')}
                                    </span>
                                </div>
                            )}
                            {authDaysLeft != null && (
                                <div className={cn(
                                    "mt-2 p-2 rounded-lg text-center text-xs font-bold",
                                    authDaysLeft < 0 ? 'bg-red-50 text-red-600 border border-red-200' :
                                    authDaysLeft < 30 ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                                    'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                )}>
                                    {authDaysLeft < 0 ? `⚠️ Yetki ${Math.abs(authDaysLeft)} gün önce bitti!` :
                                     authDaysLeft === 0 ? '⚠️ Yetki bugün bitiyor!' :
                                     `${authDaysLeft} gün kaldı`}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Assigned Agent */}
                    {agent && (
                        <Card className="border shadow-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <User className="h-4 w-4 text-emerald-500" /> Sorumlu Danışman
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-black text-sm">
                                        {agent.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold">{agent.full_name}</p>
                                        <p className="text-[10px] text-muted-foreground capitalize">{agent.role}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Seller Report */}
                    <SellerReportWidget portfolio={p} />

                    {/* Document Management */}
                    <DocumentManager
                        entityType="portfolio"
                        entityId={p.id}
                        documents={p.documents || []}
                    />

                    {/* Meta */}
                    <Card className="border shadow-sm">
                        <CardContent className="p-4 space-y-1.5">
                            <div className="flex justify-between text-[11px]">
                                <span className="text-muted-foreground">Oluşturulma:</span>
                                <span>{new Date(p.created_at).toLocaleDateString('tr-TR')}</span>
                            </div>
                            <div className="flex justify-between text-[11px]">
                                <span className="text-muted-foreground">Güncelleme:</span>
                                <span>{new Date(p.updated_at).toLocaleDateString('tr-TR')}</span>
                            </div>
                            <div className="flex justify-between text-[11px]">
                                <span className="text-muted-foreground">ID:</span>
                                <span className="font-mono text-[9px] text-muted-foreground">{p.id.slice(0, 8)}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
