import { getCommissionModels } from '@/app/broker/actions'
import CommissionPlansClient from '../../components/CommissionPlansClient'
import { BadgeTurkishLira } from 'lucide-react'

export default async function CommissionPlansPage() {
    const models = await getCommissionModels()

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const activeModels = models.filter((m: any) => {
        if (m.status === 'Archived') return false
        if (m.end_date) {
            const end = new Date(m.end_date)
            if (end < today) return false
        }
        return true
    })

    return (
        <div className="space-y-8 pb-12 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                            <BadgeTurkishLira className="h-6 w-6" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">Komisyon Planları</h1>
                    </div>
                    <p className="text-slate-500 text-sm font-medium">
                        Projeler bazında tanımlanmış güncel komisyon modellerini ve hak ediş şartlarını buradan inceleyebilirsiniz.
                    </p>
                </div>
            </div>

            <CommissionPlansClient initialModels={activeModels} />
        </div>
    )
}
