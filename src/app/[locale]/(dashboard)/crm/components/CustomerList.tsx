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
import { UserPlus, Pencil, Trash } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createCustomer, updateCustomer, deleteCustomer } from '../actions'
import CustomerDemands from './CustomerDemands'

interface Customer {
    id: string
    full_name: string
    phone: string
    email: string
    source: string
    portal_username?: string
    portal_password?: string
    created_at: string
    customer_demands?: any[]
    contract_customers?: any[]
}

export default function CustomerList({ customers }: { customers: Customer[] }) {
    const t = useTranslations('Customers')
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isCreateOpen, setIsCreateOpen] = useState(false)

    const handleEditClick = (customer: Customer) => {
        setEditingCustomer(customer)
        setIsEditOpen(true)
    }

    const handleDeleteClick = async (id: string) => {
        if (confirm(t('table.confirmDelete'))) {
            const formData = new FormData()
            formData.append('id', id)
            await deleteCustomer(formData)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-start">
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline">
                            <UserPlus className="mr-2 h-4 w-4" /> {t('addCustomer')}
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
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
                                            <Input name="full_name" required />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>{t('form.phone')}</Label>
                                            <Input name="phone" required />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>{t('form.email')}</Label>
                                            <Input name="email" type="email" />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>{t('form.source')}</Label>
                                            <Input name="source" placeholder={t('form.sourcePlaceholder')} />
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
                                <Button type="submit">{t('createModal.submit')}</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
            <div className="rounded-md border bg-card overflow-hidden">
                <div className="relative w-full overflow-auto max-h-[600px]">
                    <Table className="min-w-[800px]">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="sticky top-0 bg-card z-10 w-[250px]">{t('table.fullName')}</TableHead>
                                <TableHead className="sticky top-0 bg-card z-10 w-[150px]">{t('table.phone')}</TableHead>
                                <TableHead className="sticky top-0 bg-card z-10 w-[200px]">{t('table.email')}</TableHead>
                                <TableHead className="sticky top-0 bg-card z-10 w-[150px]">{t('table.source')}</TableHead>
                                <TableHead className="sticky top-0 bg-card z-10 w-[100px]">{t('table.status')}</TableHead>
                                <TableHead className="sticky top-0 bg-card z-10 w-[100px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {customers && customers.length > 0 ? (
                                customers.map((c) => (
                                    <TableRow key={c.id}>
                                        <TableCell className="font-medium">
                                            <Link href={`/customers/${c.id}`} className="hover:underline text-primary">
                                                {c.full_name}
                                            </Link>
                                        </TableCell>
                                        <TableCell>{c.phone}</TableCell>
                                        <TableCell>{c.email}</TableCell>
                                        <TableCell>{c.source}</TableCell>
                                        <TableCell>
                                            {c.contract_customers && c.contract_customers.length > 0 ? (
                                                <Badge className="bg-blue-600">{t('badges.customer')}</Badge>
                                            ) : c.customer_demands && c.customer_demands.length > 0 ? (
                                                <Badge className="bg-green-600">{t('badges.lead')}</Badge>
                                            ) : (
                                                <Badge variant="secondary">{t('badges.contact')}</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => handleEditClick(c)} title={t('table.edit')}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(c.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50" title={t('table.delete')}>
                                                    <Trash className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground">{t('table.empty')}</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('editCustomer')}</DialogTitle>
                    </DialogHeader>
                    {editingCustomer && (
                        <Tabs defaultValue="details" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="details">{t('tabs.details')}</TabsTrigger>
                                <TabsTrigger value="demands">{t('tabs.demands')}</TabsTrigger>
                            </TabsList>
                            <TabsContent value="details">
                                <form action={async (formData) => {
                                    const res = await updateCustomer(formData)
                                    if (res?.error) alert(res.error)
                                    else setIsEditOpen(false)
                                }}>
                                    <input type="hidden" name="id" value={editingCustomer.id} />
                                    <div className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                            <Label>{t('form.fullName')}</Label>
                                            <Input name="full_name" defaultValue={editingCustomer.full_name} required />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>{t('form.phone')}</Label>
                                            <Input name="phone" defaultValue={editingCustomer.phone} required />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>{t('form.email')}</Label>
                                            <Input name="email" type="email" defaultValue={editingCustomer.email} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>{t('form.source')}</Label>
                                            <Input name="source" defaultValue={editingCustomer.source} />
                                        </div>
                                        <div className="pt-2 border-t mt-2">
                                            <Label className="text-blue-600 font-bold text-xs uppercase">{t('form.portalAccessTitle')}</Label>
                                            <div className="grid grid-cols-2 gap-4 mt-2">
                                                <div className="grid gap-2">
                                                    <Label className="text-xs">{t('form.username')}</Label>
                                                    <Input name="portal_username" defaultValue={editingCustomer.portal_username} placeholder={t('form.username')} />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label className="text-xs">{t('form.password')}</Label>
                                                    <Input name="portal_password" type="password" defaultValue={editingCustomer.portal_password} placeholder={t('form.password')} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button type="submit">{t('createModal.update')}</Button>
                                    </DialogFooter>
                                </form>
                            </TabsContent>
                            <TabsContent value="demands">
                                <CustomerDemands
                                    customerId={editingCustomer.id}
                                    demand={Array.isArray(editingCustomer.customer_demands) ? editingCustomer.customer_demands[0] : editingCustomer.customer_demands}
                                    onClose={() => setIsEditOpen(false)}
                                />
                            </TabsContent>
                        </Tabs>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
