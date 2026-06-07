Created At: 2026-05-30T00:58:48Z
Completed At: 2026-05-30T00:58:51Z

				The command completed successfully.
				Output:
				Line 863 (attacking): attacking: false,
Line 899 (attacking): attacking: false,
Line 1058 (attacking): attacker.attacking = true;
Line 1091 (attacking): if (!attacker || !attacker.attacking || !attacker.target) {
Line 1101 (attacking): attacker.attacking = false;
Line 1112 (resolveUnitCombat): const resultMsg = await resolveUnitCombat("enemy_front", lane, target.zone, target.idx, "player");
Line 1143 (attacking): if (field.player_front[lane] && field.player_front[lane].attacking && field.player_front[lane].target) {
Line 1146 (attacking): } else if (field.player_back[lane] && field.player_back[lane].attacking && field.player_back[lane].target) {
Line 1160 (attacking): attacker.attacking = false;
Line 1169 (resolveUnitCombat): const resultMsg = await resolveUnitCombat(attZone, lane, target.zone, target.idx, "enemy");
Line 1228 (resolveUnitCombat): async function resolveUnitCombat(attZone, attIdx, defZone, defIdx, defenderOwner) {
Line 1242 (attacking): attacker.attacking = false;
Line 1248 (attacking): attacker.attacking = false;
Line 1347 (triggerSneakAttackSuccessEffects): await triggerSneakAttackSuccessEffects(attacker.card);
Line 1351 (attacking): attacker.attacking = false;
Line 1360 (attacking): attacker.attacking = false;
Line 1493 (attacking): attacking: false,
Line 1530 (attacking): enemyAttacker.attacking = true;
Line 1610 (attacking): u.attacking = false;
Line 1622 (attacking): u.attacking = false;
Line 1850 (attacking): if (obj.attacking) {
Line 1851 (attacking): slot.classList.add("attacking-slot");
Line 1853 (xlw-my-attacker): slot.classList.add("xlw-my-attacker");
Line 1855 (xlw-enemy-attacker): slot.classList.add("xlw-enemy-attacker");
Line 1864 (attacking): if (obj.attacking && obj.target) {
Line 1867 (xlw-my-attacker): slot.classList.add("xlw-my-attacker");
Line 1869 (xlw-enemy-attacker): slot.classList.add("xlw-enemy-attacker");
Line 1874 (attacking): if (phase === "�u�q" && obj.attacking) {
Line 2025 (attacking): const hasAttacker = (field.player_front[i] && field.player_front[i].attacking) ||
Line 2026 (attacking): (field.player_back[i] && field.player_back[i].attacking) ||
Line 2027 (attacking): (field.enemy_front[i] && field.enemy_front[i].attacking);
Line 2454 (attacking): attacking: false,
Line 2500 (attacking): attacker.attacking = true;
Line 2880 (triggerSneakAttackSuccessEffects): async function triggerSneakAttackSuccessEffects(card) {

