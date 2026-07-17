/**
 * Dynamically replace brand names in text content to ensure strict brand separation.
 * If brand is "Novo CRM", replaces "Oikos CRM" -> "Novo CRM", "oikos-crm" -> "novo-crm", etc.
 * If brand is "Oikos CRM", replaces "Novo CRM" -> "Oikos CRM", "novoxcrm" -> "oikoscrm", etc.
 */
export function adjustBranding(text: string, brandName: string): string {
    if (!text) return text
    if (brandName === 'Novo CRM') {
        return text
            .replaceAll('Oikos CRM', 'Novo CRM')
            .replaceAll('oikos-crm', 'novo-crm')
            .replaceAll('oikoscrm.com', 'novoxcrm.com')
            .replaceAll('oikoscrm', 'novoxcrm')
            .replaceAll('Oikos\'', 'Novo\'')
            .replaceAll('Oikos', 'Novo')
    } else {
        return text
            .replaceAll('NovoxCRM', 'Oikos CRM')
            .replaceAll('Novox CRM', 'Oikos CRM')
            .replaceAll('Novox', 'Oikos')
            .replaceAll('Novo CRM', 'Oikos CRM')
            .replaceAll('novo-crm', 'oikos-crm')
            .replaceAll('novoxcrm.com', 'oikoscrm.com')
            .replaceAll('novoxcrm', 'oikoscrm')
            .replaceAll('Novo\'', 'Oikos\'')
            .replaceAll('Novo', 'Oikos')
    }
}
