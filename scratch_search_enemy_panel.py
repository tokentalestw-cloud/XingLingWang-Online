with open('static/game_v8.js', 'r', encoding='utf-8') as f:
    content = f.read()

import re
def decode_match(m):
    try:
        return m.group(0).encode().decode('unicode-escape')
    except Exception:
        return m.group(0)

decoded_content = re.sub(r'\\u[0-9a-fA-F]{4}', decode_match, content)

for idx, line in enumerate(decoded_content.splitlines(), 1):
    if "enemy-info-panel" in line or "xlw-enemy-info-panel" in line or "enemyInfoPanel" in line:
        print(f"Line {idx}: {line.strip()[:180]}")
