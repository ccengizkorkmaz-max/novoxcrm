'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UserPlus, Search, UserCheck, X } from 'lucide-react'
import { toast } from 'sonner'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CustomerEditDialog } from '@/app/[locale]/(dashboard)/crm/components/CustomerEditDialog'

interface Props {
    initialCustomers: any[]
    onSelect: (customer: any) => void
    selectedCustomer: any
}

export function CustomerSelector({ initialCustomers, onSelect, selectedCustomer }: Props) {
    const t = useTranslations('QuickCRM')
    const tc = useTranslations('Customers')
    const [search, setSearch] = useState('')
    const [showNewDialog, setShowNewDialog] = useState(false)
    const [localCustomers, setLocalCustomers] = useState(initialCustomers)

    const filteredCustomers = localCustomers.filter(c =>
        c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.phone?.includes(search)
    )

    if (selectedCustomer) {
        return (
            <Card className="border-blue-200 bg-blue-50/30">
                <CardHeader className="py-3 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-sm font-bold text-blue-700 flex items-center gap-2">
                        <UserCheck className="h-4 w-4" /> {t('customerSelected')}
                    </CardTitle>
                    <Button variant="ghost" size="icon" onClick={() => onSelect(null)} className="h-6 w-6">
                        <X className="h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent className="py-3">
                    <div className="flex flex-col">
                        <span className="font-bold text-lg">{selectedCustomer.full_name}</span>
                        <span className="text-sm text-muted-foreground">{selectedCustomer.phone}</span>
                        <span className="text-xs text-muted-foreground">{selectedCustomer.email}</span>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <>
            <Card className="h-full flex flex-col overflow-hidden">
                <CardHeader className="py-3 shrink-0">
                    <CardTitle className="text-sm font-bold flex items-center justify-between">
                        {t('searchCustomer')}
                        <Button
                            variant="default"
                            size="sm"
                            onClick={() => setShowNewDialog(true)}
                            className="h-7 px-3 text-xs bg-blue-600 hover:bg-blue-700 gap-1"
                        >
                            <UserPlus className="h-3 w-3" /> {t('newCustomer')}
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-hidden flex flex-col">
                    <div className="px-4 pb-2 shrink-0">
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={t('searchCustomer')}
                                className="pl-8 h-9"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    <ScrollArea className="flex-1">
                        <div className="p-2 space-y-1">
                            {filteredCustomers.map(customer => (
                                <button
                                    key={customer.id}
                                    onClick={() => onSelect(customer)}
                                    className="w-full text-left p-3 rounded-md hover:bg-muted transition-colors border border-transparent hover:border-border group"
                                >
                                    <div className="font-medium group-hover:text-primary transition-colors">{customer.full_name}</div>
                                    <div className="text-xs text-muted-foreground">{customer.phone}</div>
                                </button>
                            ))}
                            {filteredCustomers.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground text-sm">
                                    {tc('table.empty')}
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* Full Customer Edit Dialog for new customer creation */}
            <CustomerEditDialog
                customer={null}
                isOpen={showNewDialog}
                onOpenChange={setShowNewDialog}
            />
        </>
    )
}

