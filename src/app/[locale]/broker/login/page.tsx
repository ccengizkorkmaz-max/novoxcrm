import { brokerLogin, brokerResetPassword } from './actions'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { Building2, ArrowRight, ShieldCheck, Briefcase } from 'lucide-react'
import Link from 'next/link'
import { getBrandNameFromHost, getHostFromHeaders } from '@/lib/tenant/resolve-brand-from-host'

export default async function BrokerLoginPage({
    searchParams,
}: {
    searchParams: Promise<{ message: string, error: string, email: string }>
}) {
    const params = await searchParams
    const host = await getHostFromHeaders()
    const brandName = await getBrandNameFromHost(host)
    const brandShort = brandName.replace(/\s*CRM\s*/i, '').trim() || brandName

    return (
        <div className="min-h-screen w-full flex" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}>
            {/* Left Side — Branding */}
            <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, #3b82f6 0%, transparent 50%), radial-gradient(circle at 80% 20%, #8b5cf6 0%, transparent 50%)' }} />
                
                <div className="relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
                            <Building2 className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <span className="text-lg font-bold text-white">{brandShort} Broker</span>
                            <p className="text-[10px] text-slate-400 font-medium">Partner Portal</p>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 space-y-6 max-w-lg">
                    <h1 className="text-4xl font-bold text-white leading-tight tracking-tight">
                        Satış Ortaklarımız İçin<br />
                        <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">Özel Platform</span>
                    </h1>
                    <p className="text-slate-400 text-lg leading-relaxed">
                        Portföylerinizi yönetin, müşterilerinizi takip edin ve komisyon kazançlarınızı anlık olarak görüntüleyin.
                    </p>
                    <div className="grid grid-cols-3 gap-4 pt-4">
                        {[
                            { label: 'Anlık Stok', value: 'Erişimi' },
                            { label: 'Komisyon', value: 'Takibi' },
                            { label: 'Lead', value: 'Yönetimi' },
                        ].map((item, i) => (
                            <div key={i} className="p-3 rounded-xl border border-white/5 bg-white/5 backdrop-blur-sm">
                                <p className="text-xs text-slate-400">{item.label}</p>
                                <p className="text-sm font-bold text-white">{item.value}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="relative z-10 flex items-center gap-4 text-xs text-slate-500">
                    <ShieldCheck className="h-4 w-4" />
                    <span>256-bit SSL Şifreleme</span>
                    <span className="h-1 w-1 bg-slate-700 rounded-full" />
                    <span>KVKK Uyumlu</span>
                </div>
            </div>

            {/* Right Side — Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
                <div className="w-full max-w-[420px]">
                    {/* Mobile Brand */}
                    <div className="lg:hidden flex flex-col items-center mb-8">
                        <div className="h-14 w-14 rounded-2xl flex items-center justify-center mb-3" style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
                            <Building2 className="h-7 w-7 text-white" />
                        </div>
                        <h1 className="text-xl font-bold text-white">{brandShort} Broker Portal</h1>
                        <p className="text-xs text-slate-400 mt-1">Satış Ortağı Girişi</p>
                    </div>

                    <div className="bg-white/[0.03] backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                <Briefcase className="h-5 w-5 text-blue-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">Broker Girişi</h2>
                                <p className="text-xs text-slate-400">Hesabınıza giriş yapın</p>
                            </div>
                        </div>

                        {params?.message && (
                            <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 text-emerald-400 text-sm font-medium border border-emerald-500/20">
                                {decodeURIComponent(params.message)}
                            </div>
                        )}
                        {params?.error && (
                            <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 text-red-400 text-sm font-medium border border-red-500/20">
                                {decodeURIComponent(params.error)}
                            </div>
                        )}

                        <form className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-slate-300 font-semibold text-sm">E-posta</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="broker@ornek.com"
                                    required
                                    defaultValue={params?.email || ''}
                                    className="h-12 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:bg-white/10 rounded-xl"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-slate-300 font-semibold text-sm">Şifre</Label>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    placeholder="••••••••"
                                    required
                                    className="h-12 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:bg-white/10 rounded-xl pr-10"
                                />
                            </div>

                            <div className="flex flex-col gap-2.5 pt-2">
                                <Button
                                    formAction={brokerLogin}
                                    className="w-full h-12 font-bold rounded-xl shadow-lg shadow-blue-500/20 text-sm gap-2 group"
                                    style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
                                >
                                    Giriş Yap
                                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </Button>

                                <Button
                                    formAction={brokerResetPassword}
                                    formNoValidate
                                    variant="ghost"
                                    className="w-full h-9 text-xs text-slate-400 hover:text-blue-400 hover:bg-white/5 font-medium rounded-xl"
                                >
                                    Şifremi Unuttum
                                </Button>
                            </div>
                        </form>

                        <div className="mt-6 pt-5 border-t border-white/5 text-center">
                            <p className="text-xs text-slate-500">
                                Henüz hesabınız yok mu?{' '}
                                <Link href="/broker/apply" className="text-blue-400 hover:text-blue-300 font-semibold">
                                    Broker Başvurusu Yapın →
                                </Link>
                            </p>
                        </div>
                    </div>

                    <p className="mt-6 text-center text-[10px] text-slate-600">
                        Powered by <span className="font-semibold text-slate-500">{brandName}</span>
                    </p>
                </div>
            </div>
        </div>
    )
}
