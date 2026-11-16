# Putting the Release Finder on flavoradeextracts.com/releases

The Release Finder lives in this repo and is served by GitHub Pages at:

    https://ncoburn11.github.io/flavorade-releases/

## Replace the old Squarespace code

1. In Squarespace, open the **Releases** page and edit it.
2. Delete the old Code Block (the one that starts with `<!DOCTYPE html>` and `const stores = [`).
   Keep the Elfsight popup block if you still want it.
3. Add a new **Code Block** and paste this:

```html
<iframe id="flavorade-finder" src="https://ncoburn11.github.io/flavorade-releases/"
  title="Flavorade Release Finder" allow="geolocation"
  style="width:100%;height:1400px;border:0;display:block"></iframe>
<script>
(function () {
  var ORIGIN = 'https://ncoburn11.github.io';
  var frame = document.getElementById('flavorade-finder');
  // A small copy of the finder's search bar and tabs, pinned by the browser itself (no lag while scrolling).
  var bar = document.createElement('iframe');
  bar.src = ORIGIN + '/flavorade-releases/?bar';
  bar.title = 'Flavorade search';
  bar.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:0;border:0;display:block;z-index:998;visibility:hidden;background:#30143D';
  document.body.appendChild(bar);
  var barEnd = null, barHeight = 0, shown = false, top = -1;
  // Height of the site's own header while it is pinned to the top of the screen (0 when it is not).
  function headerHeight() {
    var h = document.querySelector('header#header, header.header, header');
    if (!h) return 0;
    var pos = getComputedStyle(h).position;
    if (pos !== 'fixed' && pos !== 'sticky') return 0;
    return Math.max(0, Math.round(h.getBoundingClientRect().bottom));
  }
  function update() {
    var r = frame.getBoundingClientRect(), hh = headerHeight();
    if (hh !== top) { top = hh; bar.style.top = hh + 'px'; }
    // Show it once the finder's own tabs reach the bottom of the pinned copy, so the tabs line up exactly.
    var show = barEnd !== null && barHeight > 0 && r.top + barEnd <= hh + barHeight && r.bottom - barHeight > hh;
    if (show !== shown) { shown = show; bar.style.visibility = show ? 'visible' : 'hidden'; }
  }
  window.addEventListener('message', function (e) {
    if (e.origin !== ORIGIN || !e.data) return;
    var d = e.data;
    if (e.source === frame.contentWindow) {
      if (d.flavoradeHeight) frame.style.height = d.flavoradeHeight + 'px';
      if (typeof d.flavoradeBarEnd === 'number') barEnd = d.flavoradeBarEnd;
      if (typeof d.flavoradeScrollTo === 'number') {
        var y = window.scrollY + frame.getBoundingClientRect().top + d.flavoradeScrollTo - headerHeight() - barHeight;
        if (window.scrollY > y) window.scrollTo({ top: y, behavior: 'smooth' });
      }
    } else if (e.source === bar.contentWindow && d.flavoradeBarHeight) {
      barHeight = d.flavoradeBarHeight; bar.style.height = barHeight + 'px';
    }
    update();
  });
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
})();
</script>
```

The frame grows and shrinks to fit the page automatically, so customers never see a second scrollbar.
The script also adds a small copy of the search bar and tabs, pinned by the browser just under the site header once customers scroll past the real one (no lag). Both copies stay in sync.

## Weekly updates (automatic)

Every Monday a scheduled Claude session does the update:

1. It reads the past week's Flavorade deliveries from GrowFlow.
2. It pulls tasting notes for any brand-new flavors from the FA - Tasting Notes sheet.
3. It runs `tools/weekly.js` and pushes the new `data.js` here.

To run it any other time, tell Claude "update releases". The full procedure is in `CLAUDE.md`.

- `stores.json` maps each GrowFlow license to the store name, city, and deal customers see. To rename a store or change a deal, edit it there or tell Claude.
- A store missing from `stores.json` is held back and listed in `tools/last-report.md` until it has a name.

- **Flavors of the Month:** these are logged week by week in `flavors-of-the-month.js`. Tell Claude each week's picks, or add a line on GitHub. The All Time tab shows every pick from the past 4 weeks.

You never have to touch Squarespace again; the page picks up the new week on its own.
