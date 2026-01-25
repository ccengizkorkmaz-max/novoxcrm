import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { updateTenantProfile, inviteUser } from './actions'
import { FormImageUpload } from '@/components/ui/form-image-upload'
import { Building2, Users, Mail, FileText } from 'lucide-react'
import { PaymentTemplatesTab } from './templates/payment-templates-tab'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

export default async function SettingsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return <div>Unauthorized</div>

    // Get tenant info
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, tenants(name, logo_url)')
        .eq('id', user.id)
        .single()

    const tenant = profile?.tenants as any

    // Get all users in tenant
    const { data: users } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, created_at')
        .select('id, full_name, email, role, created_at')
        .eq('tenant_id', profile?.tenant_id)
        .order('created_at', { ascending: false })

    // Get templates
    const { data: templates } = await supabase
        .from('payment_plan_templates')
        .select('*')
        .order('created_at', { ascending: false })

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Ayarlar</h1>
                <p className="text-muted-foreground">Firma bilgilerinizi ve kullanıcılarınızı yönetin.</p>
            </div>

            <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid w-full max-w-2xl grid-cols-3">
                    <TabsTrigger value="profile">
                        <Building2 className="w-4 h-4 mr-2" />
                        Firma Profili
                    </TabsTrigger>
                    <TabsTrigger value="users">
                        <Users className="w-4 h-4 mr-2" />
                        Kullanıcılar
                    </TabsTrigger>
                    <TabsTrigger value="templates">
                        <FileText className="w-4 h-4 mr-2" />
                        Ödeme Şablonları
                    </TabsTrigger>
                </TabsList>

                {/* Tenant Profile Tab */}
                <TabsContent value="profile" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Firma Bilgileri</CardTitle>
                            <CardDescription>
                                Firma adınızı ve logonuzu güncelleyin.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form action={async (formData) => { await updateTenantProfile(formData) }} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Firma Adı</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        defaultValue={tenant?.name}
                                        placeholder="Örn: ABC Gayrimenkul"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Firma Logosu</Label>
                                    <FormImageUpload
                                        name="logo_url"
                                        defaultValue={tenant?.logo_url}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Logo, raporlarda ve teklif belgelerinde görünecektir.
                                    </p>
                                </div>

                                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                                    Değişiklikleri Kaydet
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* User Management Tab */}
                <TabsContent value="users" className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Kullanıcı Yönetimi</CardTitle>
                                <CardDescription>
                                    Firmadaki tüm kullanıcıları görüntüleyin ve yeni kullanıcı davet edin.
                                </CardDescription>
                            </div>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button className="bg-blue-600 hover:bg-blue-700">
                                        <Mail className="w-4 h-4 mr-2" />
                                        Kullanıcı Davet Et
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Yeni Kullanıcı Davet Et</DialogTitle>
                                        <DialogDescription>
                                            Kullanıcıya e-posta ile davetiye gönderilecektir.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <form action={async (formData) => { await inviteUser(formData) }}>
                                        <div className="grid gap-4 py-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="invite-name">Ad Soyad</Label>
                                                <Input id="invite-name" name="name" placeholder="Ahmet Yılmaz" required />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="invite-email">E-posta</Label>
                                                <Input id="invite-email" name="email" type="email" placeholder="ahmet@example.com" required />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="invite-role">Rol</Label>
                                                <select
                                                    id="invite-role"
                                                    name="role"
                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                >
                                                    <option value="user">Kullanıcı</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button type="submit">Davet Gönder</Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Ad Soyad</TableHead>
                                        <TableHead>E-posta</TableHead>
                                        <TableHead>Rol</TableHead>
                                        <TableHead>Kayıt Tarihi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users && users.length > 0 ? (
                                        users.map((u: any) => (
                                            <TableRow key={u.id}>
                                                <TableCell className="font-medium">{u.full_name || '-'}</TableCell>
                                                <TableCell>{u.email}</TableCell>
                                                <TableCell>
                                                    <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                                                        {u.role === 'admin' ? 'Admin' : 'Kullanıcı'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(u.created_at).toLocaleDateString('tr-TR')}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                                Kullanıcı bulunamadı.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Templates Tab */}
                <TabsContent value="templates" className="space-y-4">
                    <PaymentTemplatesTab templates={templates || []} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
