/* Interactive dialogue video player — each line is its own small audio file so a segment starts almost instantly */
renderTopbar('video');
const $ = id => document.getElementById(id);
const SEGS = []; // flat list
TOC.forEach(m => m.chapters.forEach(c => (c.videos||[]).forEach(v => SEGS.push(Object.assign({module:m.module, chapterId:c.id, chapterTitle:c.title}, v)))));
window.__VSEG = {};
window.VSEG = function(d){ window.__VSEG[d.id] = d; };

const S = {
  seg:null, data:null, i:0, playing:false, started:false, token:0,
  speed: +Store.get('speed', 1),
  audio: new Audio(), timer:null, cache:{}, watched: Store.get('watched', {})
};
$('speed').value = String(S.speed);
$('cc').checked = Store.get('cc', true); $('auto').checked = Store.get('auto', true);
if (!$('cc').checked) $('sub').classList.add('hide');

const fmt = s => { s = Math.round(s||0); return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); };
const audioSrc = (seg, i) => `audio/${seg}/${String(i).padStart(3,'0')}.mp3`;
const plain = t => String(t||'').replace(/\*\*/g,'');

/* ---------- segment list ---------- */
function buildPanel(){
  const sel = $('chsel'); let h = '<option value="">全部章節</option>', last = '';
  SEGS.forEach(s => { if (s.chapterId !== last){ last = s.chapterId; h += `<option value="${s.chapterId}">${esc(s.chapterTitle)}</option>`; } });
  sel.innerHTML = h;
  sel.value = Store.get('chfilter', '');
  sel.onchange = () => { Store.set('chfilter', sel.value); renderSegList(); };
  renderSegList();
}
function renderSegList(){
  const f = $('chsel').value; let h = '', last = '', n = 0;
  SEGS.forEach((s, k) => {
    if (f && s.chapterId !== f) return;
    if (s.chapterId !== last){ last = s.chapterId; n = 0; h += `<div class="grp"><span class="pill ${MODULE_META[s.module].cls}">${esc(s.module)}</span> ${esc(s.chapterTitle)}</div>`; }
    n++;
    h += `<a class="seg ${S.seg&&S.seg.id===s.id?'on':''} ${S.watched[s.id]?'w':''}" href="#seg=${s.id}"><span class="n">${S.watched[s.id]?'✓':n}</span><span>${esc(s.title)}</span><span class="d">${fmt(s.dur)}</span></a>`;
  });
  $('seglist').innerHTML = h;
}
document.querySelectorAll('.ptabs button').forEach(b => b.onclick = () => {
  document.querySelectorAll('.ptabs button').forEach(x => x.classList.toggle('on', x === b));
  $('p-segs').style.display = b.dataset.p === 'segs' ? '' : 'none';
  $('p-trans').style.display = b.dataset.p === 'trans' ? '' : 'none';
  if (b.dataset.p === 'trans') { const on = $('p-trans').querySelector('.on'); on && on.scrollIntoView({block:'center'}); }
});

/* ---------- rendering ---------- */
let lastSlide = null;
function renderSlide(sl){
  if (!sl || sl === lastSlide) return; lastSlide = sl;
  let h = `<h2>${esc(sl.title||'')}</h2>`;
  if (sl.bullets && sl.bullets.length) h += `<ul>${sl.bullets.map((b,k)=>`<li style="animation-delay:${0.15+k*0.18}s">${md(b)}</li>`).join('')}</ul>`;
  if (sl.table) h += `<table><thead><tr>${sl.table.head.map(x=>`<th>${md(x)}</th>`).join('')}</tr></thead><tbody>${sl.table.rows.map(r=>`<tr>${r.map(x=>`<td>${md(x)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  $('slide').innerHTML = `<div class="fade">${h}</div>`;
}
function slideAt(i){ const L = S.data.lines; for (let k=i; k>=0; k--) if (L[k].slide) return L[k].slide; return null; }
function renderLine(i){
  const L = S.data.lines[i]; if (!L) return;
  renderSlide(slideAt(i));
  ['allan','arale'].forEach(w => {
    const a = $('a-'+w), on = L.who === w;
    a.classList.toggle('speaking', on); a.classList.toggle('dim', !on);
    if (on) $('img-'+w).src = CHAR[w].img(L.emo);
  });
  $('subwho').textContent = CHAR[L.who].name; $('subwho').className = L.who;
  $('subtext').innerHTML = md(L.text);
  [...$('seek').children].forEach((x,k) => { x.className = k < i ? 'p' : (k === i ? 'c' : ''); });
  const tl = $('p-trans').children;
  [...tl].forEach((x,k) => x.classList.toggle('on', k === i));
  if (tl[i] && $('p-trans').style.display !== 'none') tl[i].scrollIntoView({block:'nearest'});
  const elapsed = S.data.lines.slice(0,i).reduce((n,x)=>n+(x.d||0),0);
  $('segtime').textContent = `第 ${i+1} / ${S.data.lines.length} 句　${fmt(elapsed)} / ${fmt(S.seg.dur)}`;
}

/* ---------- loading ---------- */
function prefetch(i){
  if (!S.data) return;
  for (let k=i; k<i+3 && k<S.data.lines.length; k++){
    if (!S.data.lines[k].a) continue;
    const src = audioSrc(S.seg.id, k);
    if (!S.cache[src]) { const a = new Audio(); a.preload = 'auto'; a.src = src; S.cache[src] = a; }
  }
}
async function openSeg(id, autoplay){
  const seg = SEGS.find(s => s.id === id) || SEGS[0];
  stop(); S.token++;
  S.seg = seg; S.i = 0; lastSlide = null; S.cache = {};
  Store.set('lastSeg', seg.id);
  $('segtitle').textContent = seg.title;
  $('segpath').innerHTML = `<span class="pill ${MODULE_META[seg.module].cls}">${esc(MODULE_META[seg.module].label)}</span> ${esc(seg.chapterTitle)}`;
  $('chip').textContent = seg.chapterTitle;
  $('readlink').href = 'text.html#ch=' + seg.chapterId;
  renderSegList();
  $('ovt').textContent = seg.title; $('ovs').textContent = '載入中…';
  $('overlay').classList.remove('hidden');
  try { await loadScript(`data/video/${seg.id}.js`); } catch(e){ $('ovs').textContent = '載入失敗，請重新整理'; return; }
  S.data = window.__VSEG[seg.id];
  $('seek').innerHTML = S.data.lines.map(() => '<i></i>').join('');
  $('p-trans').innerHTML = S.data.lines.map((L,k) => `<div class="tline" data-k="${k}"><img src="${CHAR[L.who].img(L.who==='allan'?'smile':'happy')}" alt=""><div><b class="small">${CHAR[L.who].name}</b><br>${md(L.text)}</div></div>`).join('');
  $('p-trans').querySelectorAll('.tline').forEach(el => el.onclick = () => jump(+el.dataset.k));
  prefetch(0);
  renderLine(0);
  $('ovs').textContent = `${S.data.lines.length} 句對話・約 ${fmt(seg.dur)}　點一下開始`;
  if (autoplay && S.started) { $('overlay').classList.add('hidden'); play(); }
}

/* ---------- playback ---------- */
function setPlayingUI(p){ S.playing = p; $('bPlay').textContent = p ? '❚❚ 暫停' : '▶ 播放'; $('stage').classList.toggle('paused', !p); }
function stop(){
  clearTimeout(S.timer); S.audio.onended = S.audio.onerror = null;
  try { S.audio.pause(); } catch(e){}
  setPlayingUI(false); $('loading').classList.remove('on');
}
function play(){ if (!S.data) return; S.started = true; $('overlay').classList.add('hidden'); setPlayingUI(true); speak(S.i); }
function pause(){ stop(); }
function next(){ if (S.i < S.data.lines.length-1){ S.i++; renderLine(S.i); if (S.playing) speak(S.i); } else endSeg(); }
function jump(k){ const was = S.playing; stop(); S.i = Math.max(0, Math.min(k, S.data.lines.length-1)); renderLine(S.i); if (was || S.started) { $('overlay').classList.add('hidden'); setPlayingUI(true); speak(S.i); } }
function endSeg(){
  stop(); S.watched[S.seg.id] = 1; Store.set('watched', S.watched); renderSegList();
  const k = SEGS.findIndex(s => s.id === S.seg.id);
  if ($('auto').checked && SEGS[k+1]) { location.hash = 'seg=' + SEGS[k+1].id; }
  else { $('ovt').textContent = '本段結束 🎉'; $('ovs').textContent = SEGS[k+1] ? '點一下播放下一段：' + SEGS[k+1].title : '全部影音已看完，前往課後測驗吧！'; $('overlay').classList.remove('hidden'); $('overlay').dataset.next = SEGS[k+1] ? SEGS[k+1].id : 'quiz'; }
}
function silentNext(i, tok){
  const L = S.data.lines[i];
  const ms = ((L.d || Math.max(2.2, plain(L.text).length * 0.24)) / S.speed) * 1000 + 250;
  S.timer = setTimeout(() => { if (tok === S.token && S.playing) next(); }, ms);
}
// 尚無錄音檔的句子：以字幕計時播放
function fallback(i, tok){ $('loading').classList.remove('on'); silentNext(i, tok); }
function speak(i){
  const tok = ++S.token; const L = S.data.lines[i];
  renderLine(i); prefetch(i+1);
  if (!L.a) return fallback(i, tok);
  const src = audioSrc(S.seg.id, i);
  const a = S.cache[src] || new Audio(src);
  S.audio = a; a.playbackRate = S.speed;
  try { a.preservesPitch = true; } catch(e){}
  a.onended = () => { if (tok === S.token && S.playing) next(); };
  a.onerror = () => { if (tok === S.token && S.playing) fallback(i, tok); };
  $('loading').classList.toggle('on', a.readyState < 3);
  a.oncanplay = () => $('loading').classList.remove('on');
  try { a.currentTime = 0; } catch(e){}
  const p = a.play(); if (p && p.catch) p.catch(err => {
    if (tok !== S.token) return;
    if (err && err.name === 'NotAllowedError') { setPlayingUI(false); $('overlay').classList.remove('hidden'); $('ovs').textContent = '點一下繼續播放'; }
    else if (S.playing) fallback(i, tok); // audio missing
  });
}

/* ---------- controls ---------- */
$('overlay').onclick = () => {
  const nx = $('overlay').dataset.next; delete $('overlay').dataset.next;
  if (nx === 'quiz') { location.href = 'quiz.html'; return; }
  if (nx) { S.started = true; location.hash = 'seg=' + nx; return; }
  play();
};
$('bPlay').onclick = () => S.playing ? pause() : play();
$('bNext').onclick = () => jump(S.i + 1);
$('bPrev').onclick = () => jump(S.i - 1);
$('bNextSeg').onclick = () => { const k = SEGS.findIndex(s => s.id === S.seg.id); if (SEGS[k+1]) location.hash = 'seg=' + SEGS[k+1].id; };
$('bPrevSeg').onclick = () => { const k = SEGS.findIndex(s => s.id === S.seg.id); if (k > 0) location.hash = 'seg=' + SEGS[k-1].id; };
$('seek').onclick = e => { const kids = [...$('seek').children]; const k = kids.indexOf(e.target); if (k >= 0) jump(k); };
$('speed').onchange = e => { S.speed = +e.target.value; Store.set('speed', S.speed); S.audio.playbackRate = S.speed; };
$('cc').onchange = e => { Store.set('cc', e.target.checked); $('sub').classList.toggle('hide', !e.target.checked); };
$('auto').onchange = e => Store.set('auto', e.target.checked);
document.addEventListener('keydown', e => {
  if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
  if (e.code === 'Space') { e.preventDefault(); S.playing ? pause() : play(); }
  if (e.code === 'ArrowRight') jump(S.i + 1);
  if (e.code === 'ArrowLeft') jump(S.i - 1);
});
function route(){ const id = (location.hash.match(/seg=([^&]+)/)||[])[1] || Store.get('lastSeg', SEGS[0] && SEGS[0].id); openSeg(id, true); }
window.addEventListener('hashchange', route);
buildPanel(); route();
