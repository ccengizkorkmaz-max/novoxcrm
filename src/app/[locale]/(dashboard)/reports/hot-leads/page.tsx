'use client'

import React, { useState, useEffect } from 'react'
import { getOutreachWorkflowsList, getCampaignPerformanceReport } from '../actions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
    Download, 
    RefreshCw, 
    Search, 
    MessageSquare, 
    Phone, 
    User, 
    Copy, 
    Check, 
    Flame, 
    Thermometer,
    Calendar,
    Megaphone,
    PhoneOff,
    Clock,
    UserCheck
} from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { exportToExcel } from '@/lib/report-export'
import { toast } from 'sonner'
import ShareHotLeadsButton from './ShareHotLeadsButton'

export default function HotLeadsReportPage() {
    const [workflows, setWorkflows] = useState<any[]>([])
    const [selectedWorkflow, setSelectedWorkflow] = useState<string>('')
    const [leads, setLeads] = useState<any[]>([])
    const [stats, setStats] = useState({ total: 0, callRequested: 0, optedOut: 0, noResponse: 0, hot: 0, warm: 0 })
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [responseFilter, setResponseFilter] = useState('all')
    const [copiedId, setCopiedId] = useState<string | null>(null)

    // Load workflows on mount
    useEffect(() => {
        loadWorkflows()
    }, [])

    // Load campaign data when workflow changes
    useEffect(() => {
        if (selectedWorkflow) {
            loadCampaignData()
        }
    }, [selectedWorkflow])

    const loadWorkflows = async () => {
        try {
            const data = await getOutreachWorkflowsList()
            setWorkflows(data || [])
            if (data && data.length > 0) {
                setSelectedWorkflow(data[0].id)
            } else {
                setLoading(false)
            }
        } catch (error) {
            console.error('Error loading workflows:', error)
            setLoading(false)
        }
    }

    const loadCampaignData = async (isRefresh = false) => {
        if (!selectedWorkflow) return
        if (isRefresh) setRefreshing(true)
        else setLoading(true)

        try {
            const result = await getCampaignPerformanceReport(selectedWorkflow)
            setLeads(result.leads || [])
            setStats(result.stats)
            if (isRefresh) {
                toast.success('Rapor başarıyla güncellendi!')
            }
        } catch (error) {
            console.error('Error fetching campaign data:', error)
            toast.error('Veriler yüklenirken bir hata oluştu!')
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    const handleCopy = (phone: string, id: string) => {
        navigator.clipboard.writeText(phone.replace(/\s+/g, ''))
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
    }

    const filteredLeads = leads.filter(lead => {
        const query = searchTerm.toLowerCase()
        const queryDigits = query.replace(/[\s+\-()]/g, '')
        const phoneDigits = (lead.customerPhone || '').replace(/[\s+\-()]/g, '')
        const matchesSearch = !searchTerm || 
            lead.customerName?.toLowerCase().includes(query) ||
            phoneDigits.includes(queryDigits) ||
            lead.customerPhone?.includes(query) ||
            lead.assignedTo?.toLowerCase().includes(query)

        const matchesResponse = responseFilter === 'all' || lead.responseStatus === responseFilter

        return matchesSearch && matchesResponse
    })

    const handleExport = () => {
        const selectedWf = workflows.find(w => w.id === selectedWorkflow)
        const exportData = filteredLeads.map(lead => ({
            'Müşteri Adı': lead.customerName,
            'Telefon': lead.customerPhone,
            'Yanıt Durumu': getResponseLabel(lead.responseStatus),
            'Temsilci': lead.assignedTo || '—',
            'Satış Durumu': lead.saleStatus || '—',
            'Gönderim Tarihi': lead.startedAt ? format(new Date(lead.startedAt), 'dd.MM.yyyy HH:mm', { locale: tr }) : '—',
        }))

        exportToExcel(exportData, `kampanya_raporu_${selectedWf?.name?.replace(/\s+/g, '_') || 'genel'}_${new Date().toISOString().slice(0, 10)}`)
        toast.success('Rapor başarıyla Excel (CSV) olarak indirildi!')
    }

    const getResponseLabel = (status: string) => {
        const labels: Record<string, string> = {
            call_requested: '📞 Arama Talebi',
            opted_out: '🚫 Reddetti',
            hot: '🔥 Sıcak',
            warm: '🍊 Ilık',
            no_response: '⏳ Cevapsız',
        }
        return labels[status] || status
    }

    const selectedWf = workflows.find(w => w.id === selectedWorkflow)
    const respondedCount = stats.callRequested + stats.optedOut + stats.hot + stats.warm
    const responseRate = stats.total > 0 ? Math.round((respondedCount / stats.total) * 100) : 0

    return (
        <div className="space-y-4 md:space-y-8 p-2 md:p-6 max-w-[1600px] mx-auto animate-in fade-in duration-700 w-full overflow-x-hidden">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Megaphone className="h-10 w-10 text-blue-500" />
                        Kampanya Performans Raporu
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium">
                        Kampanya bazlı müşteri yanıt durumları ve arama talepleri
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <ShareHotLeadsButton />
                    <Button 
                        variant="outline" 
                        size="lg" 
                        onClick={() => loadCampaignData(true)} 
                        disabled={refreshing || loading || !selectedWorkflow}
                        className="rounded-2xl border-slate-200 hover:bg-slate-50 h-11 md:h-12 shadow-sm font-semibold gap-2 text-xs md:text-sm"
                    >
                        <RefreshCw className={`h-4 w-4 text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
                        Yenile
                    </Button>
                    <Button 
                        size="lg" 
                        onClick={handleExport}
                        disabled={loading || filteredLeads.length === 0}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 md:h-12 px-4 md:px-6 rounded-2xl shadow-lg shadow-blue-500/20 gap-2 text-xs md:text-sm"
                    >
                        <Download className="h-4 w-4" />
                        Excel&apos;e Aktar
                    </Button>
                </div>
            </div>

            {/* Campaign Selector */}
            <Card className="border-none shadow-xl shadow-slate-100/40 rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 to-slate-800 text-white">
                <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <div className="flex items-center gap-3 shrink-0">
                            <Megaphone className="h-5 w-5 text-blue-400" />
                            <span className="font-bold text-sm text-slate-300">Kampanya Seç:</span>
                        </div>
                        <Select value={selectedWorkflow} onValueChange={setSelectedWorkflow}>
                            <SelectTrigger className="h-12 border-slate-600 rounded-2xl bg-slate-800/50 text-white font-semibold text-sm w-full md:max-w-lg">
                                <SelectValue placeholder="Kampanya seçiniz..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-slate-200 shadow-xl max-h-72">
                                {workflows.map(wf => (
                                    <SelectItem key={wf.id} value={wf.id}>
                                        <div className="flex items-center gap-2">
                                            <span className={`h-2 w-2 rounded-full ${wf.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                            <span>{wf.name}</span>
                                            <span className="text-slate-400 text-xs ml-1">
                                                ({format(new Date(wf.created_at), 'd MMM yyyy', { locale: tr })})
                                            </span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {selectedWf && (
                            <Badge className={`${selectedWf.is_active ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-600/30 text-slate-400 border-slate-500/30'} border text-xs font-bold`}>
                                {selectedWf.is_active ? '● Aktif' : '○ Pasif'}
                            </Badge>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 md:gap-4">
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-3 md:p-6 shadow-md flex flex-col items-center justify-center min-w-0 w-full transition-transform hover:scale-[1.02] duration-300">
                    <MessageSquare className="h-5 w-5 md:h-6 md:w-6 text-blue-400 mb-1 md:mb-2" />
                    <span className="text-2xl md:text-3xl font-black">{stats.total}</span>
                    <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 text-center">Gönderildi</span>
                </div>
                <div className="bg-white rounded-3xl p-3 md:p-6 border border-purple-100 shadow-md flex flex-col items-center justify-center min-w-0 w-full transition-transform hover:scale-[1.02] duration-300 ring-2 ring-purple-200/50">
                    <Phone className="h-5 w-5 md:h-6 md:w-6 text-purple-500 mb-1 md:mb-2" />
                    <span className="text-2xl md:text-3xl font-black text-purple-700">{stats.callRequested}</span>
                    <span className="text-[9px] md:text-[10px] font-bold text-purple-400 uppercase tracking-widest mt-1 text-center">Arama Talebi</span>
                </div>
                <div className="bg-white rounded-3xl p-3 md:p-6 border border-red-100 shadow-md flex flex-col items-center justify-center min-w-0 w-full transition-transform hover:scale-[1.02] duration-300">
                    <Flame className="h-5 w-5 md:h-6 md:w-6 text-red-500 mb-1 md:mb-2" />
                    <span className="text-2xl md:text-3xl font-black text-slate-900">{stats.hot}</span>
                    <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 text-center">Sıcak</span>
                </div>
                <div className="bg-white rounded-3xl p-3 md:p-6 border border-orange-100 shadow-md flex flex-col items-center justify-center min-w-0 w-full transition-transform hover:scale-[1.02] duration-300">
                    <Thermometer className="h-5 w-5 md:h-6 md:w-6 text-orange-500 mb-1 md:mb-2" />
                    <span className="text-2xl md:text-3xl font-black text-slate-900">{stats.warm}</span>
                    <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 text-center">Ilık</span>
                </div>
                <div className="bg-white rounded-3xl p-3 md:p-6 border border-slate-100 shadow-md flex flex-col items-center justify-center min-w-0 w-full transition-transform hover:scale-[1.02] duration-300">
                    <PhoneOff className="h-5 w-5 md:h-6 md:w-6 text-rose-400 mb-1 md:mb-2" />
                    <span className="text-2xl md:text-3xl font-black text-slate-900">{stats.optedOut}</span>
                    <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 text-center">Reddetti</span>
                </div>
                <div className="bg-white rounded-3xl p-3 md:p-6 border border-slate-100 shadow-md flex flex-col items-center justify-center min-w-0 w-full transition-transform hover:scale-[1.02] duration-300">
                    <Clock className="h-5 w-5 md:h-6 md:w-6 text-slate-400 mb-1 md:mb-2" />
                    <span className="text-2xl md:text-3xl font-black text-slate-900">{stats.noResponse}</span>
                    <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 text-center">Cevapsız</span>
                </div>
            </div>

            {/* Response Rate Bar */}
            {stats.total > 0 && (
                <div className="bg-white rounded-3xl p-4 md:p-6 border border-slate-100 shadow-md">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-bold text-slate-700">Yanıt Oranı</span>
                        <span className="text-sm font-black text-slate-900">%{responseRate} ({respondedCount}/{stats.total})</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 transition-all duration-1000 ease-out" style={{ width: `${responseRate}%` }} />
                    </div>
                    <div className="flex gap-4 mt-3 flex-wrap">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                            <div className="h-2.5 w-2.5 rounded-full bg-purple-500" />
                            Arama: {stats.callRequested}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                            <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                            Sıcak: {stats.hot}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                            <div className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                            Ilık: {stats.warm}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                            <div className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                            Red: {stats.optedOut}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                            <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                            Cevapsız: {stats.noResponse}
                        </div>
                    </div>
                </div>
            )}

            {/* Filter & Search */}
            <Card className="border-none shadow-xl shadow-slate-100/40 rounded-3xl overflow-hidden bg-white/70 backdrop-blur-md w-full">
                <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col lg:flex-row gap-4 items-center">
                        <div className="relative w-full lg:flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                            <Input 
                                type="text" 
                                placeholder="Müşteri adı, telefon veya temsilci ara..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-11 h-12 bg-white/50 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-2xl w-full text-slate-800 placeholder-slate-400 text-sm font-medium"
                            />
                        </div>
                        <div className="w-full lg:w-[250px]">
                            <Select value={responseFilter} onValueChange={setResponseFilter}>
                                <SelectTrigger className="h-12 border-slate-200 rounded-2xl bg-white/50 text-slate-700 font-semibold text-sm">
                                    <SelectValue placeholder="Yanıt Durumu" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                                    <SelectItem value="all">Tüm Durumlar</SelectItem>
                                    <SelectItem value="call_requested">📞 Arama Talebi</SelectItem>
                                    <SelectItem value="hot">🔥 Sıcak</SelectItem>
                                    <SelectItem value="warm">🍊 Ilık</SelectItem>
                                    <SelectItem value="opted_out">🚫 Reddetti</SelectItem>
                                    <SelectItem value="no_response">⏳ Cevapsız</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Leads Table */}
            <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-3xl overflow-hidden bg-white w-full">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-4 py-4 md:px-8 md:py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl font-bold text-slate-800">Kampanya Sonuçları</CardTitle>
                            <CardDescription className="text-sm mt-1">
                                {selectedWf?.name || 'Kampanya seçin'} — {filteredLeads.length} kayıt
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent bg-slate-50/30 border-slate-100">
                                    <TableHead className="pl-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Müşteri</TableHead>
                                    <TableHead className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Yanıt Durumu</TableHead>
                                    <TableHead className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Temsilci</TableHead>
                                    <TableHead className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Satış Durumu</TableHead>
                                    <TableHead className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Gönderim</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-64 text-center">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
                                                <span className="text-slate-500 font-bold text-sm">Kampanya verileri yükleniyor...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : !selectedWorkflow ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-48 text-center text-slate-400 font-semibold text-sm">
                                            <Megaphone className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                                            Yukarıdan bir kampanya seçin.
                                        </TableCell>
                                    </TableRow>
                                ) : filteredLeads.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-48 text-center text-slate-400 font-semibold text-sm">
                                            Bu kampanyada henüz kayıt bulunmuyor.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredLeads.map((lead) => (
                                        <TableRow key={lead.id} className="group hover:bg-slate-50/50 transition-colors border-slate-50">
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
                                                            {copiedId === lead.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {lead.responseStatus === 'call_requested' && (
                                                    <Badge className="bg-purple-50 hover:bg-purple-50 text-purple-600 border-purple-200/50 px-3 py-1 rounded-full font-black text-xs gap-1 border animate-pulse">
                                                        <Phone className="h-3 w-3" />Arama Talebi
                                                    </Badge>
                                                )}
                                                {lead.responseStatus === 'hot' && (
                                                    <Badge className="bg-red-50 hover:bg-red-50 text-red-600 border-red-200/50 px-3 py-1 rounded-full font-black text-xs gap-1 border">
                                                        <Flame className="h-3 w-3 fill-red-500" />Sıcak
                                                    </Badge>
                                                )}
                                                {lead.responseStatus === 'warm' && (
                                                    <Badge className="bg-orange-50 hover:bg-orange-50 text-orange-600 border-orange-200/50 px-3 py-1 rounded-full font-black text-xs gap-1 border">
                                                        <Thermometer className="h-3 w-3" />Ilık
                                                    </Badge>
                                                )}
                                                {lead.responseStatus === 'opted_out' && (
                                                    <Badge className="bg-rose-50 hover:bg-rose-50 text-rose-600 border-rose-200/50 px-3 py-1 rounded-full font-black text-xs gap-1 border">
                                                        <PhoneOff className="h-3 w-3" />Reddetti
                                                    </Badge>
                                                )}
                                                {lead.responseStatus === 'no_response' && (
                                                    <Badge className="bg-slate-100 hover:bg-slate-100 text-slate-500 border-slate-200/50 px-3 py-1 rounded-full font-bold text-xs gap-1 border">
                                                        <Clock className="h-3 w-3" />Cevapsız
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {lead.assignedTo ? (
                                                    <Badge className="bg-blue-50 hover:bg-blue-50 text-blue-700 border-blue-200/50 font-bold text-xs gap-1 border px-2.5 py-1 rounded-full">
                                                        <UserCheck className="h-3 w-3" />{lead.assignedTo}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-slate-400 text-xs font-medium">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {lead.saleStatus ? (
                                                    <Badge className="bg-slate-100 text-slate-600 border-none font-bold text-xs">{lead.saleStatus}</Badge>
                                                ) : (
                                                    <span className="text-slate-400 text-xs font-medium">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 font-bold">
                                                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                                    {lead.startedAt ? format(new Date(lead.startedAt), 'd MMM HH:mm', { locale: tr }) : '—'}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden flex flex-col gap-3 p-2 bg-slate-50/50 w-full overflow-x-hidden">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center gap-3 py-10">
                                <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
                                <span className="text-slate-500 font-bold text-sm">Kampanya verileri yükleniyor...</span>
                            </div>
                        ) : !selectedWorkflow ? (
                            <div className="text-center text-slate-400 font-semibold text-sm py-10">
                                <Megaphone className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                                Yukarıdan bir kampanya seçin.
                            </div>
                        ) : filteredLeads.length === 0 ? (
                            <div className="text-center text-slate-400 font-semibold text-sm py-10">
                                Bu kampanyada henüz kayıt bulunmuyor.
                            </div>
                        ) : (
                            filteredLeads.map((lead) => (
                                <Card key={`mobile-${lead.id}`} className="overflow-hidden border border-slate-200 shadow-sm w-full bg-white">
                                    <CardContent className="p-3 flex flex-col gap-2.5">
                                        <div className="flex justify-between items-center gap-2">
                                            <span className="font-extrabold text-slate-800 text-[14px] flex items-center gap-1.5 min-w-0 flex-1">
                                                <User className="h-4 w-4 text-slate-400 shrink-0" />
                                                <span className="truncate">{lead.customerName}</span>
                                            </span>
                                            <div className="shrink-0">
                                                {lead.responseStatus === 'call_requested' && <Badge className="bg-purple-50 text-purple-600 border-purple-200 border text-[9px] px-1.5 py-0.5 animate-pulse"><Phone className="h-3 w-3 mr-0.5" />Arama</Badge>}
                                                {lead.responseStatus === 'hot' && <Badge className="bg-red-50 text-red-600 border-red-200 border text-[9px] px-1.5 py-0.5"><Flame className="h-3 w-3 mr-0.5 fill-red-500" />Sıcak</Badge>}
                                                {lead.responseStatus === 'warm' && <Badge className="bg-orange-50 text-orange-600 border-orange-200 border text-[9px] px-1.5 py-0.5"><Thermometer className="h-3 w-3 mr-0.5" />Ilık</Badge>}
                                                {lead.responseStatus === 'opted_out' && <Badge className="bg-rose-50 text-rose-600 border-rose-200 border text-[9px] px-1.5 py-0.5"><PhoneOff className="h-3 w-3 mr-0.5" />Red</Badge>}
                                                {lead.responseStatus === 'no_response' && <Badge className="bg-slate-100 text-slate-500 border-slate-200 border text-[9px] px-1.5 py-0.5"><Clock className="h-3 w-3 mr-0.5" />Cevapsız</Badge>}
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center gap-2">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <a href={`tel:${lead.customerPhone.replace(/\s+/g, '')}`} className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md text-xs font-bold tracking-wide flex items-center gap-1 shadow-sm border border-blue-100">
                                                    <Phone className="h-3 w-3" />{lead.customerPhone}
                                                </a>
                                                <button 
                                                    onClick={() => handleCopy(lead.customerPhone, lead.id)}
                                                    className="text-slate-400 hover:text-slate-600 p-1 bg-slate-100 rounded-md border border-slate-200"
                                                    title="Kopyala"
                                                >
                                                    {copiedId === lead.id ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                                                </button>
                                            </div>
                                            {lead.assignedTo && (
                                                <Badge className="bg-blue-50 text-blue-700 border-blue-200 border text-[9px] px-1.5 py-0.5">
                                                    <UserCheck className="h-3 w-3 mr-0.5" />{lead.assignedTo}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center border-t border-slate-100 pt-2">
                                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold">
                                                <Calendar className="h-3.5 w-3.5" />
                                                {lead.startedAt ? format(new Date(lead.startedAt), 'd MMM HH:mm', { locale: tr }) : '—'}
                                            </div>
                                            {lead.saleStatus && (
                                                <Badge className="bg-slate-100 text-slate-600 border-none text-[9px]">{lead.saleStatus}</Badge>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
