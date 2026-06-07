import os
import json
import shutil
from pathlib import Path
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional

BASE = Path(__file__).parent
app = FastAPI(title="星靈王 Web Final")

@app.middleware("http")
async def add_no_cache_header(request, call_next):
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response
from fastapi.staticfiles import StaticFiles
from fastapi.responses import Response

class NoCacheStaticFiles(StaticFiles):
    def file_response(self, *args, **kwargs) -> Response:
        response = super().file_response(*args, **kwargs)
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
        return response

app.mount("/static", NoCacheStaticFiles(directory=BASE / "static"), name="static")

# ===== 線上雙人即時房間管理器 =====
class ConnectionManager:
    def __init__(self):
        # room_id -> { "player1": (player_id, ws), "player2": (player_id, ws) }
        self.rooms = {}

    async def connect(self, room_id: str, player_id: str, websocket: WebSocket):
        await websocket.accept()
        if room_id not in self.rooms:
            self.rooms[room_id] = {}
        
        # 決定玩家角色 (Player1 或 Player2)
        if "player1" not in self.rooms[room_id]:
            self.rooms[room_id]["player1"] = (player_id, websocket)
            print(f"Room {room_id}: Player1 ({player_id}) connected.")
            await websocket.send_json({
                "type": "welcome",
                "role": "player1",
                "message": f"成功建立房間 {room_id}！正在等待對手加入..."
            })
        elif "player2" not in self.rooms[room_id] and self.rooms[room_id]["player1"][0] != player_id:
            self.rooms[room_id]["player2"] = (player_id, websocket)
            print(f"Room {room_id}: Player2 ({player_id}) connected.")
            await websocket.send_json({
                "type": "welcome",
                "role": "player2",
                "message": f"成功加入房間 {room_id}！即將開始對決！"
            })
            
            # 通知雙方對手已到齊，準備開戰
            p1_ws = self.rooms[room_id]["player1"][1]
            await p1_ws.send_json({
                "type": "opponent_joined",
                "message": "對手已進入房間，遊戲即將開始！"
            })
            await websocket.send_json({
                "type": "opponent_joined",
                "message": "已連接到房主，遊戲即將開始！"
            })
        else:
            # 房客重複登入或房間已滿
            print(f"Room {room_id}: connection rejected for {player_id}.")
            await websocket.send_json({
                "type": "error",
                "message": "房間已滿或您已在連線中！"
            })
            await websocket.close()

    def disconnect(self, room_id: str, player_id: str):
        if room_id in self.rooms:
            r = self.rooms[room_id]
            if "player1" in r and r["player1"][0] == player_id:
                r.pop("player1", None)
                print(f"Room {room_id}: Player1 disconnected.")
            elif "player2" in r and r["player2"][0] == player_id:
                r.pop("player2", None)
                print(f"Room {room_id}: Player2 disconnected.")
            
            if not r.get("player1") and not r.get("player2"):
                self.rooms.pop(room_id, None)
                print(f"Room {room_id} is now empty and destroyed.")

    async def broadcast_to_other(self, room_id: str, sender_id: str, message: dict):
        if room_id in self.rooms:
            r = self.rooms[room_id]
            target_ws = None
            if "player1" in r and r["player1"][0] == sender_id:
                if "player2" in r:
                    target_ws = r["player2"][1]
            elif "player2" in r and r["player2"][0] == sender_id:
                if "player1" in r:
                    target_ws = r["player1"][1]
            
            if target_ws:
                # 自動翻轉座標，保證兩端視角都是我方在下、對手在上
                flipped_message = self.flip_message_coordinates(message)
                await target_ws.send_json(flipped_message)

    def flip_message_coordinates(self, msg: dict) -> dict:
        flipped = json.loads(json.dumps(msg))
        zone_map = {
            "player_front": "enemy_front",
            "player_back": "enemy_back",
            "enemy_front": "player_front",
            "enemy_back": "player_back"
        }
        
        # 翻轉頂層所有的區域欄位
        for key in ["zone", "fromZone", "toZone", "attZone", "targetZone"]:
            if key in flipped:
                z = flipped[key]
                if z in zone_map:
                    flipped[key] = zone_map[z]
        
        # 翻轉 target 欄位 (可能是物件也可能是字串)
        if "target" in flipped:
            if isinstance(flipped["target"], dict):
                tz = flipped["target"].get("zone")
                if tz in zone_map:
                    flipped["target"]["zone"] = zone_map[tz]
            elif isinstance(flipped["target"], str):
                z = flipped["target"]
                if z in zone_map:
                    flipped["target"] = zone_map[z]

        # 翻轉 tributes 祭品陣列
        if "tributes" in flipped and isinstance(flipped["tributes"], list):
            for t in flipped["tributes"]:
                tz = t.get("zone")
                if tz in zone_map:
                    t["zone"] = zone_map[tz]
                    
        return flipped

manager = ConnectionManager()

@app.websocket("/ws/battle/{room_id}/{player_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, player_id: str):
    await manager.connect(room_id, player_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            await manager.broadcast_to_other(room_id, player_id, message)
    except WebSocketDisconnect:
        manager.disconnect(room_id, player_id)
        if room_id in manager.rooms:
            r = manager.rooms[room_id]
            remaining_ws = None
            if "player1" in r:
                remaining_ws = r["player1"][1]
            elif "player2" in r:
                remaining_ws = r["player2"][1]
            if remaining_ws:
                try:
                    await remaining_ws.send_json({
                        "type": "opponent_disconnected",
                        "message": "對手已離開連線！對決已中斷。"
                    })
                except:
                    pass

# 卡牌表單結構
class CardSaveSchema(BaseModel):
    id: str
    name: str
    deck: str
    type: str
    faction: str
    attack: str # 可以是數字字串，也可以是 "盾"
    score: int
    tribute: int
    keywords: List[str]
    effect_text: str
    is_extra_deck: bool
    extra_deck_limit: int
    art_subtype: Optional[str] = ""
    original_file: str # 例如 "喵喵賊/IMG_5796.JPG"
    mana: int
    usable_phases: List[str]
    trigger_condition: Optional[str] = ""


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "xinglingwang"}

@app.get("/")
def index():
    return FileResponse(BASE / "static" / "index.html")

@app.get("/api/cards")
def get_cards():
    cards_file = BASE / "data" / "cards.json"
    if not cards_file.exists():
        return []
    return json.loads(cards_file.read_text(encoding="utf-8"))

@app.get("/api/decks")
def get_decks():
    decks_file = BASE / "data" / "decks.json"
    if not decks_file.exists():
        return {}
    return json.loads(decks_file.read_text(encoding="utf-8"))

# 1. 取得未處理與已處理的照片列表
@app.get("/api/admin/unprocessed")
def get_unprocessed_images():
    src_dir = Path("C:/Users/a2132/Downloads/星靈王圖片")
    if not src_dir.exists():
        return {"status": "error", "message": f"目錄 {src_dir} 不存在"}

    # 讀取目前資料庫中已經關聯的原始相片檔名，避免重複錄入
    cards_file = BASE / "data" / "cards.json"
    processed_files = set()
    if cards_file.exists():
        try:
            cards = json.loads(cards_file.read_text(encoding="utf-8"))
            for c in cards:
                orig = c.get("original_file")
                if orig:
                    processed_files.add(orig.replace('\\', '/').strip())
        except Exception as e:
            print("讀取 cards.json 失敗:", e)

    subdirs = ["喵喵賊", "妖怪村莊", "藝術品", "中立單位", "獸人"]
    unprocessed = []
    processed = []
    
    for sub in subdirs:
        subpath = src_dir / sub
        if subpath.exists():
            for f in sorted(os.listdir(subpath)):
                if f.lower().endswith(('.jpg', '.jpeg', '.png')):
                    rel_path = f"{sub}/{f}"
                    photo_obj = {
                        "subdir": sub,
                        "filename": f,
                        "rel_path": rel_path,
                        "size": os.path.getsize(subpath / f)
                    }
                    if rel_path not in processed_files:
                        unprocessed.append(photo_obj)
                    else:
                        processed.append(photo_obj)
                        
    return {"status": "success", "unprocessed": unprocessed, "processed": processed}

# 2. 串流下載目錄中的卡牌原始照片
@app.get("/api/admin/image/{subdir}/{filename}")
def get_admin_image(subdir: str, filename: str):
    src_path = Path("C:/Users/a2132/Downloads/星靈王圖片") / subdir / filename
    if not src_path.exists():
        raise HTTPException(status_code=404, detail="圖片檔案不存在")
    return FileResponse(src_path)

# 3. 儲存卡牌、更新 JSON 並複製/重命名照片
@app.post("/api/admin/save")
def save_new_card(card: CardSaveSchema):
    src_path = Path("C:/Users/a2132/Downloads/星靈王圖片") / card.original_file
    if not src_path.exists():
        raise HTTPException(status_code=400, detail=f"找不到原始照片: {card.original_file}")

    # 1. 複製並重命名照片到 static/card_images/
    # 統一將 ID 轉為小寫，底線分隔，如 ART-0001 轉為 art_0001.jpeg，CAT-001 轉為 cat_001.jpeg
    clean_id = card.id.strip().lower().replace("-", "_")
    dest_filename = f"{clean_id}.jpeg"
    dest_dir = BASE / "static" / "card_images"
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest_path = dest_dir / dest_filename

    try:
        shutil.copy2(src_path, dest_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"複製照片失敗: {str(e)}")

    # 2. 讀取並更新 cards.json
    cards_file = BASE / "data" / "cards.json"
    cards_file.parent.mkdir(parents=True, exist_ok=True)
    cards = []
    if cards_file.exists():
        try:
            cards = json.loads(cards_file.read_text(encoding="utf-8"))
        except:
            cards = []

    # 刪除已存在的同 ID 卡牌（覆寫）
    cards = [c for c in cards if c.get("id") != card.id]

    # 建構卡牌對象，若勾選額外牌組，則 deck_eligible = false (不入一般牌組)
    new_card_obj = {
        "id": card.id,
        "name": card.name,
        "deck": "中立" if card.deck == "中立單位" else card.deck,
        "type": card.type,
        "faction": "中立" if card.faction == "中立單位" else card.faction,
        "race": "中立" if card.faction == "中立單位" else card.faction, # 種族與陣營名稱一致
        "attack": card.attack,
        "score": card.score,
        "tribute": card.tribute,
        "keywords": card.keywords,
        "effect_text": card.effect_text,
        "image": f"/static/card_images/{dest_filename}",
        "original_file": card.original_file,
        "deck_eligible": not card.is_extra_deck,
        "mana": card.mana,
        "usable_phases": card.usable_phases,
        "trigger_condition": card.trigger_condition,
    }
    
    if card.is_extra_deck:
        new_card_obj["extra_deck_limit"] = card.extra_deck_limit
    if card.art_subtype:
        new_card_obj["art_subtype"] = card.art_subtype

    cards.append(new_card_obj)
    
    # 依 ID 排序使資料庫整齊
    cards.sort(key=lambda x: x.get("id", ""))
    cards_file.write_text(json.dumps(cards, ensure_ascii=False, indent=2), encoding="utf-8")

    # 3. 讀取並更新 decks.json
    decks_file = BASE / "data" / "decks.json"
    decks_data = {}
    if decks_file.exists():
        try:
            decks_data = json.loads(decks_file.read_text(encoding="utf-8"))
        except:
            decks_data = {}

    # 確保對應的牌組陣列存在
    deck_name = card.deck
    if deck_name not in decks_data:
        decks_data[deck_name] = []

    # 將卡牌 ID 加入陣列（避免重複）
    if card.id not in decks_data[deck_name]:
        decks_data[deck_name].append(card.id)
        decks_data[deck_name].sort()

    # 新增：若更新後的牌組是 "藝術品"，清除不屬於藝術品陣營的卡片 ID
    if deck_name == "藝術品":
        # 建立 id -> card mapping
        cards_file = BASE / "data" / "cards.json"
        card_map = {}
        if cards_file.exists():
            try:
                all_cards = json.loads(cards_file.read_text(encoding="utf-8"))
                for c in all_cards:
                    cid = c.get("id")
                    if cid:
                        card_map[cid] = c
            except:
                pass
        # 保留僅 faction 為 藝術品 的卡片 ID
        valid_ids = []
        for cid in decks_data[deck_name]:
            card_obj = card_map.get(cid)
            if card_obj and card_obj.get("faction") == "藝術品":
                valid_ids.append(cid)
        decks_data[deck_name] = valid_ids

    decks_file.write_text(json.dumps(decks_data, ensure_ascii=False, indent=2), encoding="utf-8")

    # 同步複製一份 decks.json 到 static/ 目錄，讓前端讀取
    static_decks = BASE / "static" / "decks.json"
    static_decks.write_text(json.dumps(decks_data, ensure_ascii=False, indent=2), encoding="utf-8")

    return {"status": "success", "message": f"成功建立卡牌 {card.name}，照片已命名為 {dest_filename}"}

# 牌組儲存表單結構
class DeckSaveSchema(BaseModel):
    deck_name: str
    card_ids: List[str]

# 新增：清理藝術品牌組中不屬於藝術品陣營的卡片 (可手動呼叫)
@app.post("/api/clean_art_deck")
def clean_art_deck():
    decks_file = BASE / "data" / "decks.json"
    if not decks_file.exists():
        raise HTTPException(status_code=404, detail="decks.json not found")
    decks_data = json.loads(decks_file.read_text(encoding="utf-8"))
    if "藝術品" not in decks_data:
        return {"status": "success", "message": "藝術品牌組不存在，無需清理"}
    # 讀取所有卡片資料以驗證陣營
    cards_file = BASE / "data" / "cards.json"
    card_map = {}
    if cards_file.exists():
        all_cards = json.loads(cards_file.read_text(encoding="utf-8"))
        for c in all_cards:
            cid = c.get("id")
            if cid:
                card_map[cid] = c
    # 只保留 faction 為 藝術品 的卡片 ID
    valid_ids = [cid for cid in decks_data["藝術品"] if card_map.get(cid, {}).get("faction") == "藝術品"]
    removed = len(decks_data["藝術品"]) - len(valid_ids)
    decks_data["藝術品"] = valid_ids
    # 寫回檔案
    decks_file.write_text(json.dumps(decks_data, ensure_ascii=False, indent=2), encoding="utf-8")
    # 同步 static
    static_decks = BASE / "static" / "decks.json"
    static_decks.write_text(json.dumps(decks_data, ensure_ascii=False, indent=2), encoding="utf-8")
    return {"status": "success", "message": f"已移除 {removed} 張不屬於藝術品陣營的卡片"}

# 4. 儲存/重構整套牌組
@app.post("/api/decks/save")
def save_deck(data: DeckSaveSchema):
    decks_file = BASE / "data" / "decks.json"
    decks_data = {}
    if decks_file.exists():
        try:
            decks_data = json.loads(decks_file.read_text(encoding="utf-8"))
        except:
            decks_data = {}

    # 嚴格後端陣營排他性過濾
    cards_file = BASE / "data" / "cards.json"
    card_map = {}
    if cards_file.exists():
        try:
            all_cards = json.loads(cards_file.read_text(encoding="utf-8"))
            for c in all_cards:
                cid = c.get("id")
                if cid:
                    card_map[cid] = c
        except:
            pass

    cleaned_ids = []
    deck_name = data.deck_name
    for cid in data.card_ids:
        card_obj = card_map.get(cid)
        if not card_obj:
            continue
        
        id_upper = cid.upper()
        is_valid = True
        
        if deck_name == "藝術品":
            if any(x in id_upper for x in ["CAT", "VLG", "ORC"]) or card_obj.get("faction") in ["喵喵賊", "妖怪村莊", "獸人"]:
                is_valid = False
        elif deck_name == "喵喵賊":
            if any(x in id_upper for x in ["VLG", "ART", "ORC"]) or card_obj.get("faction") in ["藝術品", "妖怪村莊", "獸人"]:
                is_valid = False
        elif deck_name == "妖怪村莊":
            if any(x in id_upper for x in ["CAT", "ART", "ORC"]) or card_obj.get("faction") in ["藝術品", "喵喵賊", "獸人"]:
                is_valid = False
        elif deck_name == "獸人":
            if any(x in id_upper for x in ["CAT", "VLG", "ART"]) or card_obj.get("faction") in ["喵喵賊", "妖怪村莊", "藝術品"]:
                is_valid = False
                
        if is_valid:
            cleaned_ids.append(cid)

    # 覆寫該牌組（已過濾乾淨）
    decks_data[data.deck_name] = cleaned_ids

    try:
        decks_file.write_text(json.dumps(decks_data, ensure_ascii=False, indent=2), encoding="utf-8")
        
        # 同步複製一份 decks.json 到 static/ 目錄，讓前端讀取
        static_decks = BASE / "static" / "decks.json"
        static_decks.write_text(json.dumps(decks_data, ensure_ascii=False, indent=2), encoding="utf-8")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"儲存牌組失敗: {str(e)}")

    return {"status": "success", "message": f"成功儲存 {data.deck_name} 牌組！"}


