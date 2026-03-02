'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Mail, Server, Edit, Trash2 } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { EmailAccountFormModal } from './EmailAccountFormModal'
import { deleteEmailAccount } from '../actions'
import { toast } from 'sonner'
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

export default function EmailAccountsTab({ accounts }: { accounts: any[] }) {
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [selectedAccount, setSelectedAccount] = useState<any>(null)
    const [accountToDelete, setAccountToDelete] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const handleEdit = (account: any) => {
        setSelectedAccount(account)
        setIsFormOpen(true)
    }

    const handleCreate = () => {
        setSelectedAccount(null)
        setIsFormOpen(true)
    }

    const handleDelete = async () => {
        if (!accountToDelete) return

        setIsDeleting(true)
        const res = await deleteEmailAccount(accountToDelete)
        setIsDeleting(false)
        setAccountToDelete(null)

        if (res?.error) {
            toast.error(res.error)
        } else {
            toast.success("E-posta hesabı başarıyla silindi.")
        }
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-xl">E-posta Hesapları</CardTitle>
                    <CardDescription>
                        Sistemden e-posta göndermek ve almak için kullanılan hesapları yönetin (SMTP, IMAP, POP3).
                    </CardDescription>
                </div>
                <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Yeni Hesap
                </Button>
            </CardHeader>
            <CardContent>
                {accounts && accounts.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Hesap Adı</TableHead>
                                <TableHead>E-posta Adresi</TableHead>
                                <TableHead>SMTP</TableHead>
                                <TableHead>Gelen (POP3/IMAP)</TableHead>
                                <TableHead>Durum</TableHead>
                                <TableHead className="text-right">İşlemler</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {accounts.map((acc: any) => (
                                <TableRow key={acc.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-slate-500" />
                                            {acc.account_name}
                                            {acc.is_default && (
                                                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                                    Varsayılan
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>{acc.email_address}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-xs text-muted-foreground">
                                            <span>{acc.smtp_host}</span>
                                            <span>Port: {acc.smtp_port} ({acc.smtp_encryption})</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-xs text-muted-foreground">
                                            <span>{acc.incoming_host}</span>
                                            <span>{acc.incoming_protocol} Port: {acc.incoming_port} ({acc.incoming_encryption})</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {acc.is_active ? (
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                Aktif
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="bg-slate-100 text-slate-500">
                                                Pasif
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(acc)}>
                                            <Edit className="w-4 h-4 text-slate-500" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => setAccountToDelete(acc.id)}>
                                            <Trash2 className="w-4 h-4 text-red-500 hover:text-red-600 hover:bg-red-50" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                        <Server className="w-8 h-8 mx-auto text-slate-400 mb-3" />
                        <h3 className="text-lg font-medium text-slate-900">Henüz e-posta hesabı eklenmemiş</h3>
                        <p className="text-slate-500 mt-1 max-w-sm mx-auto">
                            Gelen ve giden e-postalarınızın düzgün çalışabilmesi için SMTP veya IMAP/POP3 bilgilerinizi girerek yeni bir hesap ekleyin.
                        </p>
                        <Button onClick={handleCreate} variant="outline" className="mt-4">
                            Hemen Ekle
                        </Button>
                    </div>
                )}
            </CardContent>

            {isFormOpen && (
                <EmailAccountFormModal
                    isOpen={isFormOpen}
                    onClose={() => setIsFormOpen(false)}
                    account={selectedAccount}
                />
            )}

            <AlertDialog open={!!accountToDelete} onOpenChange={(open) => !open && setAccountToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>E-posta Hesabını Sil</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bu e-posta hesabını kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve e-posta entegrasyonlarını etkileyebilir.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>İptal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {isDeleting ? "Siliniyor..." : "Evet, Sil"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    )
}
