with open('static/game.js', 'r', encoding='utf-8') as f:
    js_content = f.read()
with open('static/game_v8.js', 'r', encoding='utf-8') as f:
    v8_content = f.read()

js_lines = js_content.splitlines()
v8_lines = v8_content.splitlines()

# Let's search for triggerSneakAttackSuccessEffects in both files
for idx, line in enumerate(js_lines, 1):
    if "async function triggerSneakAttackSuccessEffects" in line:
        print(f"game.js sneak at line: {idx}")

for idx, line in enumerate(v8_lines, 1):
    if "async function triggerSneakAttackSuccessEffects" in line:
        print(f"game_v8.js sneak at line: {idx}")
