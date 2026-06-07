with open('static/style_v8.css', 'r', encoding='utf-8') as f:
    content = f.read()

for idx, line in enumerate(content.splitlines(), 1):
    if any(k in line for k in ["forest-3d", "traveler-3d", "traveler-3d-img", "standee"]):
        print(f"Line {idx}: {line.strip()[:180]}")
