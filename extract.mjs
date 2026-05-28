import fs from 'fs';
import * as cheerio from 'cheerio';

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
    let mdContent = "# NOVO Şirketler Grubu Projeleri\n\n";

    for (const url of urls) {
        console.log("Fetching " + url);
        try {
            const res = await fetch(url);
            const html = await res.text();
            const $ = cheerio.load(html);
            
            let title = $('h3').first().text().trim();
            if (!title) {
                title = $('title').text().split('–')[0].trim();
            }
            mdContent += `## ${title}\n`;
            mdContent += `**Proje Linki:** [${title}](${url})\n\n`;

            // Extract "Proje Detayları"
            const contactList = $('.tm-contact-list ul li');
            if (contactList.length > 0) {
                mdContent += "### Proje Detayları\n";
                contactList.each((i, el) => {
                    const prefix = $(el).find('.prefix').text().trim();
                    const text = $(el).find('.text').text().trim();
                    if (prefix || text) {
                        mdContent += `- **${prefix}** ${text}\n`;
                    }
                });
                mdContent += "\n";
            }

            // Extract Description paragraphs
            // Filter out paragraphs inside the contact form
            const textEditor = $('.tm-text-editor p');
            if (textEditor.length > 0) {
                mdContent += "### Proje Açıklaması\n";
                textEditor.each((i, el) => {
                    const text = $(el).text().trim();
                    if (text && !text.includes('Formu doldurun')) {
                        mdContent += text + "\n\n";
                    }
                });
            }
            
            mdContent += "---\n\n";
        } catch (e) {
            console.error("Failed to fetch " + url, e);
            mdContent += `## ${url}\nVeri çekilemedi.\n\n---\n\n`;
        }
    }

    fs.writeFileSync('novo_projeler.md', mdContent, 'utf-8');
    console.log("Written to novo_projeler.md");
}

run();
