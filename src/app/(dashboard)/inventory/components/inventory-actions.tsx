'use client'

import { useState } from 'react'
import { MoreHorizontal, Edit, Banknote, Briefcase, FileSignature, CheckCircle, Ban } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel
} from "@/components/ui/dropdown-menu"
import Link from 'next/link'
import { updateUnitStatus } from '../actions'
import { ReserveUnitDialog } from './reserve-unit-dialog'
import { CreateOfferDialog } from './create-offer-dialog'
import { StartNegotiationDialog } from './start-negotiation-dialog'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface InventoryActionsProps {
    unit: any
    customers: any[]
}

export function InventoryActions({ unit, customers }: InventoryActionsProps) {
    const router = useRouter()
    const [showReserveDialog, setShowReserveDialog] = useState(false)
    const [showOfferDialog, setShowOfferDialog] = useState(false)
    const [showNegotiationDialog, setShowNegotiationDialog] = useState(false)

    async function handleSell() {
        const formData = new FormData()
        formData.append('id', unit.id)
        formData.append('status', 'Sold')

        try {
            await updateUnitStatus(formData)
            toast.success('Ünite satıldı olarak işaretlendi')
            router.refresh()
        } catch (error) {
            toast.error('Satış işlemi başarısız')
        }
    }

    async function handleCancelReservation() {
        const formData = new FormData()
        formData.append('id', unit.id)
        formData.append('status', 'For Sale') // Revert to For Sale

        try {
            await updateUnitStatus(formData)
            toast.success('Rezervasyon iptal edildi')
            router.refresh()
        } catch (error) {
            toast.error('İptal işlemi başarısız')
        }
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Menüyü aç</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                        <Link href={`/inventory/${unit.id}`} className="cursor-pointer">
                            <Edit className="mr-2 h-4 w-4" />
                            Düzenle
                        </Link>
                    </DropdownMenuItem>

                    {unit.status === 'For Sale' && (
                        <>
                            <DropdownMenuItem onSelect={() => setShowReserveDialog(true)}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Rezerve Et
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => setShowOfferDialog(true)}>
                                <FileSignature className="mr-2 h-4 w-4" />
                                Teklif Ver
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setShowNegotiationDialog(true)}>
                                <Briefcase className="mr-2 h-4 w-4" />
                                Görüşme Başlat
                            </DropdownMenuItem>
                        </>
                    )}

                    {unit.status === 'Reserved' && (
                        <>
                            <DropdownMenuItem onSelect={handleSell}>
                                <Banknote className="mr-2 h-4 w-4" />
                                Satışı Tamamla
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={handleCancelReservation} className="text-destructive focus:text-destructive">
                                <Ban className="mr-2 h-4 w-4" />
                                İptal Et
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Dialogs */}
            <ReserveUnitDialog
                unitId={unit.id}
                unitNumber={unit.unit_number}
                projectName={unit.projects?.name}
                customers={customers}
                open={showReserveDialog}
                onOpenChange={setShowReserveDialog}
            />

            <CreateOfferDialog
                open={showOfferDialog}
                onOpenChange={setShowOfferDialog}
                unitId={unit.id}
                unitPrice={unit.price}
                unitCurrency={unit.currency}
                customers={customers}
            />

            <StartNegotiationDialog
                open={showNegotiationDialog}
                onOpenChange={setShowNegotiationDialog}
                unitId={unit.id}
                customers={customers}
            />
        </>
    )
}
