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
    INTRO:{label:'Introduction', cls:'intro'},
    IS:{label:'Information Security', cls:'is'},
    PP:{label:'Prototype Protection', cls:'pp'},
    DP:{label:'Data Protection', cls:'dp'},
    AUDIT:{label:'Audit Practice', cls:'audit'}
  };

  window.renderTopbar = function(active){
    const el = document.getElementById('topbar'); if(!el) return;
    const items = [['index.html','Home','home'],['text.html','Online Textbook','text'],['video.html','Interactive Video','video'],['quiz.html','Quizzes','quiz']];
    el.className = 'topbar';
    el.innerHTML = `<div class="wrap">
      ${active==='text'?'<button class="btn btn-ghost menu-btn" style="color:#fff;border-color:rgba(255,255,255,.3);padding:6px 12px" onclick="document.querySelector(\'.sidebar\').classList.toggle(\'open\')">☰ Chapters</button>':''}
      <a class="brand" href="index.html"><span class="logo">ISA</span><span>ISA 2027 for TISAX — Requirements Explained</span></a>
      ${window.COURSE_LICENSE && window.COURSE_LICENSE.company ? `<span class="lic-badge" title="${esc(licenseText())}">Licensed to: ${esc(window.COURSE_LICENSE.company)}</span>` : ''}
      <nav class="topnav">${items.map(i=>`<a href="${i[0]}" class="${i[2]===active?'on':''}">${i[1]}</a>`).join('')}
      <button class="theme-btn" onclick="toggleTheme()" title="Toggle dark / light mode">◐</button></nav></div>`;
  };

  window.CHAR = {
    allan:{name:'Allan', img:e=>`assets/img/ch/allan-${e||'smile'}.webp`},
    arale:{name:'ARALE', img:e=>`assets/img/ch/arale-${e||'happy'}.webp`}
  };

  // Credits and copyright: added to the bottom of every page
  window.CREDIT = {maker:'Course design and production: Allan Lo, Consultant', url:'http://www.123hi.org', copy:'Copyright © 2026 Allan Lo. All rights reserved.'};
  // License information (public edition: COURSE_LICENSE = null, nothing is shown)
  const LIC = (window.COURSE_LICENSE && window.COURSE_LICENSE.company) ? window.COURSE_LICENSE : null;
  window.LICENSE = LIC;
  window.licenseText = function(){
    if (!LIC) return '';
    const who = LIC.company + (LIC.dept ? ' ' + LIC.dept : '');
    const period = LIC.start || LIC.end ? `, license period ${LIC.start || ''}${LIC.end ? ' to ' + LIC.end : ' onwards'}` : '';
    return `This course is licensed to ${who} for ${LIC.note || 'internal training use'}${LIC.no ? ` (license no. ${LIC.no}${period})` : (period ? ` (${period.slice(2)})` : '')}. Do not copy, redistribute or publish it outside the licensed organization.`;
  };
  function licenseWarnings(){
    if (!LIC) return [];
    const w = [], today = new Date().toISOString().slice(0, 10);
    if (LIC.end && today > LIC.end) w.push(`The license for this course expired on ${LIC.end}. Please contact Allan Lo (www.123hi.org) to renew it.`);
    const host = location.hostname;
    if (LIC.domains && LIC.domains.length && host && !/^(localhost|127\.|\[::1\])/.test(host) &&
        !LIC.domains.some(d => host === d || host.endsWith('.' + d)))
      w.push(`This website (${host}) is not within the licensed domains. Please contact Allan Lo (www.123hi.org).`);
    return w;
  }
  document.addEventListener('DOMContentLoaded', function(){
    if (LIC) {
      const warns = licenseWarnings();
      if (warns.length) {
        const b = document.createElement('div'); b.className = 'lic-warn'; b.textContent = warns.join(' ');
        document.body.insertBefore(b, document.body.firstChild);
      }
      document.querySelectorAll('[data-lic-company]').forEach(el => { el.textContent = 'Internal training edition for ' + LIC.company; el.hidden = false; });
    }
    if (document.getElementById('credit')) return;
    const d = document.createElement('div');
    d.id = 'credit'; d.className = 'wrap credit';
    d.innerHTML = (LIC ? `<div class="lic-line">${esc(licenseText())}</div>` : '') +
      `<div>${CREDIT.maker} (<a href="${CREDIT.url}" target="_blank" rel="noopener">www.123hi.org</a>)</div><div>${CREDIT.copy}</div>`;
    const pa = document.getElementById('printArea');
    pa ? document.body.insertBefore(d, pa) : document.body.appendChild(d);
  });
})();
