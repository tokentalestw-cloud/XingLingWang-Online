import os

def fix_unicode_bug(filepath):
    print(f"Fixing invalid unicode escape sequence in {filepath}...")
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace the corrupted \\u8forced or \u8forced with the correct \u88ab\u5f37\u5236 (被強制) using raw strings
    content = content.replace(r"\u8forced", r"\u88ab\u5f37\u5236")
    content = content.replace(r"\\u8forced", r"\\u88ab\\u5f37\\u5236")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Finished fixing {filepath}.\n")

fix_unicode_bug('static/game_v8.js')
fix_unicode_bug('static/game.js')
