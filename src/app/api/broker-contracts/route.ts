import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        
        const { data: profile } = await supabase
            .from('profiles')
            .select('tenant_id')
            .eq('id', user.id)
            .single()
        
        if (!profile?.tenant_id) return NextResponse.json({ error: 'No tenant' }, { status: 400 })
        
        const formData = await request.formData()
        
        const contract = {
            tenant_id: profile.tenant_id,
            contract_type: formData.get('contract_type') as string || 'authorization',
            customer_id: (formData.get('customer_id') as string) || null,
            portfolio_id: (formData.get('portfolio_id') as string) || null,
            title: (formData.get('title') as string)?.trim() || 'Sözleşme',
            start_date: (formData.get('start_date') as string) || null,
            end_date: (formData.get('end_date') as string) || null,
            amount: formData.get('amount') ? Number(formData.get('amount')) : null,
            commission_rate: formData.get('commission_rate') ? Number(formData.get('commission_rate')) : null,
            commission_amount: null as number | null,
            currency: (formData.get('currency') as string) || 'TRY',
            status: 'draft',
            notes: (formData.get('notes') as string)?.trim() || null,
            created_by: user.id,
        }
        
        // Auto-calculate commission amount
        if (contract.amount && contract.commission_rate) {
            contract.commission_amount = contract.amount * (contract.commission_rate / 100)
        }
        
        const { data, error } = await supabase
            .from('broker_contracts')
            .insert(contract)
            .select()
            .single()
        
        if (error) {
            console.error('Contract create error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }
        
        return NextResponse.json(data)
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function GET() {
    try {
        const supabase = await createClient()
        
        const { data, error } = await supabase
            .from('broker_contracts')
            .select('*, customer:customers(full_name, phone), portfolio:portfolios(title)')
            .order('created_at', { ascending: false })
        
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json(data || [])
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
