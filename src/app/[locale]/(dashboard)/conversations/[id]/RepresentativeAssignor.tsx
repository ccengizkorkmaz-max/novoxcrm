'use client'

import { useState } from 'react'
import { UserCheck, Loader2, Check } from 'lucide-react'
import { assignRepresentativeToConversation } from '../actions'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface SalesRep {
    id: string
    full_name: string
    role?: string
}

interface RepresentativeAssignorProps {
    conversationId: string
    customerId?: string | null
    leadId?: string | null
    initialAssignedTo?: string | null
    initialAssigneeName?: string | null
    salesRepresentatives: SalesRep[]
}

export default function RepresentativeAssignor({
    conversationId,
    customerId,
    leadId,
    initialAssignedTo = null,
    initialAssigneeName = null,
    salesRepresentatives = []
}: RepresentativeAssignorProps) {
    const [assignedTo, setAssignedTo] = useState<string | null>(initialAssignedTo)
    const [assigneeName, setAssigneeName] = useState<string>(initialAssigneeName || 'Atanmamış')
    const [isSaving, setIsSaving] = useState(false)

    const handleAssign = async (newAssignedTo: string) => {
        const valueToSave = newAssignedTo === 'unassigned' ? null : newAssignedTo
        setIsSaving(true)

        try {
            const res = await assignRepresentativeToConversation({
                conversationId,
                customerId,
                leadId,
                assignedTo: valueToSave
            })

            if (res.success) {
                setAssignedTo(valueToSave)
                setAssigneeName(res.assigneeName || 'Atanmamış')
                toast.success(valueToSave ? `Satış temsilcisi atandı: ${res.assigneeName}` : 'Temsilci ataması kaldırıldı')
            } else {
                toast.error(res.error || 'Atama işlemi başarısız oldu')
            }
        } catch (err) {
            console.error('Assignment error:', err)
            toast.error('Temsilci atanırken bir hata oluştu')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    <UserCheck className="h-3.5 w-3.5 text-blue-600" />
                    Satış Danışmanı Atama
                </div>
                {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />}
            </div>

            <div className="relative">
                <select
                    value={assignedTo || 'unassigned'}
                    onChange={(e) => handleAssign(e.target.value)}
                    disabled={isSaving}
                    className={cn(
                        "w-full h-9 rounded-lg border text-xs font-bold px-2.5 py-1 transition-all bg-white shadow-xs focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer truncate",
                        assignedTo ? "border-blue-200 text-blue-900 bg-blue-50/30" : "border-slate-200 text-slate-600"
                    )}
                >
                    <option value="unassigned">-- Temsilci Atanmamış --</option>
                    {salesRepresentatives.map((rep) => (
                        <option key={rep.id} value={rep.id}>
                            {rep.full_name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="text-[10px] leading-tight text-slate-500 font-medium">
                {assignedTo ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <Check className="h-3 w-3 shrink-0 text-emerald-600" /> Lead & Müşteri: <span className="underline">{assigneeName}</span>
                    </span>
                ) : (
                    <span className="text-amber-700 font-medium">⚠️ Aktif müşteriye ait lead'e temsilci atanmadı.</span>
                )}
            </div>
        </div>
    )
}
