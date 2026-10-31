/**
 * 課後測驗結果收集（選用）— Google Apps Script Web App
 *
 * 設定步驟：
 * 1. 建立一份 Google 試算表，選單「擴充功能 → Apps Script」，貼上本檔內容並儲存。
 * 2.「部署 → 新增部署作業 → 類型：網頁應用程式」
 *      執行身分：我；存取權：所有人。部署後複製「網頁應用程式網址」。
 * 3. 將網址貼到 course/assets/js/config.js 的 submitEndpoint。
 * 之後每位學員交卷（不論通過與否）都會新增一列：時間、模組、分數、是否通過、證書編號、
 * 公司名稱、單位、姓名、職稱、E-mail、各題對錯。
 */
const SHEET_NAME = '測驗紀錄';
const HEADERS = ['收到時間', '交卷時間', '模組', '分數', '通過', '證書編號', '公司名稱', '單位', '姓名', '職稱', 'E-mail', '各題對錯'];

function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) { sh = ss.insertSheet(SHEET_NAME); sh.appendRow(HEADERS); sh.setFrozenRows(1); }
  let d = {};
  try { d = JSON.parse(e.postData.contents); } catch (err) { return out({ ok: false, error: 'bad json' }); }
  const clean = v => String(v == null ? '' : v).slice(0, 200).replace(/^[=+\-@]/, "'$&"); // 避免公式注入
  sh.appendRow([new Date(), clean(d.date), clean(d.module), Number(d.score) || 0, d.pass ? '通過' : '未通過', clean(d.cert),
    clean(d.company), clean(d.unit), clean(d.name), clean(d.title), clean(d.email), clean(d.answers)]);
  return out({ ok: true });
}
function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
