'use client';

import { useState, useEffect, useCallback } from 'react';
import { Phone, PhoneCall, Plus, Trash2, Play, Loader2, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, Volume2, MessageSquareText } from 'lucide-react';

interface CallRecord {
  id: string;
  status: string;
  type: string;
  startedAt?: string;
  endedAt?: string;
  endedReason?: string;
  cost?: number;
  customer?: { number?: string; name?: string };
  name?: string;
  analysis?: { summary?: string; structuredData?: Record<string, unknown>; successEvaluation?: string };
  artifact?: { recordingUrl?: string; transcript?: string };
}

interface PhoneEntry { number: string; name: string; }

const PROJECTS = [
  { id: 'izmir-novo-vista', name: 'İzmir Novo Vista' },
  { id: 'querencia', name: 'Querencia' },
  { id: 'la-vista', name: 'La Vista' },
  { id: 'courtyard-platinum', name: 'Courtyard Platinum' },
  { id: 'grand-sapphire', name: 'Grand Sapphire' },
];

function statusBadge(status: string) {
  const map: Record<string, { color: string; label: string }> = {
    queued: { color: 'bg-yellow-500/20 text-yellow-400', label: 'Sırada' },
    ringing: { color: 'bg-blue-500/20 text-blue-400', label: 'Çalıyor' },
    'in-progress': { color: 'bg-green-500/20 text-green-400', label: 'Görüşme' },
    forwarding: { color: 'bg-purple-500/20 text-purple-400', label: 'Yönlendirme' },
    ended: { color: 'bg-slate-500/20 text-slate-400', label: 'Tamamlandı' },
    scheduled: { color: 'bg-cyan-500/20 text-cyan-400', label: 'Planlandı' },
  };
  const s = map[status] || { color: 'bg-slate-500/20 text-slate-300', label: status };
  return <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${s.color}`}>{s.label}</span>;
}

function interestBadge(level: string) {
  if (!level) return null;
  const l = level.toLowerCase();
  if (l === 'hot') return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-500/20 text-red-400">🔥 Sıcak</span>;
  if (l === 'warm') return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-orange-500/20 text-orange-400">🌤 Ilık</span>;
  return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-400">❄️ Soğuk</span>;
}

export default function AiCallerPage() {
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [calling, setCalling] = useState(false);
  const [singleNumber, setSingleNumber] = useState('');
  const [singleName, setSingleName] = useState('');
  const [selectedProject, setSelectedProject] = useState('izmir-novo-vista');
  const [batchList, setBatchList] = useState<PhoneEntry[]>([]);
  const [batchNumber, setBatchNumber] = useState('');
  const [batchName, setBatchName] = useState('');
  const [mode, setMode] = useState<'single' | 'batch'>('single');
  const [expandedCall, setExpandedCall] = useState<string | null>(null);
  const [callResult, setCallResult] = useState<{ success: boolean; message: string } | null>(null);

  // New states for Custom Script & Voice Settings
  const [customPrompt, setCustomPrompt] = useState('');
  const [elevenVoices, setElevenVoices] = useState<any[]>([]);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [voiceSettings, setVoiceSettings] = useState({
    stability: 0.5,
    similarityBoost: 0.7,
    style: 0,
    useSpeakerBoost: true
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  // WhatsApp States
  const [waPhone, setWaPhone] = useState('');
  const [waMessage, setWaMessage] = useState('');
  const [waType, setWaType] = useState<'text' | 'template' | 'video'>('text');
  const [waMediaUrl, setWaMediaUrl] = useState('');
  const [waSending, setWaSending] = useState(false);
  const [waResult, setWaResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    async function fetchVoices() {
      try {
        const res = await fetch('/api/elevenlabs/voices');
        const data = await res.json();
        if (data.voices) {
          setElevenVoices(data.voices);
          // Default to Mert or first available
          const mert = data.voices.find((v: any) => v.name.toLowerCase().includes('mert'));
          if (mert) setSelectedVoice(mert.voice_id);
          else if (data.voices.length > 0) setSelectedVoice(data.voices[0].voice_id);
        }
      } catch (err) {
        console.error('Failed to fetch voices', err);
      }
    }
    fetchVoices();
  }, []);

  const fetchCalls = useCallback(async () => {
    try {
      const res = await fetch('/api/vapi');
      const data = await res.json();
      setCalls(Array.isArray(data) ? data : []);
    } catch { setCalls([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCalls(); const i = setInterval(fetchCalls, 15000); return () => clearInterval(i); }, [fetchCalls]);

  const makeCall = async () => {
    if (mode === 'single' && !singleNumber) return;
    if (mode === 'batch' && batchList.length === 0) return;
    setCalling(true);
    setCallResult(null);
    try {
      const payloadOverrides = {
          customPrompt: customPrompt.trim() || undefined,
          customVoiceId: selectedVoice || undefined,
          voiceSettings: selectedVoice ? voiceSettings : undefined
      };
      
      const body = mode === 'single'
        ? { phoneNumber: singleNumber, customerName: singleName, projectId: selectedProject, ...payloadOverrides }
        : { action: 'batch', phoneNumbers: batchList.map(p => ({ ...p, projectId: selectedProject })), projectId: selectedProject, ...payloadOverrides };
      
      const res = await fetch('/api/vapi', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCallResult({ success: true, message: mode === 'single' ? `Arama başlatıldı! ID: ${data.id}` : `${data.results?.filter((r: {success: boolean}) => r.success).length} arama başlatıldı` });
      if (mode === 'single') { setSingleNumber(''); setSingleName(''); }
      else setBatchList([]);
      setTimeout(fetchCalls, 3000);
    } catch (err: unknown) {
      setCallResult({ success: false, message: err instanceof Error ? err.message : 'Hata oluştu' });
    } finally { setCalling(false); }
  };

  const sendWhatsApp = async () => {
    if (!waPhone || (!waMessage && waType !== 'template')) return;
    setWaSending(true);
    setWaResult(null);
    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: waPhone,
          messageType: waType,
          content: waMessage,
          mediaUrl: waType === 'video' ? waMediaUrl : undefined,
          templateName: waType === 'template' ? waMessage : undefined // if template, we use waMessage as templateName
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setWaResult({ success: true, message: 'WhatsApp mesajı başarıyla gönderildi!' });
      if (waType !== 'template') setWaMessage('');
    } catch (err: unknown) {
      setWaResult({ success: false, message: err instanceof Error ? err.message : 'Mesaj gönderilemedi' });
    } finally {
      setWaSending(false);
    }
  };

  const addToBatch = () => {
    if (!batchNumber) return;
    setBatchList(prev => [...prev, { number: batchNumber, name: batchName }]);
    setBatchNumber(''); setBatchName('');
  };

  const activeCalls = calls.filter(c => ['queued', 'ringing', 'in-progress'].includes(c.status));
  const completedCalls = calls.filter(c => c.status === 'ended');

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><PhoneCall className="h-7 w-7 text-blue-500" /> AI Arama Sistemi</h1>
          <p className="text-sm text-muted-foreground mt-1">Vapi AI ile otomatik soğuk arama demosu</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          Vapi Bağlı • {calls.length} arama
        </div>
      </div>

      {/* New Call Panel */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Yeni Arama</h2>
          <div className="flex gap-1 bg-muted rounded-lg p-0.5">
            <button onClick={() => setMode('single')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${mode === 'single' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}>Tekli</button>
            <button onClick={() => setMode('batch')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${mode === 'batch' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}>Toplu</button>
          </div>
        </div>

        {/* Project Selection */}
        <div className="mb-4">
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Proje</label>
          <div className="flex flex-wrap gap-2">
            {PROJECTS.map(p => (
              <button key={p.id} onClick={() => setSelectedProject(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${selectedProject === p.id ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-border hover:border-blue-500/50 text-muted-foreground'}`}>
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Script & Voice Settings (Collapsible) */}
        <div className="mb-6 border rounded-lg overflow-hidden bg-slate-50/50">
            <button 
                onClick={() => setShowAdvanced(!showAdvanced)} 
                className="w-full flex items-center justify-between p-3 bg-white hover:bg-slate-50 text-sm font-medium border-b"
            >
                <span>Ayarlar & Script (ElevenLabs Optimizasyonu)</span>
                {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            
            {showAdvanced && (
                <div className="p-4 space-y-5">
                    {/* Script Area */}
                    <div>
                        <label className="text-xs font-medium text-slate-700 mb-1.5 block">AI Mesaj Scripti (Sistem Promptu)</label>
                        <textarea 
                            value={customPrompt} 
                            onChange={(e) => setCustomPrompt(e.target.value)} 
                            placeholder="Örn: Sen Novo Gayrimenkul'den arayan bir satış asistanısın. Amacın..."
                            className="w-full h-24 p-3 rounded-lg border text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        />
                        <p className="text-[10px] text-muted-foreground mt-1">Boş bırakılırsa Vapi üzerindeki varsayılan prompt kullanılır.</p>
                    </div>

                    {/* Voice Selection */}
                    <div>
                        <label className="text-xs font-medium text-slate-700 mb-1.5 block">ElevenLabs Ses Seçimi</label>
                        <select 
                            value={selectedVoice} 
                            onChange={(e) => setSelectedVoice(e.target.value)}
                            className="w-full h-10 px-3 rounded-lg border text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        >
                            <option value="">Varsayılan Sesi Kullan</option>
                            {elevenVoices.map((v: any) => (
                                <option key={v.voice_id} value={v.voice_id}>{v.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Voice Settings */}
                    {selectedVoice && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-lg border">
                            <div>
                                <label className="text-xs font-medium text-slate-700 flex justify-between mb-1.5">
                                    <span>Stability (Kararlılık)</span>
                                    <span>{voiceSettings.stability}</span>
                                </label>
                                <input type="range" min="0" max="1" step="0.01" value={voiceSettings.stability}
                                    onChange={(e) => setVoiceSettings(p => ({...p, stability: parseFloat(e.target.value)}))}
                                    className="w-full accent-blue-600" />
                                <p className="text-[10px] text-muted-foreground mt-1">Düşük = Daha duygusal/değişken, Yüksek = Daha monoton</p>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-700 flex justify-between mb-1.5">
                                    <span>Similarity Boost (Benzerlik)</span>
                                    <span>{voiceSettings.similarityBoost}</span>
                                </label>
                                <input type="range" min="0" max="1" step="0.01" value={voiceSettings.similarityBoost}
                                    onChange={(e) => setVoiceSettings(p => ({...p, similarityBoost: parseFloat(e.target.value)}))}
                                    className="w-full accent-blue-600" />
                                <p className="text-[10px] text-muted-foreground mt-1">Orijinal sese yakınlık oranı</p>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-700 flex justify-between mb-1.5">
                                    <span>Style Exaggeration (Stil Abartısı)</span>
                                    <span>{voiceSettings.style}</span>
                                </label>
                                <input type="range" min="0" max="1" step="0.01" value={voiceSettings.style}
                                    onChange={(e) => setVoiceSettings(p => ({...p, style: parseFloat(e.target.value)}))}
                                    className="w-full accent-blue-600" />
                            </div>
                            <div className="flex items-center gap-2 pt-5">
                                <input type="checkbox" id="speakerBoost" checked={voiceSettings.useSpeakerBoost}
                                    onChange={(e) => setVoiceSettings(p => ({...p, useSpeakerBoost: e.target.checked}))}
                                    className="accent-blue-600 w-4 h-4 rounded border-gray-300" />
                                <label htmlFor="speakerBoost" className="text-xs font-medium text-slate-700 cursor-pointer">
                                    Speaker Boost Kullan
                                </label>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>

        {mode === 'single' ? (
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Telefon (E.164)</label>
              <input value={singleNumber} onChange={e => setSingleNumber(e.target.value)} placeholder="+905551234567"
                className="w-full h-10 px-3 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">İsim (opsiyonel)</label>
              <input value={singleName} onChange={e => setSingleName(e.target.value)} placeholder="Müşteri adı"
                className="w-full h-10 px-3 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>
            <button onClick={makeCall} disabled={calling || !singleNumber}
              className="h-10 px-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium flex items-center gap-2 disabled:opacity-50 transition">
              {calling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />} Ara
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Telefon</label>
                <input value={batchNumber} onChange={e => setBatchNumber(e.target.value)} placeholder="+905551234567"
                  className="w-full h-10 px-3 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="flex-1">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">İsim</label>
                <input value={batchName} onChange={e => setBatchName(e.target.value)} placeholder="Ad Soyad"
                  className="w-full h-10 px-3 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <button onClick={addToBatch} className="h-10 px-4 rounded-lg border hover:bg-muted text-sm flex items-center gap-1 transition">
                <Plus className="h-4 w-4" /> Ekle
              </button>
            </div>
            {batchList.length > 0 && (
              <div className="rounded-lg border divide-y">
                {batchList.map((item, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span className="font-mono text-xs">{item.number}</span>
                    <span className="text-muted-foreground text-xs">{item.name || '—'}</span>
                    <button onClick={() => setBatchList(prev => prev.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-300"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
              </div>
            )}
            <button onClick={makeCall} disabled={calling || batchList.length === 0}
              className="h-10 px-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium flex items-center gap-2 disabled:opacity-50 transition">
              {calling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} {batchList.length} Kişiyi Ara
            </button>
          </div>
        )}

        {callResult && (
          <div className={`mt-3 p-3 rounded-lg text-sm flex items-center gap-2 ${callResult.success ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
            {callResult.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            {callResult.message}
          </div>
        )}
      </div>

      {/* Active Calls */}
      {activeCalls.length > 0 && (
        <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4">
          <h3 className="font-semibold text-sm text-green-400 mb-3 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" /> Aktif Aramalar ({activeCalls.length})
          </h3>
          <div className="space-y-2">
            {activeCalls.map(call => (
              <div key={call.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border">
                <div className="flex items-center gap-3">
                  <PhoneCall className="h-4 w-4 text-green-400 animate-pulse" />
                  <div>
                    <span className="text-sm font-medium">{call.customer?.name || call.customer?.number || call.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">{call.customer?.number}</span>
                  </div>
                </div>
                {statusBadge(call.status)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Call History */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold">Arama Geçmişi</h3>
          <button onClick={() => { setLoading(true); fetchCalls(); }} className="text-xs text-blue-400 hover:text-blue-300">Yenile</button>
        </div>
        {loading ? (
          <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></div>
        ) : completedCalls.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Henüz tamamlanmış arama yok</div>
        ) : (
          <div className="divide-y">
            {completedCalls.slice(0, 20).map(call => {
              const expanded = expandedCall === call.id;
              const interest = call.analysis?.structuredData?.interestLevel as string;
              const duration = call.startedAt && call.endedAt
                ? Math.round((new Date(call.endedAt).getTime() - new Date(call.startedAt).getTime()) / 1000) : 0;
              return (
                <div key={call.id}>
                  <div className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 cursor-pointer" onClick={() => setExpandedCall(expanded ? null : call.id)}>
                    <div className="flex items-center gap-3 min-w-0">
                      <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{call.customer?.name || call.name || call.customer?.number || 'Bilinmeyen'}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <span>{call.customer?.number}</span>
                          {duration > 0 && <><Clock className="h-3 w-3" /> {Math.floor(duration / 60)}:{String(duration % 60).padStart(2, '0')}</>}
                          {call.cost != null && <span>• ${call.cost.toFixed(3)}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {interest && interestBadge(interest)}
                      {statusBadge(call.status)}
                      {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>
                  {expanded && (
                    <div className="px-4 pb-4 space-y-3 bg-muted/10">
                      {call.analysis?.summary && (
                        <div className="rounded-lg bg-muted/30 p-3">
                          <div className="text-xs font-medium text-muted-foreground mb-1">Özet</div>
                          <p className="text-sm">{call.analysis.summary}</p>
                        </div>
                      )}
                      {call.analysis?.structuredData && (
                        <div className="rounded-lg bg-muted/30 p-3">
                          <div className="text-xs font-medium text-muted-foreground mb-1">Analiz</div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {Object.entries(call.analysis.structuredData).map(([k, v]) => (
                              <div key={k}><span className="text-muted-foreground">{k}: </span><span className="font-medium">{String(v)}</span></div>
                            ))}
                          </div>
                        </div>
                      )}
                      {call.analysis?.successEvaluation && (
                        <div className="rounded-lg bg-muted/30 p-3">
                          <div className="text-xs font-medium text-muted-foreground mb-1">Başarı Değerlendirmesi</div>
                          <p className="text-sm">{call.analysis.successEvaluation}</p>
                        </div>
                      )}
                      {call.artifact?.recordingUrl && (
                        <div className="flex items-center gap-2">
                          <Volume2 className="h-4 w-4 text-muted-foreground" />
                          <audio controls src={call.artifact.recordingUrl} className="h-8 flex-1" />
                        </div>
                      )}
                      {call.artifact?.transcript && (
                        <div className="rounded-lg bg-muted/30 p-3 max-h-48 overflow-auto">
                          <div className="text-xs font-medium text-muted-foreground mb-1">Transkript</div>
                          <pre className="text-xs whitespace-pre-wrap">{call.artifact.transcript}</pre>
                        </div>
                      )}
                      <div className="text-[10px] text-muted-foreground">
                        ID: {call.id} • Son Durum: {call.endedReason} • {call.startedAt && new Date(call.startedAt).toLocaleString('tr-TR')}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* WhatsApp Test Panel */}
      <div className="rounded-xl border bg-card p-6 shadow-sm mt-8 border-green-500/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <MessageSquareText className="h-5 w-5 text-green-500" /> WhatsApp Test
          </h2>
        </div>

        <div className="space-y-4">
            <div className="flex gap-4">
                <div className="flex-1">
                    <label className="text-xs font-medium text-slate-700 mb-1.5 block">Alıcı Telefonu</label>
                    <input 
                        value={waPhone} 
                        onChange={(e) => setWaPhone(e.target.value)} 
                        placeholder="+905551234567"
                        className="w-full h-10 px-3 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-green-500 outline-none" 
                    />
                </div>
                <div className="flex-1">
                    <label className="text-xs font-medium text-slate-700 mb-1.5 block">Mesaj Tipi</label>
                    <select 
                        value={waType} 
                        onChange={(e) => setWaType(e.target.value as any)}
                        className="w-full h-10 px-3 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-green-500 outline-none"
                    >
                        <option value="text">Düz Metin (Serbest)</option>
                        <option value="template">Şablon (Örn: hello_world)</option>
                        <option value="video">Video + Metin</option>
                    </select>
                </div>
            </div>

            {waType === 'video' && (
                <div>
                    <label className="text-xs font-medium text-slate-700 mb-1.5 block">Video URL</label>
                    <input 
                        value={waMediaUrl} 
                        onChange={(e) => setWaMediaUrl(e.target.value)} 
                        placeholder="https://example.com/video.mp4"
                        className="w-full h-10 px-3 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-green-500 outline-none" 
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">İnternete açık bir MP4 video linki girin.</p>
                </div>
            )}

            <div>
                <label className="text-xs font-medium text-slate-700 mb-1.5 block">
                    {waType === 'template' ? 'Şablon Adı' : 'Mesaj İçeriği'}
                </label>
                {waType === 'template' ? (
                    <input 
                        value={waMessage} 
                        onChange={(e) => setWaMessage(e.target.value)} 
                        placeholder="Örn: welcome_message"
                        className="w-full h-10 px-3 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-green-500 outline-none" 
                    />
                ) : (
                    <textarea 
                        value={waMessage} 
                        onChange={(e) => setWaMessage(e.target.value)} 
                        placeholder="Merhaba, NovoCRM'den deneme mesajı..."
                        className="w-full h-24 p-3 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-green-500 outline-none resize-none"
                    />
                )}
            </div>

            <button 
                onClick={sendWhatsApp} 
                disabled={waSending || !waPhone || (!waMessage && waType !== 'template')}
                className="h-10 px-6 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium flex items-center justify-center w-full gap-2 disabled:opacity-50 transition"
            >
                {waSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquareText className="h-4 w-4" />} Gönder
            </button>

            {waResult && (
                <div className={`mt-3 p-3 rounded-lg text-sm flex items-center gap-2 ${waResult.success ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                    {waResult.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    {waResult.message}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
