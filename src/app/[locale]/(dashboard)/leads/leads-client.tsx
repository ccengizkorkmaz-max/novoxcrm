'use client'

import { useState, useMemo, useTransition } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Target, Search, Filter, ArrowRight, Phone, Mail, Calendar,
    User, Pencil, Trash2, ArrowUpRight, Trophy, Loader2, CheckCircle2, Building2, PhoneCall,
    SlidersHorizontal, BarChart3, ChevronUp, ChevronDown, Info,
    Plus, Upload, Download, Volume2, Headphones, StickyNote, Activity, Sparkles, Send
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { 
    updateLead, convertLeadToCustomer, deleteLead,
    bulkCreateLeads, getLeadActivities, addLeadActivityNote 
} from './lead-actions'
import { AiSignalBadge } from "@/components/ui/ai-signal-badge"
import { LeadScoreBadge } from "@/components/customers/LeadScoreBadge"
import ColumnVisibilityPicker from '@/components/ui/column-visibility-picker'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'
import * as XLSX from 'xlsx'
import { ActivityForm } from '@/components/activities/activity-form'
import { Link } from '@/i18n/routing'

const AiCallDialog = dynamic(() => import('../crm/components/AiCallDialog'), { ssr: false })

interface Lead {
    id: string
    full_name: string
    phone: string | null
    email: string | null
    status: string
    sub_status?: string | null
    lead_score?: string | null
    last_call_at?: string | null
    call_count?: number
    source: string | null
    form_name: string | null
    assigned_to: string | null
    notes: string | null
    created_at: string
    profiles?: { full_name: string } | null
    project_id?: string | null
    projects?: { name: string } | null
    company_name?: string | null
    company_phone?: string | null
    lead_score_ai?: string | null
    lead_score_source?: string | null
    lead_score_history?: any[] | null
}

interface LeadsPageClientProps {
    leads: Lead[]
    teamMembers: { id: string; full_name: string; role: string }[]
    projects: { id: string; name: string }[]
    userRole: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    new: { label: 'Yeni', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
    contacted: { label: 'İletişime Geçildi', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
    qualified: { label: 'Nitelikli', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
    converted: { label: 'Dönüştürüldü', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
    lost: { label: 'Kaybedildi', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
}

const LEAD_COLUMNS = [
    { id: 'customer', label: 'Müşteri Adayı' },
    { id: 'contact', label: 'İletişim Bilgileri' },
    { id: 'project', label: 'İlişkili Proje' },
    { id: 'status', label: 'Durum & Skor' },
    { id: 'source', label: 'Kaynak' },
    { id: 'assigned', label: 'Atanan Temsilci' },
    { id: 'date', label: 'Kayıt Tarihi' },
]

export default function LeadsPageClient({ leads, teamMembers, projects, userRole }: LeadsPageClientProps) {
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('active')
    const [sourceFilter, setSourceFilter] = useState<string>('all')
    const [projectFilter, setProjectFilter] = useState<string>('all')
    const [assigneeFilter, setAssigneeFilter] = useState<string>('all')
    const [selectedCallLeadId, setSelectedCallLeadId] = useState<string | null>(null)

    // UI Configuration States
    const [statsOpen, setStatsOpen] = useState(true)
    const [viewsOpen, setViewsOpen] = useState(false)
    const [hiddenCols, setHiddenCols] = useState<string[]>([])

    // Sorting States
    const [sortField, setSortField] = useState<string | null>('date')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

    // Inline Update States (Loading feedback)
    const [updatingLeadId, setUpdatingLeadId] = useState<string | null>(null)

    // Edit dialog
    const [editLead, setEditLead] = useState<Lead | null>(null)
    const [editForm, setEditForm] = useState({ 
        full_name: '', 
        phone: '', 
        email: '', 
        status: '', 
        assigned_to: '', 
        notes: '',
        project_id: '',
        company_name: '',
        company_phone: ''
    })

    // Drawer states for Lead details and timeline
    const [selectedDetailLead, setSelectedDetailLead] = useState<Lead | null>(null)
    const [detailActivities, setDetailActivities] = useState<any[]>([])
    const [activitiesLoading, setActivitiesLoading] = useState(false)
    const [newNoteText, setNewNoteText] = useState('')


    // Excel Import Wizard States
    const [importWizardOpen, setImportWizardOpen] = useState(false)
    const [rawExcelData, setRawExcelData] = useState<any[]>([])
    const [excelHeaders, setExcelHeaders] = useState<string[]>([])
    const [mappings, setMappings] = useState({
        full_name: '',
        phone: '',
        email: '',
        project: '',
        notes: '',
        source: ''
    })

    // Convert dialog
    const [convertLead, setConvertLead] = useState<Lead | null>(null)
    const [convertForm, setConvertForm] = useState({
        createOpportunity: true,
        opportunityTitle: '',
        opportunityStage: 'prospect',
        opportunityValue: '',
        opportunityCurrency: 'TRY'
    })
    const [companyForm, setCompanyForm] = useState({
        companyName: '', companyPhone: '', taxNumber: '', taxOffice: '', sector: ''
    })
    const [personForm, setPersonForm] = useState({
        fullName: '', phone: '', email: '', source: ''
    })
    const [convertResult, setConvertResult] = useState<{ success: boolean; message?: string } | null>(null)

    // Activity form dialog state
    const [showCreateActivityDialog, setShowCreateActivityDialog] = useState(false)

    const [isPending, startTransition] = useTransition()

    // Unique sources
    const sources = useMemo(() => {
        const set = new Set(leads.map(l => l.source).filter(Boolean))
        return Array.from(set) as string[]
    }, [leads])

    // Filtered & Sorted Leads
    const filtered = useMemo(() => {
        let result = leads.filter(lead => {
            const matchesSearch = !search ||
                lead.full_name.toLowerCase().includes(search.toLowerCase()) ||
                lead.phone?.includes(search) ||
                lead.email?.toLowerCase().includes(search.toLowerCase())
            const matchesStatus =
                statusFilter === 'all'
                    ? true
                    : statusFilter === 'active'
                        ? (lead.status !== 'converted' && lead.status !== 'lost')
                        : lead.status === statusFilter
            const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter
            const matchesProject = projectFilter === 'all' || lead.project_id === projectFilter
            const matchesAssignee = assigneeFilter === 'all' || 
                (assigneeFilter === 'unassigned' ? !lead.assigned_to : lead.assigned_to === assigneeFilter)

            return matchesSearch && matchesStatus && matchesSource && matchesProject && matchesAssignee
        })

        if (sortField) {
            result.sort((a, b) => {
                let valA = a[sortField as keyof Lead] ?? ''
                let valB = b[sortField as keyof Lead] ?? ''
                
                if (sortField === 'customer') {
                    valA = a.full_name || ''
                    valB = b.full_name || ''
                } else if (sortField === 'project') {
                    valA = a.projects?.name || ''
                    valB = b.projects?.name || ''
                } else if (sortField === 'assigned') {
                    valA = a.profiles?.full_name || ''
                    valB = b.profiles?.full_name || ''
                } else if (sortField === 'contact') {
                    valA = a.phone || a.email || ''
                    valB = b.phone || b.email || ''
                }

                if (typeof valA === 'string') {
                    return sortOrder === 'asc' 
                        ? valA.localeCompare(valB as string) 
                        : (valB as string).localeCompare(valA)
                } else {
                    return sortOrder === 'asc' 
                        ? (valA > valB ? 1 : -1) 
                        : (valA < valB ? 1 : -1)
                }
            })
        }

        return result
    }, [leads, search, statusFilter, sourceFilter, projectFilter, assigneeFilter, sortField, sortOrder])

    // Stats
    const stats = useMemo(() => ({
        total: leads.length,
        new: leads.filter(l => l.status === 'new').length,
        contacted: leads.filter(l => l.status === 'contacted').length,
        qualified: leads.filter(l => l.status === 'qualified').length,
        converted: leads.filter(l => l.status === 'converted').length,
    }), [leads])

    // --- Handlers ---
    const handleOpenDetail = async (lead: Lead) => {
        setSelectedDetailLead(lead)
        setActivitiesLoading(true)
        setDetailActivities([])
        try {
            const res = await getLeadActivities(lead.id)
            if (res.success && res.activities) {
                setDetailActivities(res.activities)
            } else {
                toast.error(res.error || 'Aktiviteler yüklenirken hata oluştu')
            }
        } catch (err) {
            console.error(err)
            toast.error('Aktiviteler yüklenemedi')
        } finally {
            setActivitiesLoading(false)
        }
    }

    const handleAddNote = async () => {
        if (!selectedDetailLead || !newNoteText.trim()) return
        startTransition(async () => {
            const res = await addLeadActivityNote(selectedDetailLead.id, newNoteText.trim())
            if (res.success) {
                toast.success('Not başarıyla eklendi')
                setNewNoteText('')
                // Refresh activities
                const actRes = await getLeadActivities(selectedDetailLead.id)
                if (actRes.success && actRes.activities) {
                    setDetailActivities(actRes.activities)
                }
            } else {
                toast.error(res.error || 'Not eklenirken hata oluştu')
            }
        })
    }

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortOrder('asc')
        }
    }

    const openEdit = (lead: Lead) => {
        setEditForm({
            full_name: lead.full_name,
            phone: lead.phone || '',
            email: lead.email || '',
            status: lead.status,
            assigned_to: lead.assigned_to || '',
            notes: lead.notes || '',
            project_id: lead.project_id || '',
            company_name: lead.company_name || '',
            company_phone: lead.company_phone || ''
        })
        setEditLead(lead)
    }

    const handleSaveEdit = () => {
        if (!editLead) return
        startTransition(async () => {
            const res = await updateLead(editLead.id, {
                full_name: editForm.full_name,
                phone: editForm.phone || null,
                email: editForm.email || null,
                status: editForm.status,
                assigned_to: editForm.assigned_to || null,
                notes: editForm.notes || null,
                project_id: editForm.project_id || null,
                company_name: editForm.company_name || null,
                company_phone: editForm.company_phone || null
            })
            if (res.success) {
                toast.success('Müşteri adayı başarıyla güncellendi.')
                setEditLead(null)
            } else {
                toast.error(res.error || 'Güncelleme başarısız oldu')
            }
        })
    }

    const handleInlineUpdateProject = async (leadId: string, projectId: string | null) => {
        setUpdatingLeadId(leadId)
        const res = await updateLead(leadId, { project_id: projectId })
        setUpdatingLeadId(null)
        if (res.success) {
            toast.success('İlişkili proje güncellendi.')
        } else {
            toast.error(res.error || 'Proje güncellenemedi.')
        }
    }

    const handleInlineUpdateAssignee = async (leadId: string, assignedTo: string | null) => {
        setUpdatingLeadId(leadId)
        const res = await updateLead(leadId, { assigned_to: assignedTo })
        setUpdatingLeadId(null)
        if (res.success) {
            toast.success('Atanan temsilci güncellendi.')
        } else {
            toast.error(res.error || 'Temsilci atanamadı.')
        }
    }

    const openConvert = (lead: Lead) => {
        setConvertForm({
            createOpportunity: true,
            opportunityTitle: `${lead.full_name} - Fırsat`,
            opportunityStage: 'prospect',
            opportunityValue: '',
            opportunityCurrency: 'TRY'
        })
        setCompanyForm({ 
            companyName: lead.company_name || '', 
            companyPhone: lead.company_phone || lead.phone || '', 
            taxNumber: '', 
            taxOffice: '', 
            sector: '' 
        })
        setPersonForm({
            fullName: lead.full_name || '',
            phone: lead.phone || '',
            email: lead.email || '',
            source: lead.source || ''
        })
        setConvertResult(null)
        setConvertLead(lead)
    }

    const handleConvert = () => {
        if (!convertLead) return
        startTransition(async () => {
            const hasCompany = !!companyForm.companyName.trim()
            const res = await convertLeadToCustomer(convertLead.id, {
                createOpportunity: convertForm.createOpportunity,
                opportunityTitle: convertForm.opportunityTitle || undefined,
                opportunityStage: convertForm.opportunityStage,
                opportunityValue: convertForm.opportunityValue ? Number(convertForm.opportunityValue) : undefined,
                opportunityCurrency: convertForm.opportunityCurrency,
                customerData: {
                    fullName: personForm.fullName.trim(),
                    phone: personForm.phone.trim() || null,
                    email: personForm.email.trim() || null,
                    source: personForm.source.trim() || null
                },
                companyData: hasCompany ? {
                    companyName: companyForm.companyName.trim(),
                    companyPhone: companyForm.companyPhone || undefined,
                    taxNumber: companyForm.taxNumber || undefined,
                    taxOffice: companyForm.taxOffice || undefined,
                    sector: companyForm.sector || undefined,
                } : undefined
            })
            setConvertResult(res)
            if (res.success) {
                toast.success('Müşteri adayı başarıyla dönüştürüldü.')
                setTimeout(() => {
                    setConvertLead(null)
                    setConvertResult(null)
                }, 2000)
            } else {
                toast.error(res.message || 'Dönüştürme hatası')
            }
        })
    }

    const handleDelete = (lead: Lead) => {
        if (!confirm(`"${lead.full_name}" lead kaydını silmek istediğinize emin misiniz?`)) return
        startTransition(async () => {
            const res = await deleteLead(lead.id)
            if (res.success) {
                toast.success('Müşteri adayı başarıyla silindi.')
            } else {
                toast.error(res.error || 'Silme başarısız oldu')
            }
        })
    }


    const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = async (evt) => {
            try {
                const dataArray = evt.target?.result
                const workbook = XLSX.read(dataArray, { type: 'array' })
                const wsname = workbook.SheetNames[0]
                const ws = workbook.Sheets[wsname]
                const data = XLSX.utils.sheet_to_json(ws) as Array<Record<string, any>>

                if (!data || data.length === 0) {
                    toast.error('Excel dosyası boş veya okunamadı.')
                    return
                }

                const keys = Object.keys(data[0])
                const nameCol = keys.find(k => k.toLowerCase().includes('ad') || k.toLowerCase().includes('isim') || k.toLowerCase().includes('name') || k.toLowerCase().includes('müşteri')) || ''
                const phoneCol = keys.find(k => k.toLowerCase().includes('telefon') || k.toLowerCase().includes('phone') || k.toLowerCase().includes('tel') || k.toLowerCase() === 'gsm') || ''
                const emailCol = keys.find(k => k.toLowerCase().includes('e-posta') || k.toLowerCase().includes('eposta') || k.toLowerCase().includes('email')) || ''
                const projectCol = keys.find(k => k.toLowerCase().includes('proje') || k.toLowerCase().includes('project')) || ''
                const notesCol = keys.find(k => k.toLowerCase().includes('not') || k.toLowerCase().includes('acıklama') || k.toLowerCase().includes('aciklama') || k.toLowerCase().includes('description')) || ''
                const sourceCol = keys.find(k => k.toLowerCase().includes('kaynak') || k.toLowerCase().includes('source')) || ''

                setExcelHeaders(keys)
                setRawExcelData(data)
                setMappings({
                    full_name: nameCol,
                    phone: phoneCol,
                    email: emailCol,
                    project: projectCol,
                    notes: notesCol,
                    source: sourceCol
                })
                setImportWizardOpen(true)
            } catch (err) {
                console.error(err)
                toast.error('Excel dosyası işlenirken hata oluştu.')
            }
        }
        reader.readAsArrayBuffer(file)
        e.target.value = ''
    }

    const handleCompleteImport = () => {
        if (!mappings.full_name) {
            toast.error('Lütfen "Ad Soyad" sütun eşleşmesini seçin.')
            return
        }

        const parsedLeads = rawExcelData.map(row => {
            const fullName = String(row[mappings.full_name] || '').trim()
            const phone = mappings.phone ? String(row[mappings.phone] || '').trim() : ''
            const email = mappings.email ? String(row[mappings.email] || '').trim() : ''
            const projectName = mappings.project ? String(row[mappings.project] || '').trim() : ''
            const notes = mappings.notes ? String(row[mappings.notes] || '').trim() : ''
            const source = mappings.source ? String(row[mappings.source] || '').trim() : 'excel_import'

            let matchedProjectId: string | null = null
            if (projectName) {
                const proj = projects.find(p => p.name.toLowerCase() === projectName.toLowerCase())
                if (proj) matchedProjectId = proj.id
            }

            return {
                full_name: fullName,
                phone: phone || null,
                email: email || null,
                project_id: matchedProjectId,
                notes: notes || null,
                source: source || 'excel_import',
                assigned_to: null
            }
        }).filter(lead => lead.full_name.length > 0)

        if (parsedLeads.length === 0) {
            toast.error('Yüklenecek geçerli aday kaydı bulunamadı.')
            return
        }

        startTransition(async () => {
            const res = await bulkCreateLeads(parsedLeads)
            if (res.success) {
                toast.success(`${parsedLeads.length} müşteri adayı başarıyla yüklendi.`)
                setImportWizardOpen(false)
                setRawExcelData([])
                setExcelHeaders([])
            } else {
                toast.error(res.error || 'Excel yükleme sırasında bir hata oluştu.')
            }
        })
    }

    const handleExportExcel = () => {
        try {
            const exportData = filtered.map(lead => {
                const statusConfRaw = STATUS_CONFIG[lead.status] || STATUS_CONFIG.new
                let statusLabel = statusConfRaw.label
                if (lead.status === 'contacted') {
                    if (lead.sub_status === 'answered') {
                        statusLabel = 'İletişime Geçildi - Başarılı'
                    } else if (lead.sub_status === 'unreachable') {
                        statusLabel = 'İletişime Geçildi - Ulaşılamadı'
                    }
                }

                return {
                    'Ad Soyad': lead.full_name,
                    'Telefon': lead.phone || '',
                    'E-posta': lead.email || '',
                    'Durum': statusLabel,
                    'Skor': lead.lead_score || '',
                    'Kaynak': lead.source || '',
                    'İlişkili Proje': lead.projects?.name || '',
                    'Atanan Temsilci': lead.profiles?.full_name || '',
                    'Notlar': lead.notes || '',
                    'Kayıt Tarihi': new Date(lead.created_at).toLocaleDateString('tr-TR')
                }
            })

            const worksheet = XLSX.utils.json_to_sheet(exportData)
            const workbook = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Müşteri Adayları')
            XLSX.writeFile(workbook, `NovoCRM_Musteri_Adaylari_${new Date().toISOString().slice(0, 10)}.xlsx`)
            toast.success('Excel dosyası başarıyla indirildi.')
        } catch (err) {
            console.error(err)
            toast.error('Excel dosyası oluşturulurken hata oluştu.')
        }
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Target className="h-6 w-6 text-indigo-500 animate-pulse" />
                        Müşteri Adayları
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Gelen lead&apos;leri takip edin ve müşteriye dönüştürün
                    </p>
                </div>
                
                {/* Header Actions */}
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        variant={statsOpen ? "default" : "outline"}
                        size="sm"
                        onClick={() => setStatsOpen(!statsOpen)}
                        className={statsOpen ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm text-xs font-semibold" : "text-slate-600 border-slate-200 hover:bg-slate-50 text-xs font-semibold"}
                    >
                        <BarChart3 className="w-4 h-4 mr-1.5" />
                        İstatistikler
                    </Button>
                    <Button
                        variant={viewsOpen ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewsOpen(!viewsOpen)}
                        className={viewsOpen ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm text-xs font-semibold" : "text-slate-600 border-slate-200 hover:bg-slate-50 text-xs font-semibold"}
                    >
                        <SlidersHorizontal className="w-4 h-4 mr-1.5" />
                        Görünüm Ayarları
                    </Button>

                    <div className="h-6 w-px bg-slate-200 mx-1 hidden md:block" />

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportExcel}
                        className="text-emerald-700 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 text-xs font-semibold"
                    >
                        <Download className="w-4 h-4 mr-1.5" />
                        Excel İndir
                    </Button>

                    <label className="cursor-pointer">
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            className="hidden"
                            onChange={handleImportExcel}
                        />
                        <span className="inline-flex items-center justify-center rounded-md text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-slate-200 bg-background shadow-sm hover:bg-slate-50 text-slate-600 h-9 px-3">
                            <Upload className="w-4 h-4 mr-1.5" />
                            Excel Yükle
                        </span>
                    </label>

                    <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm text-xs font-semibold"
                        asChild
                    >
                        <Link href="/leads/new">
                            <Plus className="w-4 h-4 mr-1.5" />
                            Müşteri Adayı Ekle
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Dashboard Collapsible Stats (Premium design) */}
            {statsOpen && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    {[
                        { label: 'Toplam Aday', value: stats.total, color: 'text-slate-700', icon: Target },
                        { label: 'Yeni', value: stats.new, color: 'text-blue-600', icon: CheckCircle2 },
                        { label: 'İletişimde', value: stats.contacted, color: 'text-amber-600', icon: PhoneCall },
                        { label: 'Nitelikli', value: stats.qualified, color: 'text-purple-600', icon: Trophy },
                        { label: 'Dönüşen', value: stats.converted, color: 'text-emerald-600', icon: ArrowUpRight },
                    ].map(stat => (
                        <Card key={stat.label} className="p-4 shadow-sm border border-slate-100 bg-white dark:bg-slate-900 rounded-xl relative overflow-hidden group hover:shadow-md transition-all">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</div>
                                    <div className={`text-3xl font-extrabold ${stat.color} mt-1`}>{stat.value}</div>
                                </div>
                                <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg group-hover:scale-110 transition-transform">
                                    <stat.icon className="h-5 w-5 text-slate-400" />
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Sütun Ayarları Bar */}
            {viewsOpen && (
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-card shadow-sm transition-all animate-in fade-in slide-in-from-top-4 duration-200">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex-wrap">
                        <span className="whitespace-nowrap">Tablo Görünüm Sütunları</span>
                        <ColumnVisibilityPicker
                            columns={LEAD_COLUMNS}
                            hiddenColumns={hiddenCols}
                            onToggle={(colId) => {
                                setHiddenCols(prev => prev.includes(colId) ? prev.filter(c => c !== colId) : [...prev, colId])
                            }}
                            onReset={() => setHiddenCols([])}
                            storageKey="LEADS_HIDDEN_COLS"
                        />
                    </div>
                </div>
            )}

            {/* Filters */}
            <Card className="shadow-sm border-slate-100">
                <CardContent className="pt-4 flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="İsim, telefon veya e-posta ile ara..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-9 border-slate-200 focus-visible:ring-indigo-500"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[150px] border-slate-200 text-xs">
                                <Filter className="h-3.5 w-3.5 mr-2 text-slate-400" />
                                <SelectValue placeholder="Durum" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">Aktif Adaylar</SelectItem>
                                <SelectItem value="all">Tüm Durumlar</SelectItem>
                                <SelectItem value="new">Yeni</SelectItem>
                                <SelectItem value="contacted">İletişime Geçildi</SelectItem>
                                <SelectItem value="qualified">Nitelikli</SelectItem>
                                <SelectItem value="converted">Dönüştürüldü</SelectItem>
                                <SelectItem value="lost">Kaybedildi</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={projectFilter} onValueChange={setProjectFilter}>
                            <SelectTrigger className="w-[150px] border-slate-200 text-xs">
                                <Building2 className="h-3.5 w-3.5 mr-2 text-slate-400" />
                                <SelectValue placeholder="Proje" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tüm Projeler</SelectItem>
                                {projects.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={sourceFilter} onValueChange={setSourceFilter}>
                            <SelectTrigger className="w-[150px] border-slate-200 text-xs">
                                <Target className="h-3.5 w-3.5 mr-2 text-slate-400" />
                                <SelectValue placeholder="Kaynak" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tüm Kaynaklar</SelectItem>
                                {sources.map(s => (
                                    <SelectItem key={s} value={s}>{s}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                            <SelectTrigger className="w-[150px] border-slate-200 text-xs">
                                <User className="h-3.5 w-3.5 mr-2 text-slate-400" />
                                <SelectValue placeholder="Temsilci" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tüm Temsilciler</SelectItem>
                                <SelectItem value="unassigned">Atanmamış</SelectItem>
                                {teamMembers.map(m => (
                                    <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Lead Table */}
            <Card className="shadow-md border-slate-100 rounded-xl overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50 dark:bg-slate-800">
                                <TableRow>
                                    {!hiddenCols.includes('customer') && (
                                        <TableHead className="cursor-pointer select-none hover:bg-slate-100 w-[240px]" onClick={() => handleSort('customer')}>
                                            <div className="flex items-center gap-1 font-semibold text-xs text-slate-500">
                                                Müşteri Adayı
                                                {sortField === 'customer' && (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                                            </div>
                                        </TableHead>
                                    )}
                                    {!hiddenCols.includes('contact') && (
                                        <TableHead className="cursor-pointer select-none hover:bg-slate-100" onClick={() => handleSort('contact')}>
                                            <div className="flex items-center gap-1 font-semibold text-xs text-slate-500">
                                                İletişim Bilgileri
                                                {sortField === 'contact' && (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                                            </div>
                                        </TableHead>
                                    )}
                                    {!hiddenCols.includes('project') && (
                                        <TableHead className="cursor-pointer select-none hover:bg-slate-100 w-[180px]" onClick={() => handleSort('project')}>
                                            <div className="flex items-center gap-1 font-semibold text-xs text-slate-500">
                                                İlişkili Proje
                                                {sortField === 'project' && (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                                            </div>
                                        </TableHead>
                                    )}
                                    {!hiddenCols.includes('status') && (
                                        <TableHead className="cursor-pointer select-none hover:bg-slate-100" onClick={() => handleSort('status')}>
                                            <div className="flex items-center gap-1 font-semibold text-xs text-slate-500">
                                                Durum & Skor
                                                {sortField === 'status' && (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                                            </div>
                                        </TableHead>
                                    )}
                                    {!hiddenCols.includes('source') && (
                                        <TableHead className="cursor-pointer select-none hover:bg-slate-100" onClick={() => handleSort('source')}>
                                            <div className="flex items-center gap-1 font-semibold text-xs text-slate-500">
                                                Kaynak
                                                {sortField === 'source' && (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                                            </div>
                                        </TableHead>
                                    )}
                                    {!hiddenCols.includes('assigned') && (
                                        <TableHead className="cursor-pointer select-none hover:bg-slate-100 w-[180px]" onClick={() => handleSort('assigned')}>
                                            <div className="flex items-center gap-1 font-semibold text-xs text-slate-500">
                                                Atanan Temsilci
                                                {sortField === 'assigned' && (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                                            </div>
                                        </TableHead>
                                    )}
                                    {!hiddenCols.includes('date') && (
                                        <TableHead className="cursor-pointer select-none hover:bg-slate-100" onClick={() => handleSort('date')}>
                                            <div className="flex items-center gap-1 font-semibold text-xs text-slate-500">
                                                Kayıt Tarihi
                                                {sortField === 'date' && (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                                            </div>
                                        </TableHead>
                                    )}
                                    <TableHead className="text-right font-semibold text-xs text-slate-500 w-[150px]">İşlemler</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={LEAD_COLUMNS.length + 1} className="text-center py-12 text-slate-400 bg-white">
                                            <Info className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                                            {search || statusFilter !== 'all' || projectFilter !== 'all' || sourceFilter !== 'all' || assigneeFilter !== 'all'
                                                ? 'Filtrelere uygun müşteri adayı bulunamadı.' 
                                                : 'Henüz müşteri adayı kaydı yok.'}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filtered.map(lead => {
                                        const statusConfRaw = STATUS_CONFIG[lead.status] || STATUS_CONFIG.new
                                        let statusConf = { ...statusConfRaw }
                                        if (lead.status === 'contacted') {
                                            if (lead.sub_status === 'answered') {
                                                statusConf = {
                                                    label: 'İletişime Geçildi - Başarılı',
                                                    color: 'text-emerald-700',
                                                    bg: 'bg-emerald-50 border-emerald-200'
                                                }
                                            } else if (lead.sub_status === 'unreachable') {
                                                statusConf = {
                                                    label: 'İletişime Geçildi - Ulaşılamadı',
                                                    color: 'text-rose-700',
                                                    bg: 'bg-rose-50 border-rose-200'
                                                }
                                            }
                                        }

                                        const isUpdating = updatingLeadId === lead.id

                                        return (
                                            <TableRow 
                                                key={lead.id} 
                                                className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                                                onClick={(e) => {
                                                    const target = e.target as HTMLElement
                                                    if (
                                                        target.closest('button') || 
                                                        target.closest('select') || 
                                                        target.closest('input') || 
                                                        target.closest('[role="combobox"]') || 
                                                        target.closest('a')
                                                    ) {
                                                        return
                                                    }
                                                    handleOpenDetail(lead)
                                                }}
                                            >
                                                {!hiddenCols.includes('customer') && (
                                                    <TableCell className="align-middle">
                                                        <div className="font-semibold text-slate-800 hover:text-indigo-600 hover:underline transition-colors">{lead.full_name}</div>
                                                        {lead.form_name && (
                                                            <div className="text-[10px] bg-slate-100 text-slate-500 inline-block px-1.5 py-0.5 rounded font-medium mt-1">
                                                                Form: {lead.form_name}
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                )}
                                                {!hiddenCols.includes('contact') && (
                                                    <TableCell className="align-middle">
                                                        <div className="flex flex-col gap-1 text-xs">
                                                            {lead.phone && (
                                                                <div className="flex items-center gap-2 group/phone">
                                                                    <span className="flex items-center gap-1 text-slate-600 font-medium">
                                                                        <Phone className="h-3 w-3 text-slate-400" /> {lead.phone}
                                                                    </span>
                                                                    {lead.status !== 'converted' && (
                                                                        <Button
                                                                            size="icon"
                                                                            variant="ghost"
                                                                            className="h-6 w-6 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-full transition-all"
                                                                            onClick={() => setSelectedCallLeadId(lead.id)}
                                                                            title="AI Arama Başlat"
                                                                        >
                                                                            <PhoneCall className="h-3 w-3" />
                                                                        </Button>
                                                                    )}
                                                                    {lead.last_call_at && (
                                                                        <AiSignalBadge
                                                                            lastCallAt={lead.last_call_at}
                                                                            interestLevel={lead.lead_score}
                                                                            callNotes={lead.notes}
                                                                        />
                                                                    )}
                                                                </div>
                                                            )}
                                                            {lead.email && (
                                                                <span className="flex items-center gap-1 text-slate-400">
                                                                    <Mail className="h-3 w-3" /> {lead.email}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                )}
                                                {!hiddenCols.includes('project') && (
                                                    <TableCell className="align-middle">
                                                        <Select
                                                            disabled={isUpdating}
                                                            value={lead.project_id || 'none'}
                                                            onValueChange={(val) => handleInlineUpdateProject(lead.id, val === 'none' ? null : val)}
                                                        >
                                                            <SelectTrigger className="h-8 text-xs border-transparent hover:border-slate-200 bg-transparent py-1 w-full max-w-[150px] focus:ring-slate-100">
                                                                <SelectValue placeholder="Proje Seçin" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="none">Proje Yok</SelectItem>
                                                                {projects.map(p => (
                                                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </TableCell>
                                                )}
                                                {!hiddenCols.includes('status') && (
                                                    <TableCell className="align-middle">
                                                        <Badge variant="outline" className={`${statusConf.bg} ${statusConf.color} text-[10px] font-bold py-0.5 px-2 rounded-full border`}>
                                                            {statusConf.label}
                                                        </Badge>
                                                    </TableCell>
                                                )}
                                                {!hiddenCols.includes('source') && (
                                                    <TableCell className="align-middle">
                                                        <span className="text-xs text-slate-500 font-medium bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                                            {lead.source || '-'}
                                                        </span>
                                                    </TableCell>
                                                )}
                                                {!hiddenCols.includes('assigned') && (
                                                    <TableCell className="align-middle">
                                                        <Select
                                                            disabled={isUpdating}
                                                            value={lead.assigned_to || 'none'}
                                                            onValueChange={(val) => handleInlineUpdateAssignee(lead.id, val === 'none' ? null : val)}
                                                        >
                                                            <SelectTrigger className="h-8 text-xs border-transparent hover:border-slate-200 bg-transparent py-1 w-full max-w-[150px] focus:ring-slate-100">
                                                                <SelectValue placeholder="Atanmadı" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="none">Atanmadı</SelectItem>
                                                                {teamMembers.map(m => (
                                                                    <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </TableCell>
                                                )}
                                                {!hiddenCols.includes('date') && (
                                                    <TableCell className="align-middle">
                                                        <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                                                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                                            {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true, locale: tr })}
                                                        </span>
                                                    </TableCell>
                                                )}
                                                <TableCell className="align-middle text-right">
                                                    <div className="flex items-center gap-1 justify-end">
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 hover:bg-slate-100 rounded-lg" onClick={() => openEdit(lead)}>
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                        {lead.status !== 'converted' && lead.status !== 'lost' && (
                                                            <Button size="sm" variant="outline" className="text-xs font-bold gap-1.5 h-8 border-emerald-100 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 shadow-sm" onClick={() => openConvert(lead)}>
                                                                <ArrowUpRight className="h-3 w-3" />
                                                                Dönüştür
                                                            </Button>
                                                        )}
                                                        {(userRole === 'owner' || userRole === 'admin' || userRole === 'manager') && (
                                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg" onClick={() => handleDelete(lead)}>
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* ====== ADD DIALOG (MANUEL EKLEME) ====== */}


            {/* ====== EXCEL IMPORT WIZARD DIALOG ====== */}
            <Dialog open={importWizardOpen} onOpenChange={(open) => {
                if (!open) {
                    setImportWizardOpen(false);
                    setRawExcelData([]);
                    setExcelHeaders([]);
                }
            }}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Upload className="h-5 w-5 text-indigo-500" />
                            Excel İçe Aktarma Sihirbazı
                        </DialogTitle>
                        <DialogDescription>
                            Lütfen Excel dosyanızdaki sütunları sistemdeki müşteri adayı alanlarıyla eşleştirin.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-2 max-h-[65vh] overflow-y-auto pr-2">
                        {/* Mapping grid */}
                        <div className="grid grid-cols-2 gap-4 border p-4 rounded-xl bg-slate-50/50">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase">Sistem Alanı</Label>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase">Excel Sütun Başlığı</Label>
                            </div>

                            {/* Full Name (Required) */}
                            <div className="flex items-center">
                                <span className="text-sm font-semibold text-slate-700">Ad Soyad *</span>
                            </div>
                            <div>
                                <Select value={mappings.full_name || 'none'} onValueChange={v => setMappings(m => ({ ...m, full_name: v === 'none' ? '' : v }))}>
                                    <SelectTrigger className="w-full bg-white"><SelectValue placeholder="Seçiniz (Zorunlu)" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Seçilmedi</SelectItem>
                                        {excelHeaders.map(h => (
                                            <SelectItem key={h} value={h}>{h}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Phone */}
                            <div className="flex items-center">
                                <span className="text-sm font-semibold text-slate-700">Telefon</span>
                            </div>
                            <div>
                                <Select value={mappings.phone || 'none'} onValueChange={v => setMappings(m => ({ ...m, phone: v === 'none' ? '' : v }))}>
                                    <SelectTrigger className="w-full bg-white"><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Seçilmedi</SelectItem>
                                        {excelHeaders.map(h => (
                                            <SelectItem key={h} value={h}>{h}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Email */}
                            <div className="flex items-center">
                                <span className="text-sm font-semibold text-slate-700">E-posta</span>
                            </div>
                            <div>
                                <Select value={mappings.email || 'none'} onValueChange={v => setMappings(m => ({ ...m, email: v === 'none' ? '' : v }))}>
                                    <SelectTrigger className="w-full bg-white"><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Seçilmedi</SelectItem>
                                        {excelHeaders.map(h => (
                                            <SelectItem key={h} value={h}>{h}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Project */}
                            <div className="flex items-center">
                                <span className="text-sm font-semibold text-slate-700">İlişkili Proje</span>
                            </div>
                            <div>
                                <Select value={mappings.project || 'none'} onValueChange={v => setMappings(m => ({ ...m, project: v === 'none' ? '' : v }))}>
                                    <SelectTrigger className="w-full bg-white"><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Seçilmedi</SelectItem>
                                        {excelHeaders.map(h => (
                                            <SelectItem key={h} value={h}>{h}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Source */}
                            <div className="flex items-center">
                                <span className="text-sm font-semibold text-slate-700">Kaynak</span>
                            </div>
                            <div>
                                <Select value={mappings.source || 'none'} onValueChange={v => setMappings(m => ({ ...m, source: v === 'none' ? '' : v }))}>
                                    <SelectTrigger className="w-full bg-white"><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Seçilmedi</SelectItem>
                                        {excelHeaders.map(h => (
                                            <SelectItem key={h} value={h}>{h}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Notes */}
                            <div className="flex items-center">
                                <span className="text-sm font-semibold text-slate-700">Notlar</span>
                            </div>
                            <div>
                                <Select value={mappings.notes || 'none'} onValueChange={v => setMappings(m => ({ ...m, notes: v === 'none' ? '' : v }))}>
                                    <SelectTrigger className="w-full bg-white"><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Seçilmedi</SelectItem>
                                        {excelHeaders.map(h => (
                                            <SelectItem key={h} value={h}>{h}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Preview section */}
                        {mappings.full_name && (
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase">Önizleme (İlk 3 Kayıt)</Label>
                                <div className="border rounded-lg overflow-hidden bg-white text-xs">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 border-b font-semibold text-slate-600">
                                                <th className="p-2">Ad Soyad</th>
                                                <th className="p-2">Telefon</th>
                                                <th className="p-2">E-posta</th>
                                                <th className="p-2">Proje</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rawExcelData.slice(0, 3).map((row, idx) => (
                                                <tr key={idx} className="border-b last:border-0 hover:bg-slate-50/50">
                                                    <td className="p-2 font-medium">{row[mappings.full_name] || '-'}</td>
                                                    <td className="p-2 text-slate-500">{mappings.phone ? row[mappings.phone] || '-' : '-'}</td>
                                                    <td className="p-2 text-slate-500">{mappings.email ? row[mappings.email] || '-' : '-'}</td>
                                                    <td className="p-2 text-slate-500">{mappings.project ? row[mappings.project] || '-' : '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setImportWizardOpen(false);
                            setRawExcelData([]);
                            setExcelHeaders([]);
                        }}>
                            Vazgeç
                        </Button>
                        <Button
                            onClick={handleCompleteImport}
                            disabled={isPending || !mappings.full_name}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            {isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Aktarılıyor...</> : 'İçe Aktar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ====== EDIT DIALOG (SCRUM-9) ====== */}
            <Dialog open={!!editLead} onOpenChange={(open) => !open && setEditLead(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Lead Düzenle</DialogTitle>
                        <DialogDescription>Müşteri adayı bilgilerini güncelleyin.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Ad Soyad</Label>
                            <Input value={editForm.full_name} onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label>Telefon</Label>
                                <Input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
                            </div>
                            <div className="space-y-2">
                                <Label>E-posta</Label>
                                <Input value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label>Firma Adı</Label>
                                <Input value={editForm.company_name} onChange={e => setEditForm(f => ({ ...f, company_name: e.target.value }))} />
                            </div>
                            <div className="space-y-2">
                                <Label>Firma Telefonu</Label>
                                <Input value={editForm.company_phone} onChange={e => setEditForm(f => ({ ...f, company_phone: e.target.value }))} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label>Durum</Label>
                                <Select value={editForm.status} onValueChange={v => setEditForm(f => ({ ...f, status: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="new">Yeni</SelectItem>
                                        <SelectItem value="contacted">İletişime Geçildi</SelectItem>
                                        <SelectItem value="qualified">Nitelikli</SelectItem>
                                        <SelectItem value="lost">Kaybedildi</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Atanan Kişi</Label>
                                <Select value={editForm.assigned_to || 'none'} onValueChange={v => setEditForm(f => ({ ...f, assigned_to: v === 'none' ? '' : v }))}>
                                    <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Atanmadı</SelectItem>
                                        {teamMembers.map(m => (
                                            <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>İlişkili Proje</Label>
                            <Select value={editForm.project_id || 'none'} onValueChange={v => setEditForm(f => ({ ...f, project_id: v === 'none' ? '' : v }))}>
                                <SelectTrigger><SelectValue placeholder="Proje Seçin" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Proje Yok</SelectItem>
                                    {projects.map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Notlar</Label>
                            <Textarea value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} rows={3} />
                        </div>
                        {editLead && (
                            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800 mt-2">
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Lead Skoru</span>
                                <LeadScoreBadge
                                    leadId={editLead.id}
                                    score={editLead.lead_score || undefined}
                                    source={editLead.lead_score_source || undefined}
                                    history={editLead.lead_score_history || undefined}
                                    userRole={userRole}
                                />
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditLead(null)}>Vazgeç</Button>
                        <Button onClick={handleSaveEdit} disabled={isPending}>
                            {isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Kaydediliyor...</> : 'Kaydet'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ====== CONVERT DIALOG (SCRUM-10 + SCRUM-11 + SCRUM-14) ====== */}
            <Dialog open={!!convertLead} onOpenChange={(open) => !open && setConvertLead(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ArrowUpRight className="h-5 w-5 text-emerald-500" />
                            Müşteri Adayını Dönüştür
                        </DialogTitle>
                        <DialogDescription>
                            <strong>{convertLead?.full_name}</strong> isimli müşteri adayı için yeni bir müşteri kaydı oluşturulur. Firma bilgileri girilirse firma kaydı da oluşturulup ilişkilendirilecektir.
                        </DialogDescription>
                    </DialogHeader>

                    {convertResult?.success ? (
                        <div className="flex flex-col items-center py-6 gap-3">
                            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                            <p className="text-emerald-700 font-medium">{convertResult.message}</p>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
                                {/* Kişi Bilgileri (Editable) */}
                                <div className="space-y-3 p-4 border rounded-xl bg-slate-50/50 dark:bg-slate-900/30 border-slate-200/60 dark:border-slate-800">
                                    <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200 text-sm">
                                        <User className="h-4 w-4 text-indigo-500" />
                                        Kişi Bilgileri
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Ad Soyad</Label>
                                        <Input
                                            value={personForm.fullName}
                                            onChange={e => setPersonForm(p => ({ ...p, fullName: e.target.value }))}
                                            placeholder="Ad Soyad"
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-2">
                                            <Label>Telefon</Label>
                                            <Input
                                                value={personForm.phone}
                                                onChange={e => setPersonForm(p => ({ ...p, phone: e.target.value }))}
                                                placeholder="Telefon"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>E-posta</Label>
                                            <Input
                                                type="email"
                                                value={personForm.email}
                                                onChange={e => setPersonForm(p => ({ ...p, email: e.target.value }))}
                                                placeholder="E-posta"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Kaynak</Label>
                                        <Input
                                            value={personForm.source}
                                            onChange={e => setPersonForm(p => ({ ...p, source: e.target.value }))}
                                            placeholder="Örn. Web Sitesi, Referans"
                                        />
                                    </div>
                                </div>

                                {/* Firma bilgileri (Opsiyonel) */}
                                <div className="space-y-3 p-4 border rounded-xl bg-slate-50/50 dark:bg-slate-900/30 border-slate-200/60 dark:border-slate-800">
                                    <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200 text-sm">
                                        <Building2 className="h-4 w-4 text-indigo-500" />
                                        Firma Bilgileri (Opsiyonel)
                                    </div>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                        Firma adı girilirse, firma da otomatik oluşturularak müşteriyle ilişkilendirilir.
                                    </p>
                                    <div className="space-y-2">
                                        <Label>Firma Adı</Label>
                                        <Input
                                            placeholder="Örn. ABC Holding A.Ş."
                                            value={companyForm.companyName}
                                            onChange={e => setCompanyForm(f => ({ ...f, companyName: e.target.value }))}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-2">
                                            <Label>Vergi No</Label>
                                            <Input value={companyForm.taxNumber} onChange={e => setCompanyForm(f => ({ ...f, taxNumber: e.target.value }))} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Vergi Dairesi</Label>
                                            <Input value={companyForm.taxOffice} onChange={e => setCompanyForm(f => ({ ...f, taxOffice: e.target.value }))} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-2">
                                            <Label>Firma Telefonu</Label>
                                            <Input 
                                                placeholder="Örn. 02123334455" 
                                                value={companyForm.companyPhone} 
                                                onChange={e => setCompanyForm(f => ({ ...f, companyPhone: e.target.value }))} 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Sektör</Label>
                                            <Input placeholder="Örn. İnşaat, Gayrimenkul" value={companyForm.sector} onChange={e => setCompanyForm(f => ({ ...f, sector: e.target.value }))} />
                                        </div>
                                    </div>
                                </div>

                                {/* Fırsat oluşturma */}
                                <div className="flex items-start gap-3 p-3 border rounded-lg dark:border-slate-800">
                                    <Checkbox
                                        id="createOpp"
                                        checked={convertForm.createOpportunity}
                                        onCheckedChange={(v) => setConvertForm(f => ({ ...f, createOpportunity: !!v }))}
                                    />
                                    <div>
                                        <Label htmlFor="createOpp" className="flex items-center gap-1.5 cursor-pointer text-slate-800 dark:text-slate-200 font-semibold">
                                            <Trophy className="h-4 w-4 text-amber-500" />
                                            Satış fırsatı da oluştur
                                        </Label>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Opportunities pipeline&apos;ına otomatik kayıt oluşturur
                                        </p>
                                    </div>
                                </div>

                                {convertForm.createOpportunity && (
                                    <div className="space-y-3 pl-6 border-l-2 border-amber-200 dark:border-amber-900">
                                        <div className="space-y-2">
                                            <Label>Fırsat Başlığı</Label>
                                            <Input
                                                value={convertForm.opportunityTitle}
                                                onChange={e => setConvertForm(f => ({ ...f, opportunityTitle: e.target.value }))}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-2">
                                                <Label>Tahmini Değer</Label>
                                                <Input
                                                    type="number"
                                                    placeholder="0"
                                                    value={convertForm.opportunityValue}
                                                    onChange={e => setConvertForm(f => ({ ...f, opportunityValue: e.target.value }))}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Para Birimi</Label>
                                                <Select value={convertForm.opportunityCurrency} onValueChange={v => setConvertForm(f => ({ ...f, opportunityCurrency: v }))}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="TRY">₺ TRY</SelectItem>
                                                        <SelectItem value="USD">$ USD</SelectItem>
                                                        <SelectItem value="EUR">€ EUR</SelectItem>
                                                        <SelectItem value="GBP">£ GBP</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {convertResult && !convertResult.success && (
                                    <p className="text-sm text-red-600">{convertResult.message || 'Dönüştürme hatası'}</p>
                                )}
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setConvertLead(null)}>Vazgeç</Button>
                                <Button
                                    onClick={handleConvert}
                                    disabled={isPending}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5"
                                >
                                    {isPending ? (
                                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Dönüştürülüyor...</>
                                    ) : (
                                        <><ArrowUpRight className="h-4 w-4" />Dönüştür</>
                                    )}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
            {/* ====== AI CALL DIALOG (Faz 5) ====== */}
            <AiCallDialog saleId={null} leadId={selectedCallLeadId} onClose={() => setSelectedCallLeadId(null)} />

            {/* ====== LEAD DETAIL SHEET / DRAWER ====== */}
            <Sheet open={!!selectedDetailLead} onOpenChange={(open) => { if (!open) setSelectedDetailLead(null) }}>
                <SheetContent className="sm:max-w-xl flex flex-col h-full bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-0 overflow-hidden shadow-2xl">
                    <SheetHeader className="p-6 pb-4 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-900 shrink-0">
                        <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Müşteri Adayı Detayı</span>
                                <SheetTitle className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                    <User className="h-5 w-5 text-indigo-500" />
                                    {selectedDetailLead?.full_name}
                                </SheetTitle>
                                {selectedDetailLead && (
                                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                        <Badge variant="outline" className={`${STATUS_CONFIG[selectedDetailLead.status]?.bg || 'bg-slate-50'} ${STATUS_CONFIG[selectedDetailLead.status]?.color || 'text-slate-600'} text-[10px] font-bold py-0.5 px-2 rounded-full border`}>
                                            {STATUS_CONFIG[selectedDetailLead.status]?.label || selectedDetailLead.status}
                                        </Badge>
                                        {selectedDetailLead.projects?.name && (
                                            <Badge variant="outline" className="bg-slate-100/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] py-0.5 px-2 rounded-full border border-slate-200 dark:border-slate-700 font-medium">
                                                <Building2 className="h-3 w-3 mr-1 inline-block" />
                                                {selectedDetailLead.projects.name}
                                            </Badge>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </SheetHeader>

                    {/* Scrollable Content: Profile + Timeline */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Profile Summary Card */}
                        {selectedDetailLead && (
                            <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-900 shadow-sm p-4 space-y-3.5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Telefon</label>
                                        {selectedDetailLead.phone ? (
                                            <a href={`tel:${selectedDetailLead.phone}`} className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5">
                                                <Phone className="h-3.5 w-3.5" />
                                                {selectedDetailLead.phone}
                                            </a>
                                        ) : (
                                            <span className="text-sm text-slate-400 dark:text-slate-600 font-medium">-</span>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">E-posta</label>
                                        {selectedDetailLead.email ? (
                                            <a href={`mailto:${selectedDetailLead.email}`} className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5">
                                                <Mail className="h-3.5 w-3.5" />
                                                {selectedDetailLead.email}
                                            </a>
                                        ) : (
                                            <span className="text-sm text-slate-400 dark:text-slate-600 font-medium">-</span>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Kaynak</label>
                                        <span className="text-xs font-semibold bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-800">
                                            {selectedDetailLead.source || 'Bilinmeyen'}
                                        </span>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Atanan Temsilci</label>
                                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                            <User className="h-3.5 w-3.5 text-slate-400" />
                                            {selectedDetailLead.profiles?.full_name || 'Atanmamış'}
                                        </span>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Firma Adı</label>
                                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            {selectedDetailLead.company_name || '-'}
                                        </span>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Firma Telefonu</label>
                                        {selectedDetailLead.company_phone ? (
                                            <a href={`tel:${selectedDetailLead.company_phone}`} className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5">
                                                <Phone className="h-3.5 w-3.5" />
                                                {selectedDetailLead.company_phone}
                                            </a>
                                        ) : (
                                            <span className="text-sm text-slate-400 dark:text-slate-600 font-medium">-</span>
                                        )}
                                    </div>
                                </div>
                                {selectedDetailLead.notes && (
                                    <div className="pt-3 border-t border-slate-50 dark:border-slate-900">
                                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Not / Açıklama</label>
                                        <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/30 p-2 rounded border border-slate-100/50 dark:border-slate-900/50 leading-relaxed whitespace-pre-line">{selectedDetailLead.notes}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Timeline Header */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-indigo-500" />
                                    İşlem Geçmişi & Zaman Tüneli
                                </h3>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setShowCreateActivityDialog(true)}
                                    className="h-7 text-[11px] font-semibold gap-1 px-2.5 rounded-lg border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-300"
                                >
                                    <Plus className="h-3 w-3" />
                                    Aktivite Ekle
                                </Button>
                            </div>

                            {/* Timeline Items */}
                            {activitiesLoading ? (
                                <div className="flex flex-col items-center justify-center py-12 space-y-3">
                                    <Loader2 className="h-7 w-7 text-indigo-500 animate-spin" />
                                    <span className="text-xs text-slate-400 font-medium">Zaman tüneli yükleniyor...</span>
                                </div>
                            ) : detailActivities.length === 0 ? (
                                <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-900 shadow-sm p-6 text-center text-slate-400">
                                    <Info className="h-6 w-6 mx-auto mb-2 text-slate-300" />
                                    <p className="text-xs font-medium">Bu adaya ait henüz bir işlem kaydı yok.</p>
                                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Aşağıdaki alandan hızlıca bir not ekleyerek başlatabilirsiniz.</p>
                                </div>
                            ) : (
                                <div className="relative pl-6 border-l border-slate-200 dark:border-slate-800 space-y-6">
                                    {detailActivities.map((act) => {
                                        let icon = <Activity className="h-3.5 w-3.5 text-slate-500" />
                                        let iconBg = 'bg-slate-100 border-slate-200'
                                        let typeLabel = 'Aktivite'
                                        let contentClass = 'bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-900'

                                        if (act.type === 'Call') {
                                            icon = <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                                            iconBg = 'bg-indigo-50 border-indigo-100 dark:bg-indigo-950/50 dark:border-indigo-900/50'
                                            typeLabel = 'AI Arama Özeti'
                                            contentClass = 'bg-indigo-50/20 dark:bg-indigo-950/5 border-indigo-100/40 dark:border-indigo-900/20 shadow-xs'
                                        } else if (act.type === 'Note') {
                                            icon = <StickyNote className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                                            iconBg = 'bg-amber-50 border-amber-100 dark:bg-amber-950/50 dark:border-amber-900/50'
                                            typeLabel = `Not - ${act.user_name}`
                                            contentClass = 'bg-amber-50/10 dark:bg-amber-950/5 border-amber-100/30 dark:border-amber-900/20 shadow-xs'
                                        }

                                        return (
                                            <div key={act.id} className="relative group">
                                                {/* Timeline dot/icon */}
                                                <div className={`absolute -left-[35px] top-1 h-7 w-7 rounded-full flex items-center justify-center border shadow-xs ${iconBg}`}>
                                                    {icon}
                                                </div>

                                                {/* Timeline Content Bubble */}
                                                <div className={`rounded-xl border p-4 transition-all duration-200 hover:shadow-sm ${contentClass}`}>
                                                    <div className="flex items-center justify-between gap-4 mb-2">
                                                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{typeLabel}</span>
                                                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                                                            {formatDistanceToNow(new Date(act.created_at), { addSuffix: true, locale: tr })}
                                                        </span>
                                                    </div>
                                                    
                                                    {act.summary && act.type !== 'Note' && (
                                                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">{act.summary}</h4>
                                                    )}

                                                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line font-medium">
                                                        {act.notes}
                                                    </p>

                                                    {/* AI recording player */}
                                                    {act.call_recording_url && (
                                                        <div className="mt-3 pt-3 border-t border-indigo-100/50 dark:border-indigo-900/30 flex flex-col gap-2">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 tracking-wider uppercase flex items-center gap-1.5">
                                                                    <Headphones className="h-3.5 w-3.5" /> Arama Ses Kaydı
                                                                </span>
                                                                {act.call_duration_seconds && (
                                                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">
                                                                        {Math.floor(act.call_duration_seconds / 60)}:{(act.call_duration_seconds % 60) < 10 ? '0' : ''}{act.call_duration_seconds % 60}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <audio src={act.call_recording_url} controls className="w-full h-8 max-w-full rounded-md shadow-xs bg-slate-50 dark:bg-slate-900" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bottom Quick Note Area (sticky) */}
                    <div className="p-4 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900 space-y-3 shrink-0">
                        <div className="relative">
                            <Textarea
                                placeholder="Aday hakkında hızlı bir not ekleyin..."
                                value={newNoteText}
                                onChange={e => setNewNoteText(e.target.value)}
                                className="min-h-[80px] pr-12 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 text-xs bg-slate-50 dark:bg-slate-900/50 font-medium resize-none shadow-xs rounded-xl"
                            />
                            <Button
                                size="icon"
                                className="absolute right-3.5 bottom-3.5 h-8 w-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all shadow-xs"
                                onClick={handleAddNote}
                                disabled={isPending || !newNoteText.trim()}
                            >
                                {isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            <ActivityForm
                open={showCreateActivityDialog}
                onOpenChange={setShowCreateActivityDialog}
                mode="create"
                activity={{ lead_id: selectedDetailLead?.id, lead_name: selectedDetailLead?.full_name }}
                defaultLeadId={selectedDetailLead?.id}
                profiles={teamMembers}
                projects={projects}
            />
        </div>
    )
}
