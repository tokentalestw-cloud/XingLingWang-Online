with open('static/game_v8.js', 'r', encoding='utf-8') as f:
    lines = f.read().splitlines()

matches = []
for i, line in enumerate(lines):
    if '偷襲' in line or 'sneak' in line or 'Sneak' in line:
        matches.append(f"{i+1}: {line}")

with open('scratch_sneak_search.txt', 'w', encoding='utf-8') as out:
    out.write('\n'.join(matches))

print("Wrote output to scratch_sneak_search.txt")
