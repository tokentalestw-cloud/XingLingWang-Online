import json
from pathlib import Path

BASE = Path("C:/Users/a2132/Documents/星靈王/XingLingWang_v7_fixed")
cards_file = BASE / "data" / "cards.json"

with open(cards_file, "r", encoding="utf-8") as f:
    cards = json.load(f)

print("Searching for neutral cards containing CAT, VLG, 喵, 貓, 妖怪, or 村莊:")
count = 0
for c in cards:
    fid = c.get("id", "")
    faction = c.get("faction", "")
    race = c.get("race", "")
    deck = c.get("deck", "")
    name = c.get("name", "")
    effect = c.get("effect_text", "")
    
    # Check if classified as neutral
    is_neutral = faction == "中立" or race == "中立" or fid.startswith("NEU-") or deck == "中立" or deck == "中立單位"
    
    if is_neutral:
        # Check if name or id or effect has cat/yokai markers
        has_marker = (
            "CAT" in fid or "VLG" in fid or 
            "喵" in name or "貓" in name or "妖怪" in name or "村莊" in name or "村" in name or
            "喵" in effect or "貓" in effect or "妖怪" in effect or "村莊" in effect
        )
        if has_marker:
            count += 1
            print(f"[{count}] ID: {fid}, Name: {name}, Faction: {faction}, Race: {race}, Deck: {deck}")
            print(f"    Effect: {effect}")
