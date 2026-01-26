'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { updateContractDeliveryDetails } from '@/app/(dashboard)/contracts/actions'
import { toast } from 'sonner'
import { Truck, FileCheck, Save, Loader2 } from 'lucide-react'

interface Props {
    contractId: string
    initialDeliveryStatus: string
    initialTitleDeedStatus: string
}

export function ContractDeliveryManagement({ contractId, initialDeliveryStatus, initialTitleDeedStatus }: Props) {
    const [deliveryStatus, setDeliveryStatus] = useState(initialDeliveryStatus || 'Pending')
    const [titleDeedStatus, setTitleDeedStatus] = useState(initialTitleDeedStatus || 'Pending')
    const [loading, setLoading] = useState(false)

    const handleSave = async () => {
        setLoading(true)
        try {
            const res = await updateContractDeliveryDetails(contractId, deliveryStatus, titleDeedStatus)
            if (res.error) throw new Error(res.error)
            toast.success('Teslimat ve Tapu durumları güncellendi')
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    const hasChanges = deliveryStatus !== initialDeliveryStatus || titleDeedStatus !== initialTitleDeedStatus

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Truck className="h-5 w-5 text-blue-600" />
                    Teslimat & Tapu Yönetimi
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-500">Teslimat Durumu</label>
                    <Select value={deliveryStatus} onValueChange={setDeliveryStatus}>
                        <SelectTrigger>
                            <SelectValue placeholder="Seçiniz" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Pending">Bekliyor</SelectItem>
                            <SelectItem value="In Progress">Hazırlanıyor</SelectItem>
                            <SelectItem value="Ready">Teslime Hazır</SelectItem>
                            <SelectItem value="Delivered">Teslim Edildi</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-500">Tapu Süreci</label>
                    <Select value={titleDeedStatus} onValueChange={setTitleDeedStatus}>
                        <SelectTrigger>
                            <SelectValue placeholder="Seçiniz" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Pending">Bekliyor</SelectItem>
                            <SelectItem value="In Progress">İşlemler Devam Ediyor</SelectItem>
                            <SelectItem value="Ready">Tapu Hazır</SelectItem>
                            <SelectItem value="Handed Over">Tapu Teslim Edildi</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Button
                    className="w-full gap-2 mt-2"
                    onClick={handleSave}
                    disabled={loading || !hasChanges}
                >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Değişiklikleri Kaydet
                </Button>
            </CardContent>
        </Card>
    )
}
