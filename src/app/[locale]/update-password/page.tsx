'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Building2, KeyRound, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function UpdatePasswordPage() {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const router = useRouter()

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')

        if (password.length < 6) {
            setError('Şifre en az 6 karakter olmalıdır.')
            return
        }

        if (password !== confirmPassword) {
            setError('Şifreler eşleşmiyor.')
            return
        }

        setLoading(true)
        const supabase = createClient()
        const { error: updateError } = await supabase.auth.updateUser({ password })

        if (updateError) {
            setError('Şifre güncellenemedi: ' + updateError.message)
            setLoading(false)
        } else {
            setSuccess(true)
            setTimeout(() => router.push('/dashboard'), 2000)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
            <div className="w-full max-w-[400px] space-y-6">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl mb-4" style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
                        {success ? <CheckCircle2 className="h-7 w-7 text-white" /> : <KeyRound className="h-7 w-7 text-white" />}
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        {success ? 'Şifreniz Güncellendi!' : 'Yeni Şifre Belirleyin'}
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        {success ? 'Yönlendiriliyorsunuz...' : 'Hesabınız için yeni bir şifre belirleyin.'}
                    </p>
                </div>

                {!success && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="password" className="font-semibold">Yeni Şifre</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="En az 6 karakter"
                                className="h-11"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="font-semibold">Şifre Tekrar</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Şifrenizi tekrar girin"
                                className="h-11"
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                        >
                            {loading ? 'Güncelleniyor...' : 'Şifremi Güncelle'}
                        </Button>
                    </form>
                )}

                <p className="text-center text-xs text-slate-400">
                    Powered by <span className="font-semibold">Novo CRM</span>
                </p>
            </div>
        </div>
    )
}
