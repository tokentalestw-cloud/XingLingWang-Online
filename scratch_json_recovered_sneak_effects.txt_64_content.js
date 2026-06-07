Created At: 2026-05-30T10:31:46Z
Completed At: 2026-05-30T10:31:46Z
File Path: `file:///C:/Users/a2132/.gemini/antigravity/brain/03a5c827-f04f-4441-a903-ae2f4b2b4477/scratch/js_snippet.txt`
Total Lines: 41
Total Bytes: 1946
Showing lines 1 to 41
The following code has been modified to include a line number before every line, in the format: <line_number>: <original_line>. Please note that any changes targeting the original code should remove the line number, colon, and leading space.
1: 3066: async function triggerSneakAttackSuccessEffects(card) {
2: 3067:   if (!card) return;
3: 3068:   
4: 3069:   // 1. 遞增本回合偷襲成功次數
5: 3070:   window.XLW_turnSneakCount = (window.XLW_turnSneakCount || 0) + 1;
6: 3071:   logBattle(`🥷 偷襲成功！本回合累計偷襲成功次數：${window.XLW_turnSneakCount} 次。`);
7: 3072:   
8: 3073:   // 2. 觸發「此卡偷襲成功時」效果
9: 3074:   
10: 3075:   // 黑喵 (CAT_0011 / R-CAT-0011 / CAT_012)：破壞敵方最強單位
11: 3076:   if (card.id === "CAT_0011" || card.id === "R-CAT-0011" || card.id === "CAT_012" || card.name.includes("\u9ed1\u55b5")) {
12: 3077:     let strongest = null;
13: 3078:     let maxAtk = -1;
14: 3079:     let bestZone = null;
15: 3080:     let bestIdx = -1;
16: 3081:     for (const zone of ["enemy_front", "enemy_back"]) {
17: 3082:       for (let i = 0; i < 5; i++) {
18: 3083:         const u = field[zone][i];
19: 3084:         if (u) {
20: 3085:           const atk = getUnitAtk(u, zone, i);
21: 3086:           if (atk > maxAtk) {
22: 3087:             maxAtk = atk;
23: 3088:             strongest = u;
24: 3089:             bestZone = zone;
25: 3090:             bestIdx = i;
26: 3091:           }
27: 3092:         }
28: 3093:       }
29: 3094:     }
30: 3095:     if (strongest) {
31: 3096:       logBattle(`🥷 \u9ed1\u55b5 \u6548\u679c\uff1a\u9078\u5b9a\u6575\u65b9\u6700\u5f37\u55ae\u4f4d ${unitName(strongest)} (\u653b\u64ca\u529b ${maxAtk}) \u9032\u884c\u7834\u589a\uff01`);
32: 3097:       await destroyUnit(bestZone, bestIdx, "enemy");
33: 3098:       render();
34: 3099:     } else {
35: 3100:       logBattle(`🥷 \u9ed1\u55b5 \u6548\u679c\uff1a\u6575\u65b9\u5834\u4e0a\u6c92\u6709\u4efb\u4f55\u55ae\u4f4d\u53ef\u4f9b\u7834\u589a\u3002`);
36: 3101:     }
37: 3102:   }
38: 3103:   
39: 3104:   // 殭屍喵 (CAT_003 / R-CAT-0044)：捨棄手牌1張喵喵賊卡，將墓地1張喵喵賊回到手牌
40: 3105:   if (card.id === "CAT_003" || card.id === "R-CAT-0044" || card.name.includes("\u6bad\u5c4d\u55b5")) {
41: 
The above content shows the entire, complete file contents of the requested file.
