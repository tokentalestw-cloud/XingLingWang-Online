async function triggerSneakAttackSuccessEffects(card) {
if (!card) return;

// 1. 遞增本回合偷襲成功次數
window.XLW_turnSneakCount = (window.XLW_turnSneakCount || 0) + 1;
logBattle(`🥷 偷襲成功！本回合累計偷襲成功次數：${window.XLW_turnSneakCount} 次。`);

// 2. 觸發「此卡偷襲成功時」效果

// 變裝喵 (CAT_012)：使對方手牌1張隨機捨棄
if (card.id === "CAT_012" || card.name.includes("變裝喵")) {
if (isMultiplayer) {
ws.send(JSON.stringify({
action: "trigger_opponent_discard"
}));
logBattle(`🥷 變裝喵 效果：已向對手發送隨機捨棄手牌指令。`);
} else {
if (window.XLW_ENEMY.hand && window.XLW_ENEMY.hand.length > 0) {
const idx = Math.floor(Math.random() * window.XLW_ENEMY.hand.length);
const discarded = window.XLW_ENEMY.hand.splice(idx, 1)[0];
enemyGraveyard.push(discarded);
logBattle(`🥷 變裝喵 效果：對手被迫隨機捨棄了手牌中的 ${discarded.name}！`);
render();
} else {
logBattle(`🥷 變裝喵 效果：對手手牌已空，無卡牌可捨棄。`);
}
}
}

// 殭屍喵 (CAT_003)：捨棄手牌1張喵喵賊卡，將墓地1張喵喵賊回到手牌
if (card.id === "CAT_003" || card.name.includes("殭
<truncated 404 bytes>
UnitsInGraveyard.length > 0) {
const active = await showXLWConfirm(
"🧟 殭屍喵 偷襲效果連動！",
`是否要捨棄手牌中 1 張喵喵賊卡牌，並從墓地將另一張喵喵賊單位卡回手牌？`,
"啟動效果",
"不啟動"
);
if (active) {
const discardCard = meowCardsInHand[0];
const discardIdx = hand.indexOf(discardCard);
if (discardIdx >= 0) {
hand.splice(discardIdx, 1);
graveyard.push(discardCard);
logBattle(`🧟 殭屍喵 效果：我方主動捨棄手牌中的 ${discardCard.name}。`);

const recoverCard = meowUnitsInGraveyard[0];
const recoverIdx = graveyard.indexOf(recoverCard);
if (recoverIdx >= 0) {
graveyard.splice(recoverIdx, 1);
hand.push(recoverCard);
logBattle(`🧟 殭屍喵 效果：成功從墓地將 ${recoverCard.name} 召回手牌！`);
}
render();
}
}
}
}