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
    }
    userCount: number
}

import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Calendar, Users, ShieldCheck } from "lucide-react"
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

export default function TenantProfileForm({ tenant, userCount }: TenantProfileFormProps) {
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
                        toast.success('Firma bilgileri güncellendi.')
                    }
                } catch (e: any) {
                    toast.error('Beklenmedik bir hata oluştu: ' + e.message)
                } finally {
                    setIsPending(false)
                }
            }}
            className="space-y-6"
        >
            <div className="space-y-2">
                <Label htmlFor="name">Firma Adı</Label>
                <Input
                    id="name"
                    name="name"
                    defaultValue={tenant.name}
                    placeholder="Örn: ABC Gayrimenkul"
                    required
                />
            </div>

            <div className="space-y-2">
                <Label>Firma Logosu</Label>
                <FormImageUpload
                    name="logo_url"
                    defaultValue={tenant.logo_url || ''}
                />
                <p className="text-xs text-muted-foreground">
                    Logo, raporlarda ve teklif belgelerinde görünecektir.
                </p>
            </div>

            <div className="pt-6 border-t">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-blue-600" />
                    Lisans ve Kullanım
                </h3>
                <div className="grid gap-6 md:grid-cols-3 mb-6">
                    <div className="p-4 rounded-xl border bg-slate-50/50">
                        <div className="flex items-center gap-3 mb-2">
                            <CreditCard className="h-4 w-4 text-slate-500" />
                            <span className="text-sm font-medium text-slate-600">Mevcut Paket</span>
                        </div>
                        <Badge variant="outline" className="text-md border-blue-200 bg-blue-50 text-blue-700">
                            {tenant.plan_type}
                        </Badge>
                    </div>

                    <div className="p-4 rounded-xl border bg-slate-50/50">
                        <div className="flex items-center gap-3 mb-2">
                            <Calendar className="h-4 w-4 text-slate-500" />
                            <span className="text-sm font-medium text-slate-600">Bitiş Tarihi</span>
                        </div>
                        <span className="font-semibold">
                            {tenant.subscription_end_date
                                ? format(new Date(tenant.subscription_end_date), 'dd MMMM yyyy', { locale: tr })
                                : 'Süresiz'
                            }
                        </span>
                    </div>

                    <div className="p-4 rounded-xl border bg-slate-50/50">
                        <div className="flex items-center gap-3 mb-2">
                            <Users className="h-4 w-4 text-slate-500" />
                            <span className="text-sm font-medium text-slate-600">Kullanıcı Kapasitesi</span>
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
                {isPending ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
            </Button>
        </form>
    )
}
