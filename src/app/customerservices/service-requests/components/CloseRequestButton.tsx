'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"
import { updateServiceRequestStatus } from '../actions'

export function CloseRequestButton({ requestId }: { requestId: string }) {
    const [loading, setLoading] = useState(false)

    async function handleClose() {
        if (!confirm('Talebi çözüldü olarak işaretlemek istediğinize emin misiniz?')) return

        setLoading(true)
        const res = await updateServiceRequestStatus(requestId, 'Resolved')
        setLoading(false)

        if (res.error) {
            alert(res.error)
        } else {
            window.location.reload()
        }
    }

    return (
        <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}
            className="text-emerald-600 border-emerald-100 hover:bg-emerald-50 gap-2"
        >
            <CheckCircle2 className="h-4 w-4" />
            {loading ? 'Güncelleniyor...' : 'Talebi Çözüldü Olarak İşaretle'}
        </Button>
    )
}
