'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { updateQualificationStatus, addCallNote, convertToSale } from '../actions'
import { Calendar, Check, Clock, FileText, Info, Phone, PhoneMissed, X, Building2, User, LayoutGrid, List, Table, Undo2, MessageSquareText } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

const STATUSES = [
    { id: 'new', label: 'Yeni', icon: FileText, color: 'bg-emerald-100 text-emerald-700', border: 'border-emerald-200' },
    { id: 'contacted', label: 'Arandı', icon: Phone, color: 'bg-blue-100 text-blue-700', border: 'border-blue-200' },
    { id: 'follow_up', label: 'Takipte', icon: Calendar, color: 'bg-amber-100 text-amber-700', border: 'border-amber-200' },
    { id: 'unreachable', label: 'Ulaşılamadı', icon: PhoneMissed, color: 'bg-orange-100 text-orange-700', border: 'border-orange-200' },
    { id: 'disqualified', label: 'Elendi', icon: X, color: 'bg-red-100 text-red-700', border: 'border-red-200' },
    { id: 'qualified', label: 'Nitelikli', icon: Check, color: 'bg-green-100 text-green-700', border: 'border-green-200' }
]

export default function QualificationBoard({ initialData, totalCount, currentPage = 1, pageSize = 100, statusCounts = {}, projects = [], availableUnits = [] }: { initialData: any[], totalCount: number, currentPage?: number, pageSize?: number, statusCounts?: Record<string, number>, projects?: any[], availableUnits?: any[] }) {
    const [qualifications, setQualifications] = useState(initialData)
    const [selectedQual, setSelectedQual] = useState<any>(null)
    const [viewMode, setViewMode] = useState<'kanban' | 'rapid' | 'table'>('rapid')
    
    // Rapid View specific state
    const [rapidFilterStatus, setRapidFilterStatus] = useState<string>('all')
    const [searchQuery, setSearchQuery] = useState('')
    
    // Dialog states
    const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false)
    const [isDisqualifyDialogOpen, setIsDisqualifyDialogOpen] = useState(false)
    const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
    const [isQualifyDialogOpen, setIsQualifyDialogOpen] = useState(false)
    
    // Form states
    const [note, setNote] = useState('')
    const [nextStatus, setNextStatus] = useState('contacted')
    const [disqualifyReason, setDisqualifyReason] = useState('')
    const [selectedProject, setSelectedProject] = useState('')
    const [selectedUnit, setSelectedUnit] = useState('')

    // Drag & Drop
    const handleDragStart = (e: React.DragEvent, qualId: string) => {
        e.dataTransfer.setData('qualId', qualId)
    }

    const handleDrop = async (e: React.DragEvent, statusId: string) => {
        e.preventDefault()
        const qualId = e.dataTransfer.getData('qualId')
        if (!qualId) return
        
        const qual = qualifications.find(q => q.id === qualId)
        if (!qual || qual.status === statusId) return

        if (statusId === 'qualified') {
            handleAction(qual, 'qualify')
        } else if (statusId === 'disqualified') {
            handleAction(qual, 'disqualify')
        } else {
            setQualifications(prev => prev.map(q => q.id === qualId ? { ...q, status: statusId } : q))
            const promise = updateQualificationStatus(qualId, statusId)
            toast.promise(promise, {
                loading: 'Durum güncelleniyor...',
                success: 'Durum güncellendi',
                error: 'Güncelleme başarısız'
            })
        }
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
    }

    const handleAction = async (qual: any, action: 'note' | 'disqualify' | 'qualify' | 'details') => {
        setSelectedQual(qual)
        if (action === 'details') {
            setIsDetailsDialogOpen(true)
        } else if (action === 'note') {
            setNote('')
            setNextStatus('contacted')
            setIsNoteDialogOpen(true)
        } else if (action === 'disqualify') {
            setDisqualifyReason('')
            setIsDisqualifyDialogOpen(true)
        } else if (action === 'qualify') {
            setSelectedProject(qual.project_id || '')
            setSelectedUnit('')
            setIsQualifyDialogOpen(true)
        }
    }

    const submitQualify = async () => {
        if (!selectedQual || !selectedProject) return
        
        const promise = convertToSale(selectedQual.id, selectedProject, selectedUnit === 'none' ? null : (selectedUnit || null))
        toast.promise(promise, {
            loading: 'Satış hunisine aktarılıyor...',
            success: (data) => {
                if (data.error) throw new Error(data.error)
                setQualifications(prev => prev.map(q => q.id === selectedQual.id ? { ...q, status: 'qualified', sale_id: data.saleId, project_id: selectedProject } : q))
                setIsQualifyDialogOpen(false)
                
                // Rapid view optimizasyonu: İşlem bitince bir sonraki karta geç
                if (viewMode === 'rapid') {
                    const currentIndex = filteredRapidItems.findIndex(q => q.id === selectedQual.id)
                    if (currentIndex >= 0 && currentIndex < filteredRapidItems.length - 1) {
                        setSelectedQual(filteredRapidItems[currentIndex + 1])
                    }
                }
                
                return 'Başarıyla satış hunisine aktarıldı!'
            },
            error: (err) => err.message || 'Aktarım başarısız oldu'
        })
    }

    const submitNote = async () => {
        if (!selectedQual || !note) return
        
        const promise = addCallNote(selectedQual.id, selectedQual.customer_id, note, nextStatus)
        toast.promise(promise, {
            loading: 'Not kaydediliyor...',
            success: (data) => {
                if (data.error) throw new Error(data.error)
                setQualifications(prev => prev.map(q => q.id === selectedQual.id ? { 
                    ...q, 
                    call_notes: note, 
                    status: nextStatus,
                    last_call_at: new Date().toISOString()
                } : q))
                setIsNoteDialogOpen(false)
                
                if (viewMode === 'rapid') {
                    const currentIndex = filteredRapidItems.findIndex(q => q.id === selectedQual.id)
                    if (currentIndex >= 0 && currentIndex < filteredRapidItems.length - 1) {
                        setSelectedQual(filteredRapidItems[currentIndex + 1])
                    }
                }
                
                return 'Görüşme notu kaydedildi'
            },
            error: 'Not kaydedilemedi'
        })
    }

    const submitDisqualify = async () => {
        if (!selectedQual || !disqualifyReason) return
        
        const promise = updateQualificationStatus(selectedQual.id, 'disqualified', disqualifyReason)
        toast.promise(promise, {
            loading: 'Lead eleniyor...',
            success: (data) => {
                if (data.error) throw new Error(data.error)
                setQualifications(prev => prev.map(q => q.id === selectedQual.id ? { 
                    ...q, 
                    status: 'disqualified',
                    disqualify_reason: disqualifyReason
                } : q))
                setIsDisqualifyDialogOpen(false)
                
                if (viewMode === 'rapid') {
                    const currentIndex = filteredRapidItems.findIndex(q => q.id === selectedQual.id)
                    if (currentIndex >= 0 && currentIndex < filteredRapidItems.length - 1) {
                        setSelectedQual(filteredRapidItems[currentIndex + 1])
                    }
                }
                
                return 'Lead başarıyla elendi'
            },
            error: 'İşlem başarısız'
        })
    }

    const columns = STATUSES.map(status => ({
        ...status,
        items: qualifications.filter(q => q.status === status.id)
    }))

    // Rapid View Filtreleme
    const filteredRapidItems = qualifications.filter(q => {
        if (rapidFilterStatus !== 'all' && q.status !== rapidFilterStatus) return false
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            return (
                q.customers?.full_name?.toLowerCase().includes(query) ||
                q.customers?.phone?.includes(query) ||
                q.call_notes?.toLowerCase().includes(query)
            )
        }
        return true
    })

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-2 border rounded-xl shadow-sm">
                <div className="flex items-center bg-slate-100 rounded-lg p-1 w-full sm:w-auto">
                    <button 
                        onClick={() => setViewMode('kanban')}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'kanban' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                        <LayoutGrid className="w-4 h-4" /> Kanban Panosu
                    </button>
                    <button 
                        onClick={() => setViewMode('rapid')}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'rapid' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                        <List className="w-4 h-4" /> Hızlı Çalışma Listesi
                    </button>
                    <button 
                        onClick={() => setViewMode('table')}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'table' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                        <Table className="w-4 h-4" /> Liste Görünümü
                    </button>
                </div>
                
                <div className="flex items-center gap-2 px-2 text-sm text-slate-500">
                    <p>Toplam <span className="font-bold text-slate-900">{totalCount}</span> kayıttan <span className="font-bold text-slate-900">{qualifications.length}</span> tanesi gösteriliyor.</p>
                </div>
            </div>
            
            {viewMode === 'kanban' ? (
                <>
                    {/* Board Header Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                        {columns.map(col => (
                            <div key={col.id} className={`p-3 rounded-xl border ${col.border} ${col.color} bg-opacity-50 flex flex-col items-center justify-center`}>
                                <div className="flex items-center gap-1.5 font-semibold text-sm mb-1">
                                    <col.icon className="w-4 h-4" />
                                    {col.label}
                                </div>
                                <span className="text-2xl font-black">{col.items.length}</span>
                            </div>
                        ))}
                    </div>

                    {/* Kanban Columns */}
                    <div className="flex-1 overflow-x-auto pb-4">
                        <div className="flex gap-4 min-w-max h-full">
                            {columns.map(col => (
                                <div 
                                    key={col.id} 
                                    className="min-w-[260px] w-[260px] flex flex-col bg-slate-50/50 rounded-xl border border-slate-200 transition-colors hover:bg-slate-50"
                                    onDrop={(e) => handleDrop(e, col.id)}
                                    onDragOver={handleDragOver}
                                >
                                    <div className={`p-3 border-b border-slate-200 flex items-center justify-between bg-white rounded-t-xl`}>
                                        <div className="flex items-center gap-2 font-semibold text-slate-700">
                                            <div className={`w-2 h-2 rounded-full ${col.color.split(' ')[0]}`} />
                                            {col.label}
                                        </div>
                                        <Badge variant="secondary" className="bg-slate-100">{col.items.length}</Badge>
                                    </div>
                                    
                                    <div className="flex-1 p-2 overflow-y-auto space-y-2 max-h-[calc(100vh-300px)]">
                                        {col.items.map(qual => (
                                            <Card 
                                                key={qual.id} 
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, qual.id)}
                                                onClick={(e) => {
                                                    if ((e.target as HTMLElement).tagName !== 'BUTTON' && !(e.target as HTMLElement).closest('button')) {
                                                        handleAction(qual, 'details');
                                                    }
                                                }}
                                                className="p-3 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-grab active:cursor-grabbing flex flex-col gap-2"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                                                        {qual.customers?.full_name}
                                                    </div>
                                                    {qual.customers?.customer_number && (
                                                        <Badge variant="outline" className="text-[10px] px-1 py-0">{qual.customers.customer_number}</Badge>
                                                    )}
                                                </div>
                                                
                                                <div className="flex flex-col gap-1 text-xs text-slate-500">
                                                    {qual.customers?.phone && (
                                                        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                                                            <Phone className="w-3 h-3" />
                                                            <a href={`tel:${qual.customers.phone}`} className="hover:text-blue-600 hover:underline">{qual.customers.phone}</a>
                                                        </div>
                                                    )}
                                                    {qual.projects?.name ? (
                                                        <div className="flex items-center gap-1.5 text-indigo-600 font-medium">
                                                            <Building2 className="w-3 h-3" />
                                                            <span className="truncate">{qual.projects.name}</span>
                                                        </div>
                                                    ) : qual.campaign_name && qual.source !== 'meta_ads' ? (
                                                        <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                                                            <Info className="w-3 h-3" />
                                                            <span className="truncate">{qual.campaign_name}</span>
                                                        </div>
                                                    ) : null}
                                                    {qual.source === 'meta_ads' && (
                                                        <div className="flex flex-col gap-1 mt-1 p-1.5 bg-blue-50/50 rounded border border-blue-100">
                                                            <div className="flex items-center gap-1 text-blue-700 font-semibold text-[10px]">
                                                                <Info className="w-3 h-3" /> Meta Reklamı
                                                            </div>
                                                            <div className="text-[9px] text-blue-600 truncate" title={qual.campaign_name || qual.customers?.notes || 'Bilinmeyen Kampanya'}>
                                                                {qual.campaign_name || qual.customers?.notes || 'Detay bulunamadı'}
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-1.5 justify-between mt-1 pt-1 border-t border-slate-100">
                                                        <span className="flex items-center gap-1 text-[10px]"><Clock className="w-3 h-3" /> {new Date(qual.customers?.created_at || qual.created_at).toLocaleDateString('tr-TR')}</span>
                                                        {(qual.customers?.source || qual.source) && (
                                                            <Badge variant="secondary" className="text-[9px] px-1 py-0">{qual.customers?.source || qual.source}</Badge>
                                                        )}
                                                    </div>
                                                </div>

                                                {qual.call_notes && (
                                                    <div className="mt-1 text-xs bg-amber-50 text-amber-800 p-2 rounded border border-amber-100 line-clamp-2" title={qual.call_notes}>
                                                        📝 {qual.call_notes}
                                                    </div>
                                                )}
                                                
                                                {qual.disqualify_reason && (
                                                    <div className="mt-1 text-xs bg-red-50 text-red-800 p-2 rounded border border-red-100">
                                                        🚫 {qual.disqualify_reason}
                                                    </div>
                                                )}

                                                <div className="pt-2 mt-1 border-t border-slate-100 flex gap-1.5 flex-wrap">
                                                    {col.id !== 'qualified' && col.id !== 'disqualified' && (
                                                        <>
                                                            <Button size="sm" variant="outline" className="h-7 text-xs flex-1 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" onClick={(e) => { e.stopPropagation(); handleAction(qual, 'note'); }}>
                                                                <Phone className="w-3 h-3 mr-1" /> Ara/Not
                                                            </Button>
                                                            <Button size="sm" variant="outline" className="h-7 w-7 p-0 text-red-600 border-red-200 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); handleAction(qual, 'disqualify'); }} title="Ele">
                                                                <X className="w-3 h-3" />
                                                            </Button>
                                                            <Button size="sm" variant="default" className="h-7 w-7 p-0 bg-green-600 hover:bg-green-700" onClick={(e) => { e.stopPropagation(); handleAction(qual, 'qualify'); }} title="Satışa Aktar">
                                                                <Check className="w-3 h-3" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </Card>
                                        ))}
                                        {col.items.length === 0 && (
                                            <div className="h-20 flex items-center justify-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                                                Bu aşamada kayıt yok.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            ) : viewMode === 'rapid' ? (
                <div className="flex-1 flex overflow-hidden border rounded-xl shadow-sm bg-white">
                    {/* Rapid View - Left Sidebar */}
                    <div className="w-1/3 flex flex-col border-r bg-slate-50/30">
                        <div className="p-3 border-b space-y-3 bg-white">
                            <div className="relative">
                                <input 
                                    type="text" 
                                    placeholder="İsim, telefon veya notlarda ara..." 
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex overflow-x-auto gap-1 pb-1 snap-x scrollbar-hide">
                                <button 
                                    onClick={() => setRapidFilterStatus('all')}
                                    className={`snap-start whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium transition-colors ${rapidFilterStatus === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                    Tümü ({qualifications.length})
                                </button>
                                {STATUSES.map(s => {
                                    const count = qualifications.filter(q => q.status === s.id).length
                                    return (
                                        <button 
                                            key={s.id}
                                            onClick={() => setRapidFilterStatus(s.id)}
                                            className={`snap-start whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium transition-colors ${rapidFilterStatus === s.id ? s.color.replace('bg-', 'bg-').replace('text-', 'text-') + ' ring-2 ring-offset-1' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                        >
                                            {s.label} ({count})
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {filteredRapidItems.map(qual => (
                                <div 
                                    key={qual.id}
                                    onClick={() => setSelectedQual(qual)}
                                    className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedQual?.id === qual.id ? 'bg-blue-50 border-blue-300 shadow-sm ring-1 ring-blue-300' : 'bg-white hover:bg-slate-50 border-slate-200'}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="font-bold text-sm text-slate-900 line-clamp-1">{qual.customers?.full_name}</div>
                                        {STATUSES.find(s => s.id === qual.status) && (
                                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border-none ${STATUSES.find(s => s.id === qual.status)?.color}`}>
                                                {STATUSES.find(s => s.id === qual.status)?.label}
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="text-xs text-slate-500 font-medium flex justify-between mt-1">
                                        <span>{qual.customers?.phone}</span>
                                        {qual.projects?.name ? <span className="text-indigo-600 truncate max-w-[100px]">{qual.projects.name}</span> : qual.campaign_name ? <span className="text-slate-500 truncate max-w-[100px]">{qual.campaign_name}</span> : null}
                                    </div>
                                </div>
                            ))}
                            {filteredRapidItems.length === 0 && (
                                <div className="p-8 text-center text-sm text-slate-500">
                                    Sonuç bulunamadı.
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Rapid View - Right Panel (Action Area) */}
                    <div className="flex-1 flex flex-col bg-white">
                        {selectedQual ? (
                            <div className="h-full flex flex-col">
                                {/* Header */}
                                <div className="p-6 border-b flex justify-between items-start bg-slate-50/50">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h2 className="text-2xl font-black text-slate-900">{selectedQual.customers?.full_name}</h2>
                                            {selectedQual.customers?.outreach_executions?.length > 0 && (
                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                    <MessageSquareText className="w-3 h-3 mr-1" /> Oto-WP Gönderildi
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-slate-600 flex-wrap mt-1">
                                            <a href={`tel:${selectedQual.customers?.phone}`} className="flex items-center gap-1.5 hover:text-blue-600 font-medium bg-white px-2 py-1 rounded-md border shadow-sm">
                                                <Phone className="w-4 h-4 text-blue-500" />
                                                {selectedQual.customers?.phone}
                                            </a>
                                            {selectedQual.projects?.name ? (
                                                <span className="flex items-center gap-1.5 text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100 font-medium">
                                                    <Building2 className="w-4 h-4" />
                                                    {selectedQual.projects.name}
                                                </span>
                                            ) : selectedQual.campaign_name ? (
                                                <span className="flex items-center gap-1.5 text-slate-700 bg-slate-50 px-2 py-1 rounded-md border border-slate-200 font-medium">
                                                    <Info className="w-4 h-4" />
                                                    {selectedQual.campaign_name}
                                                </span>
                                            ) : null}
                                            {selectedQual.customers?.customer_number && (
                                                <Badge variant="outline">{selectedQual.customers.customer_number}</Badge>
                                            )}
                                            <span className="flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-1 rounded-md text-xs font-medium">
                                                <Clock className="w-3 h-3" /> {new Date(selectedQual.customers?.created_at || selectedQual.created_at).toLocaleDateString('tr-TR')}
                                            </span>
                                            {(selectedQual.customers?.source || selectedQual.source) && (
                                                <Badge variant="secondary" className="bg-slate-200 hover:bg-slate-300 text-slate-700">{selectedQual.customers?.source || selectedQual.source}</Badge>
                                            )}
                                        </div>
                                    </div>
                                    <Badge variant="outline" className={`text-xs px-3 py-1 ${STATUSES.find(s => s.id === selectedQual.status)?.color}`}>
                                        {STATUSES.find(s => s.id === selectedQual.status)?.label}
                                    </Badge>
                                </div>
                                
                                {/* Content */}
                                <div className="flex-1 p-6 overflow-y-auto space-y-8">
                                    {/* Müşteri Notları */}
                                    {selectedQual.customers?.customer_demands?.find((d: any) => d.notes)?.notes && (
                                        <div className="space-y-2">
                                            <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                                <User className="w-4 h-4 text-blue-500" /> Müşteri Genel Notu / Özgeçmiş
                                            </Label>
                                            <div className="p-4 bg-blue-50 text-blue-900 rounded-xl border border-blue-100 shadow-inner text-sm leading-relaxed whitespace-pre-wrap">
                                                {selectedQual.customers.customer_demands.find((d: any) => d.notes).notes}
                                            </div>
                                        </div>
                                    )}
                                    {/* Geçmiş Notlar */}
                                    {selectedQual.call_notes && (
                                        <div className="space-y-2">
                                            <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                                <Info className="w-4 h-4 text-amber-500" /> Önceki Değerlendirme Notu
                                            </Label>
                                            <div className="p-4 bg-amber-50 text-amber-900 rounded-xl border border-amber-100 shadow-inner text-sm leading-relaxed whitespace-pre-wrap">
                                                {selectedQual.call_notes}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Aksiyon Alanı */}
                                    {selectedQual.status !== 'qualified' && selectedQual.status !== 'disqualified' && (
                                        <div className="space-y-6">
                                            <div className="space-y-3">
                                                <Label className="text-sm font-bold text-slate-700">Yeni Görüşme Notu</Label>
                                                <Textarea 
                                                    placeholder="Müşteri ile ne görüşüldü? (Not girin...)" 
                                                    value={note} 
                                                    onChange={e => setNote(e.target.value)}
                                                    className="min-h-[120px] resize-none text-base p-4 focus-visible:ring-blue-500 shadow-sm"
                                                />
                                            </div>
                                            
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                <Button 
                                                    onClick={() => { setNextStatus('contacted'); submitNote(); }}
                                                    className="h-12 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 border border-blue-200"
                                                    variant="outline"
                                                    disabled={!note}
                                                >
                                                    <Phone className="w-4 h-4 mr-2" /> Görüşüldü
                                                </Button>
                                                <Button 
                                                    onClick={() => { setNextStatus('follow_up'); submitNote(); }}
                                                    className="h-12 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800 border border-amber-200"
                                                    variant="outline"
                                                    disabled={!note}
                                                >
                                                    <Calendar className="w-4 h-4 mr-2" /> Takipte
                                                </Button>
                                                <Button 
                                                    onClick={() => { setNextStatus('unreachable'); submitNote(); }}
                                                    className="h-12 bg-orange-50 text-orange-700 hover:bg-orange-100 hover:text-orange-800 border border-orange-200"
                                                    variant="outline"
                                                >
                                                    <PhoneMissed className="w-4 h-4 mr-2" /> Ulaşılamadı
                                                </Button>
                                                <Button 
                                                    onClick={() => { setDisqualifyReason(''); setIsDisqualifyDialogOpen(true); }}
                                                    className="h-12 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 border border-red-200"
                                                    variant="outline"
                                                >
                                                    <X className="w-4 h-4 mr-2" /> Ele (Olumsuz)
                                                </Button>
                                            </div>
                                            
                                            <div className="pt-6 border-t">
                                                <Button 
                                                    onClick={() => { setSelectedProject(''); setIsQualifyDialogOpen(true); }}
                                                    className="w-full h-14 text-base font-bold bg-green-600 hover:bg-green-700 shadow-lg shadow-green-100"
                                                >
                                                    <Check className="w-5 h-5 mr-2" /> Satış Hunisine Aktar (Nitelikli)
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center space-y-4">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                    <User className="w-10 h-10 text-slate-300" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-600">Hızlı Çalışma Ekranı</h3>
                                <p className="max-w-sm">Soldaki listeden bir müşteri seçin. Görüşme yapıp hızlıca notunuzu girin veya müşteriyi satışa aktarın.</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col bg-white border rounded-xl shadow-sm overflow-hidden">
                    <div className="p-3 border-b bg-slate-50/50 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <input 
                                type="text" 
                                placeholder="Tabloda ara..." 
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-64 px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <Select value={rapidFilterStatus} onValueChange={setRapidFilterStatus}>
                                <SelectTrigger className="w-[180px] h-9">
                                    <SelectValue placeholder="Durum Seçin" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tüm Durumlar</SelectItem>
                                    {STATUSES.map(s => (
                                        <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto px-2 hide-scrollbar">
                            {STATUSES.map(status => {
                                const count = statusCounts[status.id] || 0;
                                if (count === 0) return null;
                                // Simple mapping for bullet color based on badge styling
                                const bulletColor = status.color.includes('blue') ? 'bg-blue-500' :
                                                    status.color.includes('yellow') ? 'bg-yellow-500' :
                                                    status.color.includes('green') ? 'bg-green-500' :
                                                    status.color.includes('red') ? 'bg-red-500' :
                                                    status.color.includes('slate') ? 'bg-slate-500' : 'bg-gray-500';
                                return (
                                    <div key={status.id} className="flex items-center gap-1.5 px-2.5 py-1 bg-white border rounded-md text-xs whitespace-nowrap shadow-sm cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setRapidFilterStatus(status.id)}>
                                        <div className={`w-2 h-2 rounded-full ${bulletColor}`} />
                                        <span className="text-slate-600 font-medium">{status.label}</span>
                                        <span className="font-bold text-slate-900 ml-0.5">{count}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 bg-slate-50 sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="px-4 py-3 font-semibold border-b">Müşteri</th>
                                    <th className="px-4 py-3 font-semibold border-b">İletişim</th>
                                    <th className="px-4 py-3 font-semibold border-b">Proje İlgisi</th>
                                    <th className="px-4 py-3 font-semibold border-b">Durum</th>
                                    <th className="px-4 py-3 font-semibold border-b">Sorumlu</th>
                                    <th className="px-4 py-3 font-semibold border-b">Notlar</th>
                                    <th className="px-4 py-3 font-semibold border-b text-right">Aksiyon</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredRapidItems.map(qual => (
                                    <tr key={qual.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-4 py-3 font-medium text-slate-900">
                                            <div className="flex items-center gap-1.5">
                                                {qual.customers?.full_name}
                                                {qual.customers?.outreach_executions?.length > 0 && (
                                                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.6)]" title="Otomatik WP Mesajı Gönderildi"></div>
                                                )}
                                            </div>
                                            <div className="text-[10px] text-slate-500 font-normal">{new Date(qual.created_at).toLocaleDateString('tr-TR')}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <a href={`tel:${qual.customers?.phone}`} className="text-blue-600 hover:underline">{qual.customers?.phone}</a>
                                            {qual.customers?.email && <div className="text-[10px] text-slate-500">{qual.customers.email}</div>}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            <div className="flex flex-col gap-1">
                                                {qual.projects?.name ? (
                                                    <span className="text-indigo-600 truncate max-w-[150px] font-medium inline-flex items-center gap-1">
                                                        <Building2 className="w-3 h-3" /> {qual.projects.name}
                                                    </span>
                                                ) : qual.campaign_name && qual.source !== 'meta_ads' ? (
                                                    <span className="text-slate-500 truncate max-w-[150px] inline-flex items-center gap-1">
                                                        <Info className="w-3 h-3" /> {qual.campaign_name}
                                                    </span>
                                                ) : '-'}
                                                
                                                {qual.source === 'meta_ads' && (
                                                    <div className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 inline-flex items-center gap-1 w-max max-w-[150px] truncate" title={qual.campaign_name || qual.customers?.notes}>
                                                        <Info className="w-3 h-3 flex-shrink-0" />
                                                        <span className="truncate">{qual.campaign_name || qual.customers?.notes || 'Meta Lead'}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {STATUSES.find(s => s.id === qual.status) && (
                                                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border-none ${STATUSES.find(s => s.id === qual.status)?.color}`}>
                                                    {STATUSES.find(s => s.id === qual.status)?.label}
                                                </Badge>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {qual.profiles?.full_name ? (
                                                <div className="flex items-center gap-1.5 text-xs font-medium bg-slate-100 w-fit px-2 py-0.5 rounded-md">
                                                    <User className="w-3 h-3 text-slate-400" />
                                                    {qual.profiles.full_name}
                                                </div>
                                            ) : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-500 max-w-[200px]">
                                            <div className="truncate" title={qual.call_notes}>
                                                {qual.call_notes || '-'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                                            {qual.status !== 'qualified' && qual.status !== 'disqualified' && (
                                                <>
                                                    <Button size="sm" variant="outline" className="h-7 px-2 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" onClick={() => handleAction(qual, 'note')} title="Ara / Not Gir">
                                                        <Phone className="w-3 h-3 mr-1" /> Ara/Not
                                                    </Button>
                                                    <Button size="sm" variant="outline" className="h-7 px-2 text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleAction(qual, 'disqualify')} title="Ele (Olumsuz)">
                                                        <X className="w-3 h-3 mr-1" /> Ele
                                                    </Button>
                                                    <Button size="sm" variant="default" className="h-7 px-2 bg-green-600 hover:bg-green-700" onClick={() => handleAction(qual, 'qualify')} title="Satışa Aktar">
                                                        <Check className="w-3 h-3 mr-1" /> Satış
                                                    </Button>
                                                </>
                                            )}
                                            {qual.status === 'disqualified' && (
                                                <Button size="sm" variant="outline" className="h-7 px-2 text-slate-600 border-slate-200 hover:bg-slate-100" onClick={() => handleAction(qual, 'note')} title="Tekrar Değerlendir">
                                                    <Undo2 className="w-3 h-3 mr-1" /> Geri Al
                                                </Button>
                                            )}
                                            <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => handleAction(qual, 'details')}>
                                                <Info className="w-3 h-3 mr-1" /> Detay
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredRapidItems.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-8 text-center text-slate-500">Sonuç bulunamadı.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {totalCount > pageSize && (
                        <div className="p-4 border-t bg-slate-50 flex items-center justify-between">
                            <div className="text-xs text-slate-500">
                                Toplam <span className="font-bold">{totalCount}</span> kayıttan <span className="font-bold">{(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalCount)}</span> arası gösteriliyor.
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPage <= 1}
                                    onClick={() => {
                                        const url = new URL(window.location.href)
                                        url.searchParams.set('page', (currentPage - 1).toString())
                                        window.location.href = url.toString()
                                    }}
                                    className="h-8"
                                >
                                    Önceki
                                </Button>
                                <span className="text-xs font-medium px-2 text-slate-600">
                                    Sayfa {currentPage} / {Math.ceil(totalCount / pageSize)}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPage >= Math.ceil(totalCount / pageSize)}
                                    onClick={() => {
                                        const url = new URL(window.location.href)
                                        url.searchParams.set('page', (currentPage + 1).toString())
                                        window.location.href = url.toString()
                                    }}
                                    className="h-8"
                                >
                                    Sonraki
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Detay Dialog */}
            <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <User className="w-5 h-5 text-blue-600" />
                            Müşteri Detayı
                        </DialogTitle>
                    </DialogHeader>
                    {selectedQual && (
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-xs text-slate-500">Ad Soyad</Label>
                                    <div className="font-semibold">{selectedQual.customers?.full_name}</div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-slate-500">Müşteri No</Label>
                                    <div>{selectedQual.customers?.customer_number || '-'}</div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-slate-500">Telefon</Label>
                                    <div>
                                        <a href={`tel:${selectedQual.customers?.phone}`} className="text-blue-600 hover:underline">
                                            {selectedQual.customers?.phone || '-'}
                                        </a>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-slate-500">Kaynak</Label>
                                    <div>
                                        <Badge variant="secondary">{selectedQual.source || 'Bilinmiyor'}</Badge>
                                    </div>
                                </div>
                                <div className="space-y-1 col-span-2">
                                    <Label className="text-xs text-slate-500">İlgilendiği Proje</Label>
                                    <div>
                                        {selectedQual.projects?.name ? (
                                            <span className="inline-flex items-center gap-1.5 text-indigo-700 font-medium">
                                                <Building2 className="w-4 h-4" />
                                                {selectedQual.projects.name}
                                            </span>
                                        ) : selectedQual.campaign_name && selectedQual.source !== 'meta_ads' ? (
                                            <span className="inline-flex items-center gap-1.5 text-slate-700 font-medium">
                                                <Info className="w-4 h-4" />
                                                {selectedQual.campaign_name}
                                            </span>
                                        ) : '-'}
                                    </div>
                                </div>
                                {selectedQual.source === 'meta_ads' && (
                                    <div className="space-y-1 col-span-2 bg-blue-50/50 p-2 rounded-lg border border-blue-100">
                                        <Label className="text-xs text-blue-700 font-bold flex items-center gap-1">
                                            <Info className="w-3 h-3" /> Meta Reklam Kampanya Detayı
                                        </Label>
                                        <div className="text-sm text-blue-900 break-words">
                                            {selectedQual.campaign_name || selectedQual.customers?.notes || 'Detay bulunamadı'}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="border-t pt-4 space-y-3">
                                <h4 className="font-medium text-sm flex items-center gap-2">
                                    <Building2 className="w-4 h-4" /> Değerlendirme Bilgileri
                                </h4>
                                
                                <div className="space-y-2">
                                    <Label className="text-xs text-slate-500">Durum</Label>
                                    <div>
                                        {STATUSES.find(s => s.id === selectedQual.status)?.label}
                                    </div>
                                </div>

                                {selectedQual.call_notes && (
                                    <div className="space-y-1 bg-slate-50 p-3 rounded-lg border">
                                        <Label className="text-xs text-slate-500 flex items-center gap-1">
                                            <Info className="w-3 h-3" /> Son Görüşme Notu
                                        </Label>
                                        <p className="text-sm">{selectedQual.call_notes}</p>
                                    </div>
                                )}

                                {selectedQual.disqualify_reason && (
                                    <div className="space-y-1 bg-red-50 p-3 rounded-lg border border-red-100">
                                        <Label className="text-xs text-red-500">Elenme Nedeni</Label>
                                        <p className="text-sm font-medium text-red-700">{selectedQual.disqualify_reason}</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2 text-xs text-slate-500 pt-4 border-t">
                                <Clock className="w-3 h-3" /> 
                                Kayıt: {new Date(selectedQual.created_at).toLocaleDateString('tr-TR')}
                                {selectedQual.last_call_at && ` • Son arama: ${formatDistanceToNow(new Date(selectedQual.last_call_at), { addSuffix: true, locale: tr })}`}
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>Kapat</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Arama Notu Dialog */}
            <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Arama Sonucu</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Görüşme Notları</Label>
                            <Textarea 
                                placeholder="Müşteri ile ne görüşüldü?" 
                                value={note} 
                                onChange={e => setNote(e.target.value)}
                                rows={4}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Sonraki Aşama</Label>
                            <Select value={nextStatus} onValueChange={setNextStatus}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="contacted">Görüşüldü (İletişim Kuruldu)</SelectItem>
                                    <SelectItem value="follow_up">Takipte (Tekrar Aranacak)</SelectItem>
                                    <SelectItem value="unreachable">Ulaşılamadı</SelectItem>
                                    <SelectItem value="disqualified">Olumsuz (Ele)</SelectItem>
                                    <SelectItem value="qualified">Olumlu (Satışa Aktar)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsNoteDialogOpen(false)}>İptal</Button>
                        <Button onClick={submitNote}>Kaydet</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Eleme Dialog */}
            <Dialog open={isDisqualifyDialogOpen} onOpenChange={setIsDisqualifyDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Lead'i Ele (Disqualify)</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Elenme Nedeni</Label>
                            <Select value={disqualifyReason} onValueChange={setDisqualifyReason}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Neden seçiniz..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Bütçe Yetersiz">Bütçe Yetersiz</SelectItem>
                                    <SelectItem value="İlgisiz">İlgilenmiyor</SelectItem>
                                    <SelectItem value="Yanlış Numara">Yanlış/Hatalı Numara</SelectItem>
                                    <SelectItem value="Lokasyon Uygun Değil">Lokasyon Uygun Değil</SelectItem>
                                    <SelectItem value="Projeyi Beğenmedi">Projeyi Beğenmedi</SelectItem>
                                    <SelectItem value="Vazgeçti">Vazgeçti</SelectItem>
                                    <SelectItem value="Diğer">Diğer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDisqualifyDialogOpen(false)}>İptal</Button>
                        <Button variant="destructive" onClick={submitDisqualify} disabled={!disqualifyReason}>Lead'i Ele</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Satışa Aktar Dialog */}
            <Dialog open={isQualifyDialogOpen} onOpenChange={setIsQualifyDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Satış Hunisine Aktar</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>İlgilendiği Proje <span className="text-red-500">*</span></Label>
                            <Select value={selectedProject} onValueChange={(v) => { setSelectedProject(v); setSelectedUnit(''); }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Lütfen ilgilendiği projeyi seçin..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {projects?.map((p: any) => (
                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                    ))}
                                    {(!projects || projects.length === 0) && (
                                        <SelectItem value="-" disabled>Aktif proje bulunamadı</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        {selectedProject && availableUnits && (
                            <div className="space-y-2">
                                <Label>İlgilendiği Ünite (Opsiyonel)</Label>
                                <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Belli bir ünite seçebilirsiniz..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Belirtilmedi</SelectItem>
                                        {availableUnits.filter(u => u.project_id === selectedProject).map((u: any) => (
                                            <SelectItem key={u.id} value={u.id}>
                                                NO: {u.unit_number} {u.price ? `- ${u.price} ${u.currency}` : ''}
                                            </SelectItem>
                                        ))}
                                        {availableUnits.filter(u => u.project_id === selectedProject).length === 0 && (
                                            <SelectItem value="-" disabled>Bu projede müsait ünite yok</SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">Müşteriyi satış hunisine aktarabilmek için en az bir proje seçimi zorunludur.</p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsQualifyDialogOpen(false)}>İptal</Button>
                        <Button variant="default" className="bg-green-600 hover:bg-green-700" onClick={submitQualify} disabled={!selectedProject}>Satışa Aktar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
