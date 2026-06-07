import re
import json

with open('static/game_v8.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Let's find "立即" which is \u7acb\u5373
# "喵女" is \u55b4\u5973
# "偷襲" is \u507d\u8972 or \u5077\u8972
# Let's write a helper to decode escaped unicode in JS
def find_unescaped(pattern, content):
    matches = []
    for m in re.finditer(r'\\u[0-9a-fA-F]{4}', content):
        char = m.group(0).encode().decode('unicode-escape')
        # if we decode it, we can check
    # Let's just decode the entire file's unicode escapes for searching
    decoded = content.encode('utf-8').decode('unicode-escape', errors='ignore')
    for line_num, line in enumerate(decoded.splitlines(), 1):
        if pattern in line:
            print(f"Line {line_num}: {line.strip()[:150]}")

print("--- Searching for 喵女 ---")
find_unescaped("喵女", content)
print("--- Searching for 立即 ---")
find_unescaped("立即", content)
print("--- Searching for 偷襲 ---")
find_unescaped("偷襲", content)
print("--- Searching for 妖怪村莊 ---")
find_unescaped("妖怪村莊", content)
