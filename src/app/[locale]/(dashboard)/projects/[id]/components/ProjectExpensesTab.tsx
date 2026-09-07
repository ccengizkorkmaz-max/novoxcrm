'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { 
    Plus, 
    RefreshCw, 
    Trash2, 
    Coins, 
    Ruler, 
    Layers, 
    FileText, 
    TrendingUp, 
    HardHat, 
    Sparkles, 
    Building2,
    Calendar,
    Receipt
} from 'lucide-react'
import { toast } from 'sonner'
import { 
    ProjectExpense, 
    createProjectExpense, 
    deleteProjectExpense, 
    syncExpensesToUnits 
} from '../expenses-actions'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

const EXPENSE_CATEGORIES = [
    { value: 'Hazır Beton', label: '🧱 Hazır Beton', color: 'bg-stone-100 text-stone-800 border-stone-300' },
    { value: 'İnşaat Demiri', label: '🔩 İnşaat Demiri', color: 'bg-slate-100 text-slate-800 border-slate-300' },
    { value: 'İşçilik & Taşeron', label: '👷 İşçilik & Taşeron', color: 'bg-blue-100 text-blue-800 border-blue-300' },
    { value: 'Hafriyat & Zemin', label: '🚜 Hafriyat & Zemin', color: 'bg-amber-100 text-amber-800 border-amber-300' },
    { value: 'Tesisat & Mekanik', label: '🚰 Tesisat & Mekanik', color: 'bg-cyan-100 text-cyan-800 border-cyan-300' },
    { value: 'Elektrik & Altyapı', label: '⚡ Elektrik & Altyapı', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
    { value: 'İnce Yapı & Kaplama', label: '🎨 İnce Yapı & Kaplama', color: 'bg-purple-100 text-purple-800 border-purple-300' },
    { value: 'Ruhsat & Proje Bedelleri', label: '📋 Ruhsat & Proje Bedelleri', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    { value: 'Genel Şantiye Gideri', label: '🏗️ Genel Şantiye Gideri', color: 'bg-rose-100 text-rose-800 border-rose-300' },
    { value: 'Diğer', label: '📦 Diğer', color: 'bg-gray-100 text-gray-800 border-gray-300' },
]

interface ProjectExpensesTabProps {
    projectId: string
    projectName: string
    expenses: ProjectExpense[]
    units: any[]
    isAdmin?: boolean
}

export function ProjectExpensesTab({
    projectId,
    projectName,
    expenses,
    units,
    isAdmin = false
}: ProjectExpensesTabProps) {
    const [isPending, startTransition] = useTransition()
    const [addDialogOpen, setAddDialogOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string>('all')
    const [allocationBasis, setAllocationBasis] = useState<'gross' | 'net'>('gross')

    // Toplam Harcama Tutarı
    const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)

    // Toplam Satılabilir m² Alanı
    const totalArea = units.reduce((sum, u) => {
        const area = allocationBasis === 'net' ? Number(u.area_net) : Number(u.area_gross)
        return sum + (area > 0 ? area : 0)
    }, 0)

    // Birim m² İnşaat Maliyeti
    const costPerM2 = totalArea > 0 ? Math.round(totalExpenses / totalArea) : 0

    // Kategori Bazında Toplamlar
    const categoryTotals = EXPENSE_CATEGORIES.map(cat => {
        const catExpenses = expenses.filter(e => e.category === cat.value)
        const total = catExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0)
        const percent = totalExpenses > 0 ? (total / totalExpenses) * 100 : 0
        return {
            ...cat,
            total,
            percent,
            count: catExpenses.length
        }
    }).filter(c => c.total > 0).sort((a, b) => b.total - a.total)

    // Filtrelenmiş Harcamalar
    const filteredExpenses = expenses.filter(e => {
        const matchesSearch = 
            e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (e.supplier && e.supplier.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (e.invoice_no && e.invoice_no.toLowerCase().includes(searchTerm.toLowerCase()))
        const matchesCat = selectedCategory === 'all' || e.category === selectedCategory
        return matchesSearch && matchesCat
    })

    // Harcama Ekleme
    const handleAddExpense = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        formData.append('project_id', projectId)

        startTransition(async () => {
            const res = await createProjectExpense(formData)
            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success('Şantiye gideri başarıyla kaydedildi.')
                setAddDialogOpen(false)
            }
        })
    }

    // Harcama Silme
    const handleDelete = async (id: string) => {
        startTransition(async () => {
            const res = await deleteProjectExpense(id, projectId)
            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success('Gider kalemi silindi.')
            }
        })
    }

    // Ünitelere Otomatik Dağıtım
    const handleSyncToUnits = () => {
        startTransition(async () => {
            const res = await syncExpensesToUnits(projectId, allocationBasis)
            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success(
                    `✅ ${res.updatedUnits} adet ünitenin maliyeti m² oranında güncellendi! (Birim Maliyet: ${res.costPerM2?.toLocaleString('tr-TR')} ₺/m²)`,
                    { duration: 5000 }
                )
            }
        })
    }

    return (
        <div className="space-y-6">
            {/* ÜST BİLGİ & AKSİYON BARI */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-2xl text-white shadow-lg border border-slate-700">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <HardHat className="w-5 h-5 text-amber-400" />
                        <h2 className="text-lg font-black tracking-tight">Şantiye Maliyet & Hakediş Yönetimi</h2>
                        <Badge className="bg-amber-500 text-slate-950 font-black text-[10px] border-none">
                            Yöneticiye Özel
                        </Badge>
                    </div>
                    <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                        Şantiyeye yapılan beton, demir, işçilik vb. tüm harcamaları tek merkezden girin. Sistem projedeki toplam harcamayı bağımsız bölümlerin metrajına ({allocationBasis === 'gross' ? 'Brüt' : 'Net'} m²) oranlayarak her dairenin birim maliyetini otomatik hesaplar.
                    </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                    {/* Dağıtım Bazı Seçimi */}
                    <div className="bg-white/10 p-1 rounded-lg border border-white/20 flex items-center text-xs">
                        <button
                            type="button"
                            onClick={() => setAllocationBasis('gross')}
                            className={`px-2.5 py-1 rounded-md font-bold transition-colors ${allocationBasis === 'gross' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'}`}
                        >
                            Brüt m²
                        </button>
                        <button
                            type="button"
                            onClick={() => setAllocationBasis('net')}
                            className={`px-2.5 py-1 rounded-md font-bold transition-colors ${allocationBasis === 'net' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'}`}
                        >
                            Net m²
                        </button>
                    </div>

                    {/* Ünitelere Dağıt Butonu */}
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button 
                                variant="secondary" 
                                size="sm" 
                                disabled={isPending || totalExpenses === 0 || totalArea === 0}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs gap-1.5 shadow-sm border-none"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${isPending ? 'animate-spin' : ''}`} />
                                Ünitelere Dağıt (m² Otomatik)
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-emerald-600" />
                                    Maliyetleri Ünitelere Otomatik Yansıt
                                </AlertDialogTitle>
                                <AlertDialogDescription className="space-y-3 pt-2 text-slate-600 text-sm">
                                    <p>
                                        Projedeki toplam <strong>{totalExpenses.toLocaleString('tr-TR')} ₺</strong> tutarındaki şantiye harcaması, kayıtlı <strong>{units.length}</strong> adet ünitenin toplam <strong>{totalArea.toLocaleString('tr-TR')} m²</strong> alanına oranlanacaktır.
                                    </p>
                                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs font-semibold space-y-1">
                                        <div>Birim İnşaat Maliyeti: <strong>{costPerM2.toLocaleString('tr-TR')} ₺ / m²</strong></div>
                                        <div>Hesaplama Formülü: <em>Daire Maliyeti = Dairenin m² Alanı × {costPerM2.toLocaleString('tr-TR')} ₺</em></div>
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        Bu işlem tüm ünite kartlarındaki daire maliyetlerini ve buna bağlı kâr marjlarını günceller. Onaylıyor musunuz?
                                    </p>
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                                <AlertDialogAction 
                                    onClick={handleSyncToUnits} 
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                                >
                                    Evet, Maliyetleri Güncelle
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    {/* Yeni Gider Ekle Dialogu */}
                    <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs gap-1.5 shadow-sm">
                                <Plus className="w-4 h-4" />
                                Yeni Harcama Ekle
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[550px]">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <Receipt className="w-5 h-5 text-amber-600" />
                                    Şantiye Harcaması Ekle
                                </DialogTitle>
                                <DialogDescription>
                                    {projectName} şantiyesine ait fatura, irsaliye veya hakediş harcamasını kaydedin.
                                </DialogDescription>
                            </DialogHeader>

                            <form onSubmit={handleAddExpense} className="space-y-4 pt-2">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold">Harcama Başlığı / Açıklama *</Label>
                                    <Input 
                                        name="title" 
                                        placeholder="Örn: C35 Hazır Beton Dökümü (240 m³)" 
                                        required 
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold">Gider Kategorisi *</Label>
                                        <Select name="category" defaultValue="Hazır Beton" required>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seçiniz" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {EXPENSE_CATEGORIES.map(c => (
                                                    <SelectItem key={c.value} value={c.value}>
                                                        {c.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold">Harcama Tarihi *</Label>
                                        <Input 
                                            type="date" 
                                            name="expense_date" 
                                            defaultValue={new Date().toISOString().split('T')[0]} 
                                            required 
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <div className="col-span-2 space-y-1.5">
                                        <Label className="text-xs font-bold">Tutar *</Label>
                                        <Input 
                                            name="amount" 
                                            type="number" 
                                            step="0.01" 
                                            placeholder="Örn: 450000" 
                                            required 
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold">Para Birimi</Label>
                                        <Select name="currency" defaultValue="TRY">
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="TRY">TRY (₺)</SelectItem>
                                                <SelectItem value="USD">USD ($)</SelectItem>
                                                <SelectItem value="EUR">EUR (€)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold">Tedarikçi / Taşeron Firma</Label>
                                        <Input 
                                            name="supplier" 
                                            placeholder="Örn: Akçansa, İçdaş, Yılmaz İnşaat..." 
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold">Fatura / İrsaliye No</Label>
                                        <Input 
                                            name="invoice_no" 
                                            placeholder="Örn: GİB20260000045" 
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold">Ek Notlar</Label>
                                    <Textarea 
                                        name="notes" 
                                        rows={2} 
                                        placeholder="Şantiye notları, teslimat detayları vb." 
                                    />
                                </div>

                                <DialogFooter className="pt-2">
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        onClick={() => setAddDialogOpen(false)}
                                    >
                                        İptal
                                    </Button>
                                    <Button 
                                        type="submit" 
                                        disabled={isPending} 
                                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
                                    >
                                        {isPending ? 'Kaydediliyor...' : 'Gideri Kaydet'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* KPI KARTLARI */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="rounded-xl border shadow-sm bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border-amber-200">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">Toplam Şantiye Harcaması</p>
                            <p className="text-2xl font-black text-amber-950 mt-1">
                                {totalExpenses.toLocaleString('tr-TR')} ₺
                            </p>
                            <p className="text-[10px] text-amber-700 font-medium mt-0.5">
                                {expenses.length} adet harcama kalemi
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-700">
                            <Coins className="w-5 h-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-xl border shadow-sm bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border-blue-200">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">Birim İnşaat Maliyeti</p>
                            <p className="text-2xl font-black text-blue-950 mt-1">
                                {costPerM2.toLocaleString('tr-TR')} ₺
                            </p>
                            <p className="text-[10px] text-blue-700 font-medium mt-0.5">
                                1 m² {allocationBasis === 'gross' ? 'brüt' : 'net'} inşaat başına
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-700">
                            <Ruler className="w-5 h-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-xl border shadow-sm bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-200">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">Toplam Satılabilir Alan</p>
                            <p className="text-2xl font-black text-emerald-950 mt-1">
                                {totalArea.toLocaleString('tr-TR')} m²
                            </p>
                            <p className="text-[10px] text-emerald-700 font-medium mt-0.5">
                                {units.length} adet bağımsız bölüm
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-700">
                            <Building2 className="w-5 h-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-xl border shadow-sm bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent border-purple-200">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold text-purple-900 uppercase tracking-wider">Ortalama Daire Maliyeti</p>
                            <p className="text-2xl font-black text-purple-950 mt-1">
                                {units.length > 0 ? Math.round(totalExpenses / units.length).toLocaleString('tr-TR') : 0} ₺
                            </p>
                            <p className="text-[10px] text-purple-700 font-medium mt-0.5">
                                Ünite başına düşen ortalama
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-700">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* KATEGORİ DAĞILIMI (GRAFİKSEL ÖZET) */}
            {categoryTotals.length > 0 && (
                <Card className="rounded-xl border shadow-sm">
                    <CardHeader className="p-4 border-b bg-slate-50/50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Layers className="w-4 h-4 text-blue-600" />
                                <CardTitle className="text-sm font-bold text-slate-800">
                                    Harcama Kalemleri Dağılımı
                                </CardTitle>
                            </div>
                            <span className="text-xs text-muted-foreground font-medium">
                                Toplam {categoryTotals.length} farklı harcama kalemi
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {categoryTotals.map(cat => (
                                <div key={cat.value} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-bold text-slate-800 truncate">{cat.label}</span>
                                        <span className="font-black text-slate-900">%{cat.percent.toFixed(1)}</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-blue-600 rounded-full transition-all duration-500" 
                                            style={{ width: `${cat.percent}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[11px] text-muted-foreground">
                                        <span>{cat.count} fatura / fiş</span>
                                        <span className="font-semibold text-slate-700">{cat.total.toLocaleString('tr-TR')} ₺</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* HARCAMA LİSTESİ TABLOSU */}
            <Card className="rounded-xl border shadow-sm overflow-hidden">
                <CardHeader className="p-4 border-b bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-600" />
                        <CardTitle className="text-sm font-bold text-slate-800">
                            Şantiye Gider Fatura & İrsaliye Kayıtları
                        </CardTitle>
                        <Badge variant="secondary" className="text-xs font-bold">
                            {filteredExpenses.length} Kayıt
                        </Badge>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <Input 
                            placeholder="Açıklama, tedarikçi, fatura no ara..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-8 w-60 text-xs bg-white"
                        />

                        <select 
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="h-8 rounded-md border border-input bg-white px-2 text-xs font-medium"
                        >
                            <option value="all">Tüm Kategoriler</option>
                            {EXPENSE_CATEGORIES.map(c => (
                                <option key={c.value} value={c.value}>{c.value}</option>
                            ))}
                        </select>
                    </div>
                </CardHeader>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/70 text-xs">
                                <TableHead className="w-[100px]">Tarih</TableHead>
                                <TableHead className="w-[160px]">Kategori</TableHead>
                                <TableHead>Harcama Açıklaması</TableHead>
                                <TableHead className="w-[160px]">Tedarikçi / Taşeron</TableHead>
                                <TableHead className="w-[120px]">Fatura No</TableHead>
                                <TableHead className="w-[140px] text-right">Tutar</TableHead>
                                <TableHead className="w-[60px] text-right">İşlem</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredExpenses.length > 0 ? (
                                filteredExpenses.map(expense => {
                                    const catMeta = EXPENSE_CATEGORIES.find(c => c.value === expense.category)
                                    return (
                                        <TableRow key={expense.id} className="hover:bg-slate-50/50 text-xs transition-colors">
                                            <TableCell className="font-mono text-slate-600 whitespace-nowrap">
                                                {expense.expense_date ? format(new Date(expense.expense_date), 'dd MMM yyyy', { locale: tr }) : '-'}
                                            </TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${catMeta?.color || 'bg-slate-100'}`}>
                                                    {expense.category}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-bold text-slate-900">{expense.title}</div>
                                                {expense.notes && (
                                                    <div className="text-[11px] text-muted-foreground mt-0.5">{expense.notes}</div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-slate-700 font-medium">
                                                {expense.supplier || '-'}
                                            </TableCell>
                                            <TableCell className="font-mono text-slate-500">
                                                {expense.invoice_no || '-'}
                                            </TableCell>
                                            <TableCell className="text-right font-black font-mono text-slate-900 text-sm">
                                                {Number(expense.amount).toLocaleString('tr-TR')} {expense.currency || 'TRY'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button 
                                                            size="icon" 
                                                            variant="ghost" 
                                                            className="h-7 w-7 text-slate-400 hover:text-rose-600"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Harcamayı Sil</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                &quot;{expense.title}&quot; kaydı kalıcı olarak silinecektir. Devam etmek istiyor musunuz?
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>İptal</AlertDialogCancel>
                                                            <AlertDialogAction 
                                                                onClick={() => handleDelete(expense.id)}
                                                                className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
                                                            >
                                                                Sil
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center gap-1">
                                            <Receipt className="w-8 h-8 text-slate-300 stroke-1" />
                                            <p className="font-medium text-sm">Henüz kayıtlı şantiye harcaması bulunmuyor.</p>
                                            <p className="text-xs text-slate-400">Beton, demir, işçilik vb. faturalarınızı yukarıdaki &quot;Yeni Harcama Ekle&quot; butonundan kaydedebilirsiniz.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    )
}
