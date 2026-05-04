import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ApiDocsClient from './api-docs-client'

export const metadata = {
    title: 'API Dokümantasyonu | Novo CRM',
    description: 'Novo CRM REST API referans dokümantasyonu',
}

export default async function ApiDocsPage() {
    // Auth check — only logged-in users can see API docs
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    return <ApiDocsClient />
}
