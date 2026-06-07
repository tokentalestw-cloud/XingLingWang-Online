import os
import json
from pathlib import Path

cards_file = Path("data/cards.json")
cards_db = []
processed = set()

if cards_file.exists():
    cards_db = json.loads(cards_file.read_text(encoding="utf-8"))
    for c in cards_db:
        orig = c.get("original_file")
        if orig:
            processed.add(orig.replace("\\", "/").strip())

print(f"【星靈王卡牌寫入進度】")
print(f"- 目前資料庫 (cards.json) 已寫入卡牌總數：{len(cards_db)} 張")
print(f"- 已成功辨識並關聯的卡牌原始相片：{len(processed)} 張")
print("------------------------------------------")

RAW_DIR = Path("C:/Users/a2132/Downloads/星靈王圖片")
subdirs = ["中立單位", "藝術品", "喵喵賊", "妖怪村莊"]
total_photos = 0
subdir_counts = {}

for sub in subdirs:
    subpath = RAW_DIR / sub
    if subpath.exists():
        files = [f for f in os.listdir(subpath) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        subdir_counts[sub] = len(files)
        total_photos += len(files)
    else:
        subdir_counts[sub] = 0

print("各資料夾內原始相片數量：")
for sub, count in subdir_counts.items():
    sub_processed = 0
    if subpath.exists():
        sub_processed = sum(1 for f in os.listdir(RAW_DIR / sub) if f.lower().endswith(('.jpg', '.jpeg', '.png')) and f"{sub}/{f}" in processed)
    print(f"  * {sub}：共 {count} 張 (已辨識寫入：{sub_processed} 張，剩餘：{count - sub_processed} 張)")

print("------------------------------------------")
print(f"- 總原始相片數：{total_photos} 張")
print(f"- 累計已辨識進度：{len(processed)} / {total_photos} ({len(processed)/total_photos*100:.1f}%)")
print(f"- 剩餘待處理相片數：{total_photos - len(processed)} 張")
