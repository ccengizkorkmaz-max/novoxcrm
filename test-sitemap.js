
const baseUrl = 'https://novoxcrm.com'
const path = '/wiki'
const languages = {
    tr: `${baseUrl}${path}`,
    en: `${baseUrl}/en${path}`,
}
console.log(JSON.stringify(languages, null, 2))
