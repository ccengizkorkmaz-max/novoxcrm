/**
 * Auto-fix missing translation keys
 * Copies from the other locale file, or creates a reasonable default
 */
const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '..', 'messages', 'en.json');
const trPath = path.join(__dirname, '..', 'messages', 'tr.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf-8'));
const tr = JSON.parse(fs.readFileSync(trPath, 'utf-8'));

function getNestedValue(obj, keyPath) {
    const parts = keyPath.split('.');
    let current = obj;
    for (const part of parts) {
        if (current === undefined || current === null) return undefined;
        current = current[part];
    }
    return current;
}

function setNestedValue(obj, keyPath, value) {
    const parts = keyPath.split('.');
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]] || typeof current[parts[i]] !== 'object') {
            current[parts[i]] = {};
        }
        current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
}

function getAllKeys(obj, prefix = '') {
    let keys = [];
    for (const [k, v] of Object.entries(obj)) {
        const fullKey = prefix ? prefix + '.' + k : k;
        if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
            keys = keys.concat(getAllKeys(v, fullKey));
        } else {
            keys.push(fullKey);
        }
    }
    return keys;
}

const allEnKeys = getAllKeys(en);
const allTrKeys = getAllKeys(tr);

let enAdded = 0;
let trAdded = 0;

// Keys in TR but not EN → copy to EN
for (const key of allTrKeys) {
    if (getNestedValue(en, key) === undefined) {
        const trVal = getNestedValue(tr, key);
        setNestedValue(en, key, trVal); // Use TR value as-is (will need manual translation but prevents crash)
        enAdded++;
        console.log(`  [EN] Added: ${key} = "${typeof trVal === 'string' ? trVal.substring(0, 60) : JSON.stringify(trVal).substring(0, 60)}..."`);
    }
}

// Keys in EN but not TR → copy to TR
for (const key of allEnKeys) {
    if (getNestedValue(tr, key) === undefined) {
        const enVal = getNestedValue(en, key);
        setNestedValue(tr, key, enVal); // Use EN value as-is
        trAdded++;
        console.log(`  [TR] Added: ${key} = "${typeof enVal === 'string' ? enVal.substring(0, 60) : JSON.stringify(enVal).substring(0, 60)}..."`);
    }
}

// Re-check after first pass (in case TR had new keys that EN now needs)
const updatedEnKeys = getAllKeys(en);
const updatedTrKeys = getAllKeys(tr);

for (const key of updatedTrKeys) {
    if (getNestedValue(en, key) === undefined) {
        setNestedValue(en, key, getNestedValue(tr, key));
        enAdded++;
    }
}
for (const key of updatedEnKeys) {
    if (getNestedValue(tr, key) === undefined) {
        setNestedValue(tr, key, getNestedValue(en, key));
        trAdded++;
    }
}

// Write back
fs.writeFileSync(enPath, JSON.stringify(en, null, 4) + '\n', 'utf-8');
fs.writeFileSync(trPath, JSON.stringify(tr, null, 4) + '\n', 'utf-8');

console.log(`\n✅ Done! Added ${enAdded} keys to en.json, ${trAdded} keys to tr.json`);
console.log('⚠️  Note: Copied keys use the source locale text. Manual translation may be needed for proper localization.');
