Created At: 2026-05-30T02:53:36Z
Completed At: 2026-05-30T02:53:47Z

				The command completed successfully.
				Output:
				--- Searching for functions containing 'Defense' or 'Phase' or 'Resolve' ---
104: async function init() {
147: function newGameMultiplayer() {
204: function makeSlots() {
228: function normDeckName(v) {
236: function belongsToDeck(c, deckName) {
264: function strictSourceCards(deckName) {
287: function newGame() {
344: function shuffle(arr) {
351: function draw(n) {
366: function startMulliganPhase() {
374: function toggleMulliganCard(idx) {
385: function confirmMulligan() {
428: function checkMulliganCompletion() {
449: function xlwFrontlineHasEmpty() {
453: function xlwIsEnemySummonCard(c) {
470: function xlwCanSummonToZone(zone, card) {
489: window.XLW_isShieldUnit = function(unit) {
507: function getUnitAtk(unit, zone, lane) {
546: function getUnitStars(unit, zone, lane) {
565: function unitName(unit) {
571: function enemyLaneHasAny(lane) {
576: function enemyFrontIsShield(lane) {
581: function validPlayerAttackLine(zone, lane) {
592: function clearModes() {
607: function triggerLittleTraveler(e) {
626: function castSpell(handIndex) {
676: function startTributeSummon(handIndex) {
698: function toggleTributeSelection(zone, idx) {
740: function confirmTribute() {
775: function performSummonToSlot(zone, idx) {
935: function changeActionPhase(targetPhase) {
954: function moveFieldUnit(fromZone, fromIdx, toZone, toIdx) {
1005: function selectPlayerAttacker(zone, idx) {
1027: function selectPlayerTarget(zone, idx) {
1087: async function xlwResolvePlayerDefensePhase() {
1156: async function xlwResolveEnemyDefensePhaseSafe() {
1209: function showCombatNumberAnimation(attZone, attIdx, defZone, defIdx, atkPower, defPower) {
1252: async function resolveUnitCombat(attZone, attIdx, defZone, defIdx, defenderOwner) {
1404: async function destroyUnit(zone, idx, owner) {
1440: function flashBattle(attZone, attIdx, defZone, defIdx) {
1452: function xlwInitEnemyDeck() {
1468: async function runEnemyTurn() {
1572: async function endPlayerTurnAndRunEnemy() {
1628: function playerUntap() {
1640: function untapEnemy() {
1653: function renderRaceCards() {
1672: function render() {
1703: function getPhaseHelpText(p) {
1716: function renderDeckVisuals() {
1724: function createDeckVisual(zoneId, count, label) {
1768: function renderHand() {
1855: function renderField() {
2060: function renderBattleLine() {
2077: function getStarIcons(count) {
2088: function renderScore() {
2167: function renderEnemyPanel() {
2184: function renderStablePanel() {
2300: function setupGlobalEvents() {
2394: function showModal(card) {
2410: function setStatus(t) {
2415: function logBattle(text) {
2422: function adjustBoardScale() {
2450: function setupWebSocketEvents() {
2605: function playTravelerSummonAnimation(fromForestId, toZone, toIdx) {
2685: async function triggerSneakAttackSuccessEffects(card) {
2870: function createDebugPanel() {
2909: window.logDebug = function(msg) {
2928: function playTributeSummonAnimation(zone, idx) {
3050: function showXLWConfirm(title, message, confirmText = "�T�{", cancelText = "�") {

--- Searching for 'EnemyDefense' or 'DefensePhase' in text ---
1156: async function xlwResolveEnemyDefensePhaseSafe() {
1495: await xlwResolveEnemyDefensePhaseSafe();

