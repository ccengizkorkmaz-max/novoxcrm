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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

import { PipelineStats } from './components/PipelineStats'
import PipelineList from './components/PipelineList' // Retained from original
import NewSaleButton from './components/NewSaleButton' // Retained from original
import CRMFilterSheet from './components/CRMFilterSheet' // Retained from original

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

    // 2. Fetch Customers with Demands
    const { data: customers } = await supabase.from('customers').select('*, customer_demands(*), contract_customers(id)').order('created_at', { ascending: false })

    // 3. Build Sales Query with Filters
    let query = supabase
        .from('sales')
        .select('*, customers!inner(full_name), units(unit_number, price, currency, projects(id, name)), profiles(full_name)')

    if (filterProject) query = query.eq('units.projects.id', filterProject)
    if (filterRep) query = query.eq('assigned_to', filterRep)
    if (filterStatus) query = query.eq('status', filterStatus)

    // Search query (simplified for now, filtering on customer name)
    if (filterSearch) {
        query = query.ilike('customers.full_name', `%${filterSearch}%`)
    }

    const { data: sales } = await query.order('created_at', { ascending: false })

    // 4. For the create sale dialog - exclude sold units
    const { data: availableUnits } = await supabase
        .from('units')
        .select('id, unit_number, projects(id, name)')
        .in('status', ['For Sale', 'Stock'])

    // 5. Fetch Payment Plan Templates
    const { data: templates } = await supabase.from('payment_plan_templates').select('*').order('name', { ascending: true })

    return (
        <div className="flex flex-col gap-6">
            <div className="sticky top-0 z-20 bg-background/95 backdrop-blur pb-2 pt-1 border-b mb-2">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
                        <CRMFilterSheet
                            projects={projectsData || []}
                            profiles={profilesData || []}
                        />
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
