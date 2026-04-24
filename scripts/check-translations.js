/**
 * Translation Key Audit Script v2
 * Properly handles namespace scoping and filters false positives
 */
const fs = require('fs');
const path = require('path');

const enMessages = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'messages', 'en.json'), 'utf-8'));
const trMessages = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'messages', 'tr.json'), 'utf-8'));
const srcDir = path.join(__dirname, '..', 'src');

function getFiles(dir, ext = ['.tsx', '.ts']) {
    let results = [];
    try {
        const items = fs.readdirSync(dir, { withFileTypes: true });
        for (const item of items) {
            const fullPath = path.join(dir, item.name);
            if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
                results = results.concat(getFiles(fullPath, ext));
            } else if (ext.some(e => item.name.endsWith(e))) {
                results.push(fullPath);
            }
        }
    } catch (e) {}
    return results;
}

function getNestedValue(obj, keyPath) {
    const parts = keyPath.split('.');
    let current = obj;
    for (const part of parts) {
        if (current === undefined || current === null) return undefined;
        current = current[part];
    }
    return current;
}

// False positive keys to ignore (locale codes, CSS values, etc.)
const ignorePatterns = [
    /^tr-TR$/, /^en-US$/, /^locale$/,
    /^[A-Z]$/, // single letter keys
];

function shouldIgnore(key) {
    return ignorePatterns.some(p => p.test(key));
}

const missingEN = new Map();
const missingTR = new Map();
const files = getFiles(srcDir);

for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const relFile = path.relative(path.join(__dirname, '..'), file);

    // Find all translation variable declarations and their namespaces
    // e.g. const t = useTranslations('Navbar')
    // e.g. const tGlobal = useTranslations('Inventory')
    const varDeclRegex = /const\s+(\w+)\s*=\s*(?:await\s+)?(?:useTranslations|getTranslations)\(\s*['"]([^'"]+)['"]\s*\)/g;
    let match;
    const varNamespaceMap = {};

    while ((match = varDeclRegex.exec(content)) !== null) {
        const varName = match[1];
        const namespace = match[2];
        varNamespaceMap[varName] = namespace;
    }

    if (Object.keys(varNamespaceMap).length === 0) continue;

    // For each variable, find its key usage
    for (const [varName, namespace] of Object.entries(varNamespaceMap)) {
        // Match varName('key') or varName("key")
        const keyRegex = new RegExp(`\\b${varName}\\s*\\(\\s*['"]([^'"]+)['"]`, 'g');
        let keyMatch;
        while ((keyMatch = keyRegex.exec(content)) !== null) {
            const key = keyMatch[1];
            if (shouldIgnore(key)) continue;

            const fullKey = namespace + '.' + key;
            
            if (getNestedValue(enMessages, fullKey) === undefined) {
                if (!missingEN.has(fullKey)) {
                    missingEN.set(fullKey, { fullKey, namespace, key, files: [relFile] });
                } else {
                    const existing = missingEN.get(fullKey);
                    if (!existing.files.includes(relFile)) existing.files.push(relFile);
                }
            }
            if (getNestedValue(trMessages, fullKey) === undefined) {
                if (!missingTR.has(fullKey)) {
                    missingTR.set(fullKey, { fullKey, namespace, key, files: [relFile] });
                } else {
                    const existing = missingTR.get(fullKey);
                    if (!existing.files.includes(relFile)) existing.files.push(relFile);
                }
            }
        }

        // Also match varName.raw('key'), varName.rich('key')
        const methodRegex = new RegExp(`\\b${varName}\\.(?:raw|rich|markup)\\(\\s*['"]([^'"]+)['"]`, 'g');
        let mMatch;
        while ((mMatch = methodRegex.exec(content)) !== null) {
            const key = mMatch[1];
            if (shouldIgnore(key)) continue;
            const fullKey = namespace + '.' + key;
            
            if (getNestedValue(enMessages, fullKey) === undefined) {
                if (!missingEN.has(fullKey)) {
                    missingEN.set(fullKey, { fullKey, namespace, key, files: [relFile] });
                }
            }
            if (getNestedValue(trMessages, fullKey) === undefined) {
                if (!missingTR.has(fullKey)) {
                    missingTR.set(fullKey, { fullKey, namespace, key, files: [relFile] });
                }
            }
        }
    }
}

// Also check: keys that exist in TR but not EN, and vice versa (at top-level namespace level)
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

const allEnKeys = new Set(getAllKeys(enMessages));
const allTrKeys = new Set(getAllKeys(trMessages));

const inTrNotEn = [...allTrKeys].filter(k => !allEnKeys.has(k));
const inEnNotTr = [...allEnKeys].filter(k => !allTrKeys.has(k));

// Output report
let report = '=== TRANSLATION AUDIT REPORT ===\n\n';

report += `📊 Summary:\n`;
report += `  EN keys total: ${allEnKeys.size}\n`;
report += `  TR keys total: ${allTrKeys.size}\n`;
report += `  Code references missing in EN: ${missingEN.size}\n`;
report += `  Code references missing in TR: ${missingTR.size}\n`;
report += `  Keys in TR but NOT in EN: ${inTrNotEn.length}\n`;
report += `  Keys in EN but NOT in TR: ${inEnNotTr.length}\n\n`;

if (missingEN.size > 0) {
    report += `\n❌ MISSING IN en.json (referenced in code but not in translation file):\n`;
    report += '─'.repeat(80) + '\n';
    for (const item of missingEN.values()) {
        report += `  ${item.fullKey}\n`;
        report += `    Used in: ${item.files.join(', ')}\n`;
    }
}

if (missingTR.size > 0) {
    report += `\n❌ MISSING IN tr.json (referenced in code but not in translation file):\n`;
    report += '─'.repeat(80) + '\n';
    for (const item of missingTR.values()) {
        report += `  ${item.fullKey}\n`;
        report += `    Used in: ${item.files.join(', ')}\n`;
    }
}

if (inTrNotEn.length > 0) {
    report += `\n⚠️ KEYS EXIST IN tr.json BUT NOT IN en.json (${inTrNotEn.length}):\n`;
    report += '─'.repeat(80) + '\n';
    for (const key of inTrNotEn) {
        report += `  ${key}\n`;
    }
}

if (inEnNotTr.length > 0) {
    report += `\n⚠️ KEYS EXIST IN en.json BUT NOT IN tr.json (${inEnNotTr.length}):\n`;
    report += '─'.repeat(80) + '\n';
    for (const key of inEnNotTr) {
        report += `  ${key}\n`;
    }
}

console.log(report);

// Save to file
fs.writeFileSync(path.join(__dirname, 'translation-audit-report.txt'), report);
console.log('\n📄 Report saved to scripts/translation-audit-report.txt');
