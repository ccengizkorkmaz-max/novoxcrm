import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { 
  Calendar, Clock, Phone, MessageSquare, Loader2, 
  Plus, X, Sparkles 
} from 'lucide-react'

interface AgendaTabProps {
  userId: string
  tenantId: string
}

export default function AgendaTab({ userId, tenantId }: AgendaTabProps) {
  const [meetings, setMeetings] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // New Activity Modal State
  const [isAdding, setIsAdding] = useState(false)
  const [selectedCust, setSelectedCust] = useState('')
  const [title, setTitle] = useState('')
  const [meetType, setMeetType] = useState('Arama')
  const [scheduledAt, setScheduledAt] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchAgenda = async () => {
    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('meetings')
        .select(`
          id,
          title,
          description,
          meeting_type,
          scheduled_at,
          notes,
          customers (
            full_name,
            phone
          )
        `)
        .eq('host_user_id', userId)
        .order('scheduled_at', { ascending: true })

      if (fetchError) throw fetchError
      setMeetings(data || [])
    } catch (err: any) {
      console.error('Fetch agenda error:', err)
      setError('Randevular yüklenemedi.')
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, full_name')
        .or(`assigned_to.eq.${userId},created_by.eq.${userId}`)
        .order('full_name', { ascending: true })
      
      if (error) throw error
      setCustomers(data || [])
    } catch (err) {
      console.error('Fetch customers error:', err)
    }
  }

  useEffect(() => {
    if (userId) {
      fetchAgenda()
      fetchCustomers()
    }
  }, [userId])

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCust || !title || !scheduledAt) {
      alert('Lütfen gerekli alanları doldurun.')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from('meetings')
        .insert({
          tenant_id: tenantId,
          customer_id: selectedCust,
          title,
          description: notes || null,
          meeting_type: meetType,
          scheduled_at: new Date(scheduledAt).toISOString(),
          host_user_id: userId,
          status: 'Scheduled'
        })

      if (error) throw error

      setIsAdding(false)
      setTitle('')
      setSelectedCust('')
      setMeetType('Arama')
      setScheduledAt('')
      setNotes('')
      fetchAgenda()
    } catch (err: any) {
      console.error('Add meeting error:', err)
      alert(err.message || 'Aktivite eklenirken hata oluştu.')
    } finally {
      setSaving(false)
    }
  }

  const formatDateTime = (isoString: string) => {
    if (!isoString) return { date: '', time: '' }
    const dateObj = new Date(isoString)
    
    const dateOptions: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'long' }
    const timeOptions: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' }
    
    return {
      date: dateObj.toLocaleDateString('tr-TR', dateOptions),
      time: dateObj.toLocaleTimeString('tr-TR', timeOptions)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <span className="text-xs font-semibold">Randevu listesi yükleniyor...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-2xl">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-in fade-in-30 slide-in-from-bottom-2 duration-300">
      {/* Top Banner Card */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl p-5 text-white shadow-lg shadow-indigo-950/40 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 w-32 h-32 bg-white/5 rounded-full blur-xl translate-y-8 translate-x-8" />
        <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-1">BUGÜNKÜ AJANDA</p>
        <h2 className="text-2xl font-black">{meetings.length} Randevu</h2>
        <p className="text-xs text-indigo-100 font-medium mt-1">
          {meetings.length > 0 ? 'Bugün sizi bekleyen görüşmeler aşağıda listelenmiştir.' : 'Bugün planlanmış bir randevunuz bulunmamaktadır.'}
        </p>

        {/* Floating action button inside banner */}
        <button 
          onClick={() => setIsAdding(true)}
          className="absolute right-5 top-5 h-10 w-10 rounded-2xl bg-white text-indigo-600 flex items-center justify-center shadow-lg active:scale-95 transition-transform cursor-pointer"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {meetings.length === 0 ? (
        <div className="p-8 rounded-3xl border border-slate-800/80 bg-slate-800/20 text-center space-y-2">
          <Calendar className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-sm font-bold text-slate-400">Harika! Bugünlük sakin bir gün.</p>
          <p className="text-xs text-slate-500">Yeni bir randevu atandığında bildirim alacaksınız.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Zaman Akışı</h3>
          {meetings.map((item) => {
            const { date, time } = formatDateTime(item.scheduled_at)
            const customer = item.customers as any
            
            return (
              <div key={item.id} className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800/80 hover:bg-slate-800/60 transition-colors space-y-3">
                <div className="flex gap-4 items-start">
                  {/* Date Badge */}
                  <div className="text-center bg-slate-800 border border-slate-700/60 rounded-xl px-2.5 py-1.5 shrink-0 flex flex-col justify-center min-w-[65px]">
                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-wider block">{date}</span>
                    <span className="text-sm font-black text-white">{time}</span>
                  </div>
                  
                  {/* Info details */}
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider inline-block mb-1.5">
                      {item.meeting_type || 'Görüşme'}
                    </span>
                    <h4 className="text-sm font-black text-white truncate">
                      {customer?.full_name || 'İsimsiz Müşteri'}
                    </h4>
                    <p className="text-xs text-slate-400 font-bold truncate mt-1">
                      {item.title}
                    </p>
                    {item.description && (
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Customer contact triggers */}
                {customer?.phone && (
                  <div className="flex items-center justify-between border-t border-slate-800/60 pt-3">
                    <span className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Danışman Destekli
                    </span>
                    <div className="flex items-center gap-2">
                      <a href={`tel:${customer.phone}`} className="h-8 w-8 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-300 hover:text-blue-400 hover:bg-blue-500/10 transition-all">
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                      <a href={`https://wa.me/${customer.phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="h-8 w-8 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-300 hover:text-green-400 hover:bg-green-500/10 transition-all">
                        <MessageSquare className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Quick Add Activity Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <form 
            onSubmit={handleAddActivity}
            className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 space-y-5 animate-in slide-in-from-bottom duration-300"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-400" />
                <h3 className="text-md font-black text-white">Yeni Aktivite Ekle</h3>
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
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Müşteri Seçin</label>
                <select
                  value={selectedCust}
                  onChange={(e) => setSelectedCust(e.target.value)}
                  required
                  className="w-full bg-slate-800/60 border border-slate-700/80 rounded-xl py-2.5 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                >
                  <option value="" className="bg-slate-900">Seçiniz...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id} className="bg-slate-900">{c.full_name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Aktivite Başlığı</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Örn: 2+1 Daire Gösterimi"
                  required
                  className="w-full bg-slate-800/60 border border-slate-700/80 rounded-xl py-2.5 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Görüşme Tipi</label>
                  <select
                    value={meetType}
                    onChange={(e) => setMeetType(e.target.value)}
                    className="w-full bg-slate-800/60 border border-slate-700/80 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Arama" className="bg-slate-900">Arama</option>
                    <option value="Ziyaret" className="bg-slate-900">Ofis Ziyareti</option>
                    <option value="Toplantı" className="bg-slate-900">Toplantı</option>
                    <option value="Online" className="bg-slate-900">Online Görüşme</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Tarih / Saat</label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    required
                    className="w-full bg-slate-800/60 border border-slate-700/80 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Açıklama / Notlar (İsteğe Bağlı)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Randevu ile ilgili notlar..."
                  className="w-full h-20 bg-slate-800/60 border border-slate-700/80 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xs py-3.5 rounded-xl shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Aktivite Planla
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
