# ISA 2027 for TISAX — Requirements Explained (English edition)

Lecturer: Allan Lo | Assistant: ARALE  
Course design and production: Allan Lo, Consultant (http://www.123hi.org)  
Source: VDA ISA 2027.1 (2026-09-30)

This folder is the **English edition**. It is completely independent from the Chinese edition in `../course/`
(own pages, content, audio and data), so either edition can be published or licensed on its own.

## Contents

| Item | File | Description |
|---|---|---|
| Home page | `index.html` | Course overview and chapter map |
| Online textbook | `text.html` | 77 controls explained one by one (IS 45, PP 20, DP 12) plus introduction, ISA structure & maturity, and audit practice. Each control has four tabs: Requirements / Explanation / Practice / Audit. Searchable, with reading progress |
| Interactive video | `video.html` | Classroom dialogue between Allan and ARALE (49 parts) with slides, subtitles, transcript and English voice |
| Quizzes & certificate | `quiz.html` | Information Security / Prototype Protection / Data Protection, 10 questions each, pass mark 80. Learners enter company, department, name, job title and e-mail; passing learners download a certificate (PNG) and a certificate + answers sheet (PDF/HTML) |

## How to use

- **Open locally**: double-click `index.html` (all data is stored as JavaScript files; no server needed).
- **Publish**: upload the whole `course-en/` folder to any static web server (IIS, Nginx, Netlify, GitHub Pages…).
- **Collect quiz results (optional)**: follow `tools/google-apps-script.gs` and put the web-app URL into
  `submitEndpoint` in `assets/js/config.js`.

## Licensed editions for customers

The public edition shows no license information (`assets/js/license.js` is `null`). To give a customer a copy for
their intranet:

```bash
cd course-en
python tools/make_license_package.py --company "Example Manufacturing Co., Ltd." --dept "IT Department" \
    --no L-2026-001 --start 2026-11-01 --end 2027-10-31 --domains elearning.example.com
```

This creates `dist/ISA2027_TISAX_EN_licensed_<company>_<no>.zip` in the repository root (the project itself is not
changed). The pages then show "Licensed to …" in the header, "Internal training edition for …" on the home page,
the license line in every footer and "Licensed to" on the certificate, plus a red notice when the license has
expired or the site runs on a domain that is not licensed.

> The license information is stored in the web files, so anyone holding the source can technically edit it; the
> mechanism labels and reminds, while the licensed scope is defined by the license agreement.

## Editing content

All course text is in `content/*.json` (textbook + video scripts) and `content/quiz.json`. After editing run
`python tools/build.py` to regenerate `data/`. Translation rules: `content/BRIEF_EN.md`.

## Legal

ISA is provided by the ENX Association and published by the VDA (the Data Protection tab is © VDA) under CC BY-ND 4.0
with additional terms for derivatives. This course is a **derivative work not approved by the licensor**, does not use
VDA/ENX logos, and the original English ISA prevails. TISAX® is a registered trademark of ENX Association. The quiz
certificate only confirms completion of the course quiz; it is not a TISAX assessment result.

---
Course design and production: Allan Lo, Consultant (http://www.123hi.org)  
Copyright © 2026 Allan Lo. All rights reserved.
