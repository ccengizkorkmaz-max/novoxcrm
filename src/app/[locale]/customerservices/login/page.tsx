import { login } from './actions'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Home, ShieldCheck, ArrowRight, Key } from 'lucide-react'

export default async function CustomerLoginPage({
    searchParams,
}: {
    searchParams: Promise<{ message: string, error: string }>
}) {
    const params = await searchParams;

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 relative overflow-hidden">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 -mr-24 -mt-24 h-96 w-96 rounded-full bg-blue-100/50 blur-3xl" />
            <div className="absolute bottom-0 left-0 -ml-24 -mb-24 h-96 w-96 rounded-full bg-indigo-100/50 blur-3xl" />

            <div className="w-full max-w-md p-8 relative z-10">
                <div className="flex flex-col items-center mb-8 text-center">
                    <div className="h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-200 mb-4 animate-in zoom-in duration-500">
                        <Home className="h-8 w-8" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Müşteri Portalı</h1>
                    <p className="text-slate-500 mt-2 font-medium">Hayalinizdeki konutun tüm süreçleri burada.</p>
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/60 border border-white">
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold text-slate-800">Giriş Yapın</h2>
                        <p className="text-sm text-slate-400 mt-1">Lütfen size verilen erişim bilgilerini kullanın.</p>
                    </div>

                    {(params as any)?.message && (
                        <div className="mb-6 p-4 rounded-xl bg-emerald-50 text-emerald-700 text-sm border border-emerald-100">
                            {(params as any).message}
                        </div>
                    )}
                    {(params?.error) && (
                        <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100 font-medium">
                            {decodeURIComponent(params.error)}
                        </div>
                    )}

                    <form action={login} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="username" className="text-slate-700 font-semibold ml-1">Kullanıcı Adı</Label>
                            <div className="relative">
                                <Input
                                    id="username"
                                    name="username"
                                    type="text"
                                    placeholder="Size özel kullanıcı adı"
                                    required
                                    autoComplete="off"
                                    className="h-12 bg-slate-50 border-slate-100 focus:bg-white focus:ring-blue-500 rounded-xl px-4"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-slate-700 font-semibold ml-1">Şifre</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    autoComplete="new-password"
                                    className="h-12 bg-slate-50 border-slate-100 focus:bg-white focus:ring-blue-500 rounded-xl px-4"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2 group"
                        >
                            Giriş Yap
                            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400">
                        <div className="flex items-center gap-1.5">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                            Güvenli Portal
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Key className="h-3.5 w-3.5" />
                            NovoxCrm Güvencesiyle
                        </div>
                    </div>
                </div>

                <p className="mt-8 text-center text-xs text-slate-400">
                    Giriş yapmakta sorun yaşıyorsanız satış temsilciniz ile iletişime geçin.
                </p>
            </div>
        </div>
    )
}
