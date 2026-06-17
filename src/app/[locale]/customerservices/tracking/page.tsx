import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, CheckCircle2, Circle, Clock, MapPin, Key } from "lucide-react"
import { getTranslations } from 'next-intl/server'

export default async function PortalTracking(props: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await props.params
    const supabase = await createClient()
    const t = await getTranslations('PortalTracking')
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
                id,
                unit_number,
                projects(name)
            )
        `)
        .eq('contract_customers.customer_id', profile?.customer_id)

    // Get delivery appointments
    const { data: appointments } = await supabase
        .from('delivery_appointments')
        .select('*')
        .eq('customer_id', profile?.customer_id)
        .order('appointment_date', { ascending: false })

    const translateDeliveryStatus = (status: string) => {
        const map: Record<string, string> = {
            'Pending': t('status.pending'),
            'In Progress': t('status.preparing'),
            'Ready': t('status.readyForDelivery'),
            'Delivered': t('status.delivered')
        }
        return map[status] || t('status.construction')
    }

    const translateTitleDeedStatus = (status: string) => {
        const map: Record<string, string> = {
            'Pending': t('status.prepStage'),
            'In Progress': t('status.applied'),
            'Ready': t('status.deedReady'),
            'Handed Over': t('status.deedHandedOver')
        }
        return map[status] || t('status.pending')
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t('title')}</h1>
                <p className="text-slate-500">{t('subtitle')}</p>
            </div>

            {contracts?.map((contract) => {
                const unitAppointment = appointments?.find(app => app.unit_id === contract.unit?.id)

                return (
                    <div key={contract.id} className="grid gap-6 lg:grid-cols-3">
                        <div className="space-y-6 lg:col-span-1">
                            <Card className="border-none shadow-sm h-fit">
                                <CardHeader>
                                    <CardTitle className="text-lg">{t('propertyInfo')}</CardTitle>
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
                                            <span className="text-slate-500">{t('contractNo')}</span>
                                            <span className="font-medium">{contract.contract_number}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">{t('deliveryStatus')}</span>
                                            <Badge variant="outline" className="text-blue-600 border-blue-100 bg-blue-50">
                                                {translateDeliveryStatus(contract.delivery_status)}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {unitAppointment && (
                                <Card className="border-none shadow-sm bg-blue-50/20 border border-blue-50/50">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base text-blue-900 font-semibold flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-blue-600" />
                                            Teslimat Randevusu
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3 text-xs text-blue-950">
                                        <div className="flex justify-between">
                                            <span className="text-slate-500 font-medium">Randevu Tarihi:</span>
                                            <span className="font-bold">
                                                {new Date(unitAppointment.appointment_date).toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-US', {
                                                    dateStyle: 'medium',
                                                    timeStyle: 'short'
                                                })}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500 font-medium">Randevu Durumu:</span>
                                            <span className="font-bold text-blue-700">
                                                {unitAppointment.status === 'Completed' ? 'Teslim Edildi' :
                                                 unitAppointment.status === 'Cancelled' ? 'İptal Edildi' :
                                                 unitAppointment.status === 'No Show' ? 'Katılım Sağlanmadı' : 'Planlandı'}
                                            </span>
                                        </div>

                                        {unitAppointment.initial_meter_readings && Object.keys(unitAppointment.initial_meter_readings).length > 0 && (
                                            <div className="border-t border-blue-100/50 pt-2 space-y-1">
                                                <p className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">İlk Sayaç Okumaları</p>
                                                {unitAppointment.initial_meter_readings.water && (
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-500">Su:</span>
                                                        <span className="font-semibold">{unitAppointment.initial_meter_readings.water} m³</span>
                                                    </div>
                                                )}
                                                {unitAppointment.initial_meter_readings.electricity && (
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-500">Elektrik:</span>
                                                        <span className="font-semibold">{unitAppointment.initial_meter_readings.electricity} kWh</span>
                                                    </div>
                                                )}
                                                {unitAppointment.initial_meter_readings.gas && (
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-500">Doğalgaz:</span>
                                                        <span className="font-semibold">{unitAppointment.initial_meter_readings.gas} m³</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {unitAppointment.notes && (
                                            <div className="border-t border-blue-100/50 pt-2 text-[11px] text-slate-600 italic">
                                                &ldquo;{unitAppointment.notes}&rdquo;
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                    <Card className="lg:col-span-2 border-none shadow-sm">
                        <CardHeader>
                            <CardTitle>{t('processFlow')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:bg-slate-200">
                                {/* Step 1: Contract Signed */}
                                <div className="relative flex items-start gap-6">
                                    <div className="z-10 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white border-4 border-white">
                                        <CheckCircle2 className="h-6 w-6" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-900">{t('steps.contractSigned')}</span>
                                        <span className="text-xs text-slate-500">{t('steps.contractSignedDesc')}</span>
                                        <span className="mt-1 text-xs font-medium text-emerald-600">
                                            {new Date(contract.contract_date).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US')}
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
                                            {t('steps.titleDeed')}
                                        </span>
                                        <span className="text-xs text-slate-500">{t('steps.titleDeedDesc')}</span>
                                        <Badge className="mt-1 w-fit bg-slate-100 text-slate-600 hover:bg-slate-100 border-none">
                                            {translateTitleDeedStatus(contract.title_deed_status)}
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
                                            {t('steps.delivery')}
                                        </span>
                                        <span className="text-xs text-slate-500">{t('steps.deliveryDesc')}</span>
                                        <Badge className="mt-1 w-fit bg-slate-100 text-slate-600 hover:bg-slate-100 border-none">
                                            {translateDeliveryStatus(contract.delivery_status)}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )})}

            {(!contracts || contracts.length === 0) && (
                <div className="h-64 flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed text-slate-400">
                    <Building2 className="h-12 w-12 mb-2 opacity-20" />
                    <p>{t('empty')}</p>
                </div>
            )}
        </div>
    )
}
