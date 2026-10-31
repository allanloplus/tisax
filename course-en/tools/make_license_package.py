#!/usr/bin/env python3
"""Build a licensed copy of the ENGLISH edition for a customer's intranet.

The public edition (GitHub) keeps assets/js/license.js = null, so no license information is shown.
This tool copies the course website, writes the customer's license information and zips it.
The original project is not changed.

Usage (run inside the course-en folder):
  python tools/make_license_package.py --company "Example Manufacturing Co., Ltd." --no L-2026-001 \
      --start 2026-11-01 --end 2027-10-31 --domains elearning.example.com

Options:
  --company  licensee name (required)        --dept    department (optional)
  --no       license number                  --start/--end  license period (YYYY-MM-DD; no end = perpetual)
  --domains  licensed domains, comma separated (optional; a notice is shown on other domains)
  --note     licensed use (default: internal training use)
  --out      output folder (default: dist/ in the repository root)

Shown on the pages: "Licensed to" badge in the header, "Internal training edition for ..." on the home page,
license line in every page footer and "Licensed to" on the certificate. A red notice appears at the top
when the license has expired or the site runs on a domain that is not licensed.
"""
import argparse, datetime, json, os, re, shutil, sys, tempfile, zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))   # course/
# Files not included in licensed copies (instructor material, voice prompts used for building)
EXCLUDE_DIRS = {os.path.join('tools', 'voice_prompts'), os.path.join('tools', 'node_modules'), 'tools/__pycache__'}
EXCLUDE_FILES = {'README.md', os.path.join('content', 'BRIEF_EN.md')} | {
    os.path.join('tools', f) for f in ('make_license_package.py', 'build_pptx.js', 'apply_theme.js', 'package.json',
                                       'tts_clone.py', 'github-pages-workflow.yml')}
EXCLUDE_PATTERNS = [r'^content/ppt_.*\.json$', r'\.pptx$', r'__pycache__', r'\.pyc$']

CUSTOMER_README = """# ISA 2027 for TISAX — Requirements Explained (licensed edition, English)

Licensee: {company}{dept}
License no.: {no}
License period: {period}
Licensed use: {note}
{domains}
## How to install
1. **Extract the ZIP file first** (right-click the ZIP → "Extract All…").
   Do not open index.html directly inside the ZIP: styles, images and scripts would not load.
2. Upload everything in the extracted folder to your intranet web server (IIS, Nginx, Apache or any static web
   hosting) and open `index.html` in a browser. You can also double-click the extracted `index.html` on a PC.

- Online textbook: `text.html`
- Interactive video: `video.html`
- Quizzes and certificate: `quiz.html` (pass mark, instructor name and an optional result-collection URL are set in
  `assets/js/config.js`; see `tools/google-apps-script.gs` for collecting results)

## License
This course is licensed to the company above for {note}. The license information is stored in
`assets/js/license.js`; do not change or remove it. Do not copy, redistribute or publish the course outside the
licensed organization. For renewals or extensions please contact Allan Lo (http://www.123hi.org).

Based on VDA ISA 2027.1 (© ENX Association / VDA, CC BY-ND 4.0 with additional terms for derivatives). This course is a
derivative work not approved by the licensor; the original ISA text prevails. TISAX® is a registered trademark of
ENX Association.

---
Course design and production: Allan Lo, Consultant (http://www.123hi.org)
Copyright © 2026 Allan Lo. All rights reserved.
"""


def valid_date(s):
    if not s:
        return ''
    datetime.date.fromisoformat(s)
    return s


def main():
    ap = argparse.ArgumentParser(description='Build a licensed copy of the English edition')
    ap.add_argument('--company', required=True)
    ap.add_argument('--dept', default='')
    ap.add_argument('--no', default='')
    ap.add_argument('--start', default=datetime.date.today().isoformat(), type=valid_date)
    ap.add_argument('--end', default='', type=valid_date)
    ap.add_argument('--domains', default='')
    ap.add_argument('--note', default='internal training use')
    ap.add_argument('--pptx', action='store_true')
    ap.add_argument('--out', default=os.path.join(os.path.dirname(ROOT), 'dist'))
    a = ap.parse_args()

    no = a.no or 'L-' + datetime.date.today().strftime('%Y%m%d')
    lic = {'company': a.company.strip(), 'dept': a.dept.strip(), 'no': no, 'start': a.start, 'end': a.end,
           'domains': [d.strip().lower() for d in a.domains.split(',') if d.strip()], 'note': a.note.strip()}
    safe = re.sub(r'[\\/:*?"<>|\s]+', '_', lic['company'])
    name = f'ISA2027_TISAX_EN_licensed_{safe}_{no}'
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
            f.write('/* License information: do not change or remove. For renewals contact Allan Lo (http://www.123hi.org) */\n')
            f.write('window.COURSE_LICENSE = ' + json.dumps(lic, ensure_ascii=False, indent=1) + ';\n')
        period = f"{lic['start']} to {lic['end']}" if lic['end'] else f"from {lic['start']}"
        with open(os.path.join(dst, 'README_licensed_edition.md'), 'w', encoding='utf-8') as f:
            f.write(CUSTOMER_README.format(company=lic['company'], dept=(', ' + lic['dept']) if lic['dept'] else '',
                                           no=no, period=period, note=lic['note'],
                                           domains=('Licensed domains: ' + ', '.join(lic['domains']) + '\n') if lic['domains'] else ''))
        zpath = os.path.join(a.out, name + '.zip')
        with zipfile.ZipFile(zpath, 'w', zipfile.ZIP_DEFLATED) as z:
            for base, _, files in os.walk(dst):
                for fn in files:
                    full = os.path.join(base, fn)
                    z.write(full, os.path.relpath(full, td))
    size = os.path.getsize(zpath) / 1e6
    print(f'Licensed edition created: {zpath} ({size:.1f} MB)')
    print(f'Licensee: {lic["company"]} | no.: {no} | period: {period}' + (f' | domains: {", ".join(lic["domains"])}' if lic['domains'] else ''))


if __name__ == '__main__':
    main()
