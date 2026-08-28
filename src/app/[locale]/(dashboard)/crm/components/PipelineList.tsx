'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatCurrency, cn } from '@/lib/utils'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Calculator, Sparkles, User, Info, Mail, Phone, MessageSquareText, CalendarPlus, CalendarCheck, CheckCircle2, Trash, AlertTriangle, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Filter, X, Undo2, StickyNote, PhoneOff, Send, XCircle } from 'lucide-react'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import ColumnVisibilityPicker from '@/components/ui/column-visibility-picker'
import ColumnFilterRow from '@/components/ui/column-filter-row'
import { AiSignalBadge } from '@/components/ui/ai-signal-badge'
import { updateSaleStatus, autoAssignLead, assignSale, addSaleQuickNote, updateFirstContact, updateProcessNote, completeQuickAppointment } from '../actions'
import QuickAppointmentModal from './QuickAppointmentModal'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Pencil } from 'lucide-react'
import dynamic from 'next/dynamic'
import { Link } from '@/i18n/routing'
import { RestartSaleButton } from './RestartSaleButton'
import { toast } from 'sonner'
import { useRouter, useSearchParams } from 'next/navigation'

const PaymentPlanCalculator = dynamic(() => import('./PaymentPlanCalculator'), { ssr: false })
const MatchUnitDialog = dynamic(() => import('./MatchUnitDialog'), { ssr: false })
const PipelineReservationDialog = dynamic(() => import('./PipelineReservationDialog'), { ssr: false })
const PipelineProposalDialog = dynamic(() => import('./PipelineProposalDialog'), { ssr: false })
const QuickProposalDialog = dynamic(() => import('./QuickProposalDialog'), { ssr: false })
import SaleProcessIndicator from './SaleProcessIndicator'

const AiMatchDialog = dynamic(() => import('@/components/customers/AiMatchDialog').then(m => m.AiMatchDialog), { ssr: false })
const ActivityForm = dynamic(() => import('@/components/activities/activity-form').then(m => m.ActivityForm), { ssr: false })
const AiCallDialog = dynamic(() => import('./AiCallDialog'), { ssr: false })
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { CustomerView } from '@/components/customers/customer-view'
import { getCustomerFullProfile } from '../actions'
import { revertSaleToQualification } from '@/app/[locale]/(dashboard)/lead-qualification/actions'
import { LeadScoreBadge } from '@/components/customers/LeadScoreBadge'
import { CampaignTouchpointBadge } from '@/components/customers/CampaignTouchpointBadge'

import { useTranslations, useLocale } from 'next-intl'
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime'

type PipelineColId = 'customer' | 'project' | 'unit' | 'status' | 'first_contact' | 'process_note' | 'lead_score' | 'campaign' | 'date' | 'amount' | 'rep' | 'remaining' | 'actions' | 'quickicons'
const DEFAULT_PIPELINE_COL_ORDER: PipelineColId[] = ['customer', 'project', 'unit', 'status', 'first_contact', 'process_note', 'lead_score', 'campaign', 'date', 'amount', 'rep', 'remaining', 'actions', 'quickicons']
const PIPELINE_COL_ORDER_KEY = 'pipeline_list_column_order_v5'
const PIPELINE_COL_WIDTHS_KEY = 'pipeline_list_column_widths_v5'
const PIPELINE_HIDDEN_COLS_KEY = 'pipeline_list_hidden_cols_v5'
const DEFAULT_PIPELINE_WIDTHS: Record<PipelineColId, number> = {
    customer: 240, project: 200, unit: 100, status: 160, first_contact: 140, process_note: 180, lead_score: 100, campaign: 160, date: 140, amount: 160, rep: 180, remaining: 110, actions: 180, quickicons: 130
}
const PIPELINE_COL_LABELS: Record<PipelineColId, string> = {
    customer: 'Müşteri', project: 'Proje', unit: 'Birim', status: 'Durum', first_contact: 'İlk Temas', process_note: 'Süreç Notu', lead_score: 'Lead Skor', campaign: 'Son Kampanya', date: 'Tarih', amount: 'Tutar', rep: 'Temsilci', remaining: 'Kalan Süre', actions: 'İşlemler', quickicons: 'Kısayollar'
}

export default function PipelineList({
    sales,
    customers,
    templates = [],
    totalSalesCount = 0,
    initialPage = 1,
    isAdmin = false,
    profiles = [],
    projects = [],
    initialActivities = [],
    tenantType = 'developer',
    leadOwnershipDays = 90,
    isAdvanceMode = false,
    userRole = 'sales'
}: {
    sales: any[],
    customers: any[],
    templates?: any[],
    totalSalesCount?: number,
    initialPage?: number,
    isAdmin?: boolean,
    profiles?: any[],
    projects?: any[],
    initialActivities?: any[],
    tenantType?: string,
    leadOwnershipDays?: number,
    isAdvanceMode?: boolean,
    userRole?: string
}) {
    const t = useTranslations('CRM')
    const locale = useLocale()
    const isBroker = tenantType === 'broker'

    const [activitiesState, setActivitiesState] = useState<any[]>(initialActivities)

    useEffect(() => {
        setActivitiesState(initialActivities)
    }, [initialActivities])

    const handleCompleteAppointment = async (activityId: string, customerName: string) => {
        try {
            const res = await completeQuickAppointment(activityId)
            if (res?.error) {
                toast.error(res.error)
            } else {
                toast.success(`${customerName} için randevu tamamlandı olarak işaretlendi!`)
                setActivitiesState(prev => prev.filter(a => a.id !== activityId))
            }
        } catch (err) {
            console.error(err)
            toast.error('Randevu tamamlanırken hata oluştu.')
        }
    }

    const [viewsOpen, setViewsOpen] = useState(false)

    useEffect(() => {
        const handleToggle = (e: Event) => {
            const ce = e as CustomEvent
            if (ce.detail?.open !== undefined) {
                setViewsOpen(ce.detail.open)
            } else {
                setViewsOpen(prev => {
                    const next = !prev
                    window.dispatchEvent(new CustomEvent('crm-views-state', { detail: { open: next } }))
                    return next
                })
            }
        }
        window.addEventListener('toggle-crm-views', handleToggle)
        return () => window.removeEventListener('toggle-crm-views', handleToggle)
    }, [])

    useEffect(() => {
        window.dispatchEvent(new CustomEvent('crm-views-state', { detail: { open: viewsOpen } }))
    }, [viewsOpen])

    // Broker status label mapping
    const brokerStatusLabel = (status: string): string => {
        const map: Record<string, string> = {
            'Lead': 'Yeni Talep',
            'Prospect': 'İletişim',
            'Reservation': 'Gösterim',
            'Opsiyon - Kapora Bekleniyor': 'Gösterim',
            'Proposal': 'Teklif',
            'Teklif - Kapora Bekleniyor': 'Teklif',
            'Negotiation': 'Pazarlık',
            'Sold': 'Sözleşme',
            'Completed': 'Kapandı',
            'Lost': 'Kaybedildi'
        }
        return map[status] || status
    }

    const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null)
    const [isPlanOpen, setIsPlanOpen] = useState(false)
    const [activeAiCallSaleId, setActiveAiCallSaleId] = useState<string | null>(null)

    const [isAssigning, setIsAssigning] = useState<string | null>(null)
    const [assignPopoverOpen, setAssignPopoverOpen] = useState<string | null>(null)
    const [viewingLead, setViewingLead] = useState<any | null>(null)

    const [isActivityOpen, setIsActivityOpen] = useState(false)
    const [selectedCustomerForActivity, setSelectedCustomerForActivity] = useState<any | null>(null)
    const [viewingCustomerProfile, setViewingCustomerProfile] = useState<any | null>(null)
    const [isCustomerProfileOpen, setIsCustomerProfileOpen] = useState(false)

    // Quick Note state
    const [isQuickNoteOpen, setIsQuickNoteOpen] = useState(false)
    const [quickNoteSaleId, setQuickNoteSaleId] = useState<string | null>(null)
    const [quickNoteCustomerId, setQuickNoteCustomerId] = useState<string | null>(null)
    const [quickNoteText, setQuickNoteText] = useState('')
    const [quickNoteExisting, setQuickNoteExisting] = useState('')
    const [quickNoteSaving, setQuickNoteSaving] = useState(false)

    const openQuickNote = (saleId: string, customerId: string, existingDesc: string | null) => {
        setQuickNoteSaleId(saleId)
        setQuickNoteCustomerId(customerId)
        setQuickNoteExisting(existingDesc || '')
        setQuickNoteText('')
        setIsQuickNoteOpen(true)
    }

    const handleSaveQuickNote = async () => {
        if (!quickNoteSaleId || !quickNoteCustomerId || !quickNoteText.trim()) return
        setQuickNoteSaving(true)
        const res = await addSaleQuickNote(quickNoteSaleId, quickNoteCustomerId, quickNoteText.trim())
        setQuickNoteSaving(false)
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success('Not kaydedildi')
            setIsQuickNoteOpen(false)
            router.refresh()
        }
    }
    const [currentPage, setCurrentPage] = useState(initialPage)
    const [pageInputValue, setPageInputValue] = useState(initialPage.toString())
    const itemsPerPage = 50
    const router = useRouter()
    const searchParams = useSearchParams()

    // Real-time updates
    useSupabaseRealtime({ table: 'sales' })

    // Resizable Columns State
    const [colWidths, setColWidths] = useState<Record<PipelineColId, number>>(() => {
        if (typeof window !== 'undefined') {
            try {
                const saved = localStorage.getItem(PIPELINE_COL_WIDTHS_KEY)
                if (saved) return { ...DEFAULT_PIPELINE_WIDTHS, ...JSON.parse(saved) }
            } catch {}
        }
        return { ...DEFAULT_PIPELINE_WIDTHS }
    })
    const resizingRef = useRef<{ key: string, startX: number, startWidth: number } | null>(null)

    // Column ordering
    const [colOrder, setColOrder] = useState<PipelineColId[]>(() => {
        if (typeof window !== 'undefined') {
            try {
                const saved = localStorage.getItem(PIPELINE_COL_ORDER_KEY)
                if (saved) {
                    const parsed = JSON.parse(saved) as PipelineColId[]
                    if (DEFAULT_PIPELINE_COL_ORDER.every(c => parsed.includes(c)) && parsed.length === DEFAULT_PIPELINE_COL_ORDER.length)
                        return parsed
                }
            } catch {}
        }
        return DEFAULT_PIPELINE_COL_ORDER
    })
    const dragColRef = useRef<PipelineColId | null>(null)
    const [dragOverCol, setDragOverCol] = useState<PipelineColId | null>(null)

    // Hidden columns
    const [hiddenCols, setHiddenCols] = useState<string[]>(() => {
        if (typeof window !== 'undefined') {
            try {
                const saved = localStorage.getItem(PIPELINE_HIDDEN_COLS_KEY)
                if (saved) return JSON.parse(saved)
            } catch {}
        }
        return []
    })

    const toggleColVisibility = (colId: string) => {
        setHiddenCols(prev => {
            const next = prev.includes(colId) ? prev.filter(c => c !== colId) : [...prev, colId]
            try { localStorage.setItem(PIPELINE_HIDDEN_COLS_KEY, JSON.stringify(next)) } catch {}
            return next
        })
    }

    const resetColVisibility = () => {
        setHiddenCols([])
        try { localStorage.removeItem(PIPELINE_HIDDEN_COLS_KEY) } catch {}
    }

    const pipelineColumns = DEFAULT_PIPELINE_COL_ORDER
        .filter(colId => !(isBroker && (colId === 'project' || colId === 'unit')))
        .map(colId => ({ id: colId, label: PIPELINE_COL_LABELS[colId], required: colId === 'customer' }))

    const handleColDragStart = useCallback((col: PipelineColId) => { dragColRef.current = col }, [])
    const handleColDragOver = useCallback((e: React.DragEvent, col: PipelineColId) => {
        e.preventDefault()
        if (dragColRef.current && dragColRef.current !== col) setDragOverCol(col)
    }, [])
    const handleColDrop = useCallback((targetCol: PipelineColId) => {
        const from = dragColRef.current
        if (!from || from === targetCol) { setDragOverCol(null); return }
        setColOrder(prev => {
            const next = [...prev]
            const fi = next.indexOf(from), ti = next.indexOf(targetCol)
            next.splice(fi, 1)
            next.splice(ti, 0, from)
            try { localStorage.setItem(PIPELINE_COL_ORDER_KEY, JSON.stringify(next)) } catch {}
            return next
        })
        setDragOverCol(null)
        dragColRef.current = null
    }, [])
    const handleColDragEnd = useCallback(() => { setDragOverCol(null); dragColRef.current = null }, [])

    const [sheetWidth, setSheetWidth] = useState(800)
    const isResizingSheet = useRef(false)

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizingSheet.current) return
            // Calculate new width for a right-side sheet
            const newWidth = window.innerWidth - e.clientX
            if (newWidth > 400 && newWidth < window.innerWidth - 50) {
                setSheetWidth(newWidth)
            }
        }
        const handleMouseUp = () => {
            if (isResizingSheet.current) {
                isResizingSheet.current = false
                document.body.style.cursor = 'default'
            }
        }
        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }
    }, [])

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!resizingRef.current) return
            const { key, startX, startWidth } = resizingRef.current
            const diff = e.clientX - startX
            const newW = Math.max(60, startWidth + diff)
            setColWidths(prev => {
                const next = { ...prev, [key]: newW }
                try { localStorage.setItem(PIPELINE_COL_WIDTHS_KEY, JSON.stringify(next)) } catch {}
                return next
            })
            e.preventDefault()
        }
        const handleMouseUp = () => {
            if (resizingRef.current) {
                resizingRef.current = null
                document.body.style.cursor = 'default'
            }
        }
        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }
    }, [])

    const ResizeHandle = ({ id }: { id: string }) => (
        <div
            className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-primary/50 transition-colors z-20 touch-none active:bg-primary"
            onMouseDown={(e) => {
                resizingRef.current = { key: id, startX: e.clientX, startWidth: colWidths[id as PipelineColId] }
                document.body.style.cursor = 'col-resize'
                e.preventDefault()
            }}
            onClick={(e) => e.stopPropagation()}
        />
    )

    const handlePlanClick = (saleId: string) => {
        setSelectedSaleId(saleId)
        setIsPlanOpen(true)
    }

    const handleOpenCustomerProfile = async (customer: any) => {
        setViewingCustomerProfile(null)
        setIsCustomerProfileOpen(true)
        const data = await getCustomerFullProfile(customer.id)
        if (!data.error) {
            setViewingCustomerProfile(data)
        } else {
            toast.error(data.error)
            setIsCustomerProfileOpen(false)
        }
    }

    // Revert Dialog State
    const [revertDialogOpen, setRevertDialogOpen] = useState(false)
    const [revertSaleId, setRevertSaleId] = useState<string | null>(null)
    const [revertNote, setRevertNote] = useState('')
    const [revertStatus, setRevertStatus] = useState('follow_up')

    // Proposal Dialog State
    const [proposalSale, setProposalSale] = useState<{
        saleId: string
        customerName: string
        totalAmount: number
        initialCurrency: string
        projectId?: string | null
    } | null>(null)
    const [proposalOpen, setProposalOpen] = useState(false)

    // Quick Proposal Dialog State
    const [quickProposalSale, setQuickProposalSale] = useState<{
        saleId: string
        customerName: string
        unitId?: string | null
        projectId?: string | null
        totalAmount: number
        initialCurrency: string
    } | null>(null)
    const [quickProposalOpen, setQuickProposalOpen] = useState(false)

    // Lost Dialog State
    const [lostDialogOpen, setLostDialogOpen] = useState(false)
    const [lostSaleId, setLostSaleId] = useState<string | null>(null)
    const [lostReasonText, setLostReasonText] = useState('')
    const [lostSaving, setLostSaving] = useState(false)

    const openLostDialog = (saleId: string) => {
        setLostSaleId(saleId)
        setLostReasonText('')
        setLostDialogOpen(true)
    }

    const submitLostSale = async () => {
        if (!lostSaleId) return
        setLostSaving(true)
        try {
            const res = await updateSaleStatus(lostSaleId, 'Lost', lostReasonText)
            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success('Satış kaybedildi olarak işaretlendi ve ünite satışa çıkarıldı.')
                setLostDialogOpen(false)
                router.refresh()
            }
        } catch (err: any) {
            toast.error(err.message || 'Bir hata oluştu')
        } finally {
            setLostSaving(false)
        }
    }

    const openRevertDialog = (saleId: string) => {
        setRevertSaleId(saleId)
        setRevertNote('')
        setRevertStatus('follow_up')
        setRevertDialogOpen(true)
    }

    const submitRevertToQualification = async () => {
        if (!revertSaleId) return
        
        const promise = revertSaleToQualification(revertSaleId, revertStatus, revertNote)
        setRevertDialogOpen(false)
        
        toast.promise(promise, {
            loading: 'Geri gönderiliyor...',
            success: (data) => {
                if (data.error) throw new Error(data.error)
                return 'Kayıt başarıyla Ön Değerlendirme aşamasına geri gönderildi.'
            },
            error: (err) => err.message || 'İşlem başarısız oldu'
        })
    }

    const handleAutoAssign = async (saleId: string) => {
        setIsAssigning(saleId)
        const result = await autoAssignLead(saleId)
        setIsAssigning(null)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success(t('actions.assigned'))
        }
    }

    const handleManualAssign = async (saleId: string, userId: string | null) => {
        setIsAssigning(saleId)
        setAssignPopoverOpen(null)
        const result = await assignSale(saleId, userId)
        setIsAssigning(null)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success(userId ? t('actions.assigned') : 'Atama kaldırıldı')
        }
    }

    const handleStatusChange = async (id: string, newStatus: string) => {
        const res = await updateSaleStatus(id, newStatus)
        if (res?.error) {
            toast.error(res.error)
        } else {
            toast.success('Durum güncellendi')
            router.refresh()
        }
    }



    const handleCreateActivity = (customer: any) => {
        setSelectedCustomerForActivity(customer)
        setIsActivityOpen(true)
    }

    const totalPages = Math.ceil(totalSalesCount / itemsPerPage)

    // Column filters
    const [colFilters, setColFilters] = useState<Record<string, string>>({})
    const isInternalFilterRef = useRef(false)
    const [showFilters, setShowFilters] = useState(true)

    // Sync column filters with URL search params on mount & external searchParams changes
    useEffect(() => {
        if (isInternalFilterRef.current) {
            isInternalFilterRef.current = false
            return
        }

        const filters: Record<string, string> = {}
        const q = searchParams.get('q')
        const p = searchParams.get('p')
        const s = searchParams.get('s')
        const r = searchParams.get('r')
        const df = searchParams.get('df')
        const ls = searchParams.get('ls')
        const fc = searchParams.get('fc')
        const u = searchParams.get('u')
        const a = searchParams.get('a')
        
        if (q) filters['customer'] = q
        if (s) filters['status'] = s
        if (df) filters['date'] = df
        if (ls) filters['lead_score'] = ls
        if (fc) filters['first_contact'] = fc
        if (u) filters['unit'] = u
        if (a) filters['amount'] = a
        
        if (p) {
            const proj = projects.find(proj => proj.id === p)
            filters['project'] = proj ? proj.name : p
        }
        if (r) {
            const profile = profiles.find(prof => prof.id === r)
            filters['rep'] = profile ? profile.full_name : r
        }
        
        setColFilters(prev => {
            // Keep any active client-side filters while updating URL-bound filters
            return { ...prev, ...filters }
        })
    }, [searchParams, projects, profiles])

    const handleColFilter = (colId: string, value: string) => {
        isInternalFilterRef.current = true
        setColFilters(prev => {
            const next = { ...prev }
            if (value) next[colId] = value
            else delete next[colId]
            return next
        })

        // Update URL Search Parameters
        const params = new URLSearchParams(searchParams.toString())
        params.set('page', '1') // reset to page 1

        if (colId === 'customer') {
            if (value) params.set('q', value)
            else params.delete('q')
        } else if (colId === 'project') {
            if (value) {
                const matched = projects.find(p => p.name === value)
                if (matched) params.set('p', matched.id)
                else params.set('p', value)
            } else {
                params.delete('p')
            }
        } else if (colId === 'status') {
            if (value) params.set('s', value)
            else params.delete('s')
        } else if (colId === 'rep') {
            if (value) {
                const matched = profiles.find(p => p.full_name === value)
                if (matched) params.set('r', matched.id)
                else params.set('r', value)
            } else {
                params.delete('r')
            }
        } else if (colId === 'date') {
            if (value) {
                params.set('df', value)
                params.set('dt', value)
            } else {
                params.delete('df')
                params.delete('dt')
            }
        } else if (colId === 'lead_score') {
            if (value) params.set('ls', value)
            else params.delete('ls')
        } else if (colId === 'first_contact') {
            if (value) params.set('fc', value)
            else params.delete('fc')
        } else if (colId === 'unit') {
            if (value) params.set('u', value)
            else params.delete('u')
        } else if (colId === 'amount') {
            if (value) params.set('a', value)
            else params.delete('a')
        }

        router.push(`?${params.toString()}`)
    }

    const clearAllFilters = () => {
        isInternalFilterRef.current = false
        setColFilters({})
        const params = new URLSearchParams(searchParams.toString())
        params.delete('q')
        params.delete('p')
        params.delete('s')
        params.delete('r')
        params.delete('df')
        params.delete('dt')
        params.delete('ls')
        params.delete('fc')
        params.delete('u')
        params.delete('a')
        params.set('page', '1')
        router.push(`?${params.toString()}`)
    }

    const activeFilterCount = Object.values(colFilters).filter(v => v.length > 0).length

    // Get unique values for select filters — use full dataset props, not paginated sales
    const ALL_STATUSES = ['Lead', 'Prospect', 'Reservation', 'Opsiyon - Kapora Bekleniyor', 'Proposal', 'Teklif - Kapora Bekleniyor', 'Negotiation', 'Sold', 'Completed', 'Lost']
    const uniqueStatuses = ALL_STATUSES
    const uniqueProjects = projects.map(p => p.name).filter(Boolean)
    const uniqueReps = profiles.map(p => p.full_name).filter(Boolean)

    const filterableColumns = colOrder
        .filter(colId => !(isBroker && (colId === 'project' || colId === 'unit')) && !hiddenCols.includes(colId))
        .map(colId => {
            if (colId === 'status') return { id: colId, label: 'Durum', type: 'select' as const, options: uniqueStatuses }
            if (colId === 'project') return { id: colId, label: 'Proje', type: 'select' as const, options: uniqueProjects }
            if (colId === 'rep') return { id: colId, label: 'Temsilci', type: 'select' as const, options: uniqueReps }
            if (colId === 'customer') return { id: colId, label: 'Müşteri', type: 'text' as const }
            if (colId === 'unit') return { id: colId, label: 'Birim', type: 'text' as const }
            if (colId === 'date') return { id: colId, label: 'Tarih', type: 'date' as const }
            if (colId === 'amount') return { id: colId, label: 'Tutar', type: 'text' as const }
            if (colId === 'lead_score') return { id: colId, label: 'Lead Skor', type: 'multiselect' as const, options: ['hot', 'warm', 'cold', 'call_requested', 'disqualified'], optionLabels: { hot: '🔥 Hot', warm: '🌡️ Warm', cold: '❄️ Cold', call_requested: '📞 Arama', disqualified: '⛔ DQ' } }
            if (colId === 'campaign') return { id: colId, label: 'Son Kampanya', type: 'text' as const }
            if (colId === 'first_contact') return { id: colId, label: 'İlk Temas', type: 'select' as const, options: ['Aradım, Olumlu', 'Aradım, Olumsuz', 'Tekrar Aranacak', 'Değerlendiriyor', 'Ulaşamadım'] }
            if (colId === 'actions' || colId === 'quickicons' || colId === 'remaining') return { id: colId, label: colId, type: 'none' as const }
            return { id: colId, label: colId, type: 'text' as const }
        })

    // Apply column filters client-side
    const currentSales = sales.filter(sale => {
        for (const [colId, filterVal] of Object.entries(colFilters)) {
            if (!filterVal) continue
            const q = filterVal.toLowerCase()
            if (colId === 'customer') {
                const name = (sale.customers?.full_name || '').toLowerCase()
                const phone = (sale.customers?.phone || '').toLowerCase()
                const custNum = (sale.customers?.customer_number || '').toLowerCase()
                if (!name.includes(q) && !phone.includes(q) && !custNum.includes(q)) return false
            } else if (colId === 'project') {
                const pName = (sale.units?.projects?.name || sale.projects?.name || '').toLowerCase()
                if (pName !== q.toLowerCase() && !pName.includes(q)) return false
            } else if (colId === 'unit') {
                const uNum = (sale.units?.unit_number || '').toLowerCase()
                if (!uNum.includes(q)) return false
            } else if (colId === 'status') {
                if (sale.status !== filterVal) return false
            } else if (colId === 'rep') {
                const repName = (sale.profiles?.full_name || '').toLowerCase()
                if (repName !== q.toLowerCase() && !repName.includes(q)) return false
            } else if (colId === 'date') {
                const saleDate = new Date(sale.created_at)
                const year = saleDate.getFullYear()
                const month = String(saleDate.getMonth() + 1).padStart(2, '0')
                const day = String(saleDate.getDate()).padStart(2, '0')
                const localDateStr = `${year}-${month}-${day}`
                if (localDateStr !== filterVal) return false
            } else if (colId === 'amount') {
                const amt = String(sale.deposit_amount || sale.final_price || '')
                if (!amt.includes(q)) return false
            } else if (colId === 'lead_score') {
                const selectedScores = filterVal.split(',')
                const interestLevel = sale.customers?.lead_qualifications?.[0]?.interest_level || ''
                if (!selectedScores.includes(interestLevel)) return false
            } else if (colId === 'campaign') {
                const wName = (sale.campaign_info?.workflowName || '').toLowerCase()
                const bText = (sale.campaign_info?.buttonText || '').toLowerCase()
                if (!wName.includes(q) && !bText.includes(q)) return false
            } else if (colId === 'first_contact') {
                const fc = sale.first_contact || ''
                if (fc !== filterVal) return false
            }
        }
        return true
    })

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('page', newPage.toString())
        router.push(`?${params.toString()}`)
        setCurrentPage(newPage)
    }

    const [saleToDelete, setSaleToDelete] = useState<any | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDeleteClick = (sale: any) => {
        setSaleToDelete(sale)
    }

    const handleDeleteConfirm = async () => {
        if (!saleToDelete) return

        setIsDeleting(true)
        const { deleteSale } = await import('../actions')
        const result = await deleteSale(saleToDelete.id)

        setIsDeleting(false)
        setSaleToDelete(null)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success(t('messages.deleted') || 'Satış kaydı silindi')
            router.refresh()
        }
    }

    return (
        <div className="space-y-4">
            {/* Desktop Table View */}
            <div className="hidden md:block relative group">
                {/* Column hint bar */}
                {viewsOpen && (
                    <div className="mb-3 border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-card shadow-sm transition-all animate-in fade-in slide-in-from-top-4 duration-200">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex-wrap">
                            <span className="whitespace-nowrap">Sütunları sürükle &amp; bırak ile sırala</span>
                            {colOrder.join(',') !== DEFAULT_PIPELINE_COL_ORDER.join(',') && (
                                <button onClick={() => { setColOrder(DEFAULT_PIPELINE_COL_ORDER); try { localStorage.removeItem(PIPELINE_COL_ORDER_KEY) } catch {} }} className="text-blue-500 hover:text-blue-700 underline underline-offset-2">
                                    Sıral. sıfırla
                                </button>
                            )}
                            {JSON.stringify(colWidths) !== JSON.stringify(DEFAULT_PIPELINE_WIDTHS) && (
                                <button onClick={() => { setColWidths({ ...DEFAULT_PIPELINE_WIDTHS }); try { localStorage.removeItem(PIPELINE_COL_WIDTHS_KEY) } catch {} }} className="text-slate-400 hover:text-blue-600 underline underline-offset-2">
                                    Geniş. sıfırla
                                </button>
                            )}
                            <ColumnVisibilityPicker
                                columns={pipelineColumns}
                                hiddenColumns={hiddenCols}
                                onToggle={toggleColVisibility}
                                onReset={resetColVisibility}
                                storageKey={PIPELINE_HIDDEN_COLS_KEY}
                            />
                            <Button
                                variant={showFilters ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => { setShowFilters(!showFilters); if (showFilters) clearAllFilters() }}
                                className={cn(
                                    "gap-1.5 h-8 text-xs font-bold shadow-sm transition-all",
                                    showFilters
                                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                                        : activeFilterCount > 0
                                            ? "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
                                            : "border-slate-200"
                                )}
                            >
                                <Filter className="w-3.5 h-3.5" />
                                Filtre
                                {activeFilterCount > 0 && (
                                    <span className="bg-white/20 text-[9px] font-black px-1.5 py-0.5 rounded-full">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </Button>
                        </div>
                    </div>
                )}



                <div className="rounded-xl border bg-card shadow-sm relative w-full overflow-auto lg:max-h-[calc(100vh-185px)] max-w-[calc(100vw-1rem)] lg:max-w-full print:max-h-none print:overflow-visible">
                    <table className="min-w-[1000px] w-full caption-bottom text-sm border-collapse">
                        <TableHeader className="sticky top-0 z-10 font-sans">
                            <TableRow className="bg-slate-800 hover:bg-slate-800 border-none">
                                {colOrder.filter(colId => !(isBroker && (colId === 'project' || colId === 'unit')) && !hiddenCols.includes(colId)).map(colId => {
                                    const isOver = dragOverCol === colId
                                    const w = colWidths[colId]
                                    const dragProps = {
                                        draggable: true,
                                        onDragStart: () => handleColDragStart(colId),
                                        onDragOver: (e: React.DragEvent) => handleColDragOver(e, colId),
                                        onDrop: () => handleColDrop(colId),
                                        onDragEnd: handleColDragEnd,
                                    }
                                    const headCls = cn(
                                        "relative h-9 px-2 text-center align-middle font-bold text-white transition-all duration-75 border-r border-slate-700 select-none cursor-grab active:cursor-grabbing text-[11px] uppercase tracking-wider",
                                        isOver && "border-l-2 border-l-blue-400 bg-slate-700/60"
                                    )
                                    return (
                                        <TableHead key={colId} {...dragProps} className={headCls} style={{ width: w, minWidth: w }}>
                                            <div className="flex items-center justify-center gap-1">
                                                <span className="opacity-40 text-slate-400">⠿</span>
                                                {colId === 'customer' && t('table.customer')}
                                                {colId === 'project' && t('table.project')}
                                                {colId === 'unit' && t('table.unit')}
                                                {colId === 'status' && (isBroker ? 'Aşama' : t('table.status'))}
                                                {colId === 'first_contact' && 'İlk Temas'}
                                                {colId === 'process_note' && 'Süreç Notu'}
                                                {colId === 'lead_score' && 'Lead Skor'}
                                                {colId === 'campaign' && 'Son Kampanya'}
                                                {colId === 'date' && t('table.date')}
                                                {colId === 'amount' && t('table.amount')}
                                                {colId === 'rep' && (isBroker ? 'Danışman' : t('table.rep'))}
                                                {colId === 'remaining' && 'Kalan Süre'}
                                                {colId === 'actions' && t('table.actions')}
                                                {colId === 'quickicons' && 'Kısayollar'}
                                            </div>
                                            <ResizeHandle id={colId} />
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        </TableHeader>
                        {showFilters && (
                            <thead>
                                <ColumnFilterRow
                                    columns={filterableColumns}
                                    visibleColumns={colOrder.filter(c => !(isBroker && (c === 'project' || c === 'unit')) && !hiddenCols.includes(c))}
                                    filters={colFilters}
                                    onFilterChange={handleColFilter}
                                    onClearAll={clearAllFilters}
                                    columnWidths={colWidths}
                                />
                            </thead>
                        )}
                        <TableBody>
                            {currentSales && currentSales.length > 0 ? (
                                currentSales.map((sale: any) => {
                                    const isCompleted = sale.status === 'Completed' || sale.status === 'Sold'
                                    const isLost = sale.status === 'Lost'

                                    // Dynamic Status Colors
                                    const getStatusColor = (status: string) => {
                                        switch (status) {
                                            case 'Lead': return 'bg-slate-100 text-slate-700 border-slate-200'
                                            case 'Prospect': return 'bg-blue-100 text-blue-700 border-blue-200'
                                            case 'Reservation': return 'bg-purple-100 text-purple-700 border-purple-200'
                                            case 'Opsiyon - Kapora Bekleniyor': return 'bg-amber-100 text-amber-700 border-amber-200'
                                            case 'Proposal': return 'bg-cyan-100 text-cyan-700 border-cyan-200'
                                            case 'Teklif - Kapora Bekleniyor': return 'bg-indigo-100 text-indigo-700 border-indigo-200'
                                            case 'Negotiation': return 'bg-pink-100 text-pink-700 border-pink-200'
                                            case 'Sold': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                            case 'Completed': return 'bg-green-100 text-green-700 border-green-200'
                                            case 'Lost': return 'bg-red-100 text-red-700 border-red-200'
                                            default: return 'bg-slate-50 text-slate-600 border-slate-200'
                                        }
                                    }

                                    const getStatusDotColor = (status: string) => {
                                        switch (status) {
                                            case 'Lead': return 'bg-slate-400'
                                            case 'Prospect': return 'bg-blue-500'
                                            case 'Reservation': return 'bg-purple-500'
                                            case 'Opsiyon - Kapora Bekleniyor': return 'bg-amber-500'
                                            case 'Proposal': return 'bg-cyan-500'
                                            case 'Teklif - Kapora Bekleniyor': return 'bg-indigo-500'
                                            case 'Negotiation': return 'bg-pink-500'
                                            case 'Sold':
                                            case 'Completed': return 'bg-emerald-500'
                                            case 'Lost': return 'bg-red-500'
                                            default: return 'bg-slate-400'
                                        }
                                    }

                                    const getStatusLabel = (status: string) => {
                                        if (isBroker) {
                                            return status // Placeholder for broker-specific logic if needed
                                        }
                                        switch (status) {
                                            case 'Opsiyon - Kapora Bekleniyor':
                                                return t('status.OptionPending')
                                            case 'Teklif - Kapora Bekleniyor':
                                                return t('status.ProposalPending')
                                            default:
                                                return t.has(`status.${status}`) ? t(`status.${status}`) : status
                                        }
                                    }

                                    const activeAppointment = activitiesState.find(a => a.customer_id === sale.customer_id && (a.status === 'Planned' || a.status === 'Pending'))

                                    return (
                                        <TableRow
                                            key={sale.id}
                                            className={`transition-all border-b ${
                                                activeAppointment
                                                    ? 'bg-emerald-50/80 dark:bg-emerald-950/40 hover:bg-emerald-100/90 border-l-4 border-l-emerald-500 font-medium'
                                                    : isCompleted ? 'bg-emerald-50/30 hover:bg-emerald-50/50' : isLost ? 'bg-red-50/20 hover:bg-red-50/40' : 'hover:bg-slate-50/80'
                                            }`}
                                        >
                                            {colOrder.filter(colId => !(isBroker && (colId === 'project' || colId === 'unit')) && !hiddenCols.includes(colId)).map(colId => {
                                                const cellCls = "px-2.5 py-1 align-middle border-r border-border/50 text-xs"
                                                if (colId === 'customer') return (
                                                    <TableCell key="customer" className={cellCls}>
                                                        <div className="flex flex-col gap-0.5">
                                                            <div className="flex items-center gap-2">
                                                                {isAdvanceMode ? (
                                                                    <Link href={`/customers/${sale.customers?.id}`} className="font-semibold text-foreground text-xs hover:text-blue-600 hover:underline transition-colors text-left">
                                                                        {sale.customers?.full_name}
                                                                    </Link>
                                                                ) : (
                                                                    <button type="button" onClick={() => handleOpenCustomerProfile(sale.customers)} className="font-semibold text-foreground text-xs hover:text-blue-600 hover:underline transition-colors text-left">
                                                                        {sale.customers?.full_name}
                                                                    </button>
                                                                )}
                                                                {sale.wa_first_message_sent && (
                                                                    <span title={`WP gönderildi${sale.wa_first_message_at ? ' · ' + new Date(sale.wa_first_message_at).toLocaleString('tr-TR') : ''}`} className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-green-100 text-green-600 flex-shrink-0">
                                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-2.5 w-2.5"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/></svg>
                                                                    </span>
                                                                )}
                                                                {sale.source === 'E-Posta' && <Mail className="h-3 w-3 text-blue-500" />}
                                                                {sale.description && (
                                                                    <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-blue-600" onClick={() => setViewingLead(sale)} title="Lead Bilgileri">
                                                                        <Info className="h-3 w-3" />
                                                                    </Button>
                                                                )}
                                                                {sale.customers?.communication_enabled === false && (
                                                                    <span title="İletişim kapalı — bu müşteriye arama/mesaj gönderilmez" className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-red-100 text-red-600 flex-shrink-0">
                                                                        <PhoneOff className="h-2.5 w-2.5" />
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                {sale.customers?.customer_number && (
                                                                    <span className="text-[10px] font-black px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-md border border-blue-100 flex-shrink-0">{sale.customers.customer_number}</span>
                                                                )}
                                                                {sale.customers?.phone && (
                                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                                        <a href={`tel:${sale.customers.phone}`} className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 bg-slate-50 text-slate-500 rounded-md border border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors flex-shrink-0" title="Telefon">
                                                                            <Phone className="h-2.5 w-2.5" />
                                                                            {sale.customers.phone}
                                                                        </a>
                                                                        <Button 
                                                                            variant="ghost" 
                                                                            size="sm" 
                                                                            className="h-5 px-1 py-0 text-[10px] font-semibold text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded border border-purple-200 gap-0.5 flex-shrink-0"
                                                                            onClick={(e) => { e.stopPropagation(); setActiveAiCallSaleId(sale.id); }}
                                                                        >
                                                                            <Sparkles className="h-2.5 w-2.5 animate-pulse" />
                                                                            AI Ara
                                                                        </Button>

                                                                        {/* Hızlı Randevu / Aktif Randevu İkoncuğu */}
                                                                        {activeAppointment ? (
                                                                            <div className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded px-1.5 py-0.5 text-[10px] font-bold flex-shrink-0" title={`Randevu: ${new Date(activeAppointment.due_date).toLocaleString('tr-TR')} - ${activeAppointment.summary || ''}`}>
                                                                                <CalendarCheck className="h-3 w-3 text-emerald-600 shrink-0" />
                                                                                <span>
                                                                                    {new Date(activeAppointment.due_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} {new Date(activeAppointment.due_date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                                                                </span>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    className="h-4 px-1 text-[9px] font-black bg-emerald-600 text-white hover:bg-emerald-700 rounded ml-0.5 gap-0.5"
                                                                                    onClick={async (e) => {
                                                                                        e.stopPropagation()
                                                                                        await handleCompleteAppointment(activeAppointment.id, sale.customers?.full_name || 'Müşteri')
                                                                                    }}
                                                                                    title="Aktiviteyi / Randevuyu Tamamlandı Olarak İşaretle"
                                                                                >
                                                                                    <CheckCircle2 className="h-2.5 w-2.5" />
                                                                                    Tamamla
                                                                                </Button>
                                                                            </div>
                                                                        ) : (
                                                                            sale.customers?.id && (
                                                                                <QuickAppointmentModal
                                                                                    customerId={sale.customers.id}
                                                                                    customerName={sale.customers.full_name || 'Müşteri'}
                                                                                    saleId={sale.id}
                                                                                    disabled={!sale.assigned_to}
                                                                                    disabledTooltip="Önce bu leade bir satış temsilcisi atamalısınız!"
                                                                                    onCreated={(newAct) => {
                                                                                        setActivitiesState(prev => [...prev, newAct])
                                                                                    }}
                                                                                />
                                                                            )
                                                                        )}

                                                                        {sale.customers?.lead_qualifications?.[0] && (
                                                                            <AiSignalBadge 
                                                                                lastCallAt={sale.customers.lead_qualifications[0].last_call_at} 
                                                                                interestLevel={sale.customers.lead_qualifications[0].interest_level} 
                                                                                callNotes={sale.customers.lead_qualifications[0].call_notes} 
                                                                            />
                                                                        )}
                                                                    </div>
                                                                )}
                                                                {!sale.customers?.customer_number && !sale.customers?.phone && (
                                                                    <span className="text-xs text-muted-foreground hidden lg:inline-block">ID: {sale.id.slice(0, 8)}...</span>
                                                                )}
                                                            </div>
                                                            {isBroker && sale.description && (
                                                                <p className="text-[10px] text-muted-foreground truncate max-w-[200px]" title={sale.description}>
                                                                    💬 {sale.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                )
                                                if (colId === 'project') {
                                                    if (isBroker) return null
                                                    return (
                                                    <TableCell key="project" className={cellCls}>
                                                        <span className="font-medium text-foreground">{sale.units?.projects?.name || sale.projects?.name || '-'}</span>
                                                    </TableCell>
                                                )}
                                                if (colId === 'unit') {
                                                    if (isBroker) return null
                                                    return (
                                                    <TableCell key="unit" className={cellCls}>
                                                        {sale.units ? (
                                                            <span className="text-xs font-mono text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded w-fit">NO: {sale.units.unit_number}</span>
                                                        ) : <span className="text-muted-foreground">-</span>}
                                                    </TableCell>
                                                )}
                                                if (colId === 'status') {
                                                    const statusLabel = getStatusLabel(sale.status)
                                                    return (
                                                        <TableCell key="status" className={cellCls}>
                                                            {isAdvanceMode ? (
                                                                isCompleted ? (
                                                                    <div className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-700 border-emerald-200 gap-1">
                                                                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                                                                        <span>{statusLabel}</span>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center gap-2">
                                                                        <div className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold gap-1.5 shadow-sm w-full justify-center", getStatusColor(sale.status))}>
                                                                            <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", getStatusDotColor(sale.status))} />
                                                                            <span>{statusLabel}</span>
                                                                        </div>
                                                                        <SaleProcessIndicator sale={sale} />
                                                                    </div>
                                                                )
                                                            ) : isCompleted ? (
                                                                <div className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-700 border-emerald-200 gap-1">
                                                                    <Sparkles className="w-3 h-3" /> {t('actions.won')}
                                                                </div>
                                                            ) : (
                                                                <Select value={sale.status} onValueChange={(val) => handleStatusChange(sale.id, val)} disabled={sale.status === 'Lost'}>
                                                                    <SelectTrigger className={`w-full h-7 border text-xs font-medium ${getStatusColor(sale.status)}`}><SelectValue /></SelectTrigger>
                                                                    <SelectContent>
                                                                        {isBroker ? (
                                                                            <>
                                                                                {!isAdvanceMode && <SelectItem value="Lead"><div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-slate-400" />Yeni Talep</div></SelectItem>}
                                                                                <SelectItem value="Prospect"><div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-blue-500" />İletişim</div></SelectItem>
                                                                                <SelectItem value="Reservation"><div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-purple-500" />Gösterim</div></SelectItem>
                                                                                <SelectItem value="Proposal"><div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-cyan-500" />Teklif</div></SelectItem>
                                                                                <SelectItem value="Negotiation"><div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-pink-500" />Pazarlık</div></SelectItem>
                                                                                <SelectItem value="Sold"><div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-emerald-500" />Sözleşme</div></SelectItem>
                                                                                <SelectItem value="Lost"><div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-red-500" />Kaybedildi</div></SelectItem>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                {!isAdvanceMode && <SelectItem value="Lead"><div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-slate-400" />{t('status.Lead')}</div></SelectItem>}
                                                                                <SelectItem value="Prospect"><div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-blue-500" />{t('status.Prospect')}</div></SelectItem>
                                                                                <SelectItem value="Reservation"><div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-purple-500" />{t('status.Reservation')}</div></SelectItem>
                                                                                <SelectItem value="Opsiyon - Kapora Bekleniyor"><div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-amber-500" />{t('status.OptionPending')}</div></SelectItem>
                                                                                <SelectItem value="Proposal"><div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-cyan-500" />{t('status.Proposal')}</div></SelectItem>
                                                                                <SelectItem value="Teklif - Kapora Bekleniyor"><div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-indigo-500" />{t('status.ProposalPending')}</div></SelectItem>
                                                                                <SelectItem value="Negotiation"><div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-pink-500" />{t('status.Negotiation')}</div></SelectItem>
                                                                                <SelectItem value="Sold"><div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-emerald-500" />{t('status.Sold')}</div></SelectItem>
                                                                                <SelectItem value="Lost"><div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-red-500" />{t('status.Lost')}</div></SelectItem>
                                                                            </>
                                                                        )}
                                                                    </SelectContent>
                                                                </Select>
                                                            )}
                                                        </TableCell>
                                                    )
                                                }
                                                if (colId === 'first_contact') {
                                                    const fcValue = sale.first_contact || null
                                                    const fcColor = fcValue === 'Aradım, Olumlu' ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                                        : fcValue === 'Aradım, Olumsuz' ? 'bg-red-100 text-red-700 border-red-200'
                                                        : fcValue === 'Tekrar Aranacak' ? 'bg-blue-100 text-blue-700 border-blue-200'
                                                        : fcValue === 'Değerlendiriyor' ? 'bg-purple-100 text-purple-700 border-purple-200'
                                                        : fcValue === 'Ulaşamadım' ? 'bg-amber-100 text-amber-700 border-amber-200'
                                                        : 'bg-slate-50 text-slate-400 border-slate-200'
                                                    const fcLabel = fcValue === 'Aradım, Olumlu' ? '🟢 Olumlu'
                                                        : fcValue === 'Aradım, Olumsuz' ? '🔴 Olumsuz'
                                                        : fcValue === 'Tekrar Aranacak' ? '🔄 Tekrar Aranacak'
                                                        : fcValue === 'Değerlendiriyor' ? '🤔 Değerlendiriyor'
                                                        : fcValue === 'Ulaşamadım' ? '📵 Ulaşamadım'
                                                        : '—'
                                                    return (
                                                        <TableCell key="first_contact" className={cellCls}>
                                                            <Select
                                                                value={fcValue || '__empty__'}
                                                                onValueChange={async (val) => {
                                                                    const newVal = val === '__empty__' ? null : val
                                                                    const res = await updateFirstContact(sale.id, newVal)
                                                                    if (res?.error) toast.error(res.error)
                                                                    else {
                                                                        toast.success('İlk temas güncellendi')
                                                                        router.refresh()
                                                                    }
                                                                }}
                                                            >
                                                                <SelectTrigger className={cn("h-7 text-[11px] font-semibold border rounded-md px-2 gap-1 w-full", fcColor)}>
                                                                    <SelectValue>{fcLabel}</SelectValue>
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="__empty__">— Seçiniz</SelectItem>
                                                                    <SelectItem value="Aradım, Olumlu">🟢 Aradım, Olumlu</SelectItem>
                                                                    <SelectItem value="Aradım, Olumsuz">🔴 Aradım, Olumsuz</SelectItem>
                                                                    <SelectItem value="Tekrar Aranacak">🔄 Tekrar Aranacak</SelectItem>
                                                                    <SelectItem value="Değerlendiriyor">🤔 Değerlendiriyor</SelectItem>
                                                                    <SelectItem value="Ulaşamadım">📵 Ulaşamadım</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </TableCell>
                                                    )
                                                }
                                                if (colId === 'process_note') {
                                                    return (
                                                        <TableCell key="process_note" className={cellCls}>
                                                            <Popover>
                                                                <PopoverTrigger asChild>
                                                                    <button
                                                                        className={cn(
                                                                            "w-full text-left text-[11px] px-1.5 py-1 rounded border transition-colors min-h-[28px] max-h-[42px] overflow-hidden",
                                                                            sale.process_note
                                                                                ? "border-slate-200 bg-slate-50 text-slate-700 hover:bg-blue-50 hover:border-blue-200"
                                                                                : "border-dashed border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-500"
                                                                        )}
                                                                        title={sale.process_note || 'Not ekle'}
                                                                    >
                                                                        {sale.process_note ? (
                                                                            <span className="line-clamp-2 whitespace-pre-wrap break-words">{sale.process_note}</span>
                                                                        ) : (
                                                                            <span className="flex items-center gap-1">
                                                                                <StickyNote className="w-3 h-3" /> Not ekle
                                                                            </span>
                                                                        )}
                                                                    </button>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-72 p-3" align="start">
                                                                    <div className="space-y-2">
                                                                        <label className="text-xs font-bold text-slate-600">📝 Süreç Notu</label>
                                                                        <textarea
                                                                            className="w-full min-h-[100px] text-xs border rounded-md p-2 resize-y focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                                                                            defaultValue={sale.process_note || ''}
                                                                            placeholder="Müşteri ile ilgili notlarınızı buraya yazın..."
                                                                            onBlur={async (e) => {
                                                                                const val = e.target.value.trim()
                                                                                if (val !== (sale.process_note || '')) {
                                                                                    const res = await updateProcessNote(sale.id, val)
                                                                                    if (res?.error) toast.error(res.error)
                                                                                    else {
                                                                                        toast.success('Süreç notu kaydedildi')
                                                                                        router.refresh()
                                                                                    }
                                                                                }
                                                                            }}
                                                                        />
                                                                        <p className="text-[10px] text-slate-400">Alandan çıkınca otomatik kaydedilir</p>
                                                                    </div>
                                                                </PopoverContent>
                                                            </Popover>
                                                        </TableCell>
                                                    )
                                                }
                                                if (colId === 'lead_score') {
                                                    const lq = sale.customers?.lead_qualifications?.[0]
                                                    const aiScore = sale.customers?.ai_purchase_score
                                                    return (
                                                        <TableCell key="lead_score" className={cellCls}>
                                                            <div className="flex items-center gap-1.5">
                                                                <LeadScoreBadge
                                                                    customerId={sale.customers?.id}
                                                                    score={lq?.interest_level}
                                                                    source={lq?.interest_level_source || 'ai'}
                                                                    history={lq?.interest_level_history || []}
                                                                    userRole={userRole}
                                                                />
                                                                {aiScore != null && (
                                                                    <span title={`AI Skor: ${aiScore}/100`} className={`text-[9px] font-black px-1 py-0.5 rounded ${
                                                                        aiScore >= 70 ? 'bg-emerald-500/20 text-emerald-600' :
                                                                        aiScore >= 40 ? 'bg-amber-500/20 text-amber-600' :
                                                                        'bg-slate-500/15 text-slate-500'
                                                                    }`}>
                                                                        🧠{aiScore}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    )
                                                }
                                                if (colId === 'campaign') {
                                                    return (
                                                        <TableCell key="campaign" className={cellCls}>
                                                            <CampaignTouchpointBadge info={sale.campaign_info} />
                                                        </TableCell>
                                                    )
                                                }
                                                if (colId === 'date') return (
                                                    <TableCell key="date" className="px-2.5 py-1 align-middle text-muted-foreground font-medium text-xs border-r border-border/50">
                                                        <span suppressHydrationWarning>
                                                            {new Date(sale.created_at).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </TableCell>
                                                )
                                                if (colId === 'amount') return (
                                                    <TableCell key="amount" className="px-2.5 py-1 align-middle text-right border-r border-border/50">
                                                        {sale.final_price || sale.units?.price ? (
                                                            <span className="font-bold text-foreground font-mono tracking-tight text-xs">
                                                                {sale.final_price ? formatCurrency(sale.final_price, sale.currency || sale.units?.currency) : formatCurrency(sale.units.price, sale.units.currency)}
                                                            </span>
                                                        ) : <span className="text-muted-foreground">-</span>}
                                                    </TableCell>
                                                )
                                                if (colId === 'rep') return (
                                                    <TableCell key="rep" className={cellCls}>
                                                        <div className="flex items-center gap-2">
                                                            {sale.profiles?.full_name ? (
                                                                <div className="flex items-center gap-1.5 text-xs bg-muted/30 pl-1 pr-1.5 py-0.5 rounded-full border border-transparent hover:border-border transition-colors group/rep">
                                                                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[9px] font-bold">{sale.profiles.full_name.substring(0, 2).toUpperCase()}</div>
                                                                    <span className="font-medium text-foreground text-[11px] leading-none">{sale.profiles.full_name}</span>
                                                                    {sale.profiles.is_external && (
                                                                        <span title="Dış Broker" className="inline-flex items-center justify-center h-4 w-4 rounded bg-orange-100 text-orange-600 flex-shrink-0 text-[9px]" aria-label="Dış Broker">
                                                                            🏢
                                                                        </span>
                                                                    )}
                                                                    {isAdmin && (
                                                                        <Popover open={assignPopoverOpen === sale.id} onOpenChange={(open) => setAssignPopoverOpen(open ? sale.id : null)}>
                                                                            <PopoverTrigger asChild>
                                                                                <Button variant="ghost" size="icon" className="h-5 w-5 ml-1 text-muted-foreground hover:text-blue-600 opacity-0 group-hover/rep:opacity-100 transition-opacity"><Pencil className="h-3 w-3" /></Button>
                                                                            </PopoverTrigger>
                                                                            <PopoverContent className="p-0" align="start">
                                                                                <Command>
                                                                                    <CommandInput placeholder="Temsilci ara..." />
                                                                                    <CommandList>
                                                                                        <CommandEmpty>Temsilci bulunamadı.</CommandEmpty>
                                                                                        <CommandGroup>
                                                                                            <CommandItem onSelect={() => handleManualAssign(sale.id, null)} className="text-red-600">Atamayı Kaldır</CommandItem>
                                                                                            {profiles?.map((profile: any) => (
                                                                                                <CommandItem key={profile.id} onSelect={() => handleManualAssign(sale.id, profile.id)}>{profile.full_name}</CommandItem>
                                                                                            ))}
                                                                                        </CommandGroup>
                                                                                    </CommandList>
                                                                                </Command>
                                                                            </PopoverContent>
                                                                        </Popover>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-1">
                                                                    {isAdmin ? (
                                                                        <>
                                                                            <Button variant="ghost" size="sm" className="h-6 text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-[10px] px-1.5 border border-blue-200 dashed bg-blue-50/30" onClick={() => handleAutoAssign(sale.id)} disabled={isAssigning === sale.id} title={t('actions.assignTooltip')}>
                                                                                {isAssigning === sale.id ? t('actions.assigning') : <><Sparkles className="w-2.5 h-2.5 mr-1" /> {t('actions.autoAssign')}</>}
                                                                            </Button>
                                                                            <Popover open={assignPopoverOpen === sale.id} onOpenChange={(open) => setAssignPopoverOpen(open ? sale.id : null)}>
                                                                                <PopoverTrigger asChild>
                                                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-blue-600 border border-transparent hover:border-border rounded-full"><Pencil className="h-3 w-3" /></Button>
                                                                                </PopoverTrigger>
                                                                                <PopoverContent className="p-0" align="start">
                                                                                    <Command>
                                                                                        <CommandInput placeholder="Temsilci Seç..." />
                                                                                        <CommandList>
                                                                                            <CommandEmpty>Temsilci bulunamadı.</CommandEmpty>
                                                                                            <CommandGroup>
                                                                                                {profiles?.map((profile: any) => (
                                                                                                    <CommandItem key={profile.id} onSelect={() => handleManualAssign(sale.id, profile.id)}>{profile.full_name}</CommandItem>
                                                                                                ))}
                                                                                            </CommandGroup>
                                                                                        </CommandList>
                                                                                    </Command>
                                                                                </PopoverContent>
                                                                            </Popover>
                                                                        </>
                                                                    ) : (
                                                                        <Button variant="outline" size="sm" className="h-6 text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-[10px] px-1.5 border-blue-200"
                                                                            onClick={async () => { const { data: { user } } = await (await import('@/lib/supabase/client')).createClient().auth.getUser(); if (user) handleManualAssign(sale.id, user.id) }}
                                                                            disabled={isAssigning === sale.id}>
                                                                            <User className="w-2.5 h-2.5 mr-1" /> Üzerine Al
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                )
                                                if (colId === 'remaining') {
                                                    const isExternalBroker = sale.profiles?.is_external === true
                                                    if (!sale.profiles?.full_name || !isExternalBroker) {
                                                        return <TableCell key="remaining" className={cellCls}><span className="text-muted-foreground text-[10px]">—</span></TableCell>
                                                    }
                                                    const createdAt = new Date(sale.created_at)
                                                    const now = new Date()
                                                    const elapsedMs = now.getTime() - createdAt.getTime()
                                                    const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24))
                                                    const remainingDays = leadOwnershipDays - elapsedDays
                                                    const isExpired = remainingDays <= 0
                                                    const isUrgent = remainingDays > 0 && remainingDays <= 7
                                                    const isWarning = remainingDays > 7 && remainingDays <= 30

                                                    return (
                                                        <TableCell key="remaining" className={cellCls}>
                                                            <span suppressHydrationWarning className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${
                                                                isExpired 
                                                                    ? 'bg-red-100 text-red-700 border-red-200 animate-pulse' 
                                                                    : isUrgent 
                                                                        ? 'bg-red-50 text-red-600 border-red-200'
                                                                        : isWarning 
                                                                            ? 'bg-amber-50 text-amber-700 border-amber-200' 
                                                                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                            }`}>
                                                                {isExpired ? 'Süresi Doldu' : `${remainingDays} gün`}
                                                            </span>
                                                        </TableCell>
                                                    )
                                                }
                                                if (colId === 'actions') return (
                                                    <TableCell key="actions" className="px-2.5 py-1 align-middle border-r border-border/50">
                                                        <div className="flex items-center gap-1">
                                                             {!isCompleted && (
                                                                 <>
                                                                     {!isBroker && (['Lead', 'Prospect', 'Reservation', 'Reserved', 'Opsiyon - Kapora Bekleniyor'].includes(sale.status)) && (
                                                                         <PipelineReservationDialog saleId={sale.id} currentUnitId={sale.unit_id} currentProjectId={sale.project_id || sale.units?.project_id} projects={projects} customerName={sale.customers?.full_name} status={sale.status} expiryDate={sale.reservation_expiry} triggerSize="xs" />
                                                                     )}
                                                                     {!isBroker && ['Lead', 'Prospect'].includes(sale.status) && (
                                                                         <MatchUnitDialog saleId={sale.id} currentUnitId={sale.unit_id} currentProjectId={sale.project_id || sale.units?.project_id} projects={projects} customerName={sale.customers?.full_name} triggerSize="xs" />
                                                                     )}
                                                                     {isAdvanceMode && !isBroker && !['Lost', 'Completed', 'Sold'].includes(sale.status) && (
                                                                         <Button
                                                                             variant="outline"
                                                                             size="sm"
                                                                             className="h-6 text-[10px] border-cyan-200 bg-cyan-50/50 hover:bg-cyan-100 hover:text-cyan-700 text-cyan-600 font-semibold px-2 flex items-center gap-1 shadow-sm transition-all"
                                                                             onClick={async () => {
                                                                                 if (['Proposal', 'Teklif - Kapora Bekleniyor', 'Negotiation'].includes(sale.status)) {
                                                                                     const { createClient: createBrowserClient } = await import('@/lib/supabase/client')
                                                                                     const supabase = createBrowserClient()
                                                                                     const { data: activeOffers } = await supabase
                                                                                         .from('offers')
                                                                                         .select('id')
                                                                                         .eq('sale_id', sale.id)
                                                                                         .not('status', 'in', '("Rejected","Cancelled","Expired","Lost")')
                                                                                         .limit(1)

                                                                                     if (activeOffers && activeOffers.length > 0) {
                                                                                         router.push(`/${locale}/offers?highlight=${activeOffers[0].id}`)
                                                                                         return
                                                                                     }
                                                                                 }
                                                                                 if (['Reservation', 'Opsiyon - Kapora Bekleniyor'].includes(sale.status)) {
                                                                                     router.push(`/${locale}/options?highlight=${sale.id}`)
                                                                                     return
                                                                                 }
                                                                                 setQuickProposalSale({
                                                                                     saleId: sale.id,
                                                                                     customerName: sale.customers?.full_name || '',
                                                                                     unitId: sale.unit_id,
                                                                                     projectId: sale.project_id || (sale.units as any)?.projects?.id,
                                                                                     totalAmount: sale.final_price || sale.units?.price || 0,
                                                                                     initialCurrency: sale.currency || sale.units?.currency || 'TRY'
                                                                                 })
                                                                                 setQuickProposalOpen(true)
                                                                             }}
                                                                             title="Teklif Ver"
                                                                         >
                                                                             <Send className="w-2.5 h-2.5" /> Teklif
                                                                         </Button>
                                                                     )}
                                                                     {isAdvanceMode && !isBroker && ['Proposal', 'Teklif - Kapora Bekleniyor', 'Negotiation'].includes(sale.status) && (
                                                                         <Button
                                                                             variant="outline"
                                                                             size="sm"
                                                                             className="h-6 text-[10px] border-red-200 bg-red-50/50 hover:bg-red-100 hover:text-red-700 text-red-600 font-semibold px-2 flex items-center gap-1 shadow-sm transition-all animate-in fade-in zoom-in-95 duration-200"
                                                                             onClick={() => openLostDialog(sale.id)}
                                                                             title="Süreci Sonlandır"
                                                                         >
                                                                             <XCircle className="w-2.5 h-2.5" /> Süreci Sonlandır
                                                                         </Button>
                                                                     )}
                                                                     {sale.status === 'Lost' && !sale.restarted_at && <RestartSaleButton saleId={sale.id} triggerSize="xs" />}
                                                                     {['Lead', 'Prospect'].includes(sale.status) && (
                                                                         <Button variant="outline" size="icon" className="h-6 w-6 text-orange-600 border-orange-100 hover:bg-orange-50" onClick={() => openRevertDialog(sale.id)} title="Ön Değerlendirmeye Geri Gönder">
                                                                             <Undo2 className="h-3 w-3" />
                                                                         </Button>
                                                                     )}
                                                                 </>
                                                             )}
                                                         </div>
                                                     </TableCell>
                                                 )
                                                 if (colId === 'quickicons') return (
                                                     <TableCell key="quickicons" className="px-2 py-1 align-middle border-r border-border/50">
                                                         <div className="flex items-center justify-center gap-1">
                                                             {!isCompleted && (
                                                                 <>
                                                                     <AiMatchDialog customerId={sale.customers?.id} customerName={sale.customers?.full_name} triggerClassName="h-6 w-6 text-indigo-600 border-indigo-100 hover:bg-indigo-50 hover:border-indigo-200 transition-all active:scale-90 flex items-center justify-center" />
                                                                     <Button variant="outline" size="icon" className="h-6 w-6 border-slate-200 hover:bg-slate-50 transition-all active:scale-95" onClick={() => handlePlanClick(sale.id)} title="Ödeme Planı">
                                                                         <Calculator className="h-3 w-3 text-muted-foreground" />
                                                                     </Button>
                                                                     <Button variant="outline" size="icon" className="h-6 w-6 text-blue-600 border-blue-100 hover:bg-blue-50" onClick={() => handleCreateActivity(sale.customers)} title="Aktivite Ekle">
                                                                         <CalendarPlus className="h-3 w-3" />
                                                                     </Button>
                                                                     <Button variant="outline" size="icon" className={`h-6 w-6 transition-all active:scale-90 ${sale.description ? 'text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-100' : 'text-slate-400 border-slate-200 hover:bg-slate-50'}`} onClick={() => openQuickNote(sale.id, sale.customers?.id, sale.description)} title="Hızlı Not">
                                                                         <StickyNote className="h-3 w-3" />
                                                                     </Button>
                                                                 </>
                                                             )}
                                                             {isAdmin && (
                                                                 <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeleteClick(sale)} title="Sil (Admin)">
                                                                     <Trash className="h-3 w-3" />
                                                                 </Button>
                                                             )}
                                                         </div>
                                                     </TableCell>
                                                 )
                                                 return null
                                             })}
                                        </TableRow>
                                    )
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={colOrder.length} className="text-center h-32 text-muted-foreground flex-col items-center justify-center">
                                        <span className="block mb-2">{t('table.empty')}</span>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </table>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="flex flex-col gap-4 md:hidden">
                {currentSales && currentSales.length > 0 ? (
                    currentSales.map((sale: any) => {
                        const isCompleted = sale.status === 'Completed' || sale.status === 'Sold'
                        const isLost = sale.status === 'Lost'

                        const getStatusColor = (status: string) => {
                            switch (status) {
                                case 'Lead': return 'bg-slate-100 text-slate-700'
                                case 'Prospect': return 'bg-blue-100 text-blue-700'
                                case 'Reservation': return 'bg-purple-100 text-purple-700'
                                case 'Opsiyon - Kapora Bekleniyor': return 'bg-amber-100 text-amber-700'
                                case 'Proposal': return 'bg-cyan-100 text-cyan-700'
                                case 'Teklif - Kapora Bekleniyor': return 'bg-indigo-100 text-indigo-700'
                                case 'Negotiation': return 'bg-pink-100 text-pink-700'
                                case 'Sold': return 'bg-emerald-100 text-emerald-700'
                                case 'Completed': return 'bg-green-100 text-green-700'
                                case 'Lost': return 'bg-red-100 text-red-700'
                                default: return 'bg-slate-50 text-slate-600'
                            }
                        }

                        return (
                            <div key={sale.id} className={cn(
                                "rounded-xl border bg-card p-4 shadow-sm space-y-3 relative overflow-hidden",
                                isCompleted && "border-emerald-200 bg-emerald-50/20",
                                isLost && "border-red-100 bg-red-50/10"
                            )}>
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            {isAdvanceMode ? (
                                                <Link
                                                    href={`/customers/${sale.customers?.id}`}
                                                    className="font-bold text-slate-900 text-left hover:text-blue-600 hover:underline transition-colors"
                                                >
                                                    {sale.customers?.full_name}
                                                </Link>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenCustomerProfile(sale.customers)}
                                                    className="font-bold text-slate-900 text-left hover:text-blue-600 hover:underline transition-colors"
                                                >
                                                    {sale.customers?.full_name}
                                                </button>
                                            )}
                                            {sale.customers?.lead_qualifications?.[0] && (
                                                <AiSignalBadge 
                                                    lastCallAt={sale.customers.lead_qualifications[0].last_call_at} 
                                                    interestLevel={sale.customers.lead_qualifications[0].interest_level} 
                                                    callNotes={sale.customers.lead_qualifications[0].call_notes} 
                                                />
                                            )}
                                        </div>
                                        {sale.customers?.customer_number ? (
                                            <span className="text-[10px] font-black px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-md border border-blue-100 w-fit">
                                                {sale.customers.customer_number}
                                            </span>
                                        ) : (
                                            <span className="text-[10px] text-muted-foreground font-mono">ID: {sale.id.slice(0, 8)}</span>
                                        )}
                                        {sale.customers?.phone && (
                                            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                                <a href={`tel:${sale.customers.phone}`} className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 bg-slate-50 text-slate-500 rounded-md border border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors flex-shrink-0" title="Telefon">
                                                    <Phone className="h-2.5 w-2.5" />
                                                    {sale.customers.phone}
                                                </a>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="h-5 px-1 py-0 text-[10px] font-semibold text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded border border-purple-200 gap-0.5 flex-shrink-0"
                                                    onClick={(e) => { e.stopPropagation(); setActiveAiCallSaleId(sale.id); }}
                                                >
                                                    <Sparkles className="h-2.5 w-2.5 animate-pulse" />
                                                    AI Ara
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                    <div 
                                        title={sale.status === 'Lost' && sale.lost_reason ? `Kayıp Gerekçesi: ${sale.lost_reason}` : undefined}
                                        className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold shadow-sm w-full justify-center cursor-help", getStatusColor(sale.status))}
                                    >
                                        {isCompleted ? t('actions.won') : (isBroker ? brokerStatusLabel(sale.status) : (() => {
                                            const statusKeyMap: Record<string, string> = {
                                                'Opsiyon - Kapora Bekleniyor': 'OptionPending',
                                                'Teklif - Kapora Bekleniyor': 'ProposalPending',
                                            }
                                            const key = statusKeyMap[sale.status] || sale.status
                                            return t.has(`status.${key}`) ? t(`status.${key}`) : sale.status
                                        })())}
                                    </div>
                                </div>

                                {sale.description && (
                                    <div
                                        className="bg-slate-50 border border-slate-100 p-2 rounded-lg text-xs text-slate-600 line-clamp-2 cursor-pointer hover:bg-slate-100 transition-colors"
                                        onClick={() => setViewingLead(sale)}
                                    >
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                            {sale.source === 'E-Posta' ? <Mail className="h-3 w-3 text-blue-500" /> : <Info className="h-3 w-3 text-slate-400" />}
                                            <span className="font-bold text-[10px] uppercase text-slate-400">Detay</span>
                                        </div>
                                        {sale.description}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 gap-y-3 text-xs">
                                    {!isBroker && (
                                        <div className="flex flex-col gap-1">
                                            <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-tight">{t('table.project')}</span>
                                            <span className="font-medium truncate">{sale.units?.projects?.name || sale.projects?.name || '-'}</span>
                                        </div>
                                    )}
                                    {!isBroker && (
                                        <div className="flex flex-col gap-1">
                                            <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-tight">{t('table.unit')}</span>
                                            <span className="font-medium">
                                                {sale.units ? (
                                                    <Badge variant="outline" className="h-5 text-[10px] font-mono py-0">{sale.units.unit_number}</Badge>
                                                ) : '-'}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex flex-col gap-1">
                                        <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-tight">{t('table.rep')}</span>
                                        <div className="flex items-center gap-1.5">
                                            {sale.profiles?.full_name ? (
                                                <>
                                                    <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-[9px] font-bold">
                                                        {sale.profiles.full_name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <span className="font-medium truncate">{sale.profiles.full_name}</span>
                                                </>
                                            ) : (
                                                isAdmin ? (
                                                    <button onClick={() => handleAutoAssign(sale.id)} className="text-blue-600 font-bold hover:underline">
                                                        {t('actions.autoAssign')}
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={async () => {
                                                            const { data: { user } } = await (await import('@/lib/supabase/client')).createClient().auth.getUser()
                                                            if (user) handleManualAssign(sale.id, user.id)
                                                        }}
                                                        className="text-blue-600 font-bold hover:underline"
                                                    >
                                                        Üzerine Al
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-tight">{t('table.amount')}</span>
                                        <span className="font-bold text-slate-900 font-mono">
                                            {sale.final_price || sale.units?.price ? (
                                                sale.final_price ?
                                                    formatCurrency(sale.final_price, sale.currency || sale.units?.currency)
                                                    : formatCurrency(sale.units.price, sale.units.currency)
                                            ) : '-'}
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-3 border-t flex items-center justify-between">
                                    <span className="text-[10px] text-muted-foreground">
                                        {new Date(sale.created_at).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <div className="flex gap-2">
                                        <div className="flex gap-1">
                                            {!isCompleted && (
                                                <>
                                                    <Button variant="outline" size="sm" className="h-8 px-3 text-xs" onClick={() => handlePlanClick(sale.id)}>
                                                        <Calculator className="h-3.5 w-3.5 mr-1.5" /> {t('actions.paymentPlanTitle').split(' ')[0]}
                                                    </Button>
                                                    <Button variant="outline" size="icon" className="h-8 w-8 text-blue-600 border-blue-100" onClick={() => handleCreateActivity(sale.customers)}>
                                                        <CalendarPlus className="h-3.5 w-3.5" />
                                                    </Button>
                                                    {!isBroker && (['Lead', 'Prospect', 'Reservation', 'Reserved', 'Opsiyon - Kapora Bekleniyor'].includes(sale.status)) && (
                                                        <PipelineReservationDialog
                                                            saleId={sale.id}
                                                            currentUnitId={sale.unit_id}
                                                            currentProjectId={sale.project_id || sale.units?.project_id}
                                                            projects={projects}
                                                            customerName={sale.customers?.full_name}
                                                            status={sale.status}
                                                            expiryDate={sale.reservation_expiry}
                                                        />
                                                    )}
                                                    {!isBroker && ['Lead', 'Prospect'].includes(sale.status) && (
                                                        <MatchUnitDialog
                                                            saleId={sale.id}
                                                            currentUnitId={sale.unit_id}
                                                            currentProjectId={sale.project_id || sale.units?.project_id}
                                                            customerName={sale.customers?.full_name}
                                                            projects={projects}
                                                        />
                                                    )}

                                                    <AiMatchDialog
                                                        customerId={sale.customers?.id}
                                                        customerName={sale.customers?.full_name}
                                                    />
                                                    {['Lead', 'Prospect'].includes(sale.status) && (
                                                        <Button variant="outline" size="icon" className="h-8 w-8 text-orange-600 border-orange-100 hover:bg-orange-50" onClick={() => openRevertDialog(sale.id)} title="Ön Değerlendirmeye Geri Gönder">
                                                            <Undo2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    )}
                                                </>
                                            )}
                                            {sale.status === 'Lost' && !sale.restarted_at && (
                                                <RestartSaleButton saleId={sale.id} />
                                            )}
                                        </div>
                                        {isAdmin && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => handleDeleteClick(sale)}
                                                title="Sil (Admin)"
                                            >
                                                <Trash className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })
                ) : (
                    <div className="bg-card border rounded-xl p-8 text-center text-muted-foreground">
                        {t('table.empty')}
                    </div>
                )}
            </div>

            {/* Pagination Controls & Record Count */}
            {
                totalPages > 1 ? (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 mt-4 shadow-sm">
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-9 w-9 rounded-xl border-slate-200 hover:bg-slate-50 active:scale-95 text-slate-600"
                                onClick={() => {
                                    handlePageChange(1)
                                    window.scrollTo({ top: 0, behavior: 'smooth' })
                                }}
                                disabled={currentPage === 1}
                                title="İlk Sayfa"
                            >
                                <ChevronsLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-9 w-9 rounded-xl border-slate-200 hover:bg-slate-50 active:scale-95 text-slate-600"
                                onClick={() => {
                                    handlePageChange(Math.max(1, currentPage - 1))
                                    window.scrollTo({ top: 0, behavior: 'smooth' })
                                }}
                                disabled={currentPage === 1}
                                title="Önceki"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>

                            {/* Manual Page Input */}
                            <div className="hidden sm:flex items-center gap-1">
                                <Input 
                                    className="h-9 w-16 text-center text-xs font-bold rounded-xl" 
                                    value={pageInputValue}
                                    onChange={(e) => setPageInputValue(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const page = parseInt(pageInputValue)
                                            if (!isNaN(page) && page >= 1 && page <= totalPages) {
                                                handlePageChange(page)
                                                window.scrollTo({ top: 0, behavior: 'smooth' })
                                            } else {
                                                setPageInputValue(currentPage.toString())
                                            }
                                        }
                                    }}
                                />
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="h-9 px-3 rounded-xl border-slate-200 font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700"
                                    onClick={() => {
                                        const page = parseInt(pageInputValue)
                                        if (!isNaN(page) && page >= 1 && page <= totalPages) {
                                            handlePageChange(page)
                                            window.scrollTo({ top: 0, behavior: 'smooth' })
                                        } else {
                                            setPageInputValue(currentPage.toString())
                                        }
                                    }}
                                >
                                    Git
                                </Button>
                            </div>

                            <Button
                                variant="outline"
                                size="icon"
                                className="h-9 w-9 rounded-xl border-slate-200 hover:bg-slate-50 active:scale-95 text-slate-600"
                                onClick={() => {
                                    handlePageChange(Math.min(totalPages, currentPage + 1))
                                    window.scrollTo({ top: 0, behavior: 'smooth' })
                                }}
                                disabled={currentPage === totalPages}
                                title="Sonraki"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-9 w-9 rounded-xl border-slate-200 hover:bg-slate-50 active:scale-95 text-slate-600"
                                onClick={() => {
                                    handlePageChange(totalPages)
                                    window.scrollTo({ top: 0, behavior: 'smooth' })
                                }}
                                disabled={currentPage === totalPages}
                                title="Son Sayfa"
                            >
                                <ChevronsRight className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-black uppercase tracking-wider border border-blue-100 dark:border-blue-900/50 shadow-sm">
                            <Filter className="w-3.5 h-3.5 text-blue-500" />
                            Filtreye Uygun: <span className="text-blue-800 dark:text-blue-200 font-black ml-1">{totalSalesCount} Kayıt</span>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 mt-2 sm:mt-0">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest hidden sm:block">
                                Sayfa <span className="text-blue-600 font-black">{currentPage}</span> / {totalPages}
                                <span className="mx-2 text-slate-200">|</span>
                                Görüntülenen: {currentSales.length} / {totalSalesCount}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block sm:hidden">
                                {currentPage} / {totalPages} • {currentSales.length}/{totalSalesCount}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col sm:flex-row items-center justify-end gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 mt-4 shadow-sm">
                        <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest hidden sm:block">
                                Görüntülenen: {currentSales.length} / {totalSalesCount}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block sm:hidden">
                                {currentSales.length}/{totalSalesCount}
                            </p>
                        </div>
                    </div>
                )
            }

            <Dialog open={isPlanOpen} onOpenChange={setIsPlanOpen}>
                <DialogContent className="max-w-2xl w-[95vw] rounded-2xl bg-white dark:bg-slate-950">
                    <DialogHeader>
                        <DialogTitle>{t('actions.paymentPlanTitle')}</DialogTitle>
                    </DialogHeader>
                    {selectedSaleId && (() => {
                        const selectedSale = sales.find(s => s.id === selectedSaleId)
                        const saleProjectId = selectedSale?.units?.project_id || selectedSale?.project_id
                        const filteredTemplates = saleProjectId
                            ? templates.filter((t: any) => !t.project_id || t.project_id === saleProjectId)
                            : templates
                        return (
                            <PaymentPlanCalculator
                                saleId={selectedSaleId}
                                totalAmount={selectedSale?.final_price || selectedSale?.units?.price || 0}
                                initialCurrency={selectedSale?.currency || selectedSale?.units?.currency || 'TRY'}
                                onClose={() => setIsPlanOpen(false)}
                                templates={filteredTemplates}
                            />
                        )
                    })()}
                </DialogContent>
            </Dialog>

            <Dialog open={!!viewingLead} onOpenChange={(open) => !open && setViewingLead(null)}>
                <DialogContent className="max-w-lg w-[95vw] rounded-2xl overflow-hidden p-0 bg-white dark:bg-slate-950">
                    <DialogHeader className="p-6 bg-slate-50 border-b">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                                {viewingLead?.source === 'E-Posta' ? <Mail className="h-5 w-5" /> : <MessageSquareText className="h-5 w-5" />}
                            </div>
                            <div>
                                <DialogTitle className="text-xl">{t('actions.leadDetails') || 'Talep Detayları'}</DialogTitle>
                                <p className="text-sm text-muted-foreground">{viewingLead?.customers?.full_name}</p>
                            </div>
                        </div>
                    </DialogHeader>
                    <div className="p-6 space-y-4 max-h-[60vh] overflow-auto whitespace-pre-wrap font-sans text-sm text-slate-700 leading-relaxed">
                        {viewingLead?.description || 'Açıklama bulunamadı.'}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={!!saleToDelete} onOpenChange={(open) => !open && setSaleToDelete(null)}>
                <DialogContent className="max-w-lg rounded-2xl p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-slate-950">
                    <div className="p-8 space-y-4 text-center">
                        <div className="h-16 w-16 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-4 animate-bounce">
                            <Trash className="w-8 h-8" />
                        </div>
                        <DialogHeader className="space-y-2">
                            <DialogTitle className="text-xl font-black text-slate-900 leading-tight">
                                Satış Kaydını Sil
                            </DialogTitle>
                            <div className="text-slate-500 font-medium leading-relaxed">
                                <span className="text-slate-900 font-bold uppercase tracking-tight">"{saleToDelete?.customers?.full_name}"</span>
                                <br />
                                <span className="text-red-500 font-bold text-xs mt-2 block">DİKKAT: Bu işlem geri alınamaz!</span>
                                <ul className="text-xs text-left mt-4 space-y-1 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <li>• Satış kaydı tamamen silinecek</li>
                                    <li>• Varsa Teklifler ve Görüşme geçmişi silinecek</li>
                                    <li>• Eğer ünite atanmışsa, ünite tekrar <strong>Satılık</strong> durumuna dönecek</li>
                                </ul>
                            </div>
                        </DialogHeader>
                    </div>
                    <div className="p-6 bg-slate-50 flex flex-col sm:flex-row gap-2 border-t border-slate-100">
                        <Button
                            onClick={() => setSaleToDelete(null)}
                            variant="outline"
                            className="w-full sm:w-1/2 h-11 rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-white active:scale-95 transition-all"
                        >
                            Vazgeç
                        </Button>
                        <Button
                            onClick={handleDeleteConfirm}
                            className="w-full sm:w-1/2 h-11 rounded-xl bg-red-500 hover:bg-red-600 shadow-lg shadow-red-100 text-white font-bold active:scale-95 transition-all"
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <div className="flex items-center gap-2">
                                    <span className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full" />
                                    <span>Siliniyor...</span>
                                </div>
                            ) : (
                                "Evet, Sil"
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>



            <Sheet open={isCustomerProfileOpen} onOpenChange={setIsCustomerProfileOpen}>
                <SheetContent 
                    side="right" 
                    className="overflow-y-auto border-l shadow-2xl bg-white p-0 sm:max-w-none"
                    style={{ width: `${sheetWidth}px`, maxWidth: '100vw' }}
                >
                    <div 
                        className="absolute left-0 top-0 bottom-0 w-2 hover:w-4 cursor-col-resize hover:bg-blue-500/50 z-50 transition-all flex items-center justify-center group"
                        onMouseDown={(e) => {
                            e.preventDefault()
                            isResizingSheet.current = true
                            document.body.style.cursor = 'col-resize'
                        }}
                    >
                        <div className="h-12 w-1 bg-slate-300 rounded-full group-hover:bg-white shadow-sm" />
                    </div>
                    <SheetHeader className="sr-only">
                        <SheetTitle>Müşteri Profili</SheetTitle>
                    </SheetHeader>
                    <div className="p-6 h-full bg-slate-50/30">
                        {viewingCustomerProfile ? (
                            <CustomerView 
                                customer={viewingCustomerProfile.customer} 
                                activities={viewingCustomerProfile.activities} 
                                contracts={viewingCustomerProfile.contracts} 
                                sales={viewingCustomerProfile.sales} 
                                profiles={profiles} 
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <span className="animate-spin h-5 w-5 border-2 border-slate-300 border-t-slate-600 rounded-full" />
                                    <span>Müşteri bilgileri yükleniyor...</span>
                                </div>
                            </div>
                        )}
                    </div>
                </SheetContent>
            </Sheet>

            <ActivityForm
                open={isActivityOpen}
                onOpenChange={setIsActivityOpen}
                mode="create"
                activity={{
                    customer_id: selectedCustomerForActivity?.id,
                    customers: selectedCustomerForActivity
                }}
                customers={customers}
                profiles={profiles}
                projects={projects}
            />

            {/* Revert To Qualification Dialog */}
            <Dialog open={revertDialogOpen} onOpenChange={setRevertDialogOpen}>
                <DialogContent className="max-w-md bg-white rounded-2xl shadow-2xl p-6">
                    <DialogHeader>
                        <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-3">
                            <Undo2 className="h-6 w-6 text-orange-600" />
                        </div>
                        <DialogTitle className="text-center text-xl font-bold">Ön Değerlendirmeye İade</DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                        <p className="text-sm text-center text-slate-500 mb-4">
                            Bu kaydı satış hunisinden çıkarıp yeniden Ön Değerlendirme aşamasına göndermek üzeresiniz.
                        </p>
                        
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-slate-700">Hangi Duruma Gönderilecek?</Label>
                            <Select value={revertStatus} onValueChange={setRevertStatus}>
                                <SelectTrigger className="w-full h-10 border-slate-200">
                                    <SelectValue placeholder="Durum seçin" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="new">Yeni Talep</SelectItem>
                                    <SelectItem value="contacted">Arandı</SelectItem>
                                    <SelectItem value="follow_up">Takipte</SelectItem>
                                    <SelectItem value="unreachable">Ulaşılamadı</SelectItem>
                                    <SelectItem value="disqualified">Elendi (Olumsuz)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-slate-700">İade Nedeni / Notu</Label>
                            <Textarea 
                                placeholder="Neden geri gönderiliyor? Neler konuşuldu? (İsteğe bağlı)" 
                                value={revertNote}
                                onChange={e => setRevertNote(e.target.value)}
                                className="resize-none min-h-[100px] border-slate-200"
                            />
                        </div>
                    </div>
                    
                    <div className="flex gap-3 w-full">
                        <Button variant="outline" onClick={() => setRevertDialogOpen(false)} className="flex-1 h-11 border-slate-200 hover:bg-slate-50">
                            İptal
                        </Button>
                        <Button onClick={submitRevertToQualification} className="flex-1 h-11 bg-orange-600 hover:bg-orange-700 text-white font-medium shadow-md shadow-orange-200">
                            Geri Gönder
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {activeAiCallSaleId && (
                <AiCallDialog
                    saleId={activeAiCallSaleId}
                    onClose={() => setActiveAiCallSaleId(null)}
                />
            )}

            {/* Quick Note Dialog */}
            <Dialog open={isQuickNoteOpen} onOpenChange={setIsQuickNoteOpen}>
                <DialogContent className="max-w-lg bg-white rounded-2xl shadow-2xl p-6">
                    <DialogHeader>
                        <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-3">
                            <StickyNote className="h-6 w-6 text-amber-600" />
                        </div>
                        <DialogTitle className="text-center text-xl font-bold">Hızlı Not</DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                        {quickNoteExisting && (
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mevcut Notlar</Label>
                                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                                    <pre className="text-xs text-slate-600 whitespace-pre-wrap font-sans">{quickNoteExisting}</pre>
                                </div>
                            </div>
                        )}
                        
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-slate-700">Yeni Not Ekle</Label>
                            <Textarea 
                                placeholder="Notunuzu yazın..." 
                                value={quickNoteText}
                                onChange={e => setQuickNoteText(e.target.value)}
                                className="resize-none min-h-[100px] border-slate-200 focus:border-amber-300 focus:ring-amber-200"
                                autoFocus
                            />
                        </div>
                    </div>
                    
                    <div className="flex gap-3 w-full">
                        <Button variant="outline" onClick={() => setIsQuickNoteOpen(false)} className="flex-1 h-11 border-slate-200 hover:bg-slate-50">
                            İptal
                        </Button>
                        <Button 
                            onClick={handleSaveQuickNote} 
                            disabled={!quickNoteText.trim() || quickNoteSaving}
                            className="flex-1 h-11 bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-md shadow-amber-200"
                        >
                            {quickNoteSaving ? 'Kaydediliyor...' : 'Kaydet'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {proposalSale && (
                <PipelineProposalDialog
                    saleId={proposalSale.saleId}
                    customerName={proposalSale.customerName}
                    totalAmount={proposalSale.totalAmount}
                    initialCurrency={proposalSale.initialCurrency}
                    projectId={proposalSale.projectId}
                    isOpen={proposalOpen}
                    onOpenChange={(open) => {
                        setProposalOpen(open)
                        if (!open) setProposalSale(null)
                    }}
                    onSuccess={() => {
                        router.refresh()
                    }}
                />
            )}

            {quickProposalSale && (
                <QuickProposalDialog
                    saleId={quickProposalSale.saleId}
                    customerName={quickProposalSale.customerName}
                    currentUnitId={quickProposalSale.unitId}
                    currentProjectId={quickProposalSale.projectId}
                    projects={projects}
                    totalAmount={quickProposalSale.totalAmount}
                    initialCurrency={quickProposalSale.initialCurrency}
                    templates={templates}
                    isOpen={quickProposalOpen}
                    onOpenChange={(open) => {
                        setQuickProposalOpen(open)
                        if (!open) setQuickProposalSale(null)
                    }}
                    onSuccess={() => {
                        router.refresh()
                    }}
                />
            )}

            {/* Lost Reason Dialog */}
            <Dialog open={lostDialogOpen} onOpenChange={setLostDialogOpen}>
                <DialogContent className="max-w-md w-full rounded-2xl p-6 bg-white border-none shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                            <XCircle className="h-5 w-5 text-red-500" />
                            Satışı Kaybedildi Olarak İşaretle
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 my-4">
                        <p className="text-sm text-slate-500 font-medium leading-relaxed">
                            Bu satış kaydını kayıp olarak işaretlemek istediğinize emin misiniz? İlgili ünite tekrar satışa açılacaktır. Lütfen bir kaybetme gerekçesi belirtin:
                        </p>
                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Kaybetme Gerekçesi</Label>
                            <Textarea
                                placeholder="Örn: Müşteri bütçeyi aştı, başka projeden satın aldı vb."
                                value={lostReasonText}
                                onChange={(e) => setLostReasonText(e.target.value)}
                                className="bg-slate-50 border-slate-200 focus:ring-red-500 rounded-xl resize-none min-h-[100px] font-medium text-sm p-3"
                            />
                        </div>
                    </div>
                    <div className="flex gap-3 w-full">
                        <Button variant="outline" onClick={() => setLostDialogOpen(false)} className="flex-1 h-11 border-slate-200 hover:bg-slate-50 font-bold rounded-xl">
                            İptal
                        </Button>
                        <Button 
                            onClick={submitLostSale} 
                            disabled={!lostReasonText.trim() || lostSaving}
                            className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-200"
                        >
                            {lostSaving ? 'Kaydediliyor...' : 'Kaydet'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div >
    )
}
