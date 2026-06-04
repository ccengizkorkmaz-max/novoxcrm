'use client'

import { useState } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Users,
    Search,
    ChevronRight,
    MapPin,
    Calendar,
    PlusCircle,
    X,
    Timer
} from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { useTranslations } from 'next-intl'

interface Lead {
    id: string
    full_name: string
    phone: string
    status: string
    created_at: string
    budget_min?: number
    budget_max?: number
    ownership_expires_at?: string
    projects?: { name: string }[] | { name: string } | null
}

export function BrokerLeadsClient({ leads, locale, leadOwnershipDays }: { leads: Lead[]; locale: string; leadOwnershipDays: number }) {
    const t = useTranslations('BrokerLeads')
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<string | null>(null)

    const filteredLeads = leads.filter(lead => {
        const matchesSearch = search.trim() === '' ||
            lead.full_name.toLowerCase().includes(search.toLowerCase()) ||
            lead.phone?.toLowerCase().includes(search.toLowerCase()) ||
            (Array.isArray(lead.projects) ? lead.projects[0]?.name : lead.projects?.name)?.toLowerCase().includes(search.toLowerCase())
        const matchesStatus = !statusFilter || lead.status === statusFilter
        return matchesSearch && matchesStatus
    })

    const statuses = [...new Set(leads.map(l => l.status))]

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Contract Signed': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
            case 'Rejected': return 'bg-red-100 text-red-700 border-red-200'
            case 'Offer Sent': return 'bg-indigo-100 text-indigo-700 border-indigo-200'
            case 'Visit Scheduled': return 'bg-orange-100 text-orange-700 border-orange-200'
            case 'Reserved': return 'bg-amber-100 text-amber-700 border-amber-200'
            case 'Visited': return 'bg-cyan-100 text-cyan-700 border-cyan-200'
            default: return 'bg-blue-50 text-blue-700 border-blue-100'
        }
    }

    const hasFilters = search.trim() !== '' || statusFilter !== null

    return (
        <div className="space-y-5 pb-12">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{t('title')}</h1>
                    <p className="text-slate-500 text-sm">{t('description')}</p>
                </div>
                <Link href="/broker/leads/new">
                    <Button className="bg-blue-600 hover:bg-blue-700 shadow-sm rounded-lg gap-2 h-9">
                        <PlusCircle className="h-4 w-4" />
                        {t('newLead')}
                    </Button>
                </Link>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder={t('searchPlaceholder')}
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
            </div>

            {/* Status filter chips */}
            {statuses.length > 1 && (
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setStatusFilter(null)}
                        className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-all ${
                            !statusFilter ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                        }`}
                    >
                        Tümü ({leads.length})
                    </button>
                    {statuses.map(s => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(statusFilter === s ? null : s)}
                            className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-all ${
                                statusFilter === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                            }`}
                        >
                            {t(`status.${s}`)} ({leads.filter(l => l.status === s).length})
                        </button>
                    ))}
                </div>
            )}

            {/* Filter info */}
            {hasFilters && (
                <div className="flex items-center justify-between px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs">
                    <span className="font-medium">{filteredLeads.length} / {leads.length} kayıt gösteriliyor</span>
                    <button
                        onClick={() => { setSearch(''); setStatusFilter(null) }}
                        className="flex items-center gap-1 text-amber-700 hover:text-red-600 font-medium"
                    >
                        <X className="h-3 w-3" /> Temizle
                    </button>
                </div>
            )}

            {/* Leads List */}
            <div className="grid gap-3">
                {/* Column Headers */}
                {filteredLeads.length > 0 && (
                    <div className="hidden sm:flex items-center px-4 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <div className="flex items-center gap-3 flex-1">
                            <div className="h-10 w-10 shrink-0" />
                            <span>Müşteri</span>
                        </div>
                        <div className="flex items-center gap-3 justify-end">
                            <span className="w-24 text-center">Mülkiyet Süresi</span>
                            <span className="w-24 text-center">CRM Durum</span>
                            <span className="w-4" />
                        </div>
                    </div>
                )}
                {filteredLeads.length > 0 ? (
                    filteredLeads.map((lead) => (
                        <Link key={lead.id} href={`/broker/leads/${lead.id}`}>
                            <Card className="border border-slate-100 shadow-sm hover:shadow-md transition-all rounded-xl overflow-hidden group">
                                <CardContent className="p-0">
                                    <div className="flex flex-col sm:flex-row sm:items-center p-4 gap-3">
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors shrink-0">
                                                {lead.full_name?.charAt(0) || '?'}
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-semibold text-slate-900 leading-tight truncate">{lead.full_name}</h3>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-[11px] text-slate-500 flex items-center gap-1" suppressHydrationWarning>
                                                        <Calendar className="h-3 w-3" />
                                                        {new Date(lead.created_at).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US')}
                                                    </span>
                                                    {(() => {
                                                        const projName = Array.isArray(lead.projects) ? lead.projects[0]?.name : lead.projects?.name
                                                        return projName ? (
                                                            <span className="text-[11px] text-slate-500 flex items-center gap-1">
                                                                <MapPin className="h-3 w-3" />
                                                                {projName}
                                                            </span>
                                                        ) : null
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-3 sm:pt-0">
                                            {(() => {
                                                const createdAt = new Date(lead.created_at)
                                                const now = new Date()
                                                const elapsedMs = now.getTime() - createdAt.getTime()
                                                const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24))
                                                const remainingDays = leadOwnershipDays - elapsedDays
                                                const isExpired = remainingDays <= 0
                                                const isUrgent = remainingDays > 0 && remainingDays <= 7
                                                const isWarning = remainingDays > 7 && remainingDays <= 30
                                                return (
                                                    <span suppressHydrationWarning className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold border ${
                                                        isExpired
                                                            ? 'bg-red-100 text-red-700 border-red-200 animate-pulse'
                                                            : isUrgent
                                                                ? 'bg-red-50 text-red-600 border-red-200'
                                                                : isWarning
                                                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                    }`}>
                                                        <Timer className="h-3 w-3" />
                                                        {isExpired ? 'Süre Doldu' : `${remainingDays} gün`}
                                                    </span>
                                                )
                                            })()}
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusStyle(lead.status)}`}>
                                                {t(`status.${lead.status}`)}
                                            </span>
                                            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))
                ) : (
                    <Card className="border-dashed border-2 border-slate-200 bg-transparent rounded-xl">
                        <CardContent className="p-12 text-center">
                            <Users className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                            <h3 className="text-base font-bold text-slate-900">{hasFilters ? 'Arama kriterine uygun kayıt bulunamadı' : t('emptyLeads')}</h3>
                            <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">{!hasFilters && t('emptyLeadsDesc')}</p>
                            {!hasFilters && (
                                <Link href="/broker/leads/new" className="inline-block mt-5">
                                    <Button className="bg-blue-600 hover:bg-blue-700 rounded-lg h-9">
                                        {t('firstLeadButton')}
                                    </Button>
                                </Link>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
