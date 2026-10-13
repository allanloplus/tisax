# ISA 2027 for TISAX 標準要求解說 — 線上課程

講師：Allan Lo（Allan 顧問）｜助教：ARALE
依據：VDA ISA 2027.1（2026-09-30，`ISA2027_1_EN.xlsx`）

## 交付內容

| 項目 | 檔案 | 說明 |
|---|---|---|
| 實體課程講師簡報 | `ISA2027_for_TISAX_標準要求解說_講師簡報.pptx` | 3 小時課程用，含講者備忘稿（notes）、隨堂測驗、情境討論；隨堂測驗答案在備忘稿 |
| 線上文字教材 | `text.html` | 77 個控制項逐條解說（IS 45、PP 20、DP 12）＋TISAX 概論、ISA 結構與成熟度、稽核實務三章。每個控制項分「條文要求／詳細解說／實務作法／稽核實務」四個頁籤，可搜尋、可記錄閱讀進度、可列印 |
| 互動影音教材 | `video.html` | Allan 顧問與 ARALE 的課堂對話（49 段、1,526 句），投影畫面＋角色表情＋字幕＋逐字稿，可選章節、調語速 |
| 課後測驗與證書 | `quiz.html` | IS／PP／DP 各 10 題，80 分通過；需填公司名稱、單位、姓名、職稱、E-mail。通過可下載證書 PNG、證書＋題目解答 PDF（列印另存）與 HTML；未通過會列出建議複習的控制項並要求重新閱讀或重新測驗 |
| 首頁 | `index.html` | 課程介紹與章節地圖 |

## 使用方式

- **直接開啟**：雙擊 `index.html` 即可（所有資料都是 JS 檔，不需伺服器）。
- **放上網站**：把整個 `course/` 資料夾上傳到任何靜態網站空間（公司內網 IIS／Nginx、Netlify、GitHub Pages…）。
  GitHub Pages 可用 `tools/github-pages-workflow.yml`（檔內有步驟）。
- **收集測驗結果（選用）**：依 `tools/google-apps-script.gs` 建立 Google 試算表 Web App，把網址填入 `assets/js/config.js` 的 `submitEndpoint`，學員交卷時會自動新增一列紀錄。未設定時，紀錄只存在學員瀏覽器內，證書由學員自行下載。
- 通過分數、講師名稱可在 `assets/js/config.js` 修改。

## 影音設計（為什麼載入快）

每段影音不是一支大型 MP4，而是「對話腳本＋逐句語音檔」：
- 每段的腳本檔只有幾 KB，每句語音約 30–60 KB（48 kbps 單聲道 MP3），按下播放只要下載第一句即可開始。
- 播放時自動預先載入後面 2–3 句；語音檔缺漏時自動改以字幕計時播放，不會卡住。

## 語音說明

聲線沿用「資安宣導線上動畫課程」的設定：
- **Allan 老師**：微軟台灣國語男聲「雲哲」（zh-TW-YunJheNeural），語速 +6%、音調 −2Hz。
- **ARALE 助教**：微軟台灣國語女聲「曉雨」（zh-TW-HsiaoYuNeural），語速 +10%、音調 +28Hz（提高音調、稍快，可愛俏皮）。

### 在自己的 Windows 電腦錄音（免註冊任何帳號）

微軟的免費語音會拒絕雲端主機連線，因此請在一般家用／公司網路的電腦上錄製：

1. 安裝 [Python](https://www.python.org/downloads/)（安裝第一個畫面勾選「Add python.exe to PATH」）與 [GitHub Desktop](https://desktop.github.com/)。
2. 用 GitHub Desktop 複製（Clone）本專案，並切換到分支 `claude/nifty-babbage-efcjk8`。
3. 打開 `course` 資料夾，雙擊 **`試錄一段_Windows.bat`**：錄「課程開場」一段並開啟資料夾讓您試聽。
4. 聲音確認 OK 後，雙擊 **`錄製語音_Windows.bat`** 錄製全部 1,526 句（約 15–30 分鐘，可中斷後續錄）。
5. 回到 GitHub Desktop，按「Commit」再按「Push origin」上傳。

不需要另外安裝 ffmpeg（有安裝的話會自動統一音量）。語速／音調設定在 `tools/tts_edge.py` 的 `VOICE`。

### 其他方式
- Azure 語音服務（微軟官方 API，需 Azure 帳號）：`tools/tts_azure.py`，用法見檔案開頭。
- 尚未錄製的句子，播放器在 Microsoft Edge 會直接用 Edge 內建的雲哲／曉雨念出，其他瀏覽器則以字幕計時播放。

## 修改內容

所有教材內容都在 `content/*.json`（線上教材＋影音腳本）、`content/quiz.json`（測驗）、`content/ppt_*.json`（簡報大綱）。修改後：

```bash
python tools/build.py                          # 重新產生 data/（文字教材、影音腳本、測驗）
python tools/tts_edge.py --only v-is-1a        # 只重錄有改動的影音段落（腳本有變才會重錄）
cd tools && npm install && node build_pptx.js  # 重新產生 PPTX
```

撰寫規範見 `content/BRIEF.md`（教材／影音）與 `content/PPT_BRIEF.md`（簡報）。

## 授權聲明

ISA 由 ENX Association 提供、VDA 發行（Data Protection 頁籤版權屬 VDA），以 CC BY-ND 4.0 及其第 9 條衍生作品附加條款授權。本課程為**未經授權方核可之衍生教材**，未使用 VDA／ENX 標誌，條文解釋以原版英文 ISA 為準。TISAX® 為 ENX Association 之註冊商標。課後測驗證書僅證明完成本課程測驗，並非 TISAX 評鑑結果。
