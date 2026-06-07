import json
from pathlib import Path

BASE = Path("C:/Users/a2132/Documents/星靈王/XingLingWang_v7_fixed")
cards_file = BASE / "data" / "cards.json"

with open(cards_file, "r", encoding="utf-8") as f:
    cards = json.load(f)

for c in cards:
    if c.get("id") == "SSSR-VLG-0002":
        print(json.dumps(c, ensure_ascii=False, indent=2))
