import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Sparkles, KeyRound, Mail, AlertCircle, Loader2 } from 'lucide-react'

interface LoginScreenProps {
  onLoginSuccess: () => void
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      })

      if (authError) throw authError
      onLoginSuccess()
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || 'Giriş yapılamadı. Bilgilerinizi kontrol edin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex justify-center min-h-screen bg-slate-950 p-0 sm:p-6">
      <div className="relative w-full max-w-md h-[100dvh] sm:h-[840px] bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col justify-center px-8 sm:rounded-[40px]">
        
        {/* Background ambient light */}
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 space-y-8">
          {/* Logo & Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Novox Go</h1>
              <p className="text-xs text-slate-400 font-medium mt-1">Saha Satış Danışmanı Portalı</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">E-Posta</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="eposta@novoxcrm.com"
                  required
                  className="w-full bg-slate-800/50 border border-slate-700/80 rounded-2xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">Parola</label>
              <div className="relative">
                <KeyRound className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-slate-800/50 border border-slate-700/80 rounded-2xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-sm py-3.5 rounded-2xl shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Giriş Yapılıyor...
                </>
              ) : (
                'Giriş Yap'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
