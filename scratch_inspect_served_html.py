import urllib.request
import re

url = "http://127.0.0.1:8000/static/deck_builder.html"
print(f"Fetching {url}...")
try:
    with urllib.request.urlopen(url) as response:
        html = response.read().decode('utf-8')
    print("Fetch successful! HTML length:", len(html))
    
    # Search for belongsToDeck in the returned HTML
    belongs_to_deck_match = re.search(r"function belongsToDeck\(.*?\)\s*\{(.*?)\}", html, re.DOTALL)
    if belongs_to_deck_match:
        print("=== belongsToDeck in served HTML ===")
        print(belongs_to_deck_match.group(0))
    else:
        print("belongsToDeck function not found in served HTML!")
        
    # Search for renderLibrary in the returned HTML
    render_library_match = re.search(r"function renderLibrary\(.*?\)\s*\{(.*?)\}", html, re.DOTALL)
    if render_library_match:
        print("=== renderLibrary in served HTML (start) ===")
        print(render_library_match.group(0)[:600])
    else:
        print("renderLibrary function not found in served HTML!")
except Exception as e:
    print("Error fetching URL:", e)
