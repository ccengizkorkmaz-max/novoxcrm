import { getCommissionModel, getCommissionTiers, getCommissionUnitRules } from '@/app/broker/actions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Building2, BadgePercent, CreditCard, Layers, Clock } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ModelActionsButton from './components/ModelActionsButton'
import TierManager from './components/TierManager'
import UnitRuleManager from './components/UnitRuleManager'
import { BackButton } from '@/components/back-button'

export default async function CommissionModelDetailsPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params
    const result = await getCommissionModel(params.id)

    // Debug Error UI
    if (!result?.success || !result.data) {
        return (
            <div className="p-8 text-center space-y-4">
                <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
                    <h2 className="font-bold text-lg">Hata: Model Bulunamadı veya Erişim Engellendi</h2>
                    <p>Sunucu Mesajı: {result?.error || 'Bilinmeyen Hata'}</p>
                    {result?.code && <p className="font-mono text-sm mt-2">Hata Kodu: {result.code}</p>}
                    <p className="text-xs text-muted-foreground mt-4">Lütfen RLS kurallarının doğru uygulandığından emin olun.</p>
                </div>
                <Link href="/admin/broker-leads/commission-settings">
                    <Button variant="outline">Listeye Dön</Button>
                </Link>
            </div>
        )
    }

    const model = result.data
    const tiers = await getCommissionTiers(params.id)
    const unitRules = await getCommissionUnitRules(params.id)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <BackButton variant="ghost" className="h-10 w-10 p-0 rounded-full" label="" />
                    <div>
                        <h1 className="text-2xl font-bold">{model.name}</h1>
                        <p className="text-muted-foreground">Model detayları ve yapılandırma.</p>
                    </div>
                </div>

                <ModelActionsButton modelId={model.id} modelName={model.name} />
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                            <Building2 className="h-4 w-4" />
                            İlişkili Proje
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold">{model.projects?.name || 'Tüm Projeler'}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                            <BadgePercent className="h-4 w-4" />
                            Model Tipi
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold">{model.type}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                            <CreditCard className="h-4 w-4" />
                            {model.type === 'Tiered' ? 'Baz Oranı' : 'Standart Oran'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold">{model.value.toLocaleString('tr-TR')} {model.currency}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <div className="lg:col-span-2">
                        {model.type.includes('Unit Based') ? (
                            <UnitRuleManager
                                modelId={model.id}
                                initialRules={unitRules || []}
                                modelType={model.type}
                                currency={model.currency}
                            />
                        ) : (
                            <TierManager
                                modelId={model.id}
                                initialTiers={tiers || []}
                                isTiered={model.type === 'Tiered'}
                                modelType={model.type}
                                currency={model.currency}
                            />
                        )}
                    </div>
                </div>

                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle className="text-md flex items-center gap-2">
                            <Clock className="h-5 w-5 text-blue-600" />
                            Süreç Koşulları
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground uppercase font-bold">Ödeme Aşaması</p>
                            <p className="text-sm font-medium">{model.payable_stage}</p>
                        </div>
                        <div className="space-y-1 border-t pt-4">
                            <p className="text-xs text-muted-foreground uppercase font-bold">Vergi/Yasal Durum</p>
                            <p className="text-sm font-medium">{model.payment_terms}</p>
                        </div>
                        <div className="space-y-1 border-t pt-4">
                            <p className="text-xs text-muted-foreground uppercase font-bold">Oluşturulma Tarihi</p>
                            <p className="text-sm font-medium">
                                {new Date(model.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
