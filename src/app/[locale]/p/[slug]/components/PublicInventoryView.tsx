'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Info,
    Lock,
    ArrowRight,
    LayoutGrid,
    List,
    CheckCircle2,
    Circle,
    Calendar,
    Search,
    Loader2
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { submitPublicInquiry } from '@/app/[locale]/(dashboard)/inventory/actions'
import { toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Label as UILabel } from '@/components/ui/label'
import CalculatorModal from './CalculatorModal'

interface PublicInventoryViewProps {
    linkData: any
}

export default function PublicInventoryView({ linkData }: PublicInventoryViewProps) {
    const [password, setPassword] = useState('')
    const [isUnlocked, setIsUnlocked] = useState(!linkData.password_hash)
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [searchTerm, setSearchTerm] = useState('')

    // Inquiry State
    const [inquiryOpen, setInquiryOpen] = useState(false)
    const [selectedUnit, setSelectedUnit] = useState<any>(null)
    const [submitting, setSubmitting] = useState(false)
    const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' })

    const handleUnlock = () => {
        if (password === linkData.password_hash) {
            setIsUnlocked(true)
        } else {
            toast.error('Yanlış şifre. Lütfen tekrar deneyin.')
        }
    }

    const handleInquirySubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.name || !form.phone) {
            toast.error('Lütfen adınızı ve telefon numaranızı giriniz.')
            return
        }

        setSubmitting(true)
        const result = await submitPublicInquiry({
            link_id: linkData.id,
            unit_id: selectedUnit?.id,
            full_name: form.name,
            phone: form.phone,
            email: form.email,
            message: form.message
        })
        setSubmitting(false)

        if (result.success) {
            toast.success('Mesajınız iletildi! En kısa sürede size geri dönüş yapacağız.')
            setInquiryOpen(false)
            setForm({ name: '', phone: '', email: '', message: '' })
        } else {
            toast.error('Gönderilemedi, lütfen teknik bir sorun mu var kontrol edin.')
        }
    }

    const filteredUnits = linkData.units?.filter((u: any) =>
        u.unit_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.type.toLowerCase().includes(searchTerm.toLowerCase())
    ) || []

    if (!isUnlocked) {
        return (
            <div className="max-w-md mx-auto py-20 px-6">
                <Card className="shadow-2xl border-slate-200">
                    <CardHeader className="text-center space-y-1">
                        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-2 text-amber-600">
                            <Lock className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-xl font-bold">Şifre Gerekli</CardTitle>
                        <p className="text-sm text-slate-500">Bu katalog şifre ile korunmaktadır.</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Input
                            type="password"
                            placeholder="Katalog şifresini giriniz"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                            className="text-center"
                        />
                        <Button className="w-full bg-slate-900" onClick={handleUnlock}>
                            Giriş Yap <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto py-8 px-4 md:px-6">
            {/* Header Area */}
            <div className="mb-10 text-center space-y-3">
                <Badge variant="outline" className="bg-white px-3 py-1 text-slate-500 border-slate-200 shadow-sm text-[10px] font-bold uppercase tracking-widest">
                    Paylaşılan Envanter Kataloğu
                </Badge>
                <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                    <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">{linkData.title}</h1>
                    <Button
                        onClick={() => {
                            setSelectedUnit(null)
                            setInquiryOpen(true)
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full px-6 shadow-lg shadow-blue-500/20"
                    >
                        Tüm Sorularınız İçin Bizimle İletişime Geçin
                    </Button>
                </div>
                <div className="flex items-center justify-center gap-4 text-sm text-slate-500 font-medium pt-1">
                    <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {new Date(linkData.created_at).toLocaleDateString('tr-TR')}</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full" />
                    <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> {linkData.units?.length} Aktif Ünite</span>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 bg-white p-4 rounded-2xl border shadow-sm">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Ünite no veya tip ara..."
                        className="pl-9 h-10 bg-slate-50 border-none ring-0 focus-visible:ring-1 focus-visible:ring-slate-200"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'grid' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <LayoutGrid className="h-3.5 w-3.5" /> Grid
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'list' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <List className="h-3.5 w-3.5" /> Liste
                    </button>
                </div>
            </div>

            {/* Content View */}
            {linkData.units?.length > 0 ? (
                viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredUnits.map((unit: any) => (
                            <UnitPublicCard key={unit.id} unit={unit} onInquiry={() => {
                                setSelectedUnit(unit)
                                setInquiryOpen(true)
                            }} />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                        <th className="px-6 py-4">Ünite No</th>
                                        <th className="px-6 py-4">Proje / Blok</th>
                                        <th className="px-6 py-4">Tip</th>
                                        <th className="px-6 py-4 text-right">Fiyat</th>
                                        <th className="px-6 py-4 text-right">İşlem</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredUnits.map((u: any) => (
                                        <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 font-black text-slate-900">{u.unit_number}</td>
                                            <td className="px-6 py-4 text-slate-600 text-sm">
                                                <div className="font-medium text-slate-900">{u.projects?.name}</div>
                                                <div className="text-xs text-slate-400">Blok: {u.block || '-'}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-none font-bold text-[10px]">{u.type}</Badge>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 text-sm font-medium">{u.floor}. Kat</td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-lg font-black text-slate-900">
                                                    {formatCurrency(u.price, u.currency)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <CalculatorModal unit={u} />
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 border-blue-200 text-blue-600 hover:bg-blue-50 font-bold text-[10px]"
                                                        onClick={() => {
                                                            setSelectedUnit(u)
                                                            setInquiryOpen(true)
                                                        }}
                                                    >
                                                        Detaylı Bilgi
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
            ) : (
                <div className="py-20 text-center space-y-4 bg-white rounded-3xl border border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                        <Info className="h-8 w-8" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Ünite Bulunamadı</h3>
                        <p className="text-sm text-slate-500 max-w-sm mx-auto">
                            Bu katalogda şu anda gösterilecek aktif ünite bulunmamaktadır.
                            Detaylı bilgi için lütfen danışmanınızla iletişime geçin.
                        </p>
                    </div>
                </div>
            )}

            {/* Inquiry Dialog */}
            <Dialog open={inquiryOpen} onOpenChange={setInquiryOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{selectedUnit ? `${selectedUnit.unit_number} İçin Bilgi İste` : 'İletişime Geç'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleInquirySubmit} className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <UILabel htmlFor="pub-name" className="text-xs">Adınız Soyadınız *</UILabel>
                            <Input
                                id="pub-name"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                placeholder="Örn: Ahmet Yılmaz"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <UILabel htmlFor="pub-phone" className="text-xs">Telefon *</UILabel>
                                <Input
                                    id="pub-phone"
                                    value={form.phone}
                                    onChange={e => setForm({ ...form, phone: e.target.value })}
                                    placeholder="05..."
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <UILabel htmlFor="pub-email" className="text-xs">Email (Opsiyonel)</UILabel>
                                <Input
                                    id="pub-email"
                                    value={form.email}
                                    onChange={e => setForm({ ...form, email: e.target.value })}
                                    placeholder="ahmet@example.com"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <UILabel htmlFor="pub-msg" className="text-xs">Mesajınız (Opsiyonel)</UILabel>
                            <textarea
                                id="pub-msg"
                                value={form.message}
                                onChange={e => setForm({ ...form, message: e.target.value })}
                                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                placeholder="Daire hakkında sormak istedikleriniz..."
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setInquiryOpen(false)}>Vazgeç</Button>
                            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 font-bold" disabled={submitting}>
                                {submitting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <ArrowRight className="h-4 w-4 mr-2" />}
                                Gönder
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Footer Branding */}
            <div className="mt-20 pt-8 border-t border-slate-200 text-center">
                <div className="flex items-center justify-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest mb-2 font-mono">
                    <Circle className="h-2 w-2 fill-emerald-500 text-emerald-500" />
                    Novo CRM Digital Sales Solution
                </div>
                <p className="text-[10px] text-slate-400 font-medium">Bu katalog gayrimenkul danışmanınız tarafından sizin için özel olarak hazırlanmıştır.</p>
            </div>
        </div>
    )
}

function UnitPublicCard({ unit, onInquiry }: { unit: any, onInquiry: () => void }) {
    return (
        <div className="group bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300 overflow-hidden flex flex-col h-full">
            {/* Banner */}
            <div className="aspect-[16/10] bg-slate-50 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                <div className="absolute top-4 left-4">
                    <Badge className="bg-white/90 backdrop-blur text-slate-900 border-none font-black text-[10px] px-3 py-1">
                        {unit.type}
                    </Badge>
                </div>
                <div className="absolute bottom-4 left-4 text-white">
                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-80">{unit.projects?.name}</div>
                    <div className="text-xl font-black">{unit.unit_number}</div>
                </div>
            </div>

            {/* Info */}
            <div className="p-6 flex-1 flex flex-col">
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="space-y-0.5">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Brüt Alan</div>
                        <div className="text-sm font-black text-slate-700">{unit.area_gross} m²</div>
                    </div>
                    <div className="space-y-0.5">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bulunduğu Kat</div>
                        <div className="text-sm font-black text-slate-700">{unit.floor}. Kat</div>
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-50 flex items-end justify-between">
                    <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Liste Fiyatı</div>
                        <div className="text-2xl font-black text-slate-900 tracking-tight">
                            {formatCurrency(unit.price, unit.currency)}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <CalculatorModal unit={unit} />
                        <Button
                            className="bg-blue-600 hover:bg-blue-700 h-10 w-10 p-0 rounded-full shadow-lg shadow-blue-500/10"
                            onClick={onInquiry}
                        >
                            <Info className="h-5 w-5 text-white" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
