import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ContractDetail } from './components/ContractDetail'

export default async function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: contract } = await supabase
        .from('broker_contracts')
        .select('*, customer:customers(id, full_name, phone, email, contact_type), portfolio:portfolios(id, title, listing_type, price, currency, city, district)')
        .eq('id', id)
        .single()

    if (!contract) notFound()

    // Get documents
    let documents: any[] = []
    try {
        const { data } = await supabase
            .from('contract_documents')
            .select('*')
            .eq('contract_id', id)
            .order('created_at', { ascending: false })
        documents = data || []
    } catch { /* table may not exist */ }

    // Get customers and portfolios for edit dropdowns
    const { data: customers } = await supabase
        .from('customers')
        .select('id, full_name, contact_type')
        .order('full_name')

    const { data: portfolios } = await supabase
        .from('portfolios')
        .select('id, title, listing_type')
        .order('created_at', { ascending: false })

    return (
        <ContractDetail
            contract={contract}
            documents={documents}
            customers={customers || []}
            portfolios={portfolios || []}
        />
    )
}
