with open('static/game_v8.js', 'r', encoding='utf-8') as f:
    content = f.read()

targets = ["setupWebSocketEvents", "adjustBoardScale", "logBattle", "triggerSneakAttackSuccessEffects"]
for t in targets:
    count = content.count(t)
    print(f"Occurrences of '{t}': {count}")
