import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { 
  Mic, Square, Sparkles, CheckCircle2, 
  Loader2, AlertTriangle 
} from 'lucide-react'

interface VoiceTabProps {
  userId: string
  tenantId: string
}

export default function VoiceTab({ userId, tenantId }: VoiceTabProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recognition, setRecognition] = useState<any | null>(null)
  const [voiceText, setVoiceText] = useState('')
  
  // Parsed CRM targets
  const [parsedData, setParsedData] = useState<any | null>(null)
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState(false)
  const [phoneInput, setPhoneInput] = useState('')

  useEffect(() => {
    // Check SpeechRecognition support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      const rec = new SpeechRecognition()
      rec.continuous = true
      rec.interimResults = true
      rec.lang = 'tr-TR'

      rec.onresult = (event: any) => {
        let transcript = ''
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript
          }
        }
        if (transcript) {
          setVoiceText(prev => prev + ' ' + transcript)
        }
      }

      rec.onerror = (e: any) => {
        console.error('Speech recognition error:', e)
        setIsRecording(false)
      }

      setRecognition(rec)
    }
  }, [])

  const handleToggleRecord = () => {
    if (!recognition) {
      alert('Tarayıcınız ses tanımayı desteklemiyor. Lütfen notunuzu el ile yazın.')
      return
    }

    if (isRecording) {
      recognition.stop()
      setIsRecording(false)
      handleParseText(voiceText)
    } else {
      setVoiceText('')
      setParsedData(null)
      setSuccessMsg(false)
      setPhoneInput('')
      try {
        recognition.start()
        setIsRecording(true)
      } catch (err) {
        console.error('Recognition start error:', err)
      }
    }
  };

  // Client-side AI parser simulator
  const handleParseText = (text: string) => {
    if (!text || text.trim().length < 5) return

    // Simple heuristic parser for demo
    // Ex: "Hakan Bey ile 3+1 daireyi gezdik, bütçesi 5 milyon, haftaya pazartesi arayacağım."
    let customer = 'Müşteri Adayı'
    let unitType = '1+1'
    let budget = 'Belirtilmedi'
    let action = 'Görüşme Takibi'

    const textLower = text.toLowerCase()

    // 1. Detect customer name
    const nameMatch = text.match(/([A-ZÇĞİÖŞÜ][a-zçğıöşü]+)\s+(Bey|Hanım)/)
    if (nameMatch) {
      customer = `${nameMatch[1]} ${nameMatch[2]}`
    } else {
      const withMatch = text.match(/([A-ZÇĞİÖŞÜ][a-zçğıöşü]+)\s+ile/)
      if (withMatch) customer = withMatch[1]
    }

    // 2. Detect unit type
    if (textLower.includes('2+1')) unitType = '2+1'
    else if (textLower.includes('3+1')) unitType = '3+1'
    else if (textLower.includes('4+1')) unitType = '4+1'
    else if (textLower.includes('loft')) unitType = 'Loft'

    // 3. Detect budget
    const budgetMatch = textLower.match(/(\d+[\d.,]*)\s*(milyon|bin|m)/)
    if (budgetMatch) {
      budget = `${budgetMatch[1]} ${budgetMatch[2]} TL`
    }

    // 4. Detect action/day
    if (textLower.includes('cuma')) action = 'Cuma günü arama yapılacak'
    else if (textLower.includes('pazartesi')) action = 'Pazartesi günü takip edilecek'
    else if (textLower.includes('yarın')) action = 'Yarın aranacak'

    setParsedData({
      customer,
      unitType,
      budget,
      action
    })
  }

  const handleSaveToCrm = async () => {
    if (!parsedData) return
    if (!phoneInput) {
      alert('Lütfen müşteri telefonu giriniz.')
      return
    }

    setSaving(true)
    try {
      // 1. Save customer to DB
      const { data: cust, error: custErr } = await supabase
        .from('customers')
        .insert({
          tenant_id: tenantId,
          full_name: parsedData.customer,
          phone: phoneInput,
          source: 'Sesli Asistan',
          customer_type: 'Lead',
          notes: `Sesle kaydedilen not: "${voiceText}"`,
          assigned_to: userId,
          created_by: userId
        })
        .select('id')
        .single()

      if (custErr) throw custErr

      // 2. Save follow-up Task/Meeting to DB
      const scheduledDate = new Date()
      scheduledDate.setDate(scheduledDate.getDate() + 3) // Default to 3 days later

      const { error: meetErr } = await supabase
        .from('meetings')
        .insert({
          tenant_id: tenantId,
          customer_id: cust.id,
          title: `Takip: ${parsedData.customer} - ${parsedData.unitType}`,
          description: `Sesli Not: "${voiceText}" \nÖnerilen Aksiyon: ${parsedData.action}`,
          meeting_type: 'Arama',
          scheduled_at: scheduledDate.toISOString(),
          host_user_id: userId
        })

      if (meetErr) throw meetErr

      setSuccessMsg(true)
      setParsedData(null)
      setVoiceText('')
    } catch (err: any) {
      console.error('Voice CRM save error:', err)
      alert(err.message || 'Müşteri ve görev oluşturulamadı.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4 animate-in fade-in-30 slide-in-from-bottom-2 duration-300">
      {/* Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-3xl p-5 text-white shadow-lg shadow-purple-950/40">
        <p className="text-[10px] font-bold text-purple-200 uppercase tracking-widest mb-1">AI SESLİ ASİSTAN</p>
        <h2 className="text-2xl font-black">Ses Asistanı</h2>
        <p className="text-xs text-purple-100 font-medium mt-1">Görüşme sonrasında danışman konuşarak bilgileri CRM'e girebilir.</p>
      </div>

      {/* Speech Recognition Disclaimer */}
      {!recognition && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold flex items-start gap-2">
          <AlertTriangle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
          <div>
            <p>Tarayıcınızda Ses Tanıma (Speech Recognition) API'si kapalı veya desteklenmiyor.</p>
            <p className="text-[10px] opacity-80 mt-1">Lütfen notunuzu el ile yazarak "Yazıyı Ayrıştır" butonuna basın.</p>
          </div>
        </div>
      )}

      {/* Record Console */}
      <div className="p-6 rounded-3xl bg-slate-800/40 border border-slate-800/80 flex flex-col items-center text-center space-y-6">
        
        {/* Pulse Record Trigger */}
        <button
          type="button"
          onClick={handleToggleRecord}
          className={`h-24 w-24 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 cursor-pointer ${
            isRecording 
              ? 'bg-red-500 text-white animate-pulse ring-8 ring-red-500/20 shadow-red-500/20' 
              : 'bg-gradient-to-tr from-purple-600 to-fuchsia-600 text-white shadow-purple-500/20 hover:scale-[1.02] active:scale-[0.98]'
          }`}
        >
          {isRecording ? <Square className="w-8 h-8 fill-white" /> : <Mic className="w-8 h-8 text-white" />}
        </button>

        <div>
          <h4 className="text-sm font-black text-white">{isRecording ? 'Dinleniyor...' : 'Konuşmayı Başlat'}</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-[260px] mx-auto">
            Örn: "Zeynep Hanım ile 3+1 daire baktık, bütçesi 6 milyon, yarın arayacağım."
          </p>
        </div>

        {/* Text Area */}
        <div className="w-full text-left space-y-2">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Metin Alanı</span>
          <textarea
            value={voiceText}
            onChange={(e) => {
              setVoiceText(e.target.value)
              handleParseText(e.target.value)
            }}
            placeholder="Müşteri görüşme detaylarını buraya konuşun veya yazın..."
            className="w-full h-24 bg-slate-900 border border-slate-800 rounded-2xl py-3 px-4 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 resize-none"
          />
          {!recognition && voiceText.length > 5 && !parsedData && (
            <button
              type="button"
              onClick={() => handleParseText(voiceText)}
              className="bg-slate-800 text-slate-200 text-[10px] font-black uppercase tracking-wider py-2 px-4 rounded-xl border border-slate-700/60 hover:text-white"
            >
              Yazıyı Ayrıştır
            </button>
          )}
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="w-full p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Müşteri ve Görüşme Takibi başarıyla CRM'e işlendi!</span>
          </div>
        )}

        {/* Parsed Output Card */}
        {parsedData && (
          <div className="w-full text-left p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20 space-y-4">
            <div className="flex items-center gap-1.5 text-purple-400">
              <Sparkles className="w-4 h-4 animate-bounce" />
              <span className="text-[10px] font-black uppercase tracking-wider">AI AYRIŞTIRMA MODELİ</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-[11px] font-bold text-slate-400">
              <div>Müşteri Adayı: <span className="text-white block font-black text-xs mt-0.5">{parsedData.customer}</span></div>
              <div>Aranan Tip: <span className="text-white block font-black text-xs mt-0.5">{parsedData.unitType}</span></div>
              <div>Tahmini Bütçe: <span className="text-white block font-black text-xs mt-0.5">{parsedData.budget}</span></div>
              <div>Aksiyon Planı: <span className="text-amber-400 block font-black text-xs mt-0.5">{parsedData.action}</span></div>
            </div>

            {/* Input Phone details to complete CRM save */}
            <div className="space-y-2 border-t border-slate-800/80 pt-3.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Kaydetmek için Telefon Numarası girin</label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="905330000000"
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-purple-500"
                />
                <button
                  type="button"
                  onClick={handleSaveToCrm}
                  disabled={saving}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 rounded-xl flex items-center justify-center disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'CRM\'e İşle'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
