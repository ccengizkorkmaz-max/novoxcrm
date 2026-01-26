'use client'

import { useState } from 'react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, CheckCircle2, XCircle, Clock, UserPlus, FileText, BadgeTurkishLira } from 'lucide-react'
import { updateBrokerLeadStatus } from '@/app/broker/actions'
import { toast } from 'sonner'

export default function BrokerLeadStatusAction({ leadId, currentStatus }: { leadId: string, currentStatus: string }) {
    const [loading, setLoading] = useState(false)

    async function handleStatusUpdate(newStatus: string) {
        setLoading(true)
        const res = await updateBrokerLeadStatus(leadId, newStatus)
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success('Durum güncellendi')
        }
        setLoading(false)
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0" disabled={loading} suppressHydrationWarning>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Aksiyonlar</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => handleStatusUpdate('Contacted')}>
                    <Clock className="mr-2 h-4 w-4 text-blue-500" />
                    <span>Ulaşıldı Olarak İşaretle</span>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => handleStatusUpdate('Qualified')}>
                    <UserPlus className="mr-2 h-4 w-4 text-indigo-500" />
                    <span>Müşteriyi Kalifiye Et</span>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => handleStatusUpdate('Visit Scheduled')}>
                    <FileText className="mr-2 h-4 w-4 text-orange-500" />
                    <span>Randevu Oluşturuldu</span>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => handleStatusUpdate('Reserved')}>
                    <BadgeTurkishLira className="mr-2 h-4 w-4 text-amber-500" />
                    <span>Opsiyonlu Olarak İşaretle</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => handleStatusUpdate('Contract Signed')} className="text-green-600 font-bold">
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    <span>Satış / Sözleşme Tamam</span>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => handleStatusUpdate('Rejected')} className="text-red-600">
                    <XCircle className="mr-2 h-4 w-4" />
                    <span>Reddet / İptal Et</span>
                </DropdownMenuItem>

            </DropdownMenuContent>
        </DropdownMenu>
    )
}
