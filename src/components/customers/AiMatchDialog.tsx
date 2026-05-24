'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'
import { AiMatchWidget } from '@/components/customers/AiMatchWidget'

interface AiMatchDialogProps {
    customerId: string
    customerName: string
    triggerClassName?: string
}

export function AiMatchDialog({ customerId, customerName, triggerClassName }: AiMatchDialogProps) {
    const [open, setOpen] = useState(false)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    className={triggerClassName || "h-8 w-8 text-indigo-600 border-indigo-100 hover:bg-indigo-50 hover:border-indigo-200 transition-all active:scale-90"}
                    title="AI Akıllı Eşleşme"
                >
                    <Sparkles className={triggerClassName?.includes('h-6') ? "h-3 w-3" : "h-4 w-4"} />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md w-[95vw] rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="p-6 bg-gradient-to-br from-indigo-600 to-blue-700 text-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                            <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold tracking-tight">AI Akıllı Eşleşme</DialogTitle>
                            <p className="text-sm text-indigo-100 opacity-90">{customerName}</p>
                        </div>
                    </div>
                </DialogHeader>
                <div className="p-4 bg-slate-50">
                    <AiMatchWidget customerId={customerId} />
                </div>
            </DialogContent>
        </Dialog>
    )
}
