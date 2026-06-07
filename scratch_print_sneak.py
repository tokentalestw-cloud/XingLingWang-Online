with open('static/game_v8.js', 'r', encoding='utf-8') as f:
    content = f.read()

import re
def decode_match(m):
    try:
        return m.group(0).encode().decode('unicode-escape')
    except Exception:
        return m.group(0)

decoded_content = re.sub(r'\\u[0-9a-fA-F]{4}', decode_match, content)

lines = decoded_content.splitlines()
found = False
for idx, line in enumerate(lines, 1):
    if "async function triggerSneakAttackSuccessEffects" in line:
        print(f"Found triggerSneakAttackSuccessEffects at line {idx}")
        # print 50 lines
        for i in range(idx-1, min(idx+120, len(lines))):
            print(f"{i+1}: {lines[i]}")
        found = True
        break
if not found:
    print("Could not find triggerSneakAttackSuccessEffects!")
