import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { 
  Search, Plus, X, Phone, MessageSquare, 
  Loader2, Users, Sparkles 
} from 'lucide-react'

interface LeadsTabProps {
  userId: string
  tenantId: string
}

export default function LeadsTab({ userId, tenantId }: LeadsTabProps) {
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchLeads = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('customers')
        .select('id, full_name, phone, email, source, customer_type, created_at')
        .or(`assigned_to.eq.${userId},created_by.eq.${userId}`)
        .order('created_at', { ascending: false })

      if (error) throw error
      setLeads(data || [])
    } catch (err) {
      console.error('Fetch leads error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeads()
  }, [userId])

  const filteredLeads = leads.filter(l => 
    l.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    l.phone?.includes(search)
  )

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName || !newPhone) {
      alert('Lütfen gerekli alanları doldurun.')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from('customers')
        .insert({
          tenant_id: tenantId,
          full_name: newName,
          phone: newPhone,
          email: newEmail || null,
          source: 'Mobil Uygulama',
          customer_type: 'Lead', // Default to Lead status
          created_by: userId,
          assigned_to: userId
        })

      if (error) throw error

      setIsAdding(false)
      setNewName('')
      setNewPhone('')
      setNewEmail('')
      fetchLeads()
    } catch (err: any) {
      console.error('Add lead error:', err)
      alert(err.message || 'Müşteri eklenirken hata oluştu.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4 animate-in fade-in-30 slide-in-from-bottom-2 duration-300">
      {/* Top Banner Card */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-3xl p-5 text-white shadow-lg shadow-blue-950/40 relative">
        <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mb-1">MÜŞTERİ HÜNİSİ</p>
        <h2 className="text-2xl font-black">Müşterilerim</h2>
        <p className="text-xs text-blue-100 font-medium mt-1">Takip aramalarını başlatın ve yeni gelen fırsatları ekleyin.</p>
        
        {/* Quick Add floating action button inside banner */}
        <button 
          onClick={() => setIsAdding(true)}
          className="absolute right-5 top-5 h-10 w-10 rounded-2xl bg-white text-blue-600 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-3.5 w-4.5 h-4.5 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Müşteri adı veya telefon ara..."
          className="w-full bg-slate-800/40 border border-slate-800/80 rounded-2xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50"
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="text-xs font-semibold">Rehber yükleniyor...</span>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLeads.length === 0 ? (
            <div className="p-8 rounded-3xl border border-slate-800/80 bg-slate-800/20 text-center space-y-2">
              <Users className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-400">Sonuç Bulunamadı.</p>
              <p className="text-xs text-slate-500">Müşteri arama kriterlerinizi değiştirebilir veya yeni ekleyebilirsiniz.</p>
            </div>
          ) : (
            filteredLeads.map((lead) => (
              <div 
                key={lead.id} 
                className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800/80 flex items-center justify-between hover:bg-slate-800/60 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-black text-white truncate">{lead.full_name}</h4>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="inline-block px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700/60 text-[8px] font-black uppercase text-slate-300">
                      {lead.source || 'Bilinmiyor'}
                    </span>
                    <span className={`inline-block px-1.5 py-0.5 rounded border text-[8px] font-black uppercase ${
                      lead.customer_type === 'Lead' || !lead.customer_type
                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                        : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                    }`}>
                      {lead.customer_type === 'Lead' || !lead.customer_type ? 'Müşteri Adayı' : 'Müşteri'}
                    </span>
                  </div>
                </div>
                
                {/* Contact buttons */}
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  {lead.phone && (
                    <>
                      <a href={`tel:${lead.phone}`} className="h-9 w-9 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-300 hover:text-blue-400 hover:bg-blue-500/10 transition-all">
                        <Phone className="w-4 h-4" />
                      </a>
                      <a href={`https://wa.me/${lead.phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="h-9 w-9 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-300 hover:text-green-400 hover:bg-green-500/10 transition-all">
                        <MessageSquare className="w-4 h-4" />
                      </a>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Quick Add Müşteri Modal Overlay */}
      {isAdding && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <form 
            onSubmit={handleAddLead}
            className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 space-y-5 animate-in slide-in-from-bottom duration-300"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                <h3 className="text-md font-black text-white">Yeni Müşteri Kaydet</h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsAdding(false)}
                className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Input fields */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Adı Soyadı</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Canan Aslan"
                  required
                  className="w-full bg-slate-800/60 border border-slate-700/80 rounded-xl py-2.5 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Telefon Numarası</label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="905330000000"
                  required
                  className="w-full bg-slate-800/60 border border-slate-700/80 rounded-xl py-2.5 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">E-Posta (İsteğe Bağlı)</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="email@adres.com"
                  className="w-full bg-slate-800/60 border border-slate-700/80 rounded-xl py-2.5 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-bold text-xs py-3.5 rounded-xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Müşteri Ekle
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
