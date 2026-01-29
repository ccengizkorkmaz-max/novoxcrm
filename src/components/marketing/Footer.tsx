
import Link from 'next/link'
import { Building2, Facebook, Instagram, Linkedin, Twitter } from 'lucide-react'

export function Footer() {
    return (
        <footer className="bg-slate-950 text-slate-400 border-t border-slate-900 py-12 md:py-20">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    {/* Brand Section */}
                    <div className="col-span-1 md:col-span-1">
                        <Link href="/" className="flex items-center gap-2 text-white font-bold text-2xl mb-6">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <Building2 size={20} className="text-white" />
                            </div>
                            NovoxCRM
                        </Link>
                        <p className="text-sm leading-relaxed mb-6">
                            İnşaat ve gayrimenkul projeleri için uçtan uca satış yönetimi ve CRM çözümü. Satış ofisinizi dijitalleştirin, veriminizi artırın.
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="hover:text-blue-500 transition-colors"><Facebook size={20} /></a>
                            <a href="#" className="hover:text-blue-400 transition-colors"><Twitter size={20} /></a>
                            <a href="#" className="hover:text-blue-600 transition-colors"><Linkedin size={20} /></a>
                            <a href="#" className="hover:text-pink-500 transition-colors"><Instagram size={20} /></a>
                        </div>
                    </div>

                    {/* Product Links */}
                    <div>
                        <h4 className="text-white font-bold mb-6">Çözümler</h4>
                        <ul className="space-y-4 text-sm">
                            <li><Link href="/solutions/gayrimenkul-crm" className="hover:text-white transition-colors">Gayrimenkul CRM</Link></li>
                            <li><Link href="/solutions/insaat-crm" className="hover:text-white transition-colors">İnşaat CRM</Link></li>
                            <li><Link href="/solutions" className="hover:text-white transition-colors">Tüm Çözümler</Link></li>
                            <li><Link href="/payment-plan-calculator" className="hover:text-white transition-colors">Ödeme Planı Sihirbazı</Link></li>
                        </ul>
                    </div>

                    {/* SEO / Legal Links */}
                    <div>
                        <h4 className="text-white font-bold mb-6">Kurumsal</h4>
                        <ul className="space-y-4 text-sm">
                            <li><Link href="#" className="hover:text-white transition-colors">Hakkımızda</Link></li>
                            <li><Link href="/wiki" className="hover:text-white transition-colors">Bilgi Bankası (Wiki)</Link></li>
                            <li><Link href="#" className="hover:text-white transition-colors">KVKK Aydınlatma Metni</Link></li>
                            <li><Link href="#" className="hover:text-white transition-colors">Kullanım Koşulları</Link></li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h4 className="text-white font-bold mb-6">İletişim</h4>
                        <ul className="space-y-4 text-sm">
                            <li>E-posta: info@novoxcrm.com</li>
                            <li>Adres: İstanbul, Türkiye</li>
                            <li className="pt-2">
                                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                                    <p className="text-xs text-slate-500 mb-2 font-medium">HABERDAR OLUN</p>
                                    <div className="flex gap-2">
                                        <input
                                            type="email"
                                            placeholder="E-posta"
                                            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1 text-xs w-full focus:outline-none focus:border-blue-500"
                                        />
                                        <button className="bg-blue-600 text-white rounded-lg px-3 py-1 text-xs font-bold hover:bg-blue-700">OK</button>
                                    </div>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
                    <p>© 2026 NovoxCRM. Tüm hakları saklıdır.</p>
                    <div className="flex gap-6">
                        <span>Gayrimenkul CRM Yazılımı</span>
                        <span>İnşaat Proje Satış Sistemi</span>
                    </div>
                </div>
            </div>
        </footer>
    )
}
