'use client'

import Link from 'next/link'
import { Building2, Facebook, Instagram, Linkedin, Twitter } from 'lucide-react'
import { useBrandedTranslations, useBrand } from '@/components/providers/BrandProvider'

export function Footer() {
    const t = useBrandedTranslations('Footer')
    const { brandName, brandDomain } = useBrand()

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
                            {brandName}
                        </Link>
                        <p className="text-sm leading-relaxed mb-6">
                            {t('brandDescription')}
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
                        <h4 className="text-white font-bold mb-6">{t('solutionsTitle')}</h4>
                        <ul className="space-y-4 text-sm">
                            <li><Link href="/solutions/gayrimenkul-crm" className="hover:text-white transition-colors">{t('solutions.realestate')}</Link></li>
                            <li><Link href="/solutions/insaat-crm" className="hover:text-white transition-colors">{t('solutions.construction')}</Link></li>
                            <li><Link href="/solutions" className="hover:text-white transition-colors">{t('solutions.all')}</Link></li>
                            <li><Link href="/payment-plan-calculator" className="hover:text-white transition-colors">{t('solutions.paymentCalculator')}</Link></li>
                            <li><Link href="/tools/tapu-harci-hesaplayici" className="hover:text-white transition-colors">Tapu Harcı Hesaplayıcı</Link></li>
                            <li><Link href="/tools/serefiye-hesaplayici" className="hover:text-white transition-colors">Şerefiye Hesaplayıcı</Link></li>
                            <li><Link href="/tools/emlak-vergisi-hesaplayici" className="hover:text-white transition-colors">Emlak Vergisi Hesaplayıcı</Link></li>
                            <li><Link href="/tools/konut-kredisi-karsilastirma" className="hover:text-white transition-colors">Konut Kredisi Karşılaştırma</Link></li>
                            <li><Link href="/karsilastirma/en-iyi-gayrimenkul-crm-2026" className="hover:text-white transition-colors">CRM Karşılaştırma</Link></li>
                            <li><a href="https://mulkunuhesapla.com/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">{t('solutions.mulkunuhesapla')}</a></li>
                        </ul>
                    </div>

                    {/* SEO / Legal Links */}
                    <div>
                        <h4 className="text-white font-bold mb-6">{t('corporateTitle')}</h4>
                        <ul className="space-y-4 text-sm">
                            <li><Link href="/hakkimizda" className="hover:text-white transition-colors">{t('corporate.about')} / Hakkımızda</Link></li>
                            <li><Link href="/wiki" className="hover:text-white transition-colors">{t('corporate.wiki')}</Link></li>
                            <li><Link href="/gizlilik-sozlesmesi" className="hover:text-white transition-colors">Gizlilik Sözleşmesi</Link></li>
                            <li><Link href="/mesafeli-satis-sozlesmesi" className="hover:text-white transition-colors">Mesafeli Satış Sözleşmesi</Link></li>
                            <li><Link href="/teslimat-ve-iade-sartlari" className="hover:text-white transition-colors">Teslimat ve İade Şartları</Link></li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h4 className="text-white font-bold mb-6">{t('contactTitle')}</h4>
                        <ul className="space-y-4 text-sm">
                            <li>E-posta: info@{brandDomain}</li>
                            <li>Adres: İstanbul, Türkiye</li>
                            <li className="pt-2">
                                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                                    <p className="text-xs text-slate-500 mb-2 font-medium">{t('newsletter.title')}</p>
                                    <div className="flex gap-2">
                                        <input
                                            type="email"
                                            placeholder={t('newsletter.placeholder')}
                                            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1 text-xs w-full focus:outline-none focus:border-blue-500"
                                        />
                                        <button className="bg-blue-600 text-white rounded-lg px-3 py-1 text-xs font-bold hover:bg-blue-700">{t('newsletter.button')}</button>
                                    </div>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-6 text-xs">
                    <p>{t('copyright')}</p>
                    
                    {/* Payment Logos & SSL */}
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-300">
                            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                            <span className="font-medium tracking-tight">256-bit SSL</span>
                        </div>
                        
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg opacity-80 hover:opacity-100 transition-opacity">
                            {/* Visa */}
                            <svg className="h-4" viewBox="0 0 38 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M14.4468 0L12.5532 11.5178H9.37851L11.2721 0H14.4468ZM26.7906 0.177002C25.7958 0.177002 24.8184 0.404284 23.9515 0.838421L24.5126 3.42163C25.2343 3.08253 26.0123 2.90382 26.8049 2.89437C27.6732 2.89437 28.0829 3.26768 28.0829 3.77443C28.0829 5.37805 24.1672 5.46743 24.1672 8.3537C24.1672 10.4286 25.8675 11.6888 28.0818 11.6888C29.2136 11.6961 30.3235 11.3934 31.2917 10.8129L30.7306 8.24151C30.0157 8.64731 29.1993 8.86016 28.3688 8.85764C27.424 8.85764 27.0583 8.44186 27.0583 7.97103C27.0583 6.30252 30.9575 6.13601 30.9575 3.32832C30.9564 1.25841 29.2949 0.177002 26.7906 0.177002ZM36.0021 11.5178H38L36.6997 0H33.858C33.3243 0 32.8806 0.35928 32.6975 0.864455L27.9763 11.5178H31.1396L31.7706 9.77197H35.6322L36.0021 11.5178ZM32.6416 7.41164L34.1959 3.12579L35.0805 7.41164H32.6416ZM8.84752 0.0538025L6.37682 7.84883L6.09638 6.39868C5.81182 5.09341 4.54581 3.52292 2.76813 2.68412L3.38531 11.5178H6.55648L10.3708 0.0538025H8.84752ZM0 0.0538025H5.05608C5.74872 0.0538025 6.22384 0.229094 6.6471 0.70425L9.67385 11.5178H6.46747L5.83403 9.77197H1.73688L1.37059 11.5178H0V0.0538025Z" fill="#ffffff"/>
                            </svg>
                            {/* Mastercard */}
                            <svg className="h-5 ml-1" viewBox="0 0 32 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="10" cy="10" r="10" fill="#EB001B"/>
                                <circle cx="22" cy="10" r="10" fill="#F79E1B"/>
                                <path d="M16 18C18.2 18 20.08 16.53 20.78 14.53H11.22C11.92 16.53 13.8 18 16 18ZM11.22 5.47C11.92 3.47 13.8 2 16 2C18.2 2 20.08 3.47 20.78 5.47H11.22ZM10 12.5C10 11.64 10.15 10.8 10.42 10C10.15 9.2 10 8.36 10 7.5H22C22 8.36 21.85 9.2 21.58 10C21.85 10.8 22 11.64 22 12.5H10Z" fill="#FF5F00"/>
                            </svg>
                            <div className="h-4 w-px bg-slate-700 mx-1"></div>
                            <span className="font-semibold text-slate-100 flex items-center gap-1"><span className="text-[#0055FF]">iyzi</span>co ile Öde</span>
                        </div>
                    </div>

                    <div className="flex gap-6">
                        <span>{t('tagline1')}</span>
                        <span>{t('tagline2')}</span>
                    </div>
                </div>
            </div>
        </footer>
    )
}
