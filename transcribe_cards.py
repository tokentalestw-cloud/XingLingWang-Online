import os
import json
import time
import shutil
from pathlib import Path
from PIL import Image
import google.generativeai as genai

# 配置與路徑
BASE = Path(__file__).parent
DATA_DIR = BASE / "data"
STATIC_IMAGES_DIR = BASE / "static" / "card_images"
RAW_IMAGES_DIR = Path("C:/Users/a2132/Downloads/星靈王圖片")

# API 金鑰旋轉清單 (多個備用免費層 Key 避免單一 Key 每日配額耗盡)
API_KEYS = [
    "AIzaSyANot9FjnrY6qk6wULIvsej4Vwo4LKXeRA",
    "AIzaSyDWqHCzWI5708NEjJj1AiOh-a3LjF_WETs"
]
current_key_idx = 0

def configure_next_key():
    global current_key_idx
    key = API_KEYS[current_key_idx]
    genai.configure(api_key=key)
    print(f"  [API Key] Switched to Key {current_key_idx+1}: {key[:10]}...")
    current_key_idx = (current_key_idx + 1) % len(API_KEYS)

# 初始配置第一個 Key
configure_next_key()
model = genai.GenerativeModel('gemini-flash-latest')

# 確保目錄存在
DATA_DIR.mkdir(parents=True, exist_ok=True)
STATIC_IMAGES_DIR.mkdir(parents=True, exist_ok=True)

# 載入現有資料庫
cards_file = DATA_DIR / "cards.json"
cards_db = []
processed_files = set()

if cards_file.exists():
    try:
        cards_db = json.loads(cards_file.read_text(encoding="utf-8"))
        for c in cards_db:
            orig = c.get("original_file")
            if orig:
                processed_files.add(orig.replace("\\", "/").strip())
        print(f"Current DB has {len(cards_db)} cards, with {len(processed_files)} mapped photos.")
    except Exception as e:
        print("Failed to read cards.json, starting fresh:", e)
        cards_db = []

# 掃描 Downloads 待處理檔案
subdirs = ["中立單位", "藝術品", "喵喵賊", "妖怪村莊", "獸人"]
raw_files = []
for sub in subdirs:
    subpath = RAW_IMAGES_DIR / sub
    if subpath.exists():
        for f in sorted(os.listdir(subpath)):
            if f.lower().endswith(('.jpg', '.jpeg', '.png')):
                rel_path = f"{sub}/{f}"
                # 即使啟動時已載入，迴圈中仍會即時檢查最新磁碟狀態
                raw_files.append((sub, f, rel_path, subpath / f))

print(f"Scan complete. Raw photos to process: {len(raw_files)} files.")

# 視覺 OCR 提示詞
ocr_prompt = """
你是一個專門辨識卡牌遊戲《星靈王》的 AI 助手。請分析這張卡牌照片，並以 JSON 格式精確提取以下資訊。
請嚴格遵循以下 JSON 欄位格式，並且只輸出 JSON 內容（不可包含 Markdown code blocks 如 ```json，只需純 JSON 內容）：

{
  "id": "卡牌右下角英文+數字編碼。請務必標準化格式：喵喵賊設為 CAT_XXX (底線, 三位數如 CAT_003)；妖怪村莊設為 VLG_XXX (底線, 三位數如 VLG_012)；藝術品設為 ART-XXXX (橫槓, 四位數如 ART-0059)；中立單位設為 NEU-XXXX (橫槓, 四位數如 NEU-0001)；獸人設為 ORC_XXX (底線, 三位數如 ORC_001)。請精確辨識字體，例如 ART-0059、CAT_0003、VLG_012 或 ORC_001。",
  "name": "卡牌中央的中文名稱。",
  "type": "如果是怪獸、單位則為 'unit'；如果是魔法、場地或消耗法則為 'magic'。",
  "attack": "卡牌左上方刀劍符號上的數字。如果該位置顯示的是盾牌圖案，則此欄位必須精確填寫字串 '盾' (盾牌代表無攻擊力且具備免疫破壞特權，不可寫 0)。如果是魔法卡，則填寫 0。",
  "score": "卡牌底端星星符號內的分數（整數，通常為 0-10）。如果是魔法卡，通常為 0。",
  "tribute": "卡牌右上角紅色星星內標註的數字。代表需要多少祭品（整數，通常為 0-10）。如果是魔法卡或右上角無紅色星星/無標註數字，則填寫 0。",
  "keywords": "只提取卡牌下方效果說明框中『特別加粗』標示的中文關鍵字列表（例如：['偷襲', '阻擋', '貫穿', '亡語', '綁架']等）。請仔細分析效果說明字型，只把粗體呈現的詞彙加入此陣列中。如果沒有加粗的關鍵字，請填寫 []。",
  "effect_text": "卡牌下方說明框內的所有中文效果文字。請一字不差地完整抄錄下來，不要做任何省略或修改。",
  "is_extra_deck": "布林值。如果卡牌中央名稱左邊有黃色星星，代表它不會進入一般主牌組，而是會進入額外牌組，此欄位設為 true；否則設為 false。",
  "extra_deck_limit": "整數。如果 is_extra_deck 為 true，請填入黃色星星內的數字限制張數（通常為 1-5）；如果為 false，則填寫 0。",
  "art_subtype": "特定類型（即卡牌右下角印製的字樣）。如果是怪獸/單位卡（type為'unit'），此欄位為其右下角的種族字樣（例如：'人型'、'神族'、'非人型'、'植物'等）；如果是魔法卡（type為'magic'），此欄位為其右下角標註的魔法類型（例如：'消耗'、'永久'、'裝備'、'場地'等）。若卡片無此字樣或模糊，請填空字串 ''。"
}
"""

def call_gemini_with_retry(img, rel_path):
    global model
    backoff = 10
    attempts_with_same_key = 0
    while True:
        try:
            # 使用 JSON 模式強制輸出 JSON
            response = model.generate_content(
                [ocr_prompt, img],
                generation_config={"response_mime_type": "application/json"}
            )
            text = response.text.strip()
            data = json.loads(text)
            return data
        except Exception as e:
            err_msg = str(e)
            if "429" in err_msg or "Quota" in err_msg or "ResourceExhausted" in err_msg:
                print(f"  [429 Quota] API limit hit for current key. Attempting key rotation...")
                configure_next_key()
                model = genai.GenerativeModel('gemini-flash-latest')
                attempts_with_same_key += 1
                if attempts_with_same_key >= len(API_KEYS):
                    print(f"  [429 Quota] All keys exhausted. Waiting {backoff} seconds...")
                    time.sleep(backoff)
                    backoff = min(backoff * 2, 60)
                    attempts_with_same_key = 0
            else:
                print(f"  [Error] Failed to process {rel_path}: {err_msg}")
                # 非 Quota 類錯誤重試 3 次，若持續出錯則返回 None 跳過
                time.sleep(2)
                return None

# 執行辨識循環
success_count = 0
fail_count = 0

for idx, (subdir, filename, rel_path, full_path) in enumerate(raw_files, 1):
    # 【關鍵修復】每次開始處理前，重新讀取磁碟上的最新 cards.json 狀態
    # 這樣可以即時感知到使用者在網頁後台手動編輯/保存的卡牌，避免覆寫手動編輯的資料
    latest_db = []
    if cards_file.exists():
        try:
            latest_db = json.loads(cards_file.read_text(encoding="utf-8"))
        except Exception as e:
            print("  [Warning] Error loading cards.json from disk, fallback to memory copy:", e)
            latest_db = list(cards_db)
    
    # 建立目前已被辨識或編輯過的原始圖片集合
    current_processed = set()
    for c in latest_db:
        orig = c.get("original_file")
        if orig:
            current_processed.add(orig.replace("\\", "/").strip())
            
    # 如果使用者剛剛已經手動編輯或程式已經辨識過此卡，則直接跳過，絕不重複處理與覆寫
    if rel_path in current_processed:
        print(f"[{idx}/{len(raw_files)}] Skipping: {rel_path} (Already processed or manually edited)")
        continue

    print(f"[{idx}/{len(raw_files)}] Processing: {rel_path} ...")
    
    try:
        # 開啟圖片，縮小尺寸以節省 Token 並加速處理，隨後保存為優化後的 JPEG
        with Image.open(full_path) as img:
            # 轉換為 RGB 以便保存為 JPEG 格式
            if img.mode != "RGB":
                img = img.convert("RGB")
            
            # 等比例縮小至最大邊長 1024 像素
            max_size = 1024
            if img.width > max_size or img.height > max_size:
                resample_method = getattr(Image, "Resampling", None)
                if resample_method:
                    img.thumbnail((max_size, max_size), resample_method.LANCZOS)
                else:
                    img.thumbnail((max_size, max_size), Image.ANTIALIAS)
                print(f"  [Resize] Downscaled image to {img.width}x{img.height} to save tokens")
            
            # 用於調用 API 的優化圖片
            card_data = call_gemini_with_retry(img, rel_path)
            
            # 如果辨識失敗，跳過
            if not card_data:
                print(f"  [SKIP] Processing failed, skipping card.")
                fail_count += 1
                continue
                
            # 數據清理與格式修正
            c_id = str(card_data.get("id", "")).strip().upper()
            c_name = str(card_data.get("name", "")).strip()
            c_type = str(card_data.get("type", "unit")).strip().lower()
            c_attack = card_data.get("attack", 0)
            c_score = int(card_data.get("score", 0))
            c_tribute = int(card_data.get("tribute", 0))
            c_keywords = card_data.get("keywords", [])
            c_effect = str(card_data.get("effect_text", "")).strip()
            c_is_extra = bool(card_data.get("is_extra_deck", False))
            c_extra_limit = int(card_data.get("extra_deck_limit", 0))
            c_art_subtype = str(card_data.get("art_subtype", "")).strip()
            
            c_id = c_id.replace(" ", "")
            
            # 特殊處理攻擊力欄位
            if isinstance(c_attack, str) and "盾" in c_attack:
                c_attack = "盾"
            elif c_attack == "盾":
                c_attack = "盾"
            else:
                try:
                    c_attack = int(c_attack)
                except:
                    c_attack = "盾"
                    
            # 標準化複製圖片路徑
            clean_id = c_id.lower().replace("-", "_")
            dest_filename = f"{clean_id}.jpeg"
            dest_path = STATIC_IMAGES_DIR / dest_filename
            
            # 以 85 品質保存為壓縮的 JPEG，大幅提升網頁載入速度
            img.save(dest_path, "JPEG", quality=85, optimize=True)
            print(f"  [Save] Optimized card image saved to {dest_filename} ({img.width}x{img.height})")
        
        # 整理卡牌對象
        card_obj = {
            "id": c_id,
            "name": c_name,
            "deck": "中立" if subdir == "中立單位" else subdir,
            "type": c_type,
            "faction": "中立" if subdir == "中立單位" else subdir,
            "race": "中立" if subdir == "中立單位" else subdir,
            "attack": c_attack,
            "score": c_score,
            "tribute": c_tribute,
            "keywords": c_keywords,
            "effect_text": c_effect,
            "image": f"/static/card_images/{dest_filename}",
            "original_file": rel_path,
            "deck_eligible": not c_is_extra,
            "art_subtype": c_art_subtype
        }
        
        if c_is_extra:
            card_obj["extra_deck_limit"] = c_extra_limit
            
        # 【關鍵修復】寫入前重新從磁碟讀取最新的 cards.json，避免在處理期間被覆寫手動資料
        latest_db_on_save = []
        if cards_file.exists():
            try:
                latest_db_on_save = json.loads(cards_file.read_text(encoding="utf-8"))
            except Exception as e:
                latest_db_on_save = list(latest_db)
                
        # 移除同 ID 的舊卡片（確保手動或程式覆寫正常）
        latest_db_on_save = [c for c in latest_db_on_save if c.get("id") != c_id]
        latest_db_on_save.append(card_obj)
        
        # 重新排序並寫入磁碟
        latest_db_on_save.sort(key=lambda x: x.get("id", ""))
        cards_file.write_text(json.dumps(latest_db_on_save, ensure_ascii=False, indent=2), encoding="utf-8")
        
        # 同步更新記憶體快取
        cards_db = latest_db_on_save
        
        print(f"  [OK] Imported: [{c_id}] {c_name} (Race: {subdir}, Subtype: {c_art_subtype}, Atk: {c_attack}, Score: {c_score}, Tribute: {c_tribute}, Extra: {c_is_extra})")
        success_count += 1
        
        # 每次 API 呼叫後小睡 7.5 秒，確保平滑保持在 15 RPM 的免費層上限，杜絕 Rate Limit 錯誤
        time.sleep(7.5)
        
    except Exception as e:
        print(f"  [ERROR] Processing file error: {str(e)}")
        fail_count += 1
        time.sleep(2)

# 重建 decks.json
try:
    decks_file = DATA_DIR / "decks.json"
    decks_data = {}
    
    # 按照種族分組所有可主牌組的卡牌 ID
    for c in cards_db:
        if c.get("deck_eligible", True) is not False:
            deck_name = c.get("deck", "")
            if deck_name:
                if deck_name not in decks_data:
                    decks_data[deck_name] = []
                if c["id"] not in decks_data[deck_name]:
                    decks_data[deck_name].append(c["id"])
                    
    # 排序每個牌組的卡片
    for deck_name in decks_data:
        decks_data[deck_name].sort()
        
    decks_file.write_text(json.dumps(decks_data, ensure_ascii=False, indent=2), encoding="utf-8")
    
    # 同步複製一份 decks.json 到 static/ 目錄
    static_decks = BASE / "static" / "decks.json"
    static_decks.write_text(json.dumps(decks_data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[OK] Rebuilt decks.json successfully. Factions: " + ", ".join(f"{k}: {len(v)} cards" for k, v in decks_data.items()))
except Exception as e:
    print("[ERROR] Rebuild decks.json failed:", e)

print("\n==========================================")
print(f"🎉 Auto-Transcription Completed!")
print(f"  Success: {success_count} cards.")
print(f"  Failed: {fail_count} cards.")
print(f"  Total DB cards: {len(cards_db)} cards.")
print("==========================================")
