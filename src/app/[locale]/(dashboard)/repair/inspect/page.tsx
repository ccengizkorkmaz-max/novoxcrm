
import { createClient } from '@/lib/supabase/server'

export default async function InspectPage(props: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await props.params
    const supabase = await createClient()
    const contractNumber = 'SZL-20260206-841'

    // 1. Get Contract
    const { data: contract } = await supabase
        .from('contracts')
        .select('*')
        .eq('contract_number', contractNumber)
        .single()

    let unit = null
    let sales = []
    let paymentPlans = []
    let transactions = []
    let transactionsByUnit = []

    if (contract) {
        // 2. Get Unit
        if (contract.unit_id) {
            const { data: u } = await supabase.from('units').select('*').eq('id', contract.unit_id).single()
            unit = u
        }

        // 3. Get Payment Plans
        const { data: pp } = await supabase.from('payment_plans').select('*').eq('contract_id', contract.id)
        paymentPlans = pp || []

        // 4. Get Transactions linked to Contract
        const { data: tx } = await supabase.from('finance_transactions').select('*').eq('contract_id', contract.id)
        transactions = tx || []

        // 5. Get Sales linked to Unit
        if (contract.unit_id) {
            const { data: s } = await supabase.from('sales').select('*').eq('unit_id', contract.unit_id)
            sales = s || []

            // 6. Get Transactions linked to Unit directly
            const { data: txu } = await supabase.from('finance_transactions').select('*').eq('unit_id', contract.unit_id)
            transactionsByUnit = txu || []
        }
    }

    return (
        <div className="p-10 space-y-6 font-mono text-sm">
            <h1 className="text-2xl font-bold mb-4">Inspection: {contractNumber}</h1>

            <Section title="1. Contract" data={contract} />
            <Section title="2. Unit (Should be 'For Sale')" data={unit} highlight={unit?.status !== 'For Sale'} />
            <Section title="3. Sales Records (Should be 'Cancelled' or 'Lost')" data={sales}
                highlight={sales.some((s: any) => ['Sold', 'Completed', 'Contract'].includes(s.status))}
            />
            <Section title="4. Payment Plans (Should be 'Cancelled')" data={paymentPlans}
                highlight={paymentPlans.some((p: any) => p.status !== 'Cancelled')}
            />
            <Section title="5. Finance Transactions (Should be Empty or irrelevant)" data={[...transactions, ...transactionsByUnit]} />

        </div>
    )
}

function Section({ title, data, highlight }: { title: string, data: any, highlight?: boolean }) {
    return (
        <div className={`border p-4 rounded ${highlight ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}>
            <h2 className="font-bold mb-2">{title} {highlight && <span className="text-red-600 font-bold">(PROBLEM DETECTED)</span>}</h2>
            <pre className="whitespace-pre-wrap max-h-60 overflow-auto">
                {JSON.stringify(data, null, 2)}
            </pre>
        </div>
    )
}
