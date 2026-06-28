"""
Wookiepedia — Galactic Empire Starship Classes Scraper
Pulls every page from Category:Starship_classes_of_the_Galactic_Empire
and extracts the 'type' and 'cost' fields from each ship's infobox wikitext.
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

# Wookiepedia ship infobox templates match these name fragments
INFOBOX_KEYWORDS = ("ship", "infobox", "vehicle", "starship", "craft", "station")

# Candidate field names for 'type' across template variants
TYPE_FIELDS = ("type", "class", "role", "model")

# Candidate field names for 'cost'
COST_FIELDS = ("cost",)

# Source book/citation titles that bleed into field values on Wookiepedia
# Order matters — more specific patterns first
_SOURCE_PREFIXES = [
    r"Star Wars[:\s]",
    r"Starships (?:and|of)",
    r"Rise of the Separatists",
    r"Collapse of the Republic",
    r"Dawn of Rebellion",
    r"The Force Unleashed",
    r"The Clone Wars",
    r"Friends Like These",
    r"Lead by Example",
    r"Geonosis and",
    r"Stay on Target",
    r"TIE Fighter Owners",
    r"Age of Rebellion",
    r"Roleplaying Game",
    r"Rebellion Era",
    r"Far Orbit",
    r"Force Awakens",
    r"Essential Guide",
    r"Galaxy Guide",
    r"Pirates &",
    r"Beyond the Rim",
    r"Desperate Allies",
    r"Fly Casual",
    r"Unknown Regions",
    r"Death Star",
    r"Timelines",
    r"Campaign Guide",
    r"Core Rulebook",
    r"Saga Edition",
    r"Workshop Manual",
]
_SOURCE_PAT = re.compile("|".join(_SOURCE_PREFIXES), re.IGNORECASE)


# ── Step 1: Walk the category ──────────────────────────────────────────────────

def get_category_members(category: str) -> list:
    members = []
    params = {
        "action": "query",
        "list": "categorymembers",
        "cmtitle": category,
        "cmtype": "page",
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
        if "continue" in data:
            params["cmcontinue"] = data["continue"]["cmcontinue"]
        else:
            break
    return members


# ── Step 2: Fetch raw wikitext ─────────────────────────────────────────────────

def get_wikitext(title: str):
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


# ── Step 3: Extract a field from the first matching infobox ───────────────────

def extract_infobox_field(wikitext: str, field_names: tuple):
    wikicode = mwparserfromhell.parse(wikitext)
    for template in wikicode.filter_templates():
        name = template.name.strip().lower()
        if any(k in name for k in INFOBOX_KEYWORDS):
            for field in field_names:
                if template.has(field):
                    raw = str(template.get(field).value).strip()
                    if raw:
                        cleaned = mwparserfromhell.parse(raw).strip_code().strip()
                        cleaned = re.sub(r"\s+", " ", cleaned)
                        return cleaned if cleaned else None
    return None


# ── Step 4: Clean type — strip source citations ────────────────────────────────

def clean_type(raw):
    if not raw:
        return ""
    s = raw.strip()

    # Cut at first known source citation
    m = _SOURCE_PAT.search(s)
    if m:
        s = s[:m.start()].strip()

    # Cut at camelCase join — lowercase char immediately followed by uppercase
    # e.g. "DestroyerStar" → "Destroyer"
    s = re.sub(r"([a-z])([A-Z])", r"\1", s).strip()

    # Normalize slash separators
    s = re.sub(r"\s*/\s*", " / ", s)

    # Collapse whitespace
    s = re.sub(r"\s+", " ", s).strip()

    return s


# ── Step 5: Clean cost — extract first numeric value ──────────────────────────

def clean_cost(raw):
    if not raw:
        return ""
    m = re.search(r"([\d,]+\.?\d*)\s*million", raw, re.IGNORECASE)
    if m:
        return str(int(float(m.group(1).replace(",", "")) * 1_000_000))
    m = re.search(r"([\d]{1,3}(?:,\d{3})+|\d+)", raw)
    if m:
        return m.group(1).replace(",", "")
    return ""


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
                cost_raw = ship_type_raw = None
            else:
                cost_raw      = extract_infobox_field(wikitext, COST_FIELDS)
                ship_type_raw = extract_infobox_field(wikitext, TYPE_FIELDS)

            ship_type  = clean_type(ship_type_raw)
            cost_clean = clean_cost(cost_raw)

            results.append({
                "ship":     title,
                "type":     ship_type,
                "cost":     cost_clean,
                "has_cost": "Yes" if cost_clean else "No",
                "url":      f"https://starwars.fandom.com/wiki/{title.replace(' ', '_')}",
            })

            parts = []
            if ship_type:
                parts.append(f"type={ship_type}")
            if cost_clean:
                parts.append(f"cost={cost_clean}")
            print(f"    {'✓' if parts else '–'} {' | '.join(parts) or 'No data'}")

        except requests.RequestException as e:
            print(f"    ✗ Request failed: {e}")
            results.append({
                "ship": title, "type": "ERROR",
                "cost": "ERROR", "has_cost": "No", "url": "",
            })

        time.sleep(SLEEP_BETWEEN)

    with open(OUTPUT_FILE, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["ship", "type", "cost", "has_cost", "url"])
        writer.writeheader()
        writer.writerows(results)

    total     = len(results)
    with_cost = sum(1 for r in results if r["has_cost"] == "Yes")
    with_type = sum(1 for r in results if r["type"] and r["type"] not in ("", "ERROR"))
    print(f"\n{'='*60}")
    print(f"Done. {total} ships processed.")
    print(f"  With type data : {with_type}")
    print(f"  With cost data : {with_cost}")
    print(f"Output written to: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()