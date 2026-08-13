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
        .select('*, customers!inner(id, full_name, email, phone, customer_number, communication_enabled, lead_qualifications(last_call_at, interest_level, interest_level_ai, interest_level_source, interest_level_history, call_notes, status)), units(unit_number, price, currency, projects(id, name)), projects(id, name), profiles(full_name, is_external)', { count: 'exact' })
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
    if (filterDateFrom) baseQuery = baseQuery.gte('created_at', filterDateFrom)
    if (filterDateTo) baseQuery = baseQuery.lte('created_at', filterDateTo + 'T23:59:59')
    if (filterSearch) {
        baseQuery = baseQuery.or(`full_name.ilike.%${filterSearch}%,phone.ilike.%${filterSearch}%,email.ilike.%${filterSearch}%`, { foreignTable: 'customers' })
    }
    if (filterFirstContact) {
        if (filterFirstContact === 'none') {
            baseQuery = baseQuery.is('first_contact', null)
        } else {
            baseQuery = baseQuery.eq('first_contact', filterFirstContact)
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
        supabase.from('projects').select('id, name').order('name'),
        supabase.from('payment_plan_templates').select('*, project_id').order('name', { ascending: true }),
        // Tracking: same table, no pagination, all non-Inbox sales
        showTrackingTab
            ? supabase.from('sales')
                .select('*, customers!inner(id, full_name, email, phone, customer_number), units(unit_number, projects(id, name)), projects(id, name), profiles(full_name, is_external)')
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
    const sales = salesListRes.data || []
    const totalSalesCount = salesListRes.count || 0
    const trackingSales = trackingSalesRes.data || []
    const initialActivities = activitiesRes.data || []

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
                />
            )}
        </div>
    )
}
