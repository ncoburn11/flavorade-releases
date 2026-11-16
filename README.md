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
  title="Flavorade Release Finder" loading="lazy" allow="geolocation"
  style="width:100%;height:1400px;border:0;display:block"></iframe>
<script>
(function () {
  var ORIGIN = 'https://ncoburn11.github.io';
  var frame = document.getElementById('flavorade-finder');
  // Height of the site's own header while it is pinned to the top of the screen (0 when it is not).
  function headerHeight() {
    var h = document.querySelector('header#header, .Header, header');
    if (!h) return 0;
    var pos = getComputedStyle(h).position;
    if (pos !== 'fixed' && pos !== 'sticky') return 0;
    return Math.max(0, h.getBoundingClientRect().bottom);
  }
  // Tell the finder where it sits on screen so it can keep its search bar at the top.
  var queued = false;
  function send() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () {
      queued = false;
      if (frame.contentWindow) frame.contentWindow.postMessage({
        flavoradeTop: frame.getBoundingClientRect().top,
        flavoradeOffset: headerHeight()
      }, ORIGIN);
    });
  }
  window.addEventListener('message', function (e) {
    if (e.origin !== ORIGIN || !e.data) return;
    if (e.data.flavoradeHeight) { frame.style.height = e.data.flavoradeHeight + 'px'; send(); }
    if (typeof e.data.flavoradeScrollTo === 'number') {
      var y = window.scrollY + frame.getBoundingClientRect().top + e.data.flavoradeScrollTo - headerHeight();
      if (window.scrollY > y) window.scrollTo({ top: y, behavior: 'smooth' });
    }
  });
  window.addEventListener('scroll', send, { passive: true });
  window.addEventListener('resize', send);
  frame.addEventListener('load', send);
})();
</script>
```

The frame grows and shrinks to fit the page automatically, so customers never see a second scrollbar.
The script also tells the finder where it sits on screen, so its search bar and tabs stay pinned just under the site header while customers scroll.

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
