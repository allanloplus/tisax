/* Shared helpers for the ISA 2027 for TISAX course site */
(function(){
  const store = {
    get(k, d){ try{ const v = localStorage.getItem('isa27.'+k); return v===null? d : JSON.parse(v); }catch(e){ return d; } },
    set(k, v){ try{ localStorage.setItem('isa27.'+k, JSON.stringify(v)); }catch(e){} }
  };
  window.Store = store;

  // theme
  const t = store.get('theme', null);
  if (t) document.documentElement.setAttribute('data-theme', t);
  window.toggleTheme = function(){
    const cur = document.documentElement.getAttribute('data-theme') ||
      (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const nx = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nx); store.set('theme', nx);
  };

  window.esc = function(s){
    return String(s==null?'':s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  };
  // escape + **bold** + line breaks
  window.md = function(s){
    return esc(s).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/\n/g,'<br>');
  };

  // load a JS data file via <script> (works on file:// and http)
  const loaded = {};
  window.loadScript = function(src){
    if (loaded[src]) return loaded[src];
    loaded[src] = new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = src; s.async = true; s.onload = () => res(); s.onerror = () => { delete loaded[src]; rej(new Error('load '+src)); };
      document.head.appendChild(s);
    });
    return loaded[src];
  };

  window.MODULE_META = {
    INTRO:{label:'課程導論', cls:'intro'},
    IS:{label:'Information Security 資訊安全', cls:'is'},
    PP:{label:'Prototype Protection 原型件保護', cls:'pp'},
    DP:{label:'Data Protection 資料保護', cls:'dp'},
    AUDIT:{label:'稽核實務', cls:'audit'}
  };

  window.renderTopbar = function(active){
    const el = document.getElementById('topbar'); if(!el) return;
    const items = [['index.html','首頁','home'],['text.html','線上文字教材','text'],['video.html','互動影音教材','video'],['quiz.html','課後測驗','quiz']];
    el.className = 'topbar';
    el.innerHTML = `<div class="wrap">
      ${active==='text'?'<button class="btn btn-ghost menu-btn" style="color:#fff;border-color:rgba(255,255,255,.3);padding:6px 12px" onclick="document.querySelector(\'.sidebar\').classList.toggle(\'open\')">☰ 章節</button>':''}
      <a class="brand" href="index.html"><span class="logo">ISA</span><span>ISA 2027 for TISAX 標準要求解說</span></a>
      <nav class="topnav">${items.map(i=>`<a href="${i[0]}" class="${i[2]===active?'on':''}">${i[1]}</a>`).join('')}
      <button class="theme-btn" onclick="toggleTheme()" title="切換深色/淺色">◐</button></nav></div>`;
  };

  window.CHAR = {
    allan:{name:'Allan 顧問', img:e=>`assets/img/ch/allan-${e||'smile'}.webp`},
    arale:{name:'助教 ARALE', img:e=>`assets/img/ch/arale-${e||'happy'}.webp`}
  };

  // 製作者與版權資訊：自動加在每一頁最下方
  window.CREDIT = {maker:'教材規劃製作：Allan Lo顧問', url:'http://www.123hi.org', copy:'Copyright © 2026 Allan Lo. All rights reserved.'};
  document.addEventListener('DOMContentLoaded', function(){
    if (document.getElementById('credit')) return;
    const d = document.createElement('div');
    d.id = 'credit'; d.className = 'wrap credit';
    d.innerHTML = `<div>${CREDIT.maker}（<a href="${CREDIT.url}" target="_blank" rel="noopener">www.123hi.org</a>）</div><div>${CREDIT.copy}</div>`;
    const pa = document.getElementById('printArea');
    pa ? document.body.insertBefore(d, pa) : document.body.appendChild(d);
  });
})();
