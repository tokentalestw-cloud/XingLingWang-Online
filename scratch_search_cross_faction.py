import json
from pathlib import Path

BASE = Path("C:/Users/a2132/Documents/星靈王/XingLingWang_v7_fixed")
cards_file = BASE / "data" / "cards.json"

with open(cards_file, "r", encoding="utf-8") as f:
    cards = json.load(f)

print("Checking for cards with faction/race=='藝術品' but have cat or vlg markers:")
count = 0
for c in cards:
    faction = c.get("faction", "")
    race = c.get("race", "")
    deck = c.get("deck", "")
    fid = c.get("id", "")
    img = c.get("image", "")
    name = c.get("name", "")
    orig = c.get("original_file", "")
    
    is_art = faction == "藝術品" or race == "藝術品" or deck == "藝術品" or fid.startswith("ART-")
    
    if is_art:
        has_other = (
            "CAT" in fid or "VLG" in fid or 
            "cat" in img.lower() or "yokai" in img.lower() or "vlg" in img.lower() or
            "cat" in orig.lower() or "yokai" in orig.lower() or "vlg" in orig.lower() or
            "喵" in name or "貓" in name or "妖怪" in name or "村" in name
        )
        if has_other:
            count += 1
            print(f"[{count}] ID: {fid}, Name: {name}, Faction: {faction}, Race: {race}, Deck: {deck}")
            print(f"    Image: {img}, OriginalFile: {orig}")

print("Search finished.")
