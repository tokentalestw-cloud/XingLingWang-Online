with open('static/game.js', 'r', encoding='utf-8') as f:
    js_content = f.read()
with open('static/game_v8.js', 'r', encoding='utf-8') as f:
    v8_content = f.read()

# Let's check how many lines they have
js_lines = js_content.splitlines()
v8_lines = v8_content.splitlines()
print(f"game.js lines: {len(js_lines)}")
print(f"game_v8.js lines: {len(v8_lines)}")

# Let's find if they differ significantly
# We can find where they start to differ
min_len = min(len(js_lines), len(v8_lines))
diff_found = False
for idx in range(min_len):
    if js_lines[idx] != v8_lines[idx]:
        print(f"First diff at line {idx+1}:")
        print(f"game.js: {js_lines[idx][:120]}")
        print(f"game_v8.js: {v8_lines[idx][:120]}")
        diff_found = True
        break
if not diff_found:
    print("Files are identical up to min_len.")
