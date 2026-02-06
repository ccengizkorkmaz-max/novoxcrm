import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import {
    Activity,
    CreditCard,
    DollarSign,
    Users,
    TrendingUp,
    CalendarCheck,
    ClipboardList,
    Building2,
    Calendar,
    ChevronRight,
    ArrowUpRight,
    Search,
    Filter
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

import { PipelineStats } from './components/PipelineStats'
import PipelineList from './components/PipelineList'
import NewSaleButton from './components/NewSaleButton'
import CRMFilterSheet from './components/CRMFilterSheet'
import CRMSearch from './components/CRMSearch'

export default async function CRMPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const searchParams = await props.searchParams
    const supabase = await createClient()
    const t = await getTranslations('CRM')
    const params = searchParams

    const filterProject = params.p as string
    const filterRep = params.r as string
    const filterStatus = params.s as string
    const filterSearch = params.q as string

    const page = Number(searchParams.page) || 1
    const itemsPerPage = 50
    const from = (page - 1) * itemsPerPage
    const to = from + itemsPerPage - 1

    // 1. Build base sales query for filtered data
    let baseQuery = supabase
        .from('sales')
        .select('*, customers!inner(id, full_name, email, phone), units(unit_number, price, currency, projects(id, name)), projects(id, name), profiles(full_name)', { count: 'exact' })
        .neq('status', 'Inbox') // Exclude inbox items (pending approval)

    if (filterProject) baseQuery = baseQuery.eq('project_id', filterProject)
    if (filterRep) baseQuery = baseQuery.eq('assigned_to', filterRep)
    if (filterStatus) baseQuery = baseQuery.eq('status', filterStatus)
    if (filterSearch) {
        baseQuery = baseQuery.or(`full_name.ilike.%${filterSearch}%,phone.ilike.%${filterSearch}%,email.ilike.%${filterSearch}%`, { foreignTable: 'customers' })
    }

    // 1.5 Get Current User Role
    const { data: { user } } = await supabase.auth.getUser()
    let isAdmin = false
    if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        isAdmin = profile?.role === 'admin' || profile?.role === 'owner'
    }

    // 2. Fetch initial background data in parallel
    const [
        projectsRes,
        profilesRes,
        templatesRes,
        customersRes,
        availableUnitsRes,
        salesStatsRes,
        salesListRes
    ] = await Promise.all([
        supabase.from('projects').select('id, name').order('name'),
        supabase.from('profiles').select('id, full_name').order('full_name'),
        supabase.from('payment_plan_templates').select('*').order('name', { ascending: true }),
        supabase.from('customers').select('*, customer_demands(*), contract_customers(id)').order('created_at', { ascending: false }).limit(1000),
        supabase.from('units').select('id, unit_number, projects(id, name)').in('status', ['For Sale', 'Stock']).limit(1000),
        supabase.from('sales').select('status'),
        baseQuery.order('created_at', { ascending: false }).range(from, to)
    ])

    const projectsData = projectsRes.data || []
    const profilesData = profilesRes.data || []
    const templates = templatesRes.data || []
    const customers = customersRes.data || []
    const availableUnits = availableUnitsRes.data || []
    const salesForStats = salesStatsRes.data || []
    const sales = salesListRes.data || []
    const totalSalesCount = salesListRes.count || 0

    return (
        <div className="flex flex-col gap-6">
            <div className="sticky top-0 z-30 bg-background/95 backdrop-blur pb-2 pt-1 border-b mb-2">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4 px-1">
                        <h1 className="text-xl md:text-2xl font-bold tracking-tight whitespace-nowrap">{t('title')}</h1>
                        <CRMFilterSheet
                            projects={projectsData || []}
                            profiles={profilesData || []}
                        />
                        <CRMSearch />
                        <NewSaleButton
                            customers={customers || []}
                            availableUnits={availableUnits || []}
                            initialState={{
                                openNewSale: params.newSale === 'true',
                                unitId: params.unitId as string,
                                projectId: params.projectId as string
                            }}
                        />
                    </div>
                </div>

                <div className="hidden lg:block">
                    <PipelineStats sales={salesForStats || []} />
                </div>
            </div>

            <div className="lg:hidden px-1">
                <PipelineStats sales={salesForStats || []} />
            </div>

            <PipelineList
                sales={sales || []}
                customers={customers || []}
                availableUnits={availableUnits || []}
                templates={templates || []}
                profiles={profilesData || []}
                projects={projectsData || []}
                totalSalesCount={totalSalesCount}
                initialPage={page}
                isAdmin={isAdmin}
            />
        </div>
    )
}
