'use client'

import { useState } from 'react'
import { Link } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from '@/lib/utils'
import { UserPlus, Pencil, Trash, Mail, Phone, Tag, CalendarPlus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createCustomer, updateCustomer, deleteCustomer } from '../actions'
import CustomerDemands from './CustomerDemands'
import { CustomerEditDialog, type Customer } from './CustomerEditDialog'
import { ActivityForm } from '@/components/activities/activity-form'

// Removed redundant interface definition

export default function CustomerList({ customers }: { customers: Customer[] }) {
    const t = useTranslations('Customers')
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [isActivityOpen, setIsActivityOpen] = useState(false)
    const [selectedCustomerForActivity, setSelectedCustomerForActivity] = useState<Customer | null>(null)

    const handleEditClick = (customer: Customer) => {
        setEditingCustomer(customer)
        setIsEditOpen(true)
    }

    const handleCreateActivity = (customer: Customer) => {
        setSelectedCustomerForActivity(customer)
        setIsActivityOpen(true)
    }

    const handleDeleteClick = async (id: string) => {
        if (confirm(t('table.confirmDelete'))) {
            const formData = new FormData()
            formData.append('id', id)
            await deleteCustomer(formData)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-2">
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button variant="default" className="shadow-sm w-full md:w-auto">
                                <UserPlus className="mr-2 h-4 w-4" /> {t('addCustomer')}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg w-[95vw] rounded-2xl">
                            <DialogHeader>
                                <DialogTitle>{t('createModal.title')}</DialogTitle>
                            </DialogHeader>
                            <form action={async (formData) => {
                                await createCustomer(formData)
                                setIsCreateOpen(false)
                            }}>
                                <Tabs defaultValue="general" className="w-full">
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="general">{t('tabs.details')}</TabsTrigger>
                                        <TabsTrigger value="demands">{t('tabs.demands')}</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="general" forceMount={true} className="data-[state=inactive]:hidden">
                                        <div className="grid gap-4 py-4">
                                            <div className="grid gap-2">
                                                <Label>{t('form.fullName')}</Label>
                                                <Input name="full_name" required className="h-11 border-slate-200" />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>{t('form.phone')}</Label>
                                                <Input name="phone" required className="h-11 border-slate-200" />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>{t('form.email')}</Label>
                                                <Input name="email" type="email" className="h-11 border-slate-200" />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>{t('form.source')}</Label>
                                                <Input name="source" placeholder={t('form.sourcePlaceholder')} className="h-11 border-slate-200" />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>{t('form.address')}</Label>
                                                <Textarea name="address" className="border-slate-200" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="grid gap-2">
                                                    <Label>{t('form.city')}</Label>
                                                    <Input name="city" className="h-11 border-slate-200" />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label>{t('form.district')}</Label>
                                                    <Input name="district" className="h-11 border-slate-200" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="grid gap-2">
                                                    <Label>{t('form.postalCode')}</Label>
                                                    <Input name="postal_code" className="h-11 border-slate-200" />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label>{t('form.country')}</Label>
                                                    <Input name="country" defaultValue="Türkiye" className="h-11 border-slate-200" />
                                                </div>
                                            </div>
                                            <div className="pt-2 border-t mt-2">
                                                <Label className="text-blue-600 font-bold text-xs uppercase">{t('form.portalAccess')}</Label>
                                                <div className="grid grid-cols-2 gap-4 mt-2">
                                                    <div className="grid gap-2">
                                                        <Label className="text-xs">{t('form.username')}</Label>
                                                        <Input name="portal_username" placeholder={t('form.username')} />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label className="text-xs">{t('form.password')}</Label>
                                                        <Input name="portal_password" type="password" placeholder={t('form.password')} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>
                                    <TabsContent value="demands" forceMount={true} className="data-[state=inactive]:hidden">
                                        <div className="grid gap-4 py-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>{t('form.minBudget')}</Label>
                                                    <Input name="min_price" type="number" placeholder="0" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>{t('form.maxBudget')}</Label>
                                                    <Input name="max_price" type="number" placeholder="0" />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>{t('form.roomCount')}</Label>
                                                <div className="flex gap-2 flex-wrap">
                                                    {['1+1', '2+1', '3+1', '4+1', 'Villa'].map(type => (
                                                        <label key={type} className="flex items-center space-x-2 border p-2 rounded cursor-pointer hover:bg-accent">
                                                            <input
                                                                type="checkbox"
                                                                name="room_count"
                                                                value={type}
                                                                className="h-4 w-4"
                                                            />
                                                            <span className="text-sm">{type}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>{t('form.location')}</Label>
                                                <Input name="location_preference" placeholder={t('form.locationPlaceholder')} />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>{t('form.propertyType')}</Label>
                                                    <Select name="property_type">
                                                        <SelectTrigger>
                                                            <SelectValue placeholder={t('form.select')} />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Apartment">{t('types.Apartment')}</SelectItem>
                                                            <SelectItem value="Villa">{t('types.Villa')}</SelectItem>
                                                            <SelectItem value="Office">{t('types.Office')}</SelectItem>
                                                            <SelectItem value="Shop">{t('types.Shop')}</SelectItem>
                                                            <SelectItem value="Commercial">{t('types.Commercial')}</SelectItem>
                                                            <SelectItem value="Land">{t('types.Land')}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>{t('form.investmentPurpose')}</Label>
                                                    <Select name="investment_purpose">
                                                        <SelectTrigger>
                                                            <SelectValue placeholder={t('form.select')} />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Living">{t('purposes.Living')}</SelectItem>
                                                            <SelectItem value="Investment">{t('purposes.Investment')}</SelectItem>
                                                            <SelectItem value="Holiday">{t('purposes.Holiday')}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>{t('form.notes')}</Label>
                                                <Textarea name="notes" placeholder={t('form.notesPlaceholder')} />
                                            </div>
                                        </div>
                                    </TabsContent>
                                </Tabs>
                                <DialogFooter>
                                    <Button type="submit" className="w-full md:w-auto">{t('createModal.submit')}</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block rounded-xl border bg-card shadow-sm overflow-hidden">
                <div className="relative w-full overflow-auto max-h-[calc(100vh-350px)]">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow>
                                <TableHead className="sticky top-0 bg-background/95 backdrop-blur z-10 w-[250px]">{t('table.fullName')}</TableHead>
                                <TableHead className="sticky top-0 bg-background/95 backdrop-blur z-10 w-[150px]">{t('table.phone')}</TableHead>
                                <TableHead className="sticky top-0 bg-background/95 backdrop-blur z-10 w-[200px]">{t('table.email')}</TableHead>
                                <TableHead className="sticky top-0 bg-background/95 backdrop-blur z-10 w-[150px]">{t('table.source')}</TableHead>
                                <TableHead className="sticky top-0 bg-background/95 backdrop-blur z-10 w-[120px]">{t('table.status')}</TableHead>
                                <TableHead className="sticky top-0 bg-background/95 backdrop-blur z-10 w-[100px] text-right">{t('table.actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {customers && customers.length > 0 ? (
                                customers.map((c) => (
                                    <TableRow key={c.id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell className="font-semibold text-slate-900 capitalize">
                                            <Link href={`/customers/${c.id}`} className="hover:underline flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                                                    {c.full_name.substring(0, 2).toUpperCase()}
                                                </div>
                                                {c.full_name}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="font-medium text-slate-600">{c.phone}</TableCell>
                                        <TableCell className="text-slate-500">{c.email || '-'}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-[10px] bg-slate-50 border-slate-200">
                                                {c.source || '-'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {c.contract_customers && c.contract_customers.length > 0 ? (
                                                <Badge className="bg-blue-600 hover:bg-blue-700 text-[10px] px-2 py-0">{t('badges.customer')}</Badge>
                                            ) : c.customer_demands && c.customer_demands.length > 0 ? (
                                                <Badge className="bg-emerald-600 hover:bg-emerald-700 text-[10px] px-2 py-0">{t('badges.lead')}</Badge>
                                            ) : (
                                                <Badge variant="secondary" className="text-[10px] px-2 py-0">{t('badges.contact')}</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => handleCreateActivity(c)} title="Aktivite Ekle">
                                                    <CalendarPlus className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => handleEditClick(c)} title={t('table.edit')}>
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteClick(c.id)} title={t('table.delete')}>
                                                    <Trash className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-32 text-muted-foreground">
                                        {t('table.empty')}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="flex flex-col gap-4 md:hidden">
                {customers && customers.length > 0 ? (
                    customers.map((c) => (
                        <div key={c.id} className="rounded-xl border bg-card p-4 shadow-sm space-y-4 relative overflow-hidden active:bg-slate-50 transition-colors">
                            <div className="flex justify-between items-start">
                                <Link href={`/customers/${c.id}`} className="flex items-center gap-3 group">
                                    <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                                        {c.full_name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-900 text-[15px] group-hover:underline">{c.full_name}</span>
                                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
                                            {new Date(c.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </Link>
                                <div>
                                    {c.contract_customers && c.contract_customers.length > 0 ? (
                                        <Badge className="bg-blue-600 text-[9px] px-2 py-0 uppercase tracking-wider">{t('badges.customer')}</Badge>
                                    ) : (c.customer_demands && c.customer_demands.length > 0) ? (
                                        <Badge className="bg-emerald-600 text-[9px] px-2 py-0 uppercase tracking-wider">{t('badges.lead')}</Badge>
                                    ) : (
                                        <Badge variant="secondary" className="text-[9px] px-2 py-0 uppercase tracking-wider">{t('badges.contact')}</Badge>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-2 border-y border-slate-50 py-3">
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                                    <span className="font-medium">{c.phone}</span>
                                </div>
                                {c.email && (
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                                        <span className="truncate">{c.email}</span>
                                    </div>
                                )}
                                {c.source && (
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <Tag className="h-3.5 w-3.5 text-slate-400" />
                                        <span>{c.source}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-2 pt-1">
                                <Button variant="outline" size="sm" className="h-9 px-4 rounded-lg flex-1 md:flex-none border-blue-100 text-blue-700 font-bold" onClick={() => handleCreateActivity(c)}>
                                    <CalendarPlus className="h-3.5 w-3.5 mr-2" /> Aktivite
                                </Button>
                                <Button variant="outline" size="sm" className="h-9 px-4 rounded-lg flex-1 md:flex-none border-slate-100 text-slate-700 font-bold" onClick={() => handleEditClick(c)}>
                                    <Pencil className="h-3.5 w-3.5 mr-2" /> {t('table.edit')}
                                </Button>
                                <Button variant="ghost" size="icon" className="h-9 w-9 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteClick(c.id)}>
                                    <Trash className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="bg-card border rounded-xl p-12 text-center text-muted-foreground">
                        {t('table.empty')}
                    </div>
                )}
            </div>

            <CustomerEditDialog
                customer={editingCustomer}
                isOpen={isEditOpen}
                onOpenChange={setIsEditOpen}
            />

            <ActivityForm
                open={isActivityOpen}
                onOpenChange={setIsActivityOpen}
                mode="create"
                activity={{ customer_id: selectedCustomerForActivity?.id }}
                customers={customers}
            />
        </div>
    )
}
