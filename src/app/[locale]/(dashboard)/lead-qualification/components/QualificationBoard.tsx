'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { updateQualificationStatus, addCallNote, convertToSale, bulkDisqualifyColdLeads } from '../actions'
import { Calendar, Check, Clock, FileText, Info, Phone, PhoneMissed, X, Building2, User, LayoutGrid, List, Table, Undo2, MessageSquareText, AlertTriangle, Search, Filter, RotateCcw, Trash2, FilterX } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useRouter, useSearchParams } from 'next/navigation'
import { Checkbox } from '@/components/ui/checkbox'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger, SheetClose } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

const getEkSoru = (notes?: string) => {
    if (!notes) return null
    const match = notes.match(/Ek Soru:\s*(.+)/i)
    return match ? match[1].trim() : null
}

const STATUSES = [
    { id: 'new', label: 'Yeni', icon: FileText, color: 'bg-emerald-100 text-emerald-700', border: 'border-emerald-200' },
    { id: 'contacted', label: 'Arandı', icon: Phone, color: 'bg-blue-100 text-blue-700', border: 'border-blue-200' },
    { id: 'follow_up', label: 'Takipte', icon: Calendar, color: 'bg-amber-100 text-amber-700', border: 'border-amber-200' },
    { id: 'unreachable', label: 'Ulaşılamadı', icon: PhoneMissed, color: 'bg-orange-100 text-orange-700', border: 'border-orange-200' },
    { id: 'disqualified', label: 'Elendi', icon: X, color: 'bg-red-100 text-red-700', border: 'border-red-200' },
    { id: 'qualified', label: 'Nitelikli', icon: Check, color: 'bg-green-100 text-green-700', border: 'border-green-200' }
]

export default function QualificationBoard({ initialData, totalCount, currentPage = 1, pageSize = 100, statusCounts = {}, projects = [], availableUnits = [], activeTab = 'active', profiles = [] }: { initialData: any[], totalCount: number, currentPage?: number, pageSize?: number, statusCounts?: Record<string, number>, projects?: any[], availableUnits?: any[], activeTab?: string, profiles?: any[] }) {
    const [qualifications, setQualifications] = useState(initialData)
    const [selectedQual, setSelectedQual] = useState<any>(null)
    const [viewMode, setViewMode] = useState<'kanban' | 'rapid' | 'table'>('table')
    
    const searchParams = useSearchParams()
    const router = useRouter()
    
    // Server-sync filtering states
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>(
        searchParams.get('status') ? searchParams.get('status')!.split(',') : []
    )
    const [selectedInterestLevels, setSelectedInterestLevels] = useState<string[]>(
        searchParams.get('interest_level') ? searchParams.get('interest_level')!.split(',') : []
    )
    const [selectedProjects, setSelectedProjects] = useState<string[]>(
        searchParams.get('project_id') ? searchParams.get('project_id')!.split(',') : []
    )
    const [selectedAssignees, setSelectedAssignees] = useState<string[]>(
        searchParams.get('assigned_to') ? searchParams.get('assigned_to')!.split(',') : []
    )
    const [selectedSources, setSelectedSources] = useState<string[]>(
        searchParams.get('source') ? searchParams.get('source')!.split(',') : []
    )
    
    const [isBulkDisqualifyDialogOpen, setIsBulkDisqualifyDialogOpen] = useState(false)
    const [isBulkDisqualifying, setIsBulkDisqualifying] = useState(false)

    // Sync external data changes (pagination) to local state
    useEffect(() => {
        setQualifications(initialData)
    }, [initialData])
    
    // Sync external URL changes back to state (e.g. back button, reset)
    useEffect(() => {
        const urlSearch = searchParams.get('search') || ''
        const urlStatus = searchParams.get('status') ? searchParams.get('status')!.split(',') : []
        const urlInterest = searchParams.get('interest_level') ? searchParams.get('interest_level')!.split(',') : []
        const urlProject = searchParams.get('project_id') ? searchParams.get('project_id')!.split(',') : []
        const urlAssignee = searchParams.get('assigned_to') ? searchParams.get('assigned_to')!.split(',') : []
        const urlSource = searchParams.get('source') ? searchParams.get('source')!.split(',') : []

        if (urlSearch !== searchQuery) setSearchQuery(urlSearch)
        if (urlStatus.join(',') !== selectedStatuses.join(',')) setSelectedStatuses(urlStatus)
        if (urlInterest.join(',') !== selectedInterestLevels.join(',')) setSelectedInterestLevels(urlInterest)
        if (urlProject.join(',') !== selectedProjects.join(',')) setSelectedProjects(urlProject)
        if (urlAssignee.join(',') !== selectedAssignees.join(',')) setSelectedAssignees(urlAssignee)
        if (urlSource.join(',') !== selectedSources.join(',')) setSelectedSources(urlSource)
    }, [searchParams])

    // Update URL when filters change
    useEffect(() => {
        const timer = setTimeout(() => {
            const params = new URLSearchParams(window.location.search)
            let changed = false
            
            if (searchQuery !== (params.get('search') || '')) {
                if (searchQuery) params.set('search', searchQuery)
                else params.delete('search')
                changed = true
            }
            
            const currentStatus = params.get('status') || ''
            const newStatus = selectedStatuses.join(',')
            if (currentStatus !== newStatus) {
                if (newStatus) params.set('status', newStatus)
                else params.delete('status')
                changed = true
            }

            const currentInterest = params.get('interest_level') || ''
            const newInterest = selectedInterestLevels.join(',')
            if (currentInterest !== newInterest) {
                if (newInterest) params.set('interest_level', newInterest)
                else params.delete('interest_level')
                changed = true
            }

            const currentProject = params.get('project_id') || ''
            const newProject = selectedProjects.join(',')
            if (currentProject !== newProject) {
                if (newProject) params.set('project_id', newProject)
                else params.delete('project_id')
                changed = true
            }

            const currentAssignee = params.get('assigned_to') || ''
            const newAssignee = selectedAssignees.join(',')
            if (currentAssignee !== newAssignee) {
                if (newAssignee) params.set('assigned_to', newAssignee)
                else params.delete('assigned_to')
                changed = true
            }

            const currentSource = params.get('source') || ''
            const newSource = selectedSources.join(',')
            if (currentSource !== newSource) {
                if (newSource) params.set('source', newSource)
                else params.delete('source')
                changed = true
            }
            
            if (changed) {
                params.delete('page') // reset page on filter
                router.push(`?${params.toString()}`)
            }
        }, 400)
        return () => clearTimeout(timer)
    }, [searchQuery, selectedStatuses, selectedInterestLevels, selectedProjects, selectedAssignees, selectedSources, router])
    
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
    const [saleDescription, setSaleDescription] = useState('')

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
            setSaleDescription(getEkSoru(qual.customers?.notes) || '')
            setIsQualifyDialogOpen(true)
        }
    }

    const submitQualify = async () => {
        if (!selectedQual || !selectedProject) return
        
        const promise = convertToSale(selectedQual.id, selectedProject, null, saleDescription)
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

    const activeCount = (statusCounts.new || 0) + 
                        (statusCounts.contacted || 0) + 
                        (statusCounts.follow_up || 0) + 
                        (statusCounts.unreachable || 0) + 
                        (statusCounts.qualified || 0)
    const disqualifiedCount = statusCounts.disqualified || 0

    const handleTabChange = (tabName: string) => {
        const params = new URLSearchParams(window.location.search)
        params.set('tab', tabName)
        params.delete('page')
        params.delete('status')
        if (tabName === 'disqualified' && viewMode === 'kanban') {
            setViewMode('table')
        }
        router.push(`?${params.toString()}`)
    }

    const handleBulkDisqualify = async () => {
        setIsBulkDisqualifying(true)
        const promise = bulkDisqualifyColdLeads()
        toast.promise(promise, {
            loading: 'Soğuk leadler eleniyor...',
            success: (data) => {
                setIsBulkDisqualifying(false)
                setIsBulkDisqualifyDialogOpen(false)
                if (data?.error) throw new Error(data.error)
                router.refresh()
                return `${data?.count || 0} adet soğuk lead başarıyla elendi.`
            },
            error: (err) => {
                setIsBulkDisqualifying(false)
                return err.message || 'Toplu eleme işlemi başarısız oldu'
            }
        })
    }

    const activeFiltersCount = 
        selectedStatuses.length + 
        selectedInterestLevels.length + 
        selectedProjects.length + 
        selectedAssignees.length + 
        selectedSources.length +
        (searchQuery.trim() ? 1 : 0)

    const handleClearAllFilters = () => {
        setSelectedStatuses([])
        setSelectedInterestLevels([])
        setSelectedProjects([])
        setSelectedAssignees([])
        setSelectedSources([])
        setSearchQuery('')
        
        // Reset URL
        const params = new URLSearchParams(window.location.search)
        params.delete('search')
        params.delete('status')
        params.delete('interest_level')
        params.delete('project_id')
        params.delete('assigned_to')
        params.delete('source')
        params.delete('page')
        router.push(`?${params.toString()}`)
        
        toast.success('Tüm filtreler temizlendi')
    }

    const displayedStatuses = activeTab === 'active'
        ? STATUSES.filter(s => s.id !== 'disqualified')
        : STATUSES.filter(s => s.id === 'disqualified')

    const columns = displayedStatuses.map(status => ({
        ...status,
        items: qualifications.filter(q => q.status === status.id)
    }))

    // Rapid View Filtreleme (Artık server-side)
    const filteredRapidItems = qualifications

    return (
        <div className="flex flex-col h-full space-y-4">
            {/* Tab Seçimi ve Toplu İşlemler */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 border rounded-xl shadow-sm">
                <div className="flex border-b border-slate-100 w-full sm:w-auto">
                    <button
                        onClick={() => handleTabChange('active')}
                        className={`pb-3 text-sm font-bold border-b-2 transition-all px-4 relative ${
                            activeTab === 'active'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        Aktif Süreçler
                        <Badge variant="secondary" className="ml-2 bg-blue-50 text-blue-700 border-blue-200 font-semibold">
                            {activeCount}
                        </Badge>
                    </button>
                    <button
                        onClick={() => handleTabChange('disqualified')}
                        className={`pb-3 text-sm font-bold border-b-2 transition-all px-4 relative ${
                            activeTab === 'disqualified'
                                ? 'border-red-600 text-red-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        Elenenler
                        <Badge variant="secondary" className="ml-2 bg-red-50 text-red-700 border-red-200 font-semibold">
                            {disqualifiedCount}
                        </Badge>
                    </button>
                </div>

                {activeTab === 'active' && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsBulkDisqualifyDialogOpen(true)}
                        className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700 font-semibold h-9"
                    >
                        ❄️ Soğukları Toplu Ele
                    </Button>
                )}
            </div>

            {/* Unified Search & Gelişmiş Filtreler Barı */}
            <div className="bg-white p-4 border rounded-xl shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Search Input */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Müşteri ismi, telefon numarası veya notlarda arayın..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-9 py-2 h-10 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {/* Filter Sheet and Quick Clear */}
                    <div className="flex items-center gap-2">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button 
                                    variant="outline" 
                                    className={`h-10 px-4 font-bold flex items-center gap-2 transition-all duration-300 ${
                                        activeFiltersCount > 0 
                                            ? 'border-blue-200 bg-blue-50/50 text-blue-700 hover:bg-blue-100/70 shadow-sm ring-1 ring-blue-100' 
                                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                                    }`}
                                >
                                    <Filter className={`h-4 w-4 ${activeFiltersCount > 0 ? 'text-blue-600' : 'text-slate-500'}`} />
                                    Filtrele
                                    {activeFiltersCount > 0 && (
                                        <Badge className="ml-1 bg-blue-600 hover:bg-blue-600 text-white border-none font-extrabold text-[10px] h-5 px-1.5 min-w-5 justify-center rounded-full">
                                            {activeFiltersCount}
                                        </Badge>
                                    )}
                                </Button>
                            </SheetTrigger>
                            <SheetContent className="w-full sm:max-w-md flex flex-col p-0 bg-background border-l shadow-2xl">
                                <div className="p-6 border-b bg-slate-50/50">
                                    <div className="flex items-center justify-between">
                                        <SheetHeader className="text-left p-0">
                                            <div className="flex items-center gap-2">
                                                <div className="p-2 bg-blue-50 rounded-lg">
                                                    <Filter className="h-5 w-5 text-blue-600" />
                                                </div>
                                                <SheetTitle className="text-lg font-bold">Gelişmiş Filtreler</SheetTitle>
                                            </div>
                                            <SheetDescription className="text-xs">
                                                Arama sonuçlarını daraltmak için kriterleri belirleyin.
                                            </SheetDescription>
                                        </SheetHeader>
                                        {activeFiltersCount > 0 && (
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={handleClearAllFilters}
                                                className="text-xs h-8 text-slate-500 hover:text-red-600 transition-colors"
                                            >
                                                <FilterX className="w-3.5 h-3.5 mr-1" />
                                                Temizle
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                
                                <ScrollArea className="flex-1 px-6 py-4">
                                    <div className="space-y-6">
                                        {/* Status Filter */}
                                        <div className="space-y-3">
                                            <h3 className="font-bold text-sm text-slate-700">Aday Durumu</h3>
                                            <div className="grid grid-cols-2 gap-2">
                                                {displayedStatuses.map((s) => {
                                                    const isChecked = selectedStatuses.includes(s.id)
                                                    return (
                                                        <label
                                                            key={s.id}
                                                            className={`flex items-center gap-2 p-2.5 border rounded-lg cursor-pointer transition-colors text-xs font-semibold hover:bg-slate-50 ${
                                                                isChecked ? 'border-blue-600 bg-blue-50/30' : 'border-slate-200'
                                                            }`}
                                                        >
                                                            <Checkbox
                                                                checked={isChecked}
                                                                onCheckedChange={(checked) => {
                                                                    if (checked) {
                                                                        setSelectedStatuses([...selectedStatuses, s.id])
                                                                    } else {
                                                                        setSelectedStatuses(selectedStatuses.filter(id => id !== s.id))
                                                                    }
                                                                }}
                                                            />
                                                            <span className="truncate">{s.label}</span>
                                                        </label>
                                                    )
                                                })}
                                            </div>
                                        </div>

                                        <Separator />

                                        {/* Interest Level Filter */}
                                        <div className="space-y-3">
                                            <h3 className="font-bold text-sm text-slate-700">Aday Skoru</h3>
                                            <div className="grid grid-cols-2 gap-2">
                                                {[
                                                    { id: 'hot', label: '🔥 Sıcak' },
                                                    { id: 'warm', label: '🌤️ Ilık' },
                                                    { id: 'cold', label: '❄️ Soğuk' },
                                                    { id: 'call_requested', label: '📞 Arama İstiyor' }
                                                ].map((opt) => {
                                                    const isChecked = selectedInterestLevels.includes(opt.id)
                                                    return (
                                                        <label
                                                            key={opt.id}
                                                            className={`flex items-center gap-2 p-2.5 border rounded-lg cursor-pointer transition-colors text-xs font-semibold hover:bg-slate-50 ${
                                                                isChecked ? 'border-blue-600 bg-blue-50/30' : 'border-slate-200'
                                                            }`}
                                                        >
                                                            <Checkbox
                                                                checked={isChecked}
                                                                onCheckedChange={(checked) => {
                                                                    if (checked) {
                                                                        setSelectedInterestLevels([...selectedInterestLevels, opt.id])
                                                                    } else {
                                                                        setSelectedInterestLevels(selectedInterestLevels.filter(id => id !== opt.id))
                                                                    }
                                                                }}
                                                            />
                                                            <span>{opt.label}</span>
                                                        </label>
                                                    )
                                                })}
                                            </div>
                                        </div>

                                        <Separator />

                                        {/* Project Filter */}
                                        {projects.length > 0 && (
                                            <>
                                                <div className="space-y-3">
                                                    <h3 className="font-bold text-sm text-slate-700">Proje İlgisi</h3>
                                                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                                                        {projects.map((p: any) => {
                                                            const isChecked = selectedProjects.includes(p.id)
                                                            return (
                                                                <label
                                                                    key={p.id}
                                                                    className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer transition-colors text-xs font-semibold hover:bg-slate-50 ${
                                                                        isChecked ? 'border-blue-600 bg-blue-50/30' : 'border-slate-200'
                                                                    }`}
                                                                >
                                                                    <Checkbox
                                                                        checked={isChecked}
                                                                        onCheckedChange={(checked) => {
                                                                            if (checked) {
                                                                                setSelectedProjects([...selectedProjects, p.id])
                                                                            } else {
                                                                                setSelectedProjects(selectedProjects.filter(id => id !== p.id))
                                                                            }
                                                                        }}
                                                                    />
                                                                    <span className="truncate">{p.name}</span>
                                                                </label>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                                <Separator />
                                            </>
                                        )}

                                        {/* Assignee Filter */}
                                        {profiles.length > 0 && (
                                            <>
                                                <div className="space-y-3">
                                                    <h3 className="font-bold text-sm text-slate-700">Sorumlu Temsilci</h3>
                                                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                                                        {profiles.map((p: any) => {
                                                            const isChecked = selectedAssignees.includes(p.id)
                                                            return (
                                                                <label
                                                                    key={p.id}
                                                                    className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer transition-colors text-xs font-semibold hover:bg-slate-50 ${
                                                                        isChecked ? 'border-blue-600 bg-blue-50/30' : 'border-slate-200'
                                                                    }`}
                                                                >
                                                                    <Checkbox
                                                                        checked={isChecked}
                                                                        onCheckedChange={(checked) => {
                                                                            if (checked) {
                                                                                setSelectedAssignees([...selectedAssignees, p.id])
                                                                            } else {
                                                                                setSelectedAssignees(selectedAssignees.filter(id => id !== p.id))
                                                                            }
                                                                        }}
                                                                    />
                                                                    <span className="truncate">{p.full_name}</span>
                                                                </label>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                                <Separator />
                                            </>
                                        )}

                                        {/* Lead Source Filter */}
                                        <div className="space-y-3">
                                            <h3 className="font-bold text-sm text-slate-700">Aday Kaynağı</h3>
                                            <div className="grid grid-cols-2 gap-2">
                                                {[
                                                    { id: 'meta_ads', label: 'Meta Reklamları' },
                                                    { id: 'whatsapp', label: 'WhatsApp' },
                                                    { id: 'phone', label: 'Telefon' },
                                                    { id: 'website', label: 'Web Sitesi' },
                                                    { id: 'manual', label: 'Manuel Giriş' },
                                                    { id: 'instagram', label: 'Instagram' }
                                                ].map((src) => {
                                                    const isChecked = selectedSources.includes(src.id)
                                                    return (
                                                        <label
                                                            key={src.id}
                                                            className={`flex items-center gap-2 p-2.5 border rounded-lg cursor-pointer transition-colors text-xs font-semibold hover:bg-slate-50 ${
                                                                isChecked ? 'border-blue-600 bg-blue-50/30' : 'border-slate-200'
                                                            }`}
                                                        >
                                                            <Checkbox
                                                                checked={isChecked}
                                                                onCheckedChange={(checked) => {
                                                                    if (checked) {
                                                                        setSelectedSources([...selectedSources, src.id])
                                                                    } else {
                                                                        setSelectedSources(selectedSources.filter(id => id !== src.id))
                                                                    }
                                                                }}
                                                            />
                                                            <span className="truncate">{src.label}</span>
                                                        </label>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </ScrollArea>

                                <div className="p-6 border-t bg-slate-50/50 flex items-center justify-between gap-3 mt-auto shrink-0">
                                    <Button
                                        variant="outline"
                                        onClick={handleClearAllFilters}
                                        disabled={activeFiltersCount === 0}
                                        className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 font-bold"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Temizle
                                    </Button>
                                    <SheetClose asChild>
                                        <Button className="bg-blue-600 hover:bg-blue-700 font-bold">
                                            Filtreleri Uygula
                                        </Button>
                                    </SheetClose>
                                </div>
                            </SheetContent>
                        </Sheet>

                        {/* Highly visible quick clear button */}
                        {activeFiltersCount > 0 && (
                            <Button
                                variant="outline"
                                onClick={handleClearAllFilters}
                                className="h-10 px-4 font-bold bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-red-200 hover:border-red-300 shadow-sm transition-all duration-300 flex items-center gap-1.5 rounded-lg active:scale-95 shrink-0"
                                title="Tüm Filtreleri Kaldır"
                            >
                                <FilterX className="h-4 w-4" />
                                <span>Filtreleri Kaldır</span>
                            </Button>
                        )}
                    </div>
                </div>

                {/* Active Filter Chips */}
                {activeFiltersCount > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs text-slate-500 border-t border-slate-100">
                        <span className="font-bold text-slate-600 mr-1">Aktif Filtreler:</span>
                        
                        {/* Search Query Chip */}
                        {searchQuery.trim() && (
                            <Badge variant="secondary" className="bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 pr-1 font-semibold text-xs border border-slate-200">
                                Arama: "{searchQuery}"
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="rounded-full p-0.5 hover:bg-slate-300 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        )}

                        {/* Status Chips */}
                        {selectedStatuses.map(id => {
                            const label = STATUSES.find(s => s.id === id)?.label || id
                            return (
                                <Badge key={id} variant="secondary" className="bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 pr-1 font-semibold text-xs border border-slate-200">
                                    Durum: {label}
                                    <button
                                        onClick={() => setSelectedStatuses(selectedStatuses.filter(x => x !== id))}
                                        className="rounded-full p-0.5 hover:bg-slate-300 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            )
                        })}

                        {/* Interest Level Chips */}
                        {selectedInterestLevels.map(id => {
                            const label = id === 'hot' ? '🔥 Sıcak' : id === 'warm' ? '🌤️ Ilık' : id === 'cold' ? '❄️ Soğuk' : id === 'call_requested' ? '📞 Arama İstiyor' : id
                            return (
                                <Badge key={id} variant="secondary" className="bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 pr-1 font-semibold text-xs border border-slate-200">
                                    Skor: {label}
                                    <button
                                        onClick={() => setSelectedInterestLevels(selectedInterestLevels.filter(x => x !== id))}
                                        className="rounded-full p-0.5 hover:bg-slate-300 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            )
                        })}

                        {/* Project Chips */}
                        {selectedProjects.map(id => {
                            const label = projects.find((p: any) => p.id === id)?.name || id
                            return (
                                <Badge key={id} variant="secondary" className="bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 pr-1 font-semibold text-xs border border-slate-200">
                                    Proje: {label}
                                    <button
                                        onClick={() => setSelectedProjects(selectedProjects.filter(x => x !== id))}
                                        className="rounded-full p-0.5 hover:bg-slate-300 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            )
                        })}

                        {/* Assignee Chips */}
                        {selectedAssignees.map(id => {
                            const label = profiles.find((p: any) => p.id === id)?.full_name || id
                            return (
                                <Badge key={id} variant="secondary" className="bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 pr-1 font-semibold text-xs border border-slate-200">
                                    Sorumlu: {label}
                                    <button
                                        onClick={() => setSelectedAssignees(selectedAssignees.filter(x => x !== id))}
                                        className="rounded-full p-0.5 hover:bg-slate-300 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            )
                        })}

                        {/* Source Chips */}
                        {selectedSources.map(id => {
                            const label = id === 'meta_ads' ? 'Meta Reklamları' : id === 'whatsapp' ? 'WhatsApp' : id === 'phone' ? 'Telefon' : id === 'website' ? 'Web Sitesi' : id === 'manual' ? 'Manuel Giriş' : id === 'instagram' ? 'Instagram' : id
                            return (
                                <Badge key={id} variant="secondary" className="bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 pr-1 font-semibold text-xs border border-slate-200">
                                    Kaynak: {label}
                                    <button
                                        onClick={() => setSelectedSources(selectedSources.filter(x => x !== id))}
                                        className="rounded-full p-0.5 hover:bg-slate-300 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            )
                        })}

                        {/* Quick clear link */}
                        <button
                            onClick={handleClearAllFilters}
                            className="text-xs text-red-600 hover:text-red-700 font-bold hover:underline ml-1"
                        >
                            Tümünü Sıfırla
                        </button>
                    </div>
                )}
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-2 border rounded-xl shadow-sm">
                <div className="flex items-center bg-slate-100 rounded-lg p-1 w-full sm:w-auto">
                    {activeTab !== 'disqualified' && (
                        <button 
                            onClick={() => setViewMode('kanban')}
                            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'kanban' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                            <LayoutGrid className="w-4 h-4" /> Kanban Panosu
                        </button>
                    )}
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
                                    <div className={`p-3 border-b flex items-center justify-between rounded-t-xl ${col.color}`}>
                                        <div className="flex items-center gap-1.5 font-semibold text-sm">
                                            <col.icon className="w-4 h-4" />
                                            {col.label}
                                        </div>
                                        <span className="text-base font-black">{statusCounts[col.id] || 0}</span>
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
                                                    <div className="flex gap-1">
                                                        {qual.interest_level && (
                                                            <Badge variant="outline" className={`text-[9px] px-1 py-0 border-none font-semibold ${
                                                                qual.interest_level === 'hot' ? 'bg-red-100 text-red-700' :
                                                                qual.interest_level === 'warm' ? 'bg-amber-100 text-amber-700' :
                                                                qual.interest_level === 'cold' ? 'bg-sky-100 text-sky-700' :
                                                                qual.interest_level === 'call_requested' ? 'bg-emerald-100 text-emerald-700' : ''
                                                            }`}>
                                                                {qual.interest_level === 'hot' ? '🔥' : qual.interest_level === 'warm' ? '🌤️' : qual.interest_level === 'cold' ? '❄️' : qual.interest_level === 'call_requested' ? '📞' : ''}
                                                            </Badge>
                                                        )}
                                                        {qual.customers?.customer_number && (
                                                            <Badge variant="outline" className="text-[10px] px-1 py-0">{qual.customers.customer_number}</Badge>
                                                        )}
                                                    </div>
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
                                                            <div className="text-[9px] text-blue-600 truncate" title={qual.campaign_name || 'Bilinmeyen Kampanya'}>
                                                                {qual.campaign_name || 'Kampanya bilinmiyor'}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {getEkSoru(qual.customers?.notes) && (
                                                        <div className="mt-1 flex flex-col gap-1 p-1.5 bg-indigo-50 rounded border border-indigo-100">
                                                            <div className="text-[10px] font-semibold text-indigo-700 flex items-center gap-1">
                                                                <MessageSquareText className="w-3 h-3" /> Ek Soru
                                                            </div>
                                                            <div className="text-xs text-indigo-900 font-medium whitespace-pre-wrap">
                                                                {getEkSoru(qual.customers?.notes)}
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
                                    onClick={() => setSelectedStatuses([])}
                                    className={`snap-start whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium transition-colors ${selectedStatuses.length === 0 ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                    Tümü ({totalCount})
                                </button>
                                {displayedStatuses.map(s => {
                                    const count = statusCounts[s.id] || 0
                                    return (
                                        <button 
                                            key={s.id}
                                            onClick={() => {
                                                if (selectedStatuses.includes(s.id)) {
                                                    setSelectedStatuses(selectedStatuses.filter(id => id !== s.id))
                                                } else {
                                                    setSelectedStatuses([...selectedStatuses, s.id])
                                                }
                                            }}
                                            className={`snap-start whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium transition-colors ${selectedStatuses.includes(s.id) ? s.color.replace('bg-', 'bg-').replace('text-', 'text-') + ' ring-2 ring-offset-1' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
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
                                        <div className="flex gap-1">
                                            {qual.interest_level && (
                                                <Badge variant="outline" className={`text-[9px] px-1 py-0 border-none font-semibold ${
                                                    qual.interest_level === 'hot' ? 'bg-red-100 text-red-700' :
                                                    qual.interest_level === 'warm' ? 'bg-amber-100 text-amber-700' :
                                                    qual.interest_level === 'cold' ? 'bg-sky-100 text-sky-700' :
                                                    qual.interest_level === 'call_requested' ? 'bg-emerald-100 text-emerald-700' : ''
                                                }`}>
                                                    {qual.interest_level === 'hot' ? '🔥' : qual.interest_level === 'warm' ? '🌤️' : qual.interest_level === 'cold' ? '❄️' : qual.interest_level === 'call_requested' ? '📞' : ''}
                                                </Badge>
                                            )}
                                            {STATUSES.find(s => s.id === qual.status) && (
                                                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border-none ${STATUSES.find(s => s.id === qual.status)?.color}`}>
                                                    {STATUSES.find(s => s.id === qual.status)?.label}
                                                </Badge>
                                            )}
                                        </div>
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
                                            {getEkSoru(selectedQual.customers?.notes) && (
                                                <span className="flex items-center gap-1.5 text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100 font-medium ml-2">
                                                    <MessageSquareText className="w-4 h-4" /> Ek Soru: {getEkSoru(selectedQual.customers?.notes)}
                                                </span>
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
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-[180px] h-9 justify-between">
                                        {selectedStatuses.length === 0 ? "Tüm Durumlar" : `${selectedStatuses.length} Durum Seçili`}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-[180px]">
                                    <DropdownMenuCheckboxItem
                                        checked={selectedStatuses.length === 0}
                                        onSelect={(e) => e.preventDefault()}
                                        onCheckedChange={() => setSelectedStatuses([])}
                                    >
                                        Tüm Durumlar
                                    </DropdownMenuCheckboxItem>
                                    {displayedStatuses.map(s => (
                                        <DropdownMenuCheckboxItem
                                            key={s.id}
                                            checked={selectedStatuses.includes(s.id)}
                                            onSelect={(e) => e.preventDefault()}
                                            onCheckedChange={(checked) => {
                                                if (checked) setSelectedStatuses([...selectedStatuses, s.id])
                                                else setSelectedStatuses(selectedStatuses.filter(id => id !== s.id))
                                            }}
                                        >
                                            {s.label}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto px-2 hide-scrollbar">
                            {displayedStatuses.map(status => {
                                const count = statusCounts[status.id] || 0;
                                if (count === 0) return null;
                                const bulletColor = status.color.includes('blue') ? 'bg-blue-500' :
                                                    status.color.includes('yellow') ? 'bg-yellow-500' :
                                                    status.color.includes('amber') ? 'bg-amber-500' :
                                                    status.color.includes('green') ? 'bg-green-500' :
                                                    status.color.includes('emerald') ? 'bg-emerald-500' :
                                                    status.color.includes('red') ? 'bg-red-500' :
                                                    status.color.includes('orange') ? 'bg-orange-500' :
                                                    status.color.includes('slate') ? 'bg-slate-500' : 'bg-gray-500';
                                const isSelected = selectedStatuses.includes(status.id);
                                return (
                                    <div 
                                        key={status.id} 
                                        className={`flex items-center gap-1.5 px-2.5 py-1 bg-white border rounded-md text-xs whitespace-nowrap shadow-sm cursor-pointer transition-colors ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-slate-50'}`} 
                                        onClick={() => {
                                            if (isSelected) {
                                                setSelectedStatuses(selectedStatuses.filter(id => id !== status.id))
                                            } else {
                                                setSelectedStatuses([...selectedStatuses, status.id])
                                            }
                                        }}
                                    >
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
                                    <th className="px-4 py-3 font-semibold border-b">Skor</th>
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
                                        <td className="px-4 py-3">
                                            {qual.interest_level ? (
                                                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border-none font-semibold ${
                                                    qual.interest_level === 'hot' ? 'bg-red-100 text-red-700' :
                                                    qual.interest_level === 'warm' ? 'bg-amber-100 text-amber-700' :
                                                    qual.interest_level === 'cold' ? 'bg-sky-100 text-sky-700' :
                                                    qual.interest_level === 'call_requested' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                                }`}>
                                                    {qual.interest_level === 'hot' ? '🔥 Sıcak' :
                                                     qual.interest_level === 'warm' ? '🌤️ Ilık' :
                                                     qual.interest_level === 'cold' ? '❄️ Soğuk' :
                                                     qual.interest_level === 'call_requested' ? '📞 Arama İstiyor' : qual.interest_level}
                                                </Badge>
                                            ) : <span className="text-slate-300">—</span>}
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
                                        <td colSpan={8} className="px-4 py-8 text-center text-slate-500">Sonuç bulunamadı.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Global Pagination Controls */}
            {totalCount > pageSize && (
                <div className="p-4 bg-white border rounded-xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 mt-auto shrink-0">
                    <div className="text-sm text-slate-600">
                        Toplam <span className="font-bold text-slate-900">{totalCount}</span> kayıttan <span className="font-bold text-slate-900">{(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalCount)}</span> arası gösteriliyor.
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage <= 1}
                            onClick={() => {
                                const params = new URLSearchParams(window.location.search)
                                params.set('page', (currentPage - 1).toString())
                                router.push(`?${params.toString()}`)
                            }}
                            className="h-9 px-4 hover:bg-slate-50"
                        >
                            Önceki
                        </Button>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-md border text-sm font-medium text-slate-700">
                            Sayfa {currentPage} <span className="text-slate-400">/</span> {Math.ceil(totalCount / pageSize)}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage >= Math.ceil(totalCount / pageSize)}
                            onClick={() => {
                                const params = new URLSearchParams(window.location.search)
                                params.set('page', (currentPage + 1).toString())
                                router.push(`?${params.toString()}`)
                            }}
                            className="h-9 px-4 hover:bg-slate-50"
                        >
                            Sonraki
                        </Button>
                    </div>
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
                                            {selectedQual.campaign_name || 'Detay bulunamadı'}
                                        </div>
                                    </div>
                                )}
                                {getEkSoru(selectedQual.customers?.notes) && (
                                    <div className="space-y-1 col-span-2 bg-indigo-50 p-2 rounded-lg border border-indigo-100 mt-2">
                                        <Label className="text-xs text-indigo-700 font-bold flex items-center gap-1">
                                            <MessageSquareText className="w-3 h-3" /> Reklam Ek Soru
                                        </Label>
                                        <div className="text-sm text-indigo-900 break-words font-medium whitespace-pre-wrap">
                                            {getEkSoru(selectedQual.customers?.notes)}
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
                            <Select value={selectedProject} onValueChange={setSelectedProject}>
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
                        <div className="space-y-2">
                            <Label>Açıklama (Talep Detayı)</Label>
                            <Textarea 
                                placeholder="Müşterinin talepleri, aradığı özellikler vb..." 
                                value={saleDescription} 
                                onChange={e => setSaleDescription(e.target.value)}
                                rows={3}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Müşteriyi satış hunisine aktarabilmek için en az bir proje seçimi zorunludur.</p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsQualifyDialogOpen(false)}>İptal</Button>
                        <Button variant="default" className="bg-green-600 hover:bg-green-700" onClick={submitQualify} disabled={!selectedProject}>Satışa Aktar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Toplu Eleme Dialog */}
            <Dialog open={isBulkDisqualifyDialogOpen} onOpenChange={setIsBulkDisqualifyDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="w-5 h-5" /> Soğuk Leadleri Toplu Ele
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-2 text-sm text-slate-600">
                        <p>AI tarafından <strong>Soğuk (❄️)</strong> olarak skorlanmış ve henüz elenmemiş tüm aktif adayları toplu olarak <strong>Elendi</strong> durumuna getirmek istediğinizden emin misiniz?</p>
                        <p className="text-xs text-red-500 font-medium">Bu işlem tüm aktif soğuk adayları toplu olarak güncelleyecektir.</p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsBulkDisqualifyDialogOpen(false)} disabled={isBulkDisqualifying}>İptal</Button>
                        <Button variant="destructive" onClick={handleBulkDisqualify} disabled={isBulkDisqualifying}>
                            {isBulkDisqualifying ? 'Eleniyor...' : 'Evet, Soğukları Ele'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
