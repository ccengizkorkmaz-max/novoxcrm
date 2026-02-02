'use client'

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, StopCircle, Edit } from "lucide-react"
import { endIncentiveCampaign } from '@/app/broker/actions'
import { toast } from "sonner"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { useTranslations } from "next-intl"

interface CampaignActionsProps {
    campaignId: string
    isActive: boolean
}

export default function CampaignActions({ campaignId, isActive }: CampaignActionsProps) {
    const router = useRouter()
    const t = useTranslations('Campaigns')

    async function handleEnd() {
        if (!confirm(t('actions.confirmEnd'))) return

        const result = await endIncentiveCampaign(campaignId)
        if (result.success) {
            toast.success(t('actions.successEnd'))
            router.refresh()
        } else {
            toast.error(result.error)
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t('actions.menuTitle')}</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                    <Link href={`/admin/broker-leads/campaigns/${campaignId}/edit`} className="cursor-pointer flex items-center gap-2">
                        <Edit className="h-4 w-4" /> {t('actions.edit')}
                    </Link>
                </DropdownMenuItem>
                {isActive && (
                    <DropdownMenuItem onClick={handleEnd} className="text-orange-600 cursor-pointer flex items-center gap-2">
                        <StopCircle className="h-4 w-4" /> {t('actions.end')}
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
