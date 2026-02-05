
'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Trash2, Edit, Save, X } from 'lucide-react'
import { createUnitType, updateUnitType, deleteUnitType, initializeUnitTypes } from '../actions'
import { toast } from 'sonner'
import { Switch } from "@/components/ui/switch"

interface UnitType {
    id: string
    name: string
    description?: string
    order_index: number
    is_active: boolean
}

interface UnitTypesTabProps {
    unitTypes: UnitType[]
}

export default function UnitTypesTab({ unitTypes }: UnitTypesTabProps) {
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [isPending, setIsPending] = useState(false)

    async function handleCreate(formData: FormData) {
        setIsPending(true)
        const result = await createUnitType(formData)
        setIsPending(false)
        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success('Ünite tipi oluşturuldu')
            setIsCreateOpen(false)
        }
    }

    async function handleUpdate(formData: FormData) {
        setIsPending(true)
        const result = await updateUnitType(formData)
        setIsPending(false)
        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success('Güncellendi')
            setEditingId(null)
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Bu ünite tipini silmek istediğinize emin misiniz?')) return
        const result = await deleteUnitType(id)
        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success('Silindi')
        }
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Ünite Tipleri (Oda Sayıları)</CardTitle>
                    <CardDescription>
                        Sistemde kullanılacak daire/ünite tiplerini buradan yönetebilirsiniz (örn: 1+1, 2+1, Villa).
                    </CardDescription>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" /> Yeni Ekle
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Yeni Ünite Tipi Ekle</DialogTitle>
                            <DialogDescription>Listede görünecek ismi ve sıralamayı giriniz.</DialogDescription>
                        </DialogHeader>
                        <form action={handleCreate}>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="name" className="text-right">Tip Adı</Label>
                                    <Input id="name" name="name" placeholder="Örn: 5+1 Dubleks" className="col-span-3" required />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="order_index" className="text-right">Sıra No</Label>
                                    <Input id="order_index" name="order_index" type="number" defaultValue="100" className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="description" className="text-right">Açıklama</Label>
                                    <Input id="description" name="description" className="col-span-3" />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={isPending}>Kaydet</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Sıra</TableHead>
                            <TableHead>Tip Adı</TableHead>
                            <TableHead>Açıklama</TableHead>
                            <TableHead>Durum</TableHead>
                            <TableHead className="text-right">İşlemler</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {unitTypes.map((type) => (
                            <TableRow key={type.id}>
                                <TableCell>{type.order_index}</TableCell>
                                <TableCell className="font-medium">
                                    {editingId === type.id ? (
                                        <form id={`edit-form-${type.id}`} action={handleUpdate} className="flex gap-2">
                                            <input type="hidden" name="id" value={type.id} />
                                            <Input name="name" defaultValue={type.name} className="h-8" />
                                        </form>
                                    ) : (
                                        type.name
                                    )}
                                </TableCell>
                                <TableCell>
                                    {editingId === type.id ? (
                                        <Input form={`edit-form-${type.id}`} name="description" defaultValue={type.description || ''} className="h-8" />
                                    ) : (
                                        type.description || '-'
                                    )}
                                </TableCell>
                                <TableCell>
                                    {editingId === type.id ? (
                                        <div className="flex items-center gap-2">
                                            <input type="hidden" form={`edit-form-${type.id}`} name="active_val" value={type.is_active ? 'true' : 'false'} />
                                            {/* Simpler to just use native checkbox for form submit or handled separate logic, but for simplicity let's skip editing status inline for now or use select */}
                                            <select form={`edit-form-${type.id}`} name="is_active" defaultValue={String(type.is_active)} className="h-8 rounded border px-2 text-xs">
                                                <option value="true">Aktif</option>
                                                <option value="false">Pasif</option>
                                            </select>
                                        </div>
                                    ) : (
                                        <span className={`px-2 py-1 rounded text-xs ${type.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {type.is_active ? 'Aktif' : 'Pasif'}
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        {editingId === type.id ? (
                                            <>
                                                <Button size="sm" variant="ghost" type="submit" form={`edit-form-${type.id}`} disabled={isPending}>
                                                    <Save className="h-4 w-4 text-green-600" />
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                                <input form={`edit-form-${type.id}`} type="hidden" name="order_index" value={type.order_index} />
                                            </>
                                        ) : (
                                            <>
                                                <Button size="sm" variant="ghost" onClick={() => setEditingId(type.id)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={() => handleDelete(type.id)}>
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {unitTypes.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                    <div className="flex flex-col items-center gap-2">
                                        <span>Henüz ünite tipi tanımlanmamış.</span>
                                        <form action={async () => {
                                            await initializeUnitTypes()
                                        }}>
                                            <Button variant="outline" size="sm">
                                                Varsayılanları Yükle
                                            </Button>
                                        </form>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
