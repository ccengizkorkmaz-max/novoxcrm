'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Mail, Loader2, Check } from 'lucide-react'
import { sendBrokerReminderEmail } from '@/app/broker/actions'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

export default function BrokerReminderButton({ applicationId }: { applicationId: string }) {
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)
    const t = useTranslations('BrokerApplications')

    async function handleSendReminder() {
        setLoading(true)
        const res = await sendBrokerReminderEmail(applicationId)
        setLoading(false)

        if (res.error) {
            toast.error(res.error)
        } else {
            setSent(true)
            toast.success(t('reminder.success'))
            // Reset status after a while so they can send again if needed later
            setTimeout(() => setSent(false), 30000)
        }
    }

    if (sent) {
        return (
            <Button size="sm" variant="outline" className="text-green-600 border-green-200 bg-green-50" disabled>
                <Check className="h-3 w-3 mr-1" />
                {t('reminder.sent')}
            </Button>
        )
    }

    return (
        <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={handleSendReminder}
            disabled={loading}
        >
            {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Mail className="h-3 w-3 mr-1" />}
            {t('reminder.button')}
        </Button>
    )
}
