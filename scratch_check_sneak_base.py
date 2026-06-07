with open('static/game.js', 'r', encoding='utf-8') as f:
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
        print(f"game.js: Found triggerSneakAttackSuccessEffects at line {idx}")
        # Let's count how many lines it is
        break
