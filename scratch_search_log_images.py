from pathlib import Path

log_path = Path("C:/Users/a2132/.gemini/antigravity/brain/03a5c827-f04f-4441-a903-ae2f4b2b4477/.system_generated/tasks/task-6289.log")
with open(log_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

print("Search for cat or vlg image loads in uvicorn log:")
found = False
for line in lines:
    if "cat_" in line.lower() or "vlg_" in line.lower() or "cat_images" in line.lower():
        print(line.strip())
        found = True

if not found:
    print("NO cat_ or vlg_ image loads found in the log!")
