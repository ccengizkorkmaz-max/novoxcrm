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

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()

    const searchParams = await props.searchParams
    const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page) : 1
    const searchQuery = typeof searchParams.search === 'string' ? searchParams.search : ''
    const statusFilters = typeof searchParams.status === 'string' && searchParams.status ? searchParams.status.split(',') : []
    const activeTab = typeof searchParams.tab === 'string' ? searchParams.tab : 'active'
    const pageSize = 100

    let qualifications: any[] = []
    let totalCount = 0
    let statusCounts: Record<string, number> = {}
    
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
        
        const { count } = await queryCount
        totalCount = count || 0

        // Get exact counts for all statuses
        const statusKeys = ['new', 'contacted', 'follow_up', 'unreachable', 'disqualified', 'qualified']
        const countPromises = statusKeys.map(async (status) => {
            const { count } = await supabase
                .from('lead_qualifications')
                .select('*', { count: 'exact', head: true })
                .eq('tenant_id', profile.tenant_id)
                .eq('status', status)
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
    }

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] gap-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold tracking-tight">Ön Değerlendirme (Lead Qualification)</h1>
                    <p className="text-sm text-muted-foreground">Potansiyel müşterileri satış hunisine (CRM) girmeden önce filtreleyin ve arama sonuçlarını girin.</p>
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
                />
            </div>
        </div>
    )
}
