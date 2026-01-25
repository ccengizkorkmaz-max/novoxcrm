'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { saveCustomerDemand } from '../actions'

interface CustomerDemandsProps {
    customerId: string
    demand?: any
    onClose?: () => void
}

export default function CustomerDemands({ customerId, demand, onClose }: CustomerDemandsProps) {
    return (
        <form action={async (formData) => {
            await saveCustomerDemand(formData)
            if (onClose) onClose()
        }} className="space-y-4">
            <input type="hidden" name="customer_id" value={customerId} />

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Minimum Bütçe</Label>
                    <Input name="min_price" type="number" placeholder="0" defaultValue={demand?.min_price} />
                </div>
                <div className="space-y-2">
                    <Label>Maksimum Bütçe</Label>
                    <Input name="max_price" type="number" placeholder="0" defaultValue={demand?.max_price} />
                </div>
            </div>

            <div className="space-y-2">
                <Label>Oda Sayısı Tercihi</Label>
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
                <Label>Konum Tercihi</Label>
                <Input name="location_preference" placeholder="Örn: Merkez, Sahil, Site içi" defaultValue={demand?.location_preference} />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Emlak Tipi</Label>
                    <Select name="property_type" defaultValue={demand?.property_type}>
                        <SelectTrigger>
                            <SelectValue placeholder="Seçiniz" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Apartment">Daire</SelectItem>
                            <SelectItem value="Villa">Villa</SelectItem>
                            <SelectItem value="Office">Ofis</SelectItem>
                            <SelectItem value="Land">Arsa</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Yatırım Amacı</Label>
                    <Select name="investment_purpose" defaultValue={demand?.investment_purpose}>
                        <SelectTrigger>
                            <SelectValue placeholder="Seçiniz" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Living">Oturum</SelectItem>
                            <SelectItem value="Investment">Yatırım</SelectItem>
                            <SelectItem value="Holiday">Tatil / Yazlık</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-2">
                <Label>Özel Notlar</Label>
                <Textarea name="notes" placeholder="Müşterinin özel istekleri..." defaultValue={demand?.notes} />
            </div>

            <div className="flex justify-end pt-4">
                <Button type="submit">Tercihleri Kaydet</Button>
            </div>
        </form>
    )
}
