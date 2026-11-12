#!/usr/bin/env node
// Sunday release update for the Flavorade Release Finder. See CLAUDE.md for the full procedure.
//
//   node tools/weekly.js --orders o1.json [o2.json ...] --deals deals.json \
//        [--livemenu ../live-menu] [--notes notes.json] [--now 2026-11-15T16:47:00Z] [--dry]
//
// --orders    GrowFlow order query pages (see CLAUDE.md for the query).
// --deals     Values of the "Current - 2026" tab of the deals sheet (JSON from get_values).
// --livemenu  A full-history clone of ncoburn11/live-menu (read-only). Default: ../live-menu
// --notes     {"Strain|Collab": {"type": "...", "notes": "..."}} for flavors new to data.js.
// --now       Pretend the run happens at this time (testing). Default: now.
// --dry       Print the report, change nothing.
//
// Rules: see CLAUDE.md and rules.json. New flavors come only from the live menu repo's history:
// Flavorade SKUs newly listed on Sunday W (vs the Sunday before) are new for the Week of W + 15 days.
const fs = require('fs');
const path = require('path');
const L = require('./lib');

const args = process.argv.slice(2);
const opt = { orders: [] };
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--orders') { const k = a.slice(2); while (args[i + 1] && !args[i + 1].startsWith('--')) opt[k].push(args[++i]); }
  else if (a === '--dry') opt.dry = true;
  else if (a.startsWith('--')) opt[a.slice(2)] = args[++i];
}
const ROOT = L.ROOT;
const readJSON = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const rules = readJSON(path.join(ROOT, 'rules.json'));
const statePath = path.join(ROOT, 'tools', 'state.json');
const state = readJSON(statePath);
const stores = readJSON(path.join(ROOT, 'stores.json'));
const notes = opt.notes ? readJSON(opt.notes) : {};
const R = L.loadData();
const norm = L.norm;

const NOW = opt.now ? new Date(opt.now) : new Date();
const DAY = 86400000;
const addDays = (ymd, n) => { const d = new Date(ymd + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const today = L.caDate(NOW);
const dow = new Date(today + 'T12:00:00Z').getUTCDay(); // 0 = Sunday
const WEEK = addDays(today, dow === 0 ? 1 : 8 - dow);     // the coming Monday
const SUNDAY = addDays(WEEK, -1);                          // this run's Sunday
const since = new Date(state.lastCutoff);

/* ---------- effective date ---------- */
function effectiveDate(o) {
  const t = new Date(o.transferDate);
  const text = [o.comment, o.notes, o.internalNote].filter(Boolean).join(' ');
  let best = t;
  for (const m of text.matchAll(/(?<![\d/])(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?(?![\d/])/g)) {
    const mo = +m[1], d = +m[2]; if (mo < 1 || mo > 12 || d < 1 || d > 31) continue;
    const years = m[3] ? [m[3].length === 2 ? 2000 + +m[3] : +m[3]] : [t.getUTCFullYear() - 1, t.getUTCFullYear(), t.getUTCFullYear() + 1];
    for (const y of years) {
      const c = new Date(Date.UTC(y, mo - 1, d, 20)); // noon California
      if (c > t && c - t <= 30 * DAY && L.caDate(c) > L.caDate(t) && c > best) best = c;
    }
  }
  return best;
}

/* ---------- which store(s) an order belongs to ---------- */
const sampleLine = li => li.isSample || li.isEducationalSample || li.isVoided;
function classify(o) {
  const v = o.vendor || {}, lic = v.licenseNumber || '', vname = (v.name || '').trim();
  const text = [o.comment, o.notes, o.internalNote].filter(Boolean).join(' ');
  if (rules.neverList[lic]) return { skip: 'never listed: ' + rules.neverList[lic] };
  const puByName = new RegExp(rules.perfectUnionVendorNamePattern, 'i').test(vname);
  const allowed = rules.c11Allowed[lic] || (puByName ? { mode: 'perfectUnion', name: vname } : null);
  if (lic.startsWith('C11-') && !allowed) {
    return rules.knownOtherC11[lic] ? { skip: 'C11 not shown: ' + rules.knownOtherC11[lic] } : { newC11: true, skip: 'NEW C11 (not shown): ' + vname };
  }
  if (allowed) {
    if (allowed.skipIfNote && new RegExp(allowed.skipIfNote, 'i').test(text)) return { skip: allowed.name + ' staff samples' };
    if (allowed.mode === 'fixed') return { shops: [[allowed.shop, allowed.city]] };
    if (allowed.mode === 'pmg') {
      const code = String(o.comment || '').replace(/\*/g, ' ').replace(/[.]/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase();
      // match the comment to a known code, or to that store's "shop city" / "city shop" / city / shop
      const entries = Object.entries(rules.pmgComments), c = norm(code);
      const forms = ([k, m]) => [k].concat(m ? [m[0] + m[1], m[1] + m[0], m[1], m[0]] : []).map(norm);
      let hit = entries.find(e => norm(e[0]) === c) || entries.find(e => forms(e).slice(1, 3).includes(c));
      if (!hit) { const one = entries.filter(e => forms(e).slice(3).includes(c)); if (one.length === 1) hit = one[0]; }
      if (!hit) return { hold: `PMG comment not recognized: "${o.comment || ''}"` };
      const [key, m] = hit;
      return m ? { shops: [m] } : { skip: `PMG "${key}" is not listed` };
    }
    if (allowed.mode === 'perfectUnion') {
      const T = text.toUpperCase();
      const hit = rules.perfectUnionCodes.find(([code]) => T.includes(code));
      if (!hit) return { hold: `Perfect Union shop not recognized: "${text}"` };
      return hit[1] ? { shops: [['Perfect Union', hit[1]]] } : { skip: `Perfect Union ${hit[0]} is not listed` };
    }
    if (allowed.mode === 'movocan') {
      const cities = rules.movocanCities.filter(c => norm(text).includes(norm(c)));
      if (!cities.length) return { hold: `Movocan city not found in notes: "${text}"` };
      return { shops: cities.map(c => ['Movocan', c]) };
    }
  }
  const s = stores[lic];
  if (!s) return { hold: `Unknown store license ${lic}: ${vname}, ${v.vendorAddress || ''} (look it up, add to stores.json)` };
  return { shops: [[s.shop, s.city]] };
}

/* ---------- products ---------- */
const pKey = (strain, collab) => norm(collab) + '|' + norm(strain);
const pIndex = new Map(R.products.map((p, i) => [pKey(p[0], p[1]), i]));
const created = [];
function pid(f) {
  const k = pKey(f.strain, f.collab);
  if (pIndex.has(k)) return pIndex.get(k);
  const n = notes[`${f.strain}|${f.collab}`] || notes[f.strain] || null;
  const i = R.products.length;
  R.products.push([f.strain, f.collab, n ? n.type || '' : '', n ? n.notes || '' : '']);
  pIndex.set(k, i); created.push(i);
  return i;
}
// fill in notes for existing products that have none
for (const [k, n] of Object.entries(notes)) {
  const [strain, collab = ''] = k.split('|');
  const i = pIndex.get(pKey(strain, collab)); if (i == null) continue;
  if (!R.products[i][3] && n.notes) R.products[i][3] = n.notes;
  if (!R.products[i][2] && n.type) R.products[i][2] = n.type;
}

/* ---------- drops for WEEK ---------- */
const orders = L.readOrders(opt.orders);
const published = new Set(state.publishedPOs || []);
const report = { holds: [], newC11: new Map(), skipped: [], used: [] };
const rows = new Map(); // shop|city -> row
for (const o of orders.sort((a, b) => a.transferDate < b.transferDate ? -1 : 1)) {
  if (!rules.includeStages.includes(o.stage) || !rules.includeOrderTypes.includes(o.orderType)) continue;
  if (published.has(o.poNumber)) continue;
  const eff = effectiveDate(o);
  if (!(eff > since && eff <= NOW)) continue;
  const flavors = (o.lineItems || []).filter(li => !sampleLine(li)).map(li => L.parseProduct(li.product && li.product.name)).filter(Boolean);
  if (!flavors.length) continue;
  const c = classify(o);
  if (c.newC11) report.newC11.set(o.vendor.licenseNumber, (o.vendor.name || '').trim());
  if (c.skip) { report.skipped.push(`PO ${o.poNumber}: ${c.skip}`); continue; }
  if (c.hold) { report.holds.push(`PO ${o.poNumber}: ${c.hold}`); continue; }
  for (const [shop, city] of c.shops) {
    const k = norm(shop) + '|' + norm(city);
    if (!rows.has(k)) rows.set(k, [WEEK, shop, city, '', []]);
    const r = rows.get(k); r[4] = [...new Set(r[4].concat(flavors.map(pid)))];
  }
  report.used.push(o.poNumber);
}
const drops = [...rows.values()];

/* ---------- deals from the sheet ---------- */
function dealFinder(sheet) {
  const vals = Array.isArray(sheet) ? sheet : sheet.values;
  const rowsD = vals.slice(1).filter(r => /flavorade/i.test(r[1] || '') && String(r[7]).toUpperCase() === 'TRUE' && (r[4] || '').trim());
  const ALIAS = { offthechartsotc: 'otc', offthecharts: 'otc', hpcoxnard: 'cannable', hpc: 'cannable', stiiizy: 'allstiiizyshops' };
  const chainLoc = s => /\ball\b|over|norcal|northern california|locations/i.test(s);
  const rk = r => { let k = norm(String(r[2]).replace(/\(.*?\)/g, '').replace(/\b(all|shops)\b/gi, '')); return ALIAS[k] || ALIAS[norm(r[2])] || k; };
  const nameMatch = (r, shop) => { const k = rk(r), s = norm(shop); return k && (s.startsWith(k) || k.startsWith(s) || (k === 'allstiiizyshops' && s.includes('stiiizy'))); };
  const isChain = r => chainLoc(r[3] || '') || /\b(all|shops)\b/i.test(r[2]);
  return (shop, city) => {
    const c = norm(city), cand = rowsD.filter(r => nameMatch(r, shop));
    const loc = r => { const l = norm(r[3] || ''); return l && (l.includes(c) || c.includes(l)); };
    const spec = cand.filter(r => !isChain(r));
    const pick = spec.find(loc)
      || (spec.length === 1 && rowsD.filter(x => rk(x) === rk(spec[0])).length === 1 ? spec[0] : null)
      || cand.find(isChain);
    return pick ? String(pick[4]).replace(/\s+/g, ' ').trim() : '';
  };
}
let dealsApplied = 0;
if (opt.deals) {
  const find = dealFinder(readJSON(opt.deals));
  for (const d of drops.concat(R.drops)) { const deal = find(d[1], d[2]); if (deal !== d[3]) { d[3] = deal; dealsApplied++; } }
}

/* ---------- new flavors, from the live menu repo's history ---------- */
// Flavors newly listed on the live menu on Sunday W (vs the Sunday before) are "New flavors"
// for the Week of W + 15 days. A flavor that comes back after selling out also counts as new.
const LM = require('./livemenu');
const liveRepo = opt.livemenu || path.join(ROOT, '..', 'live-menu');
const newWeekend = addDays(WEEK, -15);
const liveNote = [];
function addedOn(W) {
  if (state.menuLog && state.menuLog[W]) { liveNote.push(`Sunday ${W}: owner-provided list`); return state.menuLog[W]; }
  let a, b;
  try { a = LM.snapshotAt(liveRepo, W); b = LM.snapshotAt(liveRepo, addDays(W, -7)); }
  catch (e) { liveNote.push(`LIVE MENU REPO NOT READABLE at ${liveRepo}: ${e.message.split('\n')[0]}`); return null; }
  const fresh = s => s && L.caDate(new Date(s.updated)) > addDays(W, -7) ; // snapshot must come from that week
  if (!a || !b || !fresh(a)) { liveNote.push(`NO LIVE MENU HISTORY for Sunday ${W} (or the Sunday before); new flavors not set`); return null; }
  liveNote.push(`Sunday ${W}: live menu ${a.commit} (${a.updated}) vs ${b.commit} (${b.updated})`);
  return a.flavors.filter(x => !b.flavors.includes(x));
}
const newNames = addedOn(newWeekend) || [];
const newIds = newNames.map(n => { const [strain, collab = ''] = n.split('|'); return pid({ strain, collab: L.fixCollab(collab) }); });

/* ---------- Flavors of the Week ---------- */
const storesThisWeek = id => drops.filter(d => d[4].includes(id)).length;
const words = list => new RegExp('\\b(' + list.join('|') + ')', 'i');
const FRUITY = words(rules.fotw.fruity), GASSY = words(rules.fotw.gassy);
function tier(i) {
  const [name, collab, , n] = R.products[i]; const c = norm(collab), nm = name.toLowerCase(), txt = n || name;
  if (c === 'notillkings') return 1;
  if (c === 'wizardtrees') return 2;
  if (/woodzy/i.test(name)) return 2.5;
  if (c === 'rootedfire' && /chem/.test(nm)) return 3;
  if (c === 'pearlpharma' && (/\bog\b/.test(nm) || /blueberry/.test(nm))) return 4;
  if (c === 'rootedfire' && /peanut butter/.test(nm)) return 5;
  if (c === 'rootedfire') return 6;
  if (c === 'pearlpharma') return 7;
  if (FRUITY.test(txt)) return 8;
  if (GASSY.test(txt)) return 9;
  return 10;
}
const fotw = [...newIds].sort((a, b) => tier(a) - tier(b) || storesThisWeek(b) - storesThisWeek(a) || R.products[a][0].localeCompare(R.products[b][0]))
  .slice(0, rules.fotw.count);

/* ---------- report ---------- */
const pname = i => R.products[i][0] + (R.products[i][1] ? ' x ' + R.products[i][1] : '');
const out = [];
out.push(`# Release update: Week of ${WEEK}`, '');
out.push(`- Orders window: ${since.toISOString()} to ${NOW.toISOString()}`);
out.push(`- Stores published: ${drops.length} (from ${report.used.length} orders)`);
out.push(`- New flavors (newly listed on the live menu Sunday ${newWeekend}): ${newIds.length ? newIds.map(pname).join(', ') : 'none logged'}`);
out.push(`- Flavors of the Week: ${fotw.length ? fotw.map(i => `${pname(i)} (tier ${tier(i)}, ${storesThisWeek(i)} stores)`).join('; ') : 'none'}`);
out.push(`- New-flavor source: ${liveNote.join('; ')}`);
const noNotes = [...new Set(newIds.concat(created))].filter(i => !R.products[i][3]);
if (noNotes.length) out.push(`- NEED TASTING NOTES: ${noNotes.map(i => R.products[i][0] + '|' + R.products[i][1]).join(', ')}`);
out.push(`- Deals updated on ${dealsApplied} store rows`);
if (report.newC11.size) { out.push('', '## NEW C11 licenses for owner review (not shown on the page)'); for (const [l, n] of report.newC11) out.push(`- ${l}: ${n}`); }
if (report.holds.length) { out.push('', '## Held back (needs a decision)'); report.holds.forEach(h => out.push('- ' + h)); }
out.push('', '## Drops', ...drops.map(r => `- ${r[1]} | ${r[2]}${r[3] ? ' (' + r[3] + ')' : ''}: ${r[4].map(i => R.products[i][0]).join(', ')}`));
if (report.skipped.length) out.push('', '## Skipped orders', ...report.skipped.map(s => '- ' + s));
const text = out.join('\n') + '\n';
console.log(text);
if (opt.dry) process.exit(0);

/* ---------- write ---------- */
const CUTOFF = addDays(WEEK, -182);
R.drops = drops.concat(R.drops.filter(d => d[0] !== WEEK)).filter(d => d[0] >= CUTOFF);
if (newIds.length) R.newFlavors[WEEK] = newIds; else delete R.newFlavors[WEEK];
for (const w of Object.keys(R.newFlavors)) if (w < CUTOFF) delete R.newFlavors[w];
R.updated = today;
L.saveData(R);

const fotmPath = path.join(ROOT, 'flavors-of-the-month.js');
const fotm = (() => { try { const s = fs.readFileSync(fotmPath, 'utf8'); return JSON.parse(s.slice(s.indexOf('{'), s.lastIndexOf('}') + 1).replace(/^\s*\/\/.*$/mg, '').replace(/,\s*}/g, '}')); } catch { return {}; } })();
if (fotw.length) fotm[WEEK] = fotw.map(i => `${R.products[i][0]}|${R.products[i][1]}`);
for (const w of Object.keys(fotm)) if (w < CUTOFF) delete fotm[w];
fs.writeFileSync(fotmPath, `// Flavors of the Week, logged each Sunday by tools/weekly.js (2 picks per week, see rules.json).
// The page shows this week's picks as "Flavors of the Week" and the past 4 weeks as "Flavors of the Month".
window.FLAVORS_OF_THE_MONTH = ${JSON.stringify(Object.fromEntries(Object.entries(fotm).sort().reverse()), null, 2)};
`);

state.lastCutoff = NOW.toISOString();
state.publishedPOs = [...new Set((state.publishedPOs || []).concat(report.used))].slice(-3000);
delete state.menuSnapshot;
for (const w of Object.keys(state.menuLog || {})) if (w < addDays(CUTOFF, -30)) delete state.menuLog[w];
fs.writeFileSync(statePath, JSON.stringify(state, null, 2) + '\n');
fs.writeFileSync(path.join(ROOT, 'tools', 'last-report.md'), text);
console.log('Written: data.js, flavors-of-the-month.js, tools/state.json, tools/last-report.md');
