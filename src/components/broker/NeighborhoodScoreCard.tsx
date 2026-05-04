'use client';

import { useState, useEffect, useCallback } from 'react';
import { MapPin, Loader2, TreePine, School, Stethoscope, Bus, ShoppingCart, Building, Coffee, Landmark, Dumbbell, ShieldCheck, Sparkles, Copy, CheckCircle } from 'lucide-react';

interface CategoryData {
    key: string;
    label: string;
    emoji: string;
    count: number;
    items: { name: string; type: string }[];
}

interface ScoreData {
    score: number;
    coordinates: { lat: number; lon: number };
    radius: number;
    totalAmenities: number;
    categories: CategoryData[];
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
    education: <School className="h-4 w-4" />,
    health: <Stethoscope className="h-4 w-4" />,
    parks: <TreePine className="h-4 w-4" />,
    transport: <Bus className="h-4 w-4" />,
    shopping: <ShoppingCart className="h-4 w-4" />,
    worship: <Landmark className="h-4 w-4" />,
    food: <Coffee className="h-4 w-4" />,
    finance: <Building className="h-4 w-4" />,
    sports: <Dumbbell className="h-4 w-4" />,
    safety: <ShieldCheck className="h-4 w-4" />,
};

function getScoreColor(score: number) {
    if (score >= 80) return { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', ring: 'ring-emerald-500', label: 'Mükemmel', barColor: 'bg-emerald-500' };
    if (score >= 60) return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', ring: 'ring-blue-500', label: 'İyi', barColor: 'bg-blue-500' };
    if (score >= 40) return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', ring: 'ring-amber-500', label: 'Orta', barColor: 'bg-amber-500' };
    return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', ring: 'ring-red-500', label: 'Gelişmeli', barColor: 'bg-red-500' };
}

function getBarWidth(count: number): string {
    if (count >= 5) return 'w-full';
    if (count === 4) return 'w-4/5';
    if (count === 3) return 'w-3/5';
    if (count === 2) return 'w-2/5';
    if (count === 1) return 'w-1/5';
    return 'w-0';
}

interface Props {
    lat?: number | null;
    lon?: number | null;
    address?: string;
    city?: string;
    projectName?: string;
    radius?: number;
}

export default function NeighborhoodScoreCard({ lat, lon, address, city, projectName, radius = 500 }: Props) {
    const [data, setData] = useState<ScoreData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [aiText, setAiText] = useState<string | null>(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const fetchScore = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (lat && lon) {
                params.set('lat', String(lat));
                params.set('lon', String(lon));
            }
            if (address) params.set('address', address);
            if (city) params.set('city', city);
            params.set('radius', String(radius));

            const res = await fetch(`/api/overpass?${params}`);
            const json = await res.json();
            if (json.error) throw new Error(json.error);
            setData(json);
        } catch (err: any) {
            setError(err.message || 'Veri yüklenemedi');
        } finally {
            setLoading(false);
        }
    }, [lat, lon, address, city, radius]);

    useEffect(() => {
        if ((lat && lon) || address) {
            fetchScore();
        }
    }, [fetchScore, lat, lon, address]);

    const generateAIText = async () => {
        if (!data) return;
        setAiLoading(true);
        try {
            const summary = data.categories
                .filter(c => c.count > 0)
                .map(c => `${c.emoji} ${c.label}: ${c.count} adet (${c.items.slice(0, 3).map(i => i.name).join(', ')})`)
                .join('\n');

            const prompt = `Sen bir emlak pazarlama uzmanısın. Aşağıdaki mahalle analiz verilerine dayanarak, "${projectName || 'Bu proje'}" projesi için profesyonel ve ikna edici bir Türkçe lokasyon tanıtım metni yaz. Metin 3-4 cümle olsun, abartısız ama çekici olsun.

Mahalle Skoru: ${data.score}/100
Analiz Yarıçapı: ${radius}m
Veriler:
${summary}

Sadece pazarlama metnini yaz, başka açıklama ekleme.`;

            const res = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, maxTokens: 300 })
            });
            const result = await res.json();
            setAiText(result.text || result.content || result.choices?.[0]?.message?.content || 'Metin oluşturulamadı.');
        } catch {
            setAiText('AI metin oluşturma başarısız oldu.');
        } finally {
            setAiLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (aiText) {
            navigator.clipboard.writeText(aiText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!lat && !lon && !address) {
        return (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
                <MapPin className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400">Mahalle analizi için proje koordinatı veya adresi gereklidir.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-500 mb-2" />
                <p className="text-xs text-slate-500">Mahalle analizi yapılıyor...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-center">
                <p className="text-xs text-red-600">{error}</p>
                <button onClick={fetchScore} className="text-xs text-red-500 underline mt-1">Tekrar Dene</button>
            </div>
        );
    }

    if (!data) return null;

    const scoreStyle = getScoreColor(data.score);

    return (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {/* Header with Score */}
            <div className={`p-4 ${scoreStyle.bg} border-b ${scoreStyle.border}`}>
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-blue-600" />
                            Mahalle Karnesi
                        </h3>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                            {radius}m yarıçap • {data.totalAmenities} tesis bulundu
                        </p>
                    </div>
                    <div className="text-center">
                        <div className={`text-3xl font-black ${scoreStyle.text}`}>
                            {data.score}
                        </div>
                        <div className={`text-[10px] font-bold ${scoreStyle.text} uppercase tracking-wider`}>
                            {scoreStyle.label}
                        </div>
                    </div>
                </div>

                {/* Score bar */}
                <div className="mt-3 h-2 bg-white/60 rounded-full overflow-hidden">
                    <div
                        className={`h-full ${scoreStyle.barColor} rounded-full transition-all duration-1000 ease-out`}
                        style={{ width: `${data.score}%` }}
                    />
                </div>
            </div>

            {/* Categories */}
            <div className="p-4 space-y-2.5">
                {data.categories.map(cat => (
                    <div key={cat.key} className="flex items-center gap-3">
                        <div className="w-5 h-5 flex items-center justify-center text-slate-500 shrink-0">
                            {CATEGORY_ICONS[cat.key] || <span className="text-sm">{cat.emoji}</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                                <span className="text-[11px] font-semibold text-slate-700">{cat.label}</span>
                                <span className={`text-[10px] font-bold ${cat.count > 0 ? 'text-slate-700' : 'text-slate-300'}`}>
                                    {cat.count}
                                </span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-700 ${cat.count > 0 ? 'bg-blue-500' : 'bg-transparent'} ${getBarWidth(cat.count)}`} />
                            </div>
                            {cat.count > 0 && (
                                <p className="text-[9px] text-slate-400 mt-0.5 truncate">
                                    {cat.items.slice(0, 3).map(i => i.name).join(' • ')}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* AI Marketing Text Generator */}
            <div className="border-t border-slate-100 p-4">
                {!aiText ? (
                    <button
                        onClick={generateAIText}
                        disabled={aiLoading}
                        className="w-full flex items-center justify-center gap-2 h-9 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white text-xs font-semibold transition disabled:opacity-50"
                    >
                        {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                        {aiLoading ? 'AI Metin Oluşturuluyor...' : 'AI Lokasyon Metni Oluştur'}
                    </button>
                ) : (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-violet-600 uppercase tracking-wider flex items-center gap-1">
                                <Sparkles className="h-3 w-3" /> AI Lokasyon Metni
                            </span>
                            <button onClick={copyToClipboard} className="text-xs text-slate-400 hover:text-blue-600 flex items-center gap-1 transition">
                                {copied ? <><CheckCircle className="h-3 w-3 text-green-500" /> Kopyalandı</> : <><Copy className="h-3 w-3" /> Kopyala</>}
                            </button>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed bg-violet-50/50 p-3 rounded-lg border border-violet-100">
                            {aiText}
                        </p>
                        <button onClick={generateAIText} disabled={aiLoading} className="text-[10px] text-violet-500 hover:text-violet-700 underline">
                            {aiLoading ? 'Oluşturuluyor...' : 'Yeniden Oluştur'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
