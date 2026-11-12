# Flavorade Release Finder: weekly update

Public page: https://ncoburn11.github.io/flavorade-releases/ (embedded on flavoradeextracts.com/releases).
Never link to or copy anything from the private buyers menu (ncoburn11/live-menu).

When asked to "update releases" (or when the Monday scheduled task fires), do this:

1. **Pick the week.** `WEEK` = the Monday being published, normally today (California time).
   The drops for `WEEK` are the deliveries from the 7 days before it (Mon–Sun).
2. **Pull deliveries from GrowFlow** with `wholesale_query`, using region `ca` and license
   `C11-0001795-LIC` (Cleanline Management, INC, the distributor). Page with `skip` 0, 50, 100…
   until you have `totalCount` items:
   ```graphql
   { orders(skip: 0, take: 50, where: { orderType: { eq: RETAIL },
       transferDate: { gte: "<WEEK-7>T07:00:00Z", lt: "<WEEK>T08:00:00Z" } }, order: { transferDate: ASC })
     { totalCount items { poNumber transferDate stage vendor { name licenseNumber vendorAddress } lineItems { product { name } } } } }
   ```
   Save each page's raw JSON to a file (large results are already saved to a file; copy that file).
   The script drops orders outside the week, returned or voided orders, and non-Flavorade lines.
3. **Dry run:**
   ```bash
   node tools/weekly.js --week WEEK --orders page1.json page2.json --dry
   ```
4. **New flavors need tasting notes.** For each flavor under "NEED TASTING NOTES", look it up in the
   Google Sheet `1UVE-yAzlKXEOEK8U1_znxgEOAi7Pgcqs9pifJTkUX0Q`, tab "FA - Tasting Notes".
   - Read the whole tab. Get `rowCount` from `get_spreadsheet`, then read `A1:Z<rowCount>` in chunks of at most 400 rows.
   - Match against the Name/Tasting Notes columns (A = type, B = name, C = notes) and against the
     UNSORTED column E ("Flavorade x Collab | Strain | Vape Cart | 1g - Type - Notes").
   - Write the matches to `notes.json` as `{"Strain|Collab": {"type": "...", "notes": "..."}}`.
   - If a flavor truly has no note yet, publish it without one and say so.
5. **Unknown stores.** Stores listed under "Stores not published" have no entry in `stores.json`
   (license → `shop`, `city`, `deal`).
   - Add one only when you are sure of the public store name, for example "Otc X LLC" → `OTC` + city.
   - Otherwise leave it out and list it in your summary so the owner can name it.
   - Deals also live in `stores.json`. Edit them there when the owner gives a new deal.
6. **Stores outside GrowFlow.** For a store the owner names (Stiiizy, March and Ash, etc.), pass `--extra extra.json`.
7. **Run for real.** Run the same command without `--dry`, then commit `data.js`, `stores.json`, and
   `tools/last-report.md` and push to `main`. GitHub Pages republishes in about a minute.
8. **Summarize for the owner:** the new flavors, the number of stores, any unnamed stores, and any missing notes.

Data format is documented at the top of `data.js`. `index.html` needs no changes for a weekly update.
