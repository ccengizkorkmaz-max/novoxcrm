'use client'

import { useState } from 'react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { updateServiceRequestStatus } from '@/app/[locale]/customerservices/service-requests/actions'
import { toast } from "sonner"
import { useTranslations } from 'next-intl'

export function StatusManager({ requestId, currentStatus }: { requestId: string, currentStatus: string }) {
    const t = useTranslations('ServiceRequests')
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
            toast.success(t('detail.messages.statusUpdated'))
            window.location.reload()
        }
    }

    return (
        <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-500">{t('status.label')}:</span>
            <Select value={status} onValueChange={handleStatusChange} disabled={loading}>
                <SelectTrigger className="w-[140px] h-9">
                    <SelectValue placeholder={t('status.select')} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Open">{t('status.open')}</SelectItem>
                    <SelectItem value="In Progress">{t('status.inProgress')}</SelectItem>
                    <SelectItem value="Resolved">{t('status.resolved')}</SelectItem>
                    <SelectItem value="Closed">{t('status.closed')}</SelectItem>
                </SelectContent>
            </Select>
        </div>
    )
}
