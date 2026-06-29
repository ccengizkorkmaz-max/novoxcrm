'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Mail, Server, Edit, Trash2, Eye, Send, Code } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { EmailAccountFormModal } from './EmailAccountFormModal'
import { deleteEmailAccount, updateAiSettings, sendTestCatalogEmailAction } from '../actions'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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

export default function EmailAccountsTab({ accounts, tenant, projects = [] }: { accounts: any[], tenant?: any, projects?: any[] }) {
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [selectedAccount, setSelectedAccount] = useState<any>(null)
    const [accountToDelete, setAccountToDelete] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isSavingTemplate, setIsSavingTemplate] = useState(false)
    const [htmlContent, setHtmlContent] = useState(tenant?.catalog_email_html || '')

    // Test email states
    const [testEmail, setTestEmail] = useState('')
    const [testProjectId, setTestProjectId] = useState(projects[0]?.id || '')
    const [isSendingTest, setIsSendingTest] = useState(false)

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

    const getPreviewHtml = (rawHtml: string) => {
        const mockLinks = `
        <div style="text-align: center; margin: 15px 0;">
            <a href="#" style="display: inline-block; padding: 12px 24px; background-color: #0f172a; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; margin: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); font-family: sans-serif;">Tanıtım Kataloğu (PDF) İndir</a>
            <a href="#" style="display: inline-block; padding: 12px 24px; background-color: #0f172a; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; margin: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); font-family: sans-serif;">Kat Planları İndir</a>
        </div>
        `;
        return (rawHtml || '')
            .replace(/{project_name}/g, 'NOVO Park Viva Körfez')
            .replace(/{tenant_name}/g, 'Novo Şirketler Grubu')
            .replace(/{document_links}/g, mockLinks);
    };

    const handleSendTest = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!testEmail) {
            toast.error('Lütfen bir test e-posta adresi girin.')
            return
        }
        if (!testProjectId) {
            toast.error('Lütfen test kataloğu için bir proje seçin.')
            return
        }

        setIsSendingTest(true)
        try {
            const res = await sendTestCatalogEmailAction(testEmail, testProjectId)
            if (res?.error) {
                toast.error(res.error)
            } else {
                toast.success(res.message || 'Test e-postası başarıyla gönderildi.')
            }
        } catch (err: any) {
            toast.error('Test gönderimi başarısız: ' + err.message)
        } finally {
            setIsSendingTest(false)
        }
    }

    return (
        <div className="space-y-6">
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

            {tenant && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Mail className="h-5 w-5 text-blue-600" />
                            Katalog E-Posta Şablonu
                        </CardTitle>
                        <CardDescription>
                            Müşterilere asistanlar (WhatsApp veya Sesli Arama) tarafından otomatik gönderilecek katalog/broşür e-postasını düzenleyin. Değişiklikler canlı önizlemede anında yansır.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Editor Panel */}
                            <div className="space-y-4">
                                <form
                                    action={async (formData) => {
                                        setIsSavingTemplate(true)
                                        try {
                                            const res = await updateAiSettings(formData)
                                            if (res?.error) {
                                                toast.error(res.error)
                                            } else {
                                                toast.success('Katalog e-posta şablonu başarıyla güncellendi.')
                                            }
                                        } catch (e: any) {
                                            toast.error('Güncelleme sırasında bir hata oluştu: ' + e.message)
                                        } finally {
                                            setIsSavingTemplate(false)
                                        }
                                    }}
                                    className="space-y-4"
                                >
                                    <div className="space-y-2">
                                        <Label htmlFor="catalog_email_subject" className="text-sm font-medium">E-Posta Konusu</Label>
                                        <Input
                                            id="catalog_email_subject"
                                            name="catalog_email_subject"
                                            defaultValue={tenant.catalog_email_subject || '{project_name} - Proje Kataloğu ve Bilgileri'}
                                            placeholder="Örn: {project_name} - Proje Kataloğu"
                                            className="bg-white"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="catalog_email_html" className="text-sm font-medium">E-Posta HTML Şablonu</Label>
                                        <Textarea
                                            id="catalog_email_html"
                                            name="catalog_email_html"
                                            value={htmlContent}
                                            onChange={(e) => setHtmlContent(e.target.value)}
                                            placeholder="HTML formatında e-posta şablonu..."
                                            rows={12}
                                            className="bg-white font-mono text-xs"
                                        />
                                        <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-[11px] text-slate-600 space-y-1">
                                            <p className="font-semibold flex items-center gap-1">
                                                <Code className="h-3 w-3" /> Kullanılabilir Değişkenler:
                                            </p>
                                            <ul className="list-disc pl-4 space-y-0.5 font-mono">
                                                <li>{"{project_name}"} - Projenin adı</li>
                                                <li>{"{tenant_name}"} - Kurumunuzun adı</li>
                                                <li>{"{document_links}"} - Projenin yayındaki broşür/katalog indirme linkleri (renkli butonlar şeklinde yerleşir)</li>
                                            </ul>
                                        </div>
                                    </div>
                                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white w-full" disabled={isSavingTemplate}>
                                        {isSavingTemplate ? 'Kaydediliyor...' : 'Şablonu Kaydet'}
                                    </Button>
                                </form>

                                {/* Test Mail Box */}
                                <div className="border-t border-slate-100 pt-4 mt-2">
                                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5 text-slate-700">
                                        <Send className="h-3.5 w-3.5" /> Test E-postası Gönder
                                    </h4>
                                    <form onSubmit={handleSendTest} className="space-y-3">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            <div className="space-y-1">
                                                <Label htmlFor="test_email" className="text-xs text-slate-500">Test Alıcı E-postası</Label>
                                                <Input
                                                    id="test_email"
                                                    type="email"
                                                    value={testEmail}
                                                    onChange={(e) => setTestEmail(e.target.value)}
                                                    placeholder="test@example.com"
                                                    className="h-9 bg-white"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label htmlFor="test_project" className="text-xs text-slate-500">Referans Proje</Label>
                                                <select
                                                    id="test_project"
                                                    value={testProjectId}
                                                    onChange={(e) => setTestProjectId(e.target.value)}
                                                    className="h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                                >
                                                    <option value="">Proje Seçin</option>
                                                    {projects.map((p: any) => (
                                                        <option key={p.id} value={p.id}>{p.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <Button type="submit" variant="outline" className="w-full text-xs h-9" disabled={isSendingTest}>
                                            {isSendingTest ? 'Gönderiliyor...' : 'Şablonu Test Et ve Gönder'}
                                        </Button>
                                    </form>
                                </div>
                            </div>

                            {/* Live Preview Panel */}
                            <div className="flex flex-col h-full min-h-[400px] border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                                <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex items-center justify-between text-xs font-semibold text-slate-600">
                                    <span className="flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" /> Canlı Önizleme</span>
                                    <span className="text-[10px] text-slate-400 font-normal">Mock Verilerle Gösterim</span>
                                </div>
                                <div className="flex-1 p-2 bg-slate-200/50">
                                    <iframe
                                        title="Katalog E-posta Önizleme"
                                        srcDoc={getPreviewHtml(htmlContent)}
                                        className="w-full h-full min-h-[380px] bg-white rounded border border-slate-300 shadow-sm"
                                        sandbox="allow-same-origin"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
