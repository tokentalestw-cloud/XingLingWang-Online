import json
from pathlib import Path

BASE = Path("C:/Users/a2132/Downloads/XingLingWang_v10_dark_board_race_fixed/XingLingWang_v9_quick_start_pretty_board")
cards_file = BASE / "data" / "cards.json"

if not cards_file.exists():
    print("Version 10 cards.json does not exist.")
    exit(0)

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
print(f"Total matching in version 10/9: {len(matching)}")

# Search for any CAT or VLG suspects
suspects = []
for c in matching:
    fid = c.get("id", "")
    faction = c.get("faction", "")
    race = c.get("race", "")
    deck = c.get("deck", "")
    name = c.get("name", "")
    
    is_neutral = faction == "中立" or race == "中立" or fid.startswith("NEU-") or deck == "中立" or deck == "中立單位"
    
    if not is_neutral and ("CAT" in fid or "VLG" in fid or "喵" in name or "貓" in name or "妖怪" in name or "村" in name):
        suspects.append(c)

print(f"Total non-neutral suspects: {len(suspects)}")
for s in suspects:
    print(f"  ID: {s.get('id')}, Name: {s.get('name')}, Faction: {s.get('faction')}, Race: {s.get('race')}, Deck: {s.get('deck')}")
