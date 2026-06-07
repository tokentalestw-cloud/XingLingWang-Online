with open('static/game_v8.js', 'r', encoding='utf-8') as f:
    lines = f.read().splitlines()

matches = []
for i in range(1025, min(1080, len(lines))):
    matches.append(f"{i+1}: {lines[i]}")

with open('scratch_umbrella_setup.txt', 'w', encoding='utf-8') as out:
    out.write('\n'.join(matches))

print("Wrote output to scratch_umbrella_setup.txt")
