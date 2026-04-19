"""
Wookiepedia — Galactic Empire Starship Classes Cost Scraper
Pulls every page from Category:Starship_classes_of_the_Galactic_Empire
and extracts the 'cost' field from each ship's infobox wikitext.
Outputs: empire_ships_costs.csv
"""

import requests
import mwparserfromhell
import csv
import time
import re

API = "https://starwars.fandom.com/api.php"
CATEGORY = "Category:Starship_classes_of_the_Galactic_Empire"
OUTPUT_FILE = "empire_ships_costs.csv"
SLEEP_BETWEEN = 0.75  # seconds between page fetches — be polite


# ── Step 1: Walk the category and collect all page titles ──────────────────────

def get_category_members(category: str) -> list[dict]:
    """Returns all pages in a category, handling API pagination."""
    members = []
    params = {
        "action": "query",
        "list": "categorymembers",
        "cmtitle": category,
        "cmtype": "page",          # skip sub-categories and files
        "cmlimit": "500",
        "format": "json",
    }

    while True:
        r = requests.get(API, params=params, timeout=15)
        r.raise_for_status()
        data = r.json()

        batch = data["query"]["categorymembers"]
        members.extend(batch)
        print(f"  Fetched {len(batch)} members (total so far: {len(members)})")

        # Pagination — cmcontinue signals there are more pages
        if "continue" in data:
            params["cmcontinue"] = data["continue"]["cmcontinue"]
        else:
            break

    return members


# ── Step 2: Fetch raw wikitext for a single page ───────────────────────────────

def get_wikitext(title: str) -> str | None:
    """Fetches raw wikitext for a Wookiepedia page title."""
    params = {
        "action": "parse",
        "page": title,
        "prop": "wikitext",
        "format": "json",
    }
    r = requests.get(API, params=params, timeout=15)
    r.raise_for_status()
    data = r.json()

    if "error" in data:
        print(f"    ⚠ API error for '{title}': {data['error'].get('info')}")
        return None

    return data["parse"]["wikitext"]["*"]


# ── Step 3: Parse the infobox and extract the cost field ──────────────────────

def extract_cost(wikitext: str) -> str | None:
    """
    Uses mwparserfromhell to find any infobox template and pull the 'cost' param.
    Returns the cleaned text value, or None if not found / blank.
    """
    wikicode = mwparserfromhell.parse(wikitext)

    for template in wikicode.filter_templates():
        name = template.name.strip().lower()
        # Wookiepedia ship infoboxes are named things like "Ship class" or "Infobox starship"
        if "ship" in name or "infobox" in name or "vehicle" in name or "starship" in name:
            for param in template.params:
                if param.name.strip().lower() == "cost":
                    raw = str(param.value).strip()
                    if raw:
                        # Strip any remaining wiki markup (links, refs, etc.)
                        cleaned = mwparserfromhell.parse(raw).strip_code().strip()
                        # Collapse whitespace
                        cleaned = re.sub(r"\s+", " ", cleaned)
                        return cleaned if cleaned else None

    return None


# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    print(f"Fetching category members from: {CATEGORY}")
    members = get_category_members(CATEGORY)
    print(f"\nTotal pages found: {len(members)}\n")

    results = []

    for i, member in enumerate(members, 1):
        title = member["title"]
        print(f"[{i}/{len(members)}] {title}")

        try:
            wikitext = get_wikitext(title)
            if wikitext is None:
                cost = None
            else:
                cost = extract_cost(wikitext)

            results.append({
                "ship": title,
                "cost": cost if cost else "",
                "has_cost": "Yes" if cost else "No",
                "url": f"https://starwars.fandom.com/wiki/{title.replace(' ', '_')}",
            })

            if cost:
                print(f"    ✓ Cost: {cost}")
            else:
                print(f"    – No cost listed")

        except requests.RequestException as e:
            print(f"    ✗ Request failed: {e}")
            results.append({
                "ship": title,
                "cost": "ERROR",
                "has_cost": "No",
                "url": "",
            })

        time.sleep(SLEEP_BETWEEN)

    # ── Write CSV ──────────────────────────────────────────────────────────────
    with open(OUTPUT_FILE, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["ship", "cost", "has_cost", "url"])
        writer.writeheader()
        writer.writerows(results)

    # ── Summary ───────────────────────────────────────────────────────────────
    total = len(results)
    with_cost = sum(1 for r in results if r["has_cost"] == "Yes")
    print(f"\n{'='*60}")
    print(f"Done. {total} ships processed.")
    print(f"  With cost data : {with_cost}")
    print(f"  Without cost   : {total - with_cost}")
    print(f"Output written to: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()