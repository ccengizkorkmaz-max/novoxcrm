'use client'

import { useState, useEffect, useMemo } from 'react'
import { Clock, Loader2, CalendarClock, MapPin, Building2, ExternalLink, Info, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { createActivity, updateActivity, outcomeActivity, deleteActivity } from '@/app/[locale]/(dashboard)/crm/activities/actions'
import { getSalesOffices, type SalesOfficeLocation } from '@/app/[locale]/(dashboard)/settings/sales-offices-actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { cn, formatTurkeyDateTime, toTurkeyDateTimeLocal, fromTurkeyDateTimeLocal } from '@/lib/utils'
import { Combobox } from '@/components/ui/combobox'
import { VoiceInput } from '@/components/ui/voice-input'
import { Link } from '@/i18n/routing'

function UpcomingActivitiesInfo({ customerId }: { customerId: string }) {
    const [activities, setActivities] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!customerId) {
            setActivities([])
            return
        }

        async function fetchRecent() {
            setLoading(true)
            const supabase = createClient()
            const { data } = await supabase
                .from('activities')
                .select('id, summary, due_date, status, type')
                .eq('customer_id', customerId)
                .in('status', ['Planned', 'In Progress'])
                .order('due_date', { ascending: true })
                .limit(3)

            if (data) setActivities(data)
            setLoading(false)
        }

        fetchRecent()
    }, [customerId])

    if (!customerId) return null
    if (loading) return (
        <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse mt-3 p-3 bg-muted/50 rounded-md border border-dashed">
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" /> Müşteri planları kontrol ediliyor...
        </div>
    )
    if (activities.length === 0) return null

    return (
        <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-md p-2.5 mt-2 text-sm shadow-sm transition-all animate-in fade-in slide-in-from-top-2">
            <p className="font-medium text-amber-800 dark:text-amber-400 flex items-center gap-1.5 mb-1.5 text-[11px]">
                <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                Yaklaşan {activities.length} Planlı Aktivite
            </p>
            <ul className="space-y-1 max-h-[100px] overflow-y-auto">
                {activities.map(act => {
                    // Clean up long Call IDs from summary display
                    let displaySummary = act.summary || ''
                    displaySummary = displaySummary.replace(/\s*\(CallID:\s*[a-f0-9-]+\)/gi, '').trim()
                    if (displaySummary.length > 50) displaySummary = displaySummary.substring(0, 50) + '…'
                    
                    return (
                        <li key={act.id} className="flex items-center justify-between text-amber-900 dark:text-amber-300 bg-white/60 dark:bg-black/20 px-2 py-1.5 rounded border border-amber-100 dark:border-amber-900/30 text-[11px] gap-2">
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                <span className="capitalize text-[10px] font-medium text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-1 py-0.5 rounded shrink-0">{act.type === 'Site Visit' ? 'Ziyaret' : act.type === 'Call' ? 'Arama' : act.type === 'Meeting' ? 'Toplantı' : act.type}</span>
                                <span className="truncate font-medium" title={act.summary}>{displaySummary}</span>
                            </div>
                            <span className="flex items-center gap-0.5 whitespace-nowrap text-[10px] text-amber-600 dark:text-amber-300 shrink-0">
                                <Clock className="h-2.5 w-2.5" />
                                {formatTurkeyDateTime(act.due_date, 'dayMonth')}
                            </span>
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}

interface ActivityFormProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    mode: 'create' | 'edit' | 'complete'
    activity?: any
    customers?: any[]
    profiles?: any[]
    projects?: any[]
    defaultCustomerId?: string
    defaultLeadId?: string
    defaultProjectId?: string
}

export function ActivityForm({ open, onOpenChange, mode, activity, customers, profiles, projects, defaultCustomerId, defaultLeadId, defaultProjectId }: ActivityFormProps) {
    const t = useTranslations('Activities')
    const router = useRouter()

    // Form States
    const [summary, setSummary] = useState(activity?.summary || '')
    const [description, setDescription] = useState(activity?.description || '')
    const [notes, setNotes] = useState(activity?.notes || '')
    const [status, setStatus] = useState(activity?.status || 'Planned')
    const [selectedCustomerId, setSelectedCustomerId] = useState(activity?.customer_id || defaultCustomerId || '')
    const [selectedProjectId, setSelectedProjectId] = useState(activity?.project_id || defaultProjectId || '')
    const [isProcessingVoice, setIsProcessingVoice] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDelete = async () => {
        if (confirm('Bu aktiviteyi silmek istediğinize emin misiniz?')) {
            setIsDeleting(true)
            const result = await deleteActivity(activity.id)
            setIsDeleting(false)
            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success('Aktivite silindi')
                onOpenChange(false)
                router.refresh()
            }
        }
    }

    const isLeadMode = !!activity?.lead_id || !!defaultLeadId
    const [resolvedLeadName, setResolvedLeadName] = useState(
        activity?.leads?.full_name 
            ? `${activity.leads.full_name} (Müşteri Adayı)` 
            : (activity?.lead_name || '')
    )

    // Fetch lead name client-side if the server join didn't return it
    useEffect(() => {
        const leadId = activity?.lead_id || defaultLeadId
        if (!leadId || resolvedLeadName) return

        const fetchLeadName = async () => {
            const supabase = createClient()
            const { data } = await supabase
                .from('leads')
                .select('full_name')
                .eq('id', leadId)
                .single()
            if (data?.full_name) {
                setResolvedLeadName(`${data.full_name} (Müşteri Adayı)`)
            } else {
                setResolvedLeadName('Müşteri Adayı')
            }
        }
        fetchLeadName()
    }, [activity?.lead_id, defaultLeadId])

    const leadName = resolvedLeadName || 'Müşteri Adayı'
    const [location, setLocation] = useState(activity?.location || activity?.unit_id || '')
    const [salesOffices, setSalesOffices] = useState<SalesOfficeLocation[]>([])
    const [selectedOfficeId, setSelectedOfficeId] = useState<string>('')

    // Fetch defined sales offices / meeting points
    useEffect(() => {
        if (open) {
            getSalesOffices().then(res => {
                if (res.success && res.offices) {
                    const activeOnly = res.offices.filter(o => o.isActive)
                    setSalesOffices(activeOnly)

                    // If editing, try to match existing location with a known office
                    if (activity?.location) {
                        const matched = activeOnly.find(o => 
                            o.id === activity.location || 
                            activity.location.includes(o.name) ||
                            o.name.includes(activity.location)
                        )
                        if (matched) setSelectedOfficeId(matched.id)
                    }
                }
            })
        }
    }, [open, activity?.location])

    useEffect(() => {
        if (open && activity) {
            setSummary(activity?.summary || '')
            setDescription(activity?.description || '')
            setNotes(activity?.notes || '')
            setStatus(activity?.status || 'Planned')
            setSelectedCustomerId(activity?.customer_id || '')
            setSelectedProjectId(activity?.project_id || '')
            setLocation(activity?.location || activity?.unit_id || '')
            // Reset lead name from join data when activity changes
            setResolvedLeadName(
                activity?.leads?.full_name 
                    ? `${activity.leads.full_name} (Müşteri Adayı)` 
                    : (activity?.lead_name || '')
            )
        } else if (open && !activity) {
            if (defaultProjectId) {
                setSelectedProjectId(defaultProjectId)
                const found = projects?.find((p: any) => p.id === defaultProjectId)
                if (found) {
                    const formattedLoc = [found.address, found.district, found.city].filter(Boolean).join(', ') || `${found.name} Satış Ofisi`
                    setLocation(formattedLoc)
                }
            }
        }
    }, [open, activity, defaultProjectId, projects])

    const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const projId = e.target.value
        setSelectedProjectId(projId)
        if (projId) {
            // Check if there is an office tied to this project
            const linkedOffice = salesOffices.find(o => o.projectId === projId)
            if (linkedOffice) {
                setSelectedOfficeId(linkedOffice.id)
                const fullAddress = [linkedOffice.address, linkedOffice.district, linkedOffice.city].filter(Boolean).join(', ')
                setLocation(fullAddress ? `${linkedOffice.name} - ${fullAddress}` : linkedOffice.name)
                return
            }

            const found = projects?.find((p: any) => p.id === projId)
            if (found) {
                const formattedLoc = [found.address, found.district, found.city].filter(Boolean).join(', ') || `${found.name} Satış Ofisi`
                setLocation(formattedLoc)
            }
        }
    }

    const handleOfficeChange = (officeId: string) => {
        setSelectedOfficeId(officeId)
        if (!officeId || officeId === 'custom') {
            return
        }
        const found = salesOffices.find(o => o.id === officeId)
        if (found) {
            const fullAddress = [found.address, found.district, found.city].filter(Boolean).join(', ')
            setLocation(fullAddress ? `${found.name} (${fullAddress})` : found.name)
            if (found.projectId && !selectedProjectId) {
                setSelectedProjectId(found.projectId)
            }
        }
    }

    const selectedOffice = useMemo(() => {
        return salesOffices.find(o => o.id === selectedOfficeId)
    }, [salesOffices, selectedOfficeId])

    const selectedProject = useMemo(() => {
        return projects?.find((p: any) => p.id === selectedProjectId)
    }, [projects, selectedProjectId])

    const googleMapsUrl = useMemo(() => {
        if (selectedOffice) {
            if (selectedOffice.mapsUrl) return selectedOffice.mapsUrl
            if (selectedOffice.latitude && selectedOffice.longitude) {
                return `https://maps.google.com/?q=${selectedOffice.latitude},${selectedOffice.longitude}`
            }
            if (selectedOffice.address || selectedOffice.name) {
                return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${selectedOffice.name} ${selectedOffice.address}`.trim())}`
            }
        }
        if (!selectedProject) return null
        if (selectedProject.latitude && selectedProject.longitude) {
            return `https://maps.google.com/?q=${selectedProject.latitude},${selectedProject.longitude}`
        }
        if (selectedProject.address || selectedProject.name) {
            return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${selectedProject.name} ${selectedProject.address || ''}`.trim())}`
        }
        return null
    }, [selectedOffice, selectedProject])

    // Ensure the current customer is in the list even if not in the top 1000
    const comboboxItems = useMemo(() => {
        const items = customers?.map((c: any) => {
            const customerTypeLabel = c.customer_type === 'company' ? 'Firma' : 'Kişi'
            const companyInfo = c.company?.name || c.company_name
            return {
                value: c.id,
                label: `${c.full_name} (${customerTypeLabel}${companyInfo ? ` - ${companyInfo}` : ''})`
            }
        }) || []

        // If we have a selected customer but they aren't in the list, add them
        if (selectedCustomerId && !items.find(i => i.value === selectedCustomerId)) {
            const cust = activity?.customers || activity?.customer
            const customerTypeLabel = cust?.customer_type === 'company' ? 'Firma' : 'Kişi'
            const companyInfo = cust?.company?.name || cust?.company_name
            const currentCustomerName = cust 
                ? `${cust.full_name} (${customerTypeLabel}${companyInfo ? ` - ${companyInfo}` : ''})` 
                : 'Seçili Müşteri'
            items.unshift({ value: selectedCustomerId, label: currentCustomerName })
        }

        return items
    }, [customers, selectedCustomerId, activity])

    const isReadOnly = false
    const isCompleteMode = mode === 'complete' || status === 'Completed'
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleVoiceData = (text: string, data?: any) => {
        // If we have structured data from the AI, use it to fill the whole form
        if (data) {
            if (isCompleteMode) {
                if (data.description) setNotes((prev: string) => prev ? prev + "\n" + data.description : data.description)
            } else {
                if (data.summary) setSummary(data.summary)
                if (data.description) setDescription(data.description)
            }
            return
        }

        // Fallback to simple text append if no structured data
        if (isCompleteMode) {
            setNotes((prev: string) => prev ? prev + "\n" + text : text)
        } else {
            setDescription((prev: string) => prev ? prev + "\n" + text : text)
        }

        // Suggest summary if empty and in create/edit mode
        if (!summary && !isCompleteMode) {
            const firstSentence = text.split('.')[0]
            if (firstSentence && firstSentence.length < 50) {
                setSummary(firstSentence)
            } else {
                setSummary("Sesli Not: " + text.substring(0, 20) + "...")
            }
        }
    }

    async function handleSubmit(formData: FormData) {
        setIsSubmitting(true)
        try {
            let result: any;

            // Form state'lerinden eksik kalabilecek alanları formData'ya garanti olarak yaz
            if (summary) formData.set('summary', summary)
            if (description) formData.set('description', description)
            if (notes) formData.set('notes', notes)
            if (status) formData.set('status', status)
            if (location) formData.set('location', location)
            if (selectedCustomerId) formData.set('customer_id', selectedCustomerId)
            if (selectedProjectId) formData.set('project_id', selectedProjectId)

            // Helper: convert datetime-local string to UTC ISO string using Turkey timezone
            const toUTC = (key: string) => {
                const val = formData.get(key) as string
                if (val && val.trim() !== '') {
                    const iso = fromTurkeyDateTimeLocal(val)
                    if (iso) {
                        formData.set(key, iso)
                    }
                }
            }

            if (mode === 'create') {
                toUTC('due_date')
                toUTC('reminder_at')
                toUTC('next_action_date')
                result = await createActivity(formData)
            } else if (mode === 'edit' && status === 'Completed') {
                toUTC('due_date')
                toUTC('reminder_at')
                toUTC('next_action_date')
                formData.set('id', activity?.id)
                result = await updateActivity(formData)
            } else if (mode === 'edit') {
                toUTC('due_date')
                toUTC('reminder_at')
                toUTC('next_action_date')
                formData.set('id', activity?.id)
                result = await updateActivity(formData)
            } else if (isCompleteMode) {
                toUTC('next_action_date')
                formData.set('id', activity?.id)
                result = await outcomeActivity(formData)
            }

            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success(
                    mode === 'create' ? t('form.success.created') :
                        mode === 'edit' ? t('form.success.updated') : t('form.success.completed')
                )
                onOpenChange(false)
                router.refresh()
            }
        } catch (err: any) {
            console.error('Activity Form Submit Error:', err)
            toast.error(err?.message || 'Aktivite kaydedilirken bir hata oluştu.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] overflow-visible" key={open ? `activity-${activity?.id || activity?.customer_id || 'new'}` : 'closed'}>
                <DialogHeader>
                    <div className="flex items-center justify-between pr-8">
                        <DialogTitle>
                            {mode === 'create' ? t('form.createTitle') :
                                mode === 'edit' ? t('form.editTitle') :
                                    t('form.completeTitle')}
                        </DialogTitle>

                        {/* Voice Input Button - Visible in Header */}
                        {!isReadOnly && (
                            <VoiceInput
                                onTranscriptionComplete={handleVoiceData}
                                isProcessing={isProcessingVoice}
                            />
                        )}
                    </div>
                </DialogHeader>
                <form action={handleSubmit}>
                    <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-1">

                        {/* Basic Info - Hidden only in specialized complete mode */}
                        {mode !== 'complete' && (
                            <>
                                {isLeadMode ? (
                                    <div className="grid gap-2">
                                        <Label>Müşteri Adayı</Label>
                                        <Input
                                            value={leadName}
                                            disabled
                                            className="bg-slate-100 dark:bg-slate-900 text-slate-500"
                                        />
                                        <input type="hidden" name="lead_id" value={activity?.lead_id || defaultLeadId || ''} />
                                    </div>
                                ) : (
                                    <>
                                        <input type="hidden" name="customer_id" value={selectedCustomerId} />
                                        <div className="grid gap-2">
                                            <div className="flex items-center justify-between">
                                                <Label>{t('form.customer')}</Label>
                                                {selectedCustomerId && (
                                                    <Button 
                                                        variant="link" 
                                                        size="sm"
                                                        className="h-auto p-0 text-xs text-blue-600 hover:text-blue-800"
                                                        asChild
                                                    >
                                                        <Link href={`/customers/${selectedCustomerId}`}>
                                                            Müşteri Profiline Git
                                                        </Link>
                                                    </Button>
                                                )}
                                            </div>
                                            <div className="w-full">
                                                <Combobox
                                                    items={comboboxItems}
                                                    value={selectedCustomerId}
                                                    onChange={setSelectedCustomerId}
                                                    placeholder={t('form.select')}
                                                    searchPlaceholder={t('form.search') || 'Müşteri Ara...'}
                                                    emptyText={t('form.noResults') || 'Müşteri bulunamadı.'}
                                                    disabled={isReadOnly || mode === 'edit' || (mode === 'create' && !!activity?.customer_id)}
                                                />
                                                <UpcomingActivitiesInfo customerId={selectedCustomerId} />
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className="grid gap-2">
                                     <div className="flex items-center justify-between">
                                         <Label>Proje</Label>
                                         {selectedProject && (
                                             <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                                                 <CheckCircle2 className="h-3 w-3" /> Proje Seçildi
                                             </span>
                                         )}
                                     </div>
                                     <select
                                         name="project_id"
                                         className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                         value={selectedProjectId}
                                         onChange={handleProjectChange}
                                         disabled={isReadOnly}
                                     >
                                         <option value="">Proje Seçiniz (Opsiyonel)</option>
                                         {projects?.map((p: any) => (
                                             <option key={p.id} value={p.id}>{p.name}</option>
                                         ))}
                                     </select>
                                 </div>

                                 {/* Sales Offices & Meeting Points Dropdown */}
                                 <div className="grid gap-2">
                                     <div className="flex items-center justify-between">
                                         <Label className="flex items-center gap-1.5">
                                             <Building2 className="h-4 w-4 text-primary" />
                                             Tanımlı Satış Ofisi & Görüşme Noktası
                                         </Label>
                                         {salesOffices.length > 0 && (
                                             <span className="text-[11px] text-muted-foreground">
                                                 {salesOffices.length} lokasyon kayıtlı
                                             </span>
                                         )}
                                     </div>
                                     <select
                                         value={selectedOfficeId}
                                         onChange={(e) => handleOfficeChange(e.target.value)}
                                         className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                         disabled={isReadOnly}
                                     >
                                         <option value="">-- Kayıtlı Görüşme Noktası Seçiniz (Opsiyonel) --</option>
                                         {salesOffices.map((office) => {
                                             const iconMap: Record<string, string> = {
                                                 office: '🏢',
                                                 hq: '🏛️',
                                                 lounge: '☕',
                                                 restaurant: '🍽️',
                                                 hotel: '🏨',
                                                 site: '🏗️',
                                                 other: '📍'
                                             }
                                             return (
                                                 <option key={office.id} value={office.id}>
                                                     {iconMap[office.type] || '📍'} {office.name} {office.projectName ? `(${office.projectName})` : ''} - {office.district || office.city || ''}
                                                 </option>
                                             )
                                         })}
                                     </select>
                                     <input type="hidden" name="sales_office_id" value={selectedOfficeId} />
                                 </div>

                                 {/* Rich Location & Sales Office Preview Card */}
                                 {(selectedOffice || selectedProject) && (
                                     <div className="rounded-lg border border-emerald-500/30 bg-emerald-50/70 dark:bg-emerald-950/40 p-3 text-xs space-y-1.5 transition-all animate-in fade-in-50">
                                         <div className="flex items-center justify-between font-semibold text-emerald-900 dark:text-emerald-200">
                                             <span className="flex items-center gap-1.5 text-[12.5px]">
                                                 {selectedOffice ? (
                                                     <>
                                                         <span>{selectedOffice.type === 'hq' ? '🏛️' : selectedOffice.type === 'lounge' ? '☕' : selectedOffice.type === 'restaurant' ? '🍽️' : selectedOffice.type === 'hotel' ? '🏨' : selectedOffice.type === 'site' ? '🏗️' : '🏢'}</span>
                                                         <strong>{selectedOffice.name}</strong>
                                                         {selectedOffice.projectName && <span className="text-[11px] font-normal text-muted-foreground">({selectedOffice.projectName})</span>}
                                                     </>
                                                 ) : (
                                                     <>
                                                         <span>🏢</span>
                                                         <strong>{selectedProject?.name}</strong> Satış Ofisi Lokasyonu
                                                     </>
                                                 )}
                                             </span>
                                             {googleMapsUrl && (
                                                 <a
                                                     href={googleMapsUrl}
                                                     target="_blank"
                                                     rel="noreferrer"
                                                     className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-semibold inline-flex items-center gap-1 hover:underline text-[11.5px]"
                                                 >
                                                     <MapPin className="h-3.5 w-3.5" /> Haritada Aç ↗
                                                 </a>
                                             )}
                                         </div>
                                         <div className="text-slate-700 dark:text-slate-300 text-[11.5px]">
                                             <strong>Adres:</strong> {selectedOffice ? [selectedOffice.address, selectedOffice.district, selectedOffice.city].filter(Boolean).join(', ') : [selectedProject?.address, selectedProject?.district, selectedProject?.city].filter(Boolean).join(', ')}
                                         </div>
                                         {selectedOffice?.notes && (
                                             <div className="text-amber-800 dark:text-amber-300 bg-amber-100/60 dark:bg-amber-900/30 px-2 py-1 rounded text-[11px] flex items-center gap-1">
                                                 <Info className="h-3 w-3 shrink-0" />
                                                 <span><strong>Karşılama Notu:</strong> {selectedOffice.notes}</span>
                                             </div>
                                         )}
                                         <div className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-1 pt-0.5">
                                             <span>📲</span> Bu adres ve Google Maps harita linki randevu kaydedildiğinde müşteriye WhatsApp ile otomatik iletilecektir.
                                         </div>
                                     </div>
                                 )}

                                <div className="grid gap-2">
                                    <Label>{t('form.topic')}</Label>
                                    <select
                                        name="topic"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        defaultValue={activity?.topic || 'General'}
                                        required
                                        disabled={isReadOnly}
                                    >
                                        <option value="General">{t('topic.General')}</option>
                                        <option value="Sales">{t('topic.Sales')}</option>
                                        <option value="Negotiation">{t('topic.Negotiation')}</option>
                                        <option value="Contract">{t('topic.Contract')}</option>
                                        <option value="Support">{t('topic.Support')}</option>
                                        <option value="After Sales">{t('topic.After Sales')}</option>
                                        <option value="Collection">{t('topic.Collection')}</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>{t('table.status')}</Label>
                                        <select
                                            name="status"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-semibold"
                                            value={status}
                                            onChange={(e) => setStatus(e.target.value)}
                                            disabled={isReadOnly}
                                        >
                                            <option value="Planned">{t('status.Planned') || 'Planlandı'}</option>
                                            <option value="In Progress">{t('status.In Progress') || 'Devam Ediyor / Başladı'}</option>
                                            <option value="Completed">{t('status.Completed') || 'Tamamlandı'}</option>
                                            <option value="No-Show">Gelmedi (No-Show)</option>
                                            <option value="Rescheduled">Ertelendi</option>
                                            <option value="Cancelled">{t('status.Cancelled') || 'İptal'}</option>
                                        </select>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label>{t('form.owner')}</Label>
                                        <select
                                            name="owner_id"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            defaultValue={activity?.owner_id || ''}
                                            disabled={isReadOnly}
                                        >
                                            <option value="">{t('form.selectOwner') || 'Sorumlu Danışman Ata...'}</option>
                                            {profiles?.filter((p: any) => !p.is_external && p.role !== 'broker').map((p: any) => (
                                                <option key={p.id} value={p.id}>{p.full_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Randevu / Aktivite Türü</Label>
                                        <select
                                            name="type"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-medium"
                                            defaultValue={activity?.type || 'OfficeMeeting'}
                                            required
                                            disabled={isReadOnly}
                                        >
                                            <option value="OfficeMeeting">🏢 Satış Ofisi Randevusu</option>
                                            <option value="Site Visit">🏗️ Saha / Şantiye Gezisi</option>
                                            <option value="OnlineMeeting">📹 Online Görüşme</option>
                                            <option value="Meeting">👥 Yüz Yüze Toplantı</option>
                                            <option value="Call">📞 Telefon Görüşmesi</option>
                                            <option value="Whatsapp">💬 WhatsApp</option>
                                            <option value="Email">✉️ E-posta</option>
                                            <option value="Task">✅ Görev / Takip</option>
                                        </select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Lokasyon / Açık Adres</Label>
                                        <Input
                                            name="location"
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                            placeholder="Örn: Vadistanbul Ofisi veya Özel Adres"
                                            disabled={isReadOnly}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>{t('form.date')}</Label>
                                        <Input
                                            name="due_date"
                                            type="datetime-local"
                                            defaultValue={toTurkeyDateTimeLocal(activity?.due_date || new Date().toISOString())}
                                            required
                                            disabled={isReadOnly}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>{t('form.priority') || 'Öncelik'}</Label>
                                        <select
                                            name="priority"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            defaultValue={activity?.priority || 'Medium'}
                                            disabled={isReadOnly}
                                        >
                                            <option value="Low">{t('form.priorityLow') || 'Düşük'}</option>
                                            <option value="Medium">{t('form.priorityMedium') || 'Orta'}</option>
                                            <option value="High">{t('form.priorityHigh') || 'Yüksek'}</option>
                                            <option value="Urgent">{t('form.priorityUrgent') || 'Acil'}</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>{t('form.reminder') || 'Hatırlatıcı Zamanı'}</Label>
                                        <Input
                                            name="reminder_at"
                                            type="datetime-local"
                                            defaultValue={activity?.reminder_at ? toTurkeyDateTimeLocal(activity.reminder_at) : ''}
                                            disabled={isReadOnly}
                                        />
                                    </div>
                                    <div className="flex items-center space-x-2 pt-6">
                                        <input
                                            type="checkbox"
                                            id="send_location_whatsapp"
                                            name="send_location_whatsapp"
                                            defaultChecked={true}
                                            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                        />
                                        <Label htmlFor="send_location_whatsapp" className="text-xs font-bold text-emerald-800 dark:text-emerald-300 cursor-pointer flex items-center gap-1">
                                            <span>📍 Müşteriye Konum WhatsApp'ı İlet</span>
                                        </Label>
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label>{t('form.summary')}</Label>
                                    <Input
                                        name="summary"
                                        value={summary}
                                        onChange={(e) => setSummary(e.target.value)}
                                        placeholder={t('form.summaryPlaceholder')}
                                        required
                                        disabled={isReadOnly}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>{t('form.description')}</Label>
                                    <Textarea
                                        name="description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder={t('form.descriptionPlaceholder')}
                                        rows={3}
                                        disabled={isReadOnly}
                                    />
                                    {/* Additional hidden notes field only when not in complete mode */}
                                    {!isCompleteMode && <input type="hidden" name="notes" value={notes} />}
                                </div>
                            </>
                        )}

                        {/* Completion Details - outcome, notes, next action */}
                        {isCompleteMode && (
                            <div className={cn("space-y-4 pt-4 border-t mt-2", mode === 'edit' && "bg-muted/30 p-4 rounded-lg border")}>
                                {mode === 'complete' && (
                                    <div className="p-3 bg-muted rounded-md mb-2 text-sm">
                                        <span className="font-semibold">{activity?.summary}</span> {t('form.completingMsg')}
                                    </div>
                                )}

                                <div className="grid gap-2">
                                    <Label className="font-bold text-primary">{t('form.outcome')}</Label>
                                    <select
                                        name="outcome"
                                        className="flex h-10 w-full rounded-md border-2 border-primary/20 bg-background px-3 py-2 text-sm focus:border-primary font-medium"
                                        defaultValue={activity?.outcome || ''}
                                        required
                                        disabled={isReadOnly}
                                    >
                                        <option value="">Sonuç Seçiniz...</option>
                                        <option value="Success">🎉 Kapora Alındı / Satış Yapıldı</option>
                                        <option value="Offer Presented">📄 Teklif / Ödeme Planı Sunuldu (Takipte)</option>
                                        <option value="Reached Interested">👍 İlgileniyor / Süreç Olumlu</option>
                                        <option value="Considering">🤔 Düşünme / Karar Aşamasında</option>
                                        <option value="Follow Up Required">🔄 Tekrar Görüşülecek / Takip Gerekiyor</option>
                                        <option value="Lost - Budget">📉 Olumsuz - Bütçe Yetersiz</option>
                                        <option value="Lost - Location">📍 Olumsuz - Lokasyon / Proje Uygun Değil</option>
                                        <option value="Reached Not Interested">❌ İlgilenmiyor / Vazgeçti</option>
                                        <option value="No-Show">🚫 Müşteri Gelmedi (No-Show)</option>
                                        <option value="Rescheduled">📅 Ertelendi / Yeniden Planlandı</option>
                                        <option value="No Answer">📵 Ulaşılamadı</option>
                                        <option value="Busy">⏳ Meşgul / Sonra Aranacak</option>
                                    </select>
                                </div>
                                <div className="grid gap-2">
                                    <Label className="font-bold">{t('form.notes')}</Label>
                                    <Textarea
                                        name="notes"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder={t('form.notesPlaceholder')}
                                        required
                                        rows={3}
                                        className="border-2"
                                        disabled={isReadOnly}
                                    />
                                </div>

                                <div className="border-t-2 border-dashed pt-4 mt-2">
                                    <h4 className="mb-3 text-sm font-bold flex items-center gap-2">
                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-white">!</span>
                                        {t('form.nextAction')}
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label>{t('form.type')}</Label>
                                            <select
                                                name="next_action_type"
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                defaultValue={activity?.next_action_type || ''}
                                                disabled={isReadOnly}
                                            >
                                                <option value="">{t('form.none')}</option>
                                                <option value="Call">{t('type.Call')}</option>
                                                <option value="Meeting">{t('type.Meeting')}</option>
                                                <option value="OfficeMeeting">{t('type.OfficeMeeting')}</option>
                                                <option value="OnlineMeeting">{t('type.OnlineMeeting')}</option>
                                                <option value="Site Visit">{t('type.Site Visit')}</option>
                                                <option value="Whatsapp">{t('type.Whatsapp')}</option>
                                            </select>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>{t('form.date')}</Label>
                                            <Input
                                                name="next_action_date"
                                                type="datetime-local"
                                                defaultValue={activity?.next_action_date ? toTurkeyDateTimeLocal(activity.next_action_date) : ''}
                                                disabled={isReadOnly}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-2 mt-3">
                                        <Label>{t('topic.General')}</Label>
                                        <Input name="next_action_summary" placeholder={t('form.summaryPlaceholder')} disabled={isReadOnly} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter className="flex items-center justify-between w-full sm:justify-between gap-2">
                        {isReadOnly ? (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                className="w-full"
                            >
                                Kapat
                            </Button>
                        ) : (
                            <>
                                {mode === 'edit' && (
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        onClick={handleDelete}
                                        disabled={isDeleting || isSubmitting}
                                    >
                                        {isDeleting ? 'Siliniyor...' : 'Sil'}
                                    </Button>
                                )}
                                <Button 
                                    type="submit" 
                                    disabled={isSubmitting || isDeleting}
                                    className={cn(
                                        isCompleteMode && mode !== 'edit' && "bg-green-600 hover:bg-green-700 w-full",
                                        isCompleteMode && mode === 'edit' && "bg-green-600 hover:bg-green-700",
                                        mode === 'edit' && "ml-auto"
                                    )}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Kaydediliyor...
                                        </>
                                    ) : (
                                        isCompleteMode ? t('form.completeAndSave') : t('form.save')
                                    )}
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
