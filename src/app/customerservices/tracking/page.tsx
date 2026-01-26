import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, CheckCircle2, Circle, Clock, MapPin, Key } from "lucide-react"

export default async function PortalTracking() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Get customer profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('customer_id')
        .eq('id', user?.id)
        .single()

    // Get contracts with delivery info via contract_customers link
    const { data: contracts } = await supabase
        .from('contracts')
        .select(`
            *,
            contract_customers!inner(customer_id),
            unit: units(
                unit_number,
                projects(name)
            )
        `)
        .eq('contract_customers.customer_id', profile?.customer_id)

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tapu & Teslimat Takibi</h1>
                <p className="text-slate-500">Mülkünüzün yasal ve fiziksel teslim süreçlerini buradan izleyebilirsiniz.</p>
            </div>

            {contracts?.map((contract) => (
                <div key={contract.id} className="grid gap-6 lg:grid-cols-3">
                    <Card className="lg:col-span-1 border-none shadow-sm h-fit">
                        <CardHeader>
                            <CardTitle className="text-lg">Mülk Bilgisi</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                                    <Building2 className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-semibold">{contract.unit?.projects?.name}</p>
                                    <p className="text-xs text-slate-500">No: {contract.unit?.unit_number}</p>
                                </div>
                            </div>
                            <div className="pt-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Sözleşme No</span>
                                    <span className="font-medium">{contract.contract_number}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Teslimat Durumu</span>
                                    <Badge variant="outline" className="text-blue-600 border-blue-100 bg-blue-50">
                                        {translateDeliveryStatus(contract.delivery_status)}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-2 border-none shadow-sm">
                        <CardHeader>
                            <CardTitle>Süreç Akışı</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:bg-slate-200">
                                {/* Step 1: Contract Signed */}
                                <div className="relative flex items-start gap-6">
                                    <div className="z-10 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white border-4 border-white">
                                        <CheckCircle2 className="h-6 w-6" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-900">Sözleşme İmzalandı</span>
                                        <span className="text-xs text-slate-500">Süreç başarıyla başlatıldı.</span>
                                        <span className="mt-1 text-xs font-medium text-emerald-600">
                                            {new Date(contract.contract_date).toLocaleDateString('tr-TR')}
                                        </span>
                                    </div>
                                </div>

                                {/* Step 2: Title Deed Process */}
                                <div className="relative flex items-start gap-6">
                                    <div className={`z-10 flex h-10 w-10 items-center justify-center rounded-full border-4 border-white ${contract.title_deed_status === 'Handed Over' ? 'bg-emerald-500 text-white' :
                                        contract.title_deed_status === 'In Progress' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-200 text-slate-400'
                                        }`}>
                                        <MapPin className="h-5 w-5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={`font-bold ${contract.title_deed_status === 'Pending' ? 'text-slate-400' : 'text-slate-900'}`}>
                                            Tapu İşlemleri
                                        </span>
                                        <span className="text-xs text-slate-500">Yasal mülkiyet devri süreci.</span>
                                        <Badge className="mt-1 w-fit bg-slate-100 text-slate-600 hover:bg-slate-100 border-none">
                                            {contract.title_deed_status === 'In Progress' ? 'İşlemde' : contract.title_deed_status === 'Handed Over' ? 'Tamamlandı' : 'Beklemede'}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Step 3: Physical Delivery */}
                                <div className="relative flex items-start gap-6">
                                    <div className={`z-10 flex h-10 w-10 items-center justify-center rounded-full border-4 border-white ${contract.delivery_status === 'Delivered' ? 'bg-emerald-500 text-white' :
                                        contract.delivery_status === 'Ready' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'
                                        }`}>
                                        <Key className="h-5 w-5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={`font-bold ${contract.delivery_status === 'Pending' ? 'text-slate-400' : 'text-slate-900'}`}>
                                            Anahtar Teslimi
                                        </span>
                                        <span className="text-xs text-slate-500">Fiziksel teslimat ve teknik kontrol.</span>
                                        <Badge className="mt-1 w-fit bg-slate-100 text-slate-600 hover:bg-slate-100 border-none">
                                            {contract.delivery_status === 'Ready' ? 'Hazır' : contract.delivery_status === 'Delivered' ? 'Teslim Edildi' : 'İnşaat Sürüyor'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ))}

            {(!contracts || contracts.length === 0) && (
                <div className="h-64 flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed text-slate-400">
                    <Building2 className="h-12 w-12 mb-2 opacity-20" />
                    <p>Henüz takibi yapılacak bir mülkünüz bulunmuyor.</p>
                </div>
            )}
        </div>
    )
}

function translateDeliveryStatus(status: string) {
    const map: Record<string, string> = {
        'Pending': 'Beklemede',
        'In Progress': 'Hazırlanıyor',
        'Ready': 'Teslime Hazır',
        'Delivered': 'Teslim Edildi'
    }
    return map[status] || 'İnşaat Sürüyor'
}

function translateTitleDeedStatus(status: string) {
    const map: Record<string, string> = {
        'Pending': 'Hazırlık Aşamasında',
        'In Progress': 'Başvuru Yapıldı',
        'Ready': 'Tapu Hazır',
        'Handed Over': 'Tapu Teslim Edildi'
    }
    return map[status] || 'Beklemede'
}
