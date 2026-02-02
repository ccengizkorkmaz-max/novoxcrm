'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormImageUpload } from '@/components/ui/form-image-upload'
import { updateTenantProfile } from '../actions'
import { toast } from 'sonner'

interface TenantProfileFormProps {
    tenant: {
        id: string
        name: string
        logo_url: string | null
        plan_type: string
        user_limit: number
        subscription_end_date: string | null
        country: string | null
    }
    userCount: number
}

import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Calendar, Users, ShieldCheck } from "lucide-react"
import { useTranslations, useLocale } from 'next-intl'

export default function TenantProfileForm({ tenant, userCount }: TenantProfileFormProps) {
    const t = useTranslations('Settings')
    const locale = useLocale()
    const [isPending, setIsPending] = useState(false)

    return (
        <form
            action={async (formData) => {
                setIsPending(true)
                try {
                    const res = await updateTenantProfile(formData)
                    if (res?.error) {
                        toast.error(res.error)
                    } else {
                        toast.success(t('profile.success'))
                    }
                } catch (e: any) {
                    toast.error(t('profile.error') + e.message)
                } finally {
                    setIsPending(false)
                }
            }}
            className="space-y-6"
        >
            <div className="space-y-2">
                <Label htmlFor="name">{t('profile.name')}</Label>
                <Input
                    id="name"
                    name="name"
                    defaultValue={tenant.name}
                    placeholder={t('profile.namePlaceholder')}
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="country">Ülke</Label>
                <select
                    id="country"
                    name="country"
                    defaultValue={tenant.country || 'Türkiye'}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                >
                    <option value="Türkiye">Türkiye</option>
                    <option value="UK">United Kingdom</option>
                    <option value="USA">United States</option>
                    <option value="Germany">Germany</option>
                </select>
            </div>

            <div className="space-y-2">
                <Label>{t('profile.logo')}</Label>
                <FormImageUpload
                    name="logo_url"
                    defaultValue={tenant.logo_url || ''}
                />
                <p className="text-xs text-muted-foreground">
                    {t('profile.logoNote')}
                </p>
            </div>

            <div className="pt-6 border-t">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-blue-600" />
                    {t('profile.license')}
                </h3>
                <div className="grid gap-6 md:grid-cols-3 mb-6">
                    <div className="p-4 rounded-xl border bg-slate-50/50">
                        <div className="flex items-center gap-3 mb-2">
                            <CreditCard className="h-4 w-4 text-slate-500" />
                            <span className="text-sm font-medium text-slate-600">{t('profile.plan')}</span>
                        </div>
                        <Badge variant="outline" className="text-md border-blue-200 bg-blue-50 text-blue-700">
                            {tenant.plan_type}
                        </Badge>
                    </div>

                    <div className="p-4 rounded-xl border bg-slate-50/50">
                        <div className="flex items-center gap-3 mb-2">
                            <Calendar className="h-4 w-4 text-slate-500" />
                            <span className="text-sm font-medium text-slate-600">{t('profile.expiry')}</span>
                        </div>
                        <span className="font-semibold">
                            {tenant.subscription_end_date
                                ? new Date(tenant.subscription_end_date).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
                                : t('profile.unlimited')
                            }
                        </span>
                    </div>

                    <div className="p-4 rounded-xl border bg-slate-50/50">
                        <div className="flex items-center gap-3 mb-2">
                            <Users className="h-4 w-4 text-slate-500" />
                            <span className="text-sm font-medium text-slate-600">{t('profile.capacity')}</span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-bold">{userCount} / {tenant.user_limit}</span>
                                <span>%{Math.round((userCount / tenant.user_limit) * 100)}</span>
                            </div>
                            <Progress value={(userCount / tenant.user_limit) * 100} className="h-1.5" />
                        </div>
                    </div>
                </div>
            </div>

            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isPending}>
                {isPending ? t('profile.saving') : t('profile.save')}
            </Button>
        </form>
    )
}
