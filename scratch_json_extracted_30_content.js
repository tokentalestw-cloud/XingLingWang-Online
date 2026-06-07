Created At: 2026-05-30T01:03:34Z
Completed At: 2026-05-30T01:03:36Z

				The command completed successfully.
				Output:
				=== REGION 1 (2640-2670) ===
2636:     render();
2637: 
2638:     // ??????????
2639:     setTimeout(() => {
2640:       targetSlot.classList.remove("xlw-summon-flash-green");
2641:     }, 450);
2642:   }, 850);
2643: }
2644: 
2645: async function triggerSneakAttackSuccessEffects(card) {
2646:   if (!card) return;
2647:   
2648:   // 1. ???????????
2649:   window.XLW_turnSneakCount = (window.XLW_turnSneakCount || 0) + 1;
2650:   logBattle(`? ?????????????????${window.XLW_turnSneakCount} ??`);
2651:   
2652:   // 2. ?????????????
2653:   
2654:   // ?? (CAT_0011 / R-CAT-0011 / CAT_012)?????????
2655:   if (card.id === "CAT_0011" || card.id === "R-CAT-0011" || card.id === "CAT_012" || card.name.includes("\u9ed1\u55b5")) {
2656:     let strongest = null;
2657:     let maxAtk = -1;
2658:     let bestZone = null;
2659:     let bestIdx = -1;
2660:     for (const zone of ["enemy_front", "enemy_back"]) {
2661:       for (let i = 0; i < 5; i++) {
2662:         const u = field[zone][i];
2663:         if (u) {
2664:           const atk = getUnitAtk(u, zone, i);
2665:           if (atk > maxAtk) {
2666:             maxAtk = atk;
2667:             strongest = u;
2668:             bestZone = zone;
2669:             bestIdx = i;
2670:           }

=== REGION 2 (3050-3085) ===
3051: 
3052:     // ????
3053:     overlay.querySelector("#xlwConfirmYes").onclick = () => {
3054:       overlay.remove();
3055:       resolve(true);
3056:     };
3057:     overlay.querySelector("#xlwConfirmNo").onclick = () => {
3058:       overlay.remove();
3059:       resolve(false);
3060:     };
3061:   });
3062: }
3063: 
3064: async function triggerSneakAttackSuccessEffects(card) {
3065:   if (!card) return;
3066:   
3067:   // 1. ???????????
3068:   window.XLW_turnSneakCount = (window.XLW_turnSneakCount || 0) + 1;
3069:   logBattle(`? ?????????????????${window.XLW_turnSneakCount} ??`);
3070:   
3071:   // 2. ?????????????
3072:   
3073:   // ??? (CAT_012)??????1?????
3074:   if (card.id === "CAT_012" || card.name.includes("???")) {
3075:     if (isMultiplayer) {
3076:       ws.send(JSON.stringify({
3077:         action: "trigger_opponent_discard"
3078:       }));
3079:       logBattle(`? ??? ??????????????????`);
3080:     } else {
3081:       if (window.XLW_ENEMY.hand && window.XLW_ENEMY.hand.length > 0) {
3082:         const idx = Math.floor(Math.random() * window.XLW_ENEMY.hand.length);
3083:         const discarded = window.XLW_ENEMY.hand.splice(idx, 1)[0];
3084:         enemyGraveyard.push(discarded);
3085:         logBattle(`? ??? ???????????????? ${discarded.name}?`);

