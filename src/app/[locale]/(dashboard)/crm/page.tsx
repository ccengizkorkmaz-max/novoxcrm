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

    // 1. Fetch Projects & Profiles for Filter Options
    const { data: projectsData } = await supabase.from('projects').select('id, name').order('name')
    const { data: profilesData } = await supabase.from('profiles').select('id, full_name').order('full_name')

    // 2. Fetch all customers in batches (bypassing the 1000 limit)
    let allCustomers: any[] = []

    try {
        let from = 0
        const batchSize = 1000
        let hasMore = true

        while (hasMore) {
            const { data, error } = await supabase
                .from('customers')
                .select('*, customer_demands(*), contract_customers(id)')
                .order('created_at', { ascending: false })
                .range(from, from + batchSize - 1)

            if (error) {
                console.error('Error fetching customers batch:', error)
                hasMore = false
            } else if (data && data.length > 0) {
                allCustomers = [...allCustomers, ...data]
                from += batchSize
                if (data.length < batchSize) hasMore = false
            } else {
                hasMore = false
            }
        }
    } catch (err) {
        console.error('Unexpected error fetching customers:', err)
        // Continue with empty customer list rather than crashing
    }

    const customers = allCustomers

    // 3. Build base sales query for filtered data
    let baseQuery = supabase
        .from('sales')
        .select('*, customers!inner(id, full_name, email, phone), units(unit_number, price, currency, projects(id, name)), projects(id, name), profiles(full_name)')

    if (filterProject) baseQuery = baseQuery.eq('project_id', filterProject)
    if (filterRep) baseQuery = baseQuery.eq('assigned_to', filterRep)
    if (filterStatus) baseQuery = baseQuery.eq('status', filterStatus)
    if (filterSearch) {
        // Expand search to include name, phone, email and unit number
        baseQuery = baseQuery.or(`full_name.ilike.%${filterSearch}%,phone.ilike.%${filterSearch}%,email.ilike.%${filterSearch}%`, { foreignTable: 'customers' })
    }

    // Fetch sales in batches
    let allSales: any[] = []
    let salesFrom = 0
    const salesBatchSize = 1000
    let hasMoreSales = true

    while (hasMoreSales) {
        const { data, error: salesError } = await baseQuery
            .order('created_at', { ascending: false })
            .range(salesFrom, salesFrom + salesBatchSize - 1)

        if (salesError) {
            console.error('Error fetching sales batch:', salesError)
            hasMoreSales = false
        } else if (data && data.length > 0) {
            allSales = [...allSales, ...data]
            salesFrom += salesBatchSize
            if (data.length < salesBatchSize) hasMoreSales = false
        } else {
            hasMoreSales = false
        }
    }
    const sales = allSales

    // 4. For the create sale dialog - fetch all available units in batches
    let allAvailableUnits: any[] = []
    let unitsFrom = 0
    const unitsBatchSize = 1000
    let hasMoreUnits = true

    while (hasMoreUnits) {
        const { data, error: unitsError } = await supabase
            .from('units')
            .select('id, unit_number, projects(id, name)')
            .in('status', ['For Sale', 'Stock'])
            .range(unitsFrom, unitsFrom + unitsBatchSize - 1)

        if (unitsError) {
            console.error('Error fetching units batch:', unitsError)
            hasMoreUnits = false
        } else if (data && data.length > 0) {
            allAvailableUnits = [...allAvailableUnits, ...data]
            unitsFrom += unitsBatchSize
            if (data.length < unitsBatchSize) hasMoreUnits = false
        } else {
            hasMoreUnits = false
        }
    }
    const availableUnits = allAvailableUnits

    // 5. Fetch Payment Plan Templates
    const { data: templates } = await supabase.from('payment_plan_templates').select('*').order('name', { ascending: true })

    return (
        <div className="flex flex-col gap-6">
            <div className="sticky top-0 z-30 bg-background/95 backdrop-blur pb-2 pt-1 border-b mb-2">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4 px-1">
                        <h1 className="text-xl md:text-2xl font-bold tracking-tight">{t('title')}</h1>
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
                    <PipelineStats sales={sales || []} />
                </div>
            </div>

            <div className="lg:hidden px-1">
                <PipelineStats sales={sales || []} />
            </div>

            <PipelineList
                sales={sales || []}
                customers={customers || []}
                availableUnits={availableUnits || []}
                templates={templates || []}
            />
        </div >
    )
}
