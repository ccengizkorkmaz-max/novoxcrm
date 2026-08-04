'use client'

import { useState } from 'react'
import { CalendarCheck } from 'lucide-react'
import { ActivityForm } from '@/components/activities/activity-form'

interface QuickActivityButtonProps {
    customerId?: string
    customerName?: string
    profiles: any[]
}

export default function QuickActivityButton({ customerId, customerName, profiles }: QuickActivityButtonProps) {
    const [open, setOpen] = useState(false)

    // Mock customer array for the form's combobox
    const customers = customerId ? [{ id: customerId, full_name: customerName }] : []

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="w-full flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition-all text-[11px] font-semibold text-slate-600"
            >
                <CalendarCheck className="h-3.5 w-3.5" />
                Aktivite Oluştur
            </button>

            {open && (
                <ActivityForm
                    open={open}
                    onOpenChange={setOpen}
                    mode="create"
                    defaultCustomerId={customerId}
                    customers={customers}
                    profiles={profiles}
                    projects={[]}
                />
            )}
        </>
    )
}
