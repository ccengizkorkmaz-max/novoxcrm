'use client'

import { useState } from 'react'
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
import { Plus } from 'lucide-react'
import { createActivity, completeActivity } from '../activities/actions'

import { Combobox } from '@/components/ui/combobox'

export default function ActivitiesTab({ activities, customers }: { activities: any[], customers: any[] }) {
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [selectedCustomerId, setSelectedCustomerId] = useState("")

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> Yeni Aktivite</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Aktivite Planla</DialogTitle>
                        </DialogHeader>
                        <form action={async (formData) => {
                            await createActivity(formData)
                            setIsCreateOpen(false)
                        }}>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label>Müşteri</Label>
                                    <Combobox
                                        items={customers?.map((c: any) => ({ value: c.id, label: c.full_name })) || []}
                                        value={selectedCustomerId}
                                        onChange={setSelectedCustomerId}
                                        placeholder="Müşteri Seçiniz..."
                                        searchPlaceholder="Müşteri Ara..."
                                        emptyText="Müşteri bulunamadı."
                                    />
                                    <input type="hidden" name="customer_id" value={selectedCustomerId} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Tip</Label>
                                    <select name="type" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required>
                                        <option value="Phone">Telefon Araması</option>
                                        <option value="Meeting">Toplantı</option>
                                        <option value="Visit">Ziyaret</option>
                                        <option value="Email">Email</option>
                                    </select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Konu / Özet</Label>
                                    <Input name="summary" placeholder="Örn: Proje tanıtımı yapılacak" required />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Tarih/Saat</Label>
                                    <Input name="due_date" type="datetime-local" required />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Notlar</Label>
                                    <Input name="notes" />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit">Planla</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tarih</TableHead>
                            <TableHead>Müşteri</TableHead>
                            <TableHead>Tip</TableHead>
                            <TableHead>Konu</TableHead>
                            <TableHead>Durum</TableHead>
                            <TableHead className="text-right">İşlem</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {activities && activities.length > 0 ? (
                            activities.map((act: any) => (
                                <TableRow key={act.id}>
                                    <TableCell className="font-medium">
                                        {act.due_date ? new Date(act.due_date).toLocaleString('tr-TR') : '-'}
                                    </TableCell>
                                    <TableCell>{act.customers?.full_name}</TableCell>
                                    <TableCell>{act.type}</TableCell>
                                    <TableCell>{act.summary}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs ${act.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {act.status === 'Completed' ? 'Tamamlandı' : 'Planlandı'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {act.status !== 'Completed' && (
                                            <form action={completeActivity}>
                                                <input type="hidden" name="id" value={act.id} />
                                                <Button size="sm" variant="outline" type="submit">Tamamla</Button>
                                            </form>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground">Planlanmış aktivite yok.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div >
    )
}
