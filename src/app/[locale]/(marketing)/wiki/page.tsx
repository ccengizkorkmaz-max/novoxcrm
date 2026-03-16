"use client";
import { useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Search, BookOpen, ArrowRight, Sparkles } from 'lucide-react'
import Image from 'next/image'
import { wikiArticles } from '@/data/wiki-data'

// ======= KAVRAMSAl ARAMA SİSTEMİ =======
// Her kavram grubu birbirleriyle eşanlamlı veya kavramsal olarak ilişkilidir.
// Kullanıcı bunlardan herhangi birini yazarsa, gruptaki tüm kelimeleri arar.
const CONCEPT_MAP: Record<string, string[]> = {
    // CRM & Yazılım
    'crm': ['crm', 'yazılım', 'sistem', 'platform', 'uygulama', 'program', 'araç', 'çözüm'],
    'yazılım': ['yazılım', 'crm', 'sistem', 'platform', 'uygulama', 'program', 'dijital', 'teknoloji'],
    'sistem': ['sistem', 'yazılım', 'crm', 'platform', 'altyapı','çözüm'],
    'dijital': ['dijital', 'teknoloji', 'online', 'elektronik', 'otomasyon', 'bulut'],
    'otomasyon': ['otomasyon', 'otomatik', 'otomatikleştirme', 'akış', 'süreç', 'iş akışı'],
    // Satış
    'satış': ['satış', 'satiş', 'satis', 'lead', 'müşteri', 'kapama', 'dönüşüm', 'pipeline', 'huni'],
    'lead': ['lead', 'aday', 'müşteri adayı', 'potansiyel', 'form', 'başvuru'],
    'müşteri': ['müşteri', 'alıcı', 'potansiyel', 'aday', 'lead', 'hesap', 'iletişim'],
    'teklif': ['teklif', 'fiyat', 'pdf', 'ödeme planı', 'taksit', 'senaryo', 'simülasyon'],
    'pipeline': ['pipeline', 'huni', 'satış hunisi', 'aşama', 'süreç', 'fırsat'],
    // Stok & Envanter
    'stok': ['stok', 'envanter', 'daire', 'ünite', 'portföy', 'opsiyonlama', 'rezervasyon'],
    'daire': ['daire', 'konut', 'ünite', 'kat', 'blok', 'stok', 'm²', 'fiyat'],
    'kat planı': ['kat planı', 'vaziyet planı', 'proje planı', 'lejant', 'blok', 'mimari'],
    'şerefiye': ['şerefiye', 'fiyatlandırma', 'değerleme', 'fiyat', 'cephe', 'kat'],
    // Finans & Ödeme
    'ödeme': ['ödeme', 'taksit', 'senet', 'tahsilat', 'peşinat', 'finans', 'nakit'],
    'senet': ['senet', 'taksit', 'vade', 'ödeme', 'tahsilat', 'bono'],
    'finans': ['finans', 'finansal', 'nakit', 'bütçe', 'maliyet', 'gelir', 'gider', 'karlılık'],
    'tahsilat': ['tahsilat', 'ödeme', 'vade', 'gecikme', 'senet', 'taksit'],
    // Güvenlik & Uyum
    'kvkk': ['kvkk', 'kişisel veri', 'gizlilik', 'güvenlik', 'veri koruma', 'gdpr', 'yasa'],
    'güvenlik': ['güvenlik', 'siber', 'veri', 'şifre', 'erişim', 'yetkilendirme', 'kvkk'],
    'veri': ['veri', 'data', 'bilgi', 'kayıt', 'veritabanı', 'güvenlik', 'yedek'],
    // Entegrasyon
    'entegrasyon': ['entegrasyon', 'api', 'bağlantı', 'webhook', 'senkronizasyon', 'erp', 'crm'],
    'api': ['api', 'entegrasyon', 'webhook', 'bağlantı', 'rest', 'http', 'token'],
    'whatsapp': ['whatsapp', 'sms', 'mesaj', 'bildirim', 'iletişim', 'kanal'],
    // Proje & İnşaat
    'inşaat': ['inşaat', 'proje', 'konut', 'gayrimenkul', 'müteahhit', 'yapı'],
    'proje': ['proje', 'inşaat', 'konut', 'geliştirme', 'gayrimenkul', 'yapı'],
    'gayrimenkul': ['gayrimenkul', 'emlak', 'konut', 'taşınmaz', 'mülk', 'inşaat', 'proje'],
    'emlak': ['emlak', 'gayrimenkul', 'konut', 'taşınmaz', 'mülk', 'aracı', 'danışman'],
    // Brokerlar
    'broker': ['broker', 'acente', 'danışman', 'aracı', 'komisyon', 'kanal', 'işbirliği'],
    'komisyon': ['komisyon', 'hakediş', 'ücret', 'prim', 'ödeme', 'broker'],
    // Raporlama & Analiz
    'rapor': ['rapor', 'analiz', 'dashboard', 'metrik', 'istatistik', 'performans', 'grafik'],
    'analiz': ['analiz', 'rapor', 'veri', 'metrik', 'ölçüm', 'dashboard', 'insight'],
    'performans': ['performans', 'verimlilik', 'hedef', 'metrik', 'kpi', 'başarı', 'ölçüm'],
    // Sorun & Hata
    'hata': ['hata', 'sorun', 'problem', 'bug', 'çözüm', 'düzeltme', 'fix'],
    'sorun': ['sorun', 'hata', 'problem', 'zorluk', 'engel', 'çözüm'],
    'çözüm': ['çözüm', 'çöz', 'düzelt', 'fix', 'strateji', 'yöntem', 'öneri'],
    // Eğitim & Strateji
    'eğitim': ['eğitim', 'öğren', 'rehber', 'kurs', 'sertifika', 'uzmanlaş', 'geliştir'],
    'strateji': ['strateji', 'yöntem', 'plan', 'yaklaşım', 'taktik', 'çözüm'],
    'yönetim': ['yönetim', 'yönet', 'kontrol', 'takip', 'izleme', 'süreç'],
    // Dijital Dönüşüm
    'dönüşüm': ['dönüşüm', 'değişim', 'dijital', 'modernleştirme', 'geçiş', 'inovasyon'],
    'bulut': ['bulut', 'cloud', 'saas', 'online', 'web tabanlı', 'uzaktan'],
    // Müşteri Deneyimi
    'referans': ['referans', 'tavsiye', 'referral', 'öneri', 'müşteri getir'],
    'memnuniyet': ['memnuniyet', 'deneyim', 'şikayet', 'nps', 'geri bildirim', 'kalite'],
};

/** Türkçe karakterleri normalize et (ş→s, ü→u vb.) */
function normalize(text: string): string {
    return text
        .toLowerCase()
        .replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u')
        .replace(/ö/g, 'o').replace(/ı/g, 'i').replace(/ç/g, 'c')
        .replace(/İ/g, 'i').replace(/Ş/g, 's').replace(/Ğ/g, 'g')
        .replace(/Ü/g, 'u').replace(/Ö/g, 'o').replace(/Ç/g, 'c');
}

/** Arama terimini genişlet: eş anlamlı ve kavramsal terimleri dahil et */
function expandSearchTerms(query: string): string[] {
    const terms = new Set<string>();
    const queryLower = query.toLowerCase().trim();
    const queryNorm = normalize(queryLower);

    // Her zaman orjinal terimi ekle
    terms.add(queryLower);
    terms.add(queryNorm);

    // Kavramsal haritada bul
    for (const [key, synonyms] of Object.entries(CONCEPT_MAP)) {
        const keyNorm = normalize(key);
        if (
            queryNorm.includes(keyNorm) || keyNorm.includes(queryNorm) ||
            queryLower.includes(key) || key.includes(queryLower)
        ) {
            synonyms.forEach(s => {
                terms.add(s);
                terms.add(normalize(s));
            });
        }
        // synonym listesinde de ara
        for (const synonym of synonyms) {
            const synNorm = normalize(synonym);
            if (queryNorm.includes(synNorm) || synNorm.includes(queryNorm)) {
                synonyms.forEach(s => {
                    terms.add(s);
                    terms.add(normalize(s));
                });
                break;
            }
        }
    }

    return Array.from(terms);
}

/** Bir metni normalize edilmiş terim listesiyle eşleştir */
function matchesAnyTerm(text: string, terms: string[]): boolean {
    const textLower = text.toLowerCase();
    const textNorm = normalize(text);
    return terms.some(term =>
        textLower.includes(term) || textNorm.includes(normalize(term))
    );
}

export default function WikiPage() {
    const params = useParams()
    const locale = (params?.locale as string) || 'tr'
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('Tümü')

    const categories = useMemo(() => {
        return ['Tümü', ...Array.from(new Set(wikiArticles.map(a => a.category)))];
    }, []);

    const { filteredArticles, isConceptual } = useMemo(() => {
        if (!searchTerm.trim()) {
            return {
                filteredArticles: wikiArticles.filter(a =>
                    selectedCategory === 'Tümü' || a.category === selectedCategory
                ),
                isConceptual: false
            };
        }

        const expandedTerms = expandSearchTerms(searchTerm);
        const isConceptual = expandedTerms.length > 2; // 2'den fazla terim genişleme var

        const results = wikiArticles.filter(article => {
            const matchesCategory = selectedCategory === 'Tümü' || article.category === selectedCategory;
            if (!matchesCategory) return false;

            const searchFields = [
                article.title,
                article.excerpt,
                article.category,
                article.content,
                ...(article.tags || [])
            ];

            return searchFields.some(field => matchesAnyTerm(field, expandedTerms));
        });

        return { filteredArticles: results, isConceptual };
    }, [searchTerm, selectedCategory]);

    return (
        <div className="bg-slate-950 min-h-screen pt-32 pb-20">
            <div className="container mx-auto px-4">
                {/* Header Section */}
                <div className="max-w-4xl mx-auto text-center mb-20">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-sm font-bold mb-6">
                        <BookOpen size={16} /> BİLGİ BANKASI & BLOG
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
                        Gayrimenkul & İnşaat <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Teknoloji Rehberi</span>
                    </h1>
                    <p className="text-lg text-slate-400 leading-relaxed">
                        Sektörel trendler, CRM stratejileri ve dijital dönüşüm üzerine <span className="text-white font-semibold">{wikiArticles.length}</span> derinlemesine makale.
                    </p>

                    {/* Search Bar */}
                    <div className="mt-12 relative max-w-2xl mx-auto">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Kavramsal arama: 'güvenlik', 'ödeme', 'broker'..."
                            className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-12 pr-14 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-2xl"
                        />
                        <Sparkles className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500" size={18} />
                    </div>
                    {isConceptual && searchTerm && (
                        <div className="mt-3 flex justify-center">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs">
                                <Sparkles size={12} />
                                Kavramsal arama aktif — ilişkili tüm kavramlar taranıyor
                            </div>
                        </div>
                    )}
                </div>

                {/* Categories */}
                <div className="flex flex-wrap justify-center gap-3 mb-12">
                    {categories.map(cat => (
                        <button 
                            key={cat} 
                            onClick={() => setSelectedCategory(cat)}
                            className={cn(
                                "px-6 py-2 rounded-full border transition-all text-sm font-medium",
                                selectedCategory === cat 
                                    ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-900/20" 
                                    : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Results Count */}
                <div className="flex items-center justify-between max-w-7xl mx-auto mb-8 px-2">
                    <p className="text-slate-500 text-sm">
                        {searchTerm || selectedCategory !== 'Tümü' 
                            ? <><span className="text-white font-semibold">{filteredArticles.length}</span> sonuç bulundu{isConceptual ? <span className="ml-2 text-blue-500">(kavramsal)</span> : null}</>
                            : <>Toplam <span className="text-white font-semibold">{wikiArticles.length}</span> makale</>
                        }
                    </p>
                </div>

                {/* Article Grid */}
                {filteredArticles.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                        {filteredArticles.map((article) => (
                            <Link
                                key={article.slug}
                                href={`/${locale}/wiki/${article.slug}`}
                                className="group p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-blue-500/30 transition-all flex flex-col h-full relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="flex items-center justify-between mb-6">
                                        <span className="px-3 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                                            {article.category}
                                        </span>
                                        <span className="text-slate-500 text-[10px]">{article.readTime}</span>
                                    </div>

                                    <h3 className="text-xl font-bold text-white mb-4 group-hover:text-blue-400 transition-colors line-clamp-2">
                                        {article.title}
                                    </h3>

                                    <p className="text-slate-400 text-sm leading-relaxed mb-8 line-clamp-3">
                                        {article.excerpt}
                                    </p>

                                    <div className="mt-auto flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[10px] text-white font-bold">
                                                {article.author.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[11px] text-slate-300 font-bold">{article.author}</span>
                                                <span className="text-[9px] text-slate-500">{article.authorTitle}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center text-xs font-bold text-slate-400 group-hover:text-blue-400 transition-colors">
                                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <p className="text-slate-500 text-lg">Aradığınız kriterlere uygun makale bulunamadı.</p>
                        <button 
                            onClick={() => {setSearchTerm(''); setSelectedCategory('Tümü')}}
                            className="mt-4 text-blue-400 hover:underline"
                        >
                            Tüm makaleleri göster
                        </button>
                    </div>
                )}
                
                {/* Featured E-Book Section */}
                <div className="mt-32 max-w-7xl mx-auto">
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[3rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative p-8 md:p-16 rounded-[2.8rem] bg-slate-900 border border-slate-800 flex flex-col lg:flex-row items-center gap-12 overflow-hidden">
                            {/* Background decoration */}
                            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -mr-48 -mt-48" />
                            
                            {/* Book Image */}
                            <div className="w-full lg:w-1/3 shrink-0 relative z-10">
                                <div className="rounded-[2rem] overflow-hidden shadow-2xl shadow-black/50 border border-slate-700/50 transform group-hover:scale-105 transition-transform duration-500">
                                    <Image 
                                        src="/images/ebook-cover.jpg" 
                                        alt="Gayrimenkul Projelerinde Dijital Dönüşüm Rehberi"
                                        width={400}
                                        height={600}
                                        className="w-full h-auto"
                                    />
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 text-center lg:text-left relative z-10">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold mb-6">
                                    <BookOpen size={14} /> ÜCRETSİZ E-BOOK
                                </div>
                                <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                                    Gayrimenkul Projelerinde <br className="hidden md:block" />
                                    <span className="text-blue-500">Dijital Dönüşüm Rehberi</span>
                                </h2>
                                <p className="text-slate-400 text-lg mb-10 max-w-2xl">
                                    "Veri Kaybından Finansal Denetime: Satış Süreçlerinizi Nasıl Güvence Altına Alırsınız?" 
                                    başlıklı kapsamlı rehberimizi hemen ücretsiz indirin.
                                </p>
                                <div className="flex flex-col sm:flex-row items-center gap-6">
                                    <Link 
                                        href="/ebooks/gayrimenkul-projelerinde-dijital-donusum-rehberi"
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-blue-900/30 active:scale-95"
                                    >
                                        Hemen Oku & İndir
                                    </Link>
                                    <div className="flex items-center gap-4 text-slate-500 text-sm italic">
                                        <div className="flex -space-x-2">
                                            {[1,2,3].map(i => (
                                                <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-bold">
                                                    U{i}
                                                </div>
                                            ))}
                                        </div>
                                        500+ indirme bu hafta
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Newsletter / CTA Section */}
                <div className="mt-32 max-w-5xl mx-auto p-12 rounded-[40px] bg-gradient-to-br from-blue-900/20 to-slate-900 border border-blue-500/10 text-center relative overflow-hidden">
                    <h2 className="text-3xl font-bold text-white mb-6">Yeni Makalelerden Haberdar Olun</h2>
                    <p className="text-slate-400 mb-10 max-w-xl mx-auto">
                        Gayrimenkul teknolojileri ve dijital dönüşüm stratejilerini ayda bir kez e-postanızda görün.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                        <input
                            type="email"
                            placeholder="E-posta adresiniz"
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20">
                            Abone Ol
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Helper for class names
function cn(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(' ');
}
