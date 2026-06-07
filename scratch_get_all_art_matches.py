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

matching = [c for c in cards if belongsToDeck(c, "藝術品")]

# Let's write them all to a text file in UTF-8
out_lines = []
out_lines.append(f"Total matching '藝術品': {len(matching)}")
for c in matching:
    out_lines.append(f"ID: {c.get('id')}, Name: {c.get('name')}, Faction: {c.get('faction')}, Race: {c.get('race')}, Deck: {c.get('deck')}")

with open(BASE / "scratch_all_matching_art.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(out_lines))

print("Done, check scratch_all_matching_art.txt")
