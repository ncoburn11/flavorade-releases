#!/usr/bin/env node
// Weekly Flavorade release update.
//
//   node tools/weekly.js --week 2026-11-16 --orders gf1.json [gf2.json ...] [--notes notes.json] [--extra extra.json] [--dry]
//
// --orders  GrowFlow RETAIL order query results (see CLAUDE.md for the exact query).
//           Deliveries from Mon-Sun become the drops for the FOLLOWING Monday (--week).
// --week    The Monday to publish (YYYY-MM-DD). Default: this week's Monday (California time).
// --notes   {"Strain|Collab": {"type": "Hybrid", "notes": "Grape & Gas"}} for brand-new flavors
//           (from the FA - Tasting Notes sheet).
// --extra   [{"shop":"Stiiizy","city":"Los Angeles","deal":"","flavors":["Flavorade x Sirius | Blue Dream | Vape Cart | 1g"]}]
//           for stores supplied outside GrowFlow.
// --dry     Print the report without writing data.js.
//
// Store names come from stores.json (GrowFlow license -> {shop, city, deal}). Stores missing from
// stores.json are NOT published; they are listed in the report so a name can be added.
const fs = require('fs');
const path = require('path');
const L = require('./lib');

const args = process.argv.slice(2);
const opt = { orders: [] };
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--orders') { while (args[i + 1] && !args[i + 1].startsWith('--')) opt.orders.push(args[++i]); }
  else if (a === '--dry') opt.dry = true;
  else if (a.startsWith('--')) opt[a.slice(2)] = args[++i];
}
const thisMonday = () => { const d = new Date(L.caDate(Date.now()) + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() - (d.getUTCDay() + 6) % 7); return d.toISOString().slice(0, 10); };
const week = opt.week || thisMonday();
if (!/^\d{4}-\d{2}-\d{2}$/.test(week) || new Date(week + 'T12:00:00Z').getUTCDay() !== 1) { console.error('--week must be a Monday, YYYY-MM-DD'); process.exit(1); }

const R = L.loadData();
const stores = JSON.parse(fs.readFileSync(path.join(L.ROOT, 'stores.json'), 'utf8'));
const notes = opt.notes ? JSON.parse(fs.readFileSync(opt.notes, 'utf8')) : {};
const extra = opt.extra ? JSON.parse(fs.readFileSync(opt.extra, 'utf8')) : [];

// product lookup
const key = (strain, collab) => L.norm(collab) + '|' + L.norm(strain);
const pIndex = new Map(R.products.map((p, i) => [key(p[0], p[1]), i]));
const byStrain = new Map(); R.products.forEach((p, i) => { const k = L.norm(p[0]); if (!byStrain.has(k)) byStrain.set(k, i); });
const added = [];
function pid(f) {
  const k = key(f.strain, f.collab);
  if (pIndex.has(k)) return pIndex.get(k);
  const n = notes[`${f.strain}|${f.collab}`] || notes[f.strain] || null;
  const i = R.products.length;
  R.products.push([f.strain, f.collab, n ? n.type || '' : '', n ? n.notes || '' : '']);
  pIndex.set(k, i); added.push(i);
  return i;
}

// build this week's drops
const weeks = L.groupDeliveries(L.readOrders(opt.orders));
const m = weeks.get(week) || new Map();
const rows = [], unknown = [];
for (const [lic, e] of [...m].sort((a, b) => a[1].firstTs < b[1].firstTs ? -1 : 1)) {
  const s = stores[lic];
  if (!s || !s.shop) { unknown.push({ lic, name: e.vendor.name.trim(), city: L.cityFromAddress(e.vendor.vendorAddress), flavors: e.flavors.length }); continue; }
  rows.push([week, s.shop, s.city, s.deal || '', [...new Set(e.flavors.map(pid))]]);
}
for (const x of extra) {
  const ids = [...new Set(x.flavors.map(L.parseProduct).filter(Boolean).map(pid))];
  if (ids.length) rows.push([week, x.shop, x.city, x.deal || '', ids]);
}
// merge stores that share a display name (e.g. two licenses at one shop)
const merged = [];
for (const r of rows) {
  const same = merged.find(x => L.norm(x[1]) === L.norm(r[1]) && L.norm(x[2]) === L.norm(r[2]));
  if (same) same[4] = [...new Set(same[4].concat(r[4]))]; else merged.push(r);
}

// new flavors = first time ever dropped
const before = new Set(); R.drops.forEach(d => { if (d[0] < week) d[4].forEach(i => before.add(i)); });
const newIds = [...new Set(merged.flatMap(r => r[4]))].filter(i => !before.has(i));

const report = [];
report.push(`# Release update for the week of ${week}`, '');
report.push(`- GrowFlow stores delivered: ${m.size}; published: ${merged.length} drops`);
report.push(`- New flavors this week: ${newIds.length ? newIds.map(i => R.products[i][0] + (R.products[i][1] ? ' x ' + R.products[i][1] : '')).join(', ') : 'none'}`);
const noNotes = newIds.filter(i => !R.products[i][3]);
if (noNotes.length) report.push(`- NEED TASTING NOTES: ${noNotes.map(i => R.products[i][0] + '|' + R.products[i][1]).join(', ')}`);
if (unknown.length) { report.push('', '## Stores not published (add them to stores.json)'); unknown.forEach(u => report.push(`- ${u.lic}: ${u.name} (${u.city}), ${u.flavors} flavors`)); }
report.push('', '## Drops', ...merged.map(r => `- ${r[1]} | ${r[2]}${r[3] ? ' (' + r[3] + ')' : ''}: ${r[4].map(i => R.products[i][0]).join(', ')}`));
const text = report.join('\n') + '\n';
console.log(text);

if (!m.size && !extra.length) { console.error(`No GrowFlow deliveries map to the week of ${week}. Nothing written.`); process.exit(2); }
if (opt.dry) process.exit(0);
R.drops = merged.concat(R.drops.filter(d => d[0] !== week));
if (newIds.length) R.newFlavors[week] = newIds; else delete R.newFlavors[week];
R.updated = L.caDate(Date.now());
L.saveData(R);
fs.writeFileSync(path.join(L.ROOT, 'tools', 'last-report.md'), text);
console.log('data.js updated.');
