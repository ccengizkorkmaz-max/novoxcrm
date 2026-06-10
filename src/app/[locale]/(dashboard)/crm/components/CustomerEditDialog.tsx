'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from '@/components/ui/textarea'
import { updateCustomer, createCustomer } from '../actions'
import { toast } from 'sonner'
import CustomerDemands from './CustomerDemands'
import CustomerProfileTab from './CustomerProfileTab'
import InlineProfileFields from './InlineProfileFields'

export interface Customer {
    id: string
    full_name: string
    phone: string
    email: string
    source: string
    address?: string
    postal_code?: string
    district?: string
    city?: string
    country?: string
    portal_username?: string
    portal_password?: string
    customer_number?: string
    created_at: string
    customer_demands?: any[]
    contract_customers?: any[]
    profile_data?: Record<string, any>
    tags?: string[]
}

interface CustomerEditDialogProps {
    customer: Customer | null
    isOpen: boolean
    onOpenChange: (open: boolean) => void
}

export function CustomerEditDialog({ customer, isOpen, onOpenChange }: CustomerEditDialogProps) {
    const t = useTranslations('Customers')
    const isCreateMode = !customer

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg w-full sm:w-[95vw] h-[100dvh] sm:h-auto max-h-[100dvh] sm:max-h-[90dvh] rounded-none sm:rounded-2xl flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-4 sm:p-6 pb-2 shrink-0 border-b">
                    <DialogTitle className="flex items-center gap-2">
                        {!isCreateMode && customer.customer_number && (
                            <span className="text-xs font-black px-2 py-0.5 bg-blue-100 text-blue-700 rounded-lg">
                                {customer.customer_number}
                            </span>
                        )}
                        {isCreateMode ? t('createModal.title') : t('editCustomer')}
                    </DialogTitle>
                </DialogHeader>
                <Tabs defaultValue="details" className="w-full flex-1 flex flex-col min-h-0">
                    <div className="px-4 sm:px-6 py-2 shrink-0 border-b">
                        <TabsList className={`grid w-full ${isCreateMode ? 'grid-cols-2' : 'grid-cols-3'}`}>
                            <TabsTrigger value="details">{t('tabs.details')}</TabsTrigger>
                            {!isCreateMode && <TabsTrigger value="demands">{t('tabs.demands')}</TabsTrigger>}
                            <TabsTrigger value="profile">Profil</TabsTrigger>
                        </TabsList>
                    </div>
                    <TabsContent value="details" forceMount={true} className="flex-1 min-h-0 data-[state=inactive]:hidden flex flex-col">
                        <form action={async (formData) => {
                            if (isCreateMode) {
                                const res = await createCustomer(formData)
                                if (res?.error) toast.error(res.error)
                                else {
                                    toast.success(t('messages.created') || 'Müşteri oluşturuldu')
                                    onOpenChange(false)
                                    window.location.reload()
                                }
                            } else {
                                const res = await updateCustomer(formData)
                                if (res?.error) toast.error(res.error)
                                else {
                                    toast.success(t('messages.updated') || 'Müşteri güncellendi')
                                    onOpenChange(false)
                                }
                            }
                        }} className="flex flex-col flex-1 min-h-0">
                            {!isCreateMode && <input type="hidden" name="id" value={customer.id} />}
                            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
                                <div className="grid gap-2">
                                    <Label>{t('form.fullName')}</Label>
                                    <Input name="full_name" defaultValue={customer?.full_name || ''} required className="h-11 border-slate-200" />
                                </div>
                                <div className="grid gap-2">
                                    <Label>{t('form.phone')}</Label>
                                    <Input name="phone" defaultValue={customer?.phone || ''} required className="h-11 border-slate-200" />
                                </div>
                                <div className="grid gap-2">
                                    <Label>{t('form.email')}</Label>
                                    <Input name="email" type="email" defaultValue={customer?.email || ''} className="h-11 border-slate-200" />
                                </div>
                                <div className="grid gap-2">
                                    <Label>{t('form.source')}</Label>
                                    <Input name="source" defaultValue={customer?.source || (isCreateMode ? 'Hızlı CRM' : '')} className="h-11 border-slate-200" />
                                </div>
                                <div className="grid gap-2">
                                    <Label>{t('form.address')}</Label>
                                    <Textarea name="address" defaultValue={customer?.address || ''} className="border-slate-200" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>{t('form.city')}</Label>
                                        <Input name="city" defaultValue={customer?.city || ''} className="h-11 border-slate-200" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>{t('form.district')}</Label>
                                        <Input name="district" defaultValue={customer?.district || ''} className="h-11 border-slate-200" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>{t('form.postalCode')}</Label>
                                        <Input name="postal_code" defaultValue={customer?.postal_code || ''} className="h-11 border-slate-200" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>{t('form.country')}</Label>
                                        <Input name="country" defaultValue={customer?.country || 'Türkiye'} className="h-11 border-slate-200" />
                                    </div>
                                </div>
                                <div className="pt-2 border-t mt-2">
                                    <Label className="text-blue-600 font-bold text-xs uppercase">{t('form.portalAccessTitle')}</Label>
                                    <div className="grid grid-cols-2 gap-4 mt-2">
                                        <div className="grid gap-2">
                                            <Label className="text-xs">{t('form.username')}</Label>
                                            <Input name="portal_username" defaultValue={customer?.portal_username || ''} placeholder={t('form.username')} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label className="text-xs">{t('form.password')}</Label>
                                            <Input name="portal_password" type="password" defaultValue={customer?.portal_password || ''} placeholder={t('form.password')} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter className="p-4 sm:p-6 border-t bg-slate-50 dark:bg-slate-900/50 shrink-0">
                                <Button type="submit" className="w-full sm:w-auto">
                                    {isCreateMode ? (t('createModal.submit') || 'Kaydet') : t('createModal.update')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </TabsContent>
                    {!isCreateMode && customer && (
                        <>
                            <TabsContent value="demands" forceMount={true} className="flex-1 min-h-0 data-[state=inactive]:hidden flex flex-col">
                                <CustomerDemands
                                    customerId={customer.id}
                                    demand={Array.isArray(customer.customer_demands) ? customer.customer_demands[0] : customer.customer_demands}
                                    onClose={() => onOpenChange(false)}
                                />
                            </TabsContent>
                            <TabsContent value="profile" forceMount={true} className="flex-1 min-h-0 data-[state=inactive]:hidden flex flex-col">
                                <CustomerProfileTab
                                    customerId={customer.id}
                                    initialTags={customer.tags || []}
                                    initialProfileData={customer.profile_data || {}}
                                    onClose={() => onOpenChange(false)}
                                />
                            </TabsContent>
                        </>
                    )}
                    {isCreateMode && (
                        <TabsContent value="profile" forceMount={true} className="flex-1 min-h-0 data-[state=inactive]:hidden flex flex-col">
                            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
                                <InlineProfileFields />
                            </div>
                        </TabsContent>
                    )}
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}

