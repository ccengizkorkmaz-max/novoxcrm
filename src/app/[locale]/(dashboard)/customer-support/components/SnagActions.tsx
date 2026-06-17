'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Check, UserPlus, ShieldAlert } from 'lucide-react'
import { updateSnagStatus, assignSubcontractor } from '../actions'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

interface Subcontractor {
    id: string
    name: string
}

interface SnagActionsProps {
    itemId: string
    currentStatus: string
    currentSubcontractorId?: string | null
    subcontractors: Subcontractor[]
}

export function SnagActions({ itemId, currentStatus, currentSubcontractorId, subcontractors }: SnagActionsProps) {
    const t = useTranslations('SnagList')
    const [status, setStatus] = useState(currentStatus)
    const [subId, setSubId] = useState(currentSubcontractorId || 'none')
    const [loading, setLoading] = useState(false)

    const handleStatusUpdate = async (newStatus: string) => {
        setLoading(true)
        try {
            const res = await updateSnagStatus(itemId, newStatus)
            if (res.success) {
                setStatus(newStatus)
                toast.success(t('successStatus'))
            } else {
                toast.error(res.error || 'Güncelleme başarısız.')
            }
        } catch (error) {
            toast.error('Bağlantı hatası oluştu.')
        } finally {
            setLoading(false)
        }
    }

    const handleAssign = async (val: string) => {
        setLoading(true)
        const finalSubId = val === 'none' ? null : val
        try {
            const res = await assignSubcontractor(itemId, finalSubId)
            if (res.success) {
                setSubId(val)
                if (finalSubId) setStatus('In Progress')
                toast.success(t('successAssign'))
            } else {
                toast.error(res.error || 'Atama başarısız.')
            }
        } catch (error) {
            toast.error('Bağlantı hatası.')
        } finally {
            setLoading(false)
        }
    }

    if (status === 'Verified') {
        return (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <Check className="h-4 w-4" /> {t('statuses.Verified')}
            </span>
        )
    }

    if (status === 'Cancelled') {
        return (
            <span className="text-xs text-slate-400 font-medium">
                {t('statuses.Cancelled')}
            </span>
        )
    }

    return (
        <div className="flex flex-wrap items-center gap-2">
            {/* Subcontractor Assignment */}
            <div className="w-40">
                <Select value={subId} onValueChange={handleAssign} disabled={loading}>
                    <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Taşeron Seçin" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">Atanmamış</SelectItem>
                        {subcontractors.map((sub) => (
                            <SelectItem key={sub.id} value={sub.id}>
                                {sub.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Quick Actions based on status */}
            {status === 'Pending' && subId !== 'none' && (
                <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={() => handleStatusUpdate('In Progress')}
                    disabled={loading}
                >
                    İşleme Al
                </Button>
            )}

            {status === 'In Progress' && (
                <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 text-xs bg-amber-500 hover:bg-amber-600 text-white border-none"
                    onClick={() => handleStatusUpdate('Repaired')}
                    disabled={loading}
                >
                    Onarıldı İşaretle
                </Button>
            )}

            {status === 'Repaired' && (
                <div className="flex gap-1">
                    <Button
                        size="sm"
                        className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => handleStatusUpdate('Verified')}
                        disabled={loading}
                    >
                        Onayla
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs text-red-500 hover:bg-red-50"
                        onClick={() => handleStatusUpdate('Cancelled')}
                        disabled={loading}
                    >
                        İptal Et
                    </Button>
                </div>
            )}
        </div>
    )
}
