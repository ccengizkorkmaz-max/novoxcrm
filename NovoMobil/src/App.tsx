import { useState, useEffect } from 'react'
import { 
  Calendar, Building2, User, Mic, Wifi, WifiOff, LogOut, Loader2 
} from 'lucide-react'
import { supabase } from './lib/supabase'

import LoginScreen from './components/LoginScreen'
import AgendaTab from './components/AgendaTab'
import StockTab from './components/StockTab'
import LeadsTab from './components/LeadsTab'
import VoiceTab from './components/VoiceTab'

export default function App() {
  const [session, setSession] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loadingSession, setLoadingSession] = useState(true)
  
  const [activeTab, setActiveTab] = useState<'agenda' | 'stock' | 'leads' | 'voice'>('agenda')
  const [dbStatus, setDbStatus] = useState<'connecting' | 'success' | 'error'>('connecting')

  // 1. Listen for Supabase Authentication State Changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession)
      if (currentSession?.user) {
        fetchProfile(currentSession.user.id)
      } else {
        setLoadingSession(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession)
      if (currentSession?.user) {
        fetchProfile(currentSession.user.id)
      } else {
        setProfile(null)
        setLoadingSession(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // 2. Fetch Sales representative profile metadata & tenant_id
  const fetchProfile = async (userId: string) => {
    try {
      setDbStatus('connecting')
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, tenant_id')
        .eq('id', userId)
        .single()

      if (error) throw error
      setProfile(data)
      setDbStatus('success')
    } catch (err) {
      console.error('Fetch profile error:', err)
      setDbStatus('error')
    } finally {
      setLoadingSession(false)
    }
  }

  const handleLogout = async () => {
    if (confirm('Çıkış yapmak istediğinize emin misiniz?')) {
      await supabase.auth.signOut()
    }
  }

  if (loadingSession) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-400 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <span className="text-xs font-semibold">Oturum kontrol ediliyor...</span>
      </div>
    )
  }

  // Render Login Screen if not authenticated
  if (!session) {
    return <LoginScreen onLoginSuccess={() => setLoadingSession(true)} />
  }

  return (
    <div className="flex justify-center min-h-screen bg-slate-950 font-sans p-0 sm:p-6">
      {/* Phone container mockup */}
      <div className="relative w-full max-w-md h-[100dvh] sm:h-[840px] bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col sm:rounded-[40px]">
        
        {/* App Status Top Bar */}
        <div className="bg-slate-900/80 backdrop-blur-md px-6 pt-6 pb-4 shrink-0 flex items-center justify-between border-b border-slate-800/60 relative z-10">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Novox Go</span>
              {dbStatus === 'success' ? (
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-red-400" />
              )}
            </div>
            <h1 className="text-md font-black text-white tracking-tight flex items-center gap-1.5 mt-0.5">
              {profile?.full_name || 'Satış Temsilcisi'}
            </h1>
          </div>
          
          <button 
            onClick={handleLogout}
            className="h-9 w-9 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-400 hover:text-red-400 active:scale-95 transition-all cursor-pointer"
            title="Çıkış Yap"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Components Body */}
        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
          {activeTab === 'agenda' && session?.user && (
            <AgendaTab userId={session.user.id} />
          )}

          {activeTab === 'stock' && session?.user && profile?.tenant_id && (
            <StockTab userId={session.user.id} tenantId={profile.tenant_id} />
          )}

          {activeTab === 'leads' && session?.user && profile?.tenant_id && (
            <LeadsTab userId={session.user.id} tenantId={profile.tenant_id} />
          )}

          {activeTab === 'voice' && session?.user && profile?.tenant_id && (
            <VoiceTab userId={session.user.id} tenantId={profile.tenant_id} />
          )}
        </div>

        {/* Tab Buttons Bottom Navigation */}
        <div className="bg-slate-900/90 backdrop-blur-md border-t border-slate-800/80 px-4 py-3 shrink-0 flex items-center justify-around relative z-10">
          <TabButton 
            active={activeTab === 'agenda'} 
            onClick={() => setActiveTab('agenda')} 
            icon={<Calendar className="w-5 h-5" />} 
            label="Ajanda" 
          />
          <TabButton 
            active={activeTab === 'stock'} 
            onClick={() => setActiveTab('stock')} 
            icon={<Building2 className="w-5 h-5" />} 
            label="Stok" 
          />
          <TabButton 
            active={activeTab === 'leads'} 
            onClick={() => setActiveTab('leads')} 
            icon={<User className="w-5 h-5" />} 
            label="Kişiler" 
          />
          <TabButton 
            active={activeTab === 'voice'} 
            onClick={() => setActiveTab('voice')} 
            icon={<Mic className="w-5 h-5" />} 
            label="Ses Asistanı" 
          />
        </div>
      </div>
    </div>
  )
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all duration-300 cursor-pointer ${
        active ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-500 hover:text-slate-300'
      }`}
    >
      {icon}
      <span className="text-[9px] font-black uppercase tracking-wider">{label}</span>
    </button>
  )
}
