/* Post-course quizzes with certificate */
renderTopbar('quiz');
const CFG = window.QUIZ_CONFIG || {passScore:80};
const app = document.getElementById('app');
const KEYS = ['IS','PP','DP'];
const NAMES = {IS:'Information Security', PP:'Prototype Protection', DP:'Data Protection'};
const COLORS = {IS:'#2463b5', PP:'#c25a12', DP:'#7a3fb0'};
const LETTER = ['A','B','C','D','E'];
let st = {key:null, order:[], answers:{}, info:Store.get('learner', {})};

function chapterForRef(ref){
  const id = (String(ref).match(/(\d+(?:\.\d+)+)/)||[])[1]; if (!id) return null;
  for (const m of TOC) for (const c of m.chapters) if (c.controls.some(x=>x.id===id)) return {ch:c.id, c:id, title:c.title};
  return null;
}
function results(){ return Store.get('results', {}); }

function home(){
  const R = results();
  app.innerHTML = `
  <div class="qhead"><img src="assets/img/ch/arale-cheer.webp" alt="">
    <div><h1 style="margin:0">Post-course Quizzes and Certificate</h1>
    <p class="muted" style="margin:.3em 0">Each of the three modules has 10 multiple-choice questions. Score ${CFG.passScore}% or more to pass and download your certificate (with the questions and answers). If you do not pass, please review the course material and try again.</p></div></div>
  <div class="qcards">${KEYS.map(k=>{ const q=QUIZ[k]; const r=R[k];
    return `<div class="card qcard"><span class="pill ${k.toLowerCase()}">${k}</span><h3>${esc(q.title||NAMES[k])}</h3>
      <div class="st muted">${q.questions.length} questions · pass mark ${q.pass||CFG.passScore}</div>
      <div class="st">${r? (r.pass?`✅ Passed (score ${r.score}, ${esc(r.date)})`:`❌ Last score ${r.score}, not passed`) : 'Not taken yet'}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:auto">
        <button class="btn btn-primary" onclick="startInfo('${k}')">${r?'Retake quiz':'Start quiz'}</button>
        ${r&&r.pass?`<button class="btn btn-amber" onclick="showCert('${k}')">View certificate</button>`:''}</div></div>`; }).join('')}
  </div>`;
}

function startInfo(k){
  st.key = k; const i = st.info;
  app.innerHTML = `<h1>${esc(QUIZ[k].title||NAMES[k])}</h1>
  <p>Please enter your details first (they will appear on your certificate):</p>
  <form class="card form" id="f" autocomplete="on">
    <label>Company *<input name="company" required placeholder="e.g. Example Precision Industries Co., Ltd." value="${esc(i.company||'')}"></label>
    <label>Department *<input name="unit" required placeholder="e.g. IT Department, Information Security" value="${esc(i.unit||'')}"></label>
    <label>Name *<input name="name" required placeholder="Jane Doe" value="${esc(i.name||'')}"></label>
    <label>Job title *<input name="title" required placeholder="Information Security Engineer" value="${esc(i.title||'')}"></label>
    <label class="full">E-mail *<input name="email" type="email" required placeholder="name@company.com" value="${esc(i.email||'')}"></label>
    <div class="full" style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-primary" type="submit">Start →</button>
    <button class="btn btn-ghost" type="button" onclick="home()">Back</button></div>
  </form>`;
  document.getElementById('f').onsubmit = e => {
    e.preventDefault(); const fd = new FormData(e.target); const o = {};
    for (const [a,b] of fd.entries()) o[a] = String(b).trim();
    if (Object.values(o).some(v=>!v)) return;
    st.info = o; Store.set('learner', o); startQuiz();
  };
}

function shuffle(a){ a = a.slice(); for (let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }

function startQuiz(){
  const Q = QUIZ[st.key].questions;
  // shuffle question order and option order for every attempt
  st.order = shuffle(Q.map((_,i)=>i)).map(qi => ({qi, opts: shuffle(Q[qi].options.map((_,k)=>k))}));
  st.answers = {};
  app.innerHTML = `<h1>${esc(QUIZ[st.key].title||NAMES[st.key])}</h1>
  <p class="muted">Learner: ${esc(st.info.name)} (${esc(st.info.company)}). ${Q.length} multiple-choice questions.</p>
  ${st.order.map((o,n)=>{ const q=Q[o.qi]; return `<div class="card q" id="q${n}"><div class="qn">Question ${n+1}</div><div class="qt">${md(q.q)}</div>
    ${o.opts.map((k,j)=>`<label class="opt"><input type="radio" name="q${n}" value="${k}"><span><b>${LETTER[j]}.</b> ${md(q.options[k])}</span></label>`).join('')}</div>`; }).join('')}
  <div class="qbar"><span id="cnt">Answered 0 / ${Q.length}</span><button class="btn btn-primary" id="sub" disabled>Submit</button></div>`;
  app.querySelectorAll('input[type=radio]').forEach(r => r.onchange = () => {
    const n = +r.name.slice(1); st.answers[n] = +r.value;
    r.closest('.q').querySelectorAll('.opt').forEach(l => l.classList.toggle('sel', l.contains(r)));
    const c = Object.keys(st.answers).length;
    document.getElementById('cnt').textContent = `Answered ${c} / ${Q.length}`;
    document.getElementById('sub').disabled = c < Q.length;
  });
  document.getElementById('sub').onclick = grade;
  window.scrollTo(0,0);
}

function certNo(info, key, date){
  let h = 0; const s = info.email + info.name + key + date;
  for (let i=0;i<s.length;i++) h = (h*31 + s.charCodeAt(i)) >>> 0;
  return `ISA27-${key}-${date.replace(/-/g,'')}-${h.toString(36).toUpperCase().slice(0,6)}`;
}

function grade(){
  const Q = QUIZ[st.key].questions; let right = 0; const detail = [];
  st.order.forEach((o,n) => { const q = Q[o.qi]; const a = st.answers[n]; const ok = a === q.answer; if (ok) right++;
    detail.push({n:n+1, q:q.q, options:o.opts.map(k=>q.options[k]), chosen:o.opts.indexOf(a), correct:o.opts.indexOf(q.answer), explain:q.explain, ref:q.ref, ok}); });
  const score = Math.round(right*100/Q.length);
  const pass = score >= (QUIZ[st.key].pass || CFG.passScore);
  const d = new Date(); const date = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const rec = {key:st.key, module:NAMES[st.key], score, right, total:Q.length, pass, date, time:d.toISOString(), info:st.info, detail};
  if (pass) rec.cert = certNo(st.info, st.key, date);
  const R = results(); if (!(R[st.key] && R[st.key].pass && !pass)) R[st.key] = rec; Store.set('results', R);
  submit(rec);
  pass ? passView(rec) : failView(rec);
}

function submit(rec){
  if (!CFG.submitEndpoint) return;
  const body = {course:'ISA 2027 for TISAX — Requirements Explained (EN)', module:rec.key, score:rec.score, pass:rec.pass, date:rec.time, cert:rec.cert||'',
    company:rec.info.company, unit:rec.info.unit, name:rec.info.name, title:rec.info.title, email:rec.info.email,
    answers:rec.detail.map(x=>`${x.n}:${x.ok?'O':'X'}`).join(' ')};
  try { fetch(CFG.submitEndpoint, {method:'POST', mode:'no-cors', headers:{'Content-Type':'text/plain;charset=utf-8'}, body:JSON.stringify(body)}); } catch(e){}
}

function failView(rec){
  const wrong = rec.detail.filter(x=>!x.ok);
  const links = {}; wrong.forEach(x => { const c = chapterForRef(x.ref); if (c) links[c.ch+'|'+c.c] = c; });
  app.innerHTML = `<div class="card result fail"><img class="face" src="assets/img/ch/arale-sad.webp" alt="">
    <div class="score">${rec.score}</div><h2>So close! You did not reach the pass mark of ${QUIZ[rec.key].pass||CFG.passScore} this time</h2>
    <p>You answered ${rec.right} of ${rec.total} questions correctly. Please review the controls below, then try again (questions and options are shuffled on every attempt).</p>
    <div class="wrongs"><b>Recommended review:</b><ul>${Object.values(links).map(c=>`<li><a href="text.html#ch=${c.ch}&c=${encodeURIComponent(c.c)}">ISA ${esc(c.c)} (${esc(c.title)})</a></li>`).join('') || '<li>Please review the material for this module</li>'}</ul></div>
    <div class="acts"><a class="btn btn-ghost" href="text.html">📖 Review the textbook</a><a class="btn btn-ghost" href="video.html">▶ Watch the videos</a>
    <button class="btn btn-primary" onclick="startQuiz()">🔁 Retake quiz</button><button class="btn btn-ghost" onclick="home()">Back to quizzes</button></div></div>`;
  window.scrollTo(0,0);
}

function passView(rec){
  app.innerHTML = `<div class="card result pass"><img class="face" src="assets/img/ch/arale-cheer.webp" alt="">
    <div class="score">${rec.score}</div><h2>Congratulations, you passed! 🎉</h2>
    <p>${rec.right} of ${rec.total} correct · certificate no. <b>${esc(rec.cert)}</b></p>
    <img class="certprev" id="certimg" alt="Certificate of completion">
    <div class="acts"><button class="btn btn-amber" id="dlpng">⬇ Download certificate (PNG)</button>
      <button class="btn btn-primary" id="dlpdf">🖨 Certificate + answers (PDF)</button>
      <button class="btn btn-ghost" id="dlhtml">⬇ Questions and answers (HTML)</button>
      <button class="btn btn-ghost" onclick="home()">Back to quizzes</button></div></div>
    <h2>Questions and answers</h2>${answersHTML(rec)}`;
  const cv = drawCert(rec); const url = cv.toDataURL('image/png');
  document.getElementById('certimg').src = url;
  document.getElementById('dlpng').onclick = () => dl(url, `${rec.cert}.png`);
  document.getElementById('dlpdf').onclick = () => printPack(rec, url);
  document.getElementById('dlhtml').onclick = () => {
    const html = `<!doctype html><meta charset="utf-8"><title>${rec.cert}</title><body style="font-family:Arial,Helvetica,sans-serif;max-width:900px;margin:20px auto;line-height:1.7"><img src="${url}" style="width:100%"><h2>Questions and answers (${esc(rec.module)})</h2>${printQA(rec)}<p style="text-align:center;color:#555;font-size:13px">${CREDIT.maker} (<a href="${CREDIT.url}">www.123hi.org</a>)<br>${CREDIT.copy}</p></body>`;
    dl(URL.createObjectURL(new Blob([html], {type:'text/html'})), `${rec.cert}-answers.html`);
  };
  window.scrollTo(0,0);
}
function showCert(k){ const r = results()[k]; if (r && r.pass) { st.key = k; passView(r); } }

function answersHTML(rec){
  return rec.detail.map(x=>`<div class="card q"><div class="qn">Question ${x.n}  ${x.ok?'✅ Correct':'❌ Wrong'}  <span class="muted">${esc(x.ref||'')}</span></div><div class="qt">${md(x.q)}</div>
    ${x.options.map((o,j)=>`<div class="opt ${j===x.correct?'right':(j===x.chosen?'wrong':'')}"><span><b>${LETTER[j]}.</b> ${md(o)}${j===x.correct?'  ✔ Correct answer':''}${j===x.chosen&&j!==x.correct?'  (your answer)':''}</span></div>`).join('')}
    <div class="explain"><b>Explanation:</b> ${md(x.explain||'')}</div></div>`).join('');
}
function printQA(rec){
  return rec.detail.map(x=>`<div class="pq"><b>${x.n}. ${esc(x.q)}</b>（${esc(x.ref||'')}）<br>${x.options.map((o,j)=>`${LETTER[j]}. ${esc(o)}${j===x.correct?' <span class="ok">✔</span>':''}`).join('<br>')}<br>
    <span>Your answer: ${LETTER[x.chosen]}   Correct answer: <span class="ok">${LETTER[x.correct]}</span></span><br><span>Explanation: ${esc(x.explain||'')}</span></div>`).join('');
}
function printPack(rec, url){
  const pa = document.getElementById('printArea');
  pa.innerHTML = `<img class="pcert" src="${url}"><h2>Questions and answers | ${esc(rec.module)} | ${esc(rec.info.name)} | ${esc(rec.cert)}</h2>${printQA(rec)}<p style="text-align:center;font-size:9pt;color:#555">${window.LICENSE ? esc(licenseText()) + '<br>' : ''}${CREDIT.maker} (www.123hi.org)<br>${CREDIT.copy}</p>`;
  const img = pa.querySelector('img'); const go = () => setTimeout(() => window.print(), 100);
  img.complete ? go() : (img.onload = go);
}
function dl(href, name){ const a = document.createElement('a'); a.href = href; a.download = name; document.body.appendChild(a); a.click(); a.remove(); }

/* ---------- certificate drawing ---------- */
const imgCache = {};
function img(src){ if (!imgCache[src]) { const i = new Image(); i.src = src; imgCache[src] = i; } return imgCache[src]; }
['assets/img/ch/allan-full.webp','assets/img/ch/arale-wave.webp'].forEach(img);
function drawCert(rec){
  const W = 2000, H = 1414, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'); const F = '"Segoe UI",Roboto,Arial,"Microsoft JhengHei","PingFang TC",sans-serif';
  const col = COLORS[rec.key];
  g.fillStyle = '#ffffff'; g.fillRect(0,0,W,H);
  // frame
  g.fillStyle = '#0f2a44'; g.fillRect(0,0,W,H);
  g.fillStyle = '#fbfcfd'; g.fillRect(40,40,W-80,H-80);
  g.strokeStyle = '#f2b705'; g.lineWidth = 6; g.strokeRect(70,70,W-140,H-140);
  g.strokeStyle = col; g.lineWidth = 2; g.strokeRect(86,86,W-172,H-172);
  // corner ornaments
  g.fillStyle = '#f2b705'; [[70,70],[W-70,70],[70,H-70],[W-70,H-70]].forEach(([x,y]) => { g.beginPath(); g.arc(x,y,16,0,7); g.fill(); });
  // header
  g.textAlign = 'center'; g.fillStyle = '#0f2a44';
  g.font = `900 40px ${F}`; g.fillText('ISA 2027 for TISAX — Requirements Explained', W/2, 200);
  g.font = `900 92px ${F}`; g.fillStyle = '#0f2a44'; g.fillText('CERTIFICATE', W/2, 330);
  g.font = `600 34px ${F}`; g.fillStyle = '#5b6777'; g.fillText('OF COMPLETION', W/2, 385);
  // body
  g.font = `400 36px ${F}`; g.fillStyle = '#1b2430'; g.fillText('This is to certify that', W/2, 480);
  g.font = `900 84px ${F}`; g.fillStyle = col; g.fillText(rec.info.name, W/2, 590);
  g.font = `500 36px ${F}`; g.fillStyle = '#1b2430';
  fitText(g, `${rec.info.company}　${rec.info.unit}　${rec.info.title}`, W/2, 660, 1500, 36, F);
  g.font = `400 36px ${F}`;
  fitText(g, 'has completed the course "ISA 2027 for TISAX — Requirements Explained"', W/2, 760, 1240, 36, F);
  g.font = `800 46px ${F}`; g.fillStyle = col; { const t = `and passed the ${rec.module} post-course quiz`; let z = 46; g.font = `800 ${z}px ${F}`; while (g.measureText(t).width > 1240 && z > 28) { z -= 2; g.font = `800 ${z}px ${F}`; } g.fillText(t, W/2, 835); }
  g.font = `400 36px ${F}`; g.fillStyle = '#1b2430'; g.fillText(`with a score of ${rec.score} (${rec.right} of ${rec.total} correct).`, W/2, 910);
  // footer info
  g.textAlign = 'left'; g.font = `400 28px ${F}`; g.fillStyle = '#5b6777';
  if (window.LICENSE) g.fillText(`Licensed to: ${LICENSE.company}${LICENSE.dept ? ', ' + LICENSE.dept : ''}`, 170, 1105);
  g.fillText(`Certificate no.: ${rec.cert}`, 170, 1150);
  g.fillText(`Date of issue: ${rec.date}`, 170, 1195);
  g.fillText(`E-mail: ${rec.info.email}`, 170, 1240);
  // signature
  g.textAlign = 'center'; g.strokeStyle = '#1b2430'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(W-760, 1180); g.lineTo(W-380, 1180); g.stroke();
  g.font = `italic 600 58px "Brush Script MT","Segoe Script",cursive`; g.fillStyle = '#0f2a44'; g.fillText(CFG.instructor || 'Allan Lo', W-570, 1165);
  g.font = `500 28px ${F}`; g.fillStyle = '#5b6777'; g.fillText(`Instructor ${CFG.instructor || 'Allan Lo'}`, W-570, 1225);
  // characters
  const a = img('assets/img/ch/allan-full.webp'), r = img('assets/img/ch/arale-wave.webp');
  if (a.complete && a.naturalWidth) { const h = 430, w = h * a.naturalWidth / a.naturalHeight; g.drawImage(a, 130, 640 - 40, w, h); }
  if (r.complete && r.naturalWidth) { const h = 400, w = h * r.naturalWidth / r.naturalHeight; g.drawImage(r, W - 130 - w, 600, w, h); }
  // seal
  g.save(); g.translate(W-860, 1040); g.rotate(-0.18);
  g.strokeStyle = 'rgba(200,50,60,.85)'; g.lineWidth = 6; g.beginPath(); g.arc(0,0,82,0,7); g.stroke();
  g.lineWidth = 2; g.beginPath(); g.arc(0,0,70,0,7); g.stroke();
  g.fillStyle = 'rgba(200,50,60,.9)'; g.font = `900 34px ${F}`; g.fillText('PASS', 0, -4); g.font = `700 22px ${F}`; g.fillText('ISA 2027', 0, 30);
  g.restore();
  g.textAlign = 'center'; g.font = `400 20px ${F}`; g.fillStyle = '#8a95a3';
  g.fillText('This certificate confirms completion of the course quiz only. It is not a TISAX assessment result and is not issued or endorsed by ENX or VDA.', W/2, H-140);
  g.fillText(`${CREDIT.maker} (www.123hi.org)   ${CREDIT.copy}`, W/2, H-108);
  return c;
}
function fitText(g, t, x, y, maxW, size, F){ let s = size; g.font = `500 ${s}px ${F}`; while (g.measureText(t).width > maxW && s > 18) { s -= 2; g.font = `500 ${s}px ${F}`; } g.fillText(t, x, y); }

// start
Promise.all(Object.values(imgCache).map(i => i.decode ? i.decode().catch(()=>{}) : null)).then(()=>{});
home();
