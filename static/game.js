/**
 * 星靈王 Web Final - 核心對戰引擎 (重塑優化版)
 * 整合所有歷史補丁規則：
 * 1. 起手換牌 (Mulligan) 多選換牌系統
 * 2. 戰術佈陣與進攻宣言 (二選一，第1/10回合限制)
 * 3. 戰鬥防守階段 (Defense Phase)：自動 column 1-5 自動對決與動畫
 * 4. 前排優先召喚與攻擊規則、盾牌單位 ("攻擊：盾") 特殊行為
 * 5. 妖怪村莊自動化對手 AI
 * 6. 高級卡牌視覺與單一高效渲染管線
 */

// ===== 遊戲全域狀態 =====
let allCards = [];
let decks = {};
let deck = [];
let hand = [];
let graveyard = [];
let enemyGraveyard = [];

// 戰場配置：每個 row 有 5 個欄位
let field = {
  player_front: [null, null, null, null, null],
  player_back: [null, null, null, null, null],
  enemy_front: [null, null, null, null, null],
  enemy_back: [null, null, null, null, null],
};

let phase = "召喚階段"; // 起手換牌 / 防守階段 / 召喚階段 / 戰術佈陣 / 進攻宣言 / 結束階段
let turn = 1;
const FINAL_TURN = 10;

// 行動次數標記
let normalSummonUsed = false;
let tacticalSummonUsed = false;
let playerBonusScore = 0;
let enemyBonusScore = 0;
let battleLog = [];

// 新增生死倒數計數器與遊戲結束狀態
let countdownActive = false;
let countdownRemaining = 5;
let isGameOverFlag = false;

// 對手行為狀態
window.XLW_ENEMY = {
  deck: [],
  hand: [],
  grave: [],
  deckName: "妖怪村莊",
  running: false
};

// 戰防規則標記
window.XLW_DEFENSE_RULE = {
  playerNeedsDefense: false,  // 對手有進攻宣告，我方回合需防守
  enemyNeedsDefense: false,   // 我方有進攻宣告，對手回合需防守
  resolving: false,
  currentDefender: null
};

// 交互操作暫存
let dragged = null;
let selectedHandForSummon = null;
let selectedHandForSpell = null;
let selectedHandForTribute = null;
let selectedTributes = []; // 獻祭祭品暫存 { zone, idx, key }
let tributeWaitingPosition = false; // 獻祭成功，正等待選擇召喚位置
let selectedTributeCard = null; // 獻祭成功等待召喚的實體卡牌對象參考
let selectedAttacker = null; // { zone, idx } 宣告攻擊的卡

// 起手換牌暫存
let mulliganActive = false;
let selectedMulliganIndexes = new Set();

// 延遲工具
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const $ = (id) => document.getElementById(id);

// 小旅人 Token 定義
const LITTLE_TRAVELER = {
  id: "TOKEN_TRAVELER",
  name: "小旅人",
  deck: "森林",
  type: "unit",
  faction: "旅人",
  attack: 1,
  score: 1,
  tribute: 0,
  keywords: [],
  effect_text: "無任何特殊能力。",
  image: "/static/little_traveler_back.jpeg"
};

// ===== 線上雙人對戰網路狀態 =====
let isMultiplayer = false;
let ws = null;
let room_id = "";
let player_id = "";
let player_role = ""; // player1 (房主) / player2 (房客)
let opponent_joined = false;
let isMyTurn = true; // player1 先手
let opponent_mulligan_done = false;

// ===== 喵喵賊偷襲系統變數 =====
window.XLW_turnSneakCount = 0;
window.XLW_bypassNormalSummonLimit = false;

// ===== 1. 系統初始化 =====
async function init() {
  if (window.location.protocol === "file:") {
    showCORSProtocolWarning();
    return;
  }
  try {
    allCards = await fetch("/api/cards").then(r => r.json());
    decks = await fetch("/api/decks").then(r => r.json());
    
    // 確保所有卡牌圖片有正確預設值
    allCards.forEach(c => {
      if (!c) return;
      if (!c.image) {
        c.image = "/static/card_back.jpeg";
      }
    });

    makeSlots();
    setupGlobalEvents();
    adjustBoardScale();
    window.addEventListener("resize", adjustBoardScale);

    // 解析線上房間參數
    const urlParams = new URLSearchParams(window.location.search);
    room_id = urlParams.get('room');
    player_id = urlParams.get('player');
    player_role = urlParams.get('role');

    if (room_id && player_id && player_role) {
      isMultiplayer = true;
      isMyTurn = (player_role === "player1");
      
      // 連線至 WebSocket 服務
      const ws_protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const ws_url = `${ws_protocol}//${window.location.host}/ws/battle/${room_id}/${player_id}`;
      ws = new WebSocket(ws_url);
      
      setupWebSocketEvents();
    } else {
      newGame();
    }
  } catch (err) {
    console.error("初始化對戰引擎失敗:", err);
  }
}

// 建立線上雙人新局
function newGameMultiplayer() {
  const deckSelect = $("deckSelect");
  const deckName = deckSelect ? deckSelect.value : "喵喵賊";
  // 重置魔法相關全域狀態
  window.XLW_activeFieldCard = null;
  window.XLW_activeEquipmentSpells = [];
  window.XLW_activePermanentSpells = [];
  window.XLW_turnDestroyedUnits = [];
  window.XLW_escapeActive = false;
  // 重置魔法相關全域狀態
  window.XLW_activeFieldCard = null;
  window.XLW_activeEquipmentSpells = [];
  window.XLW_activePermanentSpells = [];
  window.XLW_turnDestroyedUnits = [];
  window.XLW_escapeActive = false;

  deck = [];
  hand = [];
  graveyard = [];
  enemyGraveyard = [];
  battleLog = [];
  playerBonusScore = 0;
  enemyBonusScore = 0;
  
  field.player_front = [null, null, null, null, null];
  field.player_back = [null, null, null, null, null];
  field.enemy_front = [null, null, null, null, null];
  field.enemy_back = [null, null, null, null, null];

  // 載入正確牌組
  const source = strictSourceCards(deckName);
  deck = source.map(c => structuredClone(c));
  shuffle(deck);

  // 重置標記
  turn = 0;
  normalSummonUsed = false;
  tacticalSummonUsed = false;
  selectedAttacker = null;
  clearModes();

  // 開局抽 4 張
  draw(4);

  // 進入 Mulligan (起手換牌) 階段
  mulliganActive = true;
  selectedMulliganIndexes.clear();
  phase = "起手換牌";
  opponent_mulligan_done = false;

  // 初始化對手狀態面板的數據計數器（提供高奢對決即時感）
  window.XLW_ENEMY.deck = new Array(26).fill(null); // 30 - 4
  window.XLW_ENEMY.hand = new Array(4).fill(null);  // 起手 4 張
  window.XLW_ENEMY.grave = [];
  enemyGraveyard = window.XLW_ENEMY.grave;

  setStatus("【線上起手換牌】請點選任意手牌，點擊「確認換牌」送出。等待雙方就緒...");
  
  if (isMultiplayer) {
    ws.send(JSON.stringify({
      action: "sync_deck",
      deck_name: deckName
    }));
  }
  
  render();
}

// 建立 4 排格子
function makeSlots() {
  const mapping = [
    [".enemy-back", "enemy_back", "後排"],
    [".enemy-front", "enemy_front", "前排"],
    [".player-front", "player_front", "前排"],
    [".player-back", "player_back", "後排"],
  ];
  
  for (const [sel, key, label] of mapping) {
    const row = document.querySelector(sel);
    if (!row) continue;
    row.innerHTML = "";
    for (let i = 0; i < 5; i++) {
      const div = document.createElement("div");
      div.className = "slot";
      div.dataset.zone = key.replace('_', '_'); // 統一為 player_front/player_back
      div.dataset.index = i;
      div.innerHTML = `<span class="lane-badge">${i + 1}</span>${label}${i + 1}`;
      row.appendChild(div);
    }
  }
}

// ===== 2. 牌組與種族邏輯 =====
function normDeckName(v) {
  v = String(v || "").trim();
  if (v.includes("藝術")) return "藝術品";
  if (v.includes("妖怪")) return "妖怪村莊";
  if (v.includes("喵") || v.includes("貓")) return "喵喵賊";
  if (v.includes("獸")) return "獸人";
  return ["喵喵賊", "妖怪村莊", "藝術品", "獸人"].includes(v) ? v : "喵喵賊";
}

function belongsToDeck(c, deckName) {
  if (!c) return false;
  deckName = normDeckName(deckName);
  const idUpper = String(c.id || "").toUpperCase();

  // === 嚴格的跨陣營排他性過濾 ===
  if (deckName === "藝術品") {
    if (idUpper.includes("CAT") || idUpper.includes("VLG") || idUpper.includes("ORC")) {
      return false;
    }
  } else if (deckName === "喵喵賊") {
    if (idUpper.includes("VLG") || idUpper.includes("ART") || idUpper.includes("ORC")) {
      return false;
    }
  } else if (deckName === "妖怪村莊") {
    if (idUpper.includes("CAT") || idUpper.includes("ART") || idUpper.includes("ORC")) {
      return false;
    }
  } else if (deckName === "獸人") {
    if (idUpper.includes("CAT") || idUpper.includes("VLG") || idUpper.includes("ART")) {
      return false;
    }
  }

  // 中立卡牌可以屬於任何種族的牌組
  if (c.faction === "中立" || c.race === "中立" || idUpper.startsWith("NEU-") || c.deck === "中立") {
    return true;
  }

  if (deckName === "藝術品") {
    // 卡片左下角的種族字樣為「藝術品」，表示此卡屬於藝術品牌組
    return c.faction === "藝術品" || c.race === "藝術品" || idUpper.startsWith("ART-");
  }
  
  if (deckName === "喵喵賊") {
    // 卡片左下角的種族字樣為「喵喵賊」，表示此卡屬於喵喵賊牌組
    return c.faction === "喵喵賊" || c.race === "喵喵賊" || idUpper.startsWith("CAT_") || idUpper.startsWith("CAT-");
  }
  
  if (deckName === "妖怪村莊") {
    // 卡片左下角的種族字樣為「妖怪村莊」，表示此卡屬於妖怪村莊牌組
    return c.faction === "妖怪村莊" || c.race === "妖怪村莊" || idUpper.startsWith("VLG_") || idUpper.startsWith("VLG-");
  }

  if (deckName === "獸人") {
    // 卡片左下角的種族字樣為「獸人」，表示此卡屬於獸人牌組
    return c.faction === "獸人" || c.race === "獸人" || idUpper.startsWith("ORC_") || idUpper.startsWith("ORC-");
  }

  return c.deck === deckName || c.faction === deckName || c.race === deckName;
}

// 取得該牌組的嚴格卡牌
function strictSourceCards(deckName) {
  deckName = normDeckName(deckName);
  let ids = (decks && Array.isArray(decks[deckName])) ? decks[deckName] : [];
  let source = [];

  if (ids.length) {
    source = ids.map(id => allCards.find(c => c && c.id === id)).filter(Boolean);
  } else {
    source = (allCards || []).filter(c => belongsToDeck(c, deckName));
  }

  // 去除異圖重複並嚴格過濾
  const seen = new Set();
  return source.filter(c => {
    if (!belongsToDeck(c, deckName)) return false;
    if (c.deck_eligible === false) return false;
    if (seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });
}

// ===== 3. 對戰與回合流程 =====
function newGame() {
  // 確保重設為單人對抗 AI 模式，阻斷任何線上同步邏輯與狀態鎖！
  isMultiplayer = false;
  isMyTurn = true; 
  opponent_mulligan_done = true; 
  
  if (ws) {
    try {
      ws.close();
    } catch (e) {}
    ws = null;
  }

  // 清除網址上的 room, player, role 等參數，還原為乾淨的單人遊戲網址！
  if (window.history && window.history.replaceState) {
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  const deckSelect = $("deckSelect");
  const deckName = deckSelect ? deckSelect.value : "喵喵賊";

  deck = [];
  hand = [];
  graveyard = [];
  enemyGraveyard = [];
  battleLog = [];
  playerBonusScore = 0;
  enemyBonusScore = 0;
  
  field.player_front = [null, null, null, null, null];
  field.player_back = [null, null, null, null, null];
  field.enemy_front = [null, null, null, null, null];
  field.enemy_back = [null, null, null, null, null];

  // 載入正確牌組
  const source = strictSourceCards(deckName);
  deck = source.map(c => structuredClone(c));
  shuffle(deck);

  // 妖怪村莊對手初始化
  xlwInitEnemyDeck();

  // 重置標記
  turn = 0;
  normalSummonUsed = false;
  tacticalSummonUsed = false;
  selectedAttacker = null;
  clearModes();

  // 開局抽 4 張
  draw(4);

  // 進入 Mulligan (起手換牌) 階段
  startMulliganPhase();
  logBattle("遊戲開始，進入起手換牌階段。");
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function draw(n) {
  const deckName = $("deckSelect") ? $("deckSelect").value : "喵喵賊";
  for (let i = 0; i < n; i++) {
    if (deck.length === 0) {
      setStatus("牌庫已空。");
      break;
    }
    const c = deck.pop();
    if (c) {
      hand.push(c);
    }
  }
}

// ===== 4. Mulligan (起手換牌) 流程 =====
function startMulliganPhase() {
  mulliganActive = true;
  selectedMulliganIndexes.clear();
  phase = "起手換牌";
  setStatus("【起手換牌】請點選任意張手牌面朝下展示，按「確認換牌」洗回牌庫。不換請直接確認。");
  render();
}

function toggleMulliganCard(idx) {
  if (!mulliganActive) return;
  if (selectedMulliganIndexes.has(idx)) {
    selectedMulliganIndexes.delete(idx);
  } else {
    selectedMulliganIndexes.add(idx);
  }
  setStatus(`【起手換牌】已選 ${selectedMulliganIndexes.size} 張。選好後請點擊下方「確認換牌」。`);
  render();
}

function confirmMulligan() {
  if (!mulliganActive) return;
  
  const idxes = Array.from(selectedMulliganIndexes).sort((a, b) => b - a);
  const replacedCards = [];
  
  // 取出手牌
  idxes.forEach(idx => {
    if (hand[idx]) {
      replacedCards.push(hand[idx]);
      hand.splice(idx, 1);
    }
  });

  // 補抽同樣張數
  draw(replacedCards.length);

  // 洗回牌庫
  replacedCards.forEach(c => deck.push(c));
  shuffle(deck);

  mulliganActive = false;
  selectedMulliganIndexes.clear();
  
  if (isMultiplayer) {
    // 廣播給對手說我們 Mulligan 好了
    ws.send(JSON.stringify({
      action: "mulligan_confirm"
    }));
    setStatus("我方起手換牌已確認，正在等待對手換牌中...");
    checkMulliganCompletion();
  } else {
    // 單人模式
    turn = 1;
    phase = "召喚階段";
    draw(2);
    
    logBattle(`換牌完成（換了 ${replacedCards.length} 張），進入第 1 回合。已自動抽 2 張。`);
    setStatus("起手換牌完成！目前為我方第 1 回合「召喚階段」，起手共 6 張。");
    render();
  }
}

function checkMulliganCompletion() {
  if (opponent_mulligan_done && !mulliganActive) {
    // 雙方都 Mulligan 完畢，遊戲正式開始！
    turn = 1;
    window.XLW_turnSneakCount = 0;
    phase = "召喚階段";
    draw(2);
    logBattle("雙方皆已完成起手換牌！第 1 回合對決正式開始。");
    
    if (player_role === "player1") {
      isMyTurn = true;
      setStatus("對決開始！第 1 回合為我方回合，召喚階段開始。");
    } else {
      isMyTurn = false;
      setStatus("對決開始！第 1 回合為對手回合，等待對手行動...");
    }
    render();
  }
}

// ===== 5. 核心規則判斷 (前排優先、盾牌、空戰線) =====
function xlwFrontlineHasEmpty() {
  return field.player_front.some(u => !u);
}

function xlwIsEnemySummonCard(c) {
  if (!c) return false;
  if (c.id === "ART-0003") return true; 
  const text = c.effect_text || c.effect || "";
  
  // 使用 Unicode 轉義序列以徹底免除 Traditional Chinese (Big5) 瀏覽器解碼混亂
  const hasEnemySummonPhrase = text.includes("\u53ec\u5594\u81f3\u6575\u65b9") || 
                               text.includes("\u53ec\u5594\u5230\u6575\u65b9") || 
                               (text.includes("\u53ec\u5594\u81f3\u6575\u65b9\u5834\u4e0a") && !text.includes("\u53ec\u5594\u81f3\u6575\u65b9\u5834\u4e0a\u6642")) ||
                               (text.includes("\u53ec\u5594\u5230\u6575\u65b9\u5834\u4e0a") && !text.includes("\u53ec\u5594\u5230\u6575\u65b9\u5834\u4e0a\u6642"));
  
  if (hasEnemySummonPhrase && !text.includes("\u7576\u6709\u661f\u9748") && !text.includes("\u6642\uff0c")) {
    return true;
  }
  return false;
}

function xlwCanSummonToZone(zone, card) {
  const c = card;
  const canSummonToEnemy = xlwIsEnemySummonCard(c);

  if (canSummonToEnemy) {
    if (zone === "enemy_front") return true;
    if (zone === "enemy_back") {
      const enemyFrontHasEmpty = field.enemy_front.some(u => !u);
      return !enemyFrontHasEmpty;
    }
    return false;
  }

  if (zone !== "player_front" && zone !== "player_back") return false;
  if (zone === "player_back" && xlwFrontlineHasEmpty()) return false;
  return true;
}

// 盾牌單位判斷 (攻擊值包含「盾」)
window.XLW_isShieldUnit = function(unit) {
  if (!unit) return false;
  const c = unit.card || unit;
  const atkVal = String(c.attack ?? c.atk ?? c.power ?? "").trim();
  const hasBlocker = (c.keywords && (c.keywords.includes("阻擋") || c.keywords.includes("盾牌"))) ||
                      (c.effect_text && (c.effect_text.includes("阻擋") || c.effect_text.includes("盾牌")));
  return (
    atkVal === "盾" ||
    atkVal === "盾牌" ||
    atkVal === "🛡" ||
    atkVal === "🛡️" ||
    atkVal.includes("盾") ||
    atkVal.toLowerCase() === "shield" ||
    hasBlocker
  );
};

// 單位真實攻擊力 (盾牌為 0)
function getUnitAtk(unit, zone, lane) {
  if (!unit) return 0;
  if (window.XLW_isShieldUnit(unit)) return 0;
  const c = unit.card || unit;
  let baseAtk = Number(c.attack ?? c.atk ?? 0);
  baseAtk = Number.isFinite(baseAtk) ? baseAtk : 0;

  // 計算相鄰強化與連動 Buff
  if (zone && lane !== undefined && field[zone]) {
    // 1. 大鵰像 (ART-0002) 相鄰強化：左右邊的單位 +2 攻擊力
    if (lane > 0) {
      const leftUnit = field[zone][lane - 1];
      const leftCard = leftUnit && (leftUnit.card || leftUnit);
      if (leftCard && leftCard.id === "ART-0002") {
        baseAtk += 2;
      }
    }
    if (lane < 4) {
      const rightUnit = field[zone][lane + 1];
      const rightCard = rightUnit && (rightUnit.card || rightUnit);
      if (rightCard && rightCard.id === "ART-0002") {
        baseAtk += 2;
      }
    }

    // 2. 創世老人 (ART-0014) 連動：創世男孩在左邊時 +4 攻擊力
    if (c.id === "ART-0014" && lane > 0) {
      const leftUnit = field[zone][lane - 1];
      const leftCard = leftUnit && (leftUnit.card || leftUnit);
      if (leftCard && leftCard.id === "ART-0013") {
        baseAtk += 4;
      }
    }
  }

  return baseAtk;
}

// 單位星數分數 (加入加成)
function getUnitStars(unit, zone, lane) {
  if (!unit) return 0;
  const c = unit.card || unit;
  let baseStars = Number(c.score ?? c.stars ?? 0) + Number(unit.bonusScore ?? 0);

  if (zone && lane !== undefined && field[zone]) {
    // 創世男孩 (ART-0013) 連動：創世老人在右邊時 +3⭐
    if (c.id === "ART-0013" && lane < 4) {
      const rightUnit = field[zone][lane + 1];
      const rightCard = rightUnit && (rightUnit.card || rightUnit);
      if (rightCard && rightCard.id === "ART-0014") {
        baseStars += 3;
      }
    }
  }

  return baseStars;
}

function unitName(unit) {
  const c = unit && (unit.card || unit);
  return c ? (c.name || "未知單位") : "未知單位";
}

// 同戰線是否有敵方前後排
function enemyLaneHasAny(lane) {
  return !!(field.enemy_front[lane] || field.enemy_back[lane]);
}

// 同戰線前排是否為盾牌
function enemyFrontIsShield(lane) {
  return !!(field.enemy_front[lane] && window.XLW_isShieldUnit(field.enemy_front[lane]));
}

// 我方是否可宣告進攻
function validPlayerAttackLine(zone, lane) {
  const unit = field[zone]?.[lane];
  if (!unit) return false;
  if (unit.tapped) return false; // 橫置狀態不可宣告攻擊
  if (window.XLW_isShieldUnit(unit)) return false; // 盾牌不可宣告攻擊
  if (!enemyLaneHasAny(lane)) return false; // 空戰線不可進攻
  if (enemyFrontIsShield(lane)) return false; // 前排為盾牌不可進攻
  return true;
}

// ===== 6. 召喚與獻祭召喚系統 =====
function clearModes() {
  selectedHandForSummon = null;
  selectedHandForSpell = null;
  selectedHandForTribute = null;
  selectedTributes = [];
  tributeWaitingPosition = false;
  selectedTributeCard = null;
  selectedAttacker = null;
  window.XLW_bypassNormalSummonLimit = false;
  window.XLW_blackCatChoosing = false;
  
  document.querySelectorAll(".slot").forEach(s => {
    s.classList.remove("selected-hand-summon", "tribute-selected", "tribute-target", "xlw-can-attack-unit", "xlw-cannot-attack-unit");
  });
}

// 小旅人按鈕觸發
function triggerLittleTraveler(e) {
  if (e) e.stopPropagation();
  if (isMultiplayer && !isMyTurn) {
    setStatus("對手回合中，請稍候！");
    return;
  }
  const can = (phase === "召喚階段" && !normalSummonUsed) || (phase === "戰術佈陣" && !tacticalSummonUsed);
  if (!can) {
    setStatus("目前階段無法召喚小旅人。");
    return;
  }
  clearModes();
  tributeWaitingPosition = true; // 借用位置等待狀態
  selectedHandForSummon = "TRAVELER";
  setStatus("【小旅人】請點選我方一個空格進行召喚（前排優先）。");
  render();
}

// 魔法卡點擊發動
function castSpell(handIndex) {
  if (isMultiplayer && !isMyTurn) {
    setStatus("對手回合中，請稍候！");
    return;
  }
  const card = hand[handIndex];
  if (!card || card.type !== "magic") return;

  const text = card.effect_text || "";
  
  // 場地魔法卡放到場地區
  if (card.magic_type === "場地" || card.name.includes("場地")) {
    const playerField = $("playerField");
    if (playerField) {
      if (playerField.dataset.card) {
        graveyard.push(JSON.parse(playerField.dataset.card));
      }
      playerField.dataset.card = JSON.stringify(card);
      logBattle(`設置場地魔法：${card.name}`);
    }
  } else {
    // 普通魔法效果
    if (text.includes("抽2張")) {
      draw(2);
      logBattle(`發動魔法 ${card.name}：抽 2 張牌`);
    } else if (text.includes("抽1張")) {
      draw(1);
      logBattle(`發動魔法 ${card.name}：抽 1 張牌`);
    } else if (text.includes("加分") || text.includes("額外分")) {
      playerBonusScore += 1;
      logBattle(`發動魔法 ${card.name}：我方額外加 1 分`);
    } else {
      logBattle(`發動魔法 ${card.name}`);
    }
    graveyard.push(card);
  }

  if (isMultiplayer) {
    ws.send(JSON.stringify({
      action: "cast_spell",
      card: card
    }));
  }

  hand.splice(handIndex, 1);
  clearModes();
  render();
}

// 點手牌的獻祭怪進入獻祭模式
function startTributeSummon(handIndex) {
  const card = hand[handIndex];
  if (!card || card.type !== "unit" || Number(card.tribute || 0) <= 0) return;

  if (phase === "戰術佈陣") {
    setStatus("戰術佈陣階段只能召喚免祭品單位或小旅人，不能進行獻祭召喚。");
    return;
  }

  if (normalSummonUsed) {
    setStatus("本回合召喚階段已進行過普通/獻祭召喚。");
    return;
  }

  clearModes();
  selectedHandForTribute = handIndex;
  selectedTributeCard = card;
  logDebug(`【獻祭啟動】卡牌: ${card.name}, 需要祭品數: ${card.tribute}, 手牌位置: ${handIndex}`);
  setStatus(`【獻祭召喚】${card.name} 需要 ${card.tribute} 個祭品。請點選我方場上單位作為祭品。`);
  render();
}

function toggleTributeSelection(zone, idx) {
  if (selectedHandForTribute === null) return;
  if (!zone.startsWith("player_")) return;

  const unit = field[zone][idx];
  if (!unit) return;

  // 不可獻祭判定 (支持關鍵字「不可獻祭」與「禁錮」)
  const c = unit.card || unit;
  const isUntributable = (c.keywords && (c.keywords.includes("不可獻祭") || c.keywords.includes("無法被獻祭") || c.keywords.includes("禁錮"))) ||
                         (c.effect_text && (c.effect_text.includes("不得被獻祭") || c.effect_text.includes("不可獻祭") || c.effect_text.includes("無法被獻祭") || c.effect_text.includes("不能被獻祭") || c.effect_text.includes("禁錮")));
  if (isUntributable) {
    setStatus(`【獻祭失敗】${c.name} 處於禁錮或不可獻祭狀態！`);
    return;
  }

  const key = `${zone}:${idx}`;
  const existIdx = selectedTributes.findIndex(t => t.key === key);

  if (existIdx >= 0) {
    selectedTributes.splice(existIdx, 1);
    const card = hand[selectedHandForTribute];
    logDebug(`【祭品取消】取消選取: ${key}, 當前祭品數: ${selectedTributes.length}/${card.tribute}`);
  } else {
    const card = hand[selectedHandForTribute];
    if (selectedTributes.length >= card.tribute) {
      setStatus(`祭品已選滿（${card.tribute}個）。若要更換，請先點擊已選祭品取消。`);
      return;
    }
    selectedTributes.push({ zone, idx, key });
    logDebug(`【祭品追加】追加選取: ${key}, 當前祭品數: ${selectedTributes.length}/${card.tribute}`);
  }

  const card = hand[selectedHandForTribute];
  if (selectedTributes.length >= card.tribute) {
    setStatus(`祭品已選滿。請點擊「確認獻祭」按鈕。`);
  } else {
    setStatus(`【獻祭召喚】已選祭品 ${selectedTributes.length}/${card.tribute}。`);
  }
  render();
}

function confirmTribute() {
  if (selectedHandForTribute === null) return;
  const card = hand[selectedHandForTribute];
  if (selectedTributes.length < card.tribute) {
    setStatus("祭品數量不足！");
    return;
  }

  // 祭品送墓
  selectedTributes.forEach(t => {
    const unit = field[t.zone][t.idx];
    if (unit) {
      graveyard.push(unit.card);
      field[t.zone][t.idx] = null;
    }
  });

  const targetIdx = selectedHandForTribute;
  tributeWaitingPosition = true;
  selectedHandForSummon = targetIdx;
  selectedHandForTribute = null;
  selectedTributes = [];

  logDebug(`【獻祭完成】祭品送墓！tributeWaitingPosition = true`);
  logDebug(`【等待放置】待召喚卡牌: ${card.name}, 尋得手牌 Index: ${selectedHandForSummon}`);
  console.log("[XLW Tribute Debug] confirmTribute executed successfully!");
  console.log("[XLW Tribute Debug] tributeWaitingPosition =", tributeWaitingPosition);
  console.log("[XLW Tribute Debug] selectedHandForSummon =", selectedHandForSummon);
  console.log("[XLW Tribute Debug] selectedTributeCard =", selectedTributeCard);

  setStatus(`祭品已送入墓地！請點選我方空格召喚 ${card.name}（前排優先）。`);
  render();
}

// 實行手牌召喚/小旅人召喚至格子上
async function performSummonToSlot(zone, idx) {
  logDebug(`【點選放置】目標格子: ${zone}:${idx + 1}`);
  // 獻祭召喚與位置放置之強大對象參考匹配與 Fallback 恢復機制
  if (tributeWaitingPosition && selectedTributeCard !== null) {
    const idxInHand = hand.indexOf(selectedTributeCard);
    if (idxInHand >= 0) {
      selectedHandForSummon = idxInHand;
      logDebug(`【對象匹配】實體匹配成功！手牌 Index: ${selectedHandForSummon}`);
    } else {
      const matchIdx = hand.findIndex(c => c && c.id === selectedTributeCard.id);
      if (matchIdx >= 0) {
        selectedHandForSummon = matchIdx;
        logDebug(`【對象匹配】ID 匹配成功！手牌 Index: ${selectedHandForSummon}`);
      } else {
        const foundIdx = hand.findIndex(c => c && Number(c.tribute || 0) > 0);
        if (foundIdx >= 0) {
          selectedHandForSummon = foundIdx;
          logDebug(`【對象匹配】兜底 Fallback 匹配成功！手牌 Index: ${selectedHandForSummon}`);
        } else {
          logDebug("【放置終止】祭品已送墓，但在手牌中找不到任何獻祭卡牌！");
          return;
        }
      }
    }
  }

  if (selectedHandForSummon === null) {
    logDebug("【放置終止】當前 selectedHandForSummon 為 null！");
    return;
  }

  if (isMultiplayer && !isMyTurn) {
    setStatus("對手回合中，請稍候！");
    logDebug("【放置終止】非我方回合！");
    return;
  }

  const canSum = window.XLW_bypassNormalSummonLimit ||
                 (phase === "召喚階段" && !normalSummonUsed) || 
                 (phase === "戰術佈陣" && !tacticalSummonUsed);
  if (!canSum) {
    setStatus("本回合已進行過單位召喚。");
    logDebug(`【放置終止】本回合召喚次數已用盡！(normalSummonUsed: ${normalSummonUsed})`);
    clearModes();
    render();
    return;
  }

  let selectedCard = null;
  if (selectedHandForSummon === "TRAVELER") {
    selectedCard = LITTLE_TRAVELER;
  } else {
    selectedCard = hand[selectedHandForSummon];
  }

  if (!selectedCard) return;

  const canSummonToEnemy = xlwIsEnemySummonCard(selectedCard);

  if (zone.startsWith("enemy_")) {
    if (!canSummonToEnemy) {
      setStatus("此卡不能召喚到敵方場地上。");
      return;
    }
  } else if (!zone.startsWith("player_")) {
    setStatus("只能召喚到場地區。");
    return;
  }

  if (field[zone][idx]) {
    setStatus("該格子已有單位！");
    return;
  }

  // 嚴格前排優先限制
  if (!xlwCanSummonToZone(zone, selectedCard)) {
    logDebug(`【放置失敗】前排仍有空位，必須優先召喚至前排！目標: ${zone}:${idx + 1}`);
    if (zone.startsWith("enemy_")) {
      setStatus("敵方前排仍有空位時，必須優先召喚至對手前排！");
    } else {
      setStatus("前排仍有空位時，必須優先召喚至前排！");
    }
    return;
  }

  if (selectedHandForSummon === "TRAVELER") {
    // 召喚小旅人
    field[zone][idx] = {
      card: structuredClone(LITTLE_TRAVELER),
      tapped: false,
      attacking: false,
      target: null,
      summonedTurn: turn,
      summonedZone: zone
    };
    if (phase === "召喚階段") normalSummonUsed = true;
    if (phase === "戰術佈陣") tacticalSummonUsed = true;
    logBattle(`從森林召喚小旅人到 ${zone.includes("front") ? "前排" : "後排"}${idx + 1}`);
    // 播放 3D 森林出走與飛越軌跡動畫
    playTravelerSummonAnimation("#playerForest", zone, idx);
  } else {
    // 召喚手牌
    const isTributeSummon = (tributeWaitingPosition && selectedTributeCard !== null);
    let handIndex = Number(selectedHandForSummon);
    
    // 如果原 index 異常，且處於獻祭召喚狀態，則採用 Fallback 尋找機制
    if (handIndex < 0 || handIndex >= hand.length || !hand[handIndex]) {
      if (tributeWaitingPosition) {
        const foundIdx = hand.findIndex(c => c && Number(c.tribute || 0) > 0);
        if (foundIdx >= 0) {
          handIndex = foundIdx;
        }
      }
    }

    if (handIndex < 0 || !hand[handIndex]) {
      setStatus("找不到手牌中的卡牌，請點選重新召喚。");
      clearModes();
      render();
      return;
    }

    const card = hand[handIndex];
    field[zone][idx] = {
      card: structuredClone(card),
      tapped: false,
      attacking: false,
      target: null,
      summonedTurn: turn,
      summonedZone: zone
    };
    hand.splice(handIndex, 1);
    if (window.XLW_bypassNormalSummonLimit) {
      window.XLW_bypassNormalSummonLimit = false;
      logDebug(`【連動額外召喚】成功！不佔用本回合常規召喚額度。`);
      
      // 公關姐姐喵效果：若場上有我方公關姐姐喵，且是額外特殊召喚，則我方獎勵 +1 分
      const isPlayer = zone.startsWith("player_");
      const checkZonePrefix = isPlayer ? "player_" : "enemy_";
      const prOnField = field[checkZonePrefix + "front"].concat(field[checkZonePrefix + "back"]).some(u => {
        return u && u.card && (u.card.id === "CAT_005" || u.card.id === "R-CAT-0041" || u.card.name.includes("\u516c\u95dc\u59d0\u59d0\u55b5"));
      });
      if (prOnField) {
        if (isPlayer) {
          playerBonusScore += 1;
          logBattle(`✨ \u516c\u95dc\u59d0\u59d0\u55b5 \u6548\u679c\uff1a\u6211\u65b9\u9032\u884c\u984d\u5916\u53ec\u55b5\u55ae位\uff0c\u6211\u65b9\u984d\u5916\u734e勵 +1 \u5206\uff01`);
        } else {
          enemyBonusScore += 1;
          logBattle(`✨ \u516c\u95dc\u59d0姐\u55b5 \u6548\u679c\uff1a\u5c0d\u624b\u9032\u884c額外\u53ec\u55b5\u55ae位\uff0c\u5c0d\u624b\u984d外\u734e勵 +1 \u5206\uff01`);
        }
        renderScore();
      }
    } else {
      if (phase === "召喚階段") normalSummonUsed = true;
      if (phase === "戰術佈陣") tacticalSummonUsed = true;
    }
    logDebug(`【召喚成功】卡牌: ${card.name} 已成功放置於 ${zone}:${idx + 1}！手牌扣減成功。`);
    logBattle(`召喚單位 ${card.name} 到 ${zone.includes("front") ? "前排" : "後排"}${idx + 1}`);
    
    // \u7acb\u5373 / \u55b5\u5973\u6548\u679c\u767c\u52d5\uff1a\u82e5\u55ae\u4f4d\u5beb\u6709\u300c\u7acb\u5373\u300d\u6216\u540d\u5b57\u70ba\u300c\u55b5\u5973\u300d\uff0c\u7acb\u523b\u6253\u51fa\u4e00\u5f35\u514d\u796d\u54c1\u5077\u8972\u55ae\u4f4d\uff08\u7279\u6b8a\u53ec\u55b5\uff0c\u4e0d\u4f54\u7528\u53ec\u55b5\u984d\u5ea6\uff09
    const isImmediate = card.keywords?.includes("\u7acb\u5373") || card.effect_text?.includes("\u7acb\u5373") || card.name?.includes("\u7acb\u5373") || card.name?.includes("\u55b5\u5973");
    if (isImmediate && zone.startsWith("player_")) {
      const validImmediateSummons = hand.filter(c => {
        return c && (c.type === "unit" || c.type === "怪獸" || c.type === "\u602a\u737d") &&
               (c.keywords?.includes("\u5077\u8972") || c.effect_text?.includes("\u5077\u8972")) &&
               Number(c.tribute || 0) <= 0;
      });

      if (validImmediateSummons.length > 0) {
        logDebug(`\u3010\u7acb\u5373\u9023\u52d5\u3011\u55b5\u5973/\u7acb\u5373\u55ae\u4f4d\u5165\u5834\uff01\u5075\u6e2c\u5230\u624b\u724c\u53ef\u9023\u52d5\u5077\u8972\u55ae\u4f4d\uff1a${validImmediateSummons.map(c => c.name).join(", ")}`);
        setTimeout(async () => {
          const userConfirmed = await showXLWConfirm(
            "\u3010\u7acb\u5373\u9023\u52d5\u3011\u55b5\u5973/\u7acb\u5373\u6548\u679c\u767c\u52d5\uff01",
            "\u662f\u5426\u7acb\u523b\u5f9e\u624b\u724c\u7279\u6b8a\u53ec\u55b5\u4e00\u5f35\u514d\u796d\u54c1\u4e1a\u5177\u300c\u5077\u8972\u300d\u7279\u6027\u7684\u55ae\u4f4d\uff1f\uff08\u4e0d\u4e54\u7528\u5e38\u898f\u6216\u6230\u885b\u53ec\u55b5\u984d\u5ea6\uff09"
          );
          if (userConfirmed) {
            const extraCard = validImmediateSummons[0];
            window.XLW_bypassNormalSummonLimit = true;
            selectedHandForSummon = hand.indexOf(extraCard);
            setStatus("\u3010\u7acb\u5373\u9023\u52d5\u3011\u8acb\u9ede\u9078\u6211\u65b9\u4e00\u500b\u7a7a\u683c\u9032\u884c\u7279\u6b8a\u53ec\u55b5\uff01");
            render();
          }
        }, 300);
      }
    }
    
    if (isTributeSummon) {
      playTributeSummonAnimation(zone, idx);
    }
  }

  if (isMultiplayer) {
    ws.send(JSON.stringify({
      action: "summon",
      card: field[zone][idx].card,
      zone: zone,
      idx: idx
    }));
  }

  if (window.XLW_summonPlacementResolve) {
    const resolve = window.XLW_summonPlacementResolve;
    window.XLW_summonPlacementResolve = null;
    resolve();
  }

  clearModes();
  render();
}

// ===== 7. 戰術佈陣與進攻宣言二選一 =====
function changeActionPhase(targetPhase) {
  if (turn === 1 || turn === FINAL_TURN || (countdownActive && countdownRemaining === 1)) {
    setStatus("第一回合、最後回合或生死倒數最後一回合不能進行戰術佈陣或進攻宣言。");
    return;
  }
  if (phase !== "召喚階段") return;

  clearModes();
  phase = targetPhase;
  
  if (phase === "戰術佈陣") {
    setStatus("進入「戰術佈陣」：可拖曳我方單位調整位置，或額外進行1次免祭品/小旅人召喚。");
  } else if (phase === "進攻宣言") {
    setStatus("\u9032\u5165\u300c\u9032\u653b\u5ba3\u8a00\u300d\uff1a\u7cfb\u7d71\u6b63\u5728\u70ba\u6211\u65b9\u55ae\u4f4d\u81ea\u52d5\u5ba3\u544a\u9032\u653b\uff08\u8207\u5c0d\u624b\u9032\u653b\u6a21\u5f0f\u4e00\u81f4\uff09\u002e\u002e\u002e");
    xlwAutoDeclarePlayerAttacks();
  }
  render();
}

// 戰術移動單位
function moveFieldUnit(fromZone, fromIdx, toZone, toIdx) {
  if (phase !== "戰術佈陣") return;
  if (isMultiplayer && !isMyTurn) {
    setStatus("對手回合中，請稍候！");
    return;
  }
  if (!toZone.startsWith("player_")) return;
  if (field[toZone][toIdx]) return;

  const unit = field[fromZone][fromIdx];
  if (!unit) return;

  // 不可移動判定 (支持關鍵字「不可移動」與「禁錮」)
  const c = unit.card || unit;
  const isUnmovable = (c.keywords && (c.keywords.includes("不可移動") || c.keywords.includes("禁錮"))) ||
                      (c.effect_text && (c.effect_text.includes("不得被移動") || c.effect_text.includes("不可移動") || c.effect_text.includes("無法移動") || c.effect_text.includes("禁錮")));
  if (isUnmovable) {
    setStatus(`【移動失敗】${c.name} 處於禁錮或無法移動狀態！`);
    return;
  }

  // 戰術佈陣精細限制
  const isSummonedThisTurn = (unit.summonedTurn === turn);
  if (isSummonedThisTurn) {
    // 前後（垂直）移動限制
    if (fromZone !== toZone) {
      if (unit.summonedZone === "player_front" && toZone === "player_back") {
        setStatus("本回合召喚在前排的單位不能移動至後排。");
        return;
      }
    }
  }

  field[toZone][toIdx] = unit;
  field[fromZone][fromIdx] = null;
  logBattle(`戰術移動：將 ${unitName(unit)} 移動至 ${toZone === "player_front" ? "前排" : "後排"}${toIdx + 1}`);
  
  if (isMultiplayer) {
    ws.send(JSON.stringify({
      action: "move_unit",
      fromZone: fromZone,
      fromIdx: fromIdx,
      toZone: toZone,
      toIdx: toIdx
    }));
  }

  render();
}

// ===== 8. 進攻宣言宣告系統 =====
function selectPlayerAttacker(zone, idx) {
  if (phase !== "進攻宣言") return;
  const unit = field[zone][idx];
  if (!unit) return;

  if (unit.tapped) {
    setStatus("橫置狀態的單位無法進行攻擊宣告。");
    return;
  }

  if (!validPlayerAttackLine(zone, idx)) {
    if (window.XLW_isShieldUnit(unit)) setStatus("盾牌單位不能宣告進攻。");
    else if (!enemyLaneHasAny(idx)) setStatus("同戰線敵方前後排皆空，不能進攻該戰線。");
    else if (enemyFrontIsShield(idx)) setStatus("敵方同戰線前排為盾牌單位，受其阻擋無法進攻。");
    return;
  }

  selectedAttacker = { zone, idx };
  setStatus(`已選攻擊者：${unitName(unit)}。請點選同戰線敵方目標宣告攻擊。`);
  render();
}

function selectPlayerTarget(zone, idx) {
  if (phase !== "進攻宣言" || !selectedAttacker) return;
  if (isMultiplayer && !isMyTurn) {
    setStatus("對手回合中，請稍候！");
    return;
  }
  if (!zone.startsWith("enemy_")) return;

  const defender = field[zone][idx];
  if (!defender) return;

  const attacker = field[selectedAttacker.zone][selectedAttacker.idx];
  if (!attacker) return;

  // 星星戰線（同欄位）限制
  if (selectedAttacker.idx !== idx) {
    setStatus("只能指定相同星星戰線的目標！");
    return;
  }

  // 前排優先攻擊限制 (遠程單位可以繞過前排直接攻擊後排)
  const hasRanged = (attacker.card && (
    (attacker.card.keywords && attacker.card.keywords.includes("遠程")) ||
    (attacker.card.effect_text && attacker.card.effect_text.includes("遠程"))
  ));
  if (field.enemy_front[idx] && zone === "enemy_back" && !hasRanged) {
    setStatus("敵方同戰線前排仍有單位，必須優先攻擊前排！（除非是遠程單位）");
    return;
  }

  // 盾牌不能被進攻
  if (window.XLW_isShieldUnit(defender)) {
    setStatus("盾牌單位在場時無法被直接選為進攻目標。");
    return;
  }

  // 宣告成功：標記攻擊與目標，橫置卡牌，但【不立即結算】，等到對手回合防守判定
  attacker.attacking = true;
  attacker.target = { zone, idx };
  attacker.tapped = true;
  window.XLW_DEFENSE_RULE.enemyNeedsDefense = true;

  logBattle(`我方進攻宣言：星星戰線${idx + 1}，${unitName(attacker)} 指向對手 ${unitName(defender)}`);
  setStatus(`進攻成功！${unitName(attacker)} 將在對手回合的「防守階段」依序對決結算。`);

  if (isMultiplayer) {
    ws.send(JSON.stringify({
      action: "attack_declare",
      attZone: selectedAttacker.zone,
      attIdx: selectedAttacker.idx,
      targetZone: zone,
      targetIdx: idx
    }));
  }

  selectedAttacker = null;
  render();
}

// ===== 自動宣告與切換進攻宣言 =====
function xlwAutoDeclarePlayerAttacks() {
  let playerAttackCount = 0;
  for (let i = 0; i < 5; i++) {
    const playerAttacker = field.player_front[i] || field.player_back[i];
    if (!playerAttacker || playerAttacker.tapped) continue;
    if (window.XLW_isShieldUnit(playerAttacker)) continue;

    const hasRanged = (playerAttacker.card && (
      (playerAttacker.card.keywords && playerAttacker.card.keywords.includes("\u9060\u7a0b")) ||
      (playerAttacker.card.effect_text && playerAttacker.card.effect_text.includes("\u9060\u7a0b"))
    ));

    let targetZone = null;
    if (hasRanged) {
      targetZone = field.enemy_back[i] ? "enemy_back" : (field.enemy_front[i] ? "enemy_front" : null);
    } else {
      targetZone = field.enemy_front[i] ? "enemy_front" : (field.enemy_back[i] ? "enemy_back" : null);
    }

    if (!targetZone) continue;

    const targetDefender = field[targetZone][i];
    if (window.XLW_isShieldUnit(targetDefender)) continue;

    playerAttacker.attacking = true;
    playerAttacker.target = { zone: targetZone, idx: i };
    playerAttacker.tapped = true;
    playerAttackCount++;

    logBattle(`\u6211\u65b9\u9032\u653b\u5ba3\u8a00\u0028\u9060\u7a0b\u003a${hasRanged}\u0029\uff1a\u661f\u661f\u6230\u7dda${i + 1}\uff0c${unitName(playerAttacker)}\u0020\u6307\u5411\u5c0d\u624b\u0020${unitName(targetDefender)}`);

    if (isMultiplayer) {
      const actualZone = field.player_front[i] === playerAttacker ? "player_front" : "player_back";
      ws.send(JSON.stringify({
        action: "attack_declare",
        attZone: actualZone,
        attIdx: i,
        targetZone: targetZone,
        targetIdx: i
      }));
    }
  }

  window.XLW_DEFENSE_RULE.enemyNeedsDefense = playerAttackCount > 0;
  setStatus(`\u6211\u65b9\u5df2\u81ea\u52d5\u5ba3\u544a\u9032\u653b\u0020${playerAttackCount}\u0020\u500b\u55ae\u4f4d\uff01\u5c07\u5728\u5c0d\u624b\u56de\u5408\u7684\u300c\u9632\u5b88\u968e\u6bb5\u300d\u4f9d\u5e8f\u5c0d\u6c7a\u7d50\u7b97\u3002`);
  render();
}

function xlwTogglePlayerAttack(zone, idx) {
  const unit = field[zone][idx];
  if (!unit) return;

  if (unit.attacking) {
    unit.attacking = false;
    unit.target = null;
    unit.tapped = false;
    logBattle(`\u6211\u65b9\u53d6\u6d88\u9032\u653b\u5ba3\u8a00\uff1a\u661f\u661f\u6230\u7dda${idx + 1}\uff0c${unitName(unit)}`);
    
    if (isMultiplayer) {
      ws.send(JSON.stringify({
        action: "attack_cancel",
        attZone: zone,
        attIdx: idx
      }));
    }
  } else {
    if (unit.tapped) {
      setStatus("\u6a6b\u7f6e\u72c0\u614b\u7684\u55ae\u4f4d\u7121\u6cd5\u9032\u884c\u653b\u64ca\u5ba3\u8a00\u3002");
      return;
    }
    if (window.XLW_isShieldUnit(unit)) {
      setStatus("\u963b\u64cb\u55ae\u4f4d\u7121\u6cd5\u9032\u884c\u653b\u64ca\u5ba3\u8a00\u3002");
      return;
    }

    const hasRanged = (unit.card && (
      (unit.card.keywords && unit.card.keywords.includes("\u9060\u7a0b")) ||
      (unit.card.effect_text && unit.card.effect_text.includes("\u9060\u7a0b"))
    ));

    let targetZone = null;
    if (hasRanged) {
      targetZone = field.enemy_back[idx] ? "enemy_back" : (field.enemy_front[idx] ? "enemy_front" : null);
    } else {
      targetZone = field.enemy_front[idx] ? "enemy_front" : (field.enemy_back[idx] ? "enemy_back" : null);
    }

    if (!targetZone) {
      setStatus("\u6575\u65b9\u540c\u661f\u661f\u6230\u7dda\u524d\u5f8c\u6392\u7686\u7121\u55ae\u4f4d\uff0c\u7121\u6cd5\u9032\u884c\u9032\u653b\u3002");
      return;
    }

    const targetDefender = field[targetZone][idx];
    if (targetDefender && window.XLW_isShieldUnit(targetDefender)) {
      setStatus("\u963b\u64cb\u55ae\u4f4d\u7121\u6cd5\u9032\u884c\u653b\u64ca\u5ba3\u8a00\u3002");
      return;
    }

    unit.attacking = true;
    unit.target = { zone: targetZone, idx: idx };
    unit.tapped = true;
    
    logBattle(`\u6211\u65b9\u9032\u653b\u5ba3\u8a00\uff1a\u661f\u661f\u6230\u7dda${idx + 1}\uff0c${unitName(unit)}\u0020\u6307\u5411\u5c0d\u624b`);

    if (isMultiplayer) {
      ws.send(JSON.stringify({
        action: "attack_declare",
        attZone: zone,
        attIdx: idx,
        targetZone: targetZone,
        targetIdx: idx
      }));
    }
  }

  let playerAttackCount = 0;
  ["player_front", "player_back"].forEach(z => {
    field[z].forEach(u => {
      if (u && u.attacking) playerAttackCount++;
    });
  });
  window.XLW_DEFENSE_RULE.enemyNeedsDefense = playerAttackCount > 0;
  render();
}

function xlwExecuteBlackCatDestruction(zone, idx) {
  const targetUnit = field[zone][idx];
  if (!targetUnit) return;

  logBattle(`\u9ed1\u55b5\u7279\u6b8a\u6548\u679c\uff1a\u7834\u58bad\u5c0d\u624b\u0020${unitName(targetUnit)}\u0021`); // 黑喵特殊效果：破壞對手 [單位]！
  
  // 送墓
  window.XLW_ENEMY.graveyard.push(targetUnit.card);
  field[zone][idx] = null;
  
  // 播放破壞特效
  playTributeSummonAnimation(zone, idx);

  // 聯網同步
  if (isMultiplayer) {
    ws.send(JSON.stringify({
      action: "destroy_unit",
      zone: zone,
      idx: idx
    }));
  }

  window.XLW_blackCatChoosing = false;
  setStatus("\u9ed1\u55b5\u7834\u58bad\u6548\u679c\u5df2\u57f7\u884c\u3002"); // 黑喵破壞效果已執行。
  render();
}

// ===== 9. 防守階段 (Defense Phase) 自動對決結算 =====
async function xlwResolvePlayerDefensePhase() {
  if (window.XLW_DEFENSE_RULE.resolving) return;
  window.XLW_DEFENSE_RULE.resolving = true;

  try {
    logBattle("\u2014\u2014 \u6211\u65b9\u9632\u5b88\u968e\u6bb5\u958b\u59cb (\u4f9d\u6230\u7dda 1 -> 5 \u81ea\u52d5\u7d50\u7b97) \u2014\u2014");
    setStatus("\u6211\u65b9\u9632\u5b88\u5224\u5b9a\uff0c\u7cfb\u7d71\u6b63\u5728\u4f9d\u5e8f\u7d50\u7b97\u5404\u661f\u661f\u6230\u7dda\u6230\u9b25...");

    for (let lane = 0; lane < 5; lane++) {
      let attacker = null;
      let attZone = "";
      if (field.enemy_front[lane] && field.enemy_front[lane].attacking) {
        attacker = field.enemy_front[lane];
        attZone = "enemy_front";
      } else if (field.enemy_back[lane] && field.enemy_back[lane].attacking) {
        attacker = field.enemy_back[lane];
        attZone = "enemy_back";
      }

      if (!attacker) {
        setStatus(`\u9632\u5b88\u5224\u5b9a\uff1a\u661f\u661f\u6230\u7dda ${lane + 1} \u5c0d\u624b\u7121\u9032\u653b\u3002`);
        await sleep(650);
        continue;
      }

      // 規則九第4條：進攻單位將以其前方第一個敵方單位為進攻目標，並將其視為防守單位
      let defZone = "";
      let defender = null;
      if (field.player_front[lane]) {
        defender = field.player_front[lane];
        defZone = "player_front";
      } else if (field.player_back[lane]) {
        defender = field.player_back[lane];
        defZone = "player_back";
      }

      // 規則九第2條：前方沒有敵方單位時，轉正該單位 (untap)
      if (!defender) {
        attacker.attacking = false;
        attacker.target = null;
        attacker.tapped = false; // 轉正該單位！
        logBattle(`\u9632\u5b88\u5224\u5b9a\uff1a\u661f\u661f\u6230\u7dda ${lane + 1} \u524d\u65b9\u7121\u6211\u65b9\u55ae\u4f4d\uff0c\u5c0d\u624b\u9032\u653b\u55ae\u4f4d\u5df2\u8f49\u6b63\u3002`);
        setStatus(`\u9632\u5b88\u5224\u5b9a\uff1a\u661f\u661f\u6230\u7dda ${lane + 1} \u524d\u65b9\u7121\u6211\u65b9\u55ae\u4f4d\uff0c\u5c0d\u624b\u9032\u653b\u55ae\u4f4d\u5df2\u8f49\u6b63\u3002`);
        render();
        await sleep(650);
        continue;
      }

      // 動態更新進攻目標為前方第一個敵方單位
      attacker.target = { zone: defZone, idx: lane };

      if (window.XLW_isShieldUnit(defender)) {
        attacker.tapped = true;
        attacker.attacking = false;
        attacker.target = null;
        setStatus(`\u9632\u5b88\u5224\u5b9a\uff1a\u661f\u661f\u6230\u7dda ${lane + 1} \u88ab\u76fe\u724c\u963b\u64cb\u3002`);
        render();
        await sleep(650);
        continue;
      }

      setStatus(`\u5c0d\u6c7a\uff01\u661f\u661f\u6230\u7dda ${lane + 1}\uff1a${unitName(attacker)} \u2694 ${unitName(defender)}`);
      flashBattle(attZone, lane, defZone, lane);
      await sleep(650);

      const resultMsg = await resolveUnitCombat(attZone, lane, defZone, lane, "player");
      logBattle(`\u9632\u5b88\u5c0d\u6c7a\uff1a${resultMsg}`);
      setStatus(`\u6230\u7dda ${lane + 1} \u7d50\u679c\uff1a${resultMsg}`);
      render();
      await sleep(750);
    }
  } catch (err) {
    console.error("我方防守對決出錯:", err);
    logBattle(`我方防守出錯: ${err.message}`);
  } finally {
    window.XLW_DEFENSE_RULE.playerNeedsDefense = false;
    window.XLW_DEFENSE_RULE.resolving = false;
    
    phase = "召喚階段";
    logBattle("\u2014\u2014 \u6211\u65b9\u9632\u5b88\u968e\u6bb5\u7d50\u675f\uff0c\u9032\u5165\u53ec\u559a\u968e\u6bb5 \u2014\u2014");
    setStatus("\u9632\u5b88\u968e\u6bb5\u7d50\u7b97\u5b8c\u6210\uff01\u5df2\u9032\u5165\u300c\u53ec\u559a\u968e\u6bb5\u300d\uff0c\u60a8\u53ef\u4ee5\u958b\u59cb\u53ec\u559a\u55ae\u4f4d\u3002");
    render();
  }
}

async function xlwResolveEnemyDefensePhaseSafe() {
  if (window.XLW_DEFENSE_RULE.resolving) return;
  window.XLW_DEFENSE_RULE.resolving = true;

  try {
    logBattle("\u2014\u2014 \u5c0d\u624b\u9632\u5b88\u968e\u6bb5\u958b\u59cb (AI \u81ea\u52d5\u5c0d\u6c7a) \u2014\u2014");
    setStatus("\u5c0d\u624b\u9632\u5b88\u5224\u5b9a\u4e2d\uff0c\u7cfb\u7d71\u6b63\u5728\u4f9d\u5e8f\u7d50\u7b97\u6211\u65b9\u5404\u661f\u661f\u6230\u7dda\u9032\u653b...");

    for (let lane = 0; lane < 5; lane++) {
      let attacker = null;
      let attZone = "";
      if (field.player_front[lane] && field.player_front[lane].attacking) {
        attacker = field.player_front[lane];
        attZone = "player_front";
      } else if (field.player_back[lane] && field.player_back[lane].attacking) {
        attacker = field.player_back[lane];
        attZone = "player_back";
      }

      if (!attacker) {
        setStatus(`\u9632\u5b88\u5224\u5b9a\uff1a\u661f\u661f\u6230\u7dda ${lane + 1} \u6211\u65b9\u7121\u9032\u653b\u3002`);
        await sleep(650);
        continue;
      }

      // 規則九第4條：進攻單位將以其前方第一個敵方單位為進攻目標，並將其視為防守單位
      let defZone = "";
      let defender = null;
      if (field.enemy_front[lane]) {
        defender = field.enemy_front[lane];
        defZone = "enemy_front";
      } else if (field.enemy_back[lane]) {
        defender = field.enemy_back[lane];
        defZone = "enemy_back";
      }

      // 規則九第2條：前方沒有敵方單位時，轉正該單位 (untap)
      if (!defender) {
        attacker.attacking = false;
        attacker.target = null;
        attacker.tapped = false; // 轉正該單位！
        logBattle(`\u9632\u5b88\u5224\u5b9a\uff1a\u661f\u661f\u6230\u7dda ${lane + 1} \u524d\u65b9\u7121\u5c0d\u624b\u55ae\u4f4d\uff0c\u6211\u65b9\u9032\u653b\u55ae\u4f4d\u5df2\u8f49\u6b63\u3002`);
        setStatus(`\u9632\u5b88\u5224\u5b9a\uff1a\u661f\u661f\u6230\u7dda ${lane + 1} \u524d\u65b9\u7121\u5c0d\u624b\u55ae\u4f4d\uff0c\u6211\u65b9\u9032\u653b\u55ae\u4f4d\u5df2\u8f49\u6b63\u3002`);
        render();
        await sleep(650);
        continue;
      }

      // 動態更新進攻目標為前方第一個敵方單位
      attacker.target = { zone: defZone, idx: lane };

      if (window.XLW_isShieldUnit(defender)) {
        attacker.tapped = true;
        attacker.attacking = false;
        attacker.target = null;
        setStatus(`\u9632\u5b88\u5224\u5b9a\uff1a\u661f\u661f\u6230\u7dda ${lane + 1} \u88ab\u5c0d\u624b\u76fe\u724c\u963b\u64cb\u3002`);
        render();
        await sleep(650);
        continue;
      }

      setStatus(`\u5c0d\u6c7a\uff01\u661f\u661f\u6230\u7dda ${lane + 1}\uff1a\u6211\u65b9 ${unitName(attacker)} \u2694 \u5c0d\u624b ${unitName(defender)}`);
      flashBattle(attZone, lane, defZone, lane);
      await sleep(650);

      const resultMsg = await resolveUnitCombat(attZone, lane, defZone, lane, "enemy");
      logBattle(`\u6211\u65b9\u9032\u653b\uff1a${resultMsg}`);
      render();
      await sleep(650);
    }
  } catch (err) {
    console.error("對手防守對決出錯:", err);
    logBattle(`\u5c0d\u624b\u9632\u5b88\u51fa\u932f: ${err.message}`);
  } finally {
    window.XLW_DEFENSE_RULE.enemyNeedsDefense = false;
    window.XLW_DEFENSE_RULE.resolving = false;
    logBattle("\u2014\u2014 \u5c0d\u624b\u9632\u5b88\u968e\u6bb5\u7d50\u675f \u2014\u2014");
  }
}

// 創建浮動戰鬥攻擊力數字比拼動畫
function showCombatNumberAnimation(attZone, attIdx, defZone, defIdx, atkPower, defPower) {
  return new Promise((resolve) => {
    const attEl = document.querySelector(`[data-zone="${attZone}"][data-index="${attIdx}"]`);
    const defEl = document.querySelector(`[data-zone="${defZone}"][data-index="${defIdx}"]`);
    
    if (!attEl || !defEl) {
      resolve();
      return;
    }
    
    // 取得攻防格子的精準位置並計算中心點
    const attRect = attEl.getBoundingClientRect();
    const defRect = defEl.getBoundingClientRect();
    
    const midX = (attRect.left + defRect.left) / 2 + (attRect.width / 2) + window.scrollX;
    const midY = (attRect.top + defRect.top) / 2 + (attRect.height / 2) + window.scrollY;
    
    const overlay = document.createElement("div");
    overlay.className = "xlw-combat-overlay";
    overlay.style.left = `${midX}px`;
    overlay.style.top = `${midY}px`;
    
    // 標準化數值字串
    const displayAtk = (typeof atkPower === "number" || !isNaN(atkPower)) ? atkPower : atkPower;
    const displayDef = (typeof defPower === "number" || !isNaN(defPower)) ? defPower : defPower;
    
    overlay.innerHTML = `
      <div class="combat-overlay-atk">${displayAtk}</div>
      <div class="combat-overlay-vs">⚔ VS ⚔</div>
      <div class="combat-overlay-def">${displayDef}</div>
    `;
    
    document.body.appendChild(overlay);
    
    // 播放 1200 毫秒後自動移除並 resolve
    setTimeout(() => {
      overlay.remove();
      resolve();
    }, 1200);
  });
}

// 實行戰鬥判定 (防守方死亡送入對應墓地，包含卡牌碎裂火花動畫，全面支持 遠程、劇毒、偷襲、阻擋、貫穿 結算)
async function resolveUnitCombat(attZone, attIdx, defZone, defIdx, defenderOwner) {
  const attacker = field[attZone]?.[attIdx];
  const defender = field[defZone]?.[defIdx];

  if (!attacker || !defender) return "戰鬥目標不存在";

  const atkPower = getUnitAtk(attacker, attZone, attIdx);
  const defPower = getUnitAtk(defender, defZone, defIdx);

  // 1. 播放攻擊力對決 VS 動畫 (等待完畢)
  await showCombatNumberAnimation(attZone, attIdx, defZone, defIdx, atkPower, defPower);

  // 2. 阻擋/盾牌防禦判定
  if (window.XLW_isShieldUnit(attacker)) {
    attacker.attacking = false;
    attacker.target = null;
    return `${unitName(attacker)} 是阻擋/盾牌單位，無法發起有效進攻`;
  }
  if (window.XLW_isShieldUnit(defender)) {
    attacker.tapped = true;
    attacker.attacking = false;
    attacker.target = null;
    return `${unitName(defender)} 是阻擋/盾牌單位，本次進攻被成功阻擋`;
  }

  // 3. 讀取雙方遠程、劇毒、偷襲特性
  const attackerCard = attacker.card || attacker;
  const defenderCard = defender.card || defender;

  const attackerHasRanged = (attackerCard.keywords && attackerCard.keywords.includes("\u9060\u7a0b")) ||
                             (attackerCard.effect_text && attackerCard.effect_text.includes("\u9060\u7a0b"));
  const attackerHasPoison = (attackerCard.keywords && attackerCard.keywords.includes("\u5287\u6bd2")) ||
                             (attackerCard.effect_text && attackerCard.effect_text.includes("\u5287\u6bd2"));
  const attackerHasSneak = (attackerCard.keywords && attackerCard.keywords.includes("\u5077\u8972")) ||
                            (attackerCard.effect_text && attackerCard.effect_text.includes("\u5077\u8972"));

  const defenderHasPoison = (defenderCard.keywords && defenderCard.keywords.includes("\u5287\u6bd2")) ||
                             (defenderCard.effect_text && defenderCard.effect_text.includes("\u5287\u6bd2"));

  // 4. 計算雙方是否應當被擊破 (引入 Ranged 免疫反擊與 Poisonous 必殺邏輯)
  let attackerShouldDie = false;
  let defenderShouldDie = false;

  // 基礎戰鬥數值對決 (相同攻擊力時攻擊方獲勝，防守方被破壞)
  if (atkPower >= defPower) {
    defenderShouldDie = true;
    attackerShouldDie = false;
  } else {
    attackerShouldDie = true;
    defenderShouldDie = false;
  }

  // 遠程 (Ranged) 效果應用：進攻時不會因為戰鬥失敗而被破壞（免除反擊傷害）
  if (attackerHasRanged) {
    attackerShouldDie = false;
  }

  // 劇毒 (Poisonous) 效果應用：與此單位戰鬥的單位將直接被破壞（對遠程單位的進攻無效）
  if (attackerHasPoison) {
    defenderShouldDie = true; // 劇毒進攻必殺
  }
  if (defenderHasPoison) {
    if (!attackerHasRanged) {
      attackerShouldDie = true; // 劇毒防守觸殺 (遠程進攻免疫此效果)
    }
  }

  // 5. 執行擊破與死鬥送墓
  let piercingMsg = "";
  const destPromise = [];
  if (attackerShouldDie) {
    destPromise.push(destroyUnit(attZone, attIdx, defenderOwner === "player" ? "enemy" : "player"));
  }
  if (defenderShouldDie) {
    destPromise.push(destroyUnit(defZone, defIdx, defenderOwner));

    // 貫穿 (Piercing) 效果判定：擊破前排後繼續進攻後排
    const hasPiercing = (attackerCard.keywords && attackerCard.keywords.includes("貫穿")) ||
                        (attackerCard.effect_text && attackerCard.effect_text.includes("貫穿"));
    if (hasPiercing && defZone.includes("front")) {
      const backZone = defZone.replace("front", "back");
      const backUnit = field[backZone]?.[defIdx];
      if (backUnit) {
        destPromise.push(destroyUnit(backZone, defIdx, defenderOwner));
        piercingMsg = `，並貫穿擊破了後排的 ${unitName(backUnit)}`;
      }
    }
  }

  if (destPromise.length > 0) {
    await Promise.all(destPromise);
  }

  // 6. 偷襲 (Sneak Attack) 效果應用：成功進攻並存活後，將此卡收回手牌
  let sneakMsg = "";
  if (attackerHasSneak && !attackerShouldDie && defenderShouldDie) {
    if (defenderOwner === "player") {
      // 攻擊方是對手
      if (window.XLW_ENEMY.hand) {
        window.XLW_ENEMY.hand.push(attacker.card);
        field[attZone][attIdx] = null;
        sneakMsg = `，且對手觸發「偷襲」成功收回其手牌`;
      }
    } else {
      // 攻擊方是我方：彈出奢華確認框讓玩家自行選擇是否回手！
      const userWantsRecall = await showXLWConfirm(
        "🥷 偵測到【偷襲】契機！",
        `我方單位 <b>${unitName(attacker)}</b> 進攻成功！<br>是否啟動「偷襲」將其收回手牌並觸發偷襲成功連動效果？`,
        "確認回手 (啟動偷襲)",
        "留在場上 (放棄回手)"
      );
      
      if (userWantsRecall) {
        hand.push(attacker.card);
        field[attZone][attIdx] = null;
        sneakMsg = `，且觸發「偷襲」成功收回我方手牌`;
        
        // 核心：觸發「偷襲成功」的一系列效果！
        await triggerSneakAttackSuccessEffects(attacker.card);
      } else {
        // 放棄回手，留在場上並處於疲勞狀態
        attacker.tapped = true;
        attacker.attacking = false;
        attacker.target = null;
        sneakMsg = `，我方選擇放棄「偷襲」回手，使該單位留在場上處於疲勞狀態`;
      }
    }
  } else {
    // 未回手之存活單位進行橫置 Tap 鎖定
    if (!attackerShouldDie) {
      attacker.tapped = true;
      attacker.attacking = false;
      attacker.target = null;
    }
  }

  // 7. 回傳詳細戰鬥日誌
  let combatMsg = "";
  if (attackerShouldDie && defenderShouldDie) {
    combatMsg = `${unitName(attacker)} 與 ${unitName(defender)} 實力相當或劇毒互噬，同歸於盡`;
  } else if (attackerShouldDie) {
    combatMsg = `${unitName(attacker)} 攻擊失敗，自身被破壞，而 ${unitName(defender)} 完好無損`;
  } else if (defenderShouldDie) {
    combatMsg = `${unitName(attacker)} 成功擊破了 ${unitName(defender)}${piercingMsg}${sneakMsg}`;
  } else {
    combatMsg = `${unitName(attacker)} 進攻了 ${unitName(defender)}，雙方皆安然無恙${sneakMsg}`;
  }

  return combatMsg;
}

// 帶有碎裂和火花粒子特效的卡牌銷毀函數
async function destroyUnit(zone, idx, owner) {
  const unit = field[zone][idx];
  if (!unit) return;

  // 1. 尋找格子並播放 CSS 碎裂與紅光粒子動畫
  const slot = document.querySelector(`[data-zone="${zone}"][data-index="${idx}"]`);
  if (slot) {
    const cardEl = slot.querySelector(".card");
    if (cardEl) {
      cardEl.classList.add("xlw-card-shatter");
      
      const sparks = document.createElement("div");
      sparks.className = "shatter-sparks";
      slot.appendChild(sparks);
    }
  }

  // 2. 等待動畫完整播放結束 (0.8 秒)
  await sleep(800);

  // 3. 清理火花層
  if (slot) {
    const sparks = slot.querySelector(".shatter-sparks");
    if (sparks) sparks.remove();
  }

  // 4. 送墓並真正清空格子
  if (owner === "player") {
    graveyard.push(unit.card);
  } else {
    window.XLW_ENEMY.grave.push(unit.card);
    enemyGraveyard = window.XLW_ENEMY.grave;
  }
  field[zone][idx] = null;
}

function flashBattle(attZone, attIdx, defZone, defIdx) {
  const attEl = document.querySelector(`[data-zone="${attZone}"][data-index="${attIdx}"]`);
  const defEl = document.querySelector(`[data-zone="${defZone}"][data-index="${defIdx}"]`);
  if (attEl) {
    if (attZone.startsWith("player_")) {
      attEl.classList.add("xlw-my-attack-flash");
    } else {
      attEl.classList.add("xlw-enemy-attack-flash");
    }
  }
  if (defEl) defEl.classList.add("xlw-hit-flash");
  
  setTimeout(() => {
    if (attEl) {
      attEl.classList.remove("xlw-my-attack-flash");
      attEl.classList.remove("xlw-enemy-attack-flash");
    }
    if (defEl) defEl.classList.remove("xlw-hit-flash");
  }, 600);
}

// ===== 10. 對手 AI 行動與回合接管 =====
function xlwInitEnemyDeck() {
  const baseCards = strictSourceCards("妖怪村莊");
  window.XLW_ENEMY.deck = baseCards.map(c => structuredClone(c));
  shuffle(window.XLW_ENEMY.deck);
  window.XLW_ENEMY.hand = [];
  window.XLW_ENEMY.grave = [];
  enemyGraveyard = window.XLW_ENEMY.grave;

  // 對手起手抽 4
  for (let i = 0; i < 4; i++) {
    if (window.XLW_ENEMY.deck.length) {
      window.XLW_ENEMY.hand.push(window.XLW_ENEMY.deck.pop());
    }
  }
}

async function runEnemyTurn() {
  if (window.XLW_ENEMY.running) return;
  window.XLW_ENEMY.running = true;

  try {
    logBattle("—— 對手回合開始 ——");
    setStatus("對手回合：妖怪村莊正在進行整備抽牌...");
    await sleep(700);

    // 1. 整備階段：對手單位轉正
    untapEnemy();
    
    // 2. 對手抽 2 張
    let drawn = 0;
    for (let i = 0; i < 2; i++) {
      if (window.XLW_ENEMY.deck.length) {
        window.XLW_ENEMY.hand.push(window.XLW_ENEMY.deck.pop());
        drawn++;
      }
    }
    logBattle(`對手整備：抽了 ${drawn} 張卡片，單位全體轉正。`);
    render();
    await sleep(700);

    // 3. 對手防守階段 (若我方上回合有宣告攻擊，且我方場上仍有進攻單位 - 規則九第5條)
    let playerHasAttackers = false;
    ["player_front", "player_back"].forEach(zone => {
      field[zone].forEach(u => {
        if (u && u.attacking) playerHasAttackers = true;
      });
    });

    if (window.XLW_DEFENSE_RULE.enemyNeedsDefense && playerHasAttackers) {
      phase = "\u9632\u5b88\u968e\u6bb5";
      setStatus("\u5c0d\u624b\u56de\u5408\uff1a\u6b63\u5728\u81ea\u52d5\u7d50\u7b97\u5c0d\u624b\u9632\u5b88\u968e\u6bb5\u5c0d\u6c7a...");
      render();
      await xlwResolveEnemyDefensePhaseSafe();
    } else {
      window.XLW_DEFENSE_RULE.enemyNeedsDefense = false;
      logBattle("\u5c0d\u624b\u9632\u5b88\u968e\u6bb5\u958b\u59cb\u524d\uff0c\u56e0\u6211\u65b9\u7121\u9032\u653b\u55ae\u4f4d\uff0c\u8df3\u904e\u9632\u5b88\u968e\u6bb5\u3002");
    }

    // 4. 對手召喚階段 (召喚一個免祭品單位，優先前排)
    phase = "\u53ec\u559a\u968e\u6bb5";
    render();
    const emptyFrontIdx = field.enemy_front.findIndex(u => !u);
    const emptyBackIdx = field.enemy_back.findIndex(u => !u);
    // 加強 AI 的免祭品召喚判定，以支援小於等於 0 祭品的單位（如 -2 祭品等特規卡牌）
    const summonHandIdx = window.XLW_ENEMY.hand.findIndex(c =>
      c && (c.type === "unit" || c.type === "單位") && Number(c.tribute || 0) <= 0
    );

    if (summonHandIdx >= 0 && (emptyFrontIdx >= 0 || emptyBackIdx >= 0)) {
      const card = window.XLW_ENEMY.hand[summonHandIdx];
      window.XLW_ENEMY.hand.splice(summonHandIdx, 1);
      
      const destZone = emptyFrontIdx >= 0 ? "enemy_front" : "enemy_back";
      const destIdx = emptyFrontIdx >= 0 ? emptyFrontIdx : emptyBackIdx;
      
      field[destZone][destIdx] = {
        card: card,
        tapped: false,
        attacking: false,
        target: null,
        summonedTurn: turn,
        summonedZone: destZone
      };
      logBattle(`對手召喚：${card.name} 到對手${destZone === "enemy_front" ? "前排" : "後排"}${destIdx + 1}`);
    } else {
      logBattle("對手本回合沒有進行召喚。");
    }
    render();
    await sleep(800);

    // 5. 對手進攻宣言階段 (只與對面同戰線有我方的非盾牌列進行宣告進攻，全面支持對手 AI 遠程進攻)
    // 5. 對手進攻宣言與戰術佈陣階段
    if (countdownActive && countdownRemaining === 1) {
      logBattle("對手最後一回合：只能進行召喚階段，跳過戰術佈陣與進攻宣言。");
      window.XLW_DEFENSE_RULE.playerNeedsDefense = false;
      render();
      await sleep(800);
    } else {
      phase = "\u9032\u653b\u5ba3\u8a00";
      render();
      let opponentAttackCount = 0;
      for (let i = 0; i < 5; i++) {
        const enemyAttacker = field.enemy_front[i] || field.enemy_back[i];
        if (!enemyAttacker || enemyAttacker.tapped) continue;
        if (window.XLW_isShieldUnit(enemyAttacker)) continue;

        const hasRanged = (enemyAttacker.card && (
          (enemyAttacker.card.keywords && enemyAttacker.card.keywords.includes("遠程")) ||
          (enemyAttacker.card.effect_text && enemyAttacker.card.effect_text.includes("遠程"))
        ));

        // 決定進攻目標：如果是遠程單位，可以直接越過前排進攻後排，否則必須優先打前排
        let targetZone = null;
        if (hasRanged) {
          targetZone = field.player_back[i] ? "player_back" : (field.player_front[i] ? "player_front" : null);
        } else {
          targetZone = field.player_front[i] ? "player_front" : (field.player_back[i] ? "player_back" : null);
        }

        if (!targetZone) continue; // 空戰線不能進攻
        
        const targetDefender = field[targetZone][i];
        if (window.XLW_isShieldUnit(targetDefender)) continue; // 盾牌不可被直接進攻

        enemyAttacker.attacking = true;
        enemyAttacker.target = { zone: targetZone, idx: i };
        opponentAttackCount++;
        logBattle(`對手進攻宣言(遠程:${hasRanged})：星星戰線${i + 1}，對手 ${unitName(enemyAttacker)} 指向我方 ${unitName(targetDefender)}`);
      }

      window.XLW_DEFENSE_RULE.playerNeedsDefense = opponentAttackCount > 0;
      logBattle(`—— 對手回合結束，已宣告 ${opponentAttackCount} 條星星戰線進攻。 ——`);
      render();
      await sleep(700);

      // 敵方如未進行進攻宣言，則必須進行戰術佈陣階段，若手牌無單位可召喚，強制召喚小旅人
      if (opponentAttackCount === 0) {
        phase = "\u6230\u8853\u4f48\u9663";
        setStatus("\u5c0d\u624b\u7121\u9032\u653b\u55ae\u4f4d\uff0c\u9032\u5165\u5c0d\u624b\u300c\u6230\u8853\u4f48\u9663\u300d\u968e\u6bb5\u002e\u002e\u002e");
        render();
        await sleep(800);

        const emptyFrontIdx = field.enemy_front.findIndex(u => !u);
        const emptyBackIdx = field.enemy_back.findIndex(u => !u);
        const hasEmptySlot = emptyFrontIdx >= 0 || emptyBackIdx >= 0;

        if (hasEmptySlot) {
          const summonHandIdx = window.XLW_ENEMY.hand.findIndex(c =>
            c && (c.type === "unit" || c.type === "\u602a\u7378") && Number(c.tribute || 0) <= 0
          );

          const destZone = emptyFrontIdx >= 0 ? "enemy_front" : "enemy_back";
          const destIdx = emptyFrontIdx >= 0 ? emptyFrontIdx : emptyBackIdx;

          if (summonHandIdx >= 0) {
            const card = window.XLW_ENEMY.hand[summonHandIdx];
            window.XLW_ENEMY.hand.splice(summonHandIdx, 1);
            field[destZone][destIdx] = {
              card: card,
              tapped: false,
              attacking: false,
              target: null,
              summonedTurn: turn,
              summonedZone: destZone
            };
            logBattle(`\u5c0d\u624b\u9032\u884c\u6230\u8853\u4f48\u9663\u53ec\u559a：${card.name}\u0020\u5230\u0020${destZone === "enemy_front" ? "\u524d\u6392" : "\u5f8c\u6392"}${destIdx + 1}`);
          } else {
            field[destZone][destIdx] = {
              card: structuredClone(LITTLE_TRAVELER),
              tapped: false,
              attacking: false,
              target: null,
              summonedTurn: turn,
              summonedZone: destZone
            };
            logBattle(`\u5c0d\u624b\u7121\u55ae\u4f4d\u53ef\u53ec\u559a，\u6230\u8853\u5f37\u5236\u53ec\u559a：小旅人\u0020\u5230\u0020${destZone === "enemy_front" ? "\u524d\u6392" : "\u5f8c\u6392"}${destIdx + 1}`);
            playTravelerSummonAnimation("#enemyForest", destZone, destIdx);
          }
          render();
          await sleep(800);
        }
      }
    }
  } catch (err) {
    console.error("對手 AI 運行出錯:", err);
    logBattle(`對手行動出錯: ${err.message}`);
  } finally {
    window.XLW_ENEMY.running = false;
  }
}

// 結束我方回合，接管對手回合與我方新回合開始
async function endPlayerTurnAndRunEnemy() {
  // 檢查倒數階段
  handleTurnEndCountdownLogic();
  if (isGameOverFlag) return;

  if (isMultiplayer) {
    isMyTurn = false;
    setStatus("我方回合結束，正在等待對手行動...");
    
    ws.send(JSON.stringify({
      action: "end_turn",
      next_turn: turn + 1
    }));
    render();
  } else {
    // 進入對手回合
    await runEnemyTurn();

    // 檢查倒數階段
    handleTurnEndCountdownLogic();
    if (isGameOverFlag) return;

    // 回到我方新回合
    turn++;
    window.XLW_turnSneakCount = 0;
    normalSummonUsed = false;
    tacticalSummonUsed = false;
    playerUntap();

    // 回合開始自動抽 2 張
    draw(2);

    if (countdownActive && countdownRemaining === 1) {
      phase = "召喚階段";
      setStatus(`⚠️ 最後一回合！只能進行召喚階段，無戰術佈陣與進攻宣言！已自動抽2張。`);
      render();
    } else {
      let enemyHasAttackers = false;
      ["enemy_front", "enemy_back"].forEach(zone => {
        field[zone].forEach(u => {
          if (u && u.attacking) enemyHasAttackers = true;
        });
      });

      if (window.XLW_DEFENSE_RULE.playerNeedsDefense && enemyHasAttackers) {
        phase = "\u9632\u5b88\u968e\u6bb5";
        setStatus(`\u7b2c ${turn} \u56de\u5408\u958b\u59cb\uff0c\u5df2\u81ea\u52d5\u62bd\u0032\u5f35\u3002\u524d\u4e00\u56de\u5408\u5c0d\u624b\u6709\u9032\u653b\u5ba3\u8a00\uff0c\u81ea\u52d5\u9032\u5165\u300c\u9632\u5b88\u968e\u6bb5\u300d\uff01`);
        render();
        setTimeout(() => {
          xlwResolvePlayerDefensePhase();
        }, 500);
      } else {
        const wasPending = window.XLW_DEFENSE_RULE.playerNeedsDefense;
        window.XLW_DEFENSE_RULE.playerNeedsDefense = false;
        phase = "\u53ec\u559a\u968e\u6bb5";
        setStatus(`\u7b2c ${turn} \u56de\u5408\u958b\u59cb\uff0c\u5df2\u81ea\u52d5\u62bd\u0032\u5f35\u3002`);
        if (wasPending) {
          logBattle("\u6211\u65b9\u9632\u5b88\u968e\u6bb5\u958b\u59cb\u524d\uff0c\u56e0\u5c0d\u624b\u7121\u9032\u653b\u55ae\u4f4d\uff0c\u8df3\u904e\u9632\u5b88\u968e\u6bb5\u3002");
        }
        render();
      }
    }
  }
}

function playerUntap() {
  ["player_front", "player_back"].forEach(zone => {
    field[zone].forEach(u => {
      if (u) {
        u.tapped = false;
        u.attacking = false;
        u.target = null;
      }
    });
  });
}

function untapEnemy() {
  ["enemy_front", "enemy_back"].forEach(zone => {
    field[zone].forEach(u => {
      if (u) {
        u.tapped = false;
        u.attacking = false;
        u.target = null;
      }
    });
  });
}

// 渲染我方種族與對手種族宣言卡
function renderRaceCards() {
  const pRace = $("playerRace");
  const eRace = $("enemyRace");
  
  if (pRace) {
    const deckSelect = $("deckSelect");
    const deckName = deckSelect ? deckSelect.value : "喵喵賊";
    const normName = normDeckName(deckName);
    pRace.innerHTML = `<img src="/static/race_cards/${normName}.png" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;" alt="${normName}" title="${normName}">`;
  }
  
  if (eRace) {
    const oppDeck = window.XLW_ENEMY.deckName || "妖怪村莊";
    const normOppName = normDeckName(oppDeck);
    eRace.innerHTML = `<img src="/static/race_cards/${normOppName}.png" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;" alt="${normOppName}" title="${normOppName}">`;
  }
}

// ===== 11. 高解析與單一 Efficient Render (高效渲染管線) =====
function render() {
  adjustBoardScale();
  // 更新狀態列數值
  const phaseDisplayText = $("phaseDisplayText") || $("phaseTextHard");
  const phaseHelpText = $("phaseHelpText") || $("phaseHelpHard");
  const phaseDisplayPanel = $("phaseDisplayPanel") || $("phaseDisplayPanelHard");
  
  if (phaseDisplayText) phaseDisplayText.textContent = phase;
  if (phaseHelpText) phaseHelpText.textContent = getPhaseHelpText(phase);
  if (phaseDisplayPanel) phaseDisplayPanel.dataset.phase = phase;

  document.body.dataset.phase = phase;

  const turnEl = $("turn");
  if (turnEl) turnEl.textContent = turn;
  const handCountEl = $("handCount");
  if (handCountEl) handCountEl.textContent = hand.length;
  $("playerDeck").innerHTML = `我方牌庫<br>${deck.length} 張`;
  renderGraveyard("playerGrave", graveyard, "我方墓地");
  renderGraveyard("enemyGrave", window.XLW_ENEMY.grave, "對手墓地");

  renderDeckVisuals();
  renderStablePanel();
  renderHand();
  renderField();
  renderBattleLine();
  renderScore();
  renderEnemyPanel();
  renderRaceCards();
}

function getPhaseHelpText(p) {
  switch (p) {
    case "起手換牌": return "可點選手牌標記（面朝下），確認換牌後重新洗牌，並進入第一回合自動抽牌。";
    case "防守階段": return "前一回合對手宣告了進攻，系統正在為您自動結算戰鬥。";
    case "召喚階段": return "回合開始已自動抽牌。可點手牌進行召喚/發動魔法，完成後可選擇「戰術佈陣」或「進攻宣言」。";
    case "戰術佈陣": return "本回合已選擇戰術佈陣。可移動單位，或再額外進行一次小旅人/免祭品召喚；此路線無法進攻。";
    case "進攻宣言": return "本回合已選擇進攻宣言。點我方未橫置單位指向同戰線敵方非盾牌進行宣告，戰鬥會在對手回合防守結算。";
    case "結束階段": return "回合結束，可點擊「結束回合」進行棄牌，並讓對手進行 AI 行動回合。";
    default: return "請依照目前提示執行操作。";
  }
}

// 渲染雙方牌庫立體圖層
function renderDeckVisuals() {
  const pCount = deck.length;
  const eCount = window.XLW_ENEMY.deck.length;
  
  createDeckVisual("playerDeck", pCount, "我方");
  createDeckVisual("enemyDeck", eCount, "對手");
}

function createDeckVisual(zoneId, count, label) {
  const zone = $(zoneId);
  if (!zone) return;
  zone.innerHTML = "";

  const wrap = document.createElement("div");
  wrap.className = "deck-stack-final-fixed";

  const labelDiv = document.createElement("div");
  labelDiv.className = "deck-fixed-label";
  labelDiv.textContent = label;
  wrap.appendChild(labelDiv);

  if (count <= 0) {
    const empty = document.createElement("div");
    empty.className = "deck-fixed-empty";
    empty.textContent = "空";
    wrap.appendChild(empty);
    zone.appendChild(wrap);
    return;
  }

  // 根據厚度畫出多層卡牌
  let layers = 1;
  if (count >= 5) layers = 2;
  if (count >= 10) layers = 3;
  if (count >= 15) layers = 4;
  if (count >= 20) layers = 5;

  for (let i = 1; i <= layers; i++) {
    const c = document.createElement("div");
    c.className = `deck-fixed-card layer-${i}`;
    wrap.appendChild(c);
  }

  const counter = document.createElement("div");
  counter.className = "deck-fixed-count";
  counter.textContent = count;
  wrap.appendChild(counter);

  zone.appendChild(wrap);
}

// 渲染我方手牌
function renderHand() {
  const container = $("hand");
  if (!container) return;
  container.innerHTML = "";

  hand.forEach((card, idx) => {
    const cardEl = document.createElement("div");
    cardEl.className = "card";
    cardEl.dataset.handIndex = idx;
    
    // Mulligan 換牌高亮
    if (mulliganActive) {
      cardEl.classList.add("mulligan-card");
      if (selectedMulliganIndexes.has(idx)) {
        cardEl.classList.add("mulligan-selected");
      }
    }

    // 可否普通召喚亮邊
    const canSum = (phase === "召喚階段" && !normalSummonUsed) || (phase === "戰術佈陣" && !tacticalSummonUsed);
    if (canSum && card.type === "unit" && Number(card.tribute || 0) <= 0) {
      cardEl.classList.add("can-summon-now");
    }

    if (selectedHandForSummon === idx) {
      cardEl.classList.add("selected-hand-summon");
    }

    const metaText = card.type === "unit"
      ? `攻 ${card.attack} | 星 ${card.score} | 祭 ${card.tribute || 0}`
      : `魔法 | 點 ${card.magic_point || "-"}`;

    if (card.image) {
      cardEl.innerHTML = `<img src="${card.image}" alt="${card.name}"><div class="mini-meta">${card.name}<br>${metaText}</div>`;
    } else {
      cardEl.innerHTML = `<div class="fallback"><b>${card.name}</b><br>${metaText}</div>`;
    }

    // 手牌點擊事件 (區分換牌、魔法、一般召喚與獻祭)
    cardEl.onclick = (e) => {
      e.stopPropagation();
      if (mulliganActive) {
        toggleMulliganCard(idx);
        return;
      }

      if (tributeWaitingPosition) {
        showModal(card);
        setStatus("已完成獻祭，請點擊我方空格放置召喚的單位！");
        return;
      }

      if (isMultiplayer && !isMyTurn) {
        showModal(card);
        setStatus("對手回合中，請稍候！");
        return;
      }

      if (phase !== "召喚階段" && phase !== "戰術佈陣") {
        showModal(card);
        return;
      }

      if (card.type === "magic") {
        castSpell(idx);
      } else if (Number(card.tribute || 0) > 0) {
        startTributeSummon(idx);
      } else {
        // 一般免祭品召喚
        if (selectedHandForSummon === idx) {
          clearModes();
          setStatus("已取消召喚選擇。");
        } else {
          clearModes();
          selectedHandForSummon = idx;
          cardEl.classList.add("selected-hand-summon");
          setStatus(`已選擇 ${card.name}。請點擊我方一個空格進行召喚。`);
          render();
        }
      }
    };

    container.appendChild(cardEl);
  });
}

// 渲染戰場格子
function renderField() {
  console.log("[XLW renderField Debug] tributeWaitingPosition =", tributeWaitingPosition, "selectedHandForSummon =", selectedHandForSummon, "selectedTributeCard =", selectedTributeCard);
  window.XLW_animatingSlots = window.XLW_animatingSlots || new Set();
  for (const zone of ["player_front", "player_back", "enemy_front", "enemy_back"]) {
    document.querySelectorAll(`[data-zone="${zone}"]`).forEach(slot => {
      const idx = Number(slot.dataset.index);
      slot.innerHTML = `<span class="lane-badge">${idx + 1}</span>`;
      slot.className = "slot";
      // 重置所有內聯樣式以抵禦 CSS 快取與特異性覆蓋
      slot.style.border = "";
      slot.style.boxShadow = "";
      slot.style.cursor = "";
      slot.style.backgroundColor = "";

      const obj = field[zone][idx];
      if (obj) {
        slot.classList.add("has-card");
        if (obj.tapped) slot.classList.add("tapped-slot");
        if (obj.attacking) {
          console.log(`[XLW Attacking Debug] Slot ${zone}[${idx}] (${obj.card.name}) is attacking. target:`, obj.target, "phase:", phase);
          slot.classList.add("attacking-slot");
          if (zone.startsWith("player_")) {
            slot.classList.add("xlw-my-attacker");
          } else {
            slot.classList.add("xlw-enemy-attacker");
          }
        }
        if (window.XLW_isShieldUnit(obj)) slot.classList.add("xlw-shield-unit");

        // 宣告進攻亮邊
        if (selectedAttacker && selectedAttacker.zone === zone && selectedAttacker.idx === idx) {
          slot.classList.add("xlw-player-attacker-selected");
        }
        if (obj.attacking && obj.target) {
          if (zone.startsWith("player_")) {
            slot.classList.add("xlw-player-declared-attacker");
            slot.classList.add("xlw-my-attacker");
          } else {
            slot.classList.add("xlw-enemy-declared-attacker");
            slot.classList.add("xlw-enemy-attacker");
          }
        }

        // 對手防守階段高亮
        if (phase === "防守階段" && obj.attacking) {
          slot.classList.add("xlw-defense-attacker");
        }

        // Check if this slot is targeted by any active attacker (for flat rotation and orange highlight)
        let isTargeted = false;
        for (const z of ["player_front", "player_back", "enemy_front", "enemy_back"]) {
          for (let i = 0; i < 5; i++) {
            const u = field[z][i];
            if (u && u.attacking && u.target && u.target.zone === zone && u.target.idx === idx) {
              isTargeted = true;
              break;
            }
          }
          if (isTargeted) break;
        }
        if (isTargeted) {
          slot.classList.add("xlw-defense-target");
        }
        if (window.XLW_blackCatChoosing && zone.startsWith("enemy_")) {
          slot.classList.add("xlw-black-cat-selectable");
        }

        const cardEl = document.createElement("div");
        cardEl.className = "card";
        
        // 如果該位置正處於小旅人召喚動畫中或獻祭召喚動畫中，暫時隱藏實際卡牌，以防瞬間定位穿幫
        const key = `${zone}:${idx}`;
        if (window.XLW_animatingSlots.has(key) || (window.XLW_animatingTributeSlots && window.XLW_animatingTributeSlots.has(key))) {
          cardEl.style.visibility = "hidden";
        }
        
        // 如果該位置正完成獻祭重擊入場，加上 3D Slam 特效
        if (window.XLW_slamTributeCards && window.XLW_slamTributeCards.has(key)) {
          cardEl.classList.add("xlw-tribute-card-slam");
        }
        
        const metaText = obj.card.type === "unit"
          ? `攻 ${getUnitAtk(obj, zone, idx)} | 星 ${getUnitStars(obj, zone, idx)}`
          : `魔法`;

        if (obj.card.image) {
          cardEl.innerHTML = `<img src="${obj.card.image}" alt="${obj.card.name}"><div class="mini-meta">${obj.card.name}<br>${metaText}</div>`;
        } else {
          cardEl.innerHTML = `<div class="fallback"><b>${obj.card.name}</b><br>${metaText}</div>`;
        }

        // 星數增強顯示
        if (obj.bonusScore) {
          const badge = document.createElement("div");
          badge.className = "bonus-score-badge";
          badge.textContent = "+" + obj.bonusScore;
          slot.appendChild(badge);
        }

        cardEl.onclick = (e) => {
          e.stopPropagation();
          if (window.XLW_blackCatChoosing) {
            if (zone.startsWith("enemy_")) {
              xlwExecuteBlackCatDestruction(zone, idx);
            } else {
              setStatus("\u8acb\u9078\u64c7\u5c0d\u624b\u5834\u4e0a\u7684\u55ae\u4f4d\u4f5c\u70ba\u7834\u58bad\u76ee\u6a19\uff01"); // 請選擇對手場上的單位作為破壞目標！
            }
            return;
          }
          // 進攻宣言與防守點選優先處理
          if (isMultiplayer && !isMyTurn) {
            showModal(obj.card);
            setStatus("對手回合中，請稍候！");
            return;
          }
          if (phase === "進攻宣言") {
            if (zone.startsWith("player_")) {
              xlwTogglePlayerAttack(zone, idx);
            } else {
              showModal(obj.card);
            }
            return;
          }
          if (phase === "召喚階段" && selectedHandForTribute !== null) {
            toggleTributeSelection(zone, idx);
            return;
          }
          showModal(obj.card);
        };

        slot.appendChild(cardEl);
      } else {
        // 空格狀態
        const label = zone.includes("front") ? "前排" : "後排";
        slot.append(label + (idx + 1));

        // 獻祭召喚位置亮綠邊 (前排優先)
        const tryingSummon = selectedHandForSummon !== null || tributeWaitingPosition;
        if (tryingSummon) {
          let selectedCard = null;
          if (selectedHandForSummon === "TRAVELER") {
            selectedCard = LITTLE_TRAVELER;
          } else if (selectedTributeCard !== null) {
            selectedCard = selectedTributeCard;
          } else if (selectedHandForSummon !== null) {
            selectedCard = hand[selectedHandForSummon];
          }

          const canSummonToEnemy = xlwIsEnemySummonCard(selectedCard);

                  if (zone.startsWith("player_")) {
            const isLegal = xlwCanSummonToZone(zone, selectedCard);
            if (tributeWaitingPosition) {
              logDebug(`【槽量判定】我方 ${zone.includes("front") ? "前排" : "後排"}${idx + 1} 判定為: ${isLegal ? "螢光綠 (合法)" : "警示紅 (優先阻擋)"}`);
            }
            if (isLegal) {
              slot.classList.add("xlw-hand-front-legal");
              slot.style.border = "3px solid #00ff7f";
              slot.style.boxShadow = "0 0 25px rgba(0, 255, 127, 0.85), inset 0 0 12px rgba(0, 255, 127, 0.45)";
              slot.style.cursor = "pointer";
            } else {
              slot.classList.add("xlw-hand-front-illegal");
              slot.style.border = "2px solid #ff4d4f";
              slot.style.boxShadow = "0 0 15px rgba(255, 77, 79, 0.7), inset 0 0 8px rgba(255, 77, 79, 0.3)";
              slot.style.cursor = "not-allowed";
            }
          } else if (zone.startsWith("enemy_") && canSummonToEnemy) {
            const isLegal = xlwCanSummonToZone(zone, selectedCard);
            if (tributeWaitingPosition) {
              logDebug(`【槽量判定】敵方 ${zone.includes("front") ? "前排" : "後排"}${idx + 1} 判定為: ${isLegal ? "螢光綠 (合法)" : "警示紅 (優先阻擋)"}`);
            }
            if (isLegal) {
              slot.classList.add("xlw-hand-front-legal");
              slot.style.border = "3px solid #00ff7f";
              slot.style.boxShadow = "0 0 25px rgba(0, 255, 127, 0.85), inset 0 0 12px rgba(0, 255, 127, 0.45)";
              slot.style.cursor = "pointer";
            } else {
              slot.classList.add("xlw-hand-front-illegal");
              slot.style.border = "2px solid #ff4d4f";
              slot.style.boxShadow = "0 0 15px rgba(255, 77, 79, 0.7), inset 0 0 8px rgba(255, 77, 79, 0.3)";
              slot.style.cursor = "not-allowed";
            }
          }
        }

        slot.onclick = (e) => {
          e.stopPropagation();
          const currentTryingSummon = selectedHandForSummon !== null || tributeWaitingPosition;
          logDebug(`【點擊偵測】點擊了空白槽位: ${zone}:${idx + 1}, 當前召喚狀態: ${currentTryingSummon}`);
          console.log("[XLW Click Debug] Empty slot clicked! zone =", zone, "idx =", idx, "currentTryingSummon =", currentTryingSummon);
          if (currentTryingSummon) {
            performSummonToSlot(zone, idx);
          }
        };
      }
    });
  }

  // 渲染場地區的場地魔法卡
  const pf = $("playerField");
  if (pf) {
    pf.querySelectorAll(".field-magic-full-fixed").forEach(el => el.remove());
    if (pf.dataset.card) {
      const card = JSON.parse(pf.dataset.card);
      const div = document.createElement("div");
      div.className = "field-magic-full-fixed";
      div.innerHTML = `<img src="${card.image}"><div class="field-magic-title-fixed">${card.name}</div>`;
      div.onclick = (e) => {
        e.stopPropagation();
        showModal(card);
      };
      pf.appendChild(div);
    }
  }
}

// 渲染進攻戰線高亮
function renderBattleLine() {
  document.querySelectorAll(".battle-cell").forEach((cell, i) => {
    cell.textContent = `★${i + 1}`;
    cell.className = "battle-cell";

    if (countdownActive) {
      if (i >= countdownRemaining) {
        cell.classList.add("greyed-battle-cell");
      } else if (i === countdownRemaining - 1) {
        cell.classList.add("countdown-threat-cell");
        cell.textContent = `★${i + 1} ⚠️`;
      }
    } else {
      const hasAttacker = (field.player_front[i] && field.player_front[i].attacking) ||
                          (field.player_back[i] && field.player_back[i].attacking) ||
                          (field.enemy_front[i] && field.enemy_front[i].attacking);

      if (hasAttacker) {
        cell.textContent = `★${i + 1} ⚔`;
        cell.classList.add("line-has-attacker");
      }
    }
  });
}

// 渲染星星計分面板
function getStarIcons(count) {
  let starsHtml = "";
  for (let i = 0; i < count; i++) {
    starsHtml += "<span class='glowing-star'>★</span>";
  }
  if (count === 0) {
    starsHtml = "<span class='dimmed-star'>☆</span>";
  }
  return starsHtml;
}
// 小工具：取得卡片類型 (場地/消耗/永久/裝備)
function getMagicType(card) {
  if (!card) return null;
  if (card.magic_type) return card.magic_type;
  const name = card.name || "";
  if (name.includes("場地")) return "場地";
  if (name.includes("消耗")) return "消耗";
  if (name.includes("永久")) return "永久";
  if (name.includes("裝備")) return "裝備";
  return null;
}
// 小工具：取得卡片類型 (場地/消耗/永久/裝備)
function getMagicType(card) {
  if (!card) return null;
  if (card.magic_type) return card.magic_type;
  const name = card.name || "";
  if (name.includes("場地")) return "場地";
  if (name.includes("消耗")) return "消耗";
  if (name.includes("永久")) return "永久";
  if (name.includes("裝備")) return "裝備";
  return null;
}

function renderScore() {
  let playerStars = playerBonusScore;
  let enemyStars = enemyBonusScore;

  let playerFieldStars = 0;
  for (const zone of ["player_front", "player_back"]) {
    field[zone].forEach((u, i) => {
      if (u) {
        const uStars = getUnitStars(u, zone, i);
        playerStars += uStars;
        playerFieldStars += uStars;
      }
    });
  }

  let enemyFieldStars = 0;
  for (const zone of ["enemy_front", "enemy_back"]) {
    field[zone].forEach((u, i) => {
      if (u) {
        const uStars = getUnitStars(u, zone, i);
        enemyStars += uStars;
        enemyFieldStars += uStars;
      }
    });
  }

  // 左上角浮動狀態更新
  const scoreBadge = document.getElementById("scoreBadgeFixed") || (() => {
    const div = document.createElement("div");
    div.id = "scoreBadgeFixed";
    div.className = "score-badge-fixed";
    document.body.appendChild(div);
    return div;
  })();
  
  scoreBadge.innerHTML = `
    <div class="score-badge-section">
      <div class="score-badge-row">
        <span class="score-badge-label">我方總分</span>
        <span class="score-badge-stars">${getStarIcons(playerStars)}</span>
        <span class="score-badge-num">${playerStars} ★</span>
      </div>
      <div class="score-badge-subrow">
        <span>\u5834\u4e0a\u661f\u661f: <span style="color: #ffd76a;">${playerFieldStars} ★</span> | \u984d\u5916\u5206\u657a: <span style="color: #ff5252;">${playerBonusScore} ★</span></span>
      </div>
      <div class="score-badge-row" style="margin-top: 6px;">
        <span class="score-badge-label">對手總分</span>
        <span class="score-badge-stars">${getStarIcons(enemyStars)}</span>
        <span class="score-badge-num">${enemyStars} ★</span>
      </div>
      <div class="score-badge-subrow">
        <span>\u5834\u4e0a\u661f\u661f: <span style="color: #ffd76a;">${enemyFieldStars} ★</span> | \u984d\u5916\u5206\u657a: <span style="color: #ff5252;">${enemyBonusScore} ★</span></span>
      </div>
    </div>
  `;

  // 計分對戰紀錄更新
  const playerVal = $("xlwPlayerScore");
  const enemyVal = $("xlwEnemyScore");
  if (playerVal) {
    playerVal.innerHTML = `${playerStars} <span style="font-size: 13px; font-weight: normal; opacity: 0.8; margin-left: 6px;">(\u5834\u4e0a\u661f\u661f: ${playerFieldStars} \u2605 | \u984d\u5916\u5206\u6578: ${playerBonusScore} \u2605)</span>`;
  }
  if (enemyVal) {
    enemyVal.innerHTML = `${enemyStars} <span style="font-size: 13px; font-weight: normal; opacity: 0.8; margin-left: 6px;">(\u5834\u4e0a\u661f\u661f: ${enemyFieldStars} \u2605 | \u984d\u5916\u5206\u6578: ${enemyBonusScore} \u2605)</span>`;
  }

  const logContent = $("xlwBattleLogContent");
  if (logContent) {
    logContent.innerHTML = battleLog.length
      ? battleLog.map(l => `<div>${l}</div>`).join("")
      : `<div class="xlw-log-empty">尚無對戰紀錄</div>`;
  }

  // 限制回合判定勝負
  if (turn >= FINAL_TURN && phase === "結束階段") {
    let result = "DRAW";
    let msg = "平手";
    if (playerStars > enemyStars) { result = "VICTORY"; msg = "我方勝利！"; }
    else if (enemyStars > playerStars) { result = "DEFEAT"; msg = "對手勝利！"; }
    
    let panel = document.getElementById("xlwResultPanel");
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "xlwResultPanel";
      panel.className = "xlw-result-panel";
      document.body.appendChild(panel);
    }
    panel.innerHTML = `
      <div class="xlw-result-box">
        <div class="xlw-result-title">${result}</div>
        <div class="xlw-result-msg">${msg}</div>
        <div class="xlw-result-score" style="font-size: 16px; line-height: 1.6;">
          \u6211\u65b9 ${playerStars} \u2605 <small style="display: block; font-size: 12px; opacity: 0.85;">(\u5834\u4e0a\u661f\u661f: ${playerFieldStars} \u2605 | \u984d\u5916\u5206\u6578: ${playerBonusScore} \u2605)</small>
          \u5c0d\u624b ${enemyStars} \u2605 <small style="display: block; font-size: 12px; opacity: 0.85;">(\u5834\u4e0a\u661f\u661f: ${enemyFieldStars} \u2605 | \u984d\u5916\u5206\u6578: ${enemyBonusScore} \u2605)</small>
        </div>
        <button onclick="document.getElementById('xlwResultPanel').classList.remove('show')">關閉</button>
      </div>
    `;
    panel.classList.add("show");
  }
}

function renderEnemyPanel() {
  const panel = $("xlwEnemyInfoPanel") || (() => {
    const div = document.createElement("div");
    div.id = "xlwEnemyInfoPanel";
    div.className = "xlw-enemy-info-panel";
    document.body.appendChild(div);
    return div;
  })();

  const deckName = window.XLW_ENEMY.deckName || "\u5996\u602a\u6751\u83aa";
  panel.innerHTML = `
    <div class="enemy-info-title">\u5c0d\u624b\u72c0\u614b\uff1a${deckName}</div>
    <div>\u5c0d\u624b\u724c\u5e6b\uff1a<span id="enemyDeckCountInfo">${window.XLW_ENEMY.deck.length}</span></div>
    <div>\u5c0d\u624b\u624e\u724c\uff1a<span id="enemyHandCountInfo">${window.XLW_ENEMY.hand.length}</span></div>
  `;
}

// 實作清爽的一體化右下主操作面板
function renderStablePanel() {
  let panel = $("stableActionPanel") || (() => {
    const div = document.createElement("div");
    div.id = "stableActionPanel";
    document.body.appendChild(div);
    return div;
  })();

  // 起手換牌時顯示換牌按鈕
  if (mulliganActive) {
    if (isMultiplayer) {
      panel.innerHTML = `
        <button class="stable-action-btn primary" onclick="event.stopPropagation(); confirmMulligan()">確認換牌</button>
      `;
    } else {
      panel.innerHTML = `
        <button class="stable-action-btn primary" onclick="event.stopPropagation(); confirmMulligan()">確認換牌</button>
        <button class="stable-action-btn secondary" onclick="event.stopPropagation(); newGame()">重置新局</button>
      `;
    }
    return;
  }

  // 已確認起手換牌，但對手尚未就緒時，鎖定操作面板，避免發送提前結束回合指令
  if (phase === "起手換牌") {
    panel.innerHTML = `
      <button class="stable-action-btn end" style="background: #2b2525; color: #888; border-color: #443c3c; cursor: not-allowed; font-size: 15px;" disabled>等待對手確認換牌...</button>
    `;
    return;
  }

  // 線上雙人模式：對手回合直接鎖定整個面板，以防違規操作
  if (isMultiplayer && !isMyTurn) {
    panel.innerHTML = `
      <div class="stable-action-row" style="opacity: 0.5; pointer-events: none;">
        <button id="stableActionTactical" class="stable-action-btn tactical" disabled>戰術佈陣</button>
        <button id="stableActionAttack" class="stable-action-btn attack" disabled>進攻宣言</button>
      </div>
      <button id="stableActionConfirm" class="stable-action-btn tribute" disabled>確認獻祭</button>
      <button id="stableActionCancel" class="stable-action-btn tribute-cancel" disabled>取消選擇</button>
      <button id="stableActionEnd" class="stable-action-btn end" style="background: #333; color: #666; cursor: not-allowed;" disabled>對手回合中</button>
    `;
    return;
  }

  // 正常對戰操作
  panel.innerHTML = `
    <div class="stable-action-row">
      <button id="stableActionTactical" class="stable-action-btn tactical" onclick="changeActionPhase('戰術佈陣')">戰術佈陣</button>
      <button id="stableActionAttack" class="stable-action-btn attack" onclick="changeActionPhase('進攻宣言')">進攻宣言</button>
    </div>
    <button id="stableActionConfirm" class="stable-action-btn tribute" onclick="event.stopPropagation(); confirmTribute()">確認獻祭</button>
    <button id="stableActionCancel" class="stable-action-btn tribute-cancel" onclick="event.stopPropagation(); clearModes()">取消選擇</button>
    <button id="stableActionEnd" class="stable-action-btn end" onclick="event.stopPropagation(); endPlayerTurnAndRunEnemy()">結束回合</button>
  `;

  // 按鈕狀態控制
  const tacticalBtn = $("stableActionTactical");
  const attackBtn = $("stableActionAttack");
  const confirmBtn = $("stableActionConfirm");
  const cancelBtn = $("stableActionCancel");
  const endBtn = $("stableActionEnd");

  if (tacticalBtn) {
    tacticalBtn.disabled = phase !== "召喚階段" || turn === 1 || turn === FINAL_TURN || (countdownActive && countdownRemaining === 1);
    tacticalBtn.classList.toggle("active", phase === "戰術佈陣");
  }
  if (attackBtn) {
    attackBtn.disabled = phase !== "召喚階段" || turn === 1 || turn === FINAL_TURN || (countdownActive && countdownRemaining === 1);
    attackBtn.classList.toggle("active", phase === "進攻宣言");
  }
  if (confirmBtn) {
    confirmBtn.disabled = selectedHandForTribute === null || selectedTributes.length < hand[selectedHandForTribute].tribute;
  }
  if (cancelBtn) {
    cancelBtn.disabled = (selectedHandForSummon === null && selectedHandForTribute === null && selectedAttacker === null && !tributeWaitingPosition);
  }
  if (endBtn) {
    endBtn.disabled = phase === "防守階段";
  }

  // 森林召喚區域同步狀態
  const pForest = $("playerForest");
  if (pForest) {
    const canSum = (phase === "召喚階段" && !normalSummonUsed) || (phase === "戰術佈陣" && !tacticalSummonUsed);
    if (canSum) {
      pForest.style.pointerEvents = "auto";
      pForest.style.cursor = "pointer";
      pForest.style.opacity = "1";
      pForest.style.filter = "none";
      pForest.classList.remove("disabled-forest");
    } else {
      pForest.style.pointerEvents = "none";
      pForest.style.cursor = "not-allowed";
      pForest.style.opacity = "0.55";
      pForest.style.filter = "grayscale(0.45) brightness(0.75)";
      pForest.classList.add("disabled-forest");
    }
  }

  // 隱藏舊的重疊按鈕
  Array.from(document.querySelectorAll("button")).forEach(btn => {
    if (btn.closest("#stableActionPanel") || btn.id === "summonTravelerBtn") return;
    const txt = (btn.textContent || "").replace(/\s+/g,"");
    if (
      txt.includes("戰術") || txt.includes("進攻") || txt.includes("下一階段") ||
      txt.includes("召喚") || txt.includes("獻祭") || txt.includes("小旅人") ||
      txt.includes("結束") || txt.includes("對手測試") || txt.includes("防守判定") ||
      txt.includes("取消")
    ) {
      btn.style.setProperty("display", "none", "important");
    }
  });
}

// ===== 12. 事件與卡牌資訊對話框 =====
function setupGlobalEvents() {
  // 監聽牌組下拉選單變更，即時渲染我方種族卡
  const deckSelect = $("deckSelect");
  if (deckSelect) {
    deckSelect.addEventListener("change", () => {
      renderRaceCards();
    });
  }

  // 對戰紀錄計分面板
  const scoreBtn = $("scoreBtn");
  if (scoreBtn) {
    scoreBtn.onclick = () => {
      $("scorePanel")?.classList.add("show");
    };
  }
  const closeScore = $("closeScorePanel");
  if (closeScore) {
    closeScore.onclick = () => {
      $("scorePanel")?.classList.remove("show");
    };
  }

  const closeModal = $("closeModal");
  if (closeModal) {
    closeModal.onclick = () => {
      $("cardModal")?.classList.remove("show");
    };
  }

  const cardModal = $("cardModal");
  if (cardModal) {
    cardModal.onclick = (e) => {
      if (e.target === cardModal) {
        cardModal.classList.remove("show");
      }
    };
  }

  // 拖曳普通/戰術召喚與格子移動
  document.addEventListener("dragstart", (e) => {
    if (isMultiplayer && !isMyTurn) return;
    const cardEl = e.target.closest("#hand .card");
    if (cardEl && !mulliganActive) {
      const idx = Number(cardEl.dataset.handIndex);
      dragged = { type: "hand", index: idx };
      e.dataTransfer.setData("text/plain", String(idx));
      return;
    }

    const slotEl = e.target.closest(".slot");
    if (slotEl && phase === "戰術佈陣") {
      const zone = slotEl.dataset.zone;
      const idx = Number(slotEl.dataset.index);
      dragged = { type: "field", zone, index: idx };
      e.dataTransfer.setData("text/plain", `${zone}:${idx}`);
    }
  });

  document.addEventListener("dragover", (e) => {
    e.preventDefault();
  });

  document.addEventListener("drop", (e) => {
    if (isMultiplayer && !isMyTurn) return;
    const slot = e.target.closest(".slot");
    if (!slot || !dragged) return;

    const zone = slot.dataset.zone;
    const idx = Number(slot.dataset.index);

    if (dragged.type === "hand") {
      const card = hand[dragged.index];
      if (card && card.type === "unit" && Number(card.tribute || 0) <= 0) {
        selectedHandForSummon = dragged.index;
        performSummonToSlot(zone, idx);
      }
    } else if (dragged.type === "field") {
      moveFieldUnit(dragged.zone, dragged.index, zone, idx);
    }
    dragged = null;
  });

  // 全域點擊點空處重置選擇
  document.addEventListener("click", (e) => {
    if (isMultiplayer && !isMyTurn) return;
    // 防禦：如果點擊的元素已經被從 DOM 中移除（例如重新渲染銷毀），防禦性地不予重置
    if (e.target && !document.body.contains(e.target)) return;
    if (e.target.closest(".card") || e.target.closest(".slot") || e.target.closest("#stableActionPanel")) return;
    clearModes();
    render();
  });
}

function showModal(card) {
  const leftPanel = $("xlwLeftCardPanel");
  const leftImg = $("leftPanelImg");
  const placeholder = $("leftPanelPlaceholder");
  const detailView = $("leftCardDetailView");

  if (leftImg && placeholder && detailView) {
    leftImg.src = card.image || "";
    placeholder.style.display = "none";
    detailView.style.display = "block";
  }
  if (leftPanel) {
    leftPanel.style.display = "block";
  }
}

function setStatus(t) {
  const s = $("status");
  if (s) s.textContent = t;
}

function logBattle(text) {
  const line = `T${turn} | ${text}`;
  battleLog.unshift(line);
  if (battleLog.length > 30) battleLog.pop();
}

// 實作動態自適應縮放引擎 (單螢幕無滾動佈局)
function adjustBoardScale() {
  const board = $("boardWrap");
  if (!board) return;
  
  const topbarH = 48;
  const handPanelH = 200; // 手牌欄高度 200px
  const padding = 16;
  const availableHeight = window.innerHeight - topbarH - handPanelH - padding;
  const boardNaturalHeight = 940; // 縮減後的沙盤安全高度
  
  const availableWidth = window.innerWidth - 32;
  const boardNaturalWidth = 980;
  
  const scaleH = availableHeight / boardNaturalHeight;
  const scaleW = availableWidth / boardNaturalWidth;
  const finalScale = Math.min(scaleH, scaleW, 1.0); // 僅縮小不放大
  
  board.style.transform = `scale(${finalScale})`;
  board.style.transformOrigin = "top center";
  
  const shell = document.querySelector(".game-shell");
  if (shell) {
    shell.style.height = `${boardNaturalHeight * finalScale + 8}px`;
    shell.style.minHeight = "auto";
  }
}

// ===== 13. 線上雙人即時事件監聽與座標變換處理器 =====
function setupWebSocketEvents() {
  ws.onopen = () => {
    console.log("WebSocket connected to room " + room_id);
    setStatus("成功建立線上對戰連線！正在等待對手加入...");
  };
  
  ws.onerror = (err) => {
    console.error("WebSocket 錯誤:", err);
    setStatus("連線發生錯誤，請重試或確認伺服器狀態！");
  };
  
  ws.onclose = () => {
    console.log("WebSocket 連線已關閉");
    setStatus("線上連線已中斷。");
  };
  
  ws.onmessage = async (event) => {
    const data = JSON.parse(event.data);
    console.log("收到線上廣播數據:", data);
    
    if (data.type === "welcome") {
      setStatus(data.message);
    } else if (data.type === "opponent_joined") {
      opponent_joined = true;
      logBattle(data.message);
      setStatus("對手已進入房間！即將開始線上起手換牌...");
      newGameMultiplayer();
    } else if (data.type === "opponent_disconnected") {
      logBattle(data.message);
      setStatus(data.message);
      alert(data.message);
    } else if (data.action === "mulligan_confirm") {
      opponent_mulligan_done = true;
      logBattle("對手已確認起手換牌，等待我方確認。");
      checkMulliganCompletion();
    } else if (data.action === "summon") {
      // 後端已將 zone 座標自動翻轉，所以收到時對本地來說就是 enemy_front / enemy_back
      const zone = data.zone; 
      const idx = data.idx;
      const card = data.card;
      
      field[zone][idx] = {
        card: card,
        tapped: false,
        attacking: false,
        target: null,
        summonedTurn: turn,
        summonedZone: zone
      };
      // 動態遞減對手手牌數量以供顯示
      if (window.XLW_ENEMY.hand && window.XLW_ENEMY.hand.length > 0) {
        window.XLW_ENEMY.hand.pop();
      }

      if (card && card.id === "TOKEN_TRAVELER") {
        playTravelerSummonAnimation("#enemyForest", zone, idx);
      } else if (card && Number(card.tribute || 0) > 0) {
        playTributeSummonAnimation(zone, idx);
      } else {
        render();
      }
    } else if (data.action === "cast_spell") {
      const card = data.card;
      logBattle(`對手發動了魔法卡 ${card.name}：${card.effect_text}`);
      enemyGraveyard.push(card);
      // 動態遞減對手手牌數量以供顯示
      if (window.XLW_ENEMY.hand && window.XLW_ENEMY.hand.length > 0) {
        window.XLW_ENEMY.hand.pop();
      }
      render();
    } else if (data.action === "move_unit") {
      const fromZone = data.fromZone;
      const fromIdx = data.fromIdx;
      const toZone = data.toZone;
      const toIdx = data.toIdx;
      const unit = field[fromZone][fromIdx];
      if (unit) {
        field[toZone][toIdx] = unit;
        field[fromZone][fromIdx] = null;
        logBattle(`對手進行戰術調整：將 ${unitName(unit)} 移動至其場地上`);
        render();
      }
    } else if (data.action === "destroy_unit") {
      const zone = data.zone;
      const idx = data.idx;
      const unit = field[zone][idx];
      if (unit) {
        graveyard.push(unit.card);
        field[zone][idx] = null;
        logBattle(`\u5c0d\u624b\u7279\u6b8a\u6548\u679c\uff1a\u7834\u58bad\u6211\u65b9\u0020${unitName(unit)}\u0021`); // 對手特殊效果：破壞我方 [單位]！
        render();
      }
    } else if (data.action === "attack_declare") {
      const attZone = data.attZone;
      const attIdx = data.attIdx;
      const targetZone = data.targetZone;
      const targetIdx = data.targetIdx;
      const attacker = field[attZone][attIdx];
      if (attacker) {
        attacker.attacking = true;
        attacker.target = { zone: targetZone, idx: targetIdx };
        attacker.tapped = true;
        window.XLW_DEFENSE_RULE.playerNeedsDefense = true; // 我方防守階段標記
        const defender = field[targetZone][targetIdx];
        if (defender) {
          logBattle(`\u5c0d\u624b\u767c\u8d77\u5ba3\u544a\u9032\u653b\uff1a\u661f\u661f\u6230\u7dda${attIdx + 1}\uff0c\u5c0d\u624b\u0020${unitName(attacker)}\u0020\u6307\u5411\u6211\u65b9\u0020${unitName(defender)}`);
        } else {
          logBattle(`\u5c0d\u624b\u767c\u8d77\u7a7a\u6b04\u4f4d\u5ba3\u544a\u9032\u653b\uff1a\u661f\u661f\u6230\u7dda${attIdx + 1}\uff0c\u5c0d\u624b\u0020${unitName(attacker)}`);
        }
        render();
      }
    } else if (data.action === "attack_cancel") {
      const attZone = data.attZone;
      const attIdx = data.attIdx;
      const attacker = field[attZone][attIdx];
      if (attacker) {
        attacker.attacking = false;
        attacker.target = null;
        attacker.tapped = false;
        logBattle(`\u5c0d\u624b\u53d6\u6d88\u5ba3\u544a\u9032\u653b\uff1a\u661f\u661f\u6230\u7dda${attIdx + 1}`);
        let enemyAttackCount = 0;
        ["enemy_front", "enemy_back"].forEach(z => {
          field[z].forEach(u => {
            if (u && u.attacking) enemyAttackCount++;
          });
        });
        window.XLW_DEFENSE_RULE.playerNeedsDefense = enemyAttackCount > 0;
        render();
      }
    } else if (data.action === "end_turn") {
      // 換到我方回合
      isMyTurn = true;
      turn = data.next_turn;
      window.XLW_turnSneakCount = 0;
      normalSummonUsed = false;
      tacticalSummonUsed = false;
      playerUntap();
      
      // 動態更新對手的手牌與牌庫張數（對手回補抽了 2 張）
      if (window.XLW_ENEMY.hand) {
        for (let i = 0; i < 2; i++) window.XLW_ENEMY.hand.push(null);
      }
      if (window.XLW_ENEMY.deck) {
        for (let i = 0; i < 2; i++) window.XLW_ENEMY.deck.pop();
      }

      draw(2);
      
      let enemyHasAttackers = false;
      ["enemy_front", "enemy_back"].forEach(zone => {
        field[zone].forEach(u => {
          if (u && u.attacking) enemyHasAttackers = true;
        });
      });

      if (window.XLW_DEFENSE_RULE.playerNeedsDefense && enemyHasAttackers) {
        phase = "\u9632\u5b88\u968e\u6bb5";
        setStatus(`\u7b2c ${turn} \u56de\u5408開始，已自動抽2張。前一回合對手有進攻宣言，自動進入「防守階段」！`);
        render();
        setTimeout(() => {
          xlwResolvePlayerDefensePhase();
        }, 500);
      } else {
        const wasPending = window.XLW_DEFENSE_RULE.playerNeedsDefense;
        window.XLW_DEFENSE_RULE.playerNeedsDefense = false;
        phase = "\u53ec\u559a\u968e\u6bb5";
        setStatus(`\u7b2c ${turn} \u56de\u5408\u958b\u59cb，已自\u52d5抽2\u5f35。`);
        if (wasPending) {
          logBattle("\u6211\u65b9\u9632\u5b88階\u6bb5\u958b\u59cb\u524d，因對手無進攻單位，跳過防守階段。");
        }
        render();
      }
    } else if (data.action === "sync_deck") {
      window.XLW_ENEMY.deckName = data.deck_name;
      logBattle(`對手選擇了牌組種族：${data.deck_name}`);
      render();
    } else if (data.action === "trigger_opponent_discard") {
      if (hand.length > 0) {
        const idx = Math.floor(Math.random() * hand.length);
        const discarded = hand.splice(idx, 1)[0];
        graveyard.push(discarded);
        logBattle(`🥷 變裝喵 效果：對手變裝喵偷襲成功，我方被迫隨機捨棄了手牌中的 ${discarded.name}！`);
        ws.send(JSON.stringify({
          action: "sync_discard_log",
          card_name: discarded.name
        }));
        render();
      }
    } else if (data.action === "sync_discard_log") {
      logBattle(`🥷 變裝喵 效果：對手隨機捨棄了手牌中的 ${data.card_name}！`);
      if (window.XLW_ENEMY.hand && window.XLW_ENEMY.hand.length > 0) {
        window.XLW_ENEMY.hand.pop();
      }
      render();
    }
  };
}

// ===== 21. 小旅人 3D 躍出森林軌跡飛行特效 =====
function playTravelerSummonAnimation(fromForestId, toZone, toIdx) {
  window.XLW_animatingSlots = window.XLW_animatingSlots || new Set();
  const key = `${toZone}:${toIdx}`;
  window.XLW_animatingSlots.add(key);
  render(); // 重繪讓對應格子中的卡牌先處於隱藏狀態

  const forestEl = document.querySelector(fromForestId);
  const targetSlot = document.querySelector(`[data-zone="${toZone}"][data-index="${toIdx}"]`);
  
  if (!forestEl || !targetSlot) {
    window.XLW_animatingSlots.delete(key);
    render();
    return;
  }

  // 取得森林立體小人（或整個森林區域）和目標格子的視埠坐標
  const standeeEl = forestEl.querySelector(".traveler-3d-standee") || forestEl;
  const forestRect = standeeEl.getBoundingClientRect();
  const targetRect = targetSlot.getBoundingClientRect();

  // 計算網頁絕對定位坐標，避免滾動條或定位父階造成的偏移
  const startX = forestRect.left + window.scrollX;
  const startY = forestRect.top + window.scrollY;
  const startW = forestRect.width || 55;
  const startH = forestRect.height || 80;

  const destX = targetRect.left + window.scrollX;
  const destY = targetRect.top + window.scrollY;
  const destW = targetRect.width;
  const destH = targetRect.height;

  // 創建飛行中的 3D 小旅人複製品
  const flyEl = document.createElement("div");
  flyEl.style.position = "absolute";
  flyEl.style.left = `${startX}px`;
  flyEl.style.top = `${startY}px`;
  flyEl.style.width = `${startW}px`;
  flyEl.style.height = `${startH}px`;
  flyEl.style.zIndex = "20000";
  flyEl.style.pointerEvents = "none";
  flyEl.style.transition = "all 0.85s cubic-bezier(0.25, 1, 0.5, 1)";
  
  // 初始化 3D 站立姿態
  flyEl.style.transform = "perspective(800px) translateZ(30px) rotateX(-15deg) scale(1)";
  flyEl.style.filter = "drop-shadow(0 15px 25px rgba(0, 255, 127, 0.8))";
  flyEl.style.borderRadius = "8px";
  flyEl.style.border = "2.5px solid rgba(0, 255, 127, 0.9)";
  flyEl.style.boxShadow = "0 0 30px rgba(0, 255, 127, 0.75), inset 0 0 15px rgba(0, 255, 127, 0.4)";
  flyEl.style.overflow = "hidden";
  flyEl.style.background = "#eadfc0";
  
  flyEl.innerHTML = `<img src="/static/little_traveler.jpeg" style="width: 100%; height: 100%; object-fit: cover; display: block;">`;
  document.body.appendChild(flyEl);

  // 強制重繪
  flyEl.offsetHeight;

  // 設定飛行目的地定位與 3D 翻轉（模擬從森林立體紙雕跳出，在空中 360 度迴旋，最終平貼於卡牌格上）
  flyEl.style.left = `${destX}px`;
  flyEl.style.top = `${destY}px`;
  flyEl.style.width = `${destW}px`;
  flyEl.style.height = `${destH}px`;
  flyEl.style.transform = "perspective(800px) translateZ(0px) rotate(360deg) scale(1)";

  setTimeout(() => {
    // 降落時觸發卡片格子綠色閃光特效
    targetSlot.classList.add("xlw-summon-flash-green");

    // 移除動態元素，釋放鎖定並重置渲染
    flyEl.remove();
    window.XLW_animatingSlots.delete(key);
    render();

    // 動態移除綠色閃光類別
    setTimeout(() => {
      targetSlot.classList.remove("xlw-summon-flash-green");
    }, 450);
  }, 850);
}

async function triggerSneakAttackSuccessEffects(card) {
  if (!card) return;
  
  // 1. \u200b\u5f9e\u6b64\u958b\u59cb\u8a18\u9304\u5077\u8972\u6210\u529f\u6b21\u6578
  window.XLW_turnSneakCount = (window.XLW_turnSneakCount || 0) + 1;
  logBattle(`\ud83e\udd77 \u5077\u8972\u6210\u529f\uff01\u622c\u56de\u5408\u7d2f\u8a08\u5077\u8972\u6210\u529f\u6b21\u6578\uff1a${window.XLW_turnSneakCount} \u6b21\u3002`);
  
  const executedEffects = new Set();
  
  while (true) {
    const choices = [];
    
    // (a) Black Meow (\u9ed1\u55b5)
    if ((card.id === "CAT_0011" || card.id === "R-CAT-0011" || card.id === "CAT_012" || card.name.includes("\u9ed1\u55b5")) && !executedEffects.has("black_meow")) {
      let hasEnemy = false;
      for (const zone of ["enemy_front", "enemy_back"]) {
        if (field[zone].some(u => u !== null)) hasEnemy = true;
      }
      if (hasEnemy) {
        choices.push({ text: "\ud83e\udd77 \u9ed1\u55b5\uff1a\u9078\u64c7\u7834\u58bad\u5c0d\u624b\u4e00\u500b\u55ae\u4f4d", value: "black_meow" });
      }
    }
    
    // (b) Zombie Meow (\u6bad\u5c4d\u55b5)
    if ((card.id === "CAT_003" || card.id === "R-CAT-0044" || card.name.includes("\u6bad\u5c4d\u55b5")) && !executedEffects.has("zombie_meow")) {
      const isMeowCard = (c) => c && (c.deck === "\u55b5\u55b5\u8cca" || c.faction === "\u55b5\u55b5\u8cca" || (c.id && (String(c.id).includes("CAT") || String(c.id).includes("cat"))));
      const meowCardsInHand = hand.filter(isMeowCard);
      const meowUnitsInGraveyard = graveyard.filter(c => c && c.type === "unit" && isMeowCard(c));
      if (meowCardsInHand.length > 0 && meowUnitsInGraveyard.length > 0) {
        choices.push({ text: "\u2623 \u6bad\u5c4d\u55b5\uff1a\u6368\u68c4 1 \u5f35\u624b\u724c\u4e26\u56de\u6536\u589b\u5730 1 \u55ae\u4f4d", value: "zombie_meow" });
      }
    }
    
    // (c) Medical Meow (\u91ab\u7642\u55b5)
    if ((card.id === "CAT_0023" || card.name.includes("\u91ab\u7642\u55b5")) && !executedEffects.has("medical_meow")) {
      const isMeowCard = (c) => c && (c.deck === "\u55b5\u55b5\u8cca" || c.faction === "\u55b5\u55b5\u8cca" || (c.id && (String(c.id).includes("CAT") || String(c.id).includes("cat"))));
      const meowUnitsInGraveyard = graveyard.filter(c => c && c.type === "unit" && isMeowCard(c));
      let emptySlots = [];
      for (const zone of ["player_front", "player_back"]) {
        for (let i = 0; i < 5; i++) {
          if (!field[zone][i]) emptySlots.push({ zone, idx: i });
        }
      }
      if (meowUnitsInGraveyard.length > 0 && emptySlots.length > 0) {
        choices.push({ text: "\ud83c\udfe5 \u91ab\u7642\u55b5\uff1a\u5fa9\u6d3b\u81f3\u591a 2 \u500b\u589b\u5730\u55b5\u55ae\u4f4d\u81f3\u6211\u65b9\u7a7a\u683c", value: "medical_meow" });
      }
    }
    
    // (d) Brawler Meow (\u6253\u624b\u55b5)
    if ((card.id === "CAT_0050" || card.name.includes("\u6253\u624b\u55b5")) && !executedEffects.has("brawler_meow")) {
      choices.push({ text: "\ud83e\udd77 \u6253\u624b\u55b5\uff1a\u6211\u65b9\u984d\u5916\u5206\u657a +1\u2605", value: "brawler_meow" });
    }
    
    // (e) Bomb Meow (\u70b8\u5f48\u55b5)
    if ((card.id === "CAT_009" || card.name.includes("\u70b8\u5f48\u55b5")) && !executedEffects.has("bomb_meow")) {
      const isMeowCard = (c) => c && (c.deck === "\u55b5\u55b5\u8cca" || c.faction === "\u55b5\u55b5\u8cca" || (c.id && (String(c.id).includes("CAT") || String(c.id).includes("cat"))));
      const meowCardsInGraveyard = graveyard.filter(isMeowCard);
      if (meowCardsInGraveyard.length > 0) {
        choices.push({ text: "\ud83d\udca5 \u70b8\u5f48\u55b5\uff1a\u9664\u5916\u6211\u65b9\u5893\u5730\u81f3\u591a 2 \u5f35\u55b5\u55b5\u5361\u724c", value: "bomb_meow" });
      }
    }
    
    // (f) Caitlyn (\u51f1\u7279\u7433)
    let hasCaitlynOnField = false;
    for (const zone of ["player_front", "player_back"]) {
      for (let i = 0; i < 5; i++) {
        const u = field[zone][i];
        if (u && (u.card?.id === "CAT_0052" || u.card?.id === "R-CAT-0052" || u.card?.name.includes("\u51f1\u7279\u7433"))) {
          hasCaitlynOnField = true;
          break;
        }
      }
      if (hasCaitlynOnField) break;
    }
    if ((card.id === "CAT_0052" || card.id === "R-CAT-0052" || card.name.includes("\u51f1\u7279\u7433") || hasCaitlynOnField) && !executedEffects.has("caitlyn")) {
      const pts = window.XLW_turnSneakCount || 1;
      choices.push({ text: "\ud83d\udc51 \u51f1\u7279\u7433\uff1a\u9023\u64ca\u52a0\u5206 + " + pts + " \u2605", value: "caitlyn" });
    }
    
    // (g) Hand link summons
    let hasEmptySlot = false;
    for (const zone of ["player_front", "player_back"]) {
      if (field[zone].some(u => u === null)) {
        hasEmptySlot = true;
        break;
      }
    }
    
    if (hasEmptySlot) {
      const isMeowSummonCard = (c) => {
        if (!c) return false;
        const cid = c.id;
        if (cid === "CAT-0003" || cid === "CAT_015" || c.name.includes("\u9a5a\u559c\u55b5") ||
            cid === "CAT-0008" || cid === "CAT_013" || c.name.includes("\u8001\u55b5") ||
            cid === "CAT-0032" || cid === "SR-CAT-0032" || c.name.includes("\u6b21\u5143\u7a81\u64ca\u55b5") ||
            cid === "CAT_0050" || c.name.includes("\u6253\u624b\u55b5") ||
            cid === "CAT_005" || c.name.includes("\u7da0\u55b5")) {
          return true;
        }
        if ((cid === "CAT_0052" || cid === "R-CAT-0052" || c.name.includes("\u51f1\u7279\u7433")) && window.XLW_turnSneakCount >= 2) {
          return true;
        }
        return false;
      };
      
      hand.forEach((c, idx) => {
        if (isMeowSummonCard(c) && !executedEffects.has(`hand_summon_${c.id}_${idx}`)) {
          choices.push({ text: `\ud83d\udc08 \u624b\u724c\u9023\u52d5\uff1a\u53ec\u55b5\u624b\u724c\u7684 ${c.name}`, value: `hand_summon_${idx}` });
        }
      });
    }
    
    if (choices.length === 0) {
      break;
    }
    
    choices.push({ text: "\u274c \u7d50\u675f / \u4e0d\u767c\u52d5\u5269\u9918\u6548\u679c", value: "end_effects" });
    
    const chosen = await showXLWChoiceModal(
      "\ud83e\udd77 \u5077\u8972\u6210\u529f\u9023\u52d5\u6548\u679c\u8a15\u555f",
      "\u8acb\u9078\u64c7\u63a5\u4e0b\u4f86\u8981\u512a\u5148\u767c\u52d5\u7684\u9023\u52d5\u6548\u679c\uff0c\u621f\u9078\u64c7\u7d50\u675f\u9023\u52d5\uff1a",
      choices
    );
    
    if (chosen === "end_effects" || !chosen) {
      break;
    }
    
    if (chosen === "black_meow") {
      executedEffects.add("black_meow");
      window.XLW_blackCatChoosing = true;
      setStatus("\ud83e\udd77 \u8acb\u9ede\u9078\u6575\u65b9\u5834\u4e0a\u4e00\u500b\u55ae\u4f4d\u9032\u884c\u7834\u58bad\uff01");
      render();
      await new Promise(r => { window.XLW_blackCatResolve = r; });
    } else if (chosen === "zombie_meow") {
      executedEffects.add("zombie_meow");
      const isMeowCard = (c) => c && (c.deck === "\u55b5\u55b5\u8cca" || c.faction === "\u55b5\u55b5\u8cca" || (c.id && (String(c.id).includes("CAT") || String(c.id).includes("cat"))));
      const meowCardsInHand = hand.filter(isMeowCard);
      const meowUnitsInGraveyard = graveyard.filter(c => c && c.type === "unit" && isMeowCard(c));
      if (meowCardsInHand.length > 0 && meowUnitsInGraveyard.length > 0) {
        const discardCard = meowCardsInHand[0];
        const discardIdx = hand.indexOf(discardCard);
        if (discardIdx >= 0) {
          hand.splice(discardIdx, 1);
          graveyard.push(discardCard);
          logBattle(`\u2623 \u6bad\u5c4d\u55b5 \u6548\u679c\uff1a\u6211\u65b9\u4e3b\u52d5\u6368\u68c4\u624b\u724c\u4e2d\u7684 ${discardCard.name}\u3002`);
          
          const recoverCard = meowUnitsInGraveyard[0];
          const recoverIdx = graveyard.indexOf(recoverCard);
          if (recoverIdx >= 0) {
            graveyard.splice(recoverIdx, 1);
            hand.push(recoverCard);
            logBattle(`\u2623 \u6bad\u5c4d\u55b5 \u6548\u679c\uff1a\u6210\u529f\u5f9e\u5893\u5730\u5c07 ${recoverCard.name} \u53ec\u56de\u624b\u724c\uff01`);
          }
          render();
        }
      }
    } else if (chosen === "medical_meow") {
      executedEffects.add("medical_meow");
      const isMeowCard = (c) => c && (c.deck === "\u55b5\u55b5\u8cca" || c.faction === "\u55b5\u55b5\u8cca" || (c.id && (String(c.id).includes("CAT") || String(c.id).includes("cat"))));
      const meowUnitsInGraveyard = graveyard.filter(c => c && c.type === "unit" && isMeowCard(c));
      let emptySlots = [];
      for (const zone of ["player_front", "player_back"]) {
        for (let i = 0; i < 5; i++) {
          if (!field[zone][i]) emptySlots.push({ zone, idx: i });
        }
      }
      if (meowUnitsInGraveyard.length > 0 && emptySlots.length > 0) {
        const countToRevive = Math.min(2, meowUnitsInGraveyard.length, emptySlots.length);
        for (let i = 0; i < countToRevive; i++) {
          const unitToRevive = meowUnitsInGraveyard[i];
          const slot = emptySlots[i];
          
          const graveIdx = graveyard.indexOf(unitToRevive);
          if (graveIdx >= 0) graveyard.splice(graveIdx, 1);
          
          field[slot.zone][slot.idx] = {
            card: unitToRevive,
            tapped: false,
            attacking: false,
            target: null
          };
          logBattle(`\ud83c\udfe5 \u91ab\u7642\u55b5 \u6548\u679c\uff1a\u6210\u529f\u5c07 ${unitToRevive.name} \u5f9e\u5893\u5730\u5fa9\u6d3b\u81f3\u6211\u65b9\u5834\u4e0a [${slot.zone === "player_front" ? "\u524d\u6392" : "\u5f8c\u6392"}] \u7684\u7b2c ${slot.idx + 1} \u683c\u3002`);
        }
        render();
      }
    } else if (chosen === "brawler_meow") {
      executedEffects.add("brawler_meow");
      playerBonusScore += 1;
      logBattle(`\ud83e\udd77 \u6253\u624b\u55b5 \u6548\u679c\u767c\u52d5\uff1a\u6211\u65b9\u984d\u5916\u5206\u657a +1\u2605\u3002`);
      renderScore();
    } else if (chosen === "bomb_meow") {
      executedEffects.add("bomb_meow");
      const isMeowCard = (c) => c && (c.deck === "\u55b5\u55b5\u8cca" || c.faction === "\u55b5\u55b5\u8cca" || (c.id && (String(c.id).includes("CAT") || String(c.id).includes("cat"))));
      const meowCardsInGraveyard = graveyard.filter(isMeowCard);
      if (meowCardsInGraveyard.length > 0) {
        const countToRemove = Math.min(2, meowCardsInGraveyard.length);
        let removedNames = [];
        for (let i = 0; i < countToRemove; i++) {
          const cardToRemove = meowCardsInGraveyard[i];
          const idxInGrave = graveyard.indexOf(cardToRemove);
          if (idxInGrave >= 0) {
            graveyard.splice(idxInGrave, 1);
            removedNames.push(cardToRemove.name);
          }
        }
        logBattle(`\ud83d\udca5 \u70b8\u5f48\u55b5 \u6548\u679c\u767c\u52d5\uff1a\u9664\u5916\u6211\u65b9\u5893\u5730\u4e2d\u7684 ${removedNames.join(", ")}\u3002`);
        render();
      }
    } else if (chosen === "caitlyn") {
      executedEffects.add("caitlyn");
      const pts = window.XLW_turnSneakCount || 1;
      playerBonusScore += pts;
      logBattle(`\ud83d\udc51 \u9ed1\u5e6b\u9996\u55b5 \u51f1\u7279\u7433 \u6548\u679c\u767c\u52d5\uff1a\u672c\u56de\u5408\u5df2\u7d2f\u8a08\u5077\u8972 ${pts} \u6b21\uff0c\u6211\u65b9\u984d\u5916\u5206\u657a +${pts}\u2605\u3002`);
      renderScore();
    } else if (chosen.startsWith("hand_summon_")) {
      const idx = parseInt(chosen.replace("hand_summon_", ""));
      const extraCard = hand[idx];
      if (extraCard) {
        executedEffects.add(`hand_summon_${extraCard.id}_${idx}`);
        window.XLW_bypassNormalSummonLimit = true;
        selectedHandForSummon = idx;
        setStatus(`\u3010\u9023\u52d5\u984d\u5916\u53ec\u5595\u3011\u8acb\u9ede\u9078\u6211\u65b9\u4e00\u500b\u7a7a\u683c\u653e\u7f6e <b>${extraCard.name}</b>\uff01`);
        render();
        await new Promise(r => { window.XLW_summonPlacementResolve = r; });
      }
    }
  }

  // \u8b8a\u88dd\u55b5 (CAT_012) \u2014\u2014 \u5f37\u5236\u96a8\u6a5f\u6368\u724c (\u7368\u7acb\u653e\u5728\u4e3b\u52d5\u9078\u64c7\u4e4b\u591a)
  if (card.id === "CAT_012" || card.name.includes("\u8b8a\u88dd\u55b5")) {
    if (isMultiplayer) {
      ws.send(JSON.stringify({ action: "trigger_opponent_discard" }));
      logBattle("\ud83e\udd77 \u8b8a\u88dd\u55b5 \u6548\u679c\uff1a\u5df2\u5411\u5c0d\u624b\u767c\u9001\u96a8\u6a5f\u6368\u68c4\u624b\u724c\u6307\u4ee4\u3002");
    } else {
      if (window.XLW_ENEMY.hand && window.XLW_ENEMY.hand.length > 0) {
        const idx = Math.floor(Math.random() * window.XLW_ENEMY.hand.length);
        const discarded = window.XLW_ENEMY.hand.splice(idx, 1)[0];
        enemyGraveyard.push(discarded);
        logBattle(`\ud83e\udd77 \u8b8a\u88dd\u55b5 \u6548\u679c\uff1a\u5c0d\u624b\u88ab\u5f37\u5236\u96a8\u6a5f\u6368\u68c4\u4e86\u624b\u724c\u4e2d\u7684 ${discarded.name}\uff01`);
        render();
      } else {
        logBattle("\ud83e\udd77 \u8b8a\u88dd\u55b5 \u6548\u679c\uff1a\u5c0d\u624b\u624b\u724c\u5df2\u7a7a\uff0c\u7121\u5361\u724c\u53ef\u6368\u68c4\u3002");
      }
    }
  }

  render();
}


function createDebugPanel() {
  let panel = document.getElementById("xlwDebugPanel");
  if (panel) return;

  panel = document.createElement("div");
  panel.id = "xlwDebugPanel";
  panel.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 20px;
    width: 380px;
    height: 220px;
    background: rgba(12, 8, 8, 0.93);
    border: 1.5px solid rgba(255, 215, 106, 0.45);
    border-radius: 12px;
    z-index: 100000;
    color: #00ff7f;
    font-family: 'Courier New', monospace;
    font-size: 11.5px;
    padding: 12px;
    overflow-y: auto;
    box-shadow: 0 10px 30px rgba(0,0,0,0.85);
    backdrop-filter: blur(10px);
    pointer-events: auto;
  `;
  
  const title = document.createElement("div");
  title.style.cssText = "font-weight: 800; border-bottom: 1.5px solid rgba(255,215,106,0.25); margin-bottom: 8px; padding-bottom: 4px; color: #ffd76a; display: flex; justify-content: space-between;";
  title.innerHTML = "<span>⚙️ XLW REAL-TIME DEBUG LOGGER</span><span style='cursor:pointer;color:#ff4d4f;' onclick='document.getElementById(\"xlwDebugPanel\").remove()'>[關閉]</span>";
  panel.appendChild(title);

  const list = document.createElement("div");
  list.id = "xlwDebugList";
  list.style.cssText = "display: flex; flex-direction: column; gap: 5px; height: calc(100% - 25px); overflow-y: auto;";
  panel.appendChild(list);

  document.body.appendChild(panel);
}

window.logDebug = function(msg) {
  createDebugPanel();
  const list = document.getElementById("xlwDebugList");
  if (!list) return;

  const div = document.createElement("div");
  div.style.cssText = "border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 3px; word-break: break-all; line-height: 1.4;";
  const time = new Date().toLocaleTimeString();
  div.innerHTML = `<span style='color: #ffd76a; font-weight: bold;'>[${time}]</span> <span style='color: #00ff7f;'>${msg}</span>`;
  list.appendChild(div);

  // 自動捲動到最底部
  list.scrollTop = list.scrollHeight;
}

// ===== 22. 獻祭召喚 3D 震撼酷炫特效 =====
window.XLW_animatingTributeSlots = window.XLW_animatingTributeSlots || new Set();
window.XLW_slamTributeCards = window.XLW_slamTributeCards || new Set();

function playTributeSummonAnimation(zone, idx) {
  const key = `${zone}:${idx}`;
  window.XLW_animatingTributeSlots.add(key);
  
  // 1. 先重繪，讓格子卡牌暫時隱藏，播放魔法陣與光束特效
  render();
  
  // 2. 獲取格子元素與視埠坐標以精確定位
  const targetSlot = document.querySelector(`[data-zone="${zone}"][data-index="${idx}"]`);
  if (!targetSlot) {
    window.XLW_animatingTributeSlots.delete(key);
    render();
    return;
  }
  
  const rect = targetSlot.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2 + window.scrollX;
  const centerY = rect.top + rect.height / 2 + window.scrollY;
  
  // 3. 創建金黃色巨型旋轉魔法陣（用絕對定位置於 body 中，突破 slot 邊界剪裁）
  const portal = document.createElement("div");
  portal.className = "xlw-tribute-portal-circle-large";
  portal.style.left = `${centerX}px`;
  portal.style.top = `${centerY}px`;
  document.body.appendChild(portal);
  
  // 4. 創建巨型沖天能量光柱
  const pillar = document.createElement("div");
  pillar.className = "xlw-tribute-energy-pillar-large";
  pillar.style.left = `${centerX}px`;
  pillar.style.top = `${centerY + 40}px`; // 置於落點底座位置
  document.body.appendChild(pillar);
  
  // 5. 750ms 後魔法陣與光柱消散，大門敞開，大怪震撼登場！
  setTimeout(() => {
    portal.remove();
    pillar.remove();
    
    // 釋放隱藏狀態，切換為 Slam 入場狀態
    window.XLW_animatingTributeSlots.delete(key);
    window.XLW_slamTributeCards.add(key);
    
    // 重繪顯示卡牌
    render();
    
    // 6. 全屏耀眼黃金閃光（Color Dodge 模式，帶來極強的史詩神格感）
    const flash = document.createElement("div");
    flash.className = "xlw-screen-flash-gold";
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 400);
    
    // 7. 膨脹爆裂衝擊波能量環
    const wave = document.createElement("div");
    wave.className = "xlw-shockwave-ring";
    wave.style.left = `${centerX}px`;
    wave.style.top = `${centerY}px`;
    document.body.appendChild(wave);
    setTimeout(() => wave.remove(), 600);
    
    // 8. 重擊震地：在格子加上 slam-shake 類別
    targetSlot.classList.add("xlw-tribute-slam-shake");
    
    // 9. 噴射大量金黃色與紫色閃耀星星/粒子（結合 ✨、⭐ 矢量與高光發光顆粒）
    for (let i = 0; i < 30; i++) {
      const p = document.createElement("div");
      p.className = "xlw-tribute-particle-super";
      p.style.left = `${centerX}px`;
      p.style.top = `${centerY}px`;
      
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 160 + 60;
      const destX = centerX + Math.cos(angle) * distance;
      const destY = centerY + Math.sin(angle) * distance - (Math.random() * 50 + 20);
      
      const randType = Math.random();
      if (randType < 0.35) {
        p.innerHTML = "✨";
        p.style.fontSize = `${Math.random() * 18 + 14}px`;
        p.style.textShadow = "0 0 15px #ffd700, 0 0 30px #ffe066, 0 0 45px #fff";
      } else if (randType < 0.65) {
        p.innerHTML = "⭐";
        p.style.fontSize = `${Math.random() * 14 + 10}px`;
        p.style.textShadow = "0 0 15px #ff8c00, 0 0 25px #ffd700";
      } else {
        // 高亮度發光黃金菱形亮片
        const size = Math.random() * 12 + 8;
        p.style.width = `${size}px`;
        p.style.height = `${size}px`;
        p.style.background = "linear-gradient(135deg, #fff 0%, #ffd700 50%, #ff8c00 100%)";
        p.style.boxShadow = "0 0 15px #ffd700, 0 0 30px #ff8c00, 0 0 45px #fff";
        p.style.borderRadius = "2px";
        p.style.transform = "translate(-50%, -50%) rotate(45deg)";
      }
      
      document.body.appendChild(p);
      
      p.style.transition = "all 1.1s cubic-bezier(0.1, 0.8, 0.2, 1)";
      p.offsetHeight; // 強制重繪
      
      p.style.left = `${destX}px`;
      p.style.top = `${destY}px`;
      p.style.transform = `translate(-50%, -50%) rotate(${Math.random() * 720 - 360}deg) scale(0)`;
      p.style.opacity = "0";
      
      setTimeout(() => p.remove(), 1100);
    }
    
    // 10. 移除震地類別
    setTimeout(() => {
      targetSlot.classList.remove("xlw-tribute-slam-shake");
    }, 450);
    
    // 11. 移除卡牌 Slam 標記以防後續重繪重複觸發
    setTimeout(() => {
      window.XLW_slamTributeCards.delete(key);
      render();
    }, 850);
  }, 750);
}

// 啟動對戰引擎
// ===== 23. 喵喵賊 偷襲效果與連動確認彈窗引擎 =====
function showXLWConfirm(title, message, confirmText = "確認", cancelText = "取消") {
  return new Promise((resolve) => {
    // 創建奢華遮罩層
    const overlay = document.createElement("div");
    overlay.className = "xlw-premium-confirm-overlay";
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.85);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      backdrop-filter: blur(8px);
    `;

    // 創建玻璃擬態對話盒
    const box = document.createElement("div");
    box.style.cssText = `
      background: linear-gradient(135deg, #1d1816 0%, #110e0d 100%);
      border: 2px solid var(--gold-accent);
      border-radius: 16px;
      width: 420px;
      max-width: 90vw;
      padding: 24px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.95), 0 0 20px rgba(205, 170, 82, 0.4);
      text-align: center;
      transform: scale(0.85);
      animation: xlwPopupScale 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    `;

    box.innerHTML = `
      <div style="font-size: 20px; font-weight: 900; color: #ffd76a; text-shadow: 0 0 10px rgba(255, 215, 106, 0.6); margin-bottom: 12px;">${title}</div>
      <div style="font-size: 14px; color: #c4b9a6; line-height: 1.6; margin-bottom: 24px;">${message}</div>
      <div style="display: flex; gap: 16px; justify-content: center;">
        <button id="xlwConfirmYes" class="forest-summon-btn" style="padding: 10px 24px; font-size: 13px; min-width: 120px;">${confirmText}</button>
        <button id="xlwConfirmNo" class="stable-action-btn tribute-cancel" style="padding: 10px 24px; font-size: 13px; min-width: 120px; border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.05); color: #fff;">${cancelText}</button>
      </div>
    `;

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    // 事件監聽
    overlay.querySelector("#xlwConfirmYes").onclick = () => {
      overlay.remove();
      resolve(true);
    };
    overlay.querySelector("#xlwConfirmNo").onclick = () => {
      overlay.remove();
      resolve(false);
    };
  });
}

function showXLWChoiceModal(title, message, options) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "xlw-premium-choice-overlay";
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.85);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      backdrop-filter: blur(8px);
    `;

    const box = document.createElement("div");
    box.style.cssText = `
      background: linear-gradient(135deg, #1d1816 0%, #110e0d 100%);
      border: 2px solid var(--gold-accent);
      border-radius: 16px;
      width: 480px;
      max-width: 90vw;
      padding: 24px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.95), 0 0 20px rgba(205, 170, 82, 0.4);
      text-align: center;
      transform: scale(0.85);
      animation: xlwPopupScale 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    `;

    let buttonsHTML = "";
    options.forEach((opt) => {
      const isEnd = opt.value === "end_effects";
      const btnStyle = isEnd
        ? "background: rgba(255, 255, 255, 0.05); color: #c4b9a6; border: 1px solid rgba(255, 255, 255, 0.15);"
        : "background: rgba(205, 170, 82, 0.15); color: #ffd76a; border: 1.5px solid var(--gold-accent);";
      buttonsHTML += `
        <button class="xlw-choice-btn" data-value="${opt.value}" style="width: 100%; padding: 12px; font-size: 14px; margin-bottom: 10px; border-radius: 8px; font-weight: bold; cursor: pointer; transition: all 0.2s ease; ${btnStyle}">
          ${opt.text}
        </button>
      `;
    });

    box.innerHTML = `
      <div style="font-size: 20px; font-weight: 900; color: #ffd76a; text-shadow: 0 0 10px rgba(255, 215, 106, 0.6); margin-bottom: 12px;">${title}</div>
      <div style="font-size: 14px; color: #c4b9a6; line-height: 1.6; margin-bottom: 20px;">${message}</div>
      <div style="display: flex; flex-direction: column; max-height: 300px; overflow-y: auto; padding-right: 4px;">
        ${buttonsHTML}
      </div>
    `;

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    const cleanup = (val) => {
      overlay.remove();
      resolve(val);
    };

    box.querySelectorAll(".xlw-choice-btn").forEach(btn => {
      btn.onclick = () => {
        cleanup(btn.dataset.value);
      };
      btn.onmouseenter = () => {
        btn.style.filter = "brightness(1.2)";
        btn.style.transform = "translateY(-1px)";
      };
      btn.onmouseleave = () => {
        btn.style.filter = "none";
        btn.style.transform = "none";
      };
    });
  });
}

// ===== 新增：墓地渲染與對戰倒數機制 =====

function renderGraveyard(zoneId, graveList, label) {
  const zone = $(zoneId);
  if (!zone) return;
  zone.innerHTML = "";
  
  if (graveList.length === 0) {
    zone.className = "zone side dark";
    zone.innerHTML = `<div style="text-align:center; padding-top:40px; color:rgba(255,255,255,0.4);">${label}<br>(空)</div>`;
    zone.onclick = null;
    return;
  }
  
  zone.className = "zone side dark has-card";
  
  // 取得最上層卡片
  const topCard = graveList[graveList.length - 1];
  
  const cardEl = document.createElement("div");
  cardEl.className = "card";
  cardEl.style.width = "100%";
  cardEl.style.height = "100%";
  
  const metaText = topCard.type === "unit"
    ? `攻 ${getUnitAtk(topCard)} | 星 ${getUnitStars(topCard)}`
    : `魔法`;
    
  if (topCard.image) {
    cardEl.innerHTML = `<img src="${topCard.image}" alt="${topCard.name}"><div class="mini-meta">${topCard.name}<br>${metaText} (${graveList.length}張)</div>`;
  } else {
    cardEl.innerHTML = `<div class="fallback" style="font-size:10px;"><b>${topCard.name}</b><br>${metaText} (${graveList.length}張)</div>`;
  }
  
  zone.onclick = (e) => {
    e.stopPropagation();
    showGraveyardDetailModal(label, graveList);
  };
  
  zone.appendChild(cardEl);
}

function showGraveyardDetailModal(title, graveList) {
  const overlay = document.createElement("div");
  overlay.className = "xlw-graveyard-detail-overlay";
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000000;
    backdrop-filter: blur(10px);
  `;
  
  const box = document.createElement("div");
  box.style.cssText = `
    background: linear-gradient(135deg, #181414 0%, #0d0a0a 100%);
    border: 2px solid var(--gold-accent);
    border-radius: 16px;
    width: 600px;
    max-width: 90vw;
    height: 500px;
    max-height: 80vh;
    padding: 24px;
    box-shadow: 0 12px 50px rgba(0, 0, 0, 0.95), 0 0 25px rgba(205, 170, 82, 0.45);
    display: flex;
    flex-direction: column;
  `;
  
  const header = document.createElement("div");
  header.style.cssText = `
    font-size: 22px;
    font-weight: 900;
    color: #ffd76a;
    text-shadow: 0 0 10px rgba(255, 215, 106, 0.5);
    margin-bottom: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1.5px solid rgba(255, 215, 106, 0.25);
    padding-bottom: 8px;
  `;
  header.innerHTML = `<span>🪦 ${title} 詳細內容 (${graveList.length}張)</span><span id="closeGraveModal" style="cursor:pointer; color:#ff4d4f; font-size: 24px;">&times;</span>`;
  box.appendChild(header);
  
  const listContainer = document.createElement("div");
  listContainer.style.cssText = `
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    justify-content: flex-start;
    padding: 10px;
    background: rgba(0, 0, 0, 0.4);
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.05);
  `;
  
  graveList.forEach((card, i) => {
    const cardEl = document.createElement("div");
    cardEl.className = "card";
    cardEl.style.width = "90px";
    cardEl.style.height = "120px";
    cardEl.style.position = "relative";
    cardEl.style.flex = "0 0 90px";
    
    const metaText = card.type === "unit"
      ? `攻 ${card.attack}`
      : `魔法`;
      
    if (card.image) {
      cardEl.innerHTML = `<img src="${card.image}"><div class="mini-meta" style="font-size: 8px; padding: 2px;">#${i+1} ${card.name}<br>${metaText}</div>`;
    } else {
      cardEl.innerHTML = `<div class="fallback" style="font-size:8px; padding: 4px;">#${i+1} <b>${card.name}</b><br>${metaText}</div>`;
    }
    
    cardEl.onmouseover = () => showModal(card);
    listContainer.appendChild(cardEl);
  });
  
  box.appendChild(listContainer);
  overlay.appendChild(box);
  document.body.appendChild(overlay);
  
  overlay.querySelector("#closeGraveModal").onclick = () => {
    overlay.remove();
  };
  overlay.onclick = (e) => {
    if (e.target === overlay) overlay.remove();
  };
}

function handleTurnEndCountdownLogic() {
  if (isGameOverFlag) return;

  if (!countdownActive) {
    const isPlayerDeckEmpty = (deck.length === 0);
    const isEnemyDeckEmpty = (window.XLW_ENEMY.deck && window.XLW_ENEMY.deck.length === 0);
    
    if (isPlayerDeckEmpty || isEnemyDeckEmpty) {
      countdownActive = true;
      countdownRemaining = 4;
      logBattle("⚠️ 偵測到有玩家牌組已空！進入生死倒數階段！中央星星戰線卡5已反灰。");
      render();
    }
  } else {
    countdownRemaining--;
    if (countdownRemaining === 0) {
      logBattle("⚠️ 星星戰線卡1已反灰！倒數結束，遊戲結束！");
      executeGameOverCalculations();
      return;
    } else {
      logBattle(`⚠️ 倒數階段：星星戰線卡${countdownRemaining + 1}已反灰！剩餘 ${countdownRemaining} 回合。`);
      render();
    }
  }
}

function executeGameOverCalculations() {
  isGameOverFlag = true;
  
  let playerStars = playerBonusScore;
  let playerFieldStars = 0;
  for (const zone of ["player_front", "player_back"]) {
    field[zone].forEach((u, i) => {
      if (u) {
        const uStars = getUnitStars(u, zone, i);
        playerStars += uStars;
        playerFieldStars += uStars;
      }
    });
  }
  
  let enemyStars = enemyBonusScore;
  let enemyFieldStars = 0;
  for (const zone of ["enemy_front", "enemy_back"]) {
    field[zone].forEach((u, i) => {
      if (u) {
        const uStars = getUnitStars(u, zone, i);
        enemyStars += uStars;
        enemyFieldStars += uStars;
      }
    });
  }
  
  let result = "DRAW";
  let msg = "平手";
  if (playerStars > enemyStars) { result = "VICTORY"; msg = "我方勝利！"; }
  else if (enemyStars > playerStars) { result = "DEFEAT"; msg = "對手勝利！"; }
  
  let panel = document.getElementById("xlwResultPanel");
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "xlwResultPanel";
    panel.className = "xlw-result-panel";
    document.body.appendChild(panel);
  }
  panel.innerHTML = `
    <div class="xlw-result-box" style="border-color: #ffd76a; background: linear-gradient(135deg, #1f1a18 0%, #110e0d 100%);">
      <div class="xlw-result-title" style="color: #ffd76a; text-shadow: 0 0 15px rgba(255, 215, 106, 0.5);">${result}</div>
      <div class="xlw-result-msg" style="color: #fff; font-size: 22px; font-weight: bold; margin-bottom: 20px;">${msg} (生死倒數結束)</div>
      <div class="xlw-result-score" style="font-size: 16px; line-height: 1.6; color: #fff;">
        我方 ${playerStars} ★ <small style="display: block; font-size: 12px; opacity: 0.85;">(場上單位: ${playerFieldStars} ★ | 額外加分: ${playerBonusScore} ★)</small>
        對手 ${enemyStars} ★ <small style="display: block; font-size: 12px; opacity: 0.85;">(場上單位: ${enemyFieldStars} ★ | 額外加分: ${enemyBonusScore} ★)</small>
      </div>
      <button onclick="document.getElementById('xlwResultPanel').classList.remove('show')" style="margin-top:20px; background: #cdaa52; color:#fff; border:1px solid #ffe6aa; border-radius:6px; padding: 8px 20px; cursor:pointer;">關閉</button>
    </div>
  `;
  panel.classList.add("show");
  logBattle(`遊戲結束！比分：我方 ${playerStars} ★ vs 對手 ${enemyStars} ★。${msg}`);
}

// 啟動對戰引擎
init();


function showCORSProtocolWarning() {
  const overlay = document.createElement("div");
  overlay.id = "xlwCorsWarningOverlay";
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(10, 7, 7, 0.96);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999999;
    backdrop-filter: blur(15px);
    font-family: 'Outfit', sans-serif;
  `;
  
  const box = document.createElement("div");
  box.style.cssText = `
    background: linear-gradient(135deg, #1d1412 0%, #0c0807 100%);
    border: 2px solid #ff4d4f;
    border-radius: 16px;
    width: 540px;
    max-width: 92vw;
    padding: 35px;
    box-shadow: 0 15px 50px rgba(255, 77, 79, 0.35);
    text-align: center;
  `;
  
  box.innerHTML = `
    <div style="font-size: 55px; margin-bottom: 15px;">⚠️</div>
    <div style="font-size: 24px; font-weight: bold; color: #ff4d4f; margin-bottom: 18px; text-shadow: 0 0 10px rgba(255,77,79,0.3);">請透過對戰伺服器開啟網址！</div>
    <div style="font-size: 14px; color: #c4b9a6; line-height: 1.8; text-align: left; margin-bottom: 25px; background: rgba(0,0,0,0.35); padding: 18px; border-radius: 10px; border: 1px solid rgba(255,77,79,0.25);">
      偵測到您目前是直接「雙擊打開」本機的 HTML 檔案 (<b>file://</b> 協議)。<br><br>
      由於現代瀏覽器的<b>安全性限制 (CORS)</b>，直接打開本地網頁將會被瀏覽器<b>拒絕載入</b>任何卡牌與對戰數據，進而導致介面完全空白（手牌、格子、計分板皆不見）。<br><br>
      <b>請改為在瀏覽器網址列輸入並前往以下網址（請先啟動伺服器）：</b><br>
      <a href="http://127.0.0.1:8000" target="_blank" style="color: #ffd76a; font-weight: 900; text-decoration: underline; font-size: 18px; display: inline-block; margin-top: 10px; letter-spacing: 0.5px;">http://127.0.0.1:8000</a>
    </div>
    <div style="display: flex; gap: 12px; justify-content: center;">
      <button onclick="window.open('http://127.0.0.1:8000')" style="background: linear-gradient(135deg, #ffd76a, #d4af37); color: #000; border: none; border-radius: 8px; padding: 12px 24px; font-size: 14px; font-weight: bold; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 15px rgba(255,215,106,0.3);">
        點擊前往伺服器網址
      </button>
    </div>
  `;
  
  overlay.appendChild(box);
  document.body.appendChild(overlay);
}

