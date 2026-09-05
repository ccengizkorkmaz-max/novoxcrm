import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

import PipelineList from './components/PipelineList'
import CRMSearch from './components/CRMSearch'
import SalesExportButton from './components/SalesExportButton'
import BulkAutoAssignButton from './components/BulkAutoAssignButton'
import BulkRevertDqButton from './components/BulkRevertDqButton'
import DeferredPipelineStats from './components/DeferredPipelineStats'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import DeferredCRMToolbar from './components/DeferredCRMToolbar'
import CRMHeaderToggles from './components/CRMHeaderToggles'
import CRMUnansweredWpToggle from './components/CRMUnansweredWpToggle'
import CrmWhatsAppRealtimeNotifier from './components/CrmWhatsAppRealtimeNotifier'
import { CRMStatsCollapse } from './components/CRMStatsCollapse'
import RepTrackingTab from './components/RepTrackingTab'
import CRMTabs from './components/CRMTabs'
import React, { Suspense } from 'react'

export default async function CRMPage(props: {
    params: Promise<{ locale: string }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { locale } = await props.params
    const searchParams = await props.searchParams
    const supabase = await createClient()
    const t = await getTranslations('CRM')
    const params = searchParams

    const filterProject = params.p as string
    const filterRepRaw = params.r as string
    const filterRep = filterRepRaw // kept for backward compat
    const filterReps = filterRepRaw ? filterRepRaw.split(',').filter(Boolean) : []
    const filterStatus = params.s as string
    const filterSearch = params.q as string
    const filterCustomer = params.c as string
    const filterDateFrom = params.df as string
    const filterDateTo = params.dt as string
    const filterFirstContact = params.fc as string
    const activeTab = (params.tab as string) || 'pipeline'

    const page = Number(searchParams.page) || 1
    const itemsPerPage = 50
    const from = (page - 1) * itemsPerPage
    const to = from + itemsPerPage - 1

    // ============================================================
    // CRITICAL PATH: Auth + Sales List (50 records) — loads FIRST
    // ============================================================
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const adminSupabase = createAdminClient()

    const { data: { user } } = await supabase.auth.getUser()
    
    const { data: userProfile } = user 
        ? await supabase.from('profiles').select('role, tenant_id').eq('id', user.id).single()
        : { data: null }

    const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'owner'
    const isManager = isAdmin || userProfile?.role === 'manager'
    const userTenantId = userProfile?.tenant_id

    const { data: tenantData } = userTenantId
        ? await supabase.from('tenants').select('tenant_type, lead_ownership_days, crm_mode').eq('id', userTenantId).single()
        : { data: null }
    const tenantType = (tenantData as any)?.tenant_type || 'developer'
    const leadOwnershipDays = (tenantData as any)?.lead_ownership_days ?? 90
    const isBroker = tenantType === 'broker'
    const isAdvanceMode = (tenantData as any)?.crm_mode === 'advance'

    // Build sales list query (THE CRITICAL 50 RECORDS)
    let baseQuery = supabase
        .from('sales')
        .select('*, customers!inner(id, full_name, email, phone, customer_number, communication_enabled, source, lead_qualifications(last_call_at, interest_level, interest_level_ai, interest_level_source, interest_level_history, call_notes, status)), units(unit_number, price, currency, projects(id, name)), projects(id, name), profiles(full_name, is_external)', { count: 'exact' })
        .neq('status', 'Inbox')

    if (!isManager && user) {
        baseQuery = baseQuery.eq('assigned_to', user.id)
    } else if (filterReps.length > 0) {
        if (filterReps.includes('unassigned')) {
            baseQuery = baseQuery.is('assigned_to', null)
        } else {
            baseQuery = baseQuery.in('assigned_to', filterReps)
        }
    }

    if (filterProject) baseQuery = baseQuery.eq('project_id', filterProject)
    if (filterStatus) baseQuery = baseQuery.eq('status', filterStatus)
    if (filterCustomer) baseQuery = baseQuery.eq('customer_id', filterCustomer)
    // Turkey timezone (UTC+3) conversion: a local date like 2026-08-21 means
    // start: 2026-08-20T21:00:00Z (midnight TR), end: 2026-08-21T20:59:59Z (23:59:59 TR)
    if (filterDateFrom) baseQuery = baseQuery.gte('created_at', `${filterDateFrom}T00:00:00+03:00`)
    if (filterDateTo) baseQuery = baseQuery.lte('created_at', `${filterDateTo}T23:59:59+03:00`)
    if (filterSearch) {
        const { buildCustomerSearchFilter } = await import('@/lib/phone-search-utils')
        const searchFilter = buildCustomerSearchFilter(filterSearch)
        if (searchFilter) {
            baseQuery = baseQuery.or(searchFilter, { foreignTable: 'customers' })
        }
    }
    if (filterFirstContact) {
        if (filterFirstContact === 'none') {
            baseQuery = baseQuery.is('first_contact', null)
        } else {
            baseQuery = baseQuery.eq('first_contact', filterFirstContact)
        }
    }

    const filterUnansweredWp = params.unanswered_wp === 'true' || params.wp_unanswered === 'true'

    // Fetch unread WhatsApp conversations for this tenant (replies waiting for sales rep response)
    const { data: rawUnreadConvs } = userTenantId
        ? await adminSupabase
            .from('whatsapp_conversations')
            .select('id, customer_id, phone_number, unread_count, last_message_preview, last_message_at')
            .eq('tenant_id', userTenantId)
            .gt('unread_count', 0)
            .order('last_message_at', { ascending: false })
            .limit(1000)
        : { data: [] }

    const unreadWpMap: Record<string, { count: number; preview: string; at: string }> = {}
    const unreadCustomerIds: string[] = []

    rawUnreadConvs?.forEach((c: any) => {
        if (c.customer_id) {
            unreadWpMap[c.customer_id] = {
                count: c.unread_count || 1,
                preview: c.last_message_preview || '',
                at: c.last_message_at
            }
            unreadCustomerIds.push(c.customer_id)
        }
    })

    if (filterUnansweredWp) {
        if (unreadCustomerIds.length > 0) {
            baseQuery = baseQuery.in('customer_id', unreadCustomerIds)
        } else {
            baseQuery = baseQuery.eq('id', '00000000-0000-0000-0000-000000000000')
        }
    }

    // Sales reps: sort by most recently assigned first
    // Managers/Admins: sort by creation date
    const orderColumn = (!isManager && user) ? 'assigned_at' : 'created_at'

    const showTrackingTab = !isAdvanceMode && !isBroker && isManager

    // Fetch sales list + profiles + tracking data + active activities (all in parallel)
    const [salesListRes, profilesRes, projectsRes, templatesRes, trackingSalesRes, activitiesRes] = await Promise.all([
        baseQuery.order(orderColumn, { ascending: false, nullsFirst: false }).order('updated_at', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false }).range(from, to),
        supabase.from('profiles')
            .select('id, full_name, is_external, role')
            .eq('tenant_id', userTenantId)
            .not('full_name', 'is', null)
            .neq('full_name', '')
            .neq('full_name', '1')
            .eq('is_active', true)
            .or('is_external.is.null,is_external.eq.false')
            .in('role', ['admin', 'owner', 'manager', 'sales', 'sales_rep', 'agent', 'crm_manager', 'user'])
            .order('full_name'),
        supabase.from('projects').select('id, name, address, city, district, latitude, longitude').order('name'),
        supabase.from('payment_plan_templates').select('*, project_id').order('name', { ascending: true }),
        // Tracking: same table, no pagination, all non-Inbox sales
        showTrackingTab
            ? supabase.from('sales')
                .select('*, customers!inner(id, full_name, email, phone, customer_number, source), units(unit_number, projects(id, name)), projects(id, name), profiles(full_name, is_external)')
                .neq('status', 'Inbox')
                .order('updated_at', { ascending: false, nullsFirst: false })
                .order('created_at', { ascending: false })
                .limit(2000)
            : Promise.resolve({ data: [] as any[], error: null }),
        // Active/Planned Randevu activities (using admin client to prevent RLS filtering)
        adminSupabase.from('activities')
            .select('id, customer_id, type, topic, summary, notes, description, due_date, status, created_at')
            .eq('tenant_id', userTenantId)
            .in('status', ['Planned', 'Pending'])
            .order('due_date', { ascending: true })
    ])

    const profilesData = profilesRes.data || []
    const projectsData = projectsRes.data || []
    const templates = templatesRes.data || []
    const rawSales = salesListRes.data || []
    const totalSalesCount = salesListRes.count || 0
    const trackingSales = trackingSalesRes.data || []
    const initialActivities = activitiesRes.data || []

    // Fetch latest campaign touchpoints for the current page sales
    const customerIds = rawSales.map((s: any) => s.customer_id).filter(Boolean)
    const campaignMap: Record<string, any> = {}

    if (customerIds.length > 0) {
        try {
            // 1. Latest outreach execution per customer
            const { data: execs } = await adminSupabase
                .from('outreach_executions')
                .select('id, status, started_at, customer_id, outreach_workflows(id, name), outreach_steps(action_type)')
                .in('customer_id', customerIds)
                .order('started_at', { ascending: false })

            const latestExecByCust: Record<string, any> = {}
            execs?.forEach((e: any) => {
                if (e.customer_id && !latestExecByCust[e.customer_id]) {
                    latestExecByCust[e.customer_id] = e
                }
            })

            // 2. Map phone numbers for inbound message matching
            const phoneToCustId: Record<string, string> = {}
            rawSales.forEach((s: any) => {
                const p = (s.customers as any)?.phone || ''
                const norm = p.replace(/\D/g, '').slice(-10)
                if (norm && s.customer_id) phoneToCustId[norm] = s.customer_id
            })

            // 3. Earliest campaign date among these executions
            const allStarts = Object.values(latestExecByCust).map((e: any) => e.started_at).filter(Boolean)
            const cutoff = allStarts.length > 0 ? new Date(Math.min(...allStarts.map((d: any) => new Date(d).getTime())) - 60000).toISOString() : null

            const replyByCust: Record<string, any> = {}
            if (cutoff) {
                const { data: recentMsgs } = await adminSupabase
                    .from('whatsapp_messages')
                    .select('conversation_id, content, created_at')
                    .eq('direction', 'inbound')
                    .gte('created_at', cutoff)
                    .order('created_at', { ascending: false })
                    .limit(200)

                if (recentMsgs && recentMsgs.length > 0) {
                    const convIds = [...new Set(recentMsgs.map((m: any) => m.conversation_id))]
                    const { data: convs } = await adminSupabase
                        .from('whatsapp_conversations')
                        .select('id, phone_number')
                        .in('id', convIds)

                    const convPhoneMap: Record<string, string> = {}
                    convs?.forEach((c: any) => {
                        const norm = (c.phone_number || '').replace(/\D/g, '').slice(-10)
                        if (norm) convPhoneMap[c.id] = norm
                    })

                    recentMsgs.forEach((m: any) => {
                        const phoneNorm = convPhoneMap[m.conversation_id]
                        if (phoneNorm && phoneToCustId[phoneNorm]) {
                            const cId = phoneToCustId[phoneNorm]
                            if (!replyByCust[cId]) replyByCust[cId] = m
                        }
                    })
                }
            }

            customerIds.forEach((cId: string) => {
                const exec = latestExecByCust[cId]
                if (exec) {
                    const reply = replyByCust[cId]
                    const lq = rawSales.find((s: any) => s.customer_id === cId)?.customers?.lead_qualifications?.[0]
                    campaignMap[cId] = {
                        workflowName: exec.outreach_workflows?.name || 'Kampanya',
                        channel: exec.outreach_steps?.action_type || 'whatsapp',
                        startedAt: exec.started_at,
                        buttonText: reply?.content || null,
                        replyTime: reply?.created_at || null,
                        responseType: lq?.interest_level || (reply ? 'replied' : 'no_response')
                    }
                }
            })
        } catch (campErr) {
            console.error('Error enriching campaign touchpoints:', campErr)
        }
    }

    const sales = rawSales.map((s: any) => ({
        ...s,
        campaign_info: campaignMap[s.customer_id] || null
    }))

    // ============================================================
    // RENDER: Sales list renders IMMEDIATELY, stats/toolbar stream in
    // ============================================================

    // Shared filter params for deferred components
    const statsFilterProps = {
        isManager,
        userId: user?.id,
        filterReps,
        filterProject,
        filterCustomer,
        filterDateFrom,
        filterDateTo,
        filterSearch,
        tenantType
    }

    // Pipeline stats skeleton (shown while real stats load)
    const statsSkeleton = (
        <div className="flex gap-1 mb-1 animate-pulse">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="flex-1 rounded-lg bg-muted/50 p-1.5">
                    <div className="h-2 w-10 bg-muted rounded mb-1" />
                    <div className="h-4 w-6 bg-muted rounded" />
                </div>
            ))}
        </div>
    )

    // Toolbar skeleton (shown while heavy dropdown data loads)
    const toolbarSkeleton = (
        <>
            <div className="h-9 w-24 bg-muted animate-pulse rounded" />
            <div className="h-9 w-28 bg-muted animate-pulse rounded" />
        </>
    )



    // Sales List — renders IMMEDIATELY with first 50 records
    return (
        <div className="flex flex-col gap-2">
            <div className="sticky top-0 z-30 bg-background/95 backdrop-blur pb-1 pt-0.5 border-b mb-1">
                {/* 1. Row: Title + Tabs */}
                <div className="flex items-center px-1 mb-2 gap-4">
                    <h1 className="text-xl font-bold tracking-tight whitespace-nowrap">{isBroker ? 'İşlem Yönetimi' : t('title')}</h1>
                    {showTrackingTab && (
                        <CRMTabs activeTab={activeTab} />
                    )}
                </div>

                {/* 2. Row: Actions (hide when tracking tab) */}
                {activeTab !== 'tracking' && (
                    <div className="flex items-center gap-2 px-1 mb-1 flex-wrap">
                        {/* Filter + NewSale */}
                        <Suspense fallback={toolbarSkeleton}>
                            <DeferredCRMToolbar
                                userTenantId={userTenantId || ''}
                                isBroker={isBroker}
                                tenantType={tenantType}
                                params={params}
                            />
                        </Suspense>

                        {/* Search + Export + AutoAssign */}
                        <div className="flex items-center gap-1.5 shrink-0 ml-1 flex-wrap">
                            <CRMHeaderToggles />
                            <CRMUnansweredWpToggle 
                                unreadCount={unreadCustomerIds.length}
                                isActive={filterUnansweredWp}
                            />
                            <div className="w-72 lg:w-96">
                                <Suspense fallback={<div className="h-9 w-full bg-muted animate-pulse rounded" />}>
                                    <CRMSearch />
                                </Suspense>
                            </div>
                            <SalesExportButton 
                                filters={{
                                    project: filterProject,
                                    rep: filterRep,
                                    status: filterStatus,
                                    search: filterSearch,
                                    customer: filterCustomer,
                                    dateFrom: filterDateFrom,
                                    dateTo: filterDateTo
                                }}
                            />
                            {!isBroker && isAdmin && (
                                <>
                                    <BulkAutoAssignButton />
                                    <BulkRevertDqButton />
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Pipeline Stats */}
                {activeTab !== 'tracking' && (
                    <div className="hidden lg:block">
                        <CRMStatsCollapse>
                            <Suspense fallback={statsSkeleton}>
                                <DeferredPipelineStats {...statsFilterProps} />
                            </Suspense>
                        </CRMStatsCollapse>
                    </div>
                )}
            </div>

            {activeTab !== 'tracking' && (
                <div className="lg:hidden px-1">
                    <CRMStatsCollapse>
                        <Suspense fallback={statsSkeleton}>
                            <DeferredPipelineStats {...statsFilterProps} />
                        </Suspense>
                    </CRMStatsCollapse>
                </div>
            )}

            {/* Tab Content */}
            {activeTab === 'tracking' && showTrackingTab ? (
                <RepTrackingTab
                    sales={trackingSales}
                    profiles={profilesData || []}
                    projects={projectsData || []}
                />
            ) : (
                <PipelineList
                    sales={sales || []}
                    customers={[]}
                    templates={templates || []}
                    profiles={profilesData || []}
                    projects={projectsData || []}
                    initialActivities={initialActivities}
                    totalSalesCount={totalSalesCount}
                    initialPage={page}
                    isAdmin={isAdmin}
                    tenantType={tenantType}
                    leadOwnershipDays={leadOwnershipDays}
                    isAdvanceMode={isAdvanceMode}
                    userRole={userProfile?.role || 'sales'}
                    unreadWpMap={unreadWpMap}
                    unreadWpCount={unreadCustomerIds.length}
                    isUnansweredWpFilter={filterUnansweredWp}
                />
            )}

            {/* Realtime Inbound WhatsApp Notification & Live Sync */}
            <CrmWhatsAppRealtimeNotifier tenantId={userTenantId} />
        </div>
    )
}
