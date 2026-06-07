with open('static/style.css', 'r', encoding='utf-8') as f:
    content = f.read()

for idx, line in enumerate(content.splitlines(), 1):
    if "mini-meta" in line:
        print(f"Line {idx}: {line.strip()[:180]}")
