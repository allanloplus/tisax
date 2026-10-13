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
echo 試錄「課程開場」一段（約 20 多句，Allan＝雲哲、ARALE＝曉雨）...
%PY% tools\tts_edge.py --only v-intro-0
if errorlevel 1 ( echo 錄音失敗，請把上方訊息截圖給 Claude。 & pause & exit /b 1 )
%PY% tools\build.py
echo.
echo 完成！即將開啟資料夾，請點 000.mp3、001.mp3… 試聽。
echo 也可以開啟 video.html，選「課程開場」整段播放。
start "" "%~dp0audio\v-intro-0"
pause
