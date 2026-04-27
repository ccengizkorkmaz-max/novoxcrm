const fs = require('fs')
const { marked } = require('marked')

const md = fs.readFileSync('C:/Users/cengiz.korkmaz/.gemini/antigravity/brain/70f9266f-e534-4115-81b9-61500f6c821a/outreach_dokumantasyon.md', 'utf8')
const body = marked.parse(md)

const html = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>NovoCRM — Outreach Otomasyon Modülü</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',system-ui,-apple-system,sans-serif;background:#fff;color:#242424;line-height:1.6;font-size:14px}
.page{max-width:820px;margin:0 auto;padding:48px 40px 80px}
.cover{border-bottom:1px solid #e0e0e0;padding-bottom:32px;margin-bottom:40px}
.cover .badge{display:inline-block;background:#0078d4;color:#fff;font-size:11px;font-weight:600;padding:3px 10px;border-radius:2px;text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px}
.cover h1{font-size:28px;font-weight:600;color:#242424;margin-bottom:4px}
.cover p{font-size:14px;color:#616161}
h1{font-size:24px;font-weight:600;color:#242424;margin-bottom:8px}
h2{font-size:20px;font-weight:600;color:#242424;margin-top:40px;margin-bottom:14px;padding-bottom:6px;border-bottom:1px solid #e0e0e0}
h3{font-size:16px;font-weight:600;color:#242424;margin-top:28px;margin-bottom:10px}
h4{font-size:14px;font-weight:600;color:#0078d4;margin-top:20px;margin-bottom:6px}
p{margin-bottom:10px;color:#424242}
strong{color:#242424;font-weight:600}
em{color:#616161;font-style:italic}
a{color:#0078d4;text-decoration:none}
a:hover{text-decoration:underline}
ul,ol{margin-bottom:12px;padding-left:20px}
li{margin-bottom:4px;color:#424242}
hr{border:none;border-top:1px solid #e0e0e0;margin:28px 0}
blockquote{background:#f5f5f5;border-left:3px solid #0078d4;padding:12px 16px;margin:16px 0;border-radius:0 4px 4px 0}
blockquote p{color:#424242;margin:0}
blockquote strong{color:#0078d4}
code{background:#f5f5f5;color:#d13438;padding:1px 5px;border-radius:3px;font-size:12px;font-family:'Cascadia Code','Consolas',monospace}
pre{background:#fafafa;border:1px solid #e0e0e0;border-radius:4px;padding:16px;overflow-x:auto;margin:12px 0}
pre code{background:none;color:#424242;padding:0;font-size:12px}
table{width:100%;border-collapse:collapse;margin:14px 0;font-size:13px}
thead{background:#fafafa}
th{padding:8px 12px;text-align:left;font-weight:600;color:#242424;border:1px solid #e0e0e0}
td{padding:8px 12px;border:1px solid #e0e0e0;color:#424242}
tr:nth-child(even) td{background:#fafafa}
@media print{
  .page{padding:24px 20px}
  pre{page-break-inside:avoid}
  h2,h3{page-break-after:avoid}
}
</style>
</head>
<body>
<div class="page">
<div class="cover">
<div class="badge">Teklif Dokümanı</div>
<h1>NovoCRM — Outreach Otomasyon Modülü</h1>
<p>Teknik ve Pazarlama Dokümanı &middot; Nisan 2026</p>
</div>
${body}
</div>
</body>
</html>`

const outPath = 'C:/PROJELER/NOVOCRM/scratch/outreach_dokumantasyon.html'
fs.writeFileSync(outPath, html, 'utf8')
console.log('Done:', outPath)
