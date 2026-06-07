import json
from pathlib import Path

path1 = Path("C:/Users/a2132/Downloads/XingLingWang_v7_fixed/data/decks.json")
path2 = Path("C:/Users/a2132/Downloads/XingLingWang_v10_dark_board_race_fixed/XingLingWang_v9_quick_start_pretty_board/data/decks.json")

def check_deck(filepath):
    if not filepath.exists():
        print(f"{filepath} does not exist.")
        return
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)
    print(f"=== {filepath.parent.parent.name} Decks ===")
    for k, v in data.items():
        print(f"  Deck '{k}' has {len(v)} cards:")
        print(f"    {v[:10]}...")
        # Check if "藝術品" has CAT or VLG
        if k == "藝術品":
            suspects = [cid for cid in v if "CAT" in cid or "VLG" in cid]
            if suspects:
                print(f"    [WARNING] Found suspects in 藝術品: {suspects}")

check_deck(path1)
check_deck(path2)
