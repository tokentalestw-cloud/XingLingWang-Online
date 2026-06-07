with open('static/game_v8.js', 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.splitlines()

# Card IDs or parts to look for
ids_to_check = [
    'CAT-0008', 'CAT_0008', '0008',
    'CAT-0015', 'CAT_0015', '0015',
    'CAT-0021', 'CAT_0021', '0021',
    'CAT-0041', 'CAT_0041', '0041',
    'CAT-0044', 'CAT_0044', '0044',
    'CAT-0045', 'CAT_0045', '0045',
    'CAT-0053', 'CAT_0053', '0053',
    'CAT-0004', 'CAT_0004', '0004',
    'CAT-0011', 'CAT_0011', '0011',
    'CAT-0023', 'CAT_0023', '0023',
    'CAT-0024', 'CAT_0024', '0024',
    'CAT-0032', 'CAT_0032', '0032',
    'CAT-0052', 'CAT_0052', '0052'
]

matches = []
for cid in ids_to_check:
    found = False
    for i, line in enumerate(lines):
        if cid in line:
            if not found:
                matches.append(f"=== Match for {cid} ===")
                found = True
            matches.append(f"{i+1}: {line}")
    if found:
        matches.append("")

with open('scratch_cat_ids_search.txt', 'w', encoding='utf-8') as out:
    out.write('\n'.join(matches))

print("Wrote output to scratch_cat_ids_search.txt")
