import subprocess
import time
import urllib.request
import sys

print("正在測試啟動 Uvicorn 伺服器並檢測 HTTP 標頭...")
# 啟動在 8001 連接埠以避免和用戶正在運行的 8000 衝突
proc = subprocess.Popen([sys.executable, "-m", "uvicorn", "app:app", "--host", "127.0.0.1", "--port", "8001"], 
                        stdout=subprocess.PIPE, stderr=subprocess.PIPE)

# 等待 3 秒讓伺服器完全就緒
time.sleep(3)

try:
    req = urllib.request.urlopen("http://127.0.0.1:8001/")
    headers = req.info()
    cache_control = headers.get("Cache-Control")
    pragma = headers.get("Pragma")
    print(f"伺服器回應狀態碼: {req.status}")
    print(f"Cache-Control 標頭內容: {cache_control}")
    print(f"Pragma 標頭內容: {pragma}")
    if cache_control and "no-store" in cache_control:
        print("【成功】防快取標頭（Anti-cache headers）已成功運行且完全生效！")
    else:
        print("【失敗】防快取標頭不符合預期或缺失。")
except Exception as e:
    print(f"連線至測試伺服器時發生錯誤: {e}")
finally:
    proc.terminate()
    print("測試伺服器已安全終止。")
