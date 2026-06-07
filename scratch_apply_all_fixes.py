def apply_fixes_to_file(filepath):
    print(f"Applying fixes to {filepath}...")
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. performSummonToSlot async declaration
    content = content.replace(
        "function performSummonToSlot(zone, idx) {",
        "async function performSummonToSlot(zone, idx) {"
    )

    # 2. Meow Girl summon logic and placement resolve in performSummonToSlot
    meow_girl_target = """    // 立即 / 喵女效果發動：若單位寫有「立即」或名字為「喵女」，立刻打出一張免祭品偷襲單位（特殊召喚，不佔用召喚額度）
    const isImmediate = card.keywords?.includes("立即") || card.effect_text?.includes("立即") || card.name?.includes("立即") || card.name?.includes("喵女");
    if (isImmediate && zone.startsWith("player_")) {
      const validImmediateSummons = hand.filter(c => {
        return c && (c.type === "unit" || c.type === "怪獸") &&
               (c.keywords?.includes("偷襲") || c.effect_text?.includes("偷襲")) &&
               Number(c.tribute || 0) <= 0;
      });

      if (validImmediateSummons.length > 0) {
        logDebug(`【立即連動】喵女/立即單位入場！偵測到手牌可連動偷襲單位：${validImmediateSummons.map(c => c.name).join(", ")}`);
        setTimeout(() => {
          showXLWConfirm(`【立即連動】喵女/立即效果發動！是否立刻從手牌特殊召喚一張免祭品且具「偷襲」特性的單位？（不佔用常規或戰術召喚額度）`, () => {
            const extraCard = validImmediateSummons[0];
            window.XLW_bypassNormalSummonLimit = true;
            selectedHandForSummon = hand.indexOf(extraCard);
            setStatus(`【立即連動】請點選我方一個空格進行特殊召喚！`);
            render();
          });
        }, 300);
      }
    }
    
    if (isTributeSummon) {
      playTributeSummonAnimation(zone, idx);
    }
  }

  if (isMultiplayer) {
    ws.send(JSON.stringify({
      action: "summon",
      card: field[zone][idx].card,
      zone: zone,
      idx: idx
    }));
  }

  clearModes();
  render();"""

    # We will search using unicode-escaped representations since they might be escaped in the file!
    # Wait, Meow Girl might be unicode escaped or raw!
    # Let's write a robust finder that tries both raw and escaped strings for Meow Girl block!
    raw_meow_girl_target = meow_girl_target
    escaped_meow_girl_target = meow_girl_target.encode().decode('unicode-escape') # wait, that would decode, we want escaped version!
    # Let's just use bracket matching or find the lines!
    # Where does Meow Girl start? It is under "performSummonToSlot" function!
    # Let's find Meow Girl block in content dynamically:
    # It starts with "// \u7acb\u5373 / \u55b5\u59d0" or "// 立即 / 喵女"
    
    # Let's write a python searcher that finds the Meow Girl block by signature
    meow_start_idx = -1
    for sig in ["// 立即 / 喵女", "// \\u7acb\\u5373 / \\u55b5\\u5973", "const isImmediate = card.keywords?.includes"]:
        idx = content.find(sig)
        if idx != -1:
            meow_start_idx = idx
            break
            
    if meow_start_idx != -1:
        # We find clearModes(); render(); } which is the end of performSummonToSlot!
        # The end signature is:
        # clearModes();
        # render();
        # }
        # Let's find this after meow_start_idx:
        end_sig = "clearModes();\n  render();\n}"
        if end_sig not in content:
            end_sig = "clearModes();\r\n  render();\r\n}"
        meow_end_idx = content.find(end_sig, meow_start_idx)
        if meow_end_idx != -1:
            meow_end_idx += len(end_sig)
            old_meow_block = content[meow_start_idx:meow_end_idx]
            
            new_meow_block = """// \\u7acb\\u5373 / \\u55b5\\u5973\\u6548\\u679c\\u767c\\u52d5\\uff1a\\u82e5\\u55ae\\u4f4d\\u5beb\\u6709\\u300c\\u7acb\\u5373\\u300d\\u6216\\u540d\\u5b57\\u70ba\\u300c\\u55b5\\u5973\\u300d\\uff0c\\u7acb\\u523b\\u6253\\u51fa\\u4e00\\u5f35\\u514d\\u796d\\u54c1\\u5077\\u8972\\u55ae\\u4f4d\\uff08\\u7279\\u6b8a\\u53ec\\u55b5\\uff0c\\u4e0d\\u4f54\\u7528\\u53ec\\u55b5\\u984d\\u5ea6\\uff09
    const isImmediate = card.keywords?.includes("\\u7acb\\u5373") || card.effect_text?.includes("\\u7acb\\u5373") || card.name?.includes("\\u7acb\\u5373") || card.name?.includes("\\u55b5\\u5973");
    if (isImmediate && zone.startsWith("player_")) {
      const validImmediateSummons = hand.filter(c => {
        return c && (c.type === "unit" || c.type === "怪獸" || c.type === "\\u602a\\u737d") &&
               (c.keywords?.includes("\\u5077\\u8972") || c.effect_text?.includes("\\u5077\\u8972")) &&
               Number(c.tribute || 0) <= 0;
      });

      if (validImmediateSummons.length > 0) {
        logDebug(`\\u3010\\u7acb\\u5373\\u9023\\u52d5\\u3011\\u55b5\\u5973/\\u7acb\\u5373\\u55ae\\u4f4d\\u5165\\u5834\\uff01\\u5075\\u6e2c\\u5230\\u624b\\u724c\\u53ef\\u9023\\u52d5\\u5077\\u8972\\u55ae\\u4f4d\\uff1a${validImmediateSummons.map(c => c.name).join(", ")}`);
        setTimeout(async () => {
          const userConfirmed = await showXLWConfirm(
            "\\u3010\\u7acb\\u5373\\u9023\\u52d5\\u3011\\u55b5\\u5973/\\u7acb\\u5373\\u6548\\u679c\\u767c\\u52d5\\uff01",
            "\\u662f\\u5426\\u7acb\\u523b\\u5f9e\\u624b\\u724c\\u7279\\u6b8a\\u53ec\\u55b5\\u4e00\\u5f35\\u514d\\u796d\\u54c1\\u4e1a\\u5177\\u300c\\u5077\\u8972\\u300d\\u7279\\u6027\\u7684\\u55ae\\u4f4d\\uff1f\\uff08\\u4e0d\\u4e54\\u7528\\u5e38\\u898f\\u6216\\u6230\\u885b\\u53ec\\u55b5\\u984d\\u5ea6\\uff09"
          );
          if (userConfirmed) {
            const extraCard = validImmediateSummons[0];
            window.XLW_bypassNormalSummonLimit = true;
            selectedHandForSummon = hand.indexOf(extraCard);
            setStatus("\\u3010\\u7acb\\u5373\\u9023\\u52d5\\u3011\\u8acb\\u9ede\\u9078\\u6211\\u65b9\\u4e00\\u500b\\u7a7a\\u683c\\u9032\\u884c\\u7279\\u6b8a\\u53ec\\u55b5\\uff01");
            render();
          }
        }, 300);
      }
    }
    
    if (isTributeSummon) {
      playTributeSummonAnimation(zone, idx);
    }
  }

  if (isMultiplayer) {
    ws.send(JSON.stringify({
      action: "summon",
      card: field[zone][idx].card,
      zone: zone,
      idx: idx
    }));
  }

  if (window.XLW_summonPlacementResolve) {
    const resolve = window.XLW_summonPlacementResolve;
    window.XLW_summonPlacementResolve = null;
    resolve();
  }

  clearModes();
  render();
}"""
            content = content.replace(old_meow_block, new_meow_block)
            print("Successfully replaced Meow Girl block.")
        else:
            print("WARNING: Could not find Meow Girl end signature!")
    else:
        print("WARNING: Could not find Meow Girl start signature!")

    # 3. showXLWChoiceModal insertion after showXLWConfirm
    confirm_end_target = """    overlay.querySelector("#xlwConfirmNo").onclick = () => {
      overlay.remove();
      resolve(false);
    };
  });
}"""

    confirm_end_replacement = """    overlay.querySelector("#xlwConfirmNo").onclick = () => {
      overlay.remove();
      resolve(false);
    };
  });
}

function showXLWChoiceModal(title, message, options) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "xlw-premium-choice-overlay";
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.85);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      backdrop-filter: blur(8px);
    `;

    const box = document.createElement("div");
    box.style.cssText = `
      background: linear-gradient(135deg, #1d1816 0%, #110e0d 100%);
      border: 2px solid var(--gold-accent);
      border-radius: 16px;
      width: 480px;
      max-width: 90vw;
      padding: 24px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.95), 0 0 20px rgba(205, 170, 82, 0.4);
      text-align: center;
      transform: scale(0.85);
      animation: xlwPopupScale 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    `;

    let buttonsHTML = "";
    options.forEach((opt) => {
      const isEnd = opt.value === "end_effects";
      const btnStyle = isEnd
        ? "background: rgba(255, 255, 255, 0.05); color: #c4b9a6; border: 1px solid rgba(255, 255, 255, 0.15);"
        : "background: rgba(205, 170, 82, 0.15); color: #ffd76a; border: 1.5px solid var(--gold-accent);";
      buttonsHTML += `
        <button class="xlw-choice-btn" data-value="${opt.value}" style="width: 100%; padding: 12px; font-size: 14px; margin-bottom: 10px; border-radius: 8px; font-weight: bold; cursor: pointer; transition: all 0.2s ease; ${btnStyle}">
          ${opt.text}
        </button>
      `;
    });

    box.innerHTML = `
      <div style="font-size: 20px; font-weight: 900; color: #ffd76a; text-shadow: 0 0 10px rgba(255, 215, 106, 0.6); margin-bottom: 12px;">${title}</div>
      <div style="font-size: 14px; color: #c4b9a6; line-height: 1.6; margin-bottom: 20px;">${message}</div>
      <div style="display: flex; flex-direction: column; max-height: 300px; overflow-y: auto; padding-right: 4px;">
        ${buttonsHTML}
      </div>
    `;

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    const cleanup = (val) => {
      overlay.remove();
      resolve(val);
    };

    box.querySelectorAll(".xlw-choice-btn").forEach(btn => {
      btn.onclick = () => {
        cleanup(btn.dataset.value);
      };
      btn.onmouseenter = () => {
        btn.style.filter = "brightness(1.2)";
        btn.style.transform = "translateY(-1px)";
      };
      btn.onmouseleave = () => {
        btn.style.filter = "none";
        btn.style.transform = "none";
      };
    });
  });
}"""

    content = content.replace(confirm_end_target, confirm_end_replacement)

    # 4. triggerSneakAttackSuccessEffects replacement using bracket matching
    sneak_start_sig = "async function triggerSneakAttackSuccessEffects(card) {"
    start_idx = content.find(sneak_start_sig)
    
    if start_idx != -1:
        brace_count = 0
        end_idx = -1
        for idx in range(start_idx + len(sneak_start_sig) - 1, len(content)):
            char = content[idx]
            if char == '{':
                brace_count += 1
            elif char == '}':
                brace_count -= 1
                if brace_count == 0:
                    end_idx = idx + 1
                    break
                    
        if end_idx != -1:
            old_sneak_func = content[start_idx:end_idx]
            
            new_sneak_func = """async function triggerSneakAttackSuccessEffects(card) {
  if (!card) return;
  
  // 1. \\u200b\\u5f9e\\u6b64\\u958b\\u59cb\\u8a18\\u9304\\u5077\\u8972\\u6210\\u529f\\u6b21\\u6578
  window.XLW_turnSneakCount = (window.XLW_turnSneakCount || 0) + 1;
  logBattle(`\\ud83e\\udd77 \\u5077\\u8972\\u6210\\u529f\\uff01\\u622c\\u56de\\u5408\\u7d2f\\u8a08\\u5077\\u8972\\u6210\\u529f\\u6b21\\u6578\\uff1a${window.XLW_turnSneakCount} \\u6b21\\u3002`);
  
  const executedEffects = new Set();
  
  while (true) {
    const choices = [];
    
    // (a) Black Meow (\\u9ed1\\u55b5)
    if ((card.id === "CAT_0011" || card.id === "R-CAT-0011" || card.id === "CAT_012" || card.name.includes("\\u9ed1\\u55b5")) && !executedEffects.has("black_meow")) {
      let hasEnemy = false;
      for (const zone of ["enemy_front", "enemy_back"]) {
        if (field[zone].some(u => u !== null)) hasEnemy = true;
      }
      if (hasEnemy) {
        choices.push({ text: "\\ud83e\\udd77 \\u9ed1\\u55b5\\uff1a\\u9078\\u64c7\\u7834\\u58bad\\u5c0d\\u624b\\u4e00\\u500b\\u55ae\\u4f4d", value: "black_meow" });
      }
    }
    
    // (b) Zombie Meow (\\u6bad\\u5c4d\\u55b5)
    if ((card.id === "CAT_003" || card.id === "R-CAT-0044" || card.name.includes("\\u6bad\\u5c4d\\u55b5")) && !executedEffects.has("zombie_meow")) {
      const isMeowCard = (c) => c && (c.deck === "\\u55b5\\u55b5\\u8cca" || c.faction === "\\u55b5\\u55b5\\u8cca" || (c.id && (String(c.id).includes("CAT") || String(c.id).includes("cat"))));
      const meowCardsInHand = hand.filter(isMeowCard);
      const meowUnitsInGraveyard = graveyard.filter(c => c && c.type === "unit" && isMeowCard(c));
      if (meowCardsInHand.length > 0 && meowUnitsInGraveyard.length > 0) {
        choices.push({ text: "\\u2623 \\u6bad\\u5c4d\\u55b5\\uff1a\\u6368\\u68c4 1 \\u5f35\\u624b\\u724c\\u4e26\\u56de\\u6536\\u589b\\u5730 1 \\u55ae\\u4f4d", value: "zombie_meow" });
      }
    }
    
    // (c) Medical Meow (\\u91ab\\u7642\\u55b5)
    if ((card.id === "CAT_0023" || card.name.includes("\\u91ab\\u7642\\u55b5")) && !executedEffects.has("medical_meow")) {
      const isMeowCard = (c) => c && (c.deck === "\\u55b5\\u55b5\\u8cca" || c.faction === "\\u55b5\\u55b5\\u8cca" || (c.id && (String(c.id).includes("CAT") || String(c.id).includes("cat"))));
      const meowUnitsInGraveyard = graveyard.filter(c => c && c.type === "unit" && isMeowCard(c));
      let emptySlots = [];
      for (const zone of ["player_front", "player_back"]) {
        for (let i = 0; i < 5; i++) {
          if (!field[zone][i]) emptySlots.push({ zone, idx: i });
        }
      }
      if (meowUnitsInGraveyard.length > 0 && emptySlots.length > 0) {
        choices.push({ text: "\\ud83c\\udfe5 \\u91ab\\u7642\\u55b5\\uff1a\\u5fa9\\u6d3b\\u81f3\\u591a 2 \\u500b\\u589b\\u5730\\u55b5\\u55ae\\u4f4d\\u81f3\\u6211\\u65b9\\u7a7a\\u683c", value: "medical_meow" });
      }
    }
    
    // (d) Brawler Meow (\\u6253\\u624b\\u55b5)
    if ((card.id === "CAT_0050" || card.name.includes("\\u6253\\u624b\\u55b5")) && !executedEffects.has("brawler_meow")) {
      choices.push({ text: "\\ud83e\\udd77 \\u6253\\u624b\\u55b5\\uff1a\\u6211\\u65b9\\u984d\\u5916\\u5206\\u657a +1\\u2605", value: "brawler_meow" });
    }
    
    // (e) Bomb Meow (\\u70b8\\u5f48\\u55b5)
    if ((card.id === "CAT_009" || card.name.includes("\\u70b8\\u5f48\\u55b5")) && !executedEffects.has("bomb_meow")) {
      const isMeowCard = (c) => c && (c.deck === "\\u55b5\\u55b5\\u8cca" || c.faction === "\\u55b5\\u55b5\\u8cca" || (c.id && (String(c.id).includes("CAT") || String(c.id).includes("cat"))));
      const meowCardsInGraveyard = graveyard.filter(isMeowCard);
      if (meowCardsInGraveyard.length > 0) {
        choices.push({ text: "\\ud83d\\udca5 \\u70b8\\u5f48\\u55b5\\uff1a\\u9664\\u5916\\u6211\\u65b9\\u5893\\u5730\\u81f3\\u591a 2 \\u5f35\\u55b5\\u55b5\\u5361\\u724c", value: "bomb_meow" });
      }
    }
    
    // (f) Caitlyn (\\u51f1\\u7279\\u7433)
    let hasCaitlynOnField = false;
    for (const zone of ["player_front", "player_back"]) {
      for (let i = 0; i < 5; i++) {
        const u = field[zone][i];
        if (u && (u.card?.id === "CAT_0052" || u.card?.id === "R-CAT-0052" || u.card?.name.includes("\\u51f1\\u7279\\u7433"))) {
          hasCaitlynOnField = true;
          break;
        }
      }
      if (hasCaitlynOnField) break;
    }
    if ((card.id === "CAT_0052" || card.id === "R-CAT-0052" || card.name.includes("\\u51f1\\u7279\\u7433") || hasCaitlynOnField) && !executedEffects.has("caitlyn")) {
      const pts = window.XLW_turnSneakCount || 1;
      choices.push({ text: "\\ud83d\\udc51 \\u51f1\\u7279\\u7433\\uff1a\\u9023\\u64ca\\u52a0\\u5206 + " + pts + " \\u2605", value: "caitlyn" });
    }
    
    // (g) Hand link summons
    let hasEmptySlot = false;
    for (const zone of ["player_front", "player_back"]) {
      if (field[zone].some(u => u === null)) {
        hasEmptySlot = true;
        break;
      }
    }
    
    if (hasEmptySlot) {
      const isMeowSummonCard = (c) => {
        if (!c) return false;
        const cid = c.id;
        if (cid === "CAT-0003" || cid === "CAT_015" || c.name.includes("\\u9a5a\\u559c\\u55b5") ||
            cid === "CAT-0008" || cid === "CAT_013" || c.name.includes("\\u8001\\u55b5") ||
            cid === "CAT-0032" || cid === "SR-CAT-0032" || c.name.includes("\\u6b21\\u5143\\u7a81\\u64ca\\u55b5") ||
            cid === "CAT_0050" || c.name.includes("\\u6253\\u624b\\u55b5") ||
            cid === "CAT_005" || c.name.includes("\\u7da0\\u55b5")) {
          return true;
        }
        if ((cid === "CAT_0052" || cid === "R-CAT-0052" || c.name.includes("\\u51f1\\u7279\\u7433")) && window.XLW_turnSneakCount >= 2) {
          return true;
        }
        return false;
      };
      
      hand.forEach((c, idx) => {
        if (isMeowSummonCard(c) && !executedEffects.has(`hand_summon_${c.id}_${idx}`)) {
          choices.push({ text: `\\ud83d\\udc08 \\u624b\\u724c\\u9023\\u52d5\\uff1a\\u53ec\\u55b5\\u624b\\u724c\\u7684 ${c.name}`, value: `hand_summon_${idx}` });
        }
      });
    }
    
    if (choices.length === 0) {
      break;
    }
    
    choices.push({ text: "\\u274c \\u7d50\\u675f / \\u4e0d\\u767c\\u52d5\\u5269\\u9918\\u6548\\u679c", value: "end_effects" });
    
    const chosen = await showXLWChoiceModal(
      "\\ud83e\\udd77 \\u5077\\u8972\\u6210\\u529f\\u9023\\u52d5\\u6548\\u679c\\u8a15\\u555f",
      "\\u8acb\\u9078\\u64c7\\u63a5\\u4e0b\\u4f86\\u8981\\u512a\\u5148\\u767c\\u52d5\\u7684\\u9023\\u52d5\\u6548\\u679c\\uff0c\\u621f\\u9078\\u64c7\\u7d50\\u675f\\u9023\\u52d5\\uff1a",
      choices
    );
    
    if (chosen === "end_effects" || !chosen) {
      break;
    }
    
    if (chosen === "black_meow") {
      executedEffects.add("black_meow");
      window.XLW_blackCatChoosing = true;
      setStatus("\\ud83e\\udd77 \\u8acb\\u9ede\\u9078\\u6575\\u65b9\\u5834\\u4e0a\\u4e00\\u500b\\u55ae\\u4f4d\\u9032\\u884c\\u7834\\u58bad\\uff01");
      render();
      await new Promise(r => { window.XLW_blackCatResolve = r; });
    } else if (chosen === "zombie_meow") {
      executedEffects.add("zombie_meow");
      const isMeowCard = (c) => c && (c.deck === "\\u55b5\\u55b5\\u8cca" || c.faction === "\\u55b5\\u55b5\\u8cca" || (c.id && (String(c.id).includes("CAT") || String(c.id).includes("cat"))));
      const meowCardsInHand = hand.filter(isMeowCard);
      const meowUnitsInGraveyard = graveyard.filter(c => c && c.type === "unit" && isMeowCard(c));
      if (meowCardsInHand.length > 0 && meowUnitsInGraveyard.length > 0) {
        const discardCard = meowCardsInHand[0];
        const discardIdx = hand.indexOf(discardCard);
        if (discardIdx >= 0) {
          hand.splice(discardIdx, 1);
          graveyard.push(discardCard);
          logBattle(`\\u2623 \\u6bad\\u5c4d\\u55b5 \\u6548\\u679c\\uff1a\\u6211\\u65b9\\u4e3b\\u52d5\\u6368\\u68c4\\u624b\\u724c\\u4e2d\\u7684 ${discardCard.name}\\u3002`);
          
          const recoverCard = meowUnitsInGraveyard[0];
          const recoverIdx = graveyard.indexOf(recoverCard);
          if (recoverIdx >= 0) {
            graveyard.splice(recoverIdx, 1);
            hand.push(recoverCard);
            logBattle(`\\u2623 \\u6bad\\u5c4d\\u55b5 \\u6548\\u679c\\uff1a\\u6210\\u529f\\u5f9e\\u5893\\u5730\\u5c07 ${recoverCard.name} \\u53ec\\u56de\\u624b\\u724c\\uff01`);
          }
          render();
        }
      }
    } else if (chosen === "medical_meow") {
      executedEffects.add("medical_meow");
      const isMeowCard = (c) => c && (c.deck === "\\u55b5\\u55b5\\u8cca" || c.faction === "\\u55b5\\u55b5\\u8cca" || (c.id && (String(c.id).includes("CAT") || String(c.id).includes("cat"))));
      const meowUnitsInGraveyard = graveyard.filter(c => c && c.type === "unit" && isMeowCard(c));
      let emptySlots = [];
      for (const zone of ["player_front", "player_back"]) {
        for (let i = 0; i < 5; i++) {
          if (!field[zone][i]) emptySlots.push({ zone, idx: i });
        }
      }
      if (meowUnitsInGraveyard.length > 0 && emptySlots.length > 0) {
        const countToRevive = Math.min(2, meowUnitsInGraveyard.length, emptySlots.length);
        for (let i = 0; i < countToRevive; i++) {
          const unitToRevive = meowUnitsInGraveyard[i];
          const slot = emptySlots[i];
          
          const graveIdx = graveyard.indexOf(unitToRevive);
          if (graveIdx >= 0) graveyard.splice(graveIdx, 1);
          
          field[slot.zone][slot.idx] = {
            card: unitToRevive,
            tapped: false,
            attacking: false,
            target: null
          };
          logBattle(`\\ud83c\\udfe5 \\u91ab\\u7642\\u55b5 \\u6548\\u679c\\uff1a\\u6210\\u529f\\u5c07 ${unitToRevive.name} \\u5f9e\\u5893\\u5730\\u5fa9\\u6d3b\\u81f3\\u6211\\u65b9\\u5834\\u4e0a [${slot.zone === "player_front" ? "\\u524d\\u6392" : "\\u5f8c\\u6392"}] \\u7684\\u7b2c ${slot.idx + 1} \\u683c\\u3002`);
        }
        render();
      }
    } else if (chosen === "brawler_meow") {
      executedEffects.add("brawler_meow");
      playerBonusScore += 1;
      logBattle(`\\ud83e\\udd77 \\u6253\\u624b\\u55b5 \\u6548\\u679c\\u767c\\u52d5\\uff1a\\u6211\\u65b9\\u984d\\u5916\\u5206\\u657a +1\\u2605\\u3002`);
      renderScore();
    } else if (chosen === "bomb_meow") {
      executedEffects.add("bomb_meow");
      const isMeowCard = (c) => c && (c.deck === "\\u55b5\\u55b5\\u8cca" || c.faction === "\\u55b5\\u55b5\\u8cca" || (c.id && (String(c.id).includes("CAT") || String(c.id).includes("cat"))));
      const meowCardsInGraveyard = graveyard.filter(isMeowCard);
      if (meowCardsInGraveyard.length > 0) {
        const countToRemove = Math.min(2, meowCardsInGraveyard.length);
        let removedNames = [];
        for (let i = 0; i < countToRemove; i++) {
          const cardToRemove = meowCardsInGraveyard[i];
          const idxInGrave = graveyard.indexOf(cardToRemove);
          if (idxInGrave >= 0) {
            graveyard.splice(idxInGrave, 1);
            removedNames.push(cardToRemove.name);
          }
        }
        logBattle(`\\ud83d\\udca5 \\u70b8\\u5f48\\u55b5 \\u6548\\u679c\\u767c\\u52d5\\uff1a\\u9664\\u5916\\u6211\\u65b9\\u5893\\u5730\\u4e2d\\u7684 ${removedNames.join(", ")}\\u3002`);
        render();
      }
    } else if (chosen === "caitlyn") {
      executedEffects.add("caitlyn");
      const pts = window.XLW_turnSneakCount || 1;
      playerBonusScore += pts;
      logBattle(`\\ud83d\\udc51 \\u9ed1\\u5e6b\\u9996\\u55b5 \\u51f1\\u7279\\u7433 \\u6548\\u679c\\u767c\\u52d5\\uff1a\\u672c\\u56de\\u5408\\u5df2\\u7d2f\\u8a08\\u5077\\u8972 ${pts} \\u6b21\\uff0c\\u6211\\u65b9\\u984d\\u5916\\u5206\\u657a +${pts}\\u2605\\u3002`);
      renderScore();
    } else if (chosen.startsWith("hand_summon_")) {
      const idx = parseInt(chosen.replace("hand_summon_", ""));
      const extraCard = hand[idx];
      if (extraCard) {
        executedEffects.add(`hand_summon_${extraCard.id}_${idx}`);
        window.XLW_bypassNormalSummonLimit = true;
        selectedHandForSummon = idx;
        setStatus(`\\u3010\\u9023\\u52d5\\u984d\\u5916\\u53ec\\u5595\\u3011\\u8acb\\u9ede\\u9078\\u6211\\u65b9\\u4e00\\u500b\\u7a7a\\u683c\\u653e\\u7f6e <b>${extraCard.name}</b>\\uff01`);
        render();
        await new Promise(r => { window.XLW_summonPlacementResolve = r; });
      }
    }
  }

  // \\u8b8a\\u88dd\\u55b5 (CAT_012) \\u2014\\u2014 \\u5f37\\u5236\\u96a8\\u6a5f\\u6368\\u724c (\\u7368\\u7acb\\u653e\\u5728\\u4e3b\\u52d5\\u9078\\u64c7\\u4e4b\\u591a)
  if (card.id === "CAT_012" || card.name.includes("\\u8b8a\\u88dd\\u55b5")) {
    if (isMultiplayer) {
      ws.send(JSON.stringify({ action: "trigger_opponent_discard" }));
      logBattle("\\ud83e\\udd77 \\u8b8a\\u88dd\\u55b5 \\u6548\\u679c\\uff1a\\u5df2\\u5411\\u5c0d\\u624b\\u767c\\u9001\\u96a8\\u6a5f\\u6368\\u68c4\\u624b\\u724c\\u6307\\u4ee4\\u3002");
    } else {
      if (window.XLW_ENEMY.hand && window.XLW_ENEMY.hand.length > 0) {
        const idx = Math.floor(Math.random() * window.XLW_ENEMY.hand.length);
        const discarded = window.XLW_ENEMY.hand.splice(idx, 1)[0];
        enemyGraveyard.push(discarded);
        logBattle(`\\ud83e\\udd77 \\u8b8a\\u88dd\\u55b5 \\u6548\\u679c\\uff1a\\u5c0d\\u624b\\u88ab\\u8forced\\u96a8\\u6a5f\\u6368\\u68c4\\u4e86\\u624b\\u724c\\u4e2d\\u7684 ${discarded.name}\\uff01`);
        render();
      } else {
        logBattle("\\ud83e\\udd77 \\u8b8a\\u88dd\\u55b5 \\u6548\\u679c\\uff1a\\u5c0d\\u624b\\u624b\\u724c\\u5df2\\u7a7a\\uff0c\\u7121\\u5361\\u724c\\u53ef\\u6368\\u68c4\\u3002");
      }
    }
  }

  render();
}"""
            content = content.replace(old_sneak_func, new_sneak_func)
            print("Successfully replaced triggerSneakAttackSuccessEffects function.")
        else:
            print("WARNING: Could not find triggerSneakAttackSuccessEffects function closing brace!")
    else:
        print("WARNING: Could not find triggerSneakAttackSuccessEffects start signature!")

    # 5. renderBattleLine replacement (no (已灰) text, metallic grey styles, warning pulse threats)
    battle_line_sig = """function renderBattleLine() {
  document.querySelectorAll(".battle-cell").forEach((cell, i) => {
    cell.textContent = `★${i + 1}`;
    cell.className = "battle-cell";

    if (countdownActive && i >= countdownRemaining) {
      cell.classList.add("greyed-battle-cell");
      cell.textContent = `★${i + 1} (已灰)`;
    } else {
      const hasAttacker = (field.player_front[i] && field.player_front[i].attacking) ||
                          (field.player_back[i] && field.player_back[i].attacking) ||
                          (field.enemy_front[i] && field.enemy_front[i].attacking);

      if (hasAttacker) {
        cell.textContent = `★${i + 1} ⚔`;
        cell.classList.add("line-has-attacker");
      }
    }
  });
}"""

    new_battle_line = """function renderBattleLine() {
  document.querySelectorAll(".battle-cell").forEach((cell, i) => {
    cell.textContent = `★${i + 1}`;
    cell.className = "battle-cell";

    if (countdownActive) {
      if (i >= countdownRemaining) {
        cell.classList.add("greyed-battle-cell");
      } else if (i === countdownRemaining - 1) {
        cell.classList.add("countdown-threat-cell");
        cell.textContent = `★${i + 1} ⚠️`;
      }
    } else {
      const hasAttacker = (field.player_front[i] && field.player_front[i].attacking) ||
                          (field.player_back[i] && field.player_back[i].attacking) ||
                          (field.enemy_front[i] && field.enemy_front[i].attacking);

      if (hasAttacker) {
        cell.textContent = `★${i + 1} ⚔`;
        cell.classList.add("line-has-attacker");
      }
    }
  });
}"""
    content = content.replace(battle_line_sig, new_battle_line)

    # 6. Scoreboard color details in renderScore()
    old_score_subrow_player = "<span>場上星星: ${playerFieldStars} ★ | 額外分數: ${playerBonusScore} ★</span>"
    new_score_subrow_player = '<span>\\u5834\\u4e0a\\u661f\\u661f: <span style="color: #ffd76a;">${playerFieldStars} ★</span> | \\u984d\\u5916\\u5206\\u657a: <span style="color: #ff5252;">${playerBonusScore} ★</span></span>'
    content = content.replace(old_score_subrow_player, new_score_subrow_player)

    old_score_subrow_enemy = "<span>場上星星: ${enemyFieldStars} ★ | 額外分數: ${enemyBonusScore} ★</span>"
    new_score_subrow_enemy = '<span>\\u5834\\u4e0a\\u661f\\u661f: <span style="color: #ffd76a;">${enemyFieldStars} ★</span> | \\u984d\\u5916\\u5206\\u657a: <span style="color: #ff5252;">${enemyBonusScore} ★</span></span>'
    content = content.replace(old_score_subrow_enemy, new_score_subrow_enemy)

    # 7. renderEnemyPanel dynamic text updating
    old_enemy_panel = """function renderEnemyPanel() {
  const panel = $("xlwEnemyInfoPanel") || (() => {
    const div = document.createElement("div");
    div.id = "xlwEnemyInfoPanel";
    div.className = "xlw-enemy-info-panel";
    div.innerHTML = `<div class="enemy-info-title">對手狀態：妖怪村莊</div><div>對手牌庫：<span id="enemyDeckCountInfo">0</span></div><div>對手手牌：<span id="enemyHandCountInfo">0</span></div>`;
    document.body.appendChild(div);
    return div;
  })();

  const d = $("enemyDeckCountInfo");
  const h = $("enemyHandCountInfo");
  if (d) d.textContent = window.XLW_ENEMY.deck.length;
  if (h) h.textContent = window.XLW_ENEMY.hand.length;
}"""

    new_enemy_panel = """function renderEnemyPanel() {
  const panel = $("xlwEnemyInfoPanel") || (() => {
    const div = document.createElement("div");
    div.id = "xlwEnemyInfoPanel";
    div.className = "xlw-enemy-info-panel";
    document.body.appendChild(div);
    return div;
  })();

  const deckName = window.XLW_ENEMY.deckName || "\\u5996\\u602a\\u6751\\u83aa";
  panel.innerHTML = `
    <div class="enemy-info-title">\\u5c0d\\u624b\\u72c0\\u614b\\uff1a${deckName}</div>
    <div>\\u5c0d\\u624b\\u724c\\u5e6b\\uff1a<span id="enemyDeckCountInfo">${window.XLW_ENEMY.deck.length}</span></div>
    <div>\\u5c0d\\u624b\\u624e\\u724c\\uff1a<span id="enemyHandCountInfo">${window.XLW_ENEMY.hand.length}</span></div>
  `;
}"""

    content = content.replace(old_enemy_panel, new_enemy_panel)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Finished applying fixes to {filepath}.")

apply_fixes_to_file('static/game_v8.js')
apply_fixes_to_file('static/game.js')
