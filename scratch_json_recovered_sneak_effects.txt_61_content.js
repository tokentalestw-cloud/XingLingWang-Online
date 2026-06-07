Created At: 2026-05-30T10:29:29Z
Completed At: 2026-05-30T10:29:32Z

				The command failed with exit code: 1
				Output:
				Traceback (most recent call last):
  File "<string>", line 6, in <module>
    print(f'{i}: {line.strip()}')
    ~~~~~^^^^^^^^^^^^^^^^^^^^^^^^
UnicodeEncodeError: 'cp950' codec can't encode character '\U0001f977' in position 17: illegal multibyte sequence
100: window.XLW_turnSneakCount = 0;
432: window.XLW_turnSneakCount = 0;
1508: const attackerHasSneak = (attackerCard.keywords && attackerCard.keywords.includes("\u5077\u8972")) ||
1568: // 6. �ŧ (Sneak Attack) �ĪG�ΡG�\�i�æs�A�N�d�^�P
1570: if (attackerHasSneak && !attackerShouldDie && defenderShouldDie) {
1593: await triggerSneakAttackSuccessEffects(attacker.card);
1902: window.XLW_turnSneakCount = 0;
2920: window.XLW_turnSneakCount = 0;
3066: async function triggerSneakAttackSuccessEffects(card) {
3070: window.XLW_turnSneakCount = (window.XLW_turnSneakCount || 0) + 1;

