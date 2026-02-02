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
import { getTranslations } from 'next-intl/server'

export default async function CommissionModelDetailsPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params
    const result = await getCommissionModel(params.id)
    const t = await getTranslations('CommissionSettings')

    // Debug Error UI
    if (!result?.success || !result.data) {
        return (
            <div className="p-8 text-center space-y-4">
                <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
                    <h2 className="font-bold text-lg">{t('detail.errorTitle')}</h2>
                    <p>{t('detail.serverMessage')}: {result?.error || 'Bilinmeyen Hata'}</p>
                    {result?.code && <p className="font-mono text-sm mt-2">{t('detail.errorCode')}: {result.code}</p>}
                    <p className="text-xs text-muted-foreground mt-4">{t('detail.rlsHint')}</p>
                </div>
                <Link href="/admin/broker-leads/commission-settings">
                    <Button variant="outline">{t('detail.backToList')}</Button>
                </Link>
            </div>
        )
    }

    const model = result.data
    const tiers = await getCommissionTiers(params.id)
    const unitRules = await getCommissionUnitRules(params.id)

    // Helper to translate values safely
    const translateType = (type: string) => {
        try {
            return t(`types.${type}`)
        } catch {
            return type
        }
    }

    const translateStage = (stage: string) => {
        try {
            return t(`paymentStages.${stage}`)
        } catch {
            return stage
        }
    }

    const translateTerms = (term: string) => {
        try {
            return t(`terms.${term}`)
        } catch {
            return term
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <BackButton variant="ghost" className="h-10 w-10 p-0 rounded-full" label="" />
                    <div>
                        <h1 className="text-2xl font-bold">{model.name}</h1>
                        <p className="text-muted-foreground">{t('detail.description')}</p>
                    </div>
                </div>

                <ModelActionsButton modelId={model.id} modelName={model.name} />
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                            <Building2 className="h-4 w-4" />
                            {t('detail.relatedProject')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold">{model.projects?.name || t('table.allProjects')}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                            <BadgePercent className="h-4 w-4" />
                            {t('detail.modelType')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold">{translateType(model.type)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                            <CreditCard className="h-4 w-4" />
                            {model.type === 'Tiered' ? t('detail.baseRate') : t('detail.standardRate')}
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
                            {t('detail.processConditions')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground uppercase font-bold">{t('detail.paymentStage')}</p>
                            <p className="text-sm font-medium">{translateStage(model.payable_stage)}</p>
                        </div>
                        <div className="space-y-1 border-t pt-4">
                            <p className="text-xs text-muted-foreground uppercase font-bold">{t('detail.taxStatus')}</p>
                            <p className="text-sm font-medium">{translateTerms(model.payment_terms)}</p>
                        </div>
                        <div className="space-y-1 border-t pt-4">
                            <p className="text-xs text-muted-foreground uppercase font-bold">{t('detail.createdDate')}</p>
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
