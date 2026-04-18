/**
 * Report Export Utilities
 * PDF (via browser print) + Excel (CSV with BOM for Turkish chars)
 */

export function exportToExcel(data: Record<string, any>[], filename: string, sheetTitle?: string) {
    if (!data.length) return

    // BOM for UTF-8 Turkish characters
    const BOM = '\uFEFF'
    const headers = Object.keys(data[0])
    const headerRow = headers.join(';')
    const rows = data.map(row =>
        headers.map(h => {
            const val = row[h]
            if (val === null || val === undefined) return ''
            if (typeof val === 'string' && (val.includes(';') || val.includes('"') || val.includes('\n'))) {
                return `"${val.replace(/"/g, '""')}"`
            }
            return String(val)
        }).join(';')
    )

    const csv = BOM + [headerRow, ...rows].join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    downloadBlob(blob, `${filename}.csv`)
}

export function exportToPDF(elementId: string, title: string) {
    // Create a print-friendly version
    const content = document.getElementById(elementId)
    if (!content) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
        alert('Popup izni gereklidir. Lütfen tarayıcınızda popup izin verin.')
        return
    }

    const now = new Date().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })

    printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${title} - ${now}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', -apple-system, sans-serif;
            color: #1e293b;
            padding: 40px;
            font-size: 11px;
            line-height: 1.5;
        }
        
        .report-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 3px solid #1e293b;
            padding-bottom: 16px;
            margin-bottom: 24px;
        }
        .report-title { font-size: 22px; font-weight: 900; color: #0f172a; }
        .report-subtitle { font-size: 11px; color: #64748b; margin-top: 4px; }
        .report-date { font-size: 10px; color: #94a3b8; text-align: right; }
        .report-logo { font-size: 14px; font-weight: 900; color: #2563eb; }

        .kpi-grid {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 12px;
            margin-bottom: 28px;
        }
        .kpi-card {
            border: 1.5px solid #e2e8f0;
            border-radius: 10px;
            padding: 14px;
            text-align: center;
        }
        .kpi-value { font-size: 20px; font-weight: 900; color: #0f172a; }
        .kpi-label { font-size: 9px; color: #64748b; font-weight: 700; text-transform: uppercase; margin-top: 4px; }

        .section { margin-bottom: 28px; }
        .section-title {
            font-size: 13px;
            font-weight: 800;
            margin-bottom: 12px;
            color: #0f172a;
            border-left: 4px solid #2563eb;
            padding-left: 10px;
        }

        table { width: 100%; border-collapse: collapse; font-size: 10px; }
        th { background: #f1f5f9; padding: 8px 10px; text-align: left; font-weight: 700; border-bottom: 2px solid #e2e8f0; }
        td { padding: 7px 10px; border-bottom: 1px solid #f1f5f9; }
        tr:nth-child(even) { background: #fafbfc; }

        .bar-bg { background: #f1f5f9; border-radius: 4px; height: 14px; position: relative; overflow: hidden; }
        .bar-fill { height: 100%; border-radius: 4px; }
        .bar-emerald { background: #10b981; }
        .bar-blue { background: #3b82f6; }
        .bar-violet { background: #8b5cf6; }
        .bar-amber { background: #f59e0b; }

        .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 6px;
            font-size: 9px;
            font-weight: 700;
        }
        .badge-emerald { background: #d1fae5; color: #059669; }
        .badge-amber { background: #fef3c7; color: #d97706; }
        .badge-slate { background: #f1f5f9; color: #64748b; }

        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .three-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }

        .summary-box {
            border: 1.5px solid #e2e8f0;
            border-radius: 10px;
            padding: 14px;
            text-align: center;
        }
        .summary-box .value { font-size: 18px; font-weight: 900; }
        .summary-box .label { font-size: 9px; color: #64748b; font-weight: 600; margin-top: 2px; }

        .footer {
            margin-top: 40px;
            padding-top: 12px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            font-size: 9px;
            color: #94a3b8;
        }

        @media print {
            body { padding: 20px; }
            .no-print { display: none !important; }
        }
    </style>
</head>
<body>
    <div class="report-header">
        <div>
            <div class="report-title">${title}</div>
            <div class="report-subtitle">Detaylı performans raporu</div>
        </div>
        <div style="text-align: right;">
            <div class="report-logo">NOVO CRM</div>
            <div class="report-date">Rapor Tarihi: ${now}</div>
        </div>
    </div>
    ${content.innerHTML}
    <div class="footer">
        Bu rapor NOVOCRM sistemi tarafından ${now} tarihinde otomatik olarak oluşturulmuştur.
    </div>
    <script>
        setTimeout(() => { window.print(); }, 500);
    </script>
</body>
</html>
    `)
    printWindow.document.close()
}

export function generateReportHTML(data: {
    kpis: Record<string, any>
    funnel: { label: string; count: number; pct: number }[]
    sourceAnalysis: { label: string; total: number; conversionRate: number }[]
    agentPerformance: { full_name: string; totalLeads: number; wonDeals: number; lostDeals: number; conversionRate: number; gci: number; volume: number; activePortfolios: number; avgCloseTime: number; activityCount: number }[]
    monthlyTrend: { label: string; leads: number; won: number; gci: number; volume: number }[]
    portfolioAnalytics: Record<string, any>
    period: string
}): string {
    const formatCurrency = (n: number) => {
        if (!n) return '₺0'
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n)
    }

    const periodLabel = { month: 'Bu Ay', quarter: 'Bu Çeyrek', year: 'Bu Yıl', all: 'Tüm Zamanlar' }[data.period] || data.period

    return `
    <!-- KPIs -->
    <div class="kpi-grid">
        <div class="kpi-card">
            <div class="kpi-value">${data.kpis.totalLeads}</div>
            <div class="kpi-label">Toplam Lead</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-value">${data.kpis.conversionRate?.toFixed(1)}%</div>
            <div class="kpi-label">Dönüşüm Oranı</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-value">${formatCurrency(data.kpis.totalGCI)}</div>
            <div class="kpi-label">Toplam GCI</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-value">${formatCurrency(data.kpis.avgDealSize)}</div>
            <div class="kpi-label">Ort. İşlem</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-value">${data.kpis.avgCloseTime} gün</div>
            <div class="kpi-label">Ort. Kapanış</div>
        </div>
    </div>

    <!-- Funnel + Source -->
    <div class="two-col section">
        <div>
            <div class="section-title">Dönüşüm Hunisi</div>
            <table>
                <tr><th>Aşama</th><th style="text-align:center">Sayı</th><th style="text-align:center">Oran</th><th style="width:40%">Grafik</th></tr>
                ${data.funnel.map(s => `
                <tr>
                    <td><strong>${s.label}</strong></td>
                    <td style="text-align:center; font-weight:700">${s.count}</td>
                    <td style="text-align:center">${s.pct}%</td>
                    <td><div class="bar-bg"><div class="bar-fill bar-blue" style="width:${s.pct}%"></div></div></td>
                </tr>`).join('')}
            </table>
        </div>
        <div>
            <div class="section-title">Kaynak Analizi</div>
            ${data.sourceAnalysis.length > 0 ? `
            <table>
                <tr><th>Kaynak</th><th style="text-align:center">Lead</th><th style="text-align:center">Dönüşüm</th></tr>
                ${data.sourceAnalysis.map(s => `
                <tr>
                    <td>${s.label}</td>
                    <td style="text-align:center; font-weight:700">${s.total}</td>
                    <td style="text-align:center">
                        <span class="badge ${s.conversionRate >= 30 ? 'badge-emerald' : s.conversionRate >= 10 ? 'badge-amber' : 'badge-slate'}">${s.conversionRate}%</span>
                    </td>
                </tr>`).join('')}
            </table>` : '<p style="text-align:center; color:#94a3b8; padding:20px;">Veri yok</p>'}
        </div>
    </div>

    <!-- Agent Performance -->
    <div class="section">
        <div class="section-title">Danışman Performans Karşılaştırması</div>
        <table>
            <tr>
                <th>Danışman</th><th style="text-align:center">Lead</th>
                <th style="text-align:center">Kazanılan</th><th style="text-align:center">Kayıp</th>
                <th style="text-align:center">Dönüşüm</th><th style="text-align:center">GCI</th>
                <th style="text-align:center">Hacim</th><th style="text-align:center">Portföy</th>
                <th style="text-align:center">Ort. Kapanış</th><th style="text-align:center">Aktivite</th>
            </tr>
            ${data.agentPerformance.map((a, i) => `
            <tr${i === 0 && a.gci > 0 ? ' style="background:#fefce8"' : ''}>
                <td><strong>${i < 3 && a.gci > 0 ? ['🥇', '🥈', '🥉'][i] + ' ' : ''}${a.full_name}</strong></td>
                <td style="text-align:center">${a.totalLeads}</td>
                <td style="text-align:center; color:#059669; font-weight:700">${a.wonDeals}</td>
                <td style="text-align:center; color:#ef4444">${a.lostDeals}</td>
                <td style="text-align:center">
                    <span class="badge ${a.conversionRate >= 30 ? 'badge-emerald' : a.conversionRate >= 15 ? 'badge-amber' : 'badge-slate'}">${a.conversionRate}%</span>
                </td>
                <td style="text-align:center; font-weight:700; color:#7c3aed">${formatCurrency(a.gci)}</td>
                <td style="text-align:center; color:#64748b">${formatCurrency(a.volume)}</td>
                <td style="text-align:center">${a.activePortfolios}</td>
                <td style="text-align:center; font-weight:700; color:${a.avgCloseTime <= 30 ? '#059669' : a.avgCloseTime <= 60 ? '#d97706' : '#ef4444'}">${a.avgCloseTime > 0 ? a.avgCloseTime + 'g' : '-'}</td>
                <td style="text-align:center; color:#64748b">${a.activityCount}</td>
            </tr>`).join('')}
        </table>
    </div>

    <!-- Monthly Trend -->
    <div class="section">
        <div class="section-title">Aylık Trend (${periodLabel})</div>
        <table>
            <tr><th>Ay</th><th style="text-align:center">Lead</th><th style="text-align:center">Kazanılan</th><th style="text-align:center">GCI</th><th style="text-align:center">Hacim</th></tr>
            ${data.monthlyTrend.map(m => `
            <tr>
                <td><strong>${m.label}</strong></td>
                <td style="text-align:center">${m.leads}</td>
                <td style="text-align:center; color:#059669; font-weight:700">${m.won}</td>
                <td style="text-align:center; font-weight:700; color:#7c3aed">${formatCurrency(m.gci)}</td>
                <td style="text-align:center">${formatCurrency(m.volume)}</td>
            </tr>`).join('')}
        </table>
    </div>

    <!-- Portfolio Analytics -->
    <div class="section">
        <div class="section-title">Portföy Özeti</div>
        <div class="three-col">
            <div class="summary-box">
                <div class="value" style="color:#059669">${data.portfolioAnalytics.active}</div>
                <div class="label">Aktif</div>
            </div>
            <div class="summary-box">
                <div class="value" style="color:#e11d48">${data.portfolioAnalytics.sold}</div>
                <div class="label">Satıldı</div>
            </div>
            <div class="summary-box">
                <div class="value" style="color:#0891b2">${data.portfolioAnalytics.rented}</div>
                <div class="label">Kirada</div>
            </div>
        </div>
    </div>
    `
}

function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}
