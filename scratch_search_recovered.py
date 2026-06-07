import os

workspace_dir = r"C:\Users\a2132\Documents\星靈王\XingLingWang_v7_fixed"

# 1. New start.bat
start_bat = """@echo off
chcp 65001 >nul
title 星靈王 啟動器

echo 正在啟動本機伺服器，並於 2 秒後自動開啟瀏覽器...
echo.

start cmd /c "timeout /t 2 /nobreak >nul && python -c \\"import webbrowser; webbrowser.open('http://127.0.0.1:8000')\\""

python -m uvicorn app:app --host 127.0.0.1 --port 8000
pause
"""

# 2. New 一鍵啟動_自動開網址.bat
auto_bat = """@echo off
chcp 65001 >nul
title 星靈王 啟動器

echo.
echo ====================================
echo   星靈王 藝術品修正版 一鍵自動啟動
echo ====================================
echo.
echo 正在啟動本機伺服器，並開啟瀏覽器...
echo 網址：http://127.0.0.1:8000
echo.

start cmd /c "timeout /t 2 /nobreak >nul && python -c \\"import webbrowser; webbrowser.open('http://127.0.0.1:8000')\\""

python -m uvicorn app:app --host 127.0.0.1 --port 8000

echo.
echo 伺服器已停止。
pause
"""

# 3. New 一鍵啟動_延遲開網址.bat
delay_bat = """@echo off
chcp 65001 >nul
title 星靈王 啟動器

echo.
echo ====================================
echo   星靈王 藝術品修正版 一鍵延遲啟動
echo ====================================
echo.
echo 正在啟動伺服器，3秒後自動開啟網址...
echo.

start "星靈王伺服器" cmd /k "chcp 65001 >nul && python -m uvicorn app:app --host 127.0.0.1 --port 8000"

timeout /t 3 /nobreak >nul
python -c "import webbrowser; webbrowser.open('http://127.0.0.1:8000')"

echo.
echo 已開啟瀏覽器。
pause
"""

files_to_write = {
    "start.bat": start_bat,
    "一鍵啟動_自動開網址.bat": auto_bat,
    "一鍵啟動_延遲開網址.bat": delay_bat
}

for filename, content in files_to_write.items():
    filepath = os.path.join(workspace_dir, filename)
    # Save file with CP950 encoding so cmd reads Traditional Chinese correctly
    with open(filepath, 'w', encoding='cp950', errors='replace') as f:
        f.write(content.replace('\n', '\r\n'))
    print(f"Successfully wrote {filename}")
