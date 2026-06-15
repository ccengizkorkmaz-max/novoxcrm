'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import {
    Plus, Search, MoreHorizontal, Eye, Edit, Trash2,
    MapPin, Home, Building2, Landmark, Store, TreePine,
    Grid3X3, List, SlidersHorizontal
} from 'lucide-react'
import { NewPortfolioDialog } from './NewPortfolioDialog'
import { updatePortfolioStatus, deletePortfolio } from '../actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Link } from '@/i18n/routing'

interface PortfolioListProps {
    portfolios: any[]
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

const PROPERTY_TYPE_CONFIG: Record<string, { label: string; icon: any }> = {
    apartment: { label: 'Daire', icon: Building2 },
    villa: { label: 'Villa', icon: Home },
    land: { label: 'Arsa', icon: TreePine },
    commercial: { label: 'Ticari', icon: Store },
    office: { label: 'Ofis', icon: Landmark },
}

const LISTING_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
    sale: { label: 'Satılık', color: 'text-blue-600 bg-blue-50 border-blue-200' },
    rent: { label: 'Kiralık', color: 'text-violet-600 bg-violet-50 border-violet-200' },
}

function formatPrice(price: number | null, currency: string = 'TRY') {
    if (!price) return '-'
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(price)
}

export function PortfolioList({ portfolios, userRole }: PortfolioListProps) {
    const router = useRouter()
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [typeFilter, setTypeFilter] = useState<string>('all')
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
    const [showNewDialog, setShowNewDialog] = useState(false)

    const isManager = ['manager', 'admin', 'owner', 'crm_manager'].includes(userRole)

    // Filter portfolios
    const filtered = portfolios.filter(p => {
        if (statusFilter !== 'all' && p.status !== statusFilter) return false
        if (typeFilter !== 'all' && p.property_type !== typeFilter) return false
        if (searchQuery) {
            const q = searchQuery.toLowerCase()
            return (
                p.title?.toLowerCase().includes(q) ||
                p.city?.toLowerCase().includes(q) ||
                p.district?.toLowerCase().includes(q) ||
                p.owner_name?.toLowerCase().includes(q)
            )
        }
        return true
    })

    // Stats
    const stats = {
        total: portfolios.length,
        active: portfolios.filter(p => p.status === 'active').length,
        sold: portfolios.filter(p => p.status === 'sold').length,
        rented: portfolios.filter(p => p.status === 'rented').length,
    }

    async function handleStatusChange(id: string, newStatus: string) {
        try {
            await updatePortfolioStatus(id, newStatus)
            toast.success('Portföy durumu güncellendi')
            router.refresh()
        } catch {
            toast.error('Güncelleme başarısız')
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Bu portföyü silmek istediğinize emin misiniz?')) return
        try {
            await deletePortfolio(id)
            toast.success('Portföy silindi')
            router.refresh()
        } catch {
            toast.error('Silme işlemi başarısız')
        }
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Toplam Portföy', value: stats.total, color: 'text-slate-900' },
                    { label: 'Aktif İlan', value: stats.active, color: 'text-emerald-600' },
                    { label: 'Satılan', value: stats.sold, color: 'text-rose-600' },
                    { label: 'Kiralanan', value: stats.rented, color: 'text-cyan-600' },
                ].map((stat, i) => (
                    <Card key={i} className="border shadow-sm">
                        <CardContent className="p-4 flex flex-col items-center">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</span>
                            <span className={cn("text-2xl font-black mt-1", stat.color)}>{stat.value}</span>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border">
                <div className="flex items-center gap-3 flex-1">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Portföy ara... (başlık, şehir, ev sahibi)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-9 text-sm"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="h-9 px-3 text-xs rounded-lg border bg-white"
                    >
                        <option value="all">Tüm Durumlar</option>
                        {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                            <option key={k} value={k}>{v.label}</option>
                        ))}
                    </select>
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="h-9 px-3 text-xs rounded-lg border bg-white"
                    >
                        <option value="all">Tüm Tipler</option>
                        {Object.entries(PROPERTY_TYPE_CONFIG).map(([k, v]) => (
                            <option key={k} value={k}>{v.label}</option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center border rounded-lg overflow-hidden">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={cn("p-2 transition-colors", viewMode === 'grid' ? 'bg-slate-900 text-white' : 'bg-white text-slate-400 hover:text-slate-600')}
                        >
                            <Grid3X3 className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={cn("p-2 transition-colors", viewMode === 'table' ? 'bg-slate-900 text-white' : 'bg-white text-slate-400 hover:text-slate-600')}
                        >
                            <List className="h-4 w-4" />
                        </button>
                    </div>
                    <Button onClick={() => setShowNewDialog(true)} className="bg-emerald-600 hover:bg-emerald-700 font-bold text-xs gap-2">
                        <Plus className="h-4 w-4" />
                        Yeni Portföy
                    </Button>
                </div>
            </div>

            {/* Grid View */}
            {viewMode === 'grid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered.length > 0 ? filtered.map((p) => {
                        const coverImage = p.portfolio_images?.find((img: any) => img.is_cover) || p.portfolio_images?.[0]
                        const statusCfg = STATUS_CONFIG[p.status] || { label: p.status, color: 'bg-slate-400 text-white' }
                        const propCfg = PROPERTY_TYPE_CONFIG[p.property_type] || { label: p.property_type, icon: Home }
                        const listingCfg = LISTING_TYPE_CONFIG[p.listing_type] || { label: p.listing_type, color: '' }
                        const PropIcon = propCfg.icon

                        return (
                            <Card key={p.id} className="group overflow-hidden border shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer">
                                {/* Image area */}
                                <div className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
                                    {coverImage ? (
                                        <img src={coverImage.url} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    ) : (
                                        <div className="flex items-center justify-center h-full">
                                            <PropIcon className="h-16 w-16 text-slate-300" />
                                        </div>
                                    )}
                                    {/* Overlays */}
                                    <div className="absolute top-3 left-3 flex gap-2">
                                        <Badge className={cn("text-[10px] font-bold border-none shadow-sm", statusCfg.color)}>
                                            {statusCfg.label}
                                        </Badge>
                                        <Badge variant="outline" className={cn("text-[10px] font-bold border shadow-sm", listingCfg.color)}>
                                            {listingCfg.label}
                                        </Badge>
                                    </div>
                                    <div className="absolute top-3 right-3">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/80 backdrop-blur hover:bg-white shadow-sm">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/portfolios/${p.id}`}>
                                                        <Eye className="mr-2 h-4 w-4" /> Detay
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/portfolios/${p.id}/edit`}>
                                                        <Edit className="mr-2 h-4 w-4" /> Düzenle
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                {p.status === 'active' && (
                                                    <>
                                                        <DropdownMenuItem onClick={() => handleStatusChange(p.id, 'sold')}>
                                                            Satıldı Olarak İşaretle
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleStatusChange(p.id, 'rented')}>
                                                            Kiralandı Olarak İşaretle
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleStatusChange(p.id, 'withdrawn')}>
                                                            Geri Çek
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                                {isManager && (
                                                    <>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(p.id)}>
                                                            <Trash2 className="mr-2 h-4 w-4" /> Sil
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    {/* Price tag */}
                                    <div className="absolute bottom-3 right-3 bg-slate-900/85 backdrop-blur text-white px-3 py-1.5 rounded-lg">
                                        <span className="text-sm font-black">{formatPrice(p.price, p.currency)}</span>
                                    </div>
                                </div>
                                {/* Info */}
                                <CardContent className="p-4 space-y-2">
                                    <h3 className="font-bold text-sm text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                                        {p.title}
                                    </h3>
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <MapPin className="h-3 w-3 flex-shrink-0" />
                                        <span className="truncate">{[p.neighborhood, p.district, p.city].filter(Boolean).join(', ') || 'Konum belirtilmemiş'}</span>
                                    </div>
                                    {/* Feature tags */}
                                    {p.features && Object.keys(p.features).filter(k => k !== 'heating' && p.features[k]).length > 0 && (
                                        <div className="flex flex-wrap gap-1 pt-1">
                                            {(() => {
                                                const FEAT_EMOJI: Record<string, string> = {
                                                    balcony: '🏗️', elevator: '🛗', parking_indoor: '🅿️', parking_outdoor: '🚗',
                                                    security: '🔒', pool: '🏊', gym: '🏋️', sea_view: '🌊', city_view: '🏙️',
                                                    furnished: '🪑', air_conditioning: '❄️', garden: '🌳', terrace: '☀️',
                                                    generator: '⚡', fireplace: '🔥', smart_home: '🤖',
                                                }
                                                const FEAT_LABEL: Record<string, string> = {
                                                    balcony: 'Balkon', elevator: 'Asansör', parking_indoor: 'Otopark', parking_outdoor: 'Otopark',
                                                    security: 'Güvenlik', pool: 'Havuz', gym: 'Spor', sea_view: 'Deniz', city_view: 'Şehir Mnz.',
                                                    furnished: 'Eşyalı', air_conditioning: 'Klima', garden: 'Bahçe', terrace: 'Teras',
                                                    generator: 'Jeneratör', fireplace: 'Şömine', smart_home: 'Akıllı Ev',
                                                }
                                                return Object.entries(p.features)
                                                    .filter(([k, v]) => k !== 'heating' && v && FEAT_EMOJI[k])
                                                    .slice(0, 4)
                                                    .map(([k]) => (
                                                        <span key={k} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-slate-100 text-[9px] text-slate-600">
                                                            {FEAT_EMOJI[k]} {FEAT_LABEL[k]}
                                                        </span>
                                                    ))
                                            })()}
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between pt-2 border-t">
                                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <PropIcon className="h-3 w-3" />
                                                {propCfg.label}
                                            </span>
                                            {p.room_count && <span className="font-bold text-slate-700">{p.room_count}</span>}
                                            {p.area_gross && <span>{p.area_gross} m²</span>}
                                        </div>
                                        {p.authorization_end && (
                                            <span className={cn(
                                                "text-[10px] font-medium",
                                                new Date(p.authorization_end) < new Date() ? 'text-red-500' : 'text-muted-foreground'
                                            )}>
                                                {new Date(p.authorization_end) < new Date() ? '⚠️ Yetki Bitti' : `Yetki: ${new Date(p.authorization_end).toLocaleDateString('tr-TR')}`}
                                            </span>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    }) : (
                        <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground">
                            <MapPin className="h-12 w-12 mb-4 text-slate-300" />
                            <p className="font-medium">Henüz portföy bulunmuyor</p>
                            <p className="text-sm mt-1">Yeni bir portföy ekleyerek başlayın.</p>
                            <Button onClick={() => setShowNewDialog(true)} className="mt-4 gap-2" variant="outline">
                                <Plus className="h-4 w-4" /> İlk Portföyü Ekle
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Table View */}
            {viewMode === 'table' && (
                <div className="rounded-xl border bg-card overflow-auto shadow-sm">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow>
                                <TableHead>Başlık</TableHead>
                                <TableHead>Tip</TableHead>
                                <TableHead>Konum</TableHead>
                                <TableHead>Oda</TableHead>
                                <TableHead>m²</TableHead>
                                <TableHead>Fiyat</TableHead>
                                <TableHead>Durum</TableHead>
                                <TableHead>Yetki Bitiş</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.length > 0 ? filtered.map((p) => {
                                const statusCfg = STATUS_CONFIG[p.status] || { label: p.status, color: 'bg-slate-400 text-white' }
                                const propCfg = PROPERTY_TYPE_CONFIG[p.property_type] || { label: p.property_type, icon: Home }
                                const listingCfg = LISTING_TYPE_CONFIG[p.listing_type] || { label: p.listing_type, color: '' }

                                return (
                                    <TableRow key={p.id} className="hover:bg-muted/30">
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-sm">{p.title}</span>
                                                <span className="text-[10px] text-muted-foreground">{p.owner_name || '-'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className={cn("text-[10px]", listingCfg.color)}>{listingCfg.label}</Badge>
                                                <span className="text-xs text-muted-foreground">{propCfg.label}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs">{[p.district, p.city].filter(Boolean).join(', ') || '-'}</TableCell>
                                        <TableCell className="font-mono font-bold text-xs">{p.room_count || '-'}</TableCell>
                                        <TableCell className="font-mono text-xs">{p.area_gross || '-'}</TableCell>
                                        <TableCell className="font-bold text-sm">{formatPrice(p.price, p.currency)}</TableCell>
                                        <TableCell>
                                            <Badge className={cn("text-[10px] border-none", statusCfg.color)}>{statusCfg.label}</Badge>
                                        </TableCell>
                                        <TableCell className="text-xs">
                                            {p.authorization_end ? (
                                                <span className={new Date(p.authorization_end) < new Date() ? 'text-red-500 font-bold' : ''}>
                                                    {new Date(p.authorization_end).toLocaleDateString('tr-TR')}
                                                </span>
                                            ) : '-'}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/portfolios/${p.id}`}>
                                                            <Eye className="mr-2 h-4 w-4" /> Detay
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    {isManager && (
                                                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(p.id)}>
                                                            <Trash2 className="mr-2 h-4 w-4" /> Sil
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                )
                            }) : (
                                <TableRow>
                                    <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                                        Portföy bulunamadı
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* New Portfolio Dialog */}
            <NewPortfolioDialog open={showNewDialog} onOpenChange={setShowNewDialog} />
        </div>
    )
}
