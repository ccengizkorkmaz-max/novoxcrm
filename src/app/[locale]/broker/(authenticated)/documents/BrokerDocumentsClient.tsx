'use client'

import { useState } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Library,
    FileText,
    Download,
    Search,
    Video,
    Map,
    Scale,
    Building2,
    Eye,
    BadgeTurkishLira,
    MessageCircle,
    X
} from "lucide-react"
import { Input } from "@/components/ui/input"

interface Doc {
    id: string
    name: string
    category: string
    file_url: string
    thumbnail_url?: string
    created_at: string
    projects?: { name: string }[] | { name: string } | null
}

const CATEGORIES = [
    { id: 'all', label: 'Tümü', icon: Library },
    { id: 'catalog', label: 'Kataloglar', icon: FileText },
    { id: 'brochure', label: 'Broşürler', icon: FileText },
    { id: 'floor_plan', label: 'Kat Planları', icon: Map },
    { id: 'site_plan', label: 'Vaziyet Planları', icon: Map },
    { id: 'price_list', label: 'Fiyat Listeleri', icon: BadgeTurkishLira },
    { id: 'renders', label: '3D & Görseller', icon: Video },
    { id: 'virtual_tour', label: 'Sanal Turlar', icon: Video },
    { id: 'technical_spec', label: 'Teknik Şartnameler', icon: Scale },
    { id: 'sample_contract', label: 'Örnek Sözleşmeler', icon: Scale },
]

export function BrokerDocumentsClient({ documents }: { documents: Doc[] }) {
    const [search, setSearch] = useState('')
    const [activeCategory, setActiveCategory] = useState('all')

    const filtered = documents.filter(doc => {
        const matchesSearch = search.trim() === '' ||
            doc.name.toLowerCase().includes(search.toLowerCase()) ||
            (Array.isArray(doc.projects) ? doc.projects[0]?.name : doc.projects?.name)?.toLowerCase().includes(search.toLowerCase())
        
        let matchesCategory = activeCategory === 'all'
        if (!matchesCategory) {
            if (activeCategory === 'catalog' && (doc.category === 'catalog' || doc.category === 'Marketing')) {
                matchesCategory = true
            } else if (activeCategory === 'brochure' && (doc.category === 'brochure' || doc.category === 'Brochure')) {
                matchesCategory = true
            } else if (activeCategory === 'floor_plan' && (doc.category === 'floor_plan' || doc.category === 'Floor Plan')) {
                matchesCategory = true
            } else if (activeCategory === 'price_list' && (doc.category === 'price_list' || doc.category === 'Price List')) {
                matchesCategory = true
            } else if (activeCategory === 'renders' && (doc.category === 'renders' || doc.category === '3D/Virtual')) {
                matchesCategory = true
            } else if (activeCategory === 'technical_spec' && (doc.category === 'technical_spec' || doc.category === 'Legal')) {
                matchesCategory = true
            } else {
                matchesCategory = doc.category === activeCategory
            }
        }
        return matchesSearch && matchesCategory
    })

    return (
        <div className="space-y-6 pb-12 max-w-5xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Satış Materyalleri</h1>
                <p className="text-slate-500 text-sm mt-1">Satış süreçlerinizde kullanabileceğiniz tüm görsel ve teknik dökümanlar.</p>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                    placeholder="Döküman adı veya proje ara..."
                    className="pl-9 rounded-lg border-slate-200 focus:ring-blue-500"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                    <button onClick={() => setSearch('')} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Category Chips */}
            <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg font-medium border transition-all ${
                            activeCategory === cat.id
                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-blue-50/30'
                        }`}
                    >
                        <cat.icon className="h-3.5 w-3.5" />
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Results info */}
            {(search || activeCategory !== 'all') && (
                <p className="text-xs text-slate-500">{filtered.length} döküman bulundu</p>
            )}

            {/* Documents Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.length > 0 ? filtered.map((doc) => (
                    <Card key={doc.id} className="border border-slate-100 shadow-sm hover:shadow-md transition-all rounded-xl overflow-hidden group">
                        <div className="aspect-video bg-slate-50 relative group-hover:bg-slate-100 transition-colors">
                            {doc.thumbnail_url ? (
                                <img src={doc.thumbnail_url} alt={doc.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-200">
                                    <FileText className="h-10 w-10" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                {doc.file_url && (
                                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                                        <Button size="icon" variant="secondary" className="rounded-full h-9 w-9 bg-white/90 hover:bg-white text-blue-600 shadow-lg">
                                            <Download className="h-4 w-4" />
                                        </Button>
                                    </a>
                                )}
                            </div>
                        </div>
                        <CardContent className="p-3.5">
                            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-0.5">{doc.category}</p>
                            <h3 className="font-semibold text-slate-900 text-sm line-clamp-1 group-hover:text-blue-600 transition-colors">{doc.name}</h3>
                            <div className="mt-2.5 flex items-center justify-between">
                                <span className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                                    <Building2 className="h-3 w-3" />
                                    {(Array.isArray(doc.projects) ? doc.projects[0]?.name : doc.projects?.name) || 'Tüm Projeler'}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                    {new Date(doc.created_at).toLocaleDateString('tr-TR')}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                )) : (
                    <div className="col-span-full py-16 text-center bg-white rounded-xl border border-dashed border-slate-200">
                        <Library className="h-10 w-10 mx-auto mb-3 text-slate-200" />
                        <p className="text-sm text-slate-400 font-medium">Bu kategoride döküman bulunamadı.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
