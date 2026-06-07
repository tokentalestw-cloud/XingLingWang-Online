# 星靈王

## 本機執行

```bash
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8011
```

或 Windows 雙擊：

```text
一鍵啟動_本機測試_PORT8011.bat
```

## Render 部署

Build Command:

```bash
pip install -r requirements.txt
```

Start Command:

```bash
uvicorn app:app --host 0.0.0.0 --port $PORT
```

Health Check Path:

```text
/health
```

## GitHub Desktop

請用 `File → Create New Repository`，Local Path 選解壓縮後的資料夾。
