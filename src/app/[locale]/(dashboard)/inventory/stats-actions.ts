import { SupabaseClient } from '@supabase/supabase-js'

// --- Stock Aging Report ---
export async function getStockAgingReport(supabase: SupabaseClient) {

    const { data: units } = await supabase
        .from('units')
        .select('id, unit_number, block, type, price, currency, status, area_gross, created_at, listed_at, project_id, projects(name)')
        .eq('status', 'For Sale')
        .order('created_at', { ascending: true })

    if (!units) return []

    const now = new Date()
    return units.map((unit: any) => {
        const listedDate = new Date(unit.listed_at || unit.created_at)
        const daysOnMarket = Math.floor((now.getTime() - listedDate.getTime()) / (1000 * 60 * 60 * 24))

        let agingBucket: string
        if (daysOnMarket <= 30) agingBucket = '0-30 gün'
        else if (daysOnMarket <= 60) agingBucket = '31-60 gün'
        else if (daysOnMarket <= 90) agingBucket = '61-90 gün'
        else if (daysOnMarket <= 180) agingBucket = '91-180 gün'
        else agingBucket = '180+ gün'

        const pricePerM2 = unit.area_gross ? Math.round(unit.price / unit.area_gross) : null

        return {
            ...unit,
            projectName: unit.projects?.name,
            daysOnMarket,
            agingBucket,
            pricePerM2,
            listedDate: listedDate.toISOString()
        }
    })
}

// --- Sales Velocity & Stock Depletion Report ---
export async function getSalesVelocityReport(supabase: SupabaseClient) {

    // Get all projects
    const { data: projects } = await supabase.from('projects').select('id, name')
    if (!projects) return []

    const results = []

    for (const project of projects) {
        // Get total units for this project
        const { count: totalUnits } = await supabase
            .from('units')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', project.id)

        // Get available (For Sale) units
        const { count: availableUnits } = await supabase
            .from('units')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', project.id)
            .eq('status', 'For Sale')

        // Get sold units count
        const { count: soldUnits } = await supabase
            .from('units')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', project.id)
            .in('status', ['Sold', 'Delivered'])

        // Get sold units with dates to calculate velocity
        const { data: salesData } = await supabase
            .from('sales')
            .select('created_at, unit_id, units!inner(project_id)')
            .eq('units.project_id', project.id)
            .in('status', ['Sold', 'Contract Signed', 'Delivered'])
            .order('created_at', { ascending: true })

        // Calculate monthly sales velocity (last 6 months)
        const sixMonthsAgo = new Date()
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

        const recentSales = (salesData || []).filter(s => new Date(s.created_at) >= sixMonthsAgo)
        const monthlyVelocity = recentSales.length > 0 ? recentSales.length / 6 : 0

        // Estimate depletion
        const estimatedMonthsToDepletion = monthlyVelocity > 0 && (availableUnits || 0) > 0
            ? Math.round((availableUnits || 0) / monthlyVelocity)
            : null

        // Get average prices
        const { data: priceData } = await supabase
            .from('units')
            .select('price')
            .eq('project_id', project.id)
            .eq('status', 'For Sale')

        const avgPrice = priceData && priceData.length > 0
            ? Math.round(priceData.reduce((sum: number, u: any) => sum + (u.price || 0), 0) / priceData.length)
            : 0

        const totalStockValue = priceData
            ? priceData.reduce((sum: number, u: any) => sum + (u.price || 0), 0)
            : 0

        // Monthly breakdown (last 6 months)
        const monthlyBreakdown: { month: string; count: number }[] = []
        for (let i = 5; i >= 0; i--) {
            const date = new Date()
            date.setMonth(date.getMonth() - i)
            const month = date.toLocaleString('tr-TR', { month: 'short', year: 'numeric' })
            const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
            const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)

            const count = (salesData || []).filter(s => {
                const d = new Date(s.created_at)
                return d >= monthStart && d <= monthEnd
            }).length

            monthlyBreakdown.push({ month, count })
        }

        results.push({
            projectId: project.id,
            projectName: project.name,
            totalUnits: totalUnits || 0,
            availableUnits: availableUnits || 0,
            soldUnits: soldUnits || 0,
            occupancyRate: totalUnits ? Math.round(((soldUnits || 0) / totalUnits) * 100) : 0,
            monthlyVelocity: Math.round(monthlyVelocity * 10) / 10,
            estimatedMonthsToDepletion,
            avgPrice,
            totalStockValue,
            monthlyBreakdown
        })
    }

    return results
}
