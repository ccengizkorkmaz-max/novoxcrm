'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { CheckCircle2, XCircle, AlertCircle, RefreshCw, ServerCrash, Search } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

type LogEntry = {
    id: string
    action_type: string
    entity_type: string
    status: 'Success' | 'Error' | 'Warning'
    message: string
    created_at: string
    profiles?: any
    details?: any
}

export function SystemLogsTab({ initialLogs, hasError }: { initialLogs: LogEntry[], hasError?: boolean }) {
    const [filter, setFilter] = useState<'All' | 'Success' | 'Error'>('All')
    const [search, setSearch] = useState('')

    const filteredLogs = initialLogs.filter(log => {
        const matchesFilter = filter === 'All' || log.status === filter
        const matchesSearch = search === '' || 
            log.message.toLowerCase().includes(search.toLowerCase()) || 
            log.action_type.toLowerCase().includes(search.toLowerCase()) ||
            log.entity_type.toLowerCase().includes(search.toLowerCase())
        return matchesFilter && matchesSearch
    })

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Success': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            case 'Error': return <XCircle className="w-4 h-4 text-red-500" />
            case 'Warning': return <AlertCircle className="w-4 h-4 text-amber-500" />
            default: return null
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Success': return <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50">Başarılı</Badge>
            case 'Error': return <Badge variant="outline" className="border-red-200 text-red-700 bg-red-50">Hata</Badge>
            case 'Warning': return <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50">Uyarı</Badge>
            default: return <Badge variant="outline">{status}</Badge>
        }
    }

    if (hasError) {
        return (
            <Card className="border-red-200 shadow-sm">
                <CardContent className="p-12 text-center flex flex-col items-center justify-center space-y-4">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
                        <ServerCrash className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Veritabanı Tablosu Eksik</h3>
                    <p className="text-slate-500 max-w-md">
                        Sistem loglarını görüntüleyebilmek için lütfen <code>20260326_create_system_logs.sql</code> isimli migration dosyasını Supabase panelinden çalıştırın.
                    </p>
                    <Button variant="outline" onClick={() => window.location.reload()}>
                        <RefreshCw className="w-4 h-4 mr-2" /> Yeniden Kontrol Et
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-lg font-bold text-slate-900">İşlem Logları</CardTitle>
                        <CardDescription>Sistem üzerindeki başarılı işlemleri ve hataları buradan takip edebilirsiniz.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <Input 
                                placeholder="Loglarda ara..." 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full md:w-64 pl-9 h-9 border-slate-200"
                            />
                        </div>
                        <select 
                            className="h-9 px-3 py-1 border border-slate-200 bg-white rounded-md text-sm outline-none w-[130px] font-medium"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value as 'All' | 'Success' | 'Error')}
                        >
                            <option value="All">Tüm İşlemler</option>
                            <option value="Success">Sadece Başarılı</option>
                            <option value="Error">Sadece Hatalar</option>
                        </select>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <ScrollArea className="h-[600px]">
                    <Table>
                        <TableHeader className="bg-white sticky top-0 z-10 shadow-sm">
                            <TableRow className="border-slate-100">
                                <TableHead className="w-[180px] font-bold text-slate-500 uppercase text-[10px] tracking-wider">Durum</TableHead>
                                <TableHead className="w-[180px] font-bold text-slate-500 uppercase text-[10px] tracking-wider">Aksiyon</TableHead>
                                <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Mesaj</TableHead>
                                <TableHead className="w-[150px] font-bold text-slate-500 uppercase text-[10px] tracking-wider">Kullanıcı</TableHead>
                                <TableHead className="w-[150px] text-right font-bold text-slate-500 uppercase text-[10px] tracking-wider">Tarih</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredLogs.length > 0 ? (
                                filteredLogs.map((log) => (
                                    <TableRow key={log.id} className="hover:bg-slate-50 transition-colors">
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(log.status)}
                                                {getStatusBadge(log.status)}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-800 text-xs">{log.action_type}</span>
                                                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{log.entity_type}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm text-slate-600 font-medium">{log.message}</span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs text-slate-500 font-medium">
                                                {(Array.isArray(log.profiles) ? log.profiles[0]?.full_name : log.profiles?.full_name) || log.details?.user_name || 'Sistem'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="text-xs font-bold text-slate-600">
                                                    {format(new Date(log.created_at), 'dd MMM yyyy', { locale: tr })}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-medium">
                                                    {format(new Date(log.created_at), 'HH:mm')}
                                                </span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-slate-400 font-medium">
                                        Seçilen kritere uygun log bulunamadı.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}
