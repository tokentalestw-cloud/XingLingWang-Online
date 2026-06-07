@echo off
chcp 65001 >nul
title 星靈王 GitHub Ready PORT8011
start "" http://127.0.0.1:8011
python -m uvicorn app:app --host 0.0.0.0 --port 8011
pause
