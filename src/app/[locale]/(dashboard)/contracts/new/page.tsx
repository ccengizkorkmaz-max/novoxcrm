import { createClient } from '@/lib/supabase/server'
import { ContractForm } from '@/components/contracts/contract-form'
import { redirect } from 'next/navigation'
import { getPaymentTemplates, seedDefaultPaymentTemplates } from '@/app/[locale]/(dashboard)/contracts/actions'

export default async function NewContractPage(props: {
    params: Promise<{ locale: string }>
    searchParams: Promise<{ offerId?: string, unitId?: string, customerId?: string }>
}) {
    const { locale } = await props.params
    const searchParams = await props.searchParams

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return <div>Tenant Not Found</div>

    // Fetch or seed templates
    let templates = await getPaymentTemplates()
    if (templates.length === 0) {
        await seedDefaultPaymentTemplates()
        templates = await getPaymentTemplates()
    }

    // Fetch offer details if offerId is provided
    let offerData = null
    if (searchParams.offerId) {
        const { data } = await supabase
            .from('offers')
            .select('*, units(*, projects(*)), customers(*), payment_plan')
            .eq('id', searchParams.offerId)
            .single()
        offerData = data

        // Comprehensive Fallback Chain for Payment Plan
        if (offerData) {
            const planSnapshot = offerData.payment_plan
            const hasSnapshot = Array.isArray(planSnapshot) ? planSnapshot.length > 0 : (planSnapshot && Object.keys(planSnapshot).length > 0)

            if (!hasSnapshot) {
                // 1. Try latest negotiation (Approved first, then any)
                const { data: negs } = await supabase
                    .from('offer_negotiations')
                    .select('proposed_payment_plan, status')
                    .eq('offer_id', offerData.id)
                    .order('created_at', { ascending: false })
                    .limit(5)

                const bestNeg = negs?.find(n => n.status === 'Approved') || negs?.[0]
                if (bestNeg?.proposed_payment_plan) {
                    offerData.payment_plan = bestNeg.proposed_payment_plan
                } else {
                    // 2. Try Sale's active plan
                    const { getPaymentPlan } = await import('@/app/[locale]/(dashboard)/crm/actions')
                    if (offerData.sale_id) {
                        offerData.payment_plan = await getPaymentPlan(offerData.sale_id)
                    } else {
                        // Legacy fallback for offers without sale_id column
                        const { data: sale } = await supabase
                            .from('sales')
                            .select('id')
                            .eq('unit_id', offerData.unit_id)
                            .eq('customer_id', offerData.customer_id)
                            .single()
                        if (sale) {
                            offerData.payment_plan = await getPaymentPlan(sale.id)
                        }
                    }
                }
            }
        }
    }

    // Fetch updates dependencies
    const [projects, units, customers, activeReservations, activeOffers] = await Promise.all([
        supabase.from('projects').select('id, name'),
        supabase.from('units')
            .select('id, unit_number, block, project_id, price, currency')
            .neq('status', 'Sold'),
        supabase.from('customers').select('id, full_name, phone').eq('tenant_id', profile.tenant_id),
        supabase.from('sales')
            .select('unit_id, customer:customers(full_name), reservation_expiry')
            .eq('status', 'Reservation'),
        supabase.from('offers')
            .select('unit_id, customer:customers(full_name), valid_until, total_amount, status')
            .in('status', ['Sent', 'Accepted'])
            .order('created_at', { ascending: false })
    ])

    // Ensure the unit from the offer is included in the units list
    // (It might be filtered out if status is not 'For Sale', but for a contract on an accepted offer, it should be available)
    let finalUnits = units.data || []
    if (offerData && offerData.units) {
        const isUnitInList = finalUnits.find((u: any) => u.id === offerData.units.id)
        if (!isUnitInList) {
            // Add the unit from the offer to the list
            finalUnits = [...finalUnits, offerData.units]
        }
    }

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold tracking-tight mb-8">Yeni Sözleşme Oluştur</h1>
            <ContractForm
                projects={projects.data || []}
                units={finalUnits}
                customers={customers.data || []}
                reservations={activeReservations.data || []}
                offers={activeOffers.data || []}
                templates={templates}
                initialOfferId={searchParams.offerId}
                initialUnitId={searchParams.unitId}
                initialCustomerId={searchParams.customerId}
                offerData={offerData}
            />
        </div>
    )
}
