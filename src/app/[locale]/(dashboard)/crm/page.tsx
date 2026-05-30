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
import DeferredPipelineStats from './components/DeferredPipelineStats'
import DeferredCRMToolbar from './components/DeferredCRMToolbar'
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

    const page = Number(searchParams.page) || 1
    const itemsPerPage = 50
    const from = (page - 1) * itemsPerPage
    const to = from + itemsPerPage - 1

    // ============================================================
    // CRITICAL PATH: Auth + Sales List (50 records) — loads FIRST
    // ============================================================
    const { data: { user } } = await supabase.auth.getUser()
    
    const { data: userProfile } = user 
        ? await supabase.from('profiles').select('role, tenant_id').eq('id', user.id).single()
        : { data: null }

    const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'owner'
    const isManager = isAdmin || userProfile?.role === 'manager'
    const userTenantId = userProfile?.tenant_id

    const { data: tenantData } = userTenantId
        ? await supabase.from('tenants').select('tenant_type').eq('id', userTenantId).single()
        : { data: null }
    const tenantType = (tenantData as any)?.tenant_type || 'developer'
    const isBroker = tenantType === 'broker'

    // Build sales list query (THE CRITICAL 50 RECORDS)
    let baseQuery = supabase
        .from('sales')
        .select('*, customers!inner(id, full_name, email, phone, customer_number), units(unit_number, price, currency, projects(id, name)), projects(id, name), profiles(full_name)', { count: 'exact' })
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

    // Fetch ONLY the sales list + profiles for the list (fast queries)
    const [salesListRes, profilesRes, projectsRes, templatesRes] = await Promise.all([
        baseQuery.order('created_at', { ascending: false }).range(from, to),
        supabase.from('profiles')
            .select('id, full_name')
            .eq('tenant_id', userTenantId)
            .not('full_name', 'is', null)
            .neq('full_name', '')
            .neq('full_name', '1')
            .or('is_external.is.null,is_external.eq.false')
            .eq('is_active', true)
            .in('role', ['admin', 'owner', 'manager', 'sales'])
            .order('full_name'),
        supabase.from('projects').select('id, name').order('name'),
        supabase.from('payment_plan_templates').select('*, project_id').order('name', { ascending: true })
    ])

    const profilesData = profilesRes.data || []
    const projectsData = projectsRes.data || []
    const templates = templatesRes.data || []
    const sales = salesListRes.data || []
    const totalSalesCount = salesListRes.count || 0

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
                <div className="flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between px-1 mb-2">
                    <div className="flex items-center justify-between md:justify-start gap-3 w-full md:w-auto">
                        <h1 className="text-xl md:text-2xl font-bold tracking-tight whitespace-nowrap">{isBroker ? 'İşlem Yönetimi' : t('title')}</h1>
                        
                        {/* Filter + NewSale — heavy data streams in via Suspense */}
                        <div className="flex items-center gap-1.5 md:gap-3">
                            <Suspense fallback={toolbarSkeleton}>
                                <DeferredCRMToolbar
                                    userTenantId={userTenantId || ''}
                                    isBroker={isBroker}
                                    tenantType={tenantType}
                                    params={params}
                                />
                            </Suspense>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto">
                        <div className="flex-1 md:flex-initial">
                            <Suspense fallback={<div className="h-10 w-full md:w-64 bg-muted animate-pulse rounded" />}>
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
                        {!isBroker && isAdmin && <BulkAutoAssignButton />}
                    </div>
                </div>

                {/* Pipeline Stats — streams in via Suspense after list renders */}
                <div className="hidden lg:block">
                    <Suspense fallback={statsSkeleton}>
                        <DeferredPipelineStats {...statsFilterProps} />
                    </Suspense>
                </div>
            </div>

            <div className="lg:hidden px-1">
                <Suspense fallback={statsSkeleton}>
                    <DeferredPipelineStats {...statsFilterProps} />
                </Suspense>
            </div>

            {/* Sales List — renders IMMEDIATELY with first 50 records */}
            <PipelineList
                sales={sales || []}
                customers={[]}
                templates={templates || []}
                profiles={profilesData || []}
                projects={projectsData || []}
                totalSalesCount={totalSalesCount}
                initialPage={page}
                isAdmin={isAdmin}
                tenantType={tenantType}
            />
        </div>
    )
}
