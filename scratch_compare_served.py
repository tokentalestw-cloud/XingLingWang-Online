import os
import urllib.request
from pathlib import Path

# Paths
paths = [
    Path("C:/Users/a2132/Documents/星靈王/XingLingWang_v7_fixed/static/deck_builder.html"),
    Path("C:/Users/a2132/Downloads/XingLingWang_v7_fixed/static/deck_builder.html"),
    Path("C:/Users/a2132/Downloads/XingLingWang_v10_dark_board_race_fixed/XingLingWang_v9_quick_start_pretty_board/static/deck_builder.html")
]

# Fetch served html
url = "http://127.0.0.1:8000/static/deck_builder.html"
with urllib.request.urlopen(url) as response:
    served_html = response.read().decode('utf-8')

print("Served HTML length:", len(served_html))

for p in paths:
    if p.exists():
        with open(p, "r", encoding="utf-8") as f:
            local_html = f.read()
        print(f"Local file: {p}")
        print(f"  Size: {len(local_html)}")
        print(f"  Matches served exactly? {served_html == local_html}")
    else:
        print(f"File {p} does not exist!")
