async function triggerSneakAttackSuccessEffects(card) {
function createDebugPanel() {
window.logDebug = function(msg) {
function playTributeSummonAnimation(zone, idx) {
function showXLWConfirm(title, message, confirmText = "�T�{", cancelText = "�") {

--- Searching for 'EnemyDefense' or 'DefensePhase' in text ---
async function xlwResolveEnemyDefensePhaseSafe() {
await xlwResolveEnemyDefensePhaseSafe();

"
}

=== LINE 3189 ===
{
  "step_index": 3206,
  "source": "MODEL",
  "type": "RUN_COMMAND",
  "status": "DONE",
  "created_at": "2026-05-30T02:54:16Z",
  "content": "Created At: 2026-05-30T02:54:16Z
Completed At: 2026-05-30T02:54:18Z

\t\t\t\tThe command completed successfully.
\t\t\t\tOutput:
\t\t\t\t--- Print lines 1350 to 1420 of game_v8.js ---
window.XLW_ENEMY.hand.push(attacker.card);\

field[attZone][attIdx] = null;\

sneakMsg = `\uff0c\u4e14\u5c0d\u624b\u89f8\u767c\u300c\u5077\u8972\u300d\u6210\u529f\u6536\u56de\u5176\u624b\u724c`;\

}\

} else {\

// \u653b\u64ca\u65b9\u662f\u6211\u65b9\uff1a\u5f48\u51fa\u5962\u83ef\u78ba\u8a8d\u6846\u8b93\u73a9\u5bb6\u81ea\u884c\u9078\u64c7\u662f\u5426\u56de\u624b\uff01\

const userWantsRecall = await showXLWConfirm(\

"\U0001f977 \u5075\u6e2c\u5230\u3010\u5077\u8972\u3011\u5951\u6a5f\uff01",\

`\u6211\u65b9\u55ae\u4f4d <b>${unitName(attacker)}</b> \u9032\u653b\u6210\u529f\uff01<br>\u662f\u5426\u555f\u52d5\u300c\u5077\u8972\u300d\u5c07\u5176\u6536\u56de\u624b\u724c\u4e26\u89f8\u767c\u5077\u8972\u6210\u529f\u9023\u52d5\u6548\u679c\uff1f`,\

"\u78ba\u8a8d\u56de\u624b (\u555f\u52d5\u5077\u8972)",\

"\u7559\u5728\u5834\u4e0a (\u653e\u68c4\u56de\u624b)"\

);\

\

if (userWantsRecall) {\

hand.push(attacker.card);\

field[attZone][attIdx] = null;\

sneakMsg = `\uff0c\u4e14\u89f8\u767c\u300c\u5077\u8972\u300d\u6210\u529f\u6536\u56de\u6211\u65b9\u624b\u724c`;\

\

// \u6838\u5fc3\uff1a\u89f8\u767c\u300c\u5077\u8972\u6210\u529f\u300d\u7684\u4e00\u7cfb\u5217\u6548\u679c\uff01\

await triggerSneakAttackSuccessEffects(attacker.card);\

} else {\

// \u653e\u68c4\u56de\u624b\uff0c\u7559\u5728\u5834\u4e0a\u4e26\u8655\u65bc\u75b2\u52de\u72c0\u614b\

attacker.tapped = true;\

attacker.attacking = false;\

attacker.target = null;\

sneakMsg = `\uff0c\u6211\u65b9\u9078\u64c7\u653e\u68c4\u300c\u5077
<truncated 218 bytes>
d3b\u55ae\u4f4d\u9032\u884c\u6a6b\u7f6e Tap \u9396\u5b9a\

if (!attackerShouldDie) {\

attacker.tapped = true;\

attacker.attacking = false;\

attacker.target = null;\

}\

}\

\

// 7. \u56de\u50b3\u8a73\u7d30\u6230\u9b25\u65e5\u8a8c\

let combatMsg = "";\

if (attackerShouldDie && defenderShouldDie) {\

combatMsg = `${unitName(attacker)} \u8207 ${unitName(defender)} \u5be6\u529b\u76f8\u7576\u6216\u5287\u6bd2\u4e92\u566c\uff0c\u540c\u6b78\u65bc\u76e1`;\

} else if (attackerShouldDie) {\

combatMsg = `${unitName(attacker)} \u653b\u64ca\u5931\u6557\uff0c\u81ea\u8eab\u88ab\u7834\u58de\uff0c\u800c ${unitName(defender)} \u5b8c\u597d\u7121\u640d`;\

} else if (defenderShouldDie) {\

combatMsg = `${unitName(attacker)} \u6210\u529f\u64ca\u7834\u4e86 ${unitName(defender)}${piercingMsg}${sneakMsg}`;\

} else {\

combatMsg = `${unitName(attacker)} \u9032\u653b\u4e86 ${unitName(defender)}\uff0c\u96d9\u65b9\u7686\u5b89\u7136\u7121\u6059${sneakMsg}`;\

}\

\

return combatMsg;\

}\

\

// \u5e36\u6709\u788e\u88c2\u548c\u706b\u82b1\u7c92\u5b50\u7279\u6548\u7684\u5361\u724c\u92b7\u6bc0\u51fd\u6578\

async function destroyUnit(zone, idx, owner) {\

const unit = field[zone][idx];\

if (!unit) return;\

\

// 1. \u5c0b\u627e\u683c\u5b50\u4e26\u64ad\u653e CSS \u788e\u88c2\u8207\u7d05\u5149\u7c92\u5b50\u52d5\u756b\

const slot = document.querySelector(`[data-zone="${zone}"][data-index="${idx}"]`);\

if (slot) {\

const cardEl = slot.querySelector(".card");\

if (cardEl) {\

cardEl.classList.add("xlw-card-shatter");\

\

const sparks = document.createElement("div");\

sparks.className = "shatter-sparks";\

slot.appendChild(sparks);\

}\

}\

\


"
}

=== LINE 3616 ===
{
  "step_index": 3635,
  "source": "MODEL",
  "type": "RUN_COMMAND",
  "status": "DONE",
  "created_at": "2026-05-30T05:46:38Z",
  "content": "Created At: 2026-05-30T05:46:38Z
Completed At: 2026-05-30T05:46:44Z

\t\t\t\tThe command completed successfully.
\t\t\t\tOutput:
\t\t\t\t1340:     // 貫穿 (Piercing) 效果判定：擊破前排後繼續進攻後排
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

"
}

=== LINE 3918 ===
{
  "step_index": 3938,
  "source": "MODEL",
  "type": "VIEW_FILE",
  "status": "DONE",
  "created_at": "2026-05-30T06:01:50Z",
  "content": "Created At: 2026-05-30T06:01:50Z
Completed At: 2026-05-30T06:01:50Z
File Path: `file:///c:/Users/a2132/Documents/%E6%98%9F%E9%9D%88%E7%8E%8B/XingLingWang_v7_fixed/static/game_v8.js`
Total Lines: 3136
Total Bytes: 113514
Showing lines 1260 to 1420
The following code has been modified to include a line number before every line, in the format: <line_number>: <original_line>. Please note that any changes targeting the original code should remove the line number, colon, and leading space.
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

const attackerHasRanged = (attackerCard.keywords && attackerCard.keywords.includes("
<truncated 4198 bytes>
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