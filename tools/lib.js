// Shared helpers for the weekly Flavorade release update.
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const norm = s => String(s || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');
const COLLAB = { kushco: 'Kush Co', lafamilyfarms: 'LA Family Farms', preferredgardens: 'Preferred Gardens' };
const fixCollab = c => COLLAB[norm(c)] || String(c || '').trim();
const ALIAS = { kushcoog: 'KushCo OG', gelato41: 'Gelato-41', runtscotti: 'Runt-scotti', zombiebrains: 'Zombie Brainz', blackrunts: 'Black Runts' };
const SKIP_STAGES = new Set(['RETURNED', 'VOIDED', 'REJECTED']);

function loadData() {
  const src = fs.readFileSync(path.join(ROOT, 'data.js'), 'utf8');
  const json = src.slice(src.indexOf('{', src.indexOf('window.RELEASES')), src.lastIndexOf('}') + 1);
  return JSON.parse(json);
}
function saveData(R) {
  fs.writeFileSync(path.join(ROOT, 'data.js'),
`// Flavorade release data. Updated weekly by tools/weekly.js from GrowFlow deliveries.
// products: [strain, collaborator, type, tasting notes]
// newFlavors: { weekStart: [product index, ...] }
// drops: [weekStart, shop, city, deal, [product index, ...]]
window.RELEASES = ${JSON.stringify(R)};
`);
}

// "Flavorade x Pearl Pharma | Pearl OG | Vape Cart | 1g_6095" -> {strain, collab}
function parseProduct(name) {
  const p = String(name || '').split('|').map(x => x.trim());
  if (p.length < 3 || !/^Flavorade\b/i.test(p[0])) return null; // skips batteries, kits, VUZE, Casual...
  const collab = fixCollab((p[0].match(/^Flavorade\s+x\s+(.+)$/i) || [])[1] || '');
  const strain = ALIAS[norm(p[1])] || p[1];
  return { strain, collab };
}

// UTC timestamp -> California calendar date "YYYY-MM-DD"
function caDate(ts) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(new Date(ts));
}
// The release week a delivery shows up under: the Monday AFTER the delivery week (Mon-Sun).
function releaseWeek(ts) {
  const d = new Date(caDate(ts) + 'T12:00:00Z');
  const dow = (d.getUTCDay() + 6) % 7; // Mon=0
  d.setUTCDate(d.getUTCDate() - dow + 7);
  return d.toISOString().slice(0, 10);
}
function cityFromAddress(a) {
  const parts = String(a || '').split(',').map(s => s.trim()).filter(Boolean);
  // drop zip and "CA"
  while (parts.length && (/^\d{5}/.test(parts[parts.length - 1]) || /^(ca|california)$/i.test(parts[parts.length - 1]))) parts.pop();
  const c = parts[parts.length - 1] || '';
  return c.toLowerCase().replace(/\b\w/g, m => m.toUpperCase());
}
// Read one or more GrowFlow query results ({data:{orders:{items:[...]}}} or a bare array).
function readOrders(files) {
  const out = [];
  for (const f of files) {
    const j = JSON.parse(fs.readFileSync(f, 'utf8'));
    const items = Array.isArray(j) ? j : (j.data ? j.data.orders.items : j.orders ? j.orders.items : j.items);
    out.push(...items);
  }
  // de-dupe by PO (a PO can appear twice if re-queried); keep the latest copy
  const byPo = new Map(); for (const o of out) byPo.set(o.poNumber, o);
  return [...byPo.values()];
}
// Group usable orders -> Map(week -> Map(license -> {vendor, flavors:[{strain,collab}]}))
function groupDeliveries(orders) {
  const weeks = new Map();
  for (const o of orders) {
    if (SKIP_STAGES.has(o.stage) || !o.vendor || !o.transferDate) continue;
    if (new Date(o.transferDate) > new Date()) continue; // scheduled/future transfers stay hidden until they happen
    const wk = releaseWeek(o.transferDate);
    const flavors = (o.lineItems || []).map(li => parseProduct(li.product && li.product.name)).filter(Boolean);
    if (!flavors.length) continue;
    if (!weeks.has(wk)) weeks.set(wk, new Map());
    const m = weeks.get(wk), lic = o.vendor.licenseNumber;
    if (!m.has(lic)) m.set(lic, { vendor: o.vendor, flavors: [], firstTs: o.transferDate });
    const e = m.get(lic);
    for (const f of flavors) if (!e.flavors.some(x => norm(x.strain) === norm(f.strain) && norm(x.collab) === norm(f.collab))) e.flavors.push(f);
    if (o.transferDate < e.firstTs) e.firstTs = o.transferDate;
  }
  return weeks;
}
// Deals from the "Current - 2026" tab of the deals sheet -> (shop, city) => deal text
function dealFinder(sheet) {
  const norm = module.exports.norm;
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

module.exports = { dealFinder, ROOT, norm, fixCollab, parseProduct, caDate, releaseWeek, cityFromAddress, readOrders, groupDeliveries, loadData, saveData };
