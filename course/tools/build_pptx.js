/* Build the instructor deck (PPTX) from content/ppt_a.json, ppt_b.json, ppt_c.json
 *   cd course/tools && npm install && node build_pptx.js
 * Output: course/ISA2027_for_TISAX_標準要求解說_講師簡報.pptx
 */
const path = require('path');
const fs = require('fs');
const pptxgen = require('pptxgenjs');

const ROOT = path.resolve(__dirname, '..');
const IMG = process.env.PPT_IMG_DIR || path.join(ROOT, 'assets', 'img', 'ppt');
const OUT = process.env.PPT_OUT || path.join(ROOT, 'ISA2027_for_TISAX_標準要求解說_講師簡報.pptx');
const FONT = 'Microsoft JhengHei';

const THEME = {
  name: 'ISA 2027 TISAX', headFontFace: FONT, bodyFontFace: FONT,
  colors: { dk1: '1B2430', lt1: 'FFFFFF', dk2: '0F2A44', lt2: 'F3F6F9',
    accent1: '0F9E93', accent2: 'F2B705', accent3: 'C8323C', accent4: '2463B5', accent5: '7A3FB0', accent6: 'C25A12',
    hlink: '2463B5', folHlink: '7A3FB0' }
};
const HEX = { navy: '0F2A44', navy2: '173A5C', teal: '0F9E93', teal2: 'DDF4F1', amber: 'F2B705', amber2: 'FFF4CC',
  red: 'C8323C', red2: 'FCE8E9', blue: '2463B5', blue2: 'E6EFFB', purple: '7A3FB0', purple2: 'EFE3FA', ink: '1B2430', muted: '5B6777', line: 'DFE5EC', bg: 'F3F6F9', white: 'FFFFFF' };

const img = n => path.join(IMG, n + '.png');
const W = 13.333, H = 7.5;

function load(name) {
  const p = path.join(process.env.PPT_CONTENT || path.join(ROOT, 'content'), name);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')).slides : [];
}

async function main() {
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_WIDE';
  pres.author = 'Allan Lo'; pres.company = 'ISA 2027 for TISAX 標準要求解說';
  pres.title = 'ISA 2027 for TISAX 標準要求解說';
  pres.theme = { headFontFace: FONT, bodyFontFace: FONT };
  const C = pres.SchemeColor;

  const footer = [
    { text: { text: 'ISA 2027 for TISAX 標準要求解說｜教材規劃製作：Allan Lo顧問 (www.123hi.org)｜Copyright © 2027 Allan Lo. All rights reserved.', options: { x: 0.6, y: 7.05, w: 11.4, h: 0.3, fontSize: 9, color: HEX.muted, fontFace: FONT } } }
  ];
  pres.defineSlideMaster({ title: 'CONTENT', background: { color: HEX.white },
    objects: footer.concat([
      { placeholder: { options: { name: 'title', type: 'title', x: 0.6, y: 0.32, w: 12.1, h: 0.85, fontSize: 30, bold: true, color: HEX.navy, valign: 'middle', align: 'left', fontFace: FONT, margin: 0 }, text: '' } }
    ]),
    slideNumber: { x: 12.3, y: 7.0, w: 0.6, h: 0.35, fontSize: 10, color: HEX.muted, fontFace: FONT } });
  pres.defineSlideMaster({ title: 'SECTION', background: { color: HEX.navy },
    objects: [
      { placeholder: { options: { name: 'title', type: 'title', x: 0.8, y: 2.6, w: 7.6, h: 1.6, fontSize: 40, bold: true, color: HEX.white, valign: 'top', align: 'left', fontFace: FONT, margin: 0 }, text: '' } }
    ],
    slideNumber: { x: 12.3, y: 7.0, w: 0.6, h: 0.35, fontSize: 10, color: 'A9BBCD', fontFace: FONT } });

  let curSection = null;
  const addSlide = (master, section) => {
    if (section && section !== curSection) { pres.addSection({ title: section }); curSection = section; }
    return pres.addSlide({ masterName: master, sectionTitle: curSection || '開場' });
  };
  const txt = (s, t, o) => s.addText(t, Object.assign({ isTextBox: true, fontFace: FONT, color: HEX.ink, valign: 'top', margin: 0.05 }, o));
  const bulletRuns = (items, o = {}) => items.map((t, i) => ({ text: t, options: Object.assign({ bullet: { indent: 16 }, breakLine: i < items.length - 1, paraSpaceAfter: 6 }, o) }));
  const circle = (s, x, y, d, fill, label, fs = 16, color = HEX.white) => {
    s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: fill }, line: { color: fill } });
    txt(s, label, { x, y, w: d, h: d, align: 'center', valign: 'middle', fontSize: fs, bold: true, color, margin: 0 });
  };
  const card = (s, x, y, w, h, fill, line) => s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: fill }, line: { color: line || fill, width: 1 }, rectRadius: 0.12 });
  const person = (s, who, x, y, h) => {
    const name = who === 'arale' ? 'arale-full' : 'allan-full';
    const ratio = who === 'arale' ? 553 / 700 : 373 / 700;
    s.addImage({ path: img(name), x, y, w: h * ratio, h });
  };
  const face = (s, name, x, y, d) => s.addImage({ path: img(name), x, y, w: d * 0.813, h: d });

  // ---------- cover ----------
  {
    const s = addSlide('SECTION', '開場');
    s.background = { color: HEX.navy };
    txt(s, 'VDA ISA 2027.1｜TISAX', { x: 0.8, y: 1.1, w: 7, h: 0.4, fontSize: 16, color: HEX.amber, bold: true });
    s.addText('ISA 2027 for TISAX\n標準要求解說', { placeholder: 'title' });
    txt(s, 'Information Security｜Prototype Protection｜Data Protection\n條文解說 × 資安管理實務 × 稽核實務', { x: 0.8, y: 4.35, w: 7.6, h: 0.9, fontSize: 16, color: 'CFE0F1' });
    card(s, 0.8, 5.55, 4.6, 0.95, HEX.navy2);
    txt(s, [{ text: '講師　Allan Lo', options: { bold: true, color: HEX.white, fontSize: 16, breakLine: true } },
      { text: 'ISMS／PIMS 輔導顧問・驗證稽核員', options: { color: 'CFE0F1', fontSize: 12 } }], { x: 1.0, y: 5.65, w: 4.3, h: 0.8 });
    txt(s, [{ text: '教材規劃製作：Allan Lo顧問（', options: {} }, { text: 'www.123hi.org', options: { hyperlink: { url: 'http://www.123hi.org' }, color: 'CFE0F1' } }, { text: '）\nCopyright © 2027 Allan Lo. All rights reserved.', options: {} }],
      { x: 0.8, y: 6.65, w: 7.4, h: 0.6, fontSize: 10, color: 'A9BBCD' });
    person(s, 'allan', 8.2, 0.9, 6.0);
    person(s, 'arale', 9.3, 1.9, 5.0);
    s.addNotes('開場：自我介紹，說明本課程三大主軸（ISA 2027 條文、資安實務作法、稽核實務），並提醒學員課後可使用線上文字教材、互動影音與課後測驗。');
  }

  const slides = [...load('ppt_a.json'), ...load('ppt_b.json'), ...load('ppt_c.json')];
  let section = '開場';
  const modColor = id => /^8\./.test(id) ? 'C25A12' : /^9\./.test(id) ? HEX.purple : HEX.blue;

  for (const d of slides) {
    if (d.type === 'section') section = (d.title || '').slice(0, 30);
    const notes = d.notes || '';
    switch (d.type) {
      case 'section': {
        const s = addSlide('SECTION', section);
        if (d.part) txt(s, d.part, { x: 0.8, y: 1.9, w: 6, h: 0.5, fontSize: 18, bold: true, color: HEX.amber });
        s.addText(d.title, { placeholder: 'title' });
        if (d.subtitle) txt(s, d.subtitle, { x: 0.8, y: 4.4, w: 7.6, h: 1.0, fontSize: 18, color: 'CFE0F1' });
        person(s, d.who === 'arale' ? 'arale' : 'allan', d.who === 'arale' ? 8.5 : 9.4, 1.0, 5.9);
        s.addNotes(notes); break;
      }
      case 'control': {
        const s = addSlide('CONTENT', section);
        const mc = modColor(d.id);
        card(s, 0.6, 0.42, 1.55, 0.62, mc);
        txt(s, d.id, { x: 0.6, y: 0.42, w: 1.55, h: 0.62, fontSize: 20, bold: true, color: HEX.white, align: 'center', valign: 'middle', margin: 0 });
        txt(s, d.title, { x: 2.35, y: 0.32, w: 10.3, h: 0.85, fontSize: 28, bold: true, color: HEX.navy, valign: 'middle', margin: 0, fit: 'shrink' });
        if (d.q) txt(s, d.q, { x: 0.6, y: 1.2, w: 12.1, h: 0.45, fontSize: 14, italic: true, color: HEX.muted, margin: 0 });
        // requirements column
        let y = 1.8; const groups = [['must', 'MUST 必須', HEX.red, HEX.red2], ['should', 'SHOULD 應該', '8A6A00', HEX.amber2], ['high', '高／極高 保護需求', HEX.blue, HEX.blue2]];
        const avail = 5.05; const lines = groups.reduce((n, g) => n + ((d[g[0]] || []).length ? (d[g[0]].length + 0.9) : 0), 0) || 1;
        const per = Math.min(0.5, avail / lines);
        for (const [k, label, col, bg] of groups) {
          const items = d[k] || []; if (!items.length) continue;
          const h = per * (items.length + 0.9);
          card(s, 0.6, y, 7.45, h - 0.1, bg);
          txt(s, label, { x: 0.78, y: y + 0.06, w: 4, h: 0.32, fontSize: 13, bold: true, color: col, margin: 0 });
          txt(s, bulletRuns(items), { x: 0.78, y: y + 0.38, w: 7.1, h: h - 0.5, fontSize: items.length > 3 ? 15 : 16, color: HEX.ink, fit: 'shrink' });
          y += h;
        }
        // right column
        const rc = [['實務作法', d.practice || [], HEX.teal, HEX.teal2], ['稽核重點', d.audit || [], HEX.navy, 'E9EEF4']];
        let ry = 1.8;
        for (const [label, items, col, bg] of rc) {
          card(s, 8.3, ry, 4.4, 2.45, bg);
          circle(s, 8.45, ry + 0.12, 0.42, col, label === '實務作法' ? '✓' : '?', 14);
          txt(s, label, { x: 9.0, y: ry + 0.14, w: 3, h: 0.38, fontSize: 15, bold: true, color: col, valign: 'middle', margin: 0 });
          txt(s, bulletRuns(items), { x: 8.45, y: ry + 0.62, w: 4.1, h: 1.75, fontSize: 14, fit: 'shrink' });
          ry += 2.6;
        }
        s.addNotes(notes); break;
      }
      case 'bullets': {
        const s = addSlide('CONTENT', section);
        s.addText(d.title, { placeholder: 'title' });
        const hasP = d.who === 'allan' || d.who === 'arale';
        const w = hasP ? 8.6 : 12.1;
        const items = d.bullets || [];
        items.forEach((b, i) => {
          const rowH = Math.min(0.85, 5.2 / items.length); const yy = 1.5 + i * rowH;
          circle(s, 0.6, yy + (rowH - 0.5) / 2, 0.5, i % 2 ? HEX.teal : HEX.navy, String(i + 1), 15);
          txt(s, b, { x: 1.3, y: yy, w: w - 0.7, h: rowH, fontSize: items.length > 5 ? 19 : 21, valign: 'middle', fit: 'shrink' });
        });
        if (hasP) person(s, d.who, d.who === 'arale' ? 8.85 : 10.0, 1.4, 5.5);
        s.addNotes(notes); break;
      }
      case 'table': {
        const s = addSlide('CONTENT', section);
        s.addText(d.title, { placeholder: 'title' });
        const head = (d.head || []).map(h => ({ text: h, options: { bold: true, color: HEX.white, fill: { color: HEX.navy }, fontSize: 17 } }));
        const rows = (d.rows || []).map((r, i) => r.map(c => ({ text: String(c), options: { fontSize: (d.rows.length > 5 || r.length > 3) ? 15 : 17, fill: { color: i % 2 ? HEX.white : HEX.bg } } })));
        const nc = head.length || 1;
        s.addTable([head, ...rows], { x: 0.6, y: 1.45, w: 12.1, colW: Array(nc).fill(12.1 / nc), fontFace: FONT, color: HEX.ink, border: { type: 'solid', pt: 0.75, color: HEX.line }, margin: [4, 6, 4, 6], valign: 'middle', rowH: 0.55 });
        s.addNotes(notes); break;
      }
      case 'steps': {
        const s = addSlide('CONTENT', section);
        s.addText(d.title, { placeholder: 'title' });
        const st = d.steps || []; const n = st.length; const gap = 0.25; const w = (12.1 - gap * (n - 1)) / n;
        st.forEach((x, i) => {
          const xx = 0.6 + i * (w + gap);
          card(s, xx, 2.0, w, 4.3, i % 2 ? HEX.teal2 : HEX.blue2);
          circle(s, xx + w / 2 - 0.4, 2.25, 0.8, i % 2 ? HEX.teal : HEX.navy, String(i + 1), 22);
          txt(s, x.t, { x: xx + 0.12, y: 3.2, w: w - 0.24, h: 0.8, fontSize: 18, bold: true, align: 'center', color: HEX.navy, fit: 'shrink' });
          txt(s, x.d, { x: xx + 0.15, y: 4.0, w: w - 0.3, h: 2.1, fontSize: n > 5 ? 15 : 16, align: 'left', fit: 'shrink' });
          if (i < n - 1) s.addShape(pres.shapes.RIGHT_ARROW, { x: xx + w - 0.02, y: 2.5, w: gap + 0.04, h: 0.3, fill: { color: HEX.amber }, line: { color: HEX.amber } });
        });
        s.addNotes(notes); break;
      }
      case 'cards': {
        const s = addSlide('CONTENT', section);
        s.addText(d.title, { placeholder: 'title' });
        const cs = d.cards || []; const n = cs.length; const cols = n === 4 ? 2 : n;
        const rowsN = Math.ceil(n / cols); const gw = 0.35; const w = (12.1 - gw * (cols - 1)) / cols; const h = rowsN === 1 ? 4.6 : 2.4;
        cs.forEach((c, i) => {
          const xx = 0.6 + (i % cols) * (w + gw), yy = 1.55 + Math.floor(i / cols) * (h + 0.3);
          card(s, xx, yy, w, h, HEX.bg, HEX.line);
          circle(s, xx + 0.25, yy + 0.25, 0.6, [HEX.navy, HEX.teal, 'C25A12', HEX.purple][i % 4], String(i + 1), 18);
          txt(s, c.t, { x: xx + 1.0, y: yy + 0.25, w: w - 1.2, h: 0.6, fontSize: 19, bold: true, color: HEX.navy, valign: 'middle', fit: 'shrink' });
          txt(s, c.d, { x: xx + 0.25, y: yy + 1.0, w: w - 0.5, h: h - 1.2, fontSize: 17, fit: 'shrink' });
        });
        s.addNotes(notes); break;
      }
      case 'quiz': {
        const s = addSlide('CONTENT', section);
        s.addText(d.title || '隨堂小測驗', { placeholder: 'title' });
        card(s, 0.6, 1.4, 9.6, 1.25, HEX.amber2);
        txt(s, d.q, { x: 0.85, y: 1.5, w: 9.1, h: 1.05, fontSize: 19, bold: true, valign: 'middle', fit: 'shrink' });
        (d.options || []).forEach((o, i) => {
          const xx = 0.6 + (i % 2) * 4.9, yy = 3.0 + Math.floor(i / 2) * 1.75;
          card(s, xx, yy, 4.7, 1.55, HEX.white, HEX.line);
          circle(s, xx + 0.2, yy + 0.45, 0.65, HEX.navy, 'ABCD'[i], 18);
          txt(s, o, { x: xx + 1.0, y: yy + 0.15, w: 3.55, h: 1.25, fontSize: 18, valign: 'middle', fit: 'shrink' });
        });
        person(s, 'arale', 9.85, 2.3, 4.3);
        s.addNotes(`【答案】${'ABCD'[d.answer] || ''}\n` + notes); break;
      }
      case 'case': {
        const s = addSlide('CONTENT', section);
        s.addText(d.title, { placeholder: 'title' });
        card(s, 0.6, 1.45, 8.7, 3.0, HEX.bg, HEX.line);
        txt(s, '情境', { x: 0.85, y: 1.6, w: 2, h: 0.4, fontSize: 14, bold: true, color: HEX.teal, margin: 0 });
        txt(s, d.scenario, { x: 0.85, y: 2.05, w: 8.2, h: 2.3, fontSize: 17, fit: 'shrink' });
        card(s, 0.6, 4.7, 8.7, 1.85, HEX.navy);
        txt(s, '討論', { x: 0.85, y: 4.85, w: 2, h: 0.4, fontSize: 14, bold: true, color: HEX.amber, margin: 0 });
        txt(s, d.question, { x: 0.85, y: 5.25, w: 8.2, h: 1.2, fontSize: 18, bold: true, color: HEX.white, fit: 'shrink' });
        face(s, 'allan-think', 9.9, 1.6, 2.9);
        txt(s, '先別急著看答案，\n小組討論 3 分鐘！', { x: 9.7, y: 4.75, w: 3.2, h: 1.0, fontSize: 15, color: HEX.muted, align: 'center' });
        s.addNotes(notes); break;
      }
      case 'quote': {
        const s = addSlide('CONTENT', section);
        s.background = { color: HEX.bg };
        const who = d.who === 'allan' ? 'allan' : 'arale';
        card(s, 0.9, 1.6, 7.9, 3.6, HEX.white, HEX.line);
        txt(s, '“', { x: 1.1, y: 1.5, w: 1, h: 1, fontSize: 72, bold: true, color: HEX.amber, margin: 0 });
        txt(s, d.text, { x: 1.4, y: 2.3, w: 7.1, h: 2.6, fontSize: 26, bold: true, color: HEX.navy, valign: 'middle', fit: 'shrink' });
        txt(s, who === 'arale' ? '—— 助教 ARALE' : '—— Allan 顧問', { x: 1.4, y: 5.35, w: 7, h: 0.5, fontSize: 16, color: HEX.muted });
        person(s, who, who === 'arale' ? 8.85 : 9.9, 1.0, 5.6);
        s.addNotes(notes); break;
      }
      default: {
        const s = addSlide('CONTENT', section);
        s.addText(d.title || '', { placeholder: 'title' });
        s.addNotes(notes);
      }
    }
  }
  await pres.writeFile({ fileName: OUT });
  try { const { applyTheme } = require(process.env.APPLY_THEME || './apply_theme.js'); await applyTheme(OUT, THEME); } catch (e) { console.warn('theme not applied:', e.message); }
  console.log('wrote', OUT, slides.length + 1, 'slides');
}
main().catch(e => { console.error(e); process.exit(1); });
