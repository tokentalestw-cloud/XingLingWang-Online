import json
from pathlib import Path

BASE = Path("C:/Users/a2132/Documents/星靈王/XingLingWang_v7_fixed")
cards_file = BASE / "data" / "cards.json"

with open(cards_file, "r", encoding="utf-8") as f:
    cards = json.load(f)

print("CAT or VLG cards in cards.json with deck == '中立單位':")
count = 0
for c in cards:
    fid = c.get("id", "")
    deck = c.get("deck", "")
    faction = c.get("faction", "")
    race = c.get("race", "")
    name = c.get("name", "")
    if "CAT" in fid or "VLG" in fid:
        if deck == "中立單位":
            count += 1
            print(f"[{count}] ID: {fid}, Name: {name}, Faction: {faction}, Race: {race}, Deck: {deck}")
