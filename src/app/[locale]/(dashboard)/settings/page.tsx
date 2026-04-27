
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
import { Building2, Users, FileText, Database, Banknote, Bell, Brain, Mail, MessageSquare, Globe } from 'lucide-react'
import UserManagementHeader from './components/UserManagementHeader'
import UserTableActions from './components/UserTableActions'
import TenantProfileForm from './components/TenantProfileForm'
import UsersTable from './components/UsersTable'
import RoleMatrix from './components/RoleMatrix'
import DataImportTab from './components/DataImportTab'
import { PaymentTemplatesTab } from './templates/payment-templates-tab'
import { getTranslations, getLocale } from 'next-intl/server'
import UnitTypesTab from './components/UnitTypesTab'
import CommissionRulesTab from './components/CommissionRulesTab'
import NotificationSettingsTab from './components/NotificationSettingsTab'
import AiSettingsTab from './components/AiSettingsTab'
import EmailAccountsTab from './components/EmailAccountsTab'
import SmsSettingsTab from './components/SmsSettingsTab'
import { FinancialSettingsTab } from './components/FinancialSettingsTab'
import { SystemLogsTab } from './components/SystemLogsTab'
import SeoSettingsTab from './components/SeoSettingsTab'
import { FileWarning } from 'lucide-react'

export default async function SettingsPage() {
    const supabase = await createClient()
    const t = await getTranslations('Settings')
    const locale = await getLocale()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return <div>Unauthorized</div>

    // 1. Get profile
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

    // 2. Get tenant
    const { data: tenant } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', profile.tenant_id)
        .single()

    // 3. Get all users
    const { data: users } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, created_at, is_external, is_active')
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false })

    // Get templates
    const { data: templates } = await supabase
        .from('payment_plan_templates')
        .select('*')
        .order('created_at', { ascending: false })

    // Get unit types
    const { data: unitTypes } = await supabase
        .from('unit_types')
        .select('*')
        .order('order_index', { ascending: true })

    // Get Commission Rules
    const { data: commissionRules } = await supabase
        .from('commission_rules')
        .select('*')
        .order('source_category', { ascending: true })

    // Get Notification Settings
    const { data: notificationSettings } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .single()

    // Get Email Accounts
    const { data: emailAccounts } = await supabase
        .from('tenant_email_accounts')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false })

    // Get System Logs
    const { data: systemLogs, error: logsError } = await supabase
        .from('system_logs')
        .select('*, profiles(full_name)')
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false })
        .limit(100)
    
    // Check if the table exists (42P01 = undefined_table)
    const hasLogsTableError = logsError?.code === '42P01' || logsError?.code === 'PGRST205'

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
                <TabsList className="flex w-full h-auto p-1 bg-slate-100/50 rounded-xl justify-start gap-1 overflow-x-auto mb-2">
                    <TabsTrigger value="profile" className="flex-1 md:flex-none py-2.5 px-4 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">
                        <Building2 className="w-4 h-4 mr-2" />
                        {t('tabs.profile')}
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="flex-1 md:flex-none py-2.5 px-4 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">
                        <Bell className="w-4 h-4 mr-2" />
                        Bildirimler
                    </TabsTrigger>
                    <TabsTrigger value="users" className="flex-1 md:flex-none py-2.5 px-4 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">
                        <Users className="w-4 h-4 mr-2" />
                        {t('tabs.users')}
                    </TabsTrigger>
                    <TabsTrigger value="email" className="flex-1 md:flex-none py-2.5 px-4 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">
                        <Mail className="w-4 h-4 mr-2" />
                        E-posta İşlemleri
                    </TabsTrigger>
                    <TabsTrigger value="templates" className="flex-1 md:flex-none py-2.5 px-4 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">
                        <FileText className="w-4 h-4 mr-2" />
                        {t('tabs.templates')}
                    </TabsTrigger>
                    <TabsTrigger value="definitions" className="flex-1 md:flex-none py-2.5 px-4 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">
                        <Database className="w-4 h-4 mr-2" />
                        Tanımlar
                    </TabsTrigger>
                    <TabsTrigger value="financial" className="flex-1 md:flex-none py-2.5 px-4 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">
                        <Banknote className="w-4 h-4 mr-2" />
                        Finansal
                    </TabsTrigger>
                    <TabsTrigger value="data" className="flex-1 md:flex-none py-2.5 px-4 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">
                        <Database className="w-4 h-4 mr-2" />
                        {t('tabs.data')}
                    </TabsTrigger>
                    <TabsTrigger value="commissions" className="flex-1 md:flex-none py-2.5 px-4 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">
                        <Banknote className="w-4 h-4 mr-2" />
                        Primler
                    </TabsTrigger>
                    <TabsTrigger value="ai" className="flex-1 md:flex-none py-2.5 px-4 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">
                        <Brain className="w-4 h-4 mr-2" />
                        {t('tabs.ai')}
                    </TabsTrigger>
                    <TabsTrigger value="sms" className="flex-1 md:flex-none py-2.5 px-4 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        SMS Ayarları
                    </TabsTrigger>
                    <TabsTrigger value="seo" className="flex-1 md:flex-none py-2.5 px-4 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">
                        <Globe className="w-4 h-4 mr-2" />
                        SEO
                    </TabsTrigger>
                    <TabsTrigger value="logs" className="flex-1 md:flex-none py-2.5 px-4 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all focus:outline-none">
                        <FileWarning className="w-4 h-4 mr-2" />
                        İşlem Logları
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

                {/* Notification Settings Tab */}
                <TabsContent value="notifications" className="space-y-4">
                    <NotificationSettingsTab settings={notificationSettings} />
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

                {/* Email Accounts Tab */}
                <TabsContent value="email" className="space-y-4">
                    <EmailAccountsTab accounts={emailAccounts || []} />
                </TabsContent>

                {/* Templates Tab */}
                <TabsContent value="templates" className="space-y-4">
                    <PaymentTemplatesTab templates={templates || []} />
                </TabsContent>

                {/* Definitions Tab */}
                <TabsContent value="definitions" className="space-y-4">
                    <div className="text-xs text-muted-foreground">
                        Debug: {unitTypes ? unitTypes.length : 0} types found.
                    </div>
                    <UnitTypesTab unitTypes={unitTypes || []} />
                </TabsContent>

                {/* Financial Settings Tab */}
                <TabsContent value="financial" className="space-y-4">
                    <FinancialSettingsTab tenant={tenant as any} />
                </TabsContent>

                {/* Data Management Tab */}
                <TabsContent value="data" className="space-y-4">
                    <DataImportTab />
                </TabsContent>

                {/* Commission Rules Tab */}
                <TabsContent value="commissions" className="space-y-4">
                    <CommissionRulesTab rules={commissionRules || []} />
                </TabsContent>

                {/* AI Settings Tab */}
                <TabsContent value="ai" className="space-y-4">
                    <AiSettingsTab tenant={tenant as any} />
                </TabsContent>

                {/* SMS Settings Tab */}
                <TabsContent value="sms" className="space-y-4">
                    <SmsSettingsTab tenant={tenant as any} />
                </TabsContent>

                {/* SEO Settings Tab */}
                <TabsContent value="seo" className="space-y-4">
                    <SeoSettingsTab />
                </TabsContent>

                {/* System Logs Tab */}
                <TabsContent value="logs" className="space-y-4">
                    <SystemLogsTab 
                        initialLogs={systemLogs || []} 
                        hasError={hasLogsTableError} 
                    />
                </TabsContent>
            </Tabs>

        </div>
    )
}
