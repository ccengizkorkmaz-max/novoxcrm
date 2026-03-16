"use client";
import { ebookContent } from '@/data/ebook-content';
import { Download, ChevronLeft, Book, CheckSquare } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useCallback } from 'react';

export default function EbookDetailPage() {
    const generatePdf = useCallback(async () => {
        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        const contentWidth = pageWidth - 2 * margin;
        let y = margin;

        const addPageIfNeeded = (requiredSpace: number) => {
            if (y + requiredSpace > pageHeight - margin) {
                doc.addPage();
                y = margin;
            }
        };

        // ---- COVER PAGE ----
        // Background
        doc.setFillColor(15, 23, 42); // slate-900
        doc.rect(0, 0, pageWidth, pageHeight, 'F');

        // Cover image
        try {
            const img = new window.Image();
            img.crossOrigin = 'anonymous';
            await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = () => reject();
                img.src = ebookContent.coverImage;
            });
            const imgW = contentWidth;
            const imgH = (img.height / img.width) * imgW;
            const imgY = (pageHeight - imgH) / 2 - 10;
            doc.addImage(img, 'JPEG', margin, Math.max(20, imgY), imgW, Math.min(imgH, pageHeight - 60));
        } catch {
            // If image fails, show text-only cover
            doc.setFontSize(28);
            doc.setTextColor(255, 255, 255);
            doc.text(ebookContent.title, pageWidth / 2, 80, { align: 'center', maxWidth: contentWidth });
            doc.setFontSize(14);
            doc.setTextColor(96, 165, 250); // blue-400
            doc.text(ebookContent.subtitle, pageWidth / 2, 120, { align: 'center', maxWidth: contentWidth });
        }

        // ---- CONTENT PAGES ----
        ebookContent.chapters.forEach((chapter) => {
            doc.addPage();
            y = margin;

            // Page background
            doc.setFillColor(248, 250, 252); // slate-50
            doc.rect(0, 0, pageWidth, pageHeight, 'F');

            // Chapter header bar
            doc.setFillColor(37, 99, 235); // blue-600
            doc.rect(0, 0, pageWidth, 8, 'F');

            y = 25;

            // Chapter number
            doc.setFontSize(12);
            doc.setTextColor(37, 99, 235);
            doc.text(`BOLUM ${chapter.id}`, margin, y);
            y += 10;

            // Chapter title
            doc.setFontSize(20);
            doc.setTextColor(15, 23, 42);
            const titleText = chapter.title.includes(': ') ? chapter.title.split(': ')[1] : chapter.title;
            const titleLines = doc.splitTextToSize(titleText, contentWidth);
            doc.text(titleLines, margin, y);
            y += titleLines.length * 9 + 8;

            // Divider
            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.5);
            doc.line(margin, y, pageWidth - margin, y);
            y += 10;

            // Parse HTML content to plain text sections
            const rawContent = chapter.content
                .replace(/<div class="(tip|note)">/g, '\n[INFO] ')
                .replace(/<\/div>/g, '\n')
                .replace(/<ul class="requirements">/g, '')
                .replace(/<\/ul>/g, '')
                .replace(/<li>/g, '  - ')
                .replace(/<\/li>/g, '\n')
                .replace(/<h3>/g, '\n### ')
                .replace(/<\/h3>/g, '\n')
                .replace(/<strong>/g, '')
                .replace(/<\/strong>/g, '')
                .replace(/<p>/g, '')
                .replace(/<\/p>/g, '\n')
                .replace(/<[^>]*>/g, '')
                .replace(/\n{3,}/g, '\n\n')
                .trim();

            const paragraphs = rawContent.split('\n');

            paragraphs.forEach((para) => {
                const trimmed = para.trim();
                if (!trimmed) { y += 3; return; }

                addPageIfNeeded(20);

                if (trimmed.startsWith('### ')) {
                    // Sub-heading
                    doc.setFontSize(13);
                    doc.setTextColor(37, 99, 235);
                    const subLines = doc.splitTextToSize(trimmed.replace('### ', ''), contentWidth);
                    doc.text(subLines, margin, y);
                    y += subLines.length * 6 + 5;
                } else if (trimmed.startsWith('[INFO]')) {
                    // Info box
                    const infoText = trimmed.replace('[INFO] ', '');
                    const boxLines = doc.splitTextToSize(infoText, contentWidth - 16);
                    const boxHeight = boxLines.length * 5.5 + 10;
                    addPageIfNeeded(boxHeight + 5);
                    doc.setFillColor(219, 234, 254); // blue-100
                    doc.roundedRect(margin, y - 3, contentWidth, boxHeight, 3, 3, 'F');
                    doc.setFontSize(10);
                    doc.setTextColor(30, 64, 175); // blue-800
                    doc.text(boxLines, margin + 8, y + 4);
                    y += boxHeight + 5;
                } else if (trimmed.startsWith('- ')) {
                    // List item
                    doc.setFontSize(10);
                    doc.setTextColor(51, 65, 85);
                    const listLines = doc.splitTextToSize(trimmed, contentWidth - 10);
                    doc.text(listLines, margin + 6, y);
                    y += listLines.length * 5 + 2;
                } else {
                    // Normal paragraph
                    doc.setFontSize(10.5);
                    doc.setTextColor(51, 65, 85);
                    const lines = doc.splitTextToSize(trimmed, contentWidth);
                    addPageIfNeeded(lines.length * 5 + 5);
                    doc.text(lines, margin, y);
                    y += lines.length * 5 + 5;
                }
            });
        });

        // ---- CONCLUSION PAGE ----
        doc.addPage();
        doc.setFillColor(248, 250, 252);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
        doc.setFillColor(37, 99, 235);
        doc.rect(0, 0, pageWidth, 8, 'F');

        y = 30;
        doc.setFontSize(22);
        doc.setTextColor(15, 23, 42);
        doc.text(ebookContent.conclusion.title, margin, y);
        y += 15;

        doc.setFontSize(11);
        doc.setTextColor(71, 85, 105);
        const conclusionLines = doc.splitTextToSize(ebookContent.conclusion.text, contentWidth);
        doc.text(conclusionLines, margin, y);
        y += conclusionLines.length * 5.5 + 15;

        // Checklist box
        doc.setFillColor(219, 234, 254);
        const checklistItems = ebookContent.conclusion.checklist;

        let checklistHeight = 15;
        const checkListTextLines: string[][] = [];
        checklistItems.forEach(item => {
            const tLines = doc.splitTextToSize(item, contentWidth - 24);
            checkListTextLines.push(tLines);
            checklistHeight += tLines.length * 5.5 + 4;
        });

        doc.roundedRect(margin, y, contentWidth, checklistHeight + 5, 4, 4, 'F');
        y += 10;

        doc.setFontSize(12);
        doc.setTextColor(30, 64, 175);
        doc.text('Donusum Kontrol Listesi', margin + 10, y);
        y += 10;

        doc.setFontSize(10);
        doc.setTextColor(30, 64, 175);
        checkListTextLines.forEach((tLines) => {
            doc.text('\u2714', margin + 10, y);
            doc.text(tLines, margin + 18, y);
            y += tLines.length * 5.5 + 4;
        });

        // ---- FOOTER on last page ----
        y = pageHeight - 15;
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text('\u00a9 2026 NovoxCrm - novoxcrm.com | Tum Haklari Saklidir.', pageWidth / 2, y, { align: 'center' });

        // Open in browser
        const pdfBlob = doc.output('blob');
        const url = URL.createObjectURL(pdfBlob);
        window.open(url, '_blank');
    }, []);

    return (
        <div className="bg-slate-950 min-h-screen pt-32 pb-20 selection:bg-blue-500 selection:text-white">
            <div className="container mx-auto px-4">
                {/* Back Button */}
                <Link 
                    href="/wiki" 
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-12 group transition-colors"
                >
                    <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    Bilgi Bankasına Dön
                </Link>

                <div className="grid lg:grid-cols-12 gap-16 max-w-7xl mx-auto">
                    {/* Left: Cover & Info */}
                    <div className="lg:col-span-4 space-y-8">
                        <div className="sticky top-32">
                            <div className="rounded-[2.5rem] overflow-hidden shadow-2xl shadow-blue-900/20 border border-slate-800 bg-slate-900">
                                <Image 
                                    src={ebookContent.coverImage} 
                                    alt={ebookContent.title}
                                    width={800}
                                    height={1200}
                                    className="w-full h-auto"
                                />
                            </div>
                            
                            <div className="mt-8 space-y-6">
                                <button 
                                    onClick={generatePdf}
                                    className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-blue-900/30 group active:scale-95"
                                >
                                    <Download size={24} className="group-hover:translate-y-0.5 transition-transform" />
                                    PDF Olarak İndir
                                </button>
                                
                                <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">Yayıncı:</span>
                                        <span className="text-white font-medium">{ebookContent.author}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">Yayımlanma:</span>
                                        <span className="text-white font-medium">{ebookContent.date}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">Format:</span>
                                        <span className="text-white font-medium">PDF (Yüksek Kalite)</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Content */}
                    <div className="lg:col-span-8 bg-slate-900/30 p-8 md:p-16 rounded-[3rem] border border-slate-800 shadow-2xl">
                        {/* Title Section */}
                        <div className="text-center md:text-left mb-16">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold mb-6">
                                <Book size={14} /> ÜCRETSİZ E-BOOK
                            </div>
                            <h1 className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight">
                                {ebookContent.title}
                            </h1>
                            <p className="text-xl text-blue-400 font-medium">
                                {ebookContent.subtitle}
                            </p>
                        </div>

                        {/* Chapters */}
                        <div className="space-y-20">
                            {ebookContent.chapters.map((chapter) => (
                                <section key={chapter.id} className="ebook-chapter">
                                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 flex items-center gap-4">
                                        <span className="text-blue-500">{chapter.id}.</span>
                                        {chapter.title.split(': ')[1]}
                                    </h2>
                                    <div 
                                        className="text-slate-300 leading-relaxed space-y-6 text-lg ebook-content"
                                        dangerouslySetInnerHTML={{ __html: chapter.content }}
                                    />
                                </section>
                            ))}
                        </div>

                        {/* Conclusion */}
                        <div className="mt-20 pt-20 border-t border-slate-800">
                            <h2 className="text-3xl font-bold text-white mb-8">
                                {ebookContent.conclusion.title}
                            </h2>
                            <p className="text-slate-400 text-lg mb-12">
                                {ebookContent.conclusion.text}
                            </p>

                            <div className="bg-blue-600/10 border border-blue-500/20 p-8 md:p-12 rounded-3xl">
                                <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
                                    <CheckSquare className="text-blue-400" />
                                    Dönüşüm Kontrol Listesi
                                </h3>
                                <ul className="space-y-6">
                                    {ebookContent.conclusion.checklist.map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-4 text-slate-300">
                                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .ebook-content h3 {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: #60a5fa;
                    margin-top: 1.5rem;
                    margin-bottom: 0.75rem;
                }
                .ebook-content p {
                    margin-bottom: 1rem;
                    line-height: 1.8;
                }
                .ebook-content .tip, .ebook-content .note {
                    background: rgba(37, 99, 235, 0.1);
                    border: 1px solid rgba(37, 99, 235, 0.2);
                    border-radius: 1rem;
                    padding: 1.25rem 1.5rem;
                    margin: 1.5rem 0;
                }
                .ebook-content ul.requirements {
                    list-style: none;
                    padding: 0;
                }
                .ebook-content ul.requirements li {
                    padding: 0.5rem 0;
                    padding-left: 1.5rem;
                    position: relative;
                }
                .ebook-content ul.requirements li:before {
                    content: '✓';
                    position: absolute;
                    left: 0;
                    color: #60a5fa;
                    font-weight: bold;
                }
            `}</style>
        </div>
    );
}
