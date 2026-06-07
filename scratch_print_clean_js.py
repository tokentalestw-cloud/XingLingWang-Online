from pathlib import Path

BASE = Path("C:/Users/a2132/Documents/星靈王/XingLingWang_v7_fixed")

def print_clean(filepath):
    print(f"=== {filepath.name} ===")
    with open(filepath, "r", encoding="utf-8") as f:
        lines = f.readlines()
    
    for i, line in enumerate(lines):
        if "belongsToDeck" in line or "normDeckName" in line or "c.faction === \"藝術品\"" in line:
            # Print window around it
            start = max(0, i - 10)
            end = min(len(lines), i + 15)
            print(f"Lines {start+1}-{end}:")
            for j in range(start, end):
                print(f"  {j+1}: {lines[j].strip()}")
            print("-" * 40)

print_clean(BASE / "static" / "game_v8.js")
print_clean(BASE / "static" / "game.js")
