require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const searchList = [
  "Ekin Avşar",
  "Abdullatif YILDIRIM",
  "SU rapunzel",
  "nazikecevik",
  "İlker çetinkaya",
  "Yılmaz ilter",
  "Fikret havacı",
  "Leman",
  "Şahin Yiğit Alp Erkoç",
  "Murat Tokbaş",
  "Fatih raylaz",
  "Sefer Erdogan",
  "Şule Erkn",
  "Deniz Toplutepe",
  "Kaan Gngr",
  "halit",
  "Tunç",
  "Mirsat üçüncü",
  "MERT ALİ ÖZDEMİR",
  "Göçebe Gezmen",
  "Özdemir Yıldırım",
  "Deniz Kılıç",
  "Yiğit Yalçın",
  "Özcan Kılıç",
  "Faizee Sayy",
  "Türk Bey",
  "FEYYAZ & ESRA",
  "Oğuzhan Mutlu",
  "Elif Bursa",
  "Mehmet G Oflaz",
  "Ersin özdemir",
  "Nilgün TAN KIRACI"
];

async function checkLeads() {
  console.log('Checking database for leads/customers...');
  
  const results = [];
  
  for (const name of searchList) {
    // 1. Check customers table
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .select('id, first_name, last_name, phone')
      .ilike('first_name', `%${name.split(' ')[0]}%`); // Try checking first word if full name doesn't match perfectly, or just check full name.

    const { data: exactCustomerData } = await supabase
      .from('customers')
      .select('id, first_name, last_name, phone')
      .or(`first_name.ilike.%${name}%,last_name.ilike.%${name}%`);

    let found = false;
    let foundDetails = [];

    if (exactCustomerData && exactCustomerData.length > 0) {
      found = true;
      foundDetails = exactCustomerData;
    } else {
        // Fallback checks
        const searchTerms = name.split(' ');
        if (searchTerms.length > 1) {
             const { data: partsCustomerData } = await supabase
              .from('customers')
              .select('id, first_name, last_name, phone')
              .ilike('first_name', `%${searchTerms[0]}%`)
              .ilike('last_name', `%${searchTerms[1]}%`);
             
             if (partsCustomerData && partsCustomerData.length > 0) {
                 found = true;
                 foundDetails = partsCustomerData;
             }
        }
    }

    if (!found) { // Try 'leads' table just in case they are considered leads rather than customers
        const searchTerms = name.split(' ');
        const queryList = [];
        queryList.push(`first_name.ilike.%${name}%`);
        queryList.push(`last_name.ilike.%${name}%`);
        
        const { data: exactLeadData } = await supabase
            .from('leads')
            .select('id, first_name, last_name, phone')
            .or(queryList.join(','));
        
        if (exactLeadData && exactLeadData.length > 0) {
            found = true;
            foundDetails = exactLeadData;
        } else if (searchTerms.length > 1) {
            const { data: partsLeadData } = await supabase
              .from('leads')
              .select('id, first_name, last_name, phone')
              .ilike('first_name', `%${searchTerms[0]}%`)
              .ilike('last_name', `%${searchTerms[1]}%`);
             
             if (partsLeadData && partsLeadData.length > 0) {
                 found = true;
                 foundDetails = partsLeadData;
             }
        }
    }

    results.push({ name, found, foundDetails });
  }

  const foundCount = results.filter(r => r.found).length;
  console.log(`\nResults: ${foundCount} out of ${searchList.length} found.`);
  
  const notFound = results.filter(r => !r.found).map(r => r.name);
  if (notFound.length > 0) {
      console.log('\n--- NOT FOUND ---');
      notFound.forEach(n => console.log(n));
  }
  
  const foundItems = results.filter(r => r.found);
  if (foundItems.length > 0) {
      console.log('\n--- FOUND ---');
      foundItems.forEach(n => console.log(`${n.name} => ${JSON.stringify(n.foundDetails)}`));
  }
}

checkLeads().catch(console.error);
