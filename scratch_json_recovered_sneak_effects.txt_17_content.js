Created At: 2026-05-30T00:59:46Z
Completed At: 2026-05-30T00:59:46Z
File Path: `file:///c:/Users/a2132/Documents/%E6%98%9F%E9%9D%88%E7%8E%8B/XingLingWang_v7_fixed/static/game_v8.js`
Total Lines: 2997
Total Bytes: 109294
Showing lines 2880 to 2950
The following code has been modified to include a line number before every line, in the format: <line_number>: <original_line>. Please note that any changes targeting the original code should remove the line number, colon, and leading space.
2880: async function triggerSneakAttackSuccessEffects(card) {
2881:   if (!card) return;
2882:   
2883:   // 1. 遞增本回合偷襲成功次數
2884:   window.XLW_turnSneakCount = (window.XLW_turnSneakCount || 0) + 1;
2885:   logBattle(`🥷 偷襲成功！本回合累計偷襲成功次數：${window.XLW_turnSneakCount} 次。`);
2886:   
2887:   // 2. 觸發「此卡偷襲成功時」效果
2888:   
2889:   // 變裝喵 (CAT_012)：使對方手牌1張隨機捨棄
2890:   if (card.id === "CAT_012" || card.name.includes("變裝喵")) {
2891:     if (isMultiplayer) {
2892:       ws.send(JSON.stringify({
2893:         action: "trigger_opponent_discard"
2894:       }));
2895:       logBattle(`🥷 變裝喵 效果：已向對手發送隨機捨棄手牌指令。`);
2896:     } else {
2897:       if (window.XLW_ENEMY.hand && window.XLW_ENEMY.hand.length > 0) {
2898:         const idx = Math.floor(Math.random() * window.XLW_ENEMY.hand.length);
2899:         const discarded = window.XLW_ENEMY.hand.splice(idx, 1)[0];
2900:         enemyGraveyard.push(discarded);
2901:         logBattle(`🥷 變裝喵 效果：對手被迫隨機捨棄了手牌中的 ${discarded.name}！`);
2902:         render();
2903:       } else {
2904:         logBattle(`🥷 變裝喵 效果：對手手牌已空，無卡牌可捨棄。`);
2905:       }
2906:     }
2907:   }
2908:   
2909:   // 殭屍喵 (CAT_003)：捨棄手牌1張喵喵賊卡，將墓地1張喵喵賊回到手牌
2910:   if (card.id === "CAT_003" || card.name.includes("殭
<truncated 404 bytes>
UnitsInGraveyard.length > 0) {
2915:       const active = await showXLWConfirm(
2916:         "🧟 殭屍喵 偷襲效果連動！",
2917:         `是否要捨棄手牌中 1 張喵喵賊卡牌，並從墓地將另一張喵喵賊單位卡回手牌？`,
2918:         "啟動效果",
2919:         "不啟動"
2920:       );
2921:       if (active) {
2922:         const discardCard = meowCardsInHand[0];
2923:         const discardIdx = hand.indexOf(discardCard);
2924:         if (discardIdx >= 0) {
2925:           hand.splice(discardIdx, 1);
2926:           graveyard.push(discardCard);
2927:           logBattle(`🧟 殭屍喵 效果：我方主動捨棄手牌中的 ${discardCard.name}。`);
2928:           
2929:           const recoverCard = meowUnitsInGraveyard[0];
2930:           const recoverIdx = graveyard.indexOf(recoverCard);
2931:           if (recoverIdx >= 0) {
2932:             graveyard.splice(recoverIdx, 1);
2933:             hand.push(recoverCard);
2934:             logBattle(`🧟 殭屍喵 效果：成功從墓地將 ${recoverCard.name} 召回手牌！`);
2935:           }
2936:           render();
2937:         }
2938:       }
2939:     }
2940:   }
2941:   
2942:   // 炸彈喵 (CAT_009)：除外墓地2張喵喵賊卡
2943:   if (card.id === "CAT_009" || card.name.includes("炸彈喵")) {
2944:     const meowCardsInGraveyard = graveyard.filter(c => c && (c.deck === "喵喵賊" || c.faction === "喵喵賊" || (c.id && c.id.startsWith("CAT_"))));
2945:     if (meowCardsInGraveyard.length > 0) {
2946:       const countToRemove = Math.min(2, meowCardsInGraveyard.length);
2947:       let removedNames = [];
2948:       for (let i = 0; i < countToRemove; i++) {
2949:         const cardToRemove = meowCardsInGraveyard[i];
2950:         const idxInGrave = graveyard.indexOf(cardToRemove);
The above content does NOT show the entire file contents. If you need to view any lines of the file which were not shown to complete your task, call this tool again to view those lines.
