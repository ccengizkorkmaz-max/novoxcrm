'use client'

import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { toast } from 'sonner'
import PaymentPlanCalculator from './PaymentPlanCalculator'
import { getPaymentTemplates } from '../actions'
import { updateOpportunityStage } from '../../opportunities/opportunity-actions'

interface PipelineProposalDialogProps {
    saleId: string
    opportunityId: string
    customerName: string
    totalAmount?: number
    initialCurrency?: string
    projectId?: string | null
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

export default function PipelineProposalDialog({
    saleId,
    opportunityId,
    customerName,
    totalAmount = 0,
    initialCurrency = 'TRY',
    projectId,
    isOpen,
    onOpenChange,
    onSuccess
}: PipelineProposalDialogProps) {
    const [templates, setTemplates] = useState<any[]>([])

    useEffect(() => {
        if (isOpen) {
            loadTemplates()
        }
    }, [isOpen])

    const loadTemplates = async () => {
        try {
            // Load templates. Can filter by project if needed.
            const data = await getPaymentTemplates(projectId)
            if (data) {
                setTemplates(data)
            }
        } catch (err) {
            console.error('Error loading payment templates:', err)
        }
    }

    const handleSaveSuccess = async () => {
        try {
            const res = await updateOpportunityStage(opportunityId, 'proposal')
            if (res.success) {
                toast.success('Ödeme planı kaydedildi ve fırsat teklif aşamasına taşındı.')
                onOpenChange(false)
                if (onSuccess) onSuccess()
            } else {
                toast.error(res.error || 'Fırsat aşaması güncellenirken bir hata oluştu.')
            }
        } catch (err: any) {
            toast.error('Fırsat güncellenirken beklenmedik hata: ' + err.message)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl w-[95vw] rounded-2xl bg-white dark:bg-slate-950">
                <DialogHeader>
                    <DialogTitle>
                        Teklif Hazırla / Ödeme Planı Hesapla ({customerName})
                    </DialogTitle>
                </DialogHeader>
                <PaymentPlanCalculator
                    saleId={saleId}
                    totalAmount={totalAmount}
                    initialCurrency={initialCurrency}
                    templates={templates}
                    onClose={() => onOpenChange(false)}
                    onSaveSuccess={handleSaveSuccess}
                />
            </DialogContent>
        </Dialog>
    )
}
