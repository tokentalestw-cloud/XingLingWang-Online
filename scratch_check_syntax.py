try:
    with open('static/game_v8.js', 'r', encoding='utf-8') as f:
        content = f.read()
    print("Read game_v8.js successfully.")
    
    # Check for functions and structure
    # Let's count bracket matching
    open_curly = content.count('{')
    close_curly = content.count('}')
    print(f"Brackets: {{ is {open_curly}, }} is {close_curly}")
    if open_curly != close_curly:
        print("WARNING: Brackets mismatch!")
except Exception as e:
    print(f"Error checking game_v8.js: {e}")
