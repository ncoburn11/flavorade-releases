// Read the Flavorade SKUs listed on the live menu (ncoburn11/live-menu) as of the end of a given
// California day, straight from that repo's git history. Read-only: never edits the live menu.
const { execFileSync } = require('child_process');
const L = require('./lib');

// UTC instant of 23:59:59 on a California calendar day (handles PST/PDT).
function caEndOfDay(ymd) {
  for (const off of [7, 8]) {
    const t = new Date(`${ymd}T23:59:59.000-0${off}:00`);
    if (L.caDate(t) === ymd && L.caDate(new Date(t.getTime() + 1000)) !== ymd) return t;
  }
  throw new Error('bad date ' + ymd);
}
const git = (repo, args) => execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8', maxBuffer: 64 << 20 });

// -> { commit, updated, flavors: ["Strain|Collab", ...] } or null if history does not reach that day
function snapshotAt(repo, ymd, ref = 'origin/main') {
  const end = caEndOfDay(ymd).toISOString();
  const h = git(repo, ['log', ref, '-1', `--before=${end}`, '--format=%H', '--', 'index.html']).trim();
  if (!h) return null;
  const html = git(repo, ['show', `${h}:index.html`]);
  const m = html.match(/id="menu-data" type="application\/json">([\s\S]*?)<\/script>/);
  if (!m) return null;
  const d = JSON.parse(m[1]);
  const flavors = (d.Flavorade || []).map(x => { const p = L.parseProduct(`Flavorade${x.c ? ' x ' + x.c : ''} | ${x.s} | Vape Cart | 1g`); return `${p.strain}|${p.collab}`; });
  return { commit: h.slice(0, 7), updated: d.updated, flavors: [...new Set(flavors)] };
}
// oldest commit date in the clone (to know whether a snapshot is trustworthy)
const oldest = (repo, ref = 'origin/main') => git(repo, ['log', ref, '--reverse', '--format=%aI', '--', 'index.html']).split('\n')[0];

module.exports = { snapshotAt, oldest, caEndOfDay };
