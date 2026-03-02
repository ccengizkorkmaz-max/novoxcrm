'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { saveEmailAccount } from '../actions'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function EmailAccountFormModal({ isOpen, onClose, account }: { isOpen: boolean, onClose: () => void, account: any }) {
    const isEdit = !!account
    const [isLoading, setIsLoading] = useState(false)

    // Form states
    const [accountName, setAccountName] = useState(account?.account_name || (isEdit ? '' : 'Ana Hesap'))
    const [emailAddress, setEmailAddress] = useState(account?.email_address || (isEdit ? '' : 'info@novosirketlergrubu.com'))

    // SMTP
    const [smtpHost, setSmtpHost] = useState(account?.smtp_host || 'srvc197.trwww.com')
    const [smtpPort, setSmtpPort] = useState<number>(account?.smtp_port || 465)
    const [smtpUser, setSmtpUser] = useState(account?.smtp_user || (isEdit ? '' : 'info@novosirketlergrubu.com'))
    const [smtpPassword, setSmtpPassword] = useState(account?.smtp_password || (isEdit ? '' : 'Ur1!1ybN'))
    const [smtpEncryption, setSmtpEncryption] = useState(account?.smtp_encryption || 'SSL')

    // Incoming
    const [incomingProtocol, setIncomingProtocol] = useState(account?.incoming_protocol || 'POP3')
    const [incomingHost, setIncomingHost] = useState(account?.incoming_host || 'srvc197.trwww.com')
    const [incomingPort, setIncomingPort] = useState<number>(account?.incoming_port || (incomingProtocol === 'POP3' ? 995 : 993))
    const [incomingUser, setIncomingUser] = useState(account?.incoming_user || (isEdit ? '' : 'info@novosirketlergrubu.com'))
    const [incomingPassword, setIncomingPassword] = useState(account?.incoming_password || (isEdit ? '' : 'Ur1!1ybN'))
    const [incomingEncryption, setIncomingEncryption] = useState(account?.incoming_encryption || 'SSL')

    const [isActive, setIsActive] = useState(account?.is_active ?? true)
    const [isDefault, setIsDefault] = useState(account?.is_default ?? true)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!accountName || !emailAddress) {
            toast.error("Hesap Adı ve E-posta adresi zorunludur.")
            return
        }

        setIsLoading(true)
        const payload = {
            id: account?.id,
            account_name: accountName,
            email_address: emailAddress,
            smtp_host: smtpHost,
            smtp_port: Number(smtpPort),
            smtp_user: smtpUser,
            smtp_password: smtpPassword,
            smtp_encryption: smtpEncryption,

            incoming_host: incomingHost,
            incoming_port: Number(incomingPort),
            incoming_user: incomingUser,
            incoming_password: incomingPassword,
            incoming_protocol: incomingProtocol,
            incoming_encryption: incomingEncryption,

            is_active: isActive,
            is_default: isDefault
        }

        const res = await saveEmailAccount(payload as any)
        setIsLoading(false)

        if (res?.error) {
            toast.error(res.error)
        } else {
            toast.success(isEdit ? "E-posta hesabı güncellendi." : "Yeni e-posta hesabı eklendi.")
            onClose()
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'E-posta Hesabını Düzenle' : 'Yeni E-posta Hesabı Ekle'}</DialogTitle>
                    <DialogDescription>
                        Kurumsal e-posta hesabınızın giden (SMTP) ve gelen (POP3/IMAP) sunucu bilgilerini girin.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="account_name">Hesap Adı (örn: Satış, Destek)</Label>
                            <Input
                                id="account_name"
                                value={accountName}
                                onChange={e => setAccountName(e.target.value)}
                                placeholder="Örn: Ana Hesap"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email_address">E-posta Adresi</Label>
                            <Input
                                id="email_address"
                                type="email"
                                value={emailAddress}
                                onChange={e => {
                                    setEmailAddress(e.target.value)
                                    // Auto-fill users if empty
                                    if (!smtpUser) setSmtpUser(e.target.value)
                                    if (!incomingUser) setIncomingUser(e.target.value)
                                }}
                                placeholder="info@ornek.com"
                                required
                            />
                        </div>
                    </div>

                    <Tabs defaultValue="smtp" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="smtp">Giden Sunucu (SMTP)</TabsTrigger>
                            <TabsTrigger value="incoming">Gelen Sunucu (IMAP/POP3)</TabsTrigger>
                        </TabsList>

                        <TabsContent value="smtp" className="space-y-4 pt-4 bg-muted/30 p-4 border rounded-xl mt-2">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="space-y-2 col-span-2">
                                    <Label htmlFor="smtp_host">Sunucu Adresi</Label>
                                    <Input id="smtp_host" value={smtpHost} onChange={e => setSmtpHost(e.target.value)} placeholder="mail.ornek.com" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="smtp_port">Port</Label>
                                    <Input id="smtp_port" type="number" value={smtpPort} onChange={e => setSmtpPort(Number(e.target.value))} placeholder="465" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="smtp_encryption">Protokol</Label>
                                    <Select value={smtpEncryption} onValueChange={(val) => setSmtpEncryption(val)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="SSL">SSL</SelectItem>
                                            <SelectItem value="TLS">TLS</SelectItem>
                                            <SelectItem value="None">Hiçbiri</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="smtp_user">Kullanıcı Adı (Email)</Label>
                                    <Input id="smtp_user" value={smtpUser} onChange={e => setSmtpUser(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="smtp_password">Şifre</Label>
                                    <Input id="smtp_password" type="password" value={smtpPassword} onChange={e => setSmtpPassword(e.target.value)} />
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="incoming" className="space-y-4 pt-4 bg-muted/30 p-4 border rounded-xl mt-2">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="incoming_protocol">Tür</Label>
                                    <Select value={incomingProtocol} onValueChange={(val) => {
                                        setIncomingProtocol(val)
                                        setIncomingPort(val === 'POP3' ? 995 : 993)
                                    }}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="POP3">POP3</SelectItem>
                                            <SelectItem value="IMAP">IMAP</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="space-y-2 col-span-2">
                                    <Label htmlFor="incoming_host">Sunucu Adresi</Label>
                                    <Input id="incoming_host" value={incomingHost} onChange={e => setIncomingHost(e.target.value)} placeholder="mail.ornek.com" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="incoming_port">Port</Label>
                                    <Input id="incoming_port" type="number" value={incomingPort} onChange={e => setIncomingPort(Number(e.target.value))} placeholder="995" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="incoming_encryption">Protokol</Label>
                                    <Select value={incomingEncryption} onValueChange={(val) => setIncomingEncryption(val)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="SSL">SSL</SelectItem>
                                            <SelectItem value="TLS">TLS</SelectItem>
                                            <SelectItem value="None">Hiçbiri</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="incoming_user">Kullanıcı Adı (Email)</Label>
                                    <Input id="incoming_user" value={incomingUser} onChange={e => setIncomingUser(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="incoming_password">Şifre</Label>
                                    <Input id="incoming_password" type="password" value={incomingPassword} onChange={e => setIncomingPassword(e.target.value)} />
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>

                    <div className="flex gap-6 pt-4 border-t">
                        <div className="flex items-center gap-2">
                            <Switch id="is_active" checked={isActive} onCheckedChange={setIsActive} />
                            <Label htmlFor="is_active" className="cursor-pointer">Hesap Aktif</Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch id="is_default" checked={isDefault} onCheckedChange={setIsDefault} />
                            <Label htmlFor="is_default" className="cursor-pointer">Varsayılan Hesap Olarak Kullan</Label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                            Vazgeç
                        </Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isLoading}>
                            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {isEdit ? 'Güncelle' : 'Kaydet'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
