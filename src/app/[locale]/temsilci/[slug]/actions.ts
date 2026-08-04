'use server'

import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const CORRECT_PASSWORD = 'Novox2026!'

export async function getProfileBySlug(slug: string) {
    const { data } = await supabase
        .from('profiles')
        .select('id, full_name, role, agent_slug')
        .eq('agent_slug', slug)
        .single()
    
    return data
}

export async function checkAuth(slug: string) {
    const cookieStore = await cookies()
    const authCookie = cookieStore.get(`temsilci_auth_${slug}`)
    return authCookie?.value === 'true'
}

export async function authenticate(slug: string, password: string) {
    if (password === CORRECT_PASSWORD) {
        const cookieStore = await cookies()
        cookieStore.set(`temsilci_auth_${slug}`, 'true', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: '/'
        })
        return { success: true }
    }
    return { success: false, error: 'Hatalı şifre' }
}

export async function logout(slug: string) {
    const cookieStore = await cookies()
    cookieStore.delete(`temsilci_auth_${slug}`)
    return { success: true }
}

export async function getAgentLeads(slug: string) {
    try {
        const isAuthed = await checkAuth(slug)
        if (!isAuthed) return { success: false, error: 'Unauthorized' }

        const profile = await getProfileBySlug(slug)
        if (!profile) return { success: false, error: 'Temsilci bulunamadı' }

        const AGENT_ID = profile.id

        const allItems: any[] = []
        const seenCustomerIds = new Set<string>()
        const seenPhones = new Set<string>()

        // 1. Fetch from lead_qualifications
        const { data: qualsData } = await supabase
            .from('lead_qualifications')
            .select(`
                id,
                status,
                interest_level,
                interest_level_source,
                created_at,
                updated_at,
                call_notes,
                customer_id,
                customers ( id, full_name, phone, email, notes ),
                projects:project_id ( id, name )
            `)
            .eq('assigned_to', AGENT_ID)
            .order('updated_at', { ascending: false })
            .limit(200)

        if (qualsData) {
            for (const rawQ of qualsData) {
                const q: any = rawQ
                const cust: any = Array.isArray(q.customers) ? q.customers[0] : q.customers
                const proj: any = Array.isArray(q.projects) ? q.projects[0] : q.projects

                const phoneClean = (cust?.phone || '').replace(/\D/g, '').slice(-10)
                if (cust?.id) seenCustomerIds.add(cust.id)
                if (phoneClean) seenPhones.add(phoneClean)

                allItems.push({
                    id: q.id,
                    qualificationId: q.id,
                    converted_customer_id: q.customer_id,
                    full_name: cust?.full_name || 'Müşteri Adayı',
                    phone: cust?.phone || '',
                    email: cust?.email || '',
                    status: q.status || 'new',
                    lead_score: q.interest_level || 'warm',
                    lead_score_source: q.interest_level_source || 'ai',
                    created_at: q.created_at,
                    updated_at: q.updated_at || q.created_at,
                    notes: q.call_notes || cust?.notes || '',
                    projects: proj
                })
            }
        }

        // 2. Fetch from leads
        const { data: leadsData } = await supabase
            .from('leads')
            .select(`
                id,
                full_name,
                phone,
                email,
                status,
                sub_status,
                lead_score,
                lead_score_source,
                created_at,
                updated_at,
                notes,
                projects:project_id ( id, name ),
                converted_customer_id
            `)
            .eq('assigned_to', AGENT_ID)
            .order('updated_at', { ascending: false })
            .limit(100)

        if (leadsData) {
            for (const rawL of leadsData) {
                const l: any = rawL
                const proj: any = Array.isArray(l.projects) ? l.projects[0] : l.projects
                const phoneClean = (l.phone || '').replace(/\D/g, '').slice(-10)
                
                if (phoneClean && seenPhones.has(phoneClean)) continue
                if (l.converted_customer_id && seenCustomerIds.has(l.converted_customer_id)) continue

                if (phoneClean) seenPhones.add(phoneClean)
                if (l.converted_customer_id) seenCustomerIds.add(l.converted_customer_id)

                allItems.push({
                    id: l.id,
                    leadId: l.id,
                    converted_customer_id: l.converted_customer_id,
                    full_name: l.full_name || 'Aday Müşteri',
                    phone: l.phone || '',
                    email: l.email || '',
                    status: l.status || 'new',
                    lead_score: l.lead_score || 'warm',
                    lead_score_source: l.lead_score_source || 'ai',
                    created_at: l.created_at,
                    updated_at: l.updated_at || l.created_at,
                    notes: l.notes || '',
                    projects: proj
                })
            }
        }

        const sortedLeads = allItems.sort((a, b) => {
            const timeA = new Date(a.updated_at || a.created_at).getTime()
            const timeB = new Date(b.updated_at || b.created_at).getTime()
            return timeB - timeA
        })

        return { success: true, leads: sortedLeads }
    } catch (err: any) {
        console.error('getAgentLeads error:', err)
        return { success: false, error: err.message || 'Veri çekilemedi' }
    }
}
