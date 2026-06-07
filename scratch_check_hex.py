with open('static/game.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Let's find triggerSneakAttackSuccessEffects function in game.js
start_sig = "async function triggerSneakAttackSuccessEffects(card) {"
start_idx = content.find(start_sig)
if start_idx != -1:
    print(f"Found sneak start at: {start_idx}")
    # Let's search for the end of triggerSneakAttackSuccessEffects function by matching brackets!
    # triggerSneakAttackSuccessEffects is a function that starts with { at start_idx + len(start_sig) - 1
    # Let's find the closing brace!
    brace_count = 0
    in_comment = False
    in_string = False
    string_char = ''
    
    end_idx = -1
    for idx in range(start_idx + len(start_sig) - 1, len(content)):
        char = content[idx]
        if char == '{':
            brace_count += 1
        elif char == '}':
            brace_count -= 1
            if brace_count == 0:
                end_idx = idx + 1
                break
                
    if end_idx != -1:
        print(f"Found sneak end at: {end_idx}")
        sneak_func = content[start_idx:end_idx]
        print("First 150 chars:")
        print(sneak_func[:150])
        print("Last 150 chars:")
        print(sneak_func[-150:])
    else:
        print("Could not find matching closing brace!")
else:
    print("Could not find start signature!")
