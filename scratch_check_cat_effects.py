with open('static/game_v8.js', 'r', encoding='utf-8') as f:
    content = f.read()

keywords = [
    '老喵', '騎士喵', '幽靈喵', '公關姐姐喵', '殭屍喵', 
    '彈弓喵', '漏食球', '虎老大', '黑喵', '醫療喵', 
    '喵女', '次元突擊喵', '黑幫首喵', '凱特琳'
]

matches = []
lines = content.splitlines()
for kw in keywords:
    matches.append(f"=== Keyword: {kw} ===")
    found = False
    for i, line in enumerate(lines):
        if kw in line:
            matches.append(f"{i+1}: {line}")
            found = True
    if not found:
        matches.append("Not found!")
    matches.append("")

with open('scratch_cat_effects_search.txt', 'w', encoding='utf-8') as out:
    out.write('\n'.join(matches))

print("Wrote output to scratch_cat_effects_search.txt")
