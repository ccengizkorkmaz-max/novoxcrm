'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Gift, Target, Calendar, Building2, Loader2, Info } from 'lucide-react'
import { createIncentiveCampaign } from '@/app/broker/actions'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

interface Project {
    id: string
    name: string
}

export default function CampaignForm({ projects, tenantId }: { projects: Project[], tenantId: string }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const t = useTranslations('Campaigns')

    async function handleSubmit(formData: FormData) {
        setLoading(true)

        const data = {
            tenant_id: tenantId,
            project_id: formData.get('project_id') as string,
            name: formData.get('name') as string,
            description: formData.get('description') as string,
            type: formData.get('type') as string,
            bonus_value: Number(formData.get('bonus_value')),
            target_count: formData.get('target_count') ? Number(formData.get('target_count')) : undefined,
            start_date: formData.get('start_date') as string || undefined,
            end_date: formData.get('end_date') as string || undefined,
        }

        if (!data.name || !data.bonus_value) {
            toast.error(t('form.errors.required'))
            setLoading(false)
            return
        }

        const result = await createIncentiveCampaign(data)

        if (result.error) {
            toast.error(result.error)
            setLoading(false)
        } else {
            toast.success(t('form.success'))
            router.push('/admin/broker-leads/campaigns')
        }
    }

    return (
        <div className="max-w-3xl mx-auto pb-12">
            <div className="mb-6">
                <h1 className="text-2xl font-bold">{t('form.title')}</h1>
                <p className="text-muted-foreground">{t('form.description')}</p>
            </div>

            <form action={handleSubmit}>
                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Info className="h-5 w-5 text-blue-600" />
                                {t('form.basicInfo')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">{t('form.name')}</Label>
                                <Input id="name" name="name" placeholder={t('form.namePlaceholder')} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">{t('form.terms')}</Label>
                                <Textarea id="description" name="description" placeholder={t('form.termsPlaceholder')} rows={3} />
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="project_id">{t('form.project')}</Label>
                                    <Select name="project_id">
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('allProjects')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">{t('allProjects')}</SelectItem>
                                            {projects.map(p => (
                                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="type">{t('form.type')}</Label>
                                    <Select name="type" defaultValue="Unit Sales">
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('form.select')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Unit Sales">{t('types.Unit Sales')}</SelectItem>
                                            <SelectItem value="Volume">{t('types.Volume')}</SelectItem>
                                            <SelectItem value="Visits">{t('types.Visits')}</SelectItem>
                                            <SelectItem value="Special">{t('types.Special')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Gift className="h-5 w-5 text-green-600" />
                                {t('form.targetReward')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="bonus_value">{t('form.bonusAmount')}</Label>
                                    <Input id="bonus_value" name="bonus_value" type="number" placeholder="0" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="target_count">{t('form.targetCount')}</Label>
                                    <Input id="target_count" name="target_count" type="number" placeholder={t('form.targetCountPlaceholder')} />
                                </div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="start_date">{t('form.startDate')}</Label>
                                    <Input id="start_date" name="start_date" type="date" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="end_date">{t('form.endDate')}</Label>
                                    <Input id="end_date" name="end_date" type="date" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex items-center justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => router.back()}>{t('form.cancel')}</Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 font-bold px-8" disabled={loading}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : t('form.submit')}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    )
}
