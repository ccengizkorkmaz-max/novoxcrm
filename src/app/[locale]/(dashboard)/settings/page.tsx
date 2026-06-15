
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
import { Building2, Users, FileText, Database, Banknote, Bell, Brain, Mail, MessageSquare, Globe, Phone } from 'lucide-react'
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
import SipSettingsTab from './components/SipSettingsTab'
import { FinancialSettingsTab } from './components/FinancialSettingsTab'
import { SystemLogsTab } from './components/SystemLogsTab'
import SeoSettingsTab from './components/SeoSettingsTab'
import BrandSettingsTab from './components/BrandSettingsTab'
import DomainSettingsTab from './components/DomainSettingsTab'
import UnitFieldOptionsTab from './components/UnitFieldOptionsTab'
import NotificationCatalogTab from './components/NotificationCatalogTab'
import { FileWarning, Palette, Link2, ListChecks } from 'lucide-react'

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
        .select('id, full_name, email, role, created_at, is_external, is_active, is_hot_lead_manager, phone')
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false })

    // Get templates
    const { data: templates } = await supabase
        .from('payment_plan_templates')
        .select('*, projects(name)')
        .order('created_at', { ascending: false })

    // Get Projects for template form
    const { data: projects } = await supabase
        .from('projects')
        .select('id, name')
        .order('name')

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

    // Get Unit Field Options
    const { data: unitFieldOptions } = await supabase
        .from('unit_field_options')
        .select('*')
        .eq('tenant_id', profile.tenant_id)

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

            <Tabs defaultValue="profile" className="w-full" orientation="vertical">
                <div className="flex flex-col md:flex-row gap-6">
                {/* Vertical Tab Navigation */}
                <TabsList className="flex flex-row md:flex-col h-auto p-1.5 bg-white border rounded-xl md:w-56 md:shrink-0 md:sticky md:top-4 md:self-start gap-0.5 overflow-x-auto md:overflow-x-visible">
                    <TabsTrigger value="profile" className="justify-start w-full py-2 px-3 rounded-lg text-sm data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all">
                        <Building2 className="w-4 h-4 mr-2 shrink-0" />
                        <span className="hidden md:inline truncate">{t('tabs.profile')}</span>
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="justify-start w-full py-2 px-3 rounded-lg text-sm data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all">
                        <Bell className="w-4 h-4 mr-2 shrink-0" />
                        <span className="hidden md:inline truncate">Bildirimler</span>
                    </TabsTrigger>
                    <TabsTrigger value="users" className="justify-start w-full py-2 px-3 rounded-lg text-sm data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all">
                        <Users className="w-4 h-4 mr-2 shrink-0" />
                        <span className="hidden md:inline truncate">{t('tabs.users')}</span>
                    </TabsTrigger>
                    <TabsTrigger value="email" className="justify-start w-full py-2 px-3 rounded-lg text-sm data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all">
                        <Mail className="w-4 h-4 mr-2 shrink-0" />
                        <span className="hidden md:inline truncate">E-posta</span>
                    </TabsTrigger>
                    <TabsTrigger value="templates" className="justify-start w-full py-2 px-3 rounded-lg text-sm data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all">
                        <FileText className="w-4 h-4 mr-2 shrink-0" />
                        <span className="hidden md:inline truncate">{t('tabs.templates')}</span>
                    </TabsTrigger>
                    <TabsTrigger value="definitions" className="justify-start w-full py-2 px-3 rounded-lg text-sm data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all">
                        <Database className="w-4 h-4 mr-2 shrink-0" />
                        <span className="hidden md:inline truncate">Tanımlar</span>
                    </TabsTrigger>
                    <TabsTrigger value="financial" className="justify-start w-full py-2 px-3 rounded-lg text-sm data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all">
                        <Banknote className="w-4 h-4 mr-2 shrink-0" />
                        <span className="hidden md:inline truncate">Finansal</span>
                    </TabsTrigger>
                    <TabsTrigger value="data" className="justify-start w-full py-2 px-3 rounded-lg text-sm data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all">
                        <Database className="w-4 h-4 mr-2 shrink-0" />
                        <span className="hidden md:inline truncate">{t('tabs.data')}</span>
                    </TabsTrigger>
                    <TabsTrigger value="commissions" className="justify-start w-full py-2 px-3 rounded-lg text-sm data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all">
                        <Banknote className="w-4 h-4 mr-2 shrink-0" />
                        <span className="hidden md:inline truncate">Primler</span>
                    </TabsTrigger>
                    <TabsTrigger value="ai" className="justify-start w-full py-2 px-3 rounded-lg text-sm data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all">
                        <Brain className="w-4 h-4 mr-2 shrink-0" />
                        <span className="hidden md:inline truncate">{t('tabs.ai')}</span>
                    </TabsTrigger>
                    <TabsTrigger value="sms" className="justify-start w-full py-2 px-3 rounded-lg text-sm data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all">
                        <MessageSquare className="w-4 h-4 mr-2 shrink-0" />
                        <span className="hidden md:inline truncate">SMS</span>
                    </TabsTrigger>
                    <TabsTrigger value="sip" className="justify-start w-full py-2 px-3 rounded-lg text-sm data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all">
                        <Phone className="w-4 h-4 mr-2 shrink-0" />
                        <span className="hidden md:inline truncate">SIP / Telefon</span>
                    </TabsTrigger>
                    <TabsTrigger value="seo" className="justify-start w-full py-2 px-3 rounded-lg text-sm data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all">
                        <Globe className="w-4 h-4 mr-2 shrink-0" />
                        <span className="hidden md:inline truncate">SEO</span>
                    </TabsTrigger>
                    <TabsTrigger value="brand" className="justify-start w-full py-2 px-3 rounded-lg text-sm data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all">
                        <Palette className="w-4 h-4 mr-2 shrink-0" />
                        <span className="hidden md:inline truncate">Tema</span>
                    </TabsTrigger>
                    <TabsTrigger value="domain" className="justify-start w-full py-2 px-3 rounded-lg text-sm data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all">
                        <Link2 className="w-4 h-4 mr-2 shrink-0" />
                        <span className="hidden md:inline truncate">Domain</span>
                    </TabsTrigger>
                    <TabsTrigger value="logs" className="justify-start w-full py-2 px-3 rounded-lg text-sm data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all focus:outline-none">
                        <FileWarning className="w-4 h-4 mr-2 shrink-0" />
                        <span className="hidden md:inline truncate">İşlem Logları</span>
                    </TabsTrigger>
                    {(profile.role === 'owner' || profile.role === 'admin' || profile.role === 'crm_manager') && (
                        <TabsTrigger value="notification-catalog" className="justify-start w-full py-2 px-3 rounded-lg text-sm data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all focus:outline-none">
                            <ListChecks className="w-4 h-4 mr-2 shrink-0" />
                            <span className="hidden md:inline truncate">Bildirim Yönetimi</span>
                        </TabsTrigger>
                    )}
                </TabsList>

                {/* Tab Content Area */}
                <div className="flex-1 min-w-0">


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
                    <PaymentTemplatesTab templates={templates || []} projects={projects || []} />
                </TabsContent>

                {/* Definitions Tab */}
                <TabsContent value="definitions" className="space-y-4">
                    <UnitTypesTab unitTypes={unitTypes || []} />
                    <UnitFieldOptionsTab fieldOptions={(unitFieldOptions || []).map((f: any) => ({ id: f.id, field_name: f.field_name, field_label: f.field_label, options: f.options || [] }))} />
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

                {/* SIP / Telefon Settings Tab */}
                <TabsContent value="sip" className="space-y-4">
                    <SipSettingsTab tenant={tenant as any} />
                </TabsContent>

                {/* SEO Settings Tab */}
                <TabsContent value="seo" className="space-y-4">
                    <SeoSettingsTab />
                </TabsContent>

                {/* Brand Settings Tab */}
                <TabsContent value="brand" className="space-y-4">
                    <BrandSettingsTab currentConfig={(tenant as any)?.brand_config || {}} />
                </TabsContent>

                {/* Domain Settings Tab */}
                <TabsContent value="domain" className="space-y-4">
                    <DomainSettingsTab
                        currentDomain={(tenant as any)?.custom_domain || null}
                        domainVerified={(tenant as any)?.domain_verified || false}
                        verificationRecord={(tenant as any)?.domain_verification_record || {}}
                    />
                </TabsContent>

                {/* System Logs Tab */}
                <TabsContent value="logs" className="space-y-4">
                    <SystemLogsTab 
                        initialLogs={systemLogs || []} 
                        hasError={hasLogsTableError} 
                    />
                </TabsContent>

                {/* Notification Catalog Tab */}
                {(profile.role === 'owner' || profile.role === 'admin' || profile.role === 'crm_manager') && (
                    <TabsContent value="notification-catalog" className="space-y-4">
                        <NotificationCatalogTab
                            users={(users || []).map((u: any) => ({ id: u.id, full_name: u.full_name, email: u.email, role: u.role, phone: u.phone, is_active: u.is_active }))}
                            currentUserId={user.id}
                        />
                    </TabsContent>
                )}
                </div>{/* end content area */}
                </div>{/* end flex container */}
            </Tabs>

        </div>
    )
}
