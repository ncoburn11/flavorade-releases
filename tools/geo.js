// Builds geo.js for the "near me" search: a location for every store on the page and a
// California zip-code table (tools/ca-zips.json). Store location = its zip in stores.json (from the
// GrowFlow address); otherwise the center of its city. Chain-wide entries (All Stiiizy Shops, etc.)
// have no single location and are left out of near-me results.
const fs = require('fs');
const path = require('path');
const L = require('./lib');
const ROOT = L.ROOT;
const ZIPS = JSON.parse(fs.readFileSync(path.join(__dirname, 'ca-zips.json'), 'utf8'));
const CITY_ALIAS = {
  'chula vista broadway': 'chula vista', 'chula vista h st': 'chula vista', 'city heights': 'san diego', 'mission valley': 'san diego',
  'sabre springs': 'san diego', 'pacific beach': 'san diego', 'eagle rock': 'los angeles', 'westwood': 'los angeles', 'hollywood': 'los angeles',
  'west hollywood': 'west hollywood', 'south bay': 'torrance', 'bel air': 'los angeles', 'sf': 'san francisco', 'la': 'los angeles', 'sac': 'sacramento',
  'imperial valley': 'el centro', 'st marysville': 'marysville', 'calif city': 'california city', 'mammoth lake': 'mammoth lakes', 'lb': 'long beach',
  'sd': 'san diego', 'n hollywood': 'north hollywood', 'w hollywood': 'west hollywood', 'mc farland': 'mcfarland', 'east la': 'los angeles', 'dtla': 'los angeles',
  'nirvana': 'san diego', 'jurupa valley': 'riverside', 'south sacramento': 'sacramento', 'marina del ray': 'marina del rey', 'fairmount/city heights': 'san diego',
  'south la': 'los angeles', 'lake murray': 'la mesa', 'la brea': 'los angeles', 'cudahy': 'los angeles', 'mchenry': 'modesto', 'bel aire': 'los angeles',
  'fresno palm': 'fresno', 'korea town': 'los angeles', 'san berdardino': 'san bernardino', 'balboa': 'san diego', 'university': 'la mesa', 'st willows': 'willows', 'sn bernrdno': 'san bernardino', 'canyon lake': 'canyon lake'
};
// Neighborhood names used as the "city" on the page -> a zip in that neighborhood
const AREA_ZIP = { 'mission valley': '92108', 'sabre springs': '92128', 'city heights': '92105', 'fairmount/city heights': '92105', 'chula vista broadway': '91911',
  'chula vista h st': '91910', 'pacific beach': '92109', 'eagle rock': '90041', 'westwood': '90024', 'hollywood': '90028', 'balboa': '92111', 'university': '91942',
  'sherman oaks': '91403', 'mission hills': '91345', 'south la': '90003', 'korea town': '90005', 'la brea': '90036', 'lake murray': '91942', 'bel air': '90077', 'bel aire': '90077',
  'imperial beach': '91932', 'south bay': '90501', 'imperial valley': '92243' };
const CHAIN = /^(california|southern california|northern california|norcal|all|statewide)$/i;
const key = s => String(s || '').toLowerCase().replace(/[.']/g, '').replace(/\s+/g, ' ').trim();
const byCity = {};
for (const [z, [lat, lon, city]] of Object.entries(ZIPS)) { (byCity[key(city)] = byCity[key(city)] || []).push([lat, lon]); }
const center = list => [+(list.reduce((a, p) => a + p[0], 0) / list.length).toFixed(3), +(list.reduce((a, p) => a + p[1], 0) / list.length).toFixed(3)];
function cityPoint(city) {
  const k = key(city);
  if (AREA_ZIP[k] && ZIPS[AREA_ZIP[k]]) return ZIPS[AREA_ZIP[k]].slice(0, 2); const c = CITY_ALIAS[k] || k;
  return byCity[c] ? center(byCity[c]) : null;
}
function build() {
  const R = L.loadData();
  const stores = JSON.parse(fs.readFileSync(path.join(ROOT, 'stores.json'), 'utf8'));
  const zipOf = {};
  for (const s of Object.values(stores)) if (s.zip) zipOf[L.norm(s.shop) + '|' + L.norm(s.city)] = s.zip;
  const out = {}, missing = [];
  for (const d of R.drops) {
    const k = d[1] + '|' + (d[2] || '');
    if (k in out) continue;
    if (!d[2] || CHAIN.test(d[2]) || /^all\b/i.test(d[1])) { out[k] = null; continue; }
    const z = zipOf[L.norm(d[1]) + '|' + L.norm(d[2])];
    const p = (z && ZIPS[z] && ZIPS[z].slice(0, 2)) || cityPoint(d[2]);
    out[k] = p; if (!p) missing.push(k);
  }
  const zips = Object.fromEntries(Object.entries(ZIPS).map(([z, v]) => [z, [v[0], v[1]]]));
  const stores2 = Object.fromEntries(Object.entries(out).filter(([, v]) => v));
  fs.writeFileSync(path.join(ROOT, 'geo.js'), `// Built by tools/geo.js. Store locations (from GrowFlow zip, else city center) and California zip codes.\nwindow.GEO = ${JSON.stringify({ stores: stores2, zips })};\n`);
  return { located: Object.keys(stores2).length, missing };
}
module.exports = { build };
if (require.main === module) { const r = build(); console.log('stores located:', r.located, 'no location:', r.missing); }
