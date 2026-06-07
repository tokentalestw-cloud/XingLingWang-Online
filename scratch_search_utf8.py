import re

with open('static/game_v8.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Let's decode unicode escapes safely line by line
out_lines = []

def decode_match(m):
    try:
        return m.group(0).encode().decode('unicode-escape')
    except Exception:
        return m.group(0)

# Replace \uXXXX with actual characters for easy searching
decoded_content = re.sub(r'\\u[0-9a-fA-F]{4}', decode_match, content)

targets = ["喵女", "立即", "偷襲", "妖怪村莊", "對手狀態", "戰線", "已灰", "分數", "總分", "R-CAT-00", "CAT_", "triggerSneakAttackSuccessEffects"]

with open('scratch_search_results.txt', 'w', encoding='utf-8') as out:
    for t in targets:
        out.write(f"=== SEARCH FOR: {t} ===\n")
        for line_num, line in enumerate(decoded_content.splitlines(), 1):
            if t in line:
                out.write(f"Line {line_num}: {line.strip()[:180]}\n")
        out.write("\n")

print("Search completed. Output written to scratch_search_results.txt")
