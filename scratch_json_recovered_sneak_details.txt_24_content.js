Created At: 2026-05-30T06:54:57Z
Completed At: 2026-05-30T06:55:00Z

				The command completed successfully.
				Output:
				Searching for triggerSneakAttackSuccessEffects:
Line 2979: async function triggerSneakAttackSuccessEffects(card) {
  2979: async function triggerSneakAttackSuccessEffects(card) {
  2980:   if (!card) return;
  2981:   
  2982:   // 1. 遞增本回合偷襲成功次數
  2983:   window.XLW_turnSneakCount = (window.XLW_turnSneakCount || 0) + 1;
  2984:   logBattle(`🥷 偷襲成功！本回合累計偷襲成功次數：${window.XLW_turnSneakCount} 次。`);
  2985:   
  2986:   // 2. 觸發「此卡偷襲成功時」效果
  2987:   
  2988:   // 黑喵 (CAT_0011 / R-CAT-0011 / CAT_012)：破壞敵方最強單位
  2989:   if (card.id === "CAT_0011" || card.id === "R-CAT-0011" || card.id === "CAT_012" || card.name.includes("\u9ed1\u55b5")) {
  2990:     let strongest = null;
  2991:     let maxAtk = -1;
  2992:     let bestZone = null;
  2993:     let bestIdx = -1;
  2994:     for (const zone of ["enemy_front", "enemy_back"]) {
  2995:       for (let i = 0; i < 5; i++) {
  2996:         const u = field[zone][i];
  2997:         if (u) {
  2998:           const atk = getUnitAtk(u, zone, i);
  2999:           if (atk > maxAtk) {
  3000:             maxAtk = atk;
  3001:             strongest = u;
  3002:             bestZone = zone;
  3003:             bestIdx = i;
  3004:           }
  3005:         }
  3006:       }
  3007:     }
  3008:     if (strongest) {
  3009:       logBattle(`🥷 \u9ed1\u55b5 \u6548\u679c\uff1a\u9078\u5b9a\u6575\u65b9\u6700\u5f37\u55ae\u4f4d ${unitName(strongest)} (\u653b\u64ca\u529b ${maxAtk}) \u9032\u884c\u7834\u589a\uff01`);
  3010:       await destroyUnit(bestZone, bestIdx, "enemy");
  3011:       render();
  3012:     } else {
  3013:       logBattle(`🥷 \u9ed1\u55b5 \u6548\u679c\uff1a\u6575\u65b9\u5834\u4e0a\u6c92\u6709\u4efb\u4f55\u55ae\u4f4d\u53ef\u4f9b\u7834\u589a\u3002`);
  3014:     }
  3015:   }
  3016:   
  3017:   // 殭屍喵 (CAT_003 / R-CAT-0044)：捨棄手牌1張喵喵賊卡，將墓地1張喵喵賊回到手牌
  3018:   if (card.id === "CAT_003" || card.id === "R-CAT-0044" || card.name.includes("\u6bad\u5c4d\u55b5")) {
  3019:     const isMeowCard = (c) => c && (c.deck === "\u55b5\u55b5\u8cca" || c.faction === "\u55b5\u55b5\u8cca" || (c.id && (c.id.includes("CAT") || c.id.includes("cat"))));
  3020:     const meowCardsInHand = hand.filter(isMeowCard);
  3021:     const meowUnitsInGraveyard = graveyard.filter(c => c && c.type === "unit" && isMeowCard(c));
  3022:     
  3023:     if (meowCardsInHand.length > 0 && meowUnitsInGraveyard.length > 0) {

