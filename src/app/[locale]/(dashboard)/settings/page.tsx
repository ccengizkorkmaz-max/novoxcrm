import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { updateTenantProfile } from './actions'
import { FormImageUpload } from '@/components/ui/form-image-upload'
import { Building2, Users, FileText } from 'lucide-react'
import UserManagementHeader from './components/UserManagementHeader'
import UserTableActions from './components/UserTableActions'
import TenantProfileForm from './components/TenantProfileForm'
import UsersTable from './components/UsersTable'
import RoleMatrix from './components/RoleMatrix'
import { PaymentTemplatesTab } from './templates/payment-templates-tab'
import { getTranslations, getLocale } from 'next-intl/server'

export default async function SettingsPage() {
    const supabase = await createClient()
    const t = await getTranslations('Settings')
    const locale = await getLocale()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return <div>Unauthorized</div>

    // 1. Get profile (Simple query, no join)
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('tenant_id, role, full_name, email')
        .eq('id', user.id)
        .single()

    if (profileError || !profile?.tenant_id) {
        return (
            <div className="p-4 border border-red-200 bg-red-50 text-red-700 rounded-md">
                <h2 className="font-bold">{t('profile.error')}</h2>
                <p>Oturum bilgileriniz yüklenemedi. Lütfen tekrar giriş yapın.</p>
            </div>
        )
    }

    // 2. Get tenant (Separate simple query)
    const { data: tenant } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', profile.tenant_id)
        .single()

    // 3. Get all users in tenant (Simple query)
    const { data: users } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, created_at')
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false })

    // Get templates
    const { data: templates } = await supabase
        .from('payment_plan_templates')
        .select('*')
        .order('created_at', { ascending: false })

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'admin': return t('users.roles.admin')
            case 'owner': return t('users.roles.owner')
            case 'manager': return t('users.roles.manager')
            case 'user': return t('users.roles.user')
            default: return role
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
                <p className="text-muted-foreground">{t('subtitle')}</p>
            </div>

            <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid w-full max-w-2xl grid-cols-3">
                    <TabsTrigger value="profile">
                        <Building2 className="w-4 h-4 mr-2" />
                        {t('tabs.profile')}
                    </TabsTrigger>
                    <TabsTrigger value="users">
                        <Users className="w-4 h-4 mr-2" />
                        {t('tabs.users')}
                    </TabsTrigger>
                    <TabsTrigger value="templates">
                        <FileText className="w-4 h-4 mr-2" />
                        {t('tabs.templates')}
                    </TabsTrigger>
                </TabsList>

                {/* Tenant Profile Tab */}
                <TabsContent value="profile" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('profile.title')}</CardTitle>
                            <CardDescription>
                                {t('profile.description')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {tenant ? (
                                <TenantProfileForm
                                    tenant={tenant}
                                    userCount={users?.length || 0}
                                />
                            ) : (
                                <div className="p-4 border border-yellow-200 bg-yellow-50 text-yellow-700 rounded-md">
                                    <p>Şirket bilgileri yüklenemedi. Lütfen RLS yetkilerini kontrol edin.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* User Management Tab */}
                <TabsContent value="users" className="space-y-4">
                    <Card>
                        <UserManagementHeader />
                        <CardContent>
                            <UsersTable users={users || []} currentUserRole={profile?.role || 'user'} />
                            <RoleMatrix />
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
