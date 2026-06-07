Created At: 2026-05-30T01:03:18Z
Completed At: 2026-05-30T01:03:21Z

				The command failed with exit code: 1
				Output:
				Count of triggerSneakAttackSuccessEffects: 2
Found at line: 2645
2643: }
2644: 
2645: async function triggerSneakAttackSuccessEffects(card) {
2646:   if (!card) return;
2647:   
2648:   // 1. �W�^�X�ŧ�\�
2649:   window.XLW_turnSneakCount = (window.XLW_turnSneakCount || 0) + 1;
Traceback (most recent call last):
  File "C:\Users\a2132\Documents\�P�F�\XingLingWang_v7_fixed\scratch_syntax.py", line 19, in <module>
    print(f"{j+1}: {lines[j]}")
    ~~~~~^^^^^^^^^^^^^^^^^^^^^^
UnicodeEncodeError: 'cp950' codec can't encode character '\U0001f977' in position 19: illegal multibyte sequence

