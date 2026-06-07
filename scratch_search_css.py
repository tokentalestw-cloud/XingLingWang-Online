with open('static/style_v8.css', 'r', encoding='utf-8') as f:
    content = f.read()

for idx, line in enumerate(content.splitlines(), 1):
    if any(k in line for k in ["score-badge", "enemy-info", "enemy-status", "yokai", "score", "total-score"]):
        print(f"Line {idx}: {line.strip()[:180]}")
