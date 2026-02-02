'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UserPlus, Search, UserCheck, X } from 'lucide-react'
import { createCustomer } from '@/app/[locale]/(dashboard)/crm/actions'
import { toast } from 'sonner'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Props {
    initialCustomers: any[]
    onSelect: (customer: any) => void
    selectedCustomer: any
}

export function CustomerSelector({ initialCustomers, onSelect, selectedCustomer }: Props) {
    const t = useTranslations('QuickCRM')
    const tc = useTranslations('Customers')
    const [search, setSearch] = useState('')
    const [showNewForm, setShowNewForm] = useState(false)
    const [localCustomers, setLocalCustomers] = useState(initialCustomers)

    const filteredCustomers = localCustomers.filter(c =>
        c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.phone?.includes(search)
    )

    async function handleAddNew(formData: FormData) {
        const res = await createCustomer(formData)
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success(tc('createModal.submit'))
            setShowNewForm(false)
            // Note: In a real app, we'd fetch the new customer data back or revalidate.
            // For now, let's just use the form data to show it selected if possible,
            // but since createCustomer doesn't return the ID easily here without modification,
            // we'll just suggest the user to search for it.
            // Actually, let's just refresh the list if we can.
            window.location.reload() // Quickest way for MVP
        }
    }

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
        <Card className="h-full flex flex-col overflow-hidden">
            <CardHeader className="py-3 shrink-0">
                <CardTitle className="text-sm font-bold flex items-center justify-between">
                    {showNewForm ? t('newCustomer') : t('searchCustomer')}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowNewForm(!showNewForm)}
                        className="h-7 px-2 text-xs"
                    >
                        {showNewForm ? t('existingCustomer') : <><UserPlus className="h-3 w-3 mr-1" /> {t('newCustomer')}</>}
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-hidden flex flex-col">
                {showNewForm ? (
                    <form action={handleAddNew} className="p-4 space-y-3">
                        <Input name="full_name" placeholder={tc('form.fullName')} required />
                        <Input name="phone" placeholder={tc('form.phone')} required />
                        <Input name="email" placeholder={tc('form.email')} type="email" />
                        <Input name="source" placeholder={tc('form.source')} defaultValue="Quick CRM" />
                        <Button type="submit" className="w-full">{tc('createModal.submit')}</Button>
                    </form>
                ) : (
                    <>
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
                    </>
                )}
            </CardContent>
        </Card>
    )
}
