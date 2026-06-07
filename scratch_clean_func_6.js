async function triggerSneakAttackSuccessEffects(card) {
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
+  }