Created At: 2026-05-30T01:00:08Z
Completed At: 2026-05-30T01:00:10Z

				The command failed with exit code: 1
				Output:
				Line 100: window.XLW_turnSneakCount = 0;
Line 432: window.XLW_turnSneakCount = 0;
Line 1261: const attackerHasSneak = (attackerCard.keywords && attackerCard.keywords.includes("\u5077\u8972")) ||
Line 1262: (attackerCard.effect_text && attackerCard.effect_text.includes("\u5077\u8972"));
Line 1322: // 6. �ŧ (Sneak Attack) �ĪG�ΡG�\�i�æs�A�N�d�^�P
Line 1323: let sneakMsg = "";
Line 1324: if (attackerHasSneak && !attackerShouldDie && defenderShouldDie) {
Line 1330: sneakMsg = `�A�B�Ĳ�o�u�ŧ�v�\�^�P`;
Line 1344: sneakMsg = `�A�BĲ�o�u�ŧ�v�\�^�ڤ�P`;
Line 1347: await triggerSneakAttackSuccessEffects(attacker.card);
Line 1353: sneakMsg = `�A�ڤ�ܩ�u�ŧ�v�^�A�ϸӳ�d�b�W�B�h�Ҫ�A`;
Line 1372: combatMsg = `${unitName(attacker)} �\�}�F ${unitName(defender)}${piercingMsg}${sneakMsg}`;
Line 1374: combatMsg = `${unitName(attacker)} �i�F ${unitName(defender)}�A�Ҧw�M�L�~${sneakMsg}`;
Line 1582: window.XLW_turnSneakCount = 0;
Line 2511: window.XLW_turnSneakCount = 0;
Line 2880: async function triggerSneakAttackSuccessEffects(card) {
Line 2884: window.XLW_turnSneakCount = (window.XLW_turnSneakCount || 0) + 1;
Traceback (most recent call last):
  File "C:\Users\a2132\Documents\�P�F�\XingLingWang_v7_fixed\scratch_search.py", line 9, in <module>
    print(f"Line {i}: {line.strip()[:140]}")
    ~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
UnicodeEncodeError: 'cp950' codec can't encode character '\U0001f977' in position 22: illegal multibyte sequence

