import json
from pathlib import Path

BASE = Path("C:/Users/a2132/Documents/星靈王/XingLingWang_v7_fixed")
cards_file = BASE / "data" / "cards.json"

with open(cards_file, "r", encoding="utf-8") as f:
    cards = json.load(f)

def normDeckName(v):
    v = str(v or "").strip()
    if "藝術" in v: return "藝術品"
    if "妖怪" in v: return "妖怪村莊"
    if "喵" in v or "貓" in v: return "喵喵賊"
    return v

def belongsToDeck(c, deckName):
    if not c: return False
    deckName = normDeckName(deckName)

    # 中立卡牌可以加入任何種族的牌組中
    if c.get("faction") == "中立" or c.get("race") == "中立" or str(c.get("id")).startswith("NEU-") or c.get("deck") == "中立" or c.get("deck") == "中立單位":
        return True

    return (
        c.get("faction") == deckName or
        c.get("race") == deckName or
        (deckName == "藝術品" and str(c.get("id")).startswith("ART-")) or
        (deckName == "喵喵賊" and (str(c.get("id")).startswith("CAT_") or str(c.get("id")).startswith("CAT-"))) or
        (deckName == "妖怪村莊" and (str(c.get("id")).startswith("VLG_") or str(c.get("id")).startswith("VLG-")))
    )

print("Evaluating belongsToDeck with '藝術品':")
matching = []
for c in cards:
    if belongsToDeck(c, "藝術品"):
        matching.append(c)

print(f"Total matching '藝術品': {len(matching)}")

# Print if any of these match other factions
for c in matching:
    fid = c.get("id", "")
    fname = c.get("name", "")
    faction = c.get("faction", "")
    race = c.get("race", "")
    deck = c.get("deck", "")
    # Check if this card's id or faction or race points to cat or yokai
    if "CAT" in fid or "VLG" in fid or "喵" in faction or "喵" in race or "妖怪" in faction or "妖怪" in race or "喵" in deck or "妖怪" in deck:
        print(f"SUSPECT: ID: {fid}, Name: {fname}, Faction: {faction}, Race: {race}, Deck: {deck}")
