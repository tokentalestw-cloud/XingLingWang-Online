import re
from pathlib import Path

BASE = Path("C:/Users/a2132/Documents/星靈王/XingLingWang_v7_fixed")

def search_in_file(filepath):
    print(f"--- Searching in {filepath.name} ---")
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Let's search for "藝術品" or deck loading
    # e.g., how the deck is initialized or filtered
    matches = re.findall(r".{0,40}藝術品.{0,40}", content)
    for m in matches[:10]:
        print("  MATCH:", m.strip())

search_in_file(BASE / "static" / "game_v8.js")
search_in_file(BASE / "static" / "game.js")
