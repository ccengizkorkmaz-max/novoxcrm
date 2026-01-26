'use client'

import { useState } from 'react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { updateServiceRequestStatus } from '@/app/customerservices/service-requests/actions'
import { toast } from "sonner"

export function StatusManager({ requestId, currentStatus }: { requestId: string, currentStatus: string }) {
    const [status, setStatus] = useState(currentStatus)
    const [loading, setLoading] = useState(false)

    async function handleStatusChange(newStatus: string) {
        setLoading(true)
        const res = await updateServiceRequestStatus(requestId, newStatus)
        setLoading(false)

        if (res.error) {
            toast.error(res.error)
        } else {
            setStatus(newStatus)
            toast.success('Durum güncellendi')
            window.location.reload()
        }
    }

    return (
        <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-500">Durum:</span>
            <Select value={status} onValueChange={handleStatusChange} disabled={loading}>
                <SelectTrigger className="w-[140px] h-9">
                    <SelectValue placeholder="Durum Seç" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Open">Açık</SelectItem>
                    <SelectItem value="In Progress">İşlemde</SelectItem>
                    <SelectItem value="Resolved">Çözüldü</SelectItem>
                    <SelectItem value="Closed">Kapalı</SelectItem>
                </SelectContent>
            </Select>
        </div>
    )
}
