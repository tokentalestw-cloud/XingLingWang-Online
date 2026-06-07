import os

def inject_cors_warning(filepath):
    print(f"Injecting CORS file:// guard into {filepath}...")
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Inject check at the top of init() - already done in previous run, but let's make sure it's correct
    old_init_start = "async function init() {\n  try {"
    new_init_start = """async function init() {
  if (window.location.protocol === "file:") {
    showCORSProtocolWarning();
    return;
  }
  try {"""
  
    if old_init_start not in content:
        old_init_start = "async function init() {\r\n  try {"
        new_init_start = """async function init() {
  if (window.location.protocol === "file:") {
    showCORSProtocolWarning();
    return;
  }
  try {"""

    content = content.replace(old_init_start, new_init_start)

    # 2. Append the showCORSProtocolWarning definition at the very end of the file
    warning_func_code = """

function showCORSProtocolWarning() {
  const overlay = document.createElement("div");
  overlay.id = "xlwCorsWarningOverlay";
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(10, 7, 7, 0.96);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999999;
    backdrop-filter: blur(15px);
    font-family: 'Outfit', sans-serif;
  `;
  
  const box = document.createElement("div");
  box.style.cssText = `
    background: linear-gradient(135deg, #1d1412 0%, #0c0807 100%);
    border: 2px solid #ff4d4f;
    border-radius: 16px;
    width: 540px;
    max-width: 92vw;
    padding: 35px;
    box-shadow: 0 15px 50px rgba(255, 77, 79, 0.35);
    text-align: center;
  `;
  
  box.innerHTML = `
    <div style="font-size: 55px; margin-bottom: 15px;">⚠️</div>
    <div style="font-size: 24px; font-weight: bold; color: #ff4d4f; margin-bottom: 18px; text-shadow: 0 0 10px rgba(255,77,79,0.3);">請透過對戰伺服器開啟網址！</div>
    <div style="font-size: 14px; color: #c4b9a6; line-height: 1.8; text-align: left; margin-bottom: 25px; background: rgba(0,0,0,0.35); padding: 18px; border-radius: 10px; border: 1px solid rgba(255,77,79,0.25);">
      偵測到您目前是直接「雙擊打開」本機的 HTML 檔案 (<b>file://</b> 協議)。<br><br>
      由於現代瀏覽器的<b>安全性限制 (CORS)</b>，直接打開本地網頁將會被瀏覽器<b>拒絕載入</b>任何卡牌與對戰數據，進而導致介面完全空白（手牌、格子、計分板皆不見）。<br><br>
      <b>請改為在瀏覽器網址列輸入並前往以下網址（請先啟動伺服器）：</b><br>
      <a href="http://127.0.0.1:8000" target="_blank" style="color: #ffd76a; font-weight: 900; text-decoration: underline; font-size: 18px; display: inline-block; margin-top: 10px; letter-spacing: 0.5px;">http://127.0.0.1:8000</a>
    </div>
    <div style="display: flex; gap: 12px; justify-content: center;">
      <button onclick="window.open('http://127.0.0.1:8000')" style="background: linear-gradient(135deg, #ffd76a, #d4af37); color: #000; border: none; border-radius: 8px; padding: 12px 24px; font-size: 14px; font-weight: bold; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 15px rgba(255,215,106,0.3);">
        點擊前往伺服器網址
      </button>
    </div>
  `;
  
  overlay.appendChild(box);
  document.body.appendChild(overlay);
}

"""
    if "function showCORSProtocolWarning" not in content:
        content += warning_func_code
        print("Appended showCORSProtocolWarning function.")
    else:
        print("Warning function already exists.")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Finished guarding {filepath}.\n")

inject_cors_warning('static/game_v8.js')
inject_cors_warning('static/game.js')
