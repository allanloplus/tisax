#!/usr/bin/env python3
"""產生客戶授權版（放在企業內部網站使用）。

公開版（GitHub）的 assets/js/license.js 為 null，網頁不顯示任何授權資訊；
本工具會複製一份課程網站，寫入該客戶的授權資訊後打包成 zip，原始專案不會被修改。

用法（在 course 資料夾執行）：
  python tools/make_license_package.py --company "○○股份有限公司" --no L-2026-001 \
      --start 2026-11-01 --end 2027-10-31 --domains elearning.example.com,intranet.example.com

參數：
  --company  授權公司名稱（必填）       --dept     授權單位（選填）
  --no       授權編號                   --start/--end  授權期間（YYYY-MM-DD；不填 end = 永久）
  --domains  授權網域，逗號分隔（選填；網站放在其他網域時頁面會顯示提醒）
  --note     授權用途（預設：內部教育訓練使用）
  --pptx     一併附上講師簡報 PPTX（預設不附）
  --out      輸出資料夾（預設：專案根目錄的 dist/）

網頁顯示位置：頁首授權標籤、首頁「○○ 內部教育訓練專用」、每頁頁尾授權說明、結業證書「授權單位」。
授權到期或網域不符時，頁面頂端會顯示提醒。
"""
import argparse, datetime, json, os, re, shutil, sys, tempfile, zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))   # course/
# 不放進授權版的檔案（講師用素材、建置用的聲音範本等）
EXCLUDE_DIRS = {os.path.join('tools', 'voice_prompts'), os.path.join('tools', 'node_modules'), 'tools/__pycache__'}
EXCLUDE_FILES = {'README.md', os.path.join('content', 'BRIEF.md'), os.path.join('content', 'PPT_BRIEF.md')} | {
    os.path.join('tools', f) for f in ('make_license_package.py', 'build_pptx.js', 'apply_theme.js', 'package.json',
                                       'tts_clone.py', 'github-pages-workflow.yml')}
EXCLUDE_PATTERNS = [r'^content/ppt_.*\.json$', r'\.pptx$', r'__pycache__', r'\.pyc$']

CUSTOMER_README = """# ISA 2027 for TISAX 標準要求解說（授權版）

授權公司：{company}{dept}
授權編號：{no}
授權期間：{period}
授權用途：{note}
{domains}
## 架設方式
把本資料夾全部內容上傳到企業內部網站（IIS、Nginx、Apache 或任何靜態網站空間皆可），
以瀏覽器開啟 `index.html` 即可；也可以直接在電腦上雙擊 `index.html` 使用。

- 線上文字教材：`text.html`
- 互動影音教材：`video.html`
- 課後測驗與結業證書：`quiz.html`（通過分數、講師名稱與測驗結果回傳網址可在 `assets/js/config.js` 設定，
  回傳方式請見 `tools/google-apps-script.gs`）

## 授權說明
本教材經授權供上述公司{note}。授權資訊記載於 `assets/js/license.js`，請勿修改或移除；
未經授權，請勿轉載、複製或對外公開。授權續約或擴充請洽 Allan Lo顧問（http://www.123hi.org）。

教材依據 VDA ISA 2027.1（© ENX Association／VDA，CC BY-ND 4.0 及其衍生作品附加條款授權），
本課程為未經授權方核可之衍生教材，條文解釋以原版英文 ISA 為準。TISAX® 為 ENX Association 之註冊商標。

---
教材規劃製作：Allan Lo顧問（http://www.123hi.org）
Copyright © 2026 Allan Lo. All rights reserved.
"""


def valid_date(s):
    if not s:
        return ''
    datetime.date.fromisoformat(s)
    return s


def main():
    ap = argparse.ArgumentParser(description='產生客戶授權版')
    ap.add_argument('--company', required=True)
    ap.add_argument('--dept', default='')
    ap.add_argument('--no', default='')
    ap.add_argument('--start', default=datetime.date.today().isoformat(), type=valid_date)
    ap.add_argument('--end', default='', type=valid_date)
    ap.add_argument('--domains', default='')
    ap.add_argument('--note', default='內部教育訓練使用')
    ap.add_argument('--pptx', action='store_true')
    ap.add_argument('--out', default=os.path.join(os.path.dirname(ROOT), 'dist'))
    a = ap.parse_args()

    no = a.no or 'L-' + datetime.date.today().strftime('%Y%m%d')
    lic = {'company': a.company.strip(), 'dept': a.dept.strip(), 'no': no, 'start': a.start, 'end': a.end,
           'domains': [d.strip().lower() for d in a.domains.split(',') if d.strip()], 'note': a.note.strip()}
    safe = re.sub(r'[\\/:*?"<>|\s]+', '_', lic['company'])
    name = f'ISA2027_TISAX_授權版_{safe}_{no}'
    os.makedirs(a.out, exist_ok=True)

    with tempfile.TemporaryDirectory() as td:
        dst = os.path.join(td, name)

        def ignore(dirpath, names):
            rel = os.path.relpath(dirpath, ROOT)
            out = []
            for n in names:
                r = os.path.normpath(os.path.join(rel, n)) if rel != '.' else n
                r_posix = r.replace(os.sep, '/')
                if r in EXCLUDE_DIRS or r_posix in EXCLUDE_DIRS or r in EXCLUDE_FILES or r_posix in EXCLUDE_FILES:
                    out.append(n)
                elif any(re.search(p, r_posix) for p in EXCLUDE_PATTERNS):
                    if not (a.pptx and r_posix.endswith('.pptx')):
                        out.append(n)
            return out

        shutil.copytree(ROOT, dst, ignore=ignore)
        with open(os.path.join(dst, 'assets', 'js', 'license.js'), 'w', encoding='utf-8') as f:
            f.write('/* 授權資訊：請勿修改或移除。授權續約請洽 Allan Lo顧問（http://www.123hi.org） */\n')
            f.write('window.COURSE_LICENSE = ' + json.dumps(lic, ensure_ascii=False, indent=1) + ';\n')
        period = f"{lic['start']} ～ {lic['end']}" if lic['end'] else f"{lic['start']} 起"
        with open(os.path.join(dst, 'README_授權版.md'), 'w', encoding='utf-8') as f:
            f.write(CUSTOMER_README.format(company=lic['company'], dept=('　' + lic['dept']) if lic['dept'] else '',
                                           no=no, period=period, note=lic['note'],
                                           domains=('授權網域：' + '、'.join(lic['domains']) + '\n') if lic['domains'] else ''))
        zpath = os.path.join(a.out, name + '.zip')
        with zipfile.ZipFile(zpath, 'w', zipfile.ZIP_DEFLATED) as z:
            for base, _, files in os.walk(dst):
                for fn in files:
                    full = os.path.join(base, fn)
                    z.write(full, os.path.relpath(full, td))
    size = os.path.getsize(zpath) / 1e6
    print(f'已產生授權版：{zpath}（{size:.1f} MB）')
    print(f'授權公司：{lic["company"]}｜編號：{no}｜期間：{period}' + (f'｜網域：{", ".join(lic["domains"])}' if lic['domains'] else ''))


if __name__ == '__main__':
    main()
