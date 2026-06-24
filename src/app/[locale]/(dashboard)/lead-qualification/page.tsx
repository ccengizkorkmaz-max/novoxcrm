import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import QualificationBoard from './components/QualificationBoard'
import { NewQualificationModal } from './components/NewQualificationModal'

export const dynamic = 'force-dynamic'

export default async function LeadQualificationPage(props: {
    params: Promise<{ locale: string }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return null
    }

    const { data: profile } = await supabase.from('profiles').select('tenant_id, role').eq('id', user.id).single()

    const searchParams = await props.searchParams
    const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page) : 1
    const searchQuery = typeof searchParams.search === 'string' ? searchParams.search : ''
    const statusFilters = typeof searchParams.status === 'string' && searchParams.status ? searchParams.status.split(',') : []
    const activeTab = typeof searchParams.tab === 'string' ? searchParams.tab : 'active'
    const pageSize = 100

    const interestFilters = typeof searchParams.interest_level === 'string' && searchParams.interest_level ? searchParams.interest_level.split(',') : []
    const projectFilters = typeof searchParams.project_id === 'string' && searchParams.project_id ? searchParams.project_id.split(',') : []
    const assignedFilters = typeof searchParams.assigned_to === 'string' && searchParams.assigned_to ? searchParams.assigned_to.split(',') : []
    const sourceFilters = typeof searchParams.source === 'string' && searchParams.source ? searchParams.source.split(',') : []
    const dateFrom = typeof searchParams.date_from === 'string' ? searchParams.date_from : ''
    const dateTo = typeof searchParams.date_to === 'string' ? searchParams.date_to : ''

    let qualifications: any[] = []
    let totalCount = 0
    let statusCounts: Record<string, number> = {}
    let tenantProfiles: any[] = []
    
    if (profile?.tenant_id) {
        // İlk olarak toplam kayıt sayısını alalım
        let queryCount = supabase
            .from('lead_qualifications')
            .select('*, customers!inner(full_name, phone)', { count: 'exact', head: true })
            .eq('tenant_id', profile.tenant_id)
            
        if (activeTab === 'disqualified') {
            queryCount = queryCount.eq('status', 'disqualified')
        } else {
            if (statusFilters.length > 0) {
                queryCount = queryCount.in('status', statusFilters.filter(s => s !== 'disqualified'))
            } else {
                queryCount = queryCount.neq('status', 'disqualified')
            }
        }

        if (searchQuery) {
            const sq = searchQuery.trim()
            queryCount = queryCount.or(`full_name.ilike.%${sq}%,phone.ilike.%${sq}%`, { foreignTable: 'customers' })
        }

        if (interestFilters.length > 0) {
            queryCount = queryCount.in('interest_level', interestFilters)
        }
        if (projectFilters.length > 0) {
            queryCount = queryCount.in('project_id', projectFilters)
        }
        if (assignedFilters.length > 0) {
            queryCount = queryCount.in('assigned_to', assignedFilters)
        }
        if (sourceFilters.length > 0) {
            queryCount = queryCount.in('source', sourceFilters)
        }
        if (dateFrom) {
            queryCount = queryCount.gte('created_at', dateFrom)
        }
        if (dateTo) {
            queryCount = queryCount.lte('created_at', dateTo + 'T23:59:59')
        }
        
        const { count } = await queryCount
        totalCount = count || 0

        // Get exact counts for all statuses with current filters applied
        const statusKeys = ['new', 'contacted', 'follow_up', 'unreachable', 'disqualified', 'qualified']
        const countPromises = statusKeys.map(async (status) => {
            let sQuery = supabase
                .from('lead_qualifications')
                .select('*, customers!inner(full_name, phone)', { count: 'exact', head: true })
                .eq('tenant_id', profile.tenant_id)
                .eq('status', status)

            if (searchQuery) {
                const sq = searchQuery.trim()
                sQuery = sQuery.or(`full_name.ilike.%${sq}%,phone.ilike.%${sq}%`, { foreignTable: 'customers' })
            }
            if (interestFilters.length > 0) {
                sQuery = sQuery.in('interest_level', interestFilters)
            }
            if (projectFilters.length > 0) {
                sQuery = sQuery.in('project_id', projectFilters)
            }
            if (assignedFilters.length > 0) {
                sQuery = sQuery.in('assigned_to', assignedFilters)
            }
            if (sourceFilters.length > 0) {
                sQuery = sQuery.in('source', sourceFilters)
            }
            if (dateFrom) {
                sQuery = sQuery.gte('created_at', dateFrom)
            }
            if (dateTo) {
                sQuery = sQuery.lte('created_at', dateTo + 'T23:59:59')
            }

            const { count } = await sQuery
            return { status, count: count || 0 }
        })
        
        const results = await Promise.all(countPromises)
        statusCounts = results.reduce((acc, curr) => {
            acc[curr.status] = curr.count
            return acc
        }, {} as Record<string, number>)

        // Paginasyonlu veriyi çekelim
        const from = (page - 1) * pageSize
        const to = from + pageSize - 1

        let queryData = supabase
            .from('lead_qualifications')
            .select(`
                *,
                customers!inner (
                    id, full_name, phone, email, customer_number, created_at, source, notes,
                    customer_demands ( notes )
                ),
                projects:project_id ( id, name ),
                profiles!lead_qualifications_assigned_to_fkey ( id, full_name )
            `)
            .eq('tenant_id', profile.tenant_id)
            .order('created_at', { ascending: false })
            .range(from, to)

        if (activeTab === 'disqualified') {
            queryData = queryData.eq('status', 'disqualified')
        } else {
            if (statusFilters.length > 0) {
                queryData = queryData.in('status', statusFilters.filter(s => s !== 'disqualified'))
            } else {
                queryData = queryData.neq('status', 'disqualified')
            }
        }

        if (searchQuery) {
            const sq = searchQuery.trim()
            queryData = queryData.or(`full_name.ilike.%${sq}%,phone.ilike.%${sq}%`, { foreignTable: 'customers' })
        }

        if (interestFilters.length > 0) {
            queryData = queryData.in('interest_level', interestFilters)
        }
        if (projectFilters.length > 0) {
            queryData = queryData.in('project_id', projectFilters)
        }
        if (assignedFilters.length > 0) {
            queryData = queryData.in('assigned_to', assignedFilters)
        }
        if (sourceFilters.length > 0) {
            queryData = queryData.in('source', sourceFilters)
        }
        if (dateFrom) {
            queryData = queryData.gte('created_at', dateFrom)
        }
        if (dateTo) {
            queryData = queryData.lte('created_at', dateTo + 'T23:59:59')
        }
            
        const { data, error } = await queryData
        if (!error && data) {
            qualifications = data

            const customerIds = data.map(q => q.customers?.id).filter(Boolean)
            if (customerIds.length > 0) {
                const { data: execs, error: execError } = await supabase
                    .from('outreach_executions')
                    .select('customer_id, id')
                    .in('customer_id', customerIds)

                if (!execError && execs) {
                    const execsByCustomer = new Map<string, Array<{ id: string }>>()
                    execs.forEach(e => {
                        if (!execsByCustomer.has(e.customer_id)) {
                            execsByCustomer.set(e.customer_id, [])
                        }
                        execsByCustomer.get(e.customer_id)!.push({ id: e.id })
                    })

                    qualifications.forEach(q => {
                        if (q.customers) {
                            q.customers.outreach_executions = execsByCustomer.get(q.customers.id) || []
                        }
                    })
                }
            }
        }
    }

    // Projeleri çek (Satışa aktarırken sormak için)
    let projects: any[] = []
    let units: any[] = []
    if (profile?.tenant_id) {
        const { data: pData } = await supabase
            .from('projects')
            .select('id, name')
            .eq('tenant_id', profile.tenant_id)
            .eq('status', 'Active')
            .order('name')
        if (pData) projects = pData

        const { data: uData } = await supabase
            .from('units')
            .select('id, unit_number, project_id, price, currency')
            .eq('tenant_id', profile.tenant_id)
            .in('status', ['Available', 'Müsait'])
            .order('unit_number')
        if (uData) units = uData

        const { data: profData } = await supabase
            .from('profiles')
            .select('id, full_name')
            .eq('tenant_id', profile.tenant_id)
            .order('full_name')
        if (profData) tenantProfiles = profData
    }

    return (
        <div className="flex flex-col h-[calc(100vh-4.5rem)] gap-2">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-lg md:text-xl font-bold tracking-tight">Ön Değerlendirme (Lead Qualification)</h1>
                    <p className="text-xs text-muted-foreground">Potansiyel müşterileri satış hunisine (CRM) girmeden önce filtreleyin ve arama sonuçlarını girin.</p>
                </div>
                <div className="flex items-center gap-2">
                    <NewQualificationModal projects={projects} />
                </div>
            </div>
            
            <div className="flex-1 min-h-0">
                <QualificationBoard 
                    initialData={qualifications} 
                    totalCount={totalCount} 
                    currentPage={page} 
                    pageSize={pageSize}
                    statusCounts={statusCounts}
                    projects={projects} 
                    availableUnits={units}
                    activeTab={activeTab}
                    profiles={tenantProfiles}
                    userRole={profile?.role || 'sales'}
                />
            </div>
        </div>
    )
}
