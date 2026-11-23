# Asset library — drop your images here

The film reads this folder at build time (`python3 tools/scan_assets.py`), so any image you add is placed
automatically on the next render. Accepted: .jpg .jpeg .png .webp (landscape, ≥ 1920 px wide ideally 3840).

| Folder | How the film uses it | Status |
|---|---|---|
| 01_UAE_Maps | Reference only. Scene 1 is drawn from real boundary data (Overture/OSM), not from images | empty |
| 02_Abu_Dhabi_Maps | Reference only (geography is drawn from real data). A file named `*skyline*` becomes the closing-shot backdrop | empty |
| 03_Yas_Island … 09_Lulu_Island | First image (alphabetical) = hero photo on that island's card, with slow parallax push-in. Others are kept as alternates | empty |
| 10_Market_Statistics, 11_Economic_Growth | Reference only. On-screen numbers come from the cited official releases in `docs/sources.md` | empty |
| 12_Personal_Branding | `logo*.png` (transparent) appears on the final screen; a `*.txt` file's first line is used as the sign-off name | empty |

Tip: name a file `01_...` to force it to be the hero image.
