'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Trash2, FileText, Pencil } from 'lucide-react'
import { createPaymentPlanTemplate, deletePaymentPlanTemplate, updatePaymentPlanTemplate } from '../actions'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

export function PaymentTemplatesTab({ templates }: { templates: any[] }) {
    const [interims, setInterims] = useState<{ month: number, rate: number }[]>([])
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingTemplate, setEditingTemplate] = useState<any>(null)

    const addInterim = () => {
        setInterims([...interims, { month: 6, rate: 10 }])
    }

    const removeInterim = (index: number) => {
        const newInterims = [...interims]
        newInterims.splice(index, 1)
        setInterims(newInterims)
    }

    const updateInterim = (index: number, field: 'month' | 'rate', value: number) => {
        const newInterims = [...interims]
        newInterims[index] = { ...newInterims[index], [field]: value }
        setInterims(newInterims)
    }

    const handleCreateClick = () => {
        setEditingTemplate(null)
        setInterims([])
        setIsDialogOpen(true)
    }

    const handleEditClick = (template: any) => {
        setEditingTemplate(template)
        setInterims(template.interim_payment_structure && Array.isArray(template.interim_payment_structure) ? template.interim_payment_structure : [])
        setIsDialogOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (confirm('Bu şablonu silmek istediğinize emin misiniz?')) {
            await deletePaymentPlanTemplate(id)
        }
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Ödeme Planı Şablonları</CardTitle>
                    <CardDescription>
                        Sık kullanılan ödeme planlarını şablon olarak kaydedin.
                    </CardDescription>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={handleCreateClick}>
                            <Plus className="w-4 h-4 mr-2" />
                            Yeni Şablon
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl">
                        <DialogHeader>
                            <DialogTitle>{editingTemplate ? 'Şablonu Düzenle' : 'Yeni Ödeme Şablonu'}</DialogTitle>
                            <DialogDescription>
                                Peşinat ve taksit oranlarını {editingTemplate ? 'güncelleyin' : 'belirleyin'}.
                            </DialogDescription>
                        </DialogHeader>
                        <form action={async (formData) => {
                            formData.append('interims_json', JSON.stringify(interims))
                            if (editingTemplate) {
                                formData.append('id', editingTemplate.id)
                                await updatePaymentPlanTemplate(formData)
                            } else {
                                await createPaymentPlanTemplate(formData)
                            }
                            setIsDialogOpen(false)
                            setInterims([])
                            setEditingTemplate(null)
                        }}>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="t-name">Şablon Adı</Label>
                                    <Input
                                        id="t-name"
                                        name="name"
                                        placeholder="Örn: %50 Peşin Standart"
                                        defaultValue={editingTemplate?.name}
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="t-down">Peşinat Oranı (%)</Label>
                                        <Input
                                            id="t-down"
                                            name="down_payment_rate"
                                            type="number"
                                            defaultValue={editingTemplate?.down_payment_rate || "25"}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="t-install">Taksit Sayısı</Label>
                                        <Input
                                            id="t-install"
                                            name="installment_count"
                                            type="number"
                                            defaultValue={editingTemplate?.installment_count || "12"}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 border-t pt-2">
                                    <div className="flex justify-between items-center">
                                        <Label>Ara Ödemeler (Opsiyonel)</Label>
                                        <Button type="button" variant="outline" size="sm" onClick={addInterim}>
                                            <Plus className="w-3 h-3 mr-1" /> Ekle
                                        </Button>
                                    </div>
                                    <div className="space-y-2 max-h-[150px] overflow-auto">
                                        {interims.map((interim, idx) => (
                                            <div key={idx} className="flex gap-2 items-center">
                                                <div className="grid gap-1 flex-1">
                                                    <Input
                                                        type="number"
                                                        placeholder="Ay"
                                                        value={interim.month}
                                                        onChange={(e) => updateInterim(idx, 'month', Number(e.target.value))}
                                                    />
                                                </div>
                                                <div className="grid gap-1 flex-1">
                                                    <Input
                                                        type="number"
                                                        placeholder="Oran %"
                                                        value={interim.rate}
                                                        onChange={(e) => updateInterim(idx, 'rate', Number(e.target.value))}
                                                    />
                                                </div>
                                                <Button type="button" variant="ghost" size="icon" onClick={() => removeInterim(idx)}>
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>
                                        ))}
                                        {interims.length === 0 && (
                                            <p className="text-xs text-muted-foreground">Ara ödeme yok.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit">{editingTemplate ? 'Güncelle' : 'Oluştur'}</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Şablon Adı</TableHead>
                            <TableHead>Peşinat</TableHead>
                            <TableHead>Taksit</TableHead>
                            <TableHead>Ara Ödemeler</TableHead>
                            <TableHead className="text-right">İşlemler</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {templates && templates.length > 0 ? (
                            templates.map((t: any) => (
                                <TableRow key={t.id}>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-blue-500" />
                                        {t.name}
                                    </TableCell>
                                    <TableCell>%{t.down_payment_rate}</TableCell>
                                    <TableCell>{t.installment_count} Ay</TableCell>
                                    <TableCell>
                                        {t.interim_payment_structure && t.interim_payment_structure.length > 0 ? (
                                            <div className="text-xs text-muted-foreground space-y-1">
                                                {t.interim_payment_structure.map((i: any, k: number) => (
                                                    <div key={k}>{i.month}. Ay: %{i.rate}</div>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleEditClick(t)}>
                                                <Pencil className="h-4 w-4 text-muted-foreground hover:text-blue-500" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}>
                                                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                    Şablon bulunamadı.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
