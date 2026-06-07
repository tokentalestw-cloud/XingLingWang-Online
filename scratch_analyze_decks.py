import json
from pathlib import Path

BASE = Path("C:/Users/a2132/Documents/星靈王/XingLingWang_v7_fixed")
cards_file = BASE / "data" / "cards.json"
decks_file = BASE / "data" / "decks.json"

with open(cards_file, "r", encoding="utf-8") as f:
    cards = json.load(f)

print("Total cards:", len(cards))

# Find specific names
targets = ["喵喵賊", "妖怪村莊", "喵女", "DJ喵", "靴喵", "虎老大"]
for c in cards:
    if any(t in c.get("name", "") for t in targets) or any(t in c.get("faction", "") for t in targets) or any(t in c.get("race", "") for t in targets):
        print(f"ID: {c.get('id')}, Name: {c.get('name')}, Faction: {c.get('faction')}, Race: {c.get('race')}, Deck: {c.get('deck')}")

with open(decks_file, "r", encoding="utf-8") as f:
    decks = json.load(f)

print("Decks keys:", list(decks.keys()))
print("Art deck size:", len(decks.get("藝術品", [])))
print("Art deck cards:")
for cid in decks.get("藝術品", []):
    card = next((c for c in cards if c["id"] == cid), None)
    if card:
        print(f"  - {cid}: {card.get('name')} (Faction: {card.get('faction')}, Race: {card.get('race')})")
    else:
        print(f"  - {cid} (NOT FOUND IN cards.json)")
