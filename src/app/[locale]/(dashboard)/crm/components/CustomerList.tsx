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
import { cn } from '@/lib/utils'
import { UserPlus, Pencil, Trash, Mail, Phone, Tag, CalendarPlus, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createCustomer, updateCustomer, deleteCustomer } from '../actions'
import CustomerDemands from './CustomerDemands'
import { CustomerEditDialog, type Customer } from './CustomerEditDialog'
import { ActivityForm } from '@/components/activities/activity-form'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function CustomerList({ customers }: { customers: Customer[] }) {
    const t = useTranslations('Customers')
    const router = useRouter()
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [isActivityOpen, setIsActivityOpen] = useState(false)
    const [selectedCustomerForActivity, setSelectedCustomerForActivity] = useState<Customer | null>(null)
    const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null)
    const [isPending, setIsPending] = useState(false)

    const handleEditClick = (customer: Customer) => {
        setEditingCustomer(customer)
        setIsEditOpen(true)
    }

    const handleCreateActivity = (customer: Customer) => {
        setSelectedCustomerForActivity(customer)
        setIsActivityOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (!customerToDelete) return

        setIsPending(true)
        const formData = new FormData()
        formData.append('id', customerToDelete.id)

        try {
            await deleteCustomer(formData)
            toast.success(t('messages.deleted') || 'Müşteri başarıyla silindi')
            router.refresh()
            setCustomerToDelete(null)
        } catch (error) {
            toast.error('Müşteri silinirken bir hata oluştu.')
        } finally {
            setIsPending(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-2">
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button variant="default" className="shadow-lg shadow-blue-100 bg-blue-600 hover:bg-blue-700 h-11 px-6 rounded-xl font-bold transition-all active:scale-95 w-full md:w-auto">
                                <UserPlus className="mr-2 h-5 w-5" /> {t('addCustomer')}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg w-[95vw] rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
                            <DialogHeader className="p-6 bg-slate-50 border-b border-slate-100">
                                <DialogTitle className="text-xl font-black text-slate-900">{t('createModal.title')}</DialogTitle>
                            </DialogHeader>
                            <form action={async (formData) => {
                                setIsPending(true)
                                try {
                                    await createCustomer(formData)
                                    toast.success(t('messages.created') || 'Müşteri oluşturuldu')
                                    setIsCreateOpen(false)
                                    router.refresh()
                                } finally {
                                    setIsPending(false)
                                }
                            }}>
                                <div className="p-6">
                                    <Tabs defaultValue="general" className="w-full">
                                        <TabsList className="grid w-full grid-cols-2 mb-6 bg-slate-100 p-1 rounded-xl">
                                            <TabsTrigger value="general" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">{t('tabs.details')}</TabsTrigger>
                                            <TabsTrigger value="demands" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">{t('tabs.demands')}</TabsTrigger>
                                        </TabsList>
                                        <TabsContent value="general" forceMount={true} className="data-[state=inactive]:hidden space-y-4">
                                            <div className="grid gap-2">
                                                <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('form.fullName')}</Label>
                                                <Input name="full_name" required className="h-11 bg-slate-50 border-slate-200 focus:ring-blue-500 rounded-xl transition-all" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="grid gap-2">
                                                    <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('form.phone')}</Label>
                                                    <Input name="phone" required className="h-11 bg-slate-50 border-slate-200 focus:ring-blue-500 rounded-xl transition-all" />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('form.email')}</Label>
                                                    <Input name="email" type="email" className="h-11 bg-slate-50 border-slate-200 focus:ring-blue-500 rounded-xl transition-all" />
                                                </div>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('form.source')}</Label>
                                                <Input name="source" placeholder={t('form.sourcePlaceholder')} className="h-11 bg-slate-50 border-slate-200 focus:ring-blue-500 rounded-xl transition-all" />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('form.address')}</Label>
                                                <Textarea name="address" className="bg-slate-50 border-slate-200 focus:ring-blue-500 rounded-xl transition-all resize-none min-h-[80px]" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="grid gap-2">
                                                    <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('form.city')}</Label>
                                                    <Input name="city" className="h-11 bg-slate-50 border-slate-200 focus:ring-blue-500 rounded-xl transition-all" />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('form.district')}</Label>
                                                    <Input name="district" className="h-11 bg-slate-50 border-slate-200 focus:ring-blue-500 rounded-xl transition-all" />
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t mt-4">
                                                <Label className="text-blue-600 font-black text-[10px] uppercase tracking-widest">{t('form.portalAccess')}</Label>
                                                <div className="grid grid-cols-2 gap-4 mt-3">
                                                    <div className="grid gap-1.5">
                                                        <Label className="text-[10px] font-bold text-slate-400 ml-1">{t('form.username')}</Label>
                                                        <Input name="portal_username" placeholder={t('form.username')} className="h-10 bg-white border-slate-200 rounded-xl" />
                                                    </div>
                                                    <div className="grid gap-1.5">
                                                        <Label className="text-[10px] font-bold text-slate-400 ml-1">{t('form.password')}</Label>
                                                        <Input name="portal_password" type="password" placeholder={t('form.password')} className="h-10 bg-white border-slate-200 rounded-xl" />
                                                    </div>
                                                </div>
                                            </div>
                                        </TabsContent>
                                        <TabsContent value="demands" forceMount={true} className="data-[state=inactive]:hidden space-y-4">
                                            <div className="grid gap-4 py-2">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('form.minBudget')}</Label>
                                                        <Input name="min_price" type="number" placeholder="0" className="h-11 bg-slate-50 border-slate-200 rounded-xl" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('form.maxBudget')}</Label>
                                                        <Input name="max_price" type="number" placeholder="0" className="h-11 bg-slate-50 border-slate-200 rounded-xl" />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('form.roomCount')}</Label>
                                                    <div className="flex gap-2 flex-wrap">
                                                        {['1+1', '2+1', '3+1', '4+1', 'Villa'].map(type => (
                                                            <label key={type} className="flex items-center space-x-2 border border-slate-100 bg-slate-50/50 p-2.5 px-4 rounded-xl cursor-pointer hover:bg-white hover:border-blue-200 hover:shadow-sm transition-all">
                                                                <input
                                                                    type="checkbox"
                                                                    name="room_count"
                                                                    value={type}
                                                                    className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500"
                                                                />
                                                                <span className="text-sm font-bold text-slate-700">{type}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('form.location')}</Label>
                                                    <Input name="location_preference" placeholder={t('form.locationPlaceholder')} className="h-11 bg-slate-50 border-slate-200 rounded-xl" />
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('form.propertyType')}</Label>
                                                        <Select name="property_type">
                                                            <SelectTrigger className="h-11 bg-slate-50 border-slate-200 rounded-xl">
                                                                <SelectValue placeholder={t('form.select')} />
                                                            </SelectTrigger>
                                                            <SelectContent className="rounded-xl shadow-xl">
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
                                                        <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('form.investmentPurpose')}</Label>
                                                        <Select name="investment_purpose">
                                                            <SelectTrigger className="h-11 bg-slate-50 border-slate-200 rounded-xl">
                                                                <SelectValue placeholder={t('form.select')} />
                                                            </SelectTrigger>
                                                            <SelectContent className="rounded-xl shadow-xl">
                                                                <SelectItem value="Living">{t('purposes.Living')}</SelectItem>
                                                                <SelectItem value="Investment">{t('purposes.Investment')}</SelectItem>
                                                                <SelectItem value="Holiday">{t('purposes.Holiday')}</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('form.notes')}</Label>
                                                    <Textarea name="notes" placeholder={t('form.notesPlaceholder')} className="bg-slate-50 border-slate-200 rounded-xl resize-none min-h-[100px]" />
                                                </div>
                                            </div>
                                        </TabsContent>
                                    </Tabs>
                                </div>
                                <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100">
                                    <Button type="submit" disabled={isPending} className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-100 transition-all select-none">
                                        {isPending ? (
                                            <div className="flex items-center gap-2">
                                                <span className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full" />
                                                <span>{t('createModal.submitting') || 'Kaydediliyor...'}</span>
                                            </div>
                                        ) : t('createModal.submit')}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="relative w-full overflow-auto max-h-[calc(100vh-350px)]">
                    <Table>
                        <TableHeader className="bg-slate-50/80 sticky top-0 z-20">
                            <TableRow>
                                <TableHead className="w-[250px] font-bold text-[11px] uppercase tracking-wider text-slate-400">{t('table.fullName')}</TableHead>
                                <TableHead className="w-[150px] font-bold text-[11px] uppercase tracking-wider text-slate-400">{t('table.phone')}</TableHead>
                                <TableHead className="w-[200px] font-bold text-[11px] uppercase tracking-wider text-slate-400">{t('table.email')}</TableHead>
                                <TableHead className="w-[150px] font-bold text-[11px] uppercase tracking-wider text-slate-400">{t('table.source')}</TableHead>
                                <TableHead className="w-[120px] font-bold text-[11px] uppercase tracking-wider text-slate-400">{t('table.status')}</TableHead>
                                <TableHead className="w-[100px] text-right font-bold text-[11px] uppercase tracking-wider text-slate-400">{t('table.actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {customers && customers.length > 0 ? (
                                customers.map((c) => (
                                    <TableRow key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <TableCell className="py-4">
                                            <Link href={`/customers/${c.id}`} className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-black border border-blue-100 shadow-inner group-hover:scale-110 transition-transform">
                                                    {c.full_name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{c.full_name}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(c.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </Link>
                                        </TableCell>
                                        <TableCell className="font-bold text-slate-700 text-sm">{c.phone}</TableCell>
                                        <TableCell className="text-slate-500 text-sm font-medium">{c.email || '-'}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-slate-50 border-slate-200 text-slate-400 group-hover:bg-white group-hover:border-blue-200 group-hover:text-blue-600 transition-all">
                                                {c.source || '-'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {c.contract_customers && c.contract_customers.length > 0 ? (
                                                <Badge className="bg-blue-600 hover:bg-blue-700 text-[10px] font-black px-2 py-0.5 uppercase tracking-wide border-none shadow-sm shadow-blue-100">{t('badges.customer')}</Badge>
                                            ) : c.customer_demands && c.customer_demands.length > 0 ? (
                                                <Badge className="bg-emerald-600 hover:bg-emerald-700 text-[10px] font-black px-2 py-0.5 uppercase tracking-wide border-none shadow-sm shadow-emerald-100">{t('badges.lead')}</Badge>
                                            ) : (
                                                <Badge variant="secondary" className="bg-slate-100 text-slate-500 text-[10px] font-black px-2 py-0.5 uppercase tracking-wide border-none">{t('badges.contact')}</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right py-4">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl" onClick={() => handleCreateActivity(c)} title="Aktivite Ekle">
                                                    <CalendarPlus className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl" onClick={() => handleEditClick(c)} title={t('table.edit')}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl" onClick={() => setCustomerToDelete(c)} title={t('table.delete')}>
                                                    <Trash className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-48 text-muted-foreground bg-slate-50/30">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="h-12 w-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-300">
                                                <Users className="w-6 h-6" />
                                            </div>
                                            <span className="font-bold text-sm tracking-tight">{t('table.empty')}</span>
                                        </div>
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
                        <div key={c.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 relative overflow-hidden active:scale-[0.98] transition-all">
                            <div className="flex justify-between items-start">
                                <Link href={`/customers/${c.id}`} className="flex items-center gap-3">
                                    <div className="h-11 w-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-xs font-black shadow-lg shadow-blue-100">
                                        {c.full_name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-black text-slate-900 text-[16px] leading-tight uppercase tracking-tight">{c.full_name}</span>
                                        <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-0.5">
                                            {new Date(c.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </Link>
                                <div>
                                    {c.contract_customers && c.contract_customers.length > 0 ? (
                                        <Badge className="bg-blue-600 text-[9px] px-2 py-0.5 uppercase tracking-widest font-black border-none">{t('badges.customer')}</Badge>
                                    ) : (c.customer_demands && c.customer_demands.length > 0) ? (
                                        <Badge className="bg-emerald-600 text-[9px] px-2 py-0.5 uppercase tracking-widest font-black border-none">{t('badges.lead')}</Badge>
                                    ) : (
                                        <Badge variant="secondary" className="bg-slate-100 text-slate-400 text-[9px] px-2 py-0.5 uppercase tracking-widest font-black border-none">{t('badges.contact')}</Badge>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <div className="flex items-center gap-2.5 text-[13px] text-slate-600">
                                    <Phone className="h-3.5 w-3.5 text-blue-500" />
                                    <span className="font-bold">{c.phone}</span>
                                </div>
                                {c.email && (
                                    <div className="flex items-center gap-2.5 text-[13px] text-slate-600">
                                        <Mail className="h-3.5 w-3.5 text-blue-500" />
                                        <span className="truncate font-medium">{c.email}</span>
                                    </div>
                                )}
                                {c.source && (
                                    <div className="flex items-center gap-2.5 text-[13px] text-slate-600">
                                        <Tag className="h-3.5 w-3.5 text-blue-500" />
                                        <span className="font-bold text-[11px] uppercase tracking-wider">{c.source}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-between gap-2 pt-1">
                                <div className="flex gap-2 flex-1">
                                    <Button variant="outline" size="sm" className="h-10 px-4 rounded-xl flex-1 border-blue-100 text-blue-600 font-black text-xs uppercase transition-all active:scale-95" onClick={() => handleCreateActivity(c)}>
                                        <CalendarPlus className="h-4 w-4 mr-2" /> Aktivite
                                    </Button>
                                    <Button variant="outline" size="sm" className="h-10 px-4 rounded-xl flex-1 border-slate-200 text-slate-700 font-black text-xs uppercase transition-all active:scale-95" onClick={() => handleEditClick(c)}>
                                        <Pencil className="h-4 w-4 mr-2" /> Düzenle
                                    </Button>
                                </div>
                                <Button variant="ghost" size="icon" className="h-10 w-10 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-90" onClick={() => setCustomerToDelete(c)}>
                                    <Trash className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="p-12 text-center bg-slate-50/50 border border-slate-100 rounded-2xl flex flex-col items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-300">
                            <Users className="w-6 h-6" />
                        </div>
                        <p className="text-sm text-slate-400 font-bold tracking-tight">{t('table.empty')}</p>
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

            {/* Delete Confirmation */}
            <AlertDialog open={!!customerToDelete} onOpenChange={(open) => !open && setCustomerToDelete(null)}>
                <AlertDialogContent className="rounded-2xl border-none shadow-2xl p-0 overflow-hidden sm:max-w-[400px]">
                    <div className="p-8 space-y-4 text-center">
                        <div className="h-16 w-16 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-4 animate-bounce">
                            <AlertTriangle className="w-8 h-8" />
                        </div>
                        <AlertDialogHeader className="space-y-2">
                            <AlertDialogTitle className="text-xl font-black text-slate-900 leading-tight">
                                {t('deleteConfirmTitle') || 'Müşteriyi Sil'}
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-500 font-medium leading-relaxed">
                                <span className="text-slate-900 font-bold uppercase tracking-tight">"{customerToDelete?.full_name}"</span> {t('table.confirmDelete') || 'isimli müşteriyi kalıcı olarak silmek istediğinize emin misiniz?'}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                    </div>
                    <AlertDialogFooter className="p-6 bg-slate-50 flex flex-col sm:flex-row gap-2 border-t border-slate-100">
                        <AlertDialogCancel className="w-full sm:w-1/2 h-11 rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-white active:scale-95 transition-all outline-none">
                            {t('cancel') || 'Vazgeç'}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="w-full sm:w-1/2 h-11 rounded-xl bg-red-500 hover:bg-red-600 shadow-lg shadow-red-100 text-white font-bold active:scale-95 transition-all"
                            disabled={isPending}
                        >
                            {isPending ? (
                                <div className="flex items-center gap-2">
                                    <span className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full" />
                                    <span>{t('deleting') || 'Siliniyor...'}</span>
                                </div>
                            ) : (
                                t('deleteConfirmAction') || 'Evet, Sil'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
