#!/usr/bin/env node
/**
 * i18n-dedupe-report.mjs
 * Reports duplicate keys in translations and duplicate language codes within entries.
 * Usage: node scripts/i18n-dedupe-report.mjs
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const target = resolve(__dirname, '../src/services/languageService.ts');
const content = readFileSync(target, 'utf8');

const startMarker = 'export const translations';
const startIdx = content.indexOf(startMarker);
if (startIdx === -1) {
  console.error('[i18n-dedupe] Could not find translations object');
  process.exit(1);
}

// Find the opening brace after the marker
const braceStart = content.indexOf('{', startIdx);
if (braceStart === -1) {
  console.error('[i18n-dedupe] Could not find opening brace for translations');
  process.exit(1);
}

// Walk to find the matching closing brace for the translations object (depth-aware)
let i = braceStart;
let depth = 0;
let endIdx = -1;
while (i < content.length) {
  const ch = content[i];
  if (ch === '{') depth++;
  else if (ch === '}') {
    depth--;
    if (depth === 0) {
      endIdx = i;
      break;
    }
  }
  i++;
}

if (endIdx === -1) {
  console.error('[i18n-dedupe] Could not find closing brace for translations');
  process.exit(1);
}

const transBlock = content.slice(braceStart, endIdx + 1);

// Naive parse: iterate through lines and track depth to find top-level keys
const lines = transBlock.split(/\r?\n/);
let currentDepth = 0;
const topLevelKeys = [];
let currentKey = null;
let entryBuffer = [];
const entries = []; // { key, text }

function flushEntry() {
  if (currentKey !== null) {
    entries.push({ key: currentKey, text: entryBuffer.join('\n') });
  }
  currentKey = null;
  entryBuffer = [];
}

for (const line of lines) {
  const openCount = (line.match(/{/g) || []).length;
  const closeCount = (line.match(/}/g) || []).length;

  // If at depth 1 and we encounter a quoted key: 'key': {
  if (currentDepth === 1) {
    const m = line.match(/^\s*'([^']+)'\s*:/);
    if (m) {
      // flush previous entry buffer
      flushEntry();
      currentKey = m[1];
    }
  }

  if (currentKey !== null) entryBuffer.push(line);

  currentDepth += openCount;
  currentDepth -= closeCount;
}
flushEntry();

// Report duplicate top-level keys
const keyCounts = entries.reduce((acc, e) => (acc[e.key] = (acc[e.key] || 0) + 1, acc), {});
const duplicateKeys = Object.keys(keyCounts).filter(k => keyCounts[k] > 1);

// Scan for duplicate language codes within each entry text
function scanDuplicateLangs(entryText) {
  const langs = [];
  const langRegex = /(^|\n)\s*(['"]?)([a-zA-Z]{2,}(?:-[A-Za-z0-9]+)?)\2\s*:/g; // matches en, es-MX, 'ar-MA': etc.
  let m;
  while ((m = langRegex.exec(entryText))) {
    langs.push(m[3]);
  }
  const counts = langs.reduce((a, l) => (a[l] = (a[l] || 0) + 1, a), {});
  return Object.keys(counts).filter(k => counts[k] > 1).map(k => ({ code: k, count: counts[k] }));
}

const entriesWithDuplicateLangs = entries
  .map(e => ({ key: e.key, dupLangs: scanDuplicateLangs(e.text) }))
  .filter(e => e.dupLangs.length > 0);

console.log('=== i18n Dedupe Report ===');
console.log(`Top-level keys scanned: ${entries.length}`);
console.log(`Duplicate top-level keys: ${duplicateKeys.length}`);
if (duplicateKeys.length) {
  console.log(duplicateKeys.slice(0, 50));
  if (duplicateKeys.length > 50) console.log('...');
}
console.log(`Entries with duplicate language codes: ${entriesWithDuplicateLangs.length}`);
if (entriesWithDuplicateLangs.length) {
  for (const e of entriesWithDuplicateLangs.slice(0, 30)) {
    console.log(`- Key: ${e.key} =>`, e.dupLangs);
  }
  if (entriesWithDuplicateLangs.length > 30) console.log('...');
}

if (!duplicateKeys.length && !entriesWithDuplicateLangs.length) {
  console.log('No duplicates detected.');
}
