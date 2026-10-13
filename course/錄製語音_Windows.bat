@echo off
chcp 65001 >nul
set PYTHONIOENCODING=utf-8
cd /d "%~dp0"
set PY=
where python >nul 2>nul && set PY=python
if "%PY%"=="" ( where py >nul 2>nul && set PY=py )
if "%PY%"=="" (
  echo 找不到 Python。請先到 https://www.python.org/downloads/ 下載安裝，
  echo 安裝第一個畫面務必勾選「Add python.exe to PATH」，裝好後再雙擊本檔。
  pause
  exit /b 1
)
echo 正在安裝／更新語音套件 edge-tts ...
%PY% -m pip install -q --upgrade edge-tts
echo.
echo 開始錄製全部 1,526 句（Allan＝雲哲、ARALE＝曉雨），約需 15–30 分鐘，請勿關閉視窗 ...
echo 中途中斷沒關係，再雙擊一次會從未完成的地方接著錄。
%PY% tools\tts_edge.py
%PY% tools\build.py
echo.
echo 完成！若上方有 FAILED，請再雙擊一次本檔補錄。
echo 最後請在 GitHub Desktop 按「Commit」再按「Push origin」上傳。
pause
