# 「ISA 2027 for TISAX 標準要求解說」課程內容撰寫規範（給內容撰寫者）

## 背景
- 課程名稱：ISA 2027 for TISAX 標準要求解說
- 講師：Allan Lo（Allan 顧問）：ISMS/PIMS 輔導顧問，兼任驗證公司 Auditor，專長資安與企業 MIS 管理。台灣男性，說話親切、有經驗、愛舉實例、偶爾幽默。
- 助教：ARALE（AI 小助手）：年輕可愛女生，負責串場、提問（代替學員發問）、整理重點、帶氣氛，口頭禪可用「哇～」「原來如此！」「筆記筆記！」等，但不要每句都用。
- 對象：台灣汽車產業供應鏈的資安/IT/品保/研發/總務/人資人員，準備 TISAX 評鑑。
- 語言：繁體中文（台灣用語：資訊、軟體、網路、伺服器、稽核、驗證、個資、供應商、檔案、品質）。英文專有名詞保留原文（如 ISA、TISAX、ENX、VDA、Must、Should、Label、AL2、AL3、SGA、MFA、VPN、RTO、RPO）。
- 標準來源：VDA ISA 2027.1（2026-09-30）英文版。完整條文已萃取於
  `/tmp/claude-0/-home-user-tisax/99c53a4c-3bdc-5716-bfd2-00a1e5eb5cd5/scratchpad/isa/full.txt`（含每條控制項之 objective、must、should、high、vhigh、SGA、參考標準、說明、範例、可能提問、可能證據）
  以及結構化 JSON `/tmp/claude-0/-home-user-tisax/99c53a4c-3bdc-5716-bfd2-00a1e5eb5cd5/scratchpad/isa/isa.json`。
  **請務必以原文為準，逐條詳讀後翻譯/解說，不可捏造條文內容。** 若補充外部知識（ISO 27001:2022、ENX TISAX Participant Handbook、GDPR、台灣個資法、資通安全管理法等），請以「補充」或「實務上」語氣表達，並避免寫出不確定的具體數字/日期。

## 交付格式：一個 JSON 檔（UTF-8，合法 JSON，不能有註解、不能有尾逗號）
寫入 `/home/user/tisax/course/content/<key>.json`，結構如下：

```json
{
  "key": "is1",
  "module": "IS",              // INTRO | IS | PP | DP | AUDIT
  "chapters": [
    {
      "id": "is-1",             // 唯一 id（小寫、連字號）
      "title": "第1章 資安政策與組織",
      "title_en": "IS Policies and Organization",
      "intro": ["章節導讀段落1", "段落2"],
      "blocks": [ ...可選，用於非控制項的講解內容（見下方 block 類型）... ],
      "controls": [ ...控制項物件，INTRO/AUDIT 模組可為空陣列... ],
      "summary": ["本章重點1", "本章重點2", "..."]
    }
  ],
  "video": [
    {
      "id": "v-is-1a",          // 唯一 id
      "chapter": "is-1",        // 對應的 chapter id
      "title": "1.1–1.2 政策與 ISMS 組織",
      "lines": [ ...對話行... ]
    }
  ]
}
```

### 控制項物件（controls）
```json
{
  "id": "1.1.1",
  "title": "資訊安全政策",                         // 簡短中文標題
  "q_en": "To what extent are information security policies available?",  // 原文照抄
  "q_zh": "資訊安全政策可取得的程度為何？",
  "objective": "目標（中文，忠實翻譯並可稍作口語化）",
  "req": {
    "must":   ["忠實的中文翻譯，每條一項；子項目用「－」開頭併入同一字串，或拆為多項皆可"],
    "should": ["..."],
    "high":   ["...（C, I, A）保留原文的保護目標標記"],
    "vhigh":  ["..."],
    "sga":    ["..."]
  },
  "refs": "ISO 27001:2022 A.5.1｜NIST CSF 2.0 GV.PO-01…（從原文 refs 摘錄）",
  "change2027": "ISA 2027 相對 ISA 6 的變更（若 Change history 有提到；沒有就給空字串）",
  "explain": ["詳細解說段落：條文意涵、關鍵字解讀（如 must vs should 的差異）、與其他控制項的關聯、常見誤解。至少 2–4 段，每段 80–200 字"],
  "practice": ["對應的資安管理實務作法：具體到可直接執行，含文件名稱、表單欄位、流程、工具舉例（如 AD、Intune、MDM、EDR、SIEM、DLP、PAM）、頻率建議。至少 5 項"],
  "audit": {
    "questions": ["稽核員常問的問題（中文），至少 5 題"],
    "evidence":  ["可準備的證據/紀錄，至少 4 項"],
    "findings":  ["常見缺失/不符合樣態（以 Auditor 角度寫，例如：政策已發行但未公告給外部合作夥伴），至少 3 項"]
  },
  "tip": "Allan 顧問小叮嚀：一句到三句的經驗談"
}
```
- 若原文該欄為 None/空，請給空陣列 []。
- Data Protection 模組沒有 should/high/vhigh，只有 must（結果為 yes/no），請放 must，其他給 []。
- Prototype Protection 模組沒有 high/vhigh/sga 欄，給 []。

### block 類型（用於 blocks）
```json
{"type":"h3","text":"小標題"}
{"type":"p","text":"段落文字"}
{"type":"list","items":["...","..."]}
{"type":"olist","items":["步驟1","步驟2"]}
{"type":"table","head":["欄1","欄2"],"rows":[["a","b"],["c","d"]]}
{"type":"tip","who":"allan","text":"顧問經驗談"}
{"type":"tip","who":"arale","text":"助教提醒/筆記"}
{"type":"callout","style":"info|warn|ok","title":"標題","text":"內容"}
```
文字中可使用 `**粗體**`（會轉成粗體），不要使用其他 HTML/Markdown。

### 影音對話（video）
- 每一段影片（segment）長度約 3–8 分鐘，大約 20–45 行對話；每個章節切成多段（例如每 1–3 個控制項一段），**讓每段開頭載入很快**。
- 每段的第一行通常由 ARALE 開場（串場、說明這段要學什麼），最後一行由 ARALE 或 Allan 收尾（重點整理＋預告下一段）。
- 對話行格式：
```json
{"who":"allan","emo":"talk","text":"口語台詞","slide":{"title":"投影畫面標題","bullets":["重點1","重點2","重點3"]}}
```
  - `who`：`allan` 或 `arale`
  - `emo`（表情）：
    - allan：`smile` 微笑、`laugh` 大笑、`think` 思考、`scratch` 搔頭苦惱、`surprise` 驚訝、`point` 舉手指強調、`wink` 眨眼、`talk` 說話
    - arale：`happy` 開心、`cheer` 握拳加油、`laugh` 笑、`think` 思考、`surprise` 驚訝、`confused` 疑惑、`wow` 張口驚嘆、`present` 攤手介紹、`sad` 難過、`wink` 眨眼比讚
  - `slide`：可選。出現時更新畫面上的投影片（title + 2–5 個 bullets，每個 bullet ≤ 28 字）。沒有就沿用上一張。每段的第一行一定要有 slide。
  - 也可用 `"slide":{"title":"...","table":{"head":[...],"rows":[[...]]}}` 呈現小表格（≤4 列）。
- 台詞要求：
  - **活潑生動**，像實體課堂：Allan 用真實輔導/稽核案例（去識別化）、比喻（例如把 Security zone 比喻成洋蔥）、偶爾自嘲；ARALE 代表學員發問、吐槽、整理重點。
  - 每行台詞 15–110 字（會轉成語音，太長載入慢）。不要用表情符號、不要用括號註解、不要用「～」以外的特殊符號。數字與英文縮寫可以直接寫（例如 ISO 27001、AL3、MFA）。
  - 內容要涵蓋該段控制項的：條文重點（must/should/高/極高）、實務作法、稽核員會怎麼問與常見缺失。線上影音內容要比實體簡報更完整。
  - 不要出現「這是影片」「這段影片」以外的後設敘述；不要提到「AI 生成」。

## 品質要求
- 忠實於 ISA 2027.1 原文，每一條 must/should/high/vhigh 都要翻譯到，不可遺漏。
- 實務與稽核內容以台灣企業情境為主（例如：中小型 Tier 2 車廠供應商、只有 3 位 IT 人員的工廠、使用 M365/Google Workspace、有 OT 產線）。
- 用詞一致：Information Security＝資訊安全；Prototype Protection＝原型件保護；Data Protection＝資料保護（個資保護）；protection needs＝保護需求；high/very high＝高／極高；supporting assets＝支援資產；security zone＝安全區域；maturity level＝成熟度等級；control question＝控制問題/控制項。
- 完成後請用 `python3 -c "import json;json.load(open('<path>'))"` 驗證 JSON 合法。
