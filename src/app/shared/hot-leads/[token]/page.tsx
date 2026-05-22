'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { 
    ShieldCheck, 
    Lock, 
    Loader2, 
    Flame, 
    Thermometer, 
    Phone, 
    User, 
    Calendar, 
    CheckCircle2, 
    AlertTriangle, 
    Search, 
    Copy, 
    Check, 
    Download, 
    HelpCircle, 
    MessageSquare 
} from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { exportToExcel } from '@/lib/report-export'
import { toast, Toaster } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from '@/components/ui/button'

export default function SharedHotLeadsReportPage() {
    const params = useParams()
    const token = params.token as string

    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [leads, setLeads] = useState<any[] | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [scoreFilter, setScoreFilter] = useState('all')
    const [statusFilter, setStatusFilter] = useState('all')
    const [copiedId, setCopiedId] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            // First verify password
            const verifyRes = await fetch('/api/shared-report/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            })
            const verifyData = await verifyRes.json()
            if (!verifyRes.ok) {
                setError(verifyData.error || 'Doğrulama başarısız')
                setLoading(false)
                return
            }

            // Then fetch data
            const dataRes = await fetch('/api/shared-report/data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            })
            const reportData = await dataRes.json()
            if (!dataRes.ok) {
                setError(reportData.error || 'Veri alınamadı')
                setLoading(false)
                return
            }

            setLeads(reportData.leads || [])
        } catch {
            setError('Bağlantı hatası')
        }
        setLoading(false)
    }

    // Copy helper
    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text)
        setCopiedId(id)
        toast.success('Telefon numarası kopyalandı!')
        setTimeout(() => setCopiedId(null), 2000)
    }

    if (leads === null) {
        // Render secure password prompt
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <Toaster position="top-center" />
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-2xl shadow-xl border p-8 space-y-6">
                        <div className="text-center space-y-2">
                            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto">
                                <Flame className="w-8 h-8 text-red-500 animate-pulse" />
                            </div>
                            <h1 className="text-2xl font-bold text-slate-900">Sıcak Lead Raporu</h1>
                            <p className="text-sm text-slate-500">Bu rapor şifre ile korunmaktadır.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="password"
                                    placeholder="Erişim şifresini girin..."
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                                    required
                                />
                            </div>
                            {error && (
                                <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg font-medium">{error}</p>
                            )}
                            <button
                                type="submit"
                                disabled={loading || !password}
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                                Raporu Görüntüle
                            </button>
                        </form>

                        <p className="text-[10px] text-center text-slate-400">
                            Bu rapor yalnızca yetkili kişilerle paylaşılmıştır.
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    // Filter logic
    const filteredLeads = leads.filter(lead => {
        const matchesSearch = 
            lead.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.customerPhone.includes(searchTerm) ||
            lead.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (lead.projectName || '').toLowerCase().includes(searchTerm.toLowerCase())

        const matchesScore = scoreFilter === 'all' || lead.leadScore === scoreFilter
        
        let matchesStatus = true
        if (statusFilter === 'notified') matchesStatus = lead.hotLeadNotified === true
        else if (statusFilter === 'pending') matchesStatus = lead.hotLeadNotified !== true

        return matchesSearch && matchesScore && matchesStatus
    })

    // Excel Export helper
    const handleExport = () => {
        if (filteredLeads.length === 0) {
            toast.error('Aktif filtreler ile dışa aktarılacak veri bulunamadı!')
            return
        }

        const exportData = filteredLeads.map(lead => ({
            'Müşteri Adı': lead.customerName,
            'Telefon Numarası': lead.customerPhone,
            'İlgilendiği Proje': lead.projectName || 'Genel',
            'Skor': lead.leadScore === 'hot' ? 'Sıcak (HOT)' : lead.leadScore === 'warm' ? 'Ilık (WARM)' : 'Arama Talebi',
            'Bildirim Durumu': lead.hotLeadNotified ? 'Yöneticiye İletildi' : 'Bekliyor',
            'Kanal': lead.customerSource || 'WhatsApp',
            'Son Etkinlik': format(new Date(lead.updatedAt), 'dd.MM.yyyy HH:mm', { locale: tr }),
            'Görüşme Özeti': lead.summary
        }))

        exportToExcel(exportData, `hot_lead_shared_raporu_${new Date().toISOString().slice(0, 10)}`)
        toast.success('Rapor başarıyla Excel olarak indirildi!')
    }

    // KPI Metrics
    const totalCount = filteredLeads.length
    const hotCount = filteredLeads.filter(l => l.leadScore === 'hot').length
    const warmCount = filteredLeads.filter(l => l.leadScore === 'warm').length
    const callReqCount = filteredLeads.filter(l => l.leadScore === 'call_requested').length
    const notifiedPercent = totalCount > 0 
        ? Math.round((filteredLeads.filter(l => l.hotLeadNotified === true).length / totalCount) * 100) 
        : 0

    return (
        <div className="min-h-screen bg-slate-50 py-4 px-2 md:py-8 md:px-4">
            <Toaster position="top-center" />
            <div className="max-w-[1600px] mx-auto space-y-4 md:space-y-8">
                {/* Header Section */}
                <div className="bg-white rounded-3xl border p-4 md:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                            <Flame className="h-8 w-8 text-red-500 animate-pulse fill-red-500" />
                            Sıcak (Hot) Lead Raporu
                        </h1>
                        <p className="text-slate-500 text-xs md:text-sm mt-1 font-medium">
                            Yapay zeka analizleri ve WhatsApp yazışmalarına göre skorlanan sıcak potansiyel müşteriler.
                        </p>
                    </div>

                    <div>
                        <Button 
                            onClick={handleExport}
                            disabled={filteredLeads.length === 0}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 px-4 md:px-6 rounded-2xl shadow-lg shadow-blue-500/20 gap-2 text-xs md:text-sm w-full md:w-auto"
                        >
                            <Download className="h-4 w-4" />
                            Excel&apos;e Aktar
                        </Button>
                    </div>
                </div>

                {/* KPI Cards Grid */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
                    <div className="bg-white rounded-3xl p-3 md:p-6 border border-slate-100 shadow-md flex flex-col items-center justify-center min-w-0 w-full transition-transform hover:scale-102 duration-300">
                        <Flame className="h-5 w-5 md:h-6 md:w-6 text-red-500 mb-1 md:mb-2" />
                        <span className="text-xl md:text-3xl font-black text-slate-900">{hotCount}</span>
                        <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 text-center">Sıcak (HOT)</span>
                    </div>
                    <div className="bg-white rounded-3xl p-3 md:p-6 border border-slate-100 shadow-md flex flex-col items-center justify-center min-w-0 w-full transition-transform hover:scale-102 duration-300">
                        <Thermometer className="h-5 w-5 md:h-6 md:w-6 text-orange-500 mb-1 md:mb-2" />
                        <span className="text-xl md:text-3xl font-black text-slate-900">{warmCount}</span>
                        <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 text-center">Ilık (WARM)</span>
                    </div>
                    <div className="bg-white rounded-3xl p-3 md:p-6 border border-slate-100 shadow-md flex flex-col items-center justify-center min-w-0 w-full transition-transform hover:scale-102 duration-300">
                        <Phone className="h-5 w-5 md:h-6 md:w-6 text-purple-500 mb-1 md:mb-2" />
                        <span className="text-xl md:text-3xl font-black text-slate-900">{callReqCount}</span>
                        <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 text-center">Arama</span>
                    </div>
                    <div className="bg-white rounded-3xl p-3 md:p-6 border border-slate-100 shadow-md flex flex-col items-center justify-center min-w-0 w-full transition-transform hover:scale-102 duration-300">
                        <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 text-emerald-500 mb-1 md:mb-2" />
                        <span className="text-xl md:text-3xl font-black text-slate-900">%{notifiedPercent}</span>
                        <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 text-center">İletim</span>
                    </div>
                    <div className="col-span-2 md:col-span-1 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-3 md:p-6 shadow-md flex flex-col items-center justify-center min-w-0 w-full transition-transform hover:scale-102 duration-300">
                        <MessageSquare className="h-5 w-5 md:h-6 md:w-6 text-blue-400 mb-1 md:mb-2" />
                        <span className="text-xl md:text-3xl font-black">{totalCount}</span>
                        <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 text-center">Toplam</span>
                    </div>
                </div>

                {/* Filter Controls */}
                <Card className="border-none shadow-xl shadow-slate-100/40 rounded-3xl overflow-hidden bg-white/70 backdrop-blur-md w-full">
                    <CardContent className="p-4 md:p-6">
                        <div className="flex flex-col lg:flex-row gap-4 items-center">
                            <div className="relative w-full lg:flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                                <Input 
                                    type="text" 
                                    placeholder="Müşteri adı, telefon veya görüşme içeriğinde ara..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-11 h-12 bg-white/50 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-2xl w-full text-slate-800 placeholder-slate-400 text-sm font-medium"
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                                <div className="w-full sm:w-[200px]">
                                    <Select value={scoreFilter} onValueChange={setScoreFilter}>
                                        <SelectTrigger className="h-12 border-slate-200 rounded-2xl bg-white/50 text-slate-700 font-semibold text-sm">
                                            <SelectValue placeholder="Skor Filtresi" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-slate-100 shadow-xl bg-white dark:bg-slate-950">
                                            <SelectItem value="all">Tüm Skorlar</SelectItem>
                                            <SelectItem value="hot">🔥 Sıcak (HOT)</SelectItem>
                                            <SelectItem value="warm">🍊 Ilık (WARM)</SelectItem>
                                            <SelectItem value="call_requested">📞 Arama Talepleri</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="w-full sm:w-[200px]">
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger className="h-12 border-slate-200 rounded-2xl bg-white/50 text-slate-700 font-semibold text-sm">
                                            <SelectValue placeholder="Bildirim Durumu" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-slate-100 shadow-xl bg-white dark:bg-slate-950">
                                            <SelectItem value="all">Tüm Durumlar</SelectItem>
                                            <SelectItem value="notified">✅ Yöneticiye İletildi</SelectItem>
                                            <SelectItem value="pending">⚠️ İletim Bekliyor</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Table & Cards */}
                <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-3xl overflow-hidden bg-white w-full">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-4 py-4 md:px-8 md:py-6">
                        <div>
                            <CardTitle className="text-xl font-bold text-slate-800">Sıcak Lead Bildirimleri</CardTitle>
                            <CardDescription className="text-sm mt-1">Paylaşılan güncel sıcak lead verileri listelenmektedir.</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent bg-slate-50/30 border-slate-100">
                                        <TableHead className="pl-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Müşteri Bilgileri</TableHead>
                                        <TableHead className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">İlgilendiği Proje</TableHead>
                                        <TableHead className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Skor</TableHead>
                                        <TableHead className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Bildirim Durumu</TableHead>
                                        <TableHead className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Kaynak</TableHead>
                                        <TableHead className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Son Etkinlik</TableHead>
                                        <TableHead className="pl-4 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest w-[450px]">Görüşme Özeti</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredLeads.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-48 text-center text-slate-400 font-semibold text-sm">
                                                Filtrelerinize uygun lead bulunamadı.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredLeads.map((lead) => (
                                            <TableRow key={lead.id} className="group hover:bg-slate-50/50 transition-colors border-slate-50">
                                                {/* Customer */}
                                                <TableCell className="pl-8 py-4.5">
                                                    <div className="flex flex-col gap-1.5">
                                                        <span className="font-extrabold text-slate-800 group-hover:text-blue-600 transition-colors flex items-center gap-1.5 text-[14px]">
                                                            <User className="h-4 w-4 text-slate-400" />
                                                            {lead.customerName}
                                                        </span>
                                                        <div className="flex items-center gap-2">
                                                            <a href={`tel:${lead.customerPhone.replace(/\s+/g, '')}`} className="text-xs text-blue-600 font-bold tracking-tight bg-blue-50 hover:bg-blue-100 transition-colors px-2 py-1 rounded-md flex items-center gap-1 cursor-pointer">
                                                                <Phone className="h-3 w-3" />
                                                                {lead.customerPhone}
                                                            </a>
                                                            <button 
                                                                onClick={() => handleCopy(lead.customerPhone, lead.id)}
                                                                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                                                                title="Numarayı Kopyala"
                                                            >
                                                                {copiedId === lead.id ? (
                                                                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                                                                ) : (
                                                                    <Copy className="h-3.5 w-3.5" />
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                {/* Project */}
                                                <TableCell className="text-center">
                                                    {lead.projectName && lead.projectName !== 'Genel' ? (
                                                        <Badge className="bg-indigo-50 hover:bg-indigo-50 text-indigo-700 border border-indigo-200/50 font-black text-[11px] px-2.5 py-0.5 rounded-md">
                                                            {lead.projectName}
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-slate-100 hover:bg-slate-100 text-slate-500 border border-slate-200/30 font-bold text-[11px] px-2.5 py-0.5 rounded-md">
                                                            Genel
                                                        </Badge>
                                                    )}
                                                </TableCell>

                                                {/* Score */}
                                                <TableCell className="text-center">
                                                    {lead.leadScore === 'hot' && (
                                                        <Badge className="bg-red-50 hover:bg-red-50 text-red-600 border-red-200/50 px-3 py-1 rounded-full font-black text-xs gap-1 border">
                                                            <Flame className="h-3 w-3 fill-red-500" />
                                                            Sıcak (HOT)
                                                        </Badge>
                                                    )}
                                                    {lead.leadScore === 'warm' && (
                                                        <Badge className="bg-orange-50 hover:bg-orange-50 text-orange-600 border-orange-200/50 px-3 py-1 rounded-full font-black text-xs gap-1 border">
                                                            <Thermometer className="h-3 w-3" />
                                                            Ilık (WARM)
                                                        </Badge>
                                                    )}
                                                    {lead.leadScore === 'call_requested' && (
                                                        <Badge className="bg-purple-50 hover:bg-purple-50 text-purple-600 border-purple-200/50 px-3 py-1 rounded-full font-black text-xs gap-1 border">
                                                            <Phone className="h-3 w-3" />
                                                            Arama Talebi
                                                        </Badge>
                                                    )}
                                                </TableCell>

                                                {/* Notification */}
                                                <TableCell className="text-center">
                                                    {lead.hotLeadNotified ? (
                                                        <Badge className="bg-emerald-50 hover:bg-emerald-50 text-emerald-600 border-emerald-200/50 px-3 py-1 rounded-full font-bold text-xs gap-1.5 border">
                                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                                            İletildi
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-amber-50 hover:bg-amber-50 text-amber-600 border-amber-200/50 px-3 py-1 rounded-full font-bold text-xs gap-1.5 border">
                                                            <AlertTriangle className="h-3.5 w-3.5" />
                                                            Bekliyor
                                                        </Badge>
                                                    )}
                                                </TableCell>

                                                {/* Source */}
                                                <TableCell className="text-center">
                                                    <Badge className="bg-slate-100 text-slate-600 border-none font-bold text-xs">
                                                        {lead.customerSource || 'WhatsApp'}
                                                    </Badge>
                                                </TableCell>

                                                {/* Event Date */}
                                                <TableCell className="text-center">
                                                    <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 font-bold">
                                                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                                        {format(new Date(lead.updatedAt), 'd MMM HH:mm', { locale: tr })}
                                                    </div>
                                                </TableCell>

                                                {/* Excerpt */}
                                                <TableCell className="py-4.5 pr-6 pl-4">
                                                    <p className="text-xs text-slate-600 leading-relaxed max-w-[420px] font-medium line-clamp-2" title={lead.summary}>
                                                        {lead.summary}
                                                    </p>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Mobile List View */}
                        <div className="md:hidden flex flex-col gap-3 p-2 bg-slate-50/50 w-full overflow-x-hidden">
                            {filteredLeads.length === 0 ? (
                                <div className="text-center text-slate-400 font-semibold text-sm py-10">
                                    Filtrelerinize uygun lead bulunamadı.
                                </div>
                            ) : (
                                filteredLeads.map((lead) => (
                                    <Card key={`mobile-${lead.id}`} className="overflow-hidden border border-slate-200 shadow-sm w-full bg-white">
                                        <CardContent className="p-3 flex flex-col gap-2.5">
                                            {/* Row 1: Name and Score Badge */}
                                            <div className="flex justify-between items-center gap-2">
                                                <span className="font-extrabold text-slate-800 text-[14px] flex items-center gap-1.5 min-w-0 flex-1">
                                                    <User className="h-4 w-4 text-slate-400 shrink-0" />
                                                    <span className="truncate">{lead.customerName}</span>
                                                </span>
                                                <div className="shrink-0 flex items-center">
                                                    {lead.leadScore === 'hot' && <Badge className="bg-red-50 text-red-600 border-red-200 border text-[9px] px-1.5 py-0.5"><Flame className="h-3 w-3 mr-0.5 fill-red-500" />Sıcak</Badge>}
                                                    {lead.leadScore === 'warm' && <Badge className="bg-orange-50 text-orange-600 border-orange-200 border text-[9px] px-1.5 py-0.5"><Thermometer className="h-3 w-3 mr-0.5" />Ilık</Badge>}
                                                    {lead.leadScore === 'call_requested' && <Badge className="bg-purple-50 text-purple-600 border-purple-200 border text-[9px] px-1.5 py-0.5"><Phone className="h-3 w-3 mr-0.5" />Arama</Badge>}
                                                </div>
                                            </div>
                                            
                                            {/* Row 2: Phone number and Project Badge */}
                                            <div className="flex justify-between items-center gap-2 mt-0.5">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <a href={`tel:${lead.customerPhone.replace(/\s+/g, '')}`} className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md text-xs font-bold tracking-wide flex items-center gap-1 shadow-sm border border-blue-100 hover:bg-blue-100 transition-colors">
                                                        <Phone className="h-3 w-3" />
                                                        {lead.customerPhone}
                                                    </a>
                                                    <button 
                                                        onClick={() => handleCopy(lead.customerPhone, lead.id)}
                                                        className="text-slate-400 hover:text-slate-600 transition-colors p-1 bg-slate-100 rounded-md shadow-sm border border-slate-200 hover:bg-slate-200"
                                                        title="Kopyala"
                                                    >
                                                        {copiedId === lead.id ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                                                    </button>
                                                </div>
                                                <div className="shrink-0">
                                                    {lead.projectName && lead.projectName !== 'Genel' ? (
                                                        <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 border text-[9px] max-w-[100px] truncate block px-1.5 py-0.5" title={lead.projectName}>{lead.projectName}</Badge>
                                                    ) : (
                                                        <Badge className="bg-slate-100 text-slate-500 border-slate-200 border text-[9px] px-1.5 py-0.5">Genel</Badge>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {/* Row 3: Conversation summary */}
                                            <div className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-100 mt-1">
                                                <p className="text-[12px] text-slate-600 font-medium line-clamp-3 leading-relaxed">
                                                    {lead.summary}
                                                </p>
                                            </div>

                                            {/* Row 4: Updated date and notification status */}
                                            <div className="flex justify-between items-center mt-1 border-t border-slate-100 pt-2.5">
                                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    {format(new Date(lead.updatedAt), 'd MMM HH:mm', { locale: tr })}
                                                </div>
                                                <div>
                                                    {lead.hotLeadNotified ? (
                                                        <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />İletildi</span>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-amber-600 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Bekliyor</span>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Footer text */}
                <p className="text-center text-xs text-slate-400 py-4">
                    Bu rapor şifre korumalı olarak paylaşılmıştır. Yetkisiz dağıtımı yasaktır.
                </p>
            </div>
        </div>
    )
}
