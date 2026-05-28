import fs from 'fs';
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';

const turndownService = new TurndownService();

const urls = [
    "https://www.novosirketlergrubu.com/projects/novo-park-1-etili/",
    "https://www.novosirketlergrubu.com/projects/novo-park-2-yalova/",
    "https://www.novosirketlergrubu.com/projects/novo-park-4-kocaeli/",
    "https://www.novosirketlergrubu.com/projects/novo-park-montenegro/",
    "https://www.novosirketlergrubu.com/projects/novo-park-vista/",
    "https://www.novosirketlergrubu.com/projects/novo-city-izmir/",
    "https://www.novosirketlergrubu.com/projects/novo-park-viva-korfez/"
];

async function run() {
    let mdContent = "# NOVO Şirketler Grubu Tüm Proje Detayları (AI Bilgi Bankası)\n\n";

    for (const url of urls) {
        console.log("Fetching " + url);
        try {
            const res = await fetch(url);
            const html = await res.text();
            const $ = cheerio.load(html);
            
            // Clean up unnecessary elements
            $('script, style, iframe, form, header, footer, nav, .tm-sc-button, .elementor-widget-tm-ele-social-links, .wpcf7, img, svg').remove();
            
            let title = $('h3').first().text().trim();
            if (!title) {
                title = $('title').text().split('–')[0].trim();
            }

            mdContent += `## PROJE: ${title}\n`;
            mdContent += `**Kaynak Linki:** ${url}\n\n`;

            // We will just extract text-editor blocks and contact-list blocks to get all text paragraphs and lists
            let mainHtml = '';

            $('.elementor-widget-text-editor, .elementor-widget-tm-ele-text-editor, .tm-contact-list').each((i, el) => {
                // Avoid extracting the form instructions
                const text = $(el).text();
                if (text.includes('Formu doldurun')) return;
                
                mainHtml += $(el).html() + '<br><br>';
            });
            
            if (!mainHtml) {
                // fallback to body
                mainHtml = $('body').html();
            }

            let markdown = turndownService.turndown(mainHtml);
            
            // Cleanup markdown
            markdown = markdown.replace(/\n\s*\n/g, '\n\n'); // remove multiple empty lines
            
            mdContent += markdown + "\n\n";
            mdContent += "---\n\n";
        } catch (e) {
            console.error("Failed to fetch " + url, e);
            mdContent += `## ${url}\nVeri çekilemedi.\n\n---\n\n`;
        }
    }

    fs.writeFileSync('novo_projeler_tam.md', mdContent, 'utf-8');
    console.log("Written to novo_projeler_tam.md");
}

run();
