import { createClient } from '@/lib/supabase/server'
import OptionList from './components/OptionList'
import { getTranslations } from 'next-intl/server'
import { Clock, AlertTriangle, CheckCircle2, Shield } from 'lucide-react'

export default async function OptionsPage(props: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await props.params
    const supabase = await createClient()
    const t = await getTranslations('Options')

    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id).single()
    const isManager = profile?.role === 'manager' || profile?.role === 'admin' || profile?.role === 'owner' || profile?.role === 'crm_manager'

    // Fetch units with status 'Reserved'
    // We join with projects to get project name
    // We try to join with sales to get customer info (since reserved units usually have a reservation sale)
    const { data: options } = await supabase
        .from('units')
        .select(`
            *,
            projects(name),
            sales(
                id,
                status,
                assigned_to,
                customers(full_name),
                reservation_expiry,
                final_price,
                currency
            ),

            offers(
                id,
                status,
                created_at
            )
        `)
        .in('status', ['Reserved', 'Option'])
        .order('created_at', { ascending: false })

    let filteredOptions = options || []
    if (!isManager && user) {
        filteredOptions = filteredOptions.filter((opt: any) =>
            opt.sales && opt.sales.some((sale: any) => sale.assigned_to === user.id)
        )
    }

    // Fetch Payment Plan Templates
    const { data: templates } = await supabase
        .from('payment_plan_templates')
        .select('*')
        .order('name', { ascending: true })

    const totalOptions = filteredOptions.length
    const expiredOptions = filteredOptions.filter((o: any) => {
        const sale = o.sales?.find((s: any) => s.reservation_expiry)
        return sale?.reservation_expiry && new Date(sale.reservation_expiry) < new Date()
    }).length
    const activeOptions = totalOptions - expiredOptions

    return (
        <div className="flex flex-col gap-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-200">
                        <Shield className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900">{t('title')}</h1>
                        <p className="text-sm text-slate-400 font-medium">Aktif opsiyonları ve süreleri yönetin</p>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-100">
                    <div className="h-10 w-10 rounded-xl bg-violet-100 flex items-center justify-center">
                        <Shield className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest">Toplam Opsiyon</p>
                        <p className="text-2xl font-black text-violet-700">{totalOptions}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-100">
                    <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Aktif</p>
                        <p className="text-2xl font-black text-emerald-700">{activeOptions}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-red-50 to-orange-50 border border-red-100">
                    <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Süresi Dolmuş</p>
                        <p className="text-2xl font-black text-red-600">{expiredOptions}</p>
                    </div>
                </div>
            </div>

            <OptionList options={filteredOptions} templates={templates || []} />
        </div>
    )

}
