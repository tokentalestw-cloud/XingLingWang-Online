with open('static/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

for idx, line in enumerate(content.splitlines(), 1):
    if "playerForest" in line or "enemyForest" in line or "Forest" in line or "forest" in line:
        print(f"Line {idx}: {line.strip()[:180]}")
