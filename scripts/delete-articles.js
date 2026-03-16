const fs = require('fs');
let content = fs.readFileSync('c:/NOVOCRM/src/data/wiki-articles-gen.ts', 'utf8');

const slugsToRemove = [
  'api-401-unauthorized-crm-cozum',
  'sql-server-baglanti-hatasi-crm-cozum',
  'low-code-no-code-insaat-yazilimi'
];

slugsToRemove.forEach(slug => {
  // Find the article object block for this slug
  const startMarker = "slug: '" + slug + "'";
  const idx = content.indexOf(startMarker);
  if (idx === -1) {
    console.log('NOT FOUND:', slug);
    return;
  }
  
  // Go back to find the start of the object (    {)
  let objStart = content.lastIndexOf('    {', idx);
  
  // Find the end of the object (    },)
  let objEnd = content.indexOf('    },', idx);
  if (objEnd !== -1) {
    objEnd += '    },\n'.length;
  }
  
  if (objStart !== -1 && objEnd !== -1) {
    content = content.substring(0, objStart) + content.substring(objEnd);
    console.log('DELETED:', slug);
  }
});

fs.writeFileSync('c:/NOVOCRM/src/data/wiki-articles-gen.ts', content);

// Count remaining
const remaining = (content.match(/slug:\s*'/g) || []).length;
console.log('Remaining articles:', remaining);
