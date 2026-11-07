/* Online textbook renderer */
renderTopbar('text');
window.__COURSE = {};
window.COURSE_DATA = function(key, data){ window.__COURSE[key] = data; };

const REQ_LABEL = {must:'Requirements (must)', should:'Requirements (should)', high:'Additional requirements for high protection needs', vhigh:'Additional requirements for very high protection needs', sga:'Additional requirements for Simplified Group Assessments (SGA)'};
const done = Store.get('readControls', {});

function allChapters(){ const a=[]; TOC.forEach(m=>m.chapters.forEach(c=>a.push(Object.assign({key:m.key,module:m.module},c)))); return a; }
const CH = allChapters();
const totalControls = CH.reduce((n,c)=>n+c.controls.length,0);

function updateStat(){
  const n = Object.keys(done).length;
  document.getElementById('readstat').textContent = `Reading progress: ${n} / ${totalControls} controls`;
  document.getElementById('readbar').style.width = (totalControls? Math.round(n*100/totalControls):0)+'%';
}

function renderNav(filter){
  const f = (filter||'').trim().toLowerCase();
  const cur = (location.hash.match(/ch=([^&]+)/)||[])[1];
  let h='', lastMod='';
  TOC.forEach(m=>{
    const meta = MODULE_META[m.module];
    let inner='';
    m.chapters.forEach(c=>{
      const ctl = c.controls.filter(x=>!f || x.id.includes(f) || x.title.toLowerCase().includes(f));
      const chMatch = !f || c.title.toLowerCase().includes(f);
      if (!chMatch && !ctl.length) return;
      inner += `<a class="navch ${c.id===cur?'on':''}" href="#ch=${c.id}">${esc(c.title)}</a>`;
      if (c.id===cur || f) inner += ctl.map(x=>`<a class="navctl ${done[x.id]?'done':''}" href="#ch=${c.id}&c=${encodeURIComponent(x.id)}">${esc(x.id)} ${esc(x.title)}</a>`).join('');
    });
    if (inner){ if (m.module!==lastMod) h += `<div class="navmod"><span class="pill ${meta.cls}">${esc(meta.label)}</span></div>`; lastMod=m.module; h += inner; }
  });
  document.getElementById('nav').innerHTML = h || '<p class="muted small">No matching items</p>';
}

function blockHTML(b){
  switch(b.type){
    case 'h3': return `<h3>${md(b.text)}</h3>`;
    case 'p': return `<p>${md(b.text)}</p>`;
    case 'list': return `<ul>${b.items.map(i=>`<li>${md(i)}</li>`).join('')}</ul>`;
    case 'olist': return `<ol>${b.items.map(i=>`<li>${md(i)}</li>`).join('')}</ol>`;
    case 'table': return `<table><thead><tr>${b.head.map(x=>`<th>${md(x)}</th>`).join('')}</tr></thead><tbody>${b.rows.map(r=>`<tr>${r.map(x=>`<td>${md(x)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    case 'tip': { const w=b.who==='arale'?'arale':'allan'; return `<div class="tip ${w}"><img src="${CHAR[w].img(w==='allan'?'point':'wink')}" alt=""><div><b class="who">${w==='allan'?'From Allan\'s experience':'ARALE\'s notes'}</b>${md(b.text)}</div></div>`; }
    case 'callout': return `<div class="callout ${b.style||'info'}"><b class="t">${md(b.title||'')}</b>${md(b.text||'')}</div>`;
    default: return b.text? `<p>${md(b.text)}</p>`:'';
  }
}
function list(items){ return items && items.length ? `<ul>${items.map(i=>`<li>${md(i)}</li>`).join('')}</ul>` : '<p class="muted small">(none)</p>'; }

function controlHTML(c, chId){
  const uid = 'c'+c.id.replace(/\./g,'_');
  const reqs = ['must','should','high','vhigh','sga'].filter(k=>c.req && c.req[k] && c.req[k].length)
    .map(k=>`<div class="req ${k}"><div class="rh"><span>${REQ_LABEL[k]}</span><span>${c.req[k].length} item${c.req[k].length>1?'s':''}</span></div><ul>${c.req[k].map(i=>`<li>${md(i)}</li>`).join('')}</ul></div>`).join('');
  const a = c.audit||{};
  return `<article class="control card" id="${uid}">
    <div class="ch"><div class="id">ISA ${esc(c.id)}</div><h2>${esc(c.title)}</h2>
      <div class="q">${esc(c.q_en||c.q_zh||'')}</div></div>
    <div class="cb">
      <div class="tabs" role="tablist">
        <button class="on" data-t="req">① Requirements</button><button data-t="exp">② Explanation</button>
        <button data-t="prac">③ Practice</button><button data-t="aud">④ Audit</button></div>
      <div class="tabpane on" data-p="req">
        <dl class="kv"><dt>Objective</dt><dd>${md(c.objective||'')}</dd>
        ${c.refs?`<dt>References</dt><dd class="small">${md(c.refs)}</dd>`:''}
        ${c.change2027?`<dt>Changes in 2027</dt><dd>${md(c.change2027)}</dd>`:''}</dl>
        ${reqs}
      </div>
      <div class="tabpane" data-p="exp">${(c.explain||[]).map(p=>`<p>${md(p)}</p>`).join('')}</div>
      <div class="tabpane" data-p="prac"><h3>How to implement it in practice</h3>${list(c.practice)}</div>
      <div class="tabpane" data-p="aud">
        <div class="audit-grid">
          <div class="card"><h4>🎤 What auditors ask</h4>${list(a.questions)}</div>
          <div class="card"><h4>📁 Evidence to prepare</h4>${list(a.evidence)}</div>
          <div class="card"><h4>⚠️ Common findings</h4>${list(a.findings)}</div>
        </div>
      </div>
      ${c.tip?`<div class="tip allan"><img src="${CHAR.allan.img('wink')}" alt=""><div><b class="who">Allan's tip</b>${md(c.tip)}</div></div>`:''}
      <label class="mark-done small"><input type="checkbox" data-done="${esc(c.id)}" ${done[c.id]?'checked':''}> I have finished reading this control</label>
    </div></article>`;
}

async function show(){
  const hm = location.hash;
  let chId = (hm.match(/ch=([^&]+)/)||[])[1] || Store.get('lastCh', CH[0].id);
  let ch = CH.find(c=>c.id===chId) || CH[0];
  Store.set('lastCh', ch.id);
  renderNav(document.getElementById('search').value);
  const main = document.getElementById('main');
  main.innerHTML = '<p class="muted">Loading…</p>';
  try{ await loadScript(`data/text/${ch.key}.js`); }catch(e){ main.innerHTML='<p>Failed to load content. Please refresh the page.</p>'; return; }
  const data = window.__COURSE[ch.key];
  const c = data.chapters.find(x=>x.id===ch.id);
  const meta = MODULE_META[data.module];
  const idx = CH.indexOf(ch), prev = CH[idx-1], next = CH[idx+1];
  const firstVideo = (ch.videos||[])[0];
  main.innerHTML = `
    <div class="chapter-head"><span class="pill ${meta.cls}">${esc(meta.label)}</span>
      ${firstVideo?`<a class="btn btn-amber" style="padding:6px 14px;font-size:14px" href="video.html#seg=${firstVideo.id}">▶ Watch this chapter's video (${ch.videos.length} part${ch.videos.length>1?'s':''})</a>`:''}</div>
    <h1>${esc(c.title)}</h1>${c.title_en?`<div class="muted">${esc(c.title_en)}</div>`:''}
    ${(c.intro&&c.intro.length)?`<div class="intro-box">${c.intro.map(p=>`<p>${md(p)}</p>`).join('')}</div>`:''}
    ${(c.blocks||[]).map(blockHTML).join('')}
    ${(c.controls||[]).length?`<h2>Controls explained one by one (${c.controls.length})</h2>`:''}
    ${(c.controls||[]).map(x=>controlHTML(x,c.id)).join('')}
    ${(c.summary&&c.summary.length)?`<div class="summary"><h3>📌 Chapter summary</h3>${list(c.summary)}</div>`:''}
    <div class="pager">
      ${prev?`<a class="btn btn-ghost" href="#ch=${prev.id}">← ${esc(prev.title)}</a>`:'<span></span>'}
      ${next?`<a class="btn btn-primary" href="#ch=${next.id}">${esc(next.title)} →</a>`:`<a class="btn btn-primary" href="quiz.html">Go to the quizzes →</a>`}
    </div>`;
  main.querySelectorAll('.control').forEach(card=>{
    card.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>{
      card.querySelectorAll('.tabs button').forEach(x=>x.classList.toggle('on',x===b));
      card.querySelectorAll('.tabpane').forEach(p=>p.classList.toggle('on',p.dataset.p===b.dataset.t));
    });
  });
  main.querySelectorAll('[data-done]').forEach(cb=>cb.onchange=()=>{
    if (cb.checked) done[cb.dataset.done]=1; else delete done[cb.dataset.done];
    Store.set('readControls', done); updateStat(); renderNav(document.getElementById('search').value);
  });
  const cid = (hm.match(/[&?]c=([^&]+)/)||[])[1];
  if (cid){ const el = document.getElementById('c'+decodeURIComponent(cid).replace(/\./g,'_')); if (el) setTimeout(()=>el.scrollIntoView({behavior:'smooth'}),50); }
  else window.scrollTo(0,0);
  document.getElementById('sidebar').classList.remove('open');
  document.title = `${c.title} | ISA 2027 for TISAX — Requirements Explained`;
}
document.getElementById('search').addEventListener('input', e=>renderNav(e.target.value));
window.addEventListener('hashchange', show);
updateStat(); show();
