'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { saveCustomerDemand } from '../actions'

import { useTranslations } from 'next-intl'

interface CustomerDemandsProps {
    customerId: string
    demand?: any
    onClose?: () => void
}

export default function CustomerDemands({ customerId, demand, onClose }: CustomerDemandsProps) {
    const t = useTranslations('Customers')

    return (
        <form action={async (formData) => {
            await saveCustomerDemand(formData)
            if (onClose) onClose()
        }} className="flex flex-col flex-1 min-h-0 h-full">
            <input type="hidden" name="customer_id" value={customerId} />

            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>{t('form.minBudget')}</Label>
                        <Input name="min_price" type="number" placeholder="0" defaultValue={demand?.min_price} />
                    </div>
                    <div className="space-y-2">
                        <Label>{t('form.maxBudget')}</Label>
                        <Input name="max_price" type="number" placeholder="0" defaultValue={demand?.max_price} />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>{t('form.roomCount')}</Label>
                    <div className="flex gap-2 flex-wrap">
                        {['1+1', '2+1', '3+1', '4+1', 'Villa'].map(type => (
                            <label key={type} className="flex items-center space-x-2 border p-2 rounded cursor-pointer hover:bg-accent">
                                <input
                                    type="checkbox"
                                    name="room_count"
                                    value={type}
                                    defaultChecked={demand?.room_count?.includes(type)}
                                    className="h-4 w-4"
                                />
                                <span className="text-sm">{type}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>{t('form.location')}</Label>
                    <Input name="location_preference" placeholder={t('form.locationPlaceholder')} defaultValue={demand?.location_preference} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>{t('form.propertyType')}</Label>
                        <Select name="property_type" defaultValue={demand?.property_type}>
                            <SelectTrigger>
                                <SelectValue placeholder={t('form.select')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Apartment">{t('types.Apartment')}</SelectItem>
                                <SelectItem value="Villa">{t('types.Villa')}</SelectItem>
                                <SelectItem value="Office">{t('types.Office')}</SelectItem>
                                <SelectItem value="Shop">{t('types.Shop')}</SelectItem>
                                <SelectItem value="Commercial">{t('types.Commercial')}</SelectItem>
                                <SelectItem value="Land">{t('types.Land')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>{t('form.investmentPurpose')}</Label>
                        <Select name="investment_purpose" defaultValue={demand?.investment_purpose}>
                            <SelectTrigger>
                                <SelectValue placeholder={t('form.select')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Living">{t('purposes.Living')}</SelectItem>
                                <SelectItem value="Investment">{t('purposes.Investment')}</SelectItem>
                                <SelectItem value="Holiday">{t('purposes.Holiday')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>{t('form.notes')}</Label>
                    <Textarea name="notes" placeholder={t('form.notesPlaceholder')} defaultValue={demand?.notes} />
                </div>
            </div>

            <div className="flex justify-end p-4 sm:p-6 pt-4 border-t bg-slate-50 dark:bg-slate-900/50 shrink-0">
                <Button type="submit" className="w-full sm:w-auto">{t('createModal.submit')}</Button>
            </div>
        </form>
    )
}
