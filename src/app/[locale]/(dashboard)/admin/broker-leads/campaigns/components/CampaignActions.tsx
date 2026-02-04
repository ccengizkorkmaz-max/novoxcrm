'use client'

import { useState } from 'react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, StopCircle, Edit, AlertTriangle } from "lucide-react"
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
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)
    const t = useTranslations('Campaigns')

    async function handleEndConfirm() {
        setIsPending(true)
        try {
            const result = await endIncentiveCampaign(campaignId)
            if (result.success) {
                toast.success(t('actions.successEnd'))
                router.refresh()
                setIsConfirmOpen(false)
            } else {
                toast.error(result.error)
            }
        } catch (error) {
            toast.error('Kampanya sonlandırılırken bir hata oluştu.')
        } finally {
            setIsPending(false)
        }
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100 rounded-lg transition-all">
                        <MoreHorizontal className="h-4 w-4 text-slate-500" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl shadow-xl border-slate-100">
                    <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 py-2">{t('actions.menuTitle')}</DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                        <Link href={`/admin/broker-leads/campaigns/${campaignId}/edit`} className="cursor-pointer flex items-center gap-2 py-2 px-3 focus:bg-slate-50 rounded-lg font-medium text-sm">
                            <Edit className="h-4 w-4 text-blue-500" /> {t('actions.edit')}
                        </Link>
                    </DropdownMenuItem>
                    {isActive && (
                        <DropdownMenuItem
                            onClick={() => setIsConfirmOpen(true)}
                            className="text-orange-600 cursor-pointer flex items-center gap-2 py-2 px-3 focus:bg-orange-50 focus:text-orange-700 rounded-lg font-medium text-sm"
                        >
                            <StopCircle className="h-4 w-4" /> {t('actions.end')}
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <AlertDialogContent className="rounded-3xl border-none shadow-2xl p-0 overflow-hidden sm:max-w-[400px]">
                    <div className="p-8 space-y-4 text-center">
                        <div className="h-16 w-16 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-bounce">
                            <AlertTriangle className="w-8 h-8" />
                        </div>
                        <AlertDialogHeader className="space-y-2">
                            <AlertDialogTitle className="text-xl font-black text-slate-900 leading-tight uppercase tracking-tight">
                                {t('actions.endConfirmTitle') || 'Kampanyayı Sonlandır'}
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-500 font-medium leading-relaxed">
                                {t('actions.confirmEnd') || 'Bu kampanyayı sonlandırmak istediğinize emin misiniz? Bu işlem geri alınamaz.'}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                    </div>
                    <AlertDialogFooter className="p-6 bg-slate-50 flex flex-col sm:flex-row gap-2 border-t border-slate-100">
                        <AlertDialogCancel className="w-full sm:w-1/2 h-12 rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-white active:scale-95 transition-all outline-none">
                            {t('cancel') || 'Vazgeç'}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleEndConfirm}
                            className="w-full sm:w-1/2 h-12 rounded-xl bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-100 text-white font-bold active:scale-95 transition-all"
                            disabled={isPending}
                        >
                            {isPending ? (
                                <div className="flex items-center gap-2">
                                    <span className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full" />
                                    <span>{t('actions.ending') || 'Sonlandırılıyor...'}</span>
                                </div>
                            ) : (
                                t('actions.endConfirmAction') || 'Evet, Sonlandır'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
