async function triggerSneakAttackSuccessEffects(card) {\
  if (!card) return;\
  \
  // 1. 遞增本回合偷襲成功次數\
  window.XLW_turnSneakCount = (window.XLW_turnSneakCount || 0) + 1;\
  logBattle(`🥷 偷襲成功！本回合累計偷襲成功次數：${window.XLW_turnSneakCount} 次。`);\
  \
  // 2. 觸發「此卡偷襲成功時」效果\
  \
  // 黑喵 (CAT_0011 / R-CAT-0011 / CAT_012)：破壞敵方最強單位\
  if (card.id === \"CAT_0011\" || card.id === \"R-CAT-0011\" || card.id === \"CAT_012\" || card.name.includes(\"\\u9ed1\\u55b5\")) {\
    let strongest = null;\
    let maxAtk = -1;\
    let bestZone = null;\
    let bestIdx = -1;\
    for (const zone of [\"enemy_front\", \"enemy_back\"]) {\
      for (let i = 0; i < 5; i++) {\
        const u = field[zone][i];\
        if (u) {\
          const atk = getUnitAtk(u, zone, i);\
          if (atk > maxAtk) {\
            maxAtk = atk;\
            strongest = u;\
            bestZone = zone;\
            bestIdx = i;\
          }\
        }\
      }\
    }\
    if (strongest) {\
      logBattle(`🥷 \\u9ed1\\u55b5 \\u6548\\u679c\\uff1a\\u9078\\u5b9a\\u6575\\u65b9\\u6700\\u5f37\\u55ae\\u4f4d ${unitName(strongest)} (\\u653b\\u64ca\\u529b ${maxAtk}) \\u9032\\u884c\\u7834\\u589a\\uff01`);\
      await destroyUnit(bestZone, bestIdx, \"enemy\");\
      render();\
    } else {\
      logBattle(`🥷 \\u9ed1\\u55b5 \\u6548\\u679c\\uff1a\\u6575\\u65b9\\u5834\\u4e0a\\u6c92\\u6709\\u4efb\\u4f55\\u55ae\\u4f4d\\u53ef\\u4f9b\\u7834\\u589a\\u3002`);\
    }\
  }\
  \
  // 殭屍喵 (CAT_003 / R-CAT-0044)：捨棄手牌1張喵喵賊卡，將墓地1張喵喵賊回到手牌\
  if (card.id === \"CAT_003\" || card.id === \"R-CAT-0044\" || card.name.includes(\"\\u6bad\\u5c4d\\u55b5\")) {\
    const isMeowCard = (c) => c && (c.deck === \"\\u55b5\\u55b5\\u8cca\" || c.faction === \"\\u55b5\\u55b5\\u8cca\" || (c.id && (c.id.includes(\"CAT\") || c.id.includes(\"cat\"))));\
    const meowCardsInHand = hand.filter(isMeowCard);\
    const meowUnitsInGraveyard = grave
<truncated 7597 bytes>",
        "StartLine": "2880",
        "TargetContent": ""async function triggerSneakAttackSuccessEffects(card) {\
  if (!card) return;\
  \
  // 1. 遞增本回合偷襲成功次數\
  window.XLW_turnSneakCount = (window.XLW_turnSneakCount || 0) + 1;\
  logBattle(`🥷 偷襲成功！本回合累計偷襲成功次數：${window.XLW_turnSneakCount} 次。`);\
  \
  // 2. 觸發「此卡偷襲成功時」效果\
  \
  // 變裝喵 (CAT_012)：使對方手牌1張隨機捨棄\
  if (card.id === \"CAT_012\" || card.name.includes(\"變裝喵\")) {\
    if (isMultiplayer) {\
      ws.send(JSON.stringify({\
        action: \"trigger_opponent_discard\"\
      }));\
      logBattle(`🥷 變裝喵 效果：已向對手發送隨機捨棄手牌指令。`);\
    } else {\
      if (window.XLW_ENEMY.hand && window.XLW_ENEMY.hand.length > 0) {\
        const idx = Math.floor(Math.random() * window.XLW_ENEMY.hand.length);\
        const discarded = window.XLW_ENEMY.hand.splice(idx, 1)[0];\
        enemyGraveyard.push(discarded);\
        logBattle(`🥷 變裝喵 效果：對手被迫隨機捨棄了手牌中的 ${discarded.name}！`);\
        render();\
      } else {\
        logBattle(`🥷 變裝喵 效果：對手手牌已空，無卡牌可捨棄。`);\
      }\
    }\
  }\
  \
  // 殭屍喵 (CAT_003)：捨棄手牌1張喵喵賊卡，將墓地1張喵喵賊回到手牌\
  if (card.id === \"CAT_003\" || card.name.includes(\"殭屍喵\")) {\
    const meowCardsInHand = hand.filter(c => c && (c.deck === \"喵喵賊\" || c.faction === \"喵喵賊\" || (c.id && c.id.startsWith(\"CAT_\"))));\
    const meowUnitsInGraveyard = graveyard.filter(c => c && c.type === \"unit\" && (c.deck === \"喵喵賊\" || c.faction === \"喵喵賊\" || (c.id && c.id.startsWith(\"CAT_\"))));\
    \
    if (meowCardsInHand.length > 0 && meowUnitsInGraveyard.length > 0) {\
      const active = await showXLWConfirm(\
        \"🧟 殭屍喵 偷襲效果連動！\",\
        `防才無任何偷襲功能可以運行，是否要捨棄手牌中 1 張喵喵賊卡牌，並從墓地將另一張喵喵賊單位卡
<truncated 3226 bytes>",
        "TargetFile": ""c:\\Users\\a2132\\Documents\\星靈王\\XingLingWang_v7_fixed\\static\\game_v8.js"",
        "toolAction": ""Update sneak attack effects"",
        "toolSummary": ""Replacing triggerSneakAttackSuccessEffects inside game_v8.js with customized Meow Thief card synergy logic.""
      }
    }
  ]
}

=== LINE 2869 ===
{
  "step_index": 2884,
  "source": "MODEL",
  "type": "CODE_ACTION",
  "status": "DONE",
  "created_at": "2026-05-30T01:02:43Z",
  "content": "Created At: 2026-05-30T01:02:43Z
Completed At: 2026-05-30T01:03:14Z
The following changes were made by the replace_file_content tool to: c:\Users\a2132\Documents\星靈王\XingLingWang_v7_fixed\static\game_v8.js. If relevant, proactively run terminal commands to execute this code for the USER. Don't ask for permission.
[diff_block_start]
@@ -2642,6 +2642,190 @@
   }, 850);
 }
 
+async function triggerSneakAttackSuccessEffects(card) {
+  if (!card) return;
+  
+  // 1. 遞增本回合偷襲成功次數
+  window.XLW_turnSneakCount = (window.XLW_turnSneakCount || 0) + 1;
+  logBattle(`🥷 偷襲成功！本回合累計偷襲成功次數：${window.XLW_turnSneakCount} 次。`);
+  
+  // 2. 觸發「此卡偷襲成功時」效果
+  
+  // 黑喵 (CAT_0011 / R-CAT-0011 / CAT_012)：破壞敵方最強單位
+  if (card.id === "CAT_0011" || card.id === "R-CAT-0011" || card.id === "CAT_012" || card.name.includes("\u9ed1\u55b5")) {
+    let strongest = null;
+    let maxAtk = -1;
+    let bestZone = null;
+    let bestIdx = -1;
+    for (const zone of ["enemy_front", "enemy_back"]) {
+      for (let i = 0; i < 5; i++) {
+        const u = field[zone][i];
+        if (u) {
+          const atk = getUnitAtk(u, zone, i);
+          if (atk > maxAtk) {
+            maxAtk = atk;
+            strongest = u;
+            bestZone = zone;
+            bestIdx = i;
+          }
+        }
+      }
+    }
+    if (strongest) {
+      logBattle(`🥷 \u9ed1\u55b5 \u6548\u679c\uff1a\u9078\u5b9a\u6575\u65b9\u6700\u5f37\u55ae\u4f4d ${unitName(strongest)} (\u653b\u64ca\u529b ${maxAtk}) \u9032\u884c\u7834\u589a\uff01`);
+      await destroyUnit(bestZone, bestIdx, "enemy");
+      render();
+    } else {
+      logBattle(`🥷 \u9ed1\u55b5 \u6548\u679c\uff1a\u6575\u65b9\u5834\u4e0a\u6c92\u6709\u4efb\u4f55\u55ae\u4f4d\u53ef\u4f9b\u7834\u589a\u3002`);
+    }
+  }
+  
+  // 殭屍喵 (CAT_003 / R-CAT-0044)：捨棄手牌1張喵喵賊卡，將墓地1張喵喵賊回到手牌
+  if (card.id === "CAT
<truncated 6108 bytes>
b5") ||
+        cid === "CAT-0032" || cid === "SR-CAT-0032" || c.name.includes("\u6b21\u5143\u7a81\u64ca\u55b5") ||
+        cid === "CAT_0050" || c.name.includes("\u6253\u624b\u55b5") ||
+        cid === "CAT_005" || c.name.includes("\u7da0\u55b5")) {
+      return true;
+    }
+    // 凱特琳 (CAT_0052/R-CAT-0052) 需要至少 2 次偷襲成功
+    if ((cid === "CAT_0052" || cid === "R-CAT-0052" || c.name.includes("\u51f1\u7279\u7433")) && window.XLW_turnSneakCount >= 2) {
+      return true;
+    }
+    return false;
+  });
+  
+  if (validExtraSummons.length > 0) {
+    const extraCard = validExtraSummons[0];
+    const userWantsSummon = await showXLWConfirm(
+      "🐈 \u5075\u6e2c\u5230\u624b\u724c\u3010\u5077\u8972\u9023\u52d5\u3011\uff01",
+      `\u7531\u65bc\u5077\u8972\u6210\u529f\uff0c\u662f\u5426\u8981\u5f9e\u624b\u724c\u4e2d\u984d\u5916\u6253\u51fa <b>${extraCard.name}</b>\uff1f<br>(\u6b64\u9023\u52d5\u53ec\u5590\u4e0d\u4f54\u7528\u5e38\u898f\u6bcf\u56de\u5408\u53ec\u5590\u984d\u5ea6\uff0c\u4e1f\u53ef\u7acb\u5373\u9032\u656b)`,
+      "\u78ba\u8a8d\u6253\u51fa",
+      "\u4fdd\u7559\u5728\u624b\u724c"
+    );
+    
+    if (userWantsSummon) {
+      window.XLW_bypassNormalSummonLimit = true;
+      selectedHandForSummon = hand.indexOf(extraCard);
+      setStatus(`\u3010\u9023\u52d5\u984d\u5916\u53ec\u5590\u3011\u8acb\u9ede\u9078\u6211\u65b9\u4e00\u500b\u7a7a\u683c\u653e\u7f6e <b>${extraCard.name}</b>\uff01`);
+      render();
+    }
+  }
+  
+  render();
+}