import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'
import EmployeeList from '@/app/[locale]/(dashboard)/hr/components/EmployeeList'
import React from 'react'

export default async function HRPage(props: {
    params: Promise<{ locale: string }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { locale } = await props.params
    const searchParams = await props.searchParams
    const t = await getTranslations('HR')
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect(`/${locale}/login`)
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'owner' && profile?.role !== 'admin' && profile?.role !== 'crm_manager') {
        redirect(`/${locale}/dashboard`)
    }

    const filterSearch = searchParams.q as string

    // 1. Build Base Query
    let query = supabase
        .from('employees')
        .select('*', { count: 'exact' })

    if (filterSearch) {
        query = query.or(`first_name.ilike.%${filterSearch}%,last_name.ilike.%${filterSearch}%,email.ilike.%${filterSearch}%,sicil_no.ilike.%${filterSearch}%`)
    }

    const page = Number(searchParams.page) || 1
    const itemsPerPage = 50
    const from = (page - 1) * itemsPerPage
    const to = from + itemsPerPage - 1

    const { data: employees, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to)

    if (error) {
        console.error('HR Page DB Error:', error)
        return (
            <div className="p-10 bg-red-50 text-red-900 border border-red-200">
                <h1 className="font-bold text-lg">Veritabanı Hatası</h1>
                <p className="mt-2"><strong>Code:</strong> {error.code}</p>
                <p><strong>Message:</strong> {error.message}</p>
                <p><strong>Details:</strong> {error.details || 'N/A'}</p>
                <p><strong>Hint:</strong> {error.hint || 'N/A'}</p>
                <pre className="text-xs mt-4 bg-red-100 p-4 rounded overflow-auto">{JSON.stringify(error, null, 2)}</pre>
            </div>
        )
    }

    // 2. Fetch stats
    const { data: statsData } = await supabase
        .from('employees')
        .select('status')

    const stats = (statsData || []).reduce((acc: any, emp: any) => {
        acc.total++
        if (emp.status === 'Active') acc.active++
        else acc.passive++
        return acc
    }, { total: 0, active: 0, passive: 0 })

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
                    <p className="text-muted-foreground">{t('description')}</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border bg-card p-6 shadow-sm">
                    <p className="text-sm font-medium text-muted-foreground">{t('stats.total')}</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <div className="rounded-xl border bg-card p-6 shadow-sm">
                    <p className="text-sm font-medium text-green-600">{t('stats.active')}</p>
                    <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
                <div className="rounded-xl border bg-card p-6 shadow-sm">
                    <p className="text-sm font-medium text-muted-foreground">{t('stats.passive')}</p>
                    <p className="text-2xl font-bold">{stats.passive}</p>
                </div>
            </div>

            <div className="rounded-md border bg-card p-6 shadow-sm">
                <React.Suspense fallback={<div className="h-64 w-full bg-gray-100 animate-pulse rounded" />}>
                    <EmployeeList
                        employees={employees || []}
                        totalRecords={count || 0}
                        initialPage={page}
                    />
                </React.Suspense>
            </div>
        </div>
    )
}
