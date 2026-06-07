import json

with open('data/cards.json', 'r', encoding='utf-8') as f:
    cards = json.load(f)

card_map = {c['id']: c for c in cards}

ids = [
    'CAT-0008', 'CAT-0015', 'R-CAT-0021', 'R-CAT-0041', 'R-CAT-0044', 
    'SR-CAT-0045', 'SR-CAT-0053', 'SSR-CAT-0004', 'SSR-CAT-0011', 
    'SSR-CAT-0023', 'SSR-CAT-0024', 'SSR-CAT-0032', 'SSR-CAT-0052', 
    'R-NMG-0020', 'SSR-NMG-0012', 'SR-NMG-0026', 'NEU-0025', 
    'NMG-0039', 'SSR-NMG-0019', 'R-NMG-0023'
]

output = []
for idx, cid in enumerate(ids):
    if cid in card_map:
        c = card_map[cid]
        output.append(f"{idx+1}. ID: {cid}")
        output.append(f"   Name: {c['name']}")
        output.append(f"   Keywords: {c.get('keywords', [])}")
        output.append(f"   Tribute: {c.get('tribute', 0)}")
        output.append(f"   Attack: {c.get('attack', 0)}")
        output.append(f"   Score: {c.get('score', 0)}")
        output.append(f"   Effect Text: {c.get('effect_text', '')}")
    else:
        output.append(f"{idx+1}. ID: {cid} - MISSING IN DATABASE!")
    output.append("-" * 50)

with open('scratch_cat_deck_details.txt', 'w', encoding='utf-8') as out:
    out.write('\n'.join(output))

print("Wrote output to scratch_cat_deck_details.txt")
