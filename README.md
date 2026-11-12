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
  title="Flavorade Release Finder" loading="lazy"
  style="width:100%;height:1400px;border:0;display:block"></iframe>
<script>
  window.addEventListener('message', function (e) {
    if (e.data && e.data.flavoradeHeight) {
      document.getElementById('flavorade-finder').style.height = e.data.flavoradeHeight + 'px';
    }
  });
</script>
```

The frame grows and shrinks to fit the page automatically, so customers never see a second scrollbar.

## Weekly updates (automatic)

Every Monday a scheduled Claude session does the update:

1. It reads the past week's Flavorade deliveries from GrowFlow.
2. It pulls tasting notes for any brand-new flavors from the FA - Tasting Notes sheet.
3. It runs `tools/weekly.js` and pushes the new `data.js` here.

To run it any other time, tell Claude "update releases". The full procedure is in `CLAUDE.md`.

- `stores.json` maps each GrowFlow license to the store name, city, and deal customers see. To rename a store or change a deal, edit it there or tell Claude.
- A store missing from `stores.json` is held back and listed in `tools/last-report.md` until it has a name.

- **Nick's Favorite Flavors:** edit `picks.js` on GitHub (pencil icon → add flavor names → Commit), or tell Claude your picks. They show at the top of the All Time tab while they've dropped in the past 4 weeks.

You never have to touch Squarespace again; the page picks up the new week on its own.
