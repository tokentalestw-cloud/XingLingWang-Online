import json
from pathlib import Path

BASE = Path("C:/Users/a2132/Documents/星靈王/XingLingWang_v7_fixed")
cards_file = BASE / "data" / "cards.json"

with open(cards_file, "r", encoding="utf-8") as f:
    cards = json.load(f)

for c in cards:
    name = c.get("name", "")
    if "喵" in name or "妖怪" in name or "村莊" in name:
        print(f"ID: {c.get('id')}, Name: {name}, Faction: {c.get('faction')}, Race: {c.get('race')}")
