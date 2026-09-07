/**
 * Dynamically replace brand names in text content to ensure strict brand separation.
 * If brand is "NovoXCRM" / "Novo CRM", replaces all "Oikos CRM", "Oikos", "oikoscrm" -> "NovoXCRM", "novoxcrm", etc.
 * If brand is "Oikos CRM", replaces "NovoXCRM", "Novo CRM", "Novo" -> "Oikos CRM", "Oikos", etc.
 */
export function adjustBranding(text: string, brandName: string): string {
    if (!text) return text
    const isOikos = brandName === 'Oikos CRM' || brandName === 'Oikos' || brandName === 'oikoscrm'

    if (!isOikos) {
        // NovoXCRM is the default & primary brand
        return text
            .replaceAll('OikosXCRM', 'NovoXCRM')
            .replaceAll('Oikos CRM', 'NovoXCRM')
            .replaceAll('OikosCRM', 'NovoXCRM')
            .replaceAll('oikos-crm', 'novoxcrm')
            .replaceAll('oikoscrm.com', 'novoxcrm.com')
            .replaceAll('oikoscrm', 'novoxcrm')
            .replaceAll("Oikos'un", "NovoXCRM'in")
            .replaceAll("Oikos'a", "NovoXCRM'e")
            .replaceAll("Oikos'ta", "NovoXCRM'de")
            .replaceAll("Oikos'tan", "NovoXCRM'den")
            .replaceAll("Oikos'", "NovoXCRM'")
            .replaceAll('Oikos', 'NovoXCRM')
            .replaceAll('Novo CRM', 'NovoXCRM')
            .replaceAll('Novox CRM', 'NovoXCRM')
            .replaceAll('NovoCRM', 'NovoXCRM')
            .replaceAll('NovoxCRM', 'NovoXCRM')
    } else {
        return text
            .replaceAll('NovoXCRM', 'Oikos CRM')
            .replaceAll('NovoxCRM', 'Oikos CRM')
            .replaceAll('Novox CRM', 'Oikos CRM')
            .replaceAll('Novox', 'Oikos')
            .replaceAll('Novo CRM', 'Oikos CRM')
            .replaceAll('NovoCRM', 'Oikos CRM')
            .replaceAll('novo-crm', 'oikos-crm')
            .replaceAll('novoxcrm.com', 'oikoscrm.com')
            .replaceAll('novoxcrm', 'oikoscrm')
            .replaceAll("Novo'nun", "Oikos'un")
            .replaceAll("Novo'ya", "Oikos'a")
            .replaceAll("Novo'da", "Oikos'ta")
            .replaceAll("Novo'dan", "Oikos'tan")
            .replaceAll("Novo'", "Oikos'")
            .replaceAll('Novo', 'Oikos')
    }
}
