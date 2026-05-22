'use client'

import React, { useState, useEffect } from 'react'
import { getHotLeadsReport } from '../actions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
    BarChart3, 
    Download, 
    RefreshCw, 
    Search, 
    MessageSquare, 
    CheckCircle2, 
    AlertTriangle, 
    Phone, 
    User, 
    Copy, 
    Check, 
    Flame, 
    Thermometer,
    Calendar,
    HelpCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { exportToExcel } from '@/lib/report-export'
import { toast } from 'sonner'

export default function HotLeadsReportPage() {
    const [leads, setLeads] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [scoreFilter, setScoreFilter] = useState('all')
    const [statusFilter, setStatusFilter] = useState('all')
    const [copiedId, setCopiedId] = useState<string | null>(null)

    // Load data
    const loadData = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const data = await getHotLeadsReport()
            setLeads(data || [])
            if (isRefresh) {
                toast.success('Rapor başarıyla güncellendi!')
            }
        } catch (error) {
            console.error('Error fetching hot leads:', error)
            toast.error('Veriler yüklenirken bir hata oluştu!')
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    // Copy to clipboard helper
    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text)
        setCopiedId(id)
        toast.success('Telefon numarası kopyalandı!')
        setTimeout(() => setCopiedId(null), 2000)
    }

    // Filter leads
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

    // Export helper
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

        exportToExcel(exportData, `hot_lead_bildirim_raporu_${new Date().toISOString().slice(0, 10)}`)
        toast.success('Rapor başarıyla Excel (CSV) olarak indirildi!')
    }

    // Compute Metrics
    const totalCount = filteredLeads.length
    const hotCount = filteredLeads.filter(l => l.leadScore === 'hot').length
    const warmCount = filteredLeads.filter(l => l.leadScore === 'warm').length
    const callReqCount = filteredLeads.filter(l => l.leadScore === 'call_requested').length
    const notifiedPercent = totalCount > 0 
        ? Math.round((filteredLeads.filter(l => l.hotLeadNotified === true).length / totalCount) * 100) 
        : 0

    return (
        <div className="space-y-6 md:space-y-8 p-4 md:p-6 max-w-[1600px] mx-auto animate-in fade-in duration-700">
            {/* Header section with Action Buttons */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Flame className="h-10 w-10 text-red-500 animate-pulse" />
                        Sıcak (Hot) Lead Raporu
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium">
                        Meta campaigns, WhatsApp responses, and AI evaluations marking customers as hot, warm, or call requested.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button 
                        variant="outline" 
                        size="lg" 
                        onClick={() => loadData(true)} 
                        disabled={refreshing || loading}
                        className="rounded-2xl border-slate-200 hover:bg-slate-50 h-12 shadow-sm font-semibold gap-2"
                    >
                        <RefreshCw className={`h-4.5 w-4.5 text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
                        Yenile
                    </Button>
                    
                    <Button 
                        size="lg" 
                        onClick={handleExport}
                        disabled={loading || filteredLeads.length === 0}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 px-6 rounded-2xl shadow-lg shadow-blue-500/20 gap-2"
                    >
                        <Download className="h-4.5 w-4.5" />
                        Excel&apos;e Aktar
                    </Button>
                </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-md flex flex-col items-center justify-center min-w-[130px] transition-transform hover:scale-102 duration-300">
                    <Flame className="h-6 w-6 text-red-500 mb-2" />
                    <span className="text-3xl font-black text-slate-900">{hotCount}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 text-center">Sıcak Lead (HOT)</span>
                </div>
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-md flex flex-col items-center justify-center min-w-[130px] transition-transform hover:scale-102 duration-300">
                    <Thermometer className="h-6 w-6 text-orange-500 mb-2" />
                    <span className="text-3xl font-black text-slate-900">{warmCount}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 text-center">Ilık Lead (WARM)</span>
                </div>
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-md flex flex-col items-center justify-center min-w-[130px] transition-transform hover:scale-102 duration-300">
                    <Phone className="h-6 w-6 text-purple-500 mb-2" />
                    <span className="text-3xl font-black text-slate-900">{callReqCount}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 text-center">Arama Talebi</span>
                </div>
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-md flex flex-col items-center justify-center min-w-[130px] transition-transform hover:scale-102 duration-300">
                    <CheckCircle2 className="h-6 w-6 text-emerald-500 mb-2" />
                    <span className="text-3xl font-black text-slate-900">%{notifiedPercent}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 text-center">İletim Başarısı</span>
                </div>
                <div className="col-span-2 md:col-span-1 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 shadow-md flex flex-col items-center justify-center min-w-[130px] transition-transform hover:scale-102 duration-300">
                    <MessageSquare className="h-6 w-6 text-blue-400 mb-2" />
                    <span className="text-3xl font-black">{totalCount}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 text-center">Toplam Listelenen</span>
                </div>
            </div>

            {/* Filter controls card */}
            <Card className="border-none shadow-xl shadow-slate-100/40 rounded-3xl overflow-hidden bg-white/70 backdrop-blur-md">
                <CardContent className="p-6">
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
                                    <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
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
                                    <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
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

            {/* Leads Table Card */}
            <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-3xl overflow-hidden bg-white">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl font-bold text-slate-800">Sıcak Lead Bildirimleri</CardTitle>
                            <CardDescription className="text-sm mt-1">Yöneticilere anlık olarak iletilen sıcak leadler.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {/* Desktop Table View */}
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
                                    <TableHead className="pl-4 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest w-[450px]">Son Mesajlar / Özet</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-64 text-center">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
                                                <span className="text-slate-500 font-bold text-sm">Lead verileri yükleniyor...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredLeads.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-48 text-center text-slate-400 font-semibold text-sm">
                                            Aradığınız kriterlere uygun sıcak lead bulunamadı.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredLeads.map((lead) => {
                                        return (
                                            <TableRow key={lead.id} className="group hover:bg-slate-50/50 transition-colors border-slate-50">
                                                {/* Customer Name & Phone */}
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

                                                {/* Interested Project */}
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

                                                {/* Lead Score */}
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

                                                {/* Notification Status */}
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

                                                {/* Last Updated Time */}
                                                <TableCell className="text-center">
                                                    <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 font-bold">
                                                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                                        {format(new Date(lead.updatedAt), 'd MMM HH:mm', { locale: tr })}
                                                    </div>
                                                </TableCell>

                                                {/* Message Summary */}
                                                <TableCell className="py-4.5 pr-6 pl-4">
                                                    <p className="text-xs text-slate-600 leading-relaxed max-w-[420px] font-medium line-clamp-2" title={lead.summary}>
                                                        {lead.summary}
                                                    </p>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden flex flex-col gap-4 p-4 bg-slate-50/50">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center gap-3 py-10">
                                <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
                                <span className="text-slate-500 font-bold text-sm">Lead verileri yükleniyor...</span>
                            </div>
                        ) : filteredLeads.length === 0 ? (
                            <div className="text-center text-slate-400 font-semibold text-sm py-10">
                                Aradığınız kriterlere uygun sıcak lead bulunamadı.
                            </div>
                        ) : (
                            filteredLeads.map((lead) => (
                                <Card key={`mobile-${lead.id}`} className="overflow-hidden border border-slate-200 shadow-sm">
                                    <CardContent className="p-4 flex flex-col gap-3">
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="flex flex-col gap-1.5 min-w-0">
                                                <span className="font-extrabold text-slate-800 text-[15px] flex items-center gap-1.5 truncate">
                                                    <User className="h-4 w-4 text-slate-400 shrink-0" />
                                                    <span className="truncate">{lead.customerName}</span>
                                                </span>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <a href={`tel:${lead.customerPhone.replace(/\s+/g, '')}`} className="text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md text-sm font-bold tracking-wide flex items-center gap-1.5 shadow-sm border border-blue-100 hover:bg-blue-100 transition-colors">
                                                        <Phone className="h-3.5 w-3.5" />
                                                        {lead.customerPhone}
                                                    </a>
                                                    <button 
                                                        onClick={() => handleCopy(lead.customerPhone, lead.id)}
                                                        className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 bg-slate-100 rounded-md shadow-sm border border-slate-200 hover:bg-slate-200"
                                                    >
                                                        {copiedId === lead.id ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2 items-end shrink-0">
                                                {lead.leadScore === 'hot' && <Badge className="bg-red-50 text-red-600 border-red-200 border text-[10px] px-1.5 py-0"><Flame className="h-3 w-3 mr-0.5" />Sıcak</Badge>}
                                                {lead.leadScore === 'warm' && <Badge className="bg-orange-50 text-orange-600 border-orange-200 border text-[10px] px-1.5 py-0"><Thermometer className="h-3 w-3 mr-0.5" />Ilık</Badge>}
                                                {lead.leadScore === 'call_requested' && <Badge className="bg-purple-50 text-purple-600 border-purple-200 border text-[10px] px-1.5 py-0"><Phone className="h-3 w-3 mr-0.5" />Arama</Badge>}
                                                
                                                {lead.projectName && lead.projectName !== 'Genel' ? (
                                                    <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 border text-[9px] max-w-[80px] truncate block px-1.5 py-0" title={lead.projectName}>{lead.projectName}</Badge>
                                                ) : (
                                                    <Badge className="bg-slate-100 text-slate-500 border-slate-200 border text-[9px] px-1.5 py-0">Genel</Badge>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-1">
                                            <p className="text-[13px] text-slate-600 font-medium line-clamp-3 leading-relaxed">
                                                {lead.summary}
                                            </p>
                                        </div>

                                        <div className="flex justify-between items-center mt-1 border-t border-slate-100 pt-3">
                                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-bold">
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

            {/* Info and Tips */}
            <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-none shadow-xl shadow-slate-200/40 rounded-3xl bg-slate-900 text-white overflow-hidden">
                    <CardHeader className="border-b border-white/5 p-6">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <HelpCircle className="h-5 w-5 text-blue-400" />
                            Bu Rapor Nasıl Oluşur?
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 space-y-4">
                        <p className="text-slate-400 text-sm leading-relaxed font-medium">
                            Bu ekran, Meta reklam formları, web siteleri ve gelen WhatsApp yazışmalarına göre sistem tarafından otomatik skorlanan kişileri listeler.
                        </p>
                        <ul className="grid gap-3">
                            <li className="flex items-center gap-3 text-sm font-semibold">
                                <div className="h-2 w-2 rounded-full bg-blue-500" />
                                <span className="text-slate-300"><strong className="text-white">Arama Talebi:</strong> Kampanya mesajlarına "Evet arayın" yanıtını verenler.</span>
                            </li>
                            <li className="flex items-center gap-3 text-sm font-semibold">
                                <div className="h-2 w-2 rounded-full bg-red-500" />
                                <span className="text-slate-300"><strong className="text-white">Sıcak (HOT) Lead:</strong> Yapay zeka arama sonuçlarında veya yazışmada yüksek satın alma potansiyeli gösterenler.</span>
                            </li>
                            <li className="flex items-center gap-3 text-sm font-semibold">
                                <div className="h-2 w-2 rounded-full bg-orange-500" />
                                <span className="text-slate-300"><strong className="text-white">Ilık (WARM) Lead:</strong> Bilgi almaya istekli, belirli projeleri soran ilgili adaylar.</span>
                            </li>
                        </ul>
                    </CardContent>
                </Card>

                <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-8 flex flex-col justify-between shadow-2xl shadow-indigo-500/20 text-white">
                    <div>
                        <h3 className="text-2xl font-black mb-2 flex items-center gap-2">
                            <Flame className="h-6 w-6 text-amber-300 animate-pulse fill-amber-300" />
                            Anlık Bildirimler Aktif!
                        </h3>
                        <p className="text-indigo-100 text-sm leading-relaxed opacity-95 font-semibold">
                            Tüm Sıcak Lead ve Arama talepleri anlık olarak Hot Lead Yöneticilerine WhatsApp bildirim şablonu ile iletilmektedir.
                            Yukarıdaki listeden "Bekliyor" durumundaki leadlerin bildirimlerini kontrol edebilir ve durum analizi yapabilirsiniz.
                        </p>
                    </div>
                    <div className="pt-8">
                        <Button 
                            onClick={handleExport}
                            className="bg-white text-indigo-700 hover:bg-indigo-50 font-black px-8 py-6 rounded-2xl h-auto shadow-lg shadow-black/10 text-sm"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Güncel Listeyi Excel Olarak İndir
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
