import json
from pathlib import Path

BASE = Path("C:/Users/a2132/Documents/星靈王/XingLingWang_v7_fixed")
cards_file = BASE / "data" / "cards.json"

with open(cards_file, "r", encoding="utf-8") as f:
    cards = json.load(f)

print("Neutral cards with CAT or VLG in ID:")
for c in cards:
    fid = c.get("id", "")
    faction = c.get("faction", "")
    race = c.get("race", "")
    deck = c.get("deck", "")
    name = c.get("name", "")
    if "CAT" in fid or "VLG" in fid:
        if faction == "中立" or race == "中立" or deck == "中立" or deck == "中立單位":
            print(f"ID: {fid}, Name: {name}, Faction: {faction}, Race: {race}, Deck: {deck}")
