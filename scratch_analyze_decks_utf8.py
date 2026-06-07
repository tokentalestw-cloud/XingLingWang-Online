import json
from pathlib import Path

BASE = Path("C:/Users/a2132/Documents/星靈王/XingLingWang_v7_fixed")
cards_file = BASE / "data" / "cards.json"
decks_file = BASE / "data" / "decks.json"

with open(cards_file, "r", encoding="utf-8") as f:
    cards = json.load(f)

with open(decks_file, "r", encoding="utf-8") as f:
    decks = json.load(f)

out_lines = []
out_lines.append(f"Total cards: {len(cards)}")
out_lines.append(f"Decks keys: {list(decks.keys())}")

for deck_name, card_ids in decks.items():
    out_lines.append(f"\nDeck: '{deck_name}' (size: {len(card_ids)})")
    for cid in card_ids:
        card = next((c for c in cards if c["id"] == cid), None)
        if card:
            out_lines.append(f"  - {cid}: {card.get('name')} (Faction: {card.get('faction')}, Race: {card.get('race')}, Deck: {card.get('deck')})")
        else:
            out_lines.append(f"  - {cid} (NOT FOUND IN cards.json)")

# Check if there are any CAT_ or VLG_ or other non-art cards in "藝術品" key
# Also find all cards that have faction == "藝術品" or faction == "喵喵賊" or faction == "妖怪村莊"
art_faction_cards = [c for c in cards if c.get("faction") == "藝術品" or c.get("race") == "藝術品"]
cat_faction_cards = [c for c in cards if c.get("faction") == "喵喵賊" or c.get("race") == "喵喵賊"]
vlg_faction_cards = [c for c in cards if c.get("faction") == "妖怪村莊" or c.get("race") == "妖怪村莊"]

out_lines.append(f"\nTotal '藝術品' cards in cards.json: {len(art_faction_cards)}")
out_lines.append(f"Total '喵喵賊' cards in cards.json: {len(cat_faction_cards)}")
out_lines.append(f"Total '妖怪村莊' cards in cards.json: {len(vlg_faction_cards)}")

# Check neutral cards
neutral_cards = [c for c in cards if c.get("faction") == "中立" or c.get("race") == "中立" or c.get("deck") == "中立"]
out_lines.append(f"Total '中立' cards in cards.json: {len(neutral_cards)}")

out_path = BASE / "scratch_deck_check.txt"
with open(out_path, "w", encoding="utf-8") as f:
    f.write("\n".join(out_lines))

print("Check finished, output written to scratch_deck_check.txt")
