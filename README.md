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

## Each Monday

1. Open `https://ncoburn11.github.io/flavorade-releases/update.html`.
2. Paste the week's lines in the same format you used before (the `NEW FLAVORS` line + every store line).
3. Click **Check**, fill in type + tasting notes for any brand-new flavors, click **Download data.js**.
4. In this GitHub repo, choose **Add file → Upload files**, drop in the new `data.js`, and commit.

You never have to touch Squarespace again; the page picks up the new week on its own.
