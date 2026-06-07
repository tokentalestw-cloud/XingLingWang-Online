import shutil
from pathlib import Path

# Paths
src_path = Path("C:/Users/a2132/Documents/星靈王/XingLingWang_v7_fixed/static/deck_builder.html")

dest_path1 = Path("C:/Users/a2132/Downloads/XingLingWang_v7_fixed/static/deck_builder.html")
dest_path2 = Path("C:/Users/a2132/Downloads/XingLingWang_v10_dark_board_race_fixed/XingLingWang_v9_quick_start_pretty_board/static/deck_builder.html")

print("Copying fixed deck_builder.html to other project versions...")

if src_path.exists():
    if dest_path1.parent.exists():
        shutil.copy2(src_path, dest_path1)
        print("Successfully copied to XingLingWang_v7_fixed in Downloads.")
    else:
        print("Destination 1 directory does not exist.")

    if dest_path2.parent.exists():
        # Wait, version 10 has no "中立卡牌" tab by default, but let's copy the full version 7 layout.
        # It's better because it includes full neutral filters and fixes everything!
        shutil.copy2(src_path, dest_path2)
        print("Successfully copied to version 10/9 in Downloads.")
    else:
        print("Destination 2 directory does not exist.")
else:
    print("Source path does not exist!")
