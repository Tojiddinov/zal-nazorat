/* Zal Nazorat — Telegram Mini App. Build bosqichisiz, sof JS.
   Ma’lumot: Telegram CloudStorage (qurilmalar orasida sinxron) + localStorage nusxasi (oflayn zalda ham ishlaydi). */
(function () {
  'use strict';

  const TG = window.Telegram && window.Telegram.WebApp;
  const inTG = !!(TG && TG.initData);
  const tgAtLeast = (v) => inTG && typeof TG.isVersionAtLeast === 'function' && TG.isVersionAtLeast(v);

  const DAYS = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba', 'Yakshanba'];
  const DAYS_SHORT = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];
  const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];
  const GROUP_NAME = Object.fromEntries(window.GROUPS);

  const $ = (s) => document.querySelector(s);

  // ---------------------------------------------------------------- utils
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = (n) => String(n).padStart(2, '0');
  const isoDate = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseDate = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const dayIdx = (d = new Date()) => (d.getDay() + 6) % 7;
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const num = (v) => { const n = parseFloat(String(v == null ? '' : v).replace(',', '.')); return isFinite(n) ? n : null; };
  const fmt = (n, dec = 1) => {
    if (n == null || !isFinite(n)) return '–';
    const r = Math.round(n * 10 ** dec) / 10 ** dec;
    const [i, f] = String(Math.abs(r)).split('.');
    return (r < 0 ? '−' : '') + i.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + (f ? ',' + f : '');
  };
  const clock = (ms) => {
    const s = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
    return h ? `${h}:${pad(m)}:${pad(x)}` : `${m}:${pad(x)}`;
  };
  const durText = (ms) => {
    const m = Math.round(ms / 60000);
    return m >= 60 ? `${Math.floor(m / 60)} s ${pad(m % 60)} daq` : `${m} daq`;
  };
  const restText = (sec) => (!sec ? '—' : sec % 60 ? `${Math.floor(sec / 60)}:${pad(sec % 60)}` : `${sec / 60} daq`);
  const dateShort = (iso) => { const d = parseDate(iso); return `${d.getDate()}-${MONTHS[d.getMonth()]}`; };
  const dateLong = (iso) => `${dateShort(iso)}, ${DAYS[dayIdx(parseDate(iso))].toLowerCase()}`;
  const repsLow = (r) => num(String(r).split('-')[0]);
  const repsHigh = (r) => num(String(r).split('-').pop());

  const haptic = {
    tap() { if (tgAtLeast('6.1')) try { TG.HapticFeedback.impactOccurred('light'); } catch (e) { /* ignore */ } },
    ok() { if (tgAtLeast('6.1')) try { TG.HapticFeedback.notificationOccurred('success'); } catch (e) { /* ignore */ } },
    warn() { if (tgAtLeast('6.1')) try { TG.HapticFeedback.notificationOccurred('warning'); } catch (e) { /* ignore */ } },
  };

  let audio = null;
  function unlockAudio() {
    if (audio) return;
    try { audio = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { audio = null; }
  }
  function beep() {
    if (!audio) return;
    try {
      [0, 0.22, 0.44].forEach((t, k) => {
        const o = audio.createOscillator(), g = audio.createGain();
        o.frequency.value = k === 2 ? 1320 : 880;
        g.gain.setValueAtTime(0.0001, audio.currentTime + t);
        g.gain.exponentialRampToValueAtTime(0.25, audio.currentTime + t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + t + 0.18);
        o.connect(g).connect(audio.destination);
        o.start(audio.currentTime + t); o.stop(audio.currentTime + t + 0.2);
      });
    } catch (e) { /* ignore */ }
  }

  let toastTimer = 0;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 2200);
  }
  function confirmBox(msg) {
    return new Promise((res) => {
      if (tgAtLeast('6.2')) TG.showConfirm(msg, (ok) => res(!!ok));
      else res(window.confirm(msg));
    });
  }
  function openLink(url) {
    if (inTG) TG.openLink(url); else window.open(url, '_blank', 'noopener');
  }

  // ---------------------------------------------------------------- storage
  const LS = 'zal:';
  const LS_DIRTY = 'zal_meta_dirty';
  const CLOUD_LIMIT = 4096;
  const cloudOK = tgAtLeast('6.9') && !!TG.CloudStorage;
  const lsGet = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* quota / private mode */ } };
  const lsDel = (k) => { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } };
  const parse = (s) => { try { return s ? JSON.parse(s) : null; } catch (e) { return null; } };
  const cloud = (method, ...args) => new Promise((resolve, reject) => {
    TG.CloudStorage[method](...args, (err, res) => (err ? reject(err) : resolve(res)));
  });

  const Store = {
    data: {},
    dirty: new Set(parse(lsGet(LS_DIRTY)) || []),
    status: cloudOK ? 'cloud' : 'local',
    timer: 0,

    async init() {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(LS)) { const v = parse(localStorage.getItem(k)); if (v) this.data[k.slice(LS.length)] = v; }
        }
      } catch (e) { /* localStorage yo‘q */ }
      if (!cloudOK) return;
      try {
        const keys = await cloud('getKeys');
        const remote = new Set(keys);
        for (let i = 0; i < keys.length; i += 50) {
          const chunk = keys.slice(i, i + 50);
          const vals = await cloud('getItems', chunk);
          for (const k of chunk) {
            const v = parse(vals[k]);
            if (!v) continue;
            const mine = this.data[k];
            if (!mine || (v.u || 0) >= (mine.u || 0)) { this.data[k] = v; lsSet(LS + k, vals[k]); this.dirty.delete(k); }
            else this.dirty.add(k);
          }
        }
        // Bulutda yo‘q va yuborilmagan bo‘lmasa — boshqa qurilmada o‘chirilgan
        for (const k of Object.keys(this.data)) {
          if (!remote.has(k) && !this.dirty.has(k)) { delete this.data[k]; lsDel(LS + k); }
        }
        this.saveDirty();
        this.flush();
      } catch (e) {
        this.status = 'offline';
      }
    },
    get(k) { return this.data[k] || null; },
    keys(prefix) { return Object.keys(this.data).filter((k) => k.startsWith(prefix)); },
    set(k, v) {
      v.u = Date.now();
      this.data[k] = v;
      lsSet(LS + k, JSON.stringify(v));
      this.mark(k);
    },
    remove(k) {
      delete this.data[k];
      lsDel(LS + k);
      this.mark(k);
    },
    mark(k) {
      if (!cloudOK) return;
      this.dirty.add(k);
      this.saveDirty();
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.flush(), 700);
    },
    saveDirty() { lsSet(LS_DIRTY, JSON.stringify([...this.dirty])); },
    async flush() {
      if (!cloudOK || this.flushing) return;
      this.flushing = true;
      try {
        for (const k of [...this.dirty]) {
          const v = this.data[k];
          if (v) {
            const s = JSON.stringify(v);
            if (s.length > CLOUD_LIMIT) { this.dirty.delete(k); toast('Juda katta yozuv — faqat shu qurilmada saqlandi'); continue; }
            await cloud('setItem', k, s);
          } else {
            await cloud('removeItem', k);
          }
          this.dirty.delete(k);
        }
        this.status = 'cloud';
      } catch (e) {
        this.status = 'offline'; // keyinroq qayta urinamiz
      }
      this.flushing = false;
      this.saveDirty();
    },
  };
  setInterval(() => { if (Store.dirty.size) Store.flush(); }, 20000);

  // ---------------------------------------------------------------- domain
  const logKey = (iso) => 'l_' + iso.replace(/-/g, '');

  const D = {
    settings() { return Object.assign({ start: '', target: 120, restDef: 90 }, Store.get('s')); },
    saveSettings(patch) { const s = Object.assign(D.settings(), patch); delete s.u; Store.set('s', s); },
    day(i) {
      const v = Store.get('p_' + i);
      if (v) return v;
      const d = window.DEFAULT_PROGRAM[i];
      return { name: d.name, title: d.title, rest: !!d.rest, items: d.items.map(([e, s, r, t]) => ({ e, s, r, t })) };
    },
    saveDay(i, day) { Store.set('p_' + i, day); },
    isCustomDay(i) { return !!Store.get('p_' + i); },
    ex(id) {
      const base = window.DEFAULT_EXERCISES[id], ov = Store.get('x_' + id);
      if (!base && !ov) return null;
      const ex = Object.assign({ id, type: 'w', group: 'razminka', name: id }, base, ov);
      ex.custom = !base; ex.edited = !!(base && ov);
      return ex;
    },
    exIds() {
      const ids = new Set(Object.keys(window.DEFAULT_EXERCISES));
      Store.keys('x_').forEach((k) => ids.add(k.slice(2)));
      return [...ids];
    },
    log(iso) { return Store.get(logKey(iso)); },
    workouts() {
      return Store.keys('l_').map((k) => Store.get(k)).filter((l) => l && l.d && l.it && l.it.length)
        .sort((a, b) => (a.d < b.d ? 1 : -1));
    },
    allLogs() { return Store.keys('l_').map((k) => Store.get(k)).filter((l) => l && l.d).sort((a, b) => (a.d < b.d ? -1 : 1)); },
    active() { return Store.get('a'); },
  };

  const exName = (id) => { const e = D.ex(id); return e ? e.name : 'Noma’lum mashq'; };
  const unitOf = (ex) => (ex.type === 't' ? (ex.unit || 'daq') : '');

  // Mashq bo‘yicha tarix indeksi: id -> [{d, s}] (eskidan yangiga)
  let IDX = null;
  function index() {
    if (IDX) return IDX;
    IDX = {};
    for (const l of D.workouts().slice().reverse()) {
      for (const it of l.it) { if (!IDX[it.e]) IDX[it.e] = []; IDX[it.e].push({ d: l.d, s: it.s }); }
    }
    return IDX;
  }
  const invalidate = () => { IDX = null; };

  const e1rm = (w, r) => (r > 0 && w > 0 ? (r === 1 ? w : w * (1 + r / 30)) : 0);
  // Taraqqiyot ko‘rsatkichi: vazn → taxminiy 1RM (Epley), o‘z vazni → takror, vaqt → davomiylik
  function score(ex, sets) {
    let best = 0;
    for (const s of sets) {
      const v = ex.type === 'w' ? e1rm(s[0] || 0, s[1] || 0) : ex.type === 'bw' ? (s[1] || 0) : (s[0] || 0);
      if (v > best) best = v;
    }
    return best;
  }
  const scoreLabel = (ex) => (ex.type === 'w' ? 'taxminiy 1RM, kg' : ex.type === 'bw' ? 'eng ko‘p takror' : `eng uzoq, ${unitOf(ex)}`);
  function bestSet(ex, sets) {
    let best = null, bv = -1;
    for (const s of sets) {
      const v = ex.type === 'w' ? e1rm(s[0] || 0, s[1] || 0) : ex.type === 'bw' ? (s[1] || 0) * 1000 + (s[0] || 0) : (s[0] || 0);
      if (v > bv) { bv = v; best = s; }
    }
    return best;
  }
  function fmtSet(ex, s) {
    if (ex.type === 't') return `${fmt(s[0])} ${unitOf(ex)}`;
    if (ex.type === 'bw') return s[0] ? `+${fmt(s[0])}×${s[1]}` : `${s[1]}`;
    return `${fmt(s[0])}×${s[1]}`;
  }
  function logStats(l) {
    let sets = 0, vol = 0;
    for (const it of l.it || []) {
      const ex = D.ex(it.e) || { type: 'w' };
      if (ex.type === 't') continue;
      sets += it.s.length;
      for (const s of it.s) vol += (s[0] || 0) * (s[1] || 0);
    }
    return { sets, vol, dur: l.dur || (l.en && l.st ? l.en - l.st : 0) };
  }
  function estMinutes(day) {
    let sec = 0;
    for (const it of day.items) {
      const ex = D.ex(it.e);
      if (ex && ex.type === 't') sec += (num(it.r) || 0) * (ex.unit === 's' ? it.s : 60) + (it.s - 1) * (it.t || 0);
      else sec += it.s * (75 + (it.t || 0)); // ~40 s podxod + snaryad almashtirish
    }
    return Math.round(sec / 60 / 5) * 5;
  }

  // ---------------------------------------------------------------- UI state
  const ui = { tab: 'today', open: null, pickDay: null, libGroup: 'all', libQ: '', pickQ: '', pickGroup: 'all', pick: null, embed: null, histN: 15, heatSel: null };
  const sheets = [];

  function render() {
    document.querySelectorAll('#tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === ui.tab));
    const v = $('#view');
    v.innerHTML = ui.tab === 'today' ? viewToday() : ui.tab === 'program' ? viewProgram() : ui.tab === 'library' ? viewLibrary() : viewStats();
    afterRender(v);
    tick();
  }

  function openSheet(fn) { sheets.push(fn); drawSheet(true); }
  function closeSheet() { sheets.pop(); ui.embed = null; drawSheet(true); render(); }
  function drawSheet(fresh) {
    const wrap = $('#sheetWrap'), el = $('#sheet');
    if (!sheets.length) {
      wrap.hidden = true; document.body.classList.remove('locked');
      if (tgAtLeast('6.1')) TG.BackButton.hide();
      return;
    }
    const top = fresh ? 0 : el.scrollTop;
    el.innerHTML = sheets[sheets.length - 1]();
    wrap.hidden = false; document.body.classList.add('locked');
    el.scrollTop = top;
    afterRender(el);
    if (tgAtLeast('6.1')) TG.BackButton.show();
  }
  const sheetHead = (title, sub) => `<div class="sheet-head"><div style="flex:1;min-width:0">${sub ? `<div class="eyebrow">${sub}</div>` : ''}<h2>${title}</h2></div><button class="btn small" data-act="closeSheet">Yopish</button></div>`;

  // Grafiklar uchun hover/teginish ishlovchilarini ulash
  function afterRender(root) {
    root.querySelectorAll('.chart[data-pts]').forEach(bindChart);
  }

  // ---------------------------------------------------------------- TODAY
  function viewToday() {
    const a = D.active();
    if (a) return viewSession(a);
    const s = D.settings();
    const today = isoDate();
    const todayIdx = dayIdx();
    const di = ui.pickDay == null ? todayIdx : ui.pickDay;
    const day = D.day(di);
    const log = D.log(today);
    let h = `<header class="top"><div class="brand-row"><img class="brand" src="icon.svg" alt="Gym Control"><div><div class="eyebrow">${DAYS[todayIdx]}, ${dateShort(today)}</div><h1>Bugun</h1></div></div>
      <button class="icon-btn" data-act="settings" aria-label="Sozlamalar"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg></button></header>`;
    h += gymAgeCard(s);
    if (log && log.it && log.it.length) h += doneCard(log);
    h += planCard(di, day, todayIdx);
    h += dailyCard(today, log);
    return h;
  }

  function gymAge(start) {
    const from = parseDate(start), to = new Date();
    let y = to.getFullYear() - from.getFullYear(), m = to.getMonth() - from.getMonth(), d = to.getDate() - from.getDate();
    if (d < 0) { m--; d += new Date(to.getFullYear(), to.getMonth(), 0).getDate(); }
    if (m < 0) { y--; m += 12; }
    return { y, m, d };
  }

  function weekStrip() {
    const today = new Date();
    const mon = addDays(today, -dayIdx(today));
    let done = 0, planned = 0, cells = '';
    for (let i = 0; i < 7; i++) {
      const iso = isoDate(addDays(mon, i));
      const l = D.log(iso);
      const isDone = !!(l && l.it && l.it.length);
      const rest = D.day(i).rest;
      if (isDone) done++;
      if (!rest) planned++;
      const cls = [isDone ? 'done' : '', i === dayIdx(today) ? 'today' : '', rest && !isDone ? 'rest' : ''].join(' ');
      cells += `<div class="wd ${cls}">${DAYS_SHORT[i]}<div class="dot">${isDone ? '✓' : addDays(mon, i).getDate()}</div></div>`;
    }
    return { html: `<div class="week">${cells}</div>`, done, planned };
  }

  function gymAgeCard(s) {
    const wk = weekStrip();
    if (!s.start) {
      return `<section class="card"><h3>Zalga qachon boshlagansiz?</h3>
        <p class="sub">Necha yil, oy va kundan beri shug‘ullanayotganingizni hisoblab boramiz.</p>
        <div class="btn-row"><input class="in" type="date" id="startInput" max="${isoDate()}"><button class="btn primary" data-act="saveStart">Saqlash</button></div>
        ${wk.html}</section>`;
    }
    const a = gymAge(s.start);
    const total = D.workouts().length;
    return `<section class="card">
      <div class="hero"><div><div class="eyebrow">Zalda</div>
        <div class="hero-num">${a.y}<small>yil</small>${a.m}<small>oy</small>${a.d}<small>kun</small></div></div>
        <div style="text-align:right"><span class="pill accent">${a.y + 1}-yil</span><div class="sub" style="margin-top:6px">${total} mashg‘ulot</div></div></div>
      <div class="bar-lbl" style="margin-top:12px"><span>Bu hafta</span><span>${wk.done} / ${wk.planned}</span></div>
      ${wk.html}</section>`;
  }

  function doneCard(log) {
    const st = logStats(log);
    return `<section class="card"><div class="card-head"><div><div class="eyebrow">Bajarildi</div><h2>${esc(log.n || 'Mashg‘ulot')} ✓</h2></div><span class="pill ok">${durText(st.dur)}</span></div>
      <p class="sub">${st.sets} podxod · ${fmt(st.vol, 0)} kg umumiy hajm</p>
      <button class="btn small" data-act="openLog" data-d="${log.d}">Batafsil</button></section>`;
  }

  function planCard(di, day, todayIdx) {
    let h = `<section class="card"><div class="card-head"><div><div class="eyebrow">${DAYS[di]}${di !== todayIdx ? ' · tanlangan' : ' · reja'}</div>
      <h2>${esc(day.name)}</h2><div class="sub">${esc(day.title || '')}</div></div>
      ${day.items.length ? `<span class="pill">~${estMinutes(day)} daq</span>` : ''}</div>`;
    if (day.rest) h += `<p class="sub">Mushaklar dam olganda o‘sadi: 8+ soat uyqu, 30–40 daqiqa sayr, yengil cho‘zilish.</p>`;
    if (day.items.length) {
      h += `<ol class="plan">${day.items.map((it, j) => {
        const ex = D.ex(it.e) || { type: 'w' };
        return `<li data-act="video" data-id="${esc(it.e)}"><span class="n">${j + 1}</span><span class="nm">${esc(exName(it.e))}</span><span class="sr">${ex.type === 't' ? `${esc(it.r)} ${unitOf(ex)}` : `${it.s}×${esc(it.r)}`}</span>${ytId(ex.video) ? '<span class="play-mini" aria-hidden="true">▶</span>' : ''}</li>`;
      }).join('')}</ol>`;
      h += `<button class="btn primary block" data-act="start" data-p="${di}">${day.rest ? 'Boshlash' : 'Mashg‘ulotni boshlash'}</button>`;
    }
    h += `<div class="section-title" style="margin:16px 0 6px">Boshqa kunni tanlash</div><div class="chips">`;
    for (let i = 0; i < 7; i++) {
      const d = D.day(i);
      h += `<button class="chip ${i === di ? 'on' : ''}" data-act="pickDay" data-p="${i}">${DAYS_SHORT[i]} · ${esc(d.name)}</button>`;
    }
    return h + `</div></section>`;
  }

  function dailyCard(iso, log) {
    const m = (log && log.m) || {};
    const f = (k, label, ph, mode) => `<label class="metric">${label}<input class="in" data-ch="metric" data-k="${k}" inputmode="${mode}" placeholder="${ph}" value="${m[k] == null ? '' : esc(m[k])}"></label>`;
    return `<section class="card"><div class="card-head"><h3>Kunlik nazorat</h3><span class="sub">${dateShort(iso)}</span></div>
      <div class="metrics">${f('bw', 'Vazn', 'kg', 'decimal')}${f('sl', 'Uyqu', 'soat', 'decimal')}${f('wa', 'Suv', 'litr', 'decimal')}${f('pr', 'Oqsil', 'g', 'numeric')}</div></section>`;
  }

  // ---------------------------------------------------------------- SESSION
  function sessionCounts(a) {
    let total = 0, done = 0;
    for (const it of a.it) {
      const ex = D.ex(it.e) || { type: 'w' };
      if (ex.type === 't') continue;
      total += it.s.length; done += it.s.filter((s) => s[2]).length;
    }
    return { total, done };
  }
  const currentIdx = (a) => { const i = a.it.findIndex((it) => it.s.some((s) => !s[2])); return i < 0 ? null : i; };

  function viewSession(a) {
    const s = D.settings();
    const c = sessionCounts(a);
    const cur = currentIdx(a);
    const open = ui.open == null ? cur : ui.open;
    let h = `<div class="sess"><div class="sess-top"><div style="min-width:0"><div class="eyebrow">${esc(a.n)} · ${esc(a.ti || '')}</div>
        <div class="timer" id="sessTimer">${clock(Date.now() - a.st)}</div></div>
        <div class="timer-of">/ ${clock(s.target * 60000)}</div></div>
      <div class="bars">
        <div><div class="bar-lbl"><span>Vaqt</span><span id="sessPct"></span></div><div class="track"><i id="sessBar" style="width:0"></i></div></div>
        <div><div class="bar-lbl"><span>Podxodlar</span><span>${c.done} / ${c.total}</span></div><div class="track ok"><i style="width:${c.total ? (100 * c.done) / c.total : 0}%"></i></div></div>
      </div></div>`;
    a.it.forEach((it, i) => { h += exCard(a, it, i, i === open, i === cur); });
    h += `<div class="btn-row"><button class="btn" data-act="addToSession">+ Mashq qo‘shish</button></div>
      <button class="btn primary block" data-act="finish">Mashg‘ulotni yakunlash</button>
      <div style="text-align:center;margin-top:6px"><button class="btn danger small" data-act="cancelSession">Bekor qilish</button></div>`;
    return h;
  }

  function exCard(a, it, i, open, current) {
    const ex = D.ex(it.e) || { type: 'w', name: 'Noma’lum mashq', group: '' };
    const done = it.s.filter((s) => s[2]).length;
    const full = it.s.length > 0 && done === it.s.length;
    const unit = unitOf(ex);
    let h = `<div class="ex${open && !full ? ' current' : ''}">
      <button class="ex-head" data-act="toggleEx" data-i="${i}">
        <span class="n ${full ? 'ok' : ''}">${full ? '✓' : i + 1}</span>
        <span class="t"><b>${esc(ex.name)}</b><small>${ex.type === 't' ? `${esc(it.r)} ${unit}` : `${it.s.length}×${esc(it.r)}`} · dam ${restText(it.t)}</small></span>
        <span class="cnt">${done}/${it.s.length}</span></button>`;
    if (!open) return h + '</div>';

    const hist = index()[it.e];
    const last = hist && hist[hist.length - 1];
    h += `<div class="ex-body">`;
    if (ex.cue) h += `<p class="ex-cue">${esc(ex.cue)}</p>`;
    if (last) {
      h += `<div class="last">O‘tgan safar <span class="muted">(${dateShort(last.d)})</span>: <b class="num-tab">${last.s.map((s) => fmtSet(ex, s)).join(' · ')}</b></div>`;
      const top = repsHigh(it.r);
      if (ex.type === 'w' && top && last.s.length >= it.s.length && last.s.every((s) => s[1] >= top)) {
        h += `<div class="hint-up">↑ O‘tgan safar barcha podxodda ${top} ta — bugun vaznni oshiring (+2,5 kg)</div>`;
      }
    }
    const isT = ex.type === 't';
    h += `<div class="sets ${isT ? 't' : ''}"><span class="h">#</span>`;
    h += isT ? `<span class="h">${unit === 's' ? 'soniya' : 'daqiqa'}</span>` : `<span class="h">${ex.type === 'bw' ? '+kg' : 'kg'}</span><span class="h">takror</span>`;
    h += `<span class="h"></span>`;
    it.s.forEach((s, j) => {
      const prev = last && (last.s[j] || last.s[last.s.length - 1]);
      const repPh = prev && !isT ? prev[1] : esc(it.r);
      const wPh = isT ? esc(it.r) : prev ? fmt(prev[0]).replace(' ', '') : (ex.type === 'bw' ? '0' : 'kg');
      h += `<span class="i ${s[2] ? 'done-row' : ''}">${j + 1}</span>`;
      h += `<input class="in" data-in="set" data-i="${i}" data-j="${j}" data-f="0" inputmode="decimal" placeholder="${wPh}" value="${esc(s[0])}">`;
      if (!isT) h += `<input class="in" data-in="set" data-i="${i}" data-j="${j}" data-f="1" inputmode="numeric" placeholder="${repPh}" value="${esc(s[1])}">`;
      h += `<button class="tick ${s[2] ? 'on' : ''}" data-act="tick" data-i="${i}" data-j="${j}" aria-label="Bajarildi"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></button>`;
    });
    h += `</div><div class="ex-tools">
      <button class="btn small" data-act="video" data-id="${esc(it.e)}">▶ Texnika</button>
      <button class="btn small" data-act="addSet" data-i="${i}">+ podxod</button>
      <button class="btn small" data-act="rmSet" data-i="${i}" ${it.s.length <= 1 ? 'disabled' : ''}>− podxod</button>
      ${i > 0 ? `<button class="btn small sq" data-act="mvEx" data-i="${i}" aria-label="Yuqoriga">↑</button>` : ''}
      </div></div></div>`;
    return h;
  }

  function startSession(p) {
    const day = D.day(p);
    const idx = index();
    const a = {
      d: isoDate(), p, n: day.name, ti: day.title, st: Date.now(),
      it: day.items.map((x) => newSessionItem(x.e, x.s, x.r, x.t, idx)),
    };
    Store.set('a', a);
    ui.open = null; ui.pickDay = null;
    sessionOn();
    haptic.ok();
    render();
    window.scrollTo(0, 0);
  }
  function newSessionItem(e, sets, r, t, idx) {
    const ex = D.ex(e) || { type: 'w' };
    const hist = (idx || index())[e];
    const last = hist && hist[hist.length - 1];
    const s = [];
    for (let j = 0; j < sets; j++) {
      const prev = last && (last.s[j] || last.s[last.s.length - 1]);
      // Vazn o‘tgan safardan oldindan to‘ldiriladi; takror bo‘sh qoladi (placeholder ko‘rsatadi)
      if (ex.type === 't') s.push([prev ? String(prev[0]) : String(num(r) || ''), '', 0]);
      else s.push([prev && prev[0] ? String(prev[0]) : '', '', 0]);
    }
    return { e, r, t, s };
  }

  function saveActive(a) { Store.set('a', a); }

  let wakeLock = null;
  async function sessionOn() {
    if (tgAtLeast('6.2')) TG.enableClosingConfirmation();
    try { if (navigator.wakeLock && !wakeLock) wakeLock = await navigator.wakeLock.request('screen'); } catch (e) { /* not allowed */ }
  }
  function sessionOff() {
    if (tgAtLeast('6.2')) TG.disableClosingConfirmation();
    try { if (wakeLock) wakeLock.release(); } catch (e) { /* ignore */ }
    wakeLock = null;
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      wakeLock = null;
      if (D.active()) sessionOn();
      tick();
    }
  });

  async function finishSession() {
    const a = D.active();
    if (!a) return;
    const items = [];
    for (const it of a.it) {
      const ex = D.ex(it.e) || { type: 'w' };
      const sets = it.s.filter((s) => s[2]).map((s) => (ex.type === 't' ? [num(s[0]) || 0] : [num(s[0]) || 0, num(s[1]) || 0]));
      if (sets.length) items.push({ e: it.e, s: sets });
    }
    if (!items.length) {
      if (await confirmBox('Hech bir podxod belgilanmagan. Mashg‘ulot bekor qilinsinmi?')) { Store.remove('a'); endSession(); }
      return;
    }
    if (a.it.some((it) => it.s.some((s) => !s[2])) && !(await confirmBox('Ba’zi podxodlar belgilanmagan. Baribir yakunlaysizmi?'))) return;

    // Rekordlar — saqlashdan oldingi tarix bilan solishtiramiz
    const idx = index();
    const prs = [];
    for (const it of items) {
      const ex = D.ex(it.e);
      if (!ex || ex.type === 't' || !idx[it.e]) continue;
      const prevBest = Math.max(...idx[it.e].map((h) => score(ex, h.s)));
      if (score(ex, it.s) > prevBest + 1e-9) { prs.push(it.e); it.pr = 1; }
    }
    // Yakunlash unutilgan bo‘lsa (oxirgi podxoddan 30+ daqiqa o‘tgan), vaqtni oxirgi podxodda to‘xtatamiz
    const now = Date.now();
    const end = a.lt && now - a.lt > 30 * 60000 ? a.lt + 60000 : now;
    const key = logKey(a.d);
    const old = Store.get(key) || {};
    const log = Object.assign({}, old, {
      d: a.d, p: a.p, n: a.n, ti: a.ti,
      st: old.st || a.st, en: end, dur: (old.dur || 0) + (end - a.st),
      it: (old.it || []).concat(items),
    });
    delete log.u;
    Store.set(key, log);
    Store.remove('a');
    endSession();
    haptic.ok();
    openSheet(() => summarySheet(log, prs));
  }
  function endSession() { invalidate(); stopRest(); sessionOff(); ui.open = null; render(); }

  function summarySheet(log, prs) {
    const st = logStats(log);
    return `${sheetHead('Barakalla! 💪', dateLong(log.d))}
      <div class="kpis"><div class="kpi"><div class="label">Davomiylik</div><div class="value">${durText(st.dur)}</div></div>
        <div class="kpi"><div class="label">Podxodlar</div><div class="value">${st.sets}</div></div>
        <div class="kpi"><div class="label">Umumiy hajm</div><div class="value">${fmt(st.vol, 0)} <small class="muted">kg</small></div></div>
        <div class="kpi"><div class="label">Yangi rekordlar</div><div class="value">${prs.length}</div></div></div>
      ${prs.length ? `<section class="card"><h3>🏆 Rekordlar</h3>${prs.map((e) => `<div class="sub" style="margin-top:6px">${esc(exName(e))}</div>`).join('')}</section>` : ''}
      ${logBody(log)}`;
  }

  // ---------------------------------------------------------------- rest timer
  let rest = null;
  function startRest(sec, label) {
    if (!sec) return;
    rest = { end: Date.now() + sec * 1000, total: sec * 1000, fired: false };
    $('#restLabel').textContent = label || 'Dam olish';
    $('#restbar').classList.remove('done');
    $('#restbar').hidden = false;
    document.body.classList.add('resting');
    tick();
  }
  function stopRest() {
    rest = null;
    $('#restbar').hidden = true;
    document.body.classList.remove('resting');
  }

  function tick() {
    const a = D.active();
    const t = $('#sessTimer');
    if (a && t) {
      const el = Date.now() - a.st, target = D.settings().target * 60000;
      t.textContent = clock(el);
      const pct = Math.min(100, (100 * el) / target);
      $('#sessBar').style.width = pct + '%';
      $('#sessPct').textContent = Math.round((100 * el) / target) + '%';
    }
    if (rest) {
      const left = rest.end - Date.now();
      $('#restTime').textContent = left > 0 ? clock(left + 999) : 'Tayyor!';
      $('#restFill').style.width = Math.max(0, Math.min(100, (100 * (rest.total - left)) / rest.total)) + '%';
      if (left <= 0 && !rest.fired) {
        rest.fired = true;
        $('#restbar').classList.add('done');
        $('#restLabel').textContent = 'Keyingi podxod';
        haptic.ok(); beep();
        const mine = rest;
        setTimeout(() => { if (rest === mine) stopRest(); }, 5000);
      }
    }
  }
  setInterval(tick, 500);

  // ---------------------------------------------------------------- PROGRAM
  function viewProgram() {
    const today = dayIdx();
    let h = `<header class="top"><div><div class="eyebrow">Haftalik reja</div><h1>Dastur</h1></div></header>
      <p class="sub" style="margin:0 6px 12px">Push / Pull / Legs × 2 — har mushak haftasiga 2 marta. Har kuni ~2 soat: razminka, asosiy mashqlar, press, kardio. Kunni bosib mashqlar, podxod va dam olish vaqtini o‘zgartiring.</p>
      <section class="card flush">`;
    for (let i = 0; i < 7; i++) {
      const d = D.day(i);
      const sets = d.items.reduce((n, it) => n + ((D.ex(it.e) || {}).type === 't' ? 0 : it.s), 0);
      h += `<button class="row" data-act="editDay" data-p="${i}"><span class="badge-day ${i === today ? 'today' : ''} ${d.rest ? 'rest' : ''}">${DAYS_SHORT[i]}</span>
        <span class="grow"><div class="title">${esc(d.name)}${D.isCustomDay(i) ? ' <span class="pill" style="font-size:11px">o‘zgartirilgan</span>' : ''}</div>
        <div class="sub">${d.rest ? esc(d.title || 'Dam olish') : `${esc(d.title || '')} · ${d.items.length} mashq · ${sets} podxod · ~${estMinutes(d)} daq`}</div></span><span class="chev">›</span></button>`;
    }
    h += `</section>
      <div class="section-title">Progressiya qoidasi</div>
      <section class="card"><p style="margin:0">Har mashqda takror oralig‘i bor (masalan <b>6–8</b>). Barcha podxodlarda yuqori chegaraga (8) yetsangiz — keyingi safar vaznni <b>+2,5 kg</b> oshiring va yana pastdan (6) boshlang. Ilova buni o‘zi eslatib turadi.</p></section>`;
    return h;
  }

  function dayEditor(i) {
    const d = D.day(i);
    let h = sheetHead(esc(d.name), DAYS[i]);
    h += `<label class="field"><span>Nomi</span><input class="in" data-ch="dayField" data-p="${i}" data-f="name" value="${esc(d.name)}"></label>
      <label class="field"><span>Mushak guruhlari</span><input class="in" data-ch="dayField" data-p="${i}" data-f="title" value="${esc(d.title || '')}"></label>
      <label class="check"><input type="checkbox" data-ch="dayRest" data-p="${i}" ${d.rest ? 'checked' : ''}> Dam olish kuni</label>
      <div class="section-title">Mashqlar ketma-ketligi · ~${estMinutes(d)} daq</div>`;
    d.items.forEach((it, j) => {
      const ex = D.ex(it.e) || { type: 'w' };
      h += `<div class="edit-item"><div class="edit-top"><span class="n">${j + 1}</span><b>${esc(exName(it.e))}</b>
          <button class="mini" data-act="mvItem" data-p="${i}" data-j="${j}" data-d="-1" ${j === 0 ? 'disabled' : ''}>↑</button>
          <button class="mini" data-act="mvItem" data-p="${i}" data-j="${j}" data-d="1" ${j === d.items.length - 1 ? 'disabled' : ''}>↓</button>
          <button class="mini x" data-act="rmItem" data-p="${i}" data-j="${j}">✕</button></div>
        <div class="edit-fields">
          <label>Podxod<input class="in" data-ch="itemField" data-p="${i}" data-j="${j}" data-f="s" inputmode="numeric" value="${it.s}"></label>
          <label>${ex.type === 't' ? (unitOf(ex) === 's' ? 'Soniya' : 'Daqiqa') : 'Takror'}<input class="in" data-ch="itemField" data-p="${i}" data-j="${j}" data-f="r" value="${esc(it.r)}"></label>
          <label>Dam (s)<input class="in" data-ch="itemField" data-p="${i}" data-j="${j}" data-f="t" inputmode="numeric" value="${it.t || 0}"></label>
        </div></div>`;
    });
    h += `<button class="btn primary block" data-act="addItem" data-p="${i}">+ Mashq qo‘shish</button>`;
    if (D.isCustomDay(i)) h += `<div style="text-align:center;margin-top:10px"><button class="btn danger small" data-act="resetDay" data-p="${i}">Standart dasturga qaytarish</button></div>`;
    return h;
  }

  function pickerSheet() {
    return `${sheetHead('Mashq tanlash')}
      <input class="in" data-in="pickQ" placeholder="Qidirish…" value="${esc(ui.pickQ)}">
      <div class="chips" style="margin-top:10px">${groupChips(ui.pickGroup, 'pickGroup')}</div>
      <div id="pickList">${pickList()}</div>
      <button class="btn block" data-act="newEx">+ Yangi mashq yaratish</button>`;
  }
  function pickList() {
    const ids = filterEx(ui.pickQ, ui.pickGroup);
    if (!ids.length) return '<div class="empty">Topilmadi</div>';
    return `<section class="card flush" style="margin-top:10px">${ids.map((id) => {
      const ex = D.ex(id);
      return `<button class="row" data-act="pickEx" data-id="${esc(id)}"><span class="grow"><div class="title">${esc(ex.name)}</div><div class="sub">${GROUP_NAME[ex.group] || ''}</div></span><span class="chev">+</span></button>`;
    }).join('')}</section>`;
  }
  function groupChips(sel, act) {
    return [['all', 'Hammasi'], ...window.GROUPS].map(([k, n]) => `<button class="chip ${sel === k ? 'on' : ''}" data-act="${act}" data-g="${k}">${n}</button>`).join('');
  }
  function filterEx(q, g) {
    const ql = q.trim().toLowerCase();
    const order = window.GROUPS.map((x) => x[0]);
    return D.exIds().map((id) => D.ex(id))
      .filter((ex) => (g === 'all' || ex.group === g) && (!ql || ex.name.toLowerCase().includes(ql) || (ex.en || '').includes(ql) || (ex.ru || '').includes(ql)))
      .sort((a, b) => order.indexOf(a.group) - order.indexOf(b.group) || a.name.localeCompare(b.name))
      .map((ex) => ex.id);
  }

  // ---------------------------------------------------------------- LIBRARY
  function viewLibrary() {
    return `<header class="top"><div><div class="eyebrow">Texnika va videolar</div><h1>Mashqlar</h1></div>
        <button class="btn small primary" data-act="newEx">+ Yangi</button></header>
      <input class="in" data-in="libQ" placeholder="Qidirish: jim, squat, тяга…" value="${esc(ui.libQ)}" style="background:var(--card)">
      <div class="chips" style="margin:10px 0">${groupChips(ui.libGroup, 'libGroup')}</div>
      <div id="libList">${libList()}</div>`;
  }
  function libList() {
    const ids = filterEx(ui.libQ, ui.libGroup);
    if (!ids.length) return '<div class="empty">Topilmadi</div>';
    const idx = index();
    let h = '', g = null;
    for (const id of ids) {
      const ex = D.ex(id);
      if (ex.group !== g) { if (g !== null) h += '</section>'; g = ex.group; h += `<div class="section-title">${GROUP_NAME[g] || g}</div><section class="card flush">`; }
      const hist = idx[id];
      const meta = hist ? `${hist.length} marta · oxirgi ${dateShort(hist[hist.length - 1].d)}` : (ex.cue || '');
      const vid = ytId(ex.video);
      h += `<button class="row" data-act="openEx" data-id="${esc(id)}">${vid ? `<img class="thumb-sm" loading="lazy" src="${ytThumb(vid)}" alt="">` : '<span class="thumb-sm"></span>'}
        <span class="grow"><div class="title">${esc(ex.name)}${ex.custom ? ' <span class="pill" style="font-size:11px">shaxsiy</span>' : ''}</div><div class="sub">${esc(meta)}</div></span>
        <span class="chev">›</span></button>`;
    }
    return h + '</section>';
  }

  const ytId = (url) => {
    const m = String(url || '').match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/))([\w-]{11})/);
    return m ? m[1] : null;
  };
  const ytSearch = (q) => 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q);
  const ytThumb = (vid) => `https://i.ytimg.com/vi/${vid}/mqdefault.jpg`;
  // Muqova (bosilganda shu joyda pleyer ochiladi). key — qaysi pleyer ochiqligini ajratadi.
  function videoThumb(ex, key, big) {
    const vid = ytId(ex.video);
    if (!vid) return '';
    if (ui.embed === key) {
      return `<div class="video-box"><iframe src="https://www.youtube-nocookie.com/embed/${vid}?rel=0&playsinline=1&autoplay=1" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>`;
    }
    return `<button class="thumb${big ? ' big' : ''}" data-act="embed" data-k="${esc(key)}" style="background-image:url('${ytThumb(vid)}')" aria-label="Videoni ko‘rish: ${esc(ex.name)}"><span class="play"></span></button>`;
  }

  function dayView(i) {
    const d = D.day(i);
    let h = sheetHead(esc(d.name), DAYS[i]);
    h += `<p class="sub" style="margin:-6px 2px 12px">${esc(d.title || '')}${d.items.length ? ` · ~${estMinutes(d)} daq` : ''}</p>
      <div class="btn-row" style="margin:0 0 12px">
        ${!D.active() && d.items.length ? `<button class="btn primary" data-act="startFromDay" data-p="${i}">▶ Boshlash</button>` : ''}
        <button class="btn" data-act="editDayItems" data-p="${i}">✎ Tahrirlash</button></div>`;
    if (d.rest) h += `<section class="card"><p style="margin:0">Dam olish kuni: 30–40 daqiqa sayr, cho‘zilish, 8+ soat uyqu.</p></section>`;
    d.items.forEach((it, j) => {
      const ex = D.ex(it.e) || { type: 'w', name: 'Noma’lum mashq' };
      const key = `d${i}-${j}`;
      const hasVid = !!ytId(ex.video);
      h += `<section class="card vid-card${!hasVid ? ' no-vid' : ui.embed === key ? ' playing' : ''}">${videoThumb(ex, key)}
        <div><div class="vid-title"><span class="n">${j + 1}</span><b>${esc(ex.name)}</b></div>
          <div class="sub">${ex.type === 't' ? `${esc(it.r)} ${unitOf(ex)}` : `${it.s}×${esc(it.r)} · dam ${restText(it.t)}`}</div>
          ${ex.cue ? `<p class="ex-cue" style="margin:6px 0 0">${esc(ex.cue)}</p>` : ''}</div></section>`;
    });
    return h;
  }

  function exSheet(id) {
    const ex = D.ex(id);
    if (!ex) return sheetHead('Topilmadi');
    const hist = index()[id] || [];
    let h = sheetHead(esc(ex.name), GROUP_NAME[ex.group] || '');
    if (ex.cue) h += `<section class="card"><div class="eyebrow">Texnika</div><p style="margin-bottom:0">${esc(ex.cue)}</p></section>`;

    h += `<section class="card"><div class="eyebrow" style="margin-bottom:8px">Video</div>`;
    if (ytId(ex.video)) h += videoThumb(ex, id, true);
    else if (ex.video) h += `<button class="btn primary block" data-act="playVideo" data-id="${esc(id)}">▶ Videoni ochish</button>`;
    h += `<div class="sub" style="margin-top:10px">Boshqa videolar — YouTube’da qidirish:</div><div class="yt-row">
        <button class="btn small" data-act="ytSearch" data-q="${esc((ex.en || ex.name) + ' proper form')}">▶ Inglizcha</button>
        <button class="btn small" data-act="ytSearch" data-q="${esc(ex.ru || ex.name)}">▶ Ruscha</button>
        <button class="btn small" data-act="ytSearch" data-q="${esc(ex.name + ' texnikasi')}">▶ O‘zbekcha</button></div>
      <label class="field"><span>Video havolasi — o‘zingiz yoqtirganiga almashtiring</span><input class="in" data-ch="exField" data-id="${esc(id)}" data-f="video" placeholder="https://youtu.be/…" value="${esc(ex.video || '')}"></label></section>`;

    // Taraqqiyot
    if (hist.length) {
      const pts = hist.map((x) => ({ d: x.d, v: score(ex, x.s) }));
      const bestIdx = pts.reduce((bi, p, k) => (p.v > pts[bi].v ? k : bi), 0);
      const bs = bestSet(ex, hist[bestIdx].s);
      h += `<section class="card"><div class="card-head"><div><div class="eyebrow">Taraqqiyot · ${scoreLabel(ex)}</div>
          <h3 style="margin-top:4px">Rekord: ${fmtSet(ex, bs)} <span class="muted small">· ${dateShort(hist[bestIdx].d)}</span></h3></div></div>
        ${pts.length >= 2 ? lineChart(pts, ex.type === 'w' ? 'kg' : unitOf(ex) || 'ta') : '<p class="sub">Grafik uchun kamida 2 ta mashg‘ulot kerak.</p>'}</section>
        <div class="section-title">Oxirgi mashg‘ulotlar</div><section class="card">${hist.slice(-6).reverse().map((x) => `<div class="log-ex"><b>${dateLong(x.d)}</b><div class="sets-txt">${x.s.map((s) => fmtSet(ex, s)).join(' · ')}</div></div>`).join('')}</section>`;
    }

    // Tahrirlash
    h += `<div class="section-title">Sozlash</div><section class="card">
      <label class="field" style="margin-top:0"><span>Nomi</span><input class="in" data-ch="exField" data-id="${esc(id)}" data-f="name" value="${esc(ex.name)}"></label>
      <label class="field"><span>Texnika eslatmasi</span><textarea class="in" data-ch="exField" data-id="${esc(id)}" data-f="cue">${esc(ex.cue || '')}</textarea></label>`;
    if (ex.custom) {
      h += `<label class="field"><span>Guruh</span><select class="in" data-ch="exField" data-id="${esc(id)}" data-f="group">${window.GROUPS.map(([k, n]) => `<option value="${k}" ${ex.group === k ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
        <label class="field"><span>Turi</span><select class="in" data-ch="exField" data-id="${esc(id)}" data-f="type">
          <option value="w" ${ex.type === 'w' ? 'selected' : ''}>Vazn × takror</option>
          <option value="bw" ${ex.type === 'bw' ? 'selected' : ''}>O‘z vazni (+kg) × takror</option>
          <option value="t" ${ex.type === 't' ? 'selected' : ''}>Vaqt (daqiqa)</option></select></label>
        <div style="text-align:center;margin-top:12px"><button class="btn danger small" data-act="delEx" data-id="${esc(id)}">Mashqni o‘chirish</button></div>`;
    } else if (ex.edited) {
      h += `<div style="text-align:center;margin-top:12px"><button class="btn danger small" data-act="resetEx" data-id="${esc(id)}">Asl holiga qaytarish</button></div>`;
    }
    return h + '</section>';
  }

  // ---------------------------------------------------------------- STATS
  function viewStats() {
    const s = D.settings();
    const ws = D.workouts();
    const now = new Date();
    const y = String(now.getFullYear()), mo = isoDate(now).slice(0, 7);
    const yearN = ws.filter((l) => l.d.startsWith(y)).length;
    const monthN = ws.filter((l) => l.d.startsWith(mo)).length;
    const durs = ws.slice(0, 20).map((l) => logStats(l).dur).filter(Boolean);
    const avg = durs.length ? durs.reduce((a, b) => a + b, 0) / durs.length : 0;
    const totalH = ws.reduce((a, l) => a + logStats(l).dur, 0) / 3600000;
    const age = s.start ? gymAge(s.start) : null;

    let h = `<header class="top"><div><div class="eyebrow">${age ? `${age.y + 1}-yil zalda` : 'Statistika'}</div><h1>Natijalar</h1></div>
      <button class="icon-btn" data-act="settings" aria-label="Sozlamalar"><svg viewBox="0 0 24 24"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg></button></header>
      <div class="kpis">
        <div class="kpi"><div class="label">Bu yil</div><div class="value">${yearN}</div><div class="delta">mashg‘ulot</div></div>
        <div class="kpi"><div class="label">Bu oy</div><div class="value">${monthN}</div><div class="delta">mashg‘ulot</div></div>
        <div class="kpi"><div class="label">O‘rtacha davomiylik</div><div class="value">${avg ? durText(avg) : '–'}</div><div class="delta">oxirgi 20 ta</div></div>
        <div class="kpi"><div class="label">Jami zalda</div><div class="value">${fmt(totalH, 0)} <small class="muted">soat</small></div><div class="delta">ilovada yozilgan</div></div>
      </div>`;

    h += heatmap();

    // Tana vazni
    const bw = D.allLogs().filter((l) => l.m && num(l.m.bw)).map((l) => ({ d: l.d, v: num(l.m.bw) }));
    if (bw.length) {
      const lastV = bw[bw.length - 1];
      const monthAgo = isoDate(addDays(now, -30));
      const base = bw.find((p) => p.d >= monthAgo);
      const delta = base && base !== lastV ? lastV.v - base.v : null;
      h += `<section class="card"><div class="card-head"><div><div class="eyebrow">Tana vazni</div><h2 style="margin-top:2px">${fmt(lastV.v)} kg</h2></div>
        ${delta != null ? `<span class="pill">${delta > 0 ? '+' : ''}${fmt(delta)} kg · 30 kun</span>` : ''}</div>
        ${bw.length >= 2 ? lineChart(bw.slice(-60), 'kg') : '<p class="sub">«Bugun» bo‘limida har kuni vazningizni yozing — grafik shu yerda chiqadi.</p>'}</section>`;
    }

    // Rekordlar
    const idx = index();
    const prs = Object.keys(idx).map((id) => {
      const ex = D.ex(id);
      if (!ex || ex.type === 't') return null;
      let best = null, bd = null, bv = -1;
      for (const x of idx[id]) { const v = score(ex, x.s); if (v > bv) { bv = v; bd = x.d; best = bestSet(ex, x.s); } }
      return { id, ex, best, d: bd };
    }).filter(Boolean).sort((a, b) => (a.d < b.d ? 1 : -1));
    if (prs.length) {
      h += `<div class="section-title">Shaxsiy rekordlar</div><section class="card flush">${prs.slice(0, 12).map((p) => `
        <button class="row" data-act="openEx" data-id="${esc(p.id)}"><span class="grow"><div class="title">${esc(p.ex.name)}</div><div class="sub">${dateShort(p.d)}</div></span>
        <b class="num-tab">${fmtSet(p.ex, p.best)}</b><span class="chev">›</span></button>`).join('')}</section>`;
    }

    // Tarix
    h += `<div class="section-title">Tarix</div>`;
    if (!ws.length) h += `<section class="card"><div class="empty">Hali mashg‘ulot yo‘q. «Bugun» bo‘limidan birinchisini boshlang 💪</div></section>`;
    else {
      h += `<section class="card flush">${ws.slice(0, ui.histN).map((l) => {
        const st = logStats(l);
        return `<button class="row" data-act="openLog" data-d="${l.d}"><span class="badge-day">${DAYS_SHORT[dayIdx(parseDate(l.d))]}</span>
          <span class="grow"><div class="title">${esc(l.n || 'Mashg‘ulot')} <span class="muted small">· ${dateShort(l.d)}</span></div>
          <div class="sub">${durText(st.dur)} · ${st.sets} podxod · ${fmt(st.vol, 0)} kg${l.it.some((it) => it.pr) ? ' · 🏆' : ''}</div></span><span class="chev">›</span></button>`;
      }).join('')}</section>`;
      if (ws.length > ui.histN) h += `<button class="btn block" data-act="moreHist">Ko‘proq ko‘rsatish</button>`;
    }
    return h;
  }

  function heatmap() {
    const weeks = 20;
    const today = new Date();
    const start = addDays(today, -dayIdx(today) - (weeks - 1) * 7);
    let cells = '', n = 0;
    for (let k = 0; k < weeks * 7; k++) {
      const d = addDays(start, k), iso = isoDate(d);
      if (d > today) { cells += '<i class="fut"></i>'; continue; }
      const l = D.log(iso);
      const sets = l && l.it && l.it.length ? logStats(l).sets : 0;
      if (sets) n++;
      const lv = !sets ? '' : sets < 15 ? 'l1' : sets < 25 ? 'l2' : 'l3';
      cells += `<i class="${lv} ${ui.heatSel === iso ? 'sel' : ''}" data-act="heat" data-d="${iso}" title="${dateShort(iso)}: ${sets} podxod"></i>`;
    }
    let read = 'Katakni bosing';
    if (ui.heatSel) {
      const l = D.log(ui.heatSel);
      read = l && l.it && l.it.length ? `${dateLong(ui.heatSel)} — ${esc(l.n)}, ${logStats(l).sets} podxod, ${durText(logStats(l).dur)}` : `${dateLong(ui.heatSel)} — mashg‘ulot yo‘q`;
    }
    return `<section class="card"><div class="card-head"><div><div class="eyebrow">Oxirgi ${weeks} hafta</div><h3 style="margin-top:2px">${n} mashg‘ulot</h3></div></div>
      <div class="heat">${cells}</div><div class="heat-read" id="heatRead">${read}</div>
      <div class="heat-legend">kam <i></i><i class="l1"></i><i class="l2"></i><i class="l3"></i> ko‘p podxod</div></section>`;
  }

  function logBody(l) {
    return `<section class="card">${l.it.map((it) => {
      const ex = D.ex(it.e) || { type: 'w', name: 'Noma’lum mashq' };
      return `<div class="log-ex"><b>${esc(ex.name)}</b>${it.pr ? '<span class="pr">🏆 REKORD</span>' : ''}<div class="sets-txt">${it.s.map((s) => fmtSet(ex, s)).join(' · ')}</div></div>`;
    }).join('')}</section>`;
  }
  function logSheet(iso) {
    const l = D.log(iso);
    if (!l || !l.it) return sheetHead('Topilmadi');
    const st = logStats(l);
    const m = l.m || {};
    const mt = [m.bw && `vazn ${esc(m.bw)} kg`, m.sl && `uyqu ${esc(m.sl)} soat`, m.wa && `suv ${esc(m.wa)} l`, m.pr && `oqsil ${esc(m.pr)} g`].filter(Boolean).join(' · ');
    return `${sheetHead(esc(l.n || 'Mashg‘ulot'), dateLong(l.d))}
      <div class="kpis"><div class="kpi"><div class="label">Davomiylik</div><div class="value">${durText(st.dur)}</div></div>
      <div class="kpi"><div class="label">Hajm</div><div class="value">${fmt(st.vol, 0)} <small class="muted">kg</small></div><div class="delta">${st.sets} podxod</div></div></div>
      ${mt ? `<p class="sub" style="margin:0 4px 10px">${mt}</p>` : ''}
      ${logBody(l)}
      <div style="text-align:center;margin-top:12px"><button class="btn danger small" data-act="delLog" data-d="${l.d}">Mashg‘ulotni o‘chirish</button></div>`;
  }

  function settingsSheet() {
    const s = D.settings();
    const nKeys = Object.keys(Store.data).length;
    const st = Store.status === 'cloud' ? `Telegram bulutida ✓ (${nKeys} / 1024 yozuv)` : Store.status === 'offline' ? 'Internet yo‘q — shu qurilmada saqlanmoqda, keyin sinxronlanadi' : 'Faqat shu brauzerda (Telegram tashqarisida ochilgan)';
    return `${sheetHead('Sozlamalar')}
      <section class="card">
        <label class="field" style="margin-top:0"><span>Zalga boshlagan sana</span><input class="in" type="date" data-ch="setting" data-f="start" max="${isoDate()}" value="${esc(s.start)}"></label>
        <label class="field"><span>Mashg‘ulot maqsadi (daqiqa)</span><input class="in" data-ch="setting" data-f="target" inputmode="numeric" value="${s.target}"></label>
        <label class="field"><span>Yangi mashq uchun dam olish (soniya)</span><input class="in" data-ch="setting" data-f="restDef" inputmode="numeric" value="${s.restDef}"></label>
      </section>
      <section class="card"><div class="eyebrow">Saqlash</div><p>${st}</p>${nKeys > 900 ? '<p style="color:var(--danger)">Bulut limitiga yaqinlashdingiz — zaxira nusxa oling.</p>' : ''}
        <div class="btn-row"><button class="btn small" data-act="export">Zaxira nusxa</button><button class="btn small" data-act="import">Tiklash</button></div>
        <textarea class="in" id="backup" hidden style="margin-top:10px"></textarea>
        <button class="btn small primary" id="importGo" data-act="importGo" hidden style="margin-top:8px">Ma’lumotni tiklash</button></section>`;
  }

  // ---------------------------------------------------------------- chart
  // Bitta qatorli chiziqli grafik: 2px chiziq, 10% maydon, oxirgi nuqtada qiymat, teginishda kursor + tooltip.
  function lineChart(pts, unit) {
    const W = 340, H = 150, L = 34, R = 40, T = 12, B = 22;
    const vs = pts.map((p) => p.v);
    let lo = Math.min(...vs), hi = Math.max(...vs);
    const padV = (hi - lo) * 0.15 || Math.max(1, hi * 0.05);
    lo = Math.max(0, lo - padV); hi += padV;
    const step = niceStep((hi - lo) / 3);
    lo = Math.floor(lo / step) * step; hi = Math.ceil(hi / step) * step;
    const t0 = parseDate(pts[0].d).getTime(), t1 = parseDate(pts[pts.length - 1].d).getTime();
    const x = (d) => L + ((parseDate(d).getTime() - t0) / Math.max(1, t1 - t0)) * (W - L - R);
    const y = (v) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
    let g = '';
    for (let v = lo; v <= hi + 1e-9; v += step) g += `<line class="grid" x1="${L}" x2="${W - R + 8}" y1="${y(v)}" y2="${y(v)}"/><text class="axis" x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${fmt(v, step < 1 ? 1 : 0)}</text>`;
    const line = pts.map((p, k) => `${k ? 'L' : 'M'}${x(p.d).toFixed(1)},${y(p.v).toFixed(1)}`).join('');
    const area = `${line}L${x(pts[pts.length - 1].d).toFixed(1)},${H - B}L${x(pts[0].d).toFixed(1)},${H - B}Z`;
    const last = pts[pts.length - 1];
    const xl = `<text class="axis" x="${L}" y="${H - 4}">${dateShort(pts[0].d)}</text><text class="axis" x="${W - R}" y="${H - 4}" text-anchor="end">${dateShort(last.d)}</text>`;
    const data = esc(JSON.stringify(pts.map((p) => [x(p.d), y(p.v), p.d, p.v])));
    return `<div class="chart" data-pts="${data}" data-unit="${esc(unit)}" data-w="${W}">
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Grafik">${g}<path class="area" d="${area}"/><path class="line" d="${line}"/>
      <circle class="dot" cx="${x(last.d)}" cy="${y(last.v)}" r="4.5"/>
      <text class="end-lbl" x="${x(last.d) + 8}" y="${y(last.v) + 4}">${fmt(last.v)}</text>${xl}
      <line class="xhair" x1="0" x2="0" y1="${T}" y2="${H - B}" visibility="hidden"/><circle class="dot hov" r="4.5" visibility="hidden"/></svg>
      <div class="tip" hidden></div></div>`;
  }
  function niceStep(raw) {
    const p = 10 ** Math.floor(Math.log10(raw || 1));
    const f = raw / p;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
  }
  function bindChart(el) {
    const pts = JSON.parse(el.dataset.pts), unit = el.dataset.unit, W = +el.dataset.w;
    const svg = el.querySelector('svg'), xh = svg.querySelector('.xhair'), hov = svg.querySelector('.hov'), tip = el.querySelector('.tip');
    const show = (clientX) => {
      const r = svg.getBoundingClientRect();
      const sx = ((clientX - r.left) / r.width) * W;
      let best = pts[0];
      for (const p of pts) if (Math.abs(p[0] - sx) < Math.abs(best[0] - sx)) best = p;
      xh.setAttribute('x1', best[0]); xh.setAttribute('x2', best[0]); xh.setAttribute('visibility', 'visible');
      hov.setAttribute('cx', best[0]); hov.setAttribute('cy', best[1]); hov.setAttribute('visibility', 'visible');
      tip.innerHTML = `${fmt(best[3])} ${esc(unit)} <span>· ${dateShort(best[2])}</span>`;
      tip.hidden = false;
      const px = (best[0] / W) * r.width;
      tip.style.left = Math.max(50, Math.min(r.width - 50, px)) + 'px';
      tip.style.top = Math.max(-30, (best[1] / W) * r.width - 34) + 'px';
    };
    const hide = () => { xh.setAttribute('visibility', 'hidden'); hov.setAttribute('visibility', 'hidden'); tip.hidden = true; };
    el.addEventListener('pointermove', (e) => show(e.clientX));
    el.addEventListener('pointerdown', (e) => show(e.clientX));
    el.addEventListener('pointerleave', hide);
  }

  // ---------------------------------------------------------------- actions
  const ACT = {
    closeSheet,
    async settings() { openSheet(settingsSheet); },
    saveStart() {
      const v = $('#startInput').value;
      if (!v) return toast('Sanani tanlang');
      D.saveSettings({ start: v }); haptic.ok(); render();
    },
    pickDay(el) { const p = +el.dataset.p; ui.pickDay = p === dayIdx() ? null : p; haptic.tap(); render(); },
    start(el) { unlockAudio(); startSession(+el.dataset.p); },
    toggleEx(el) {
      const i = +el.dataset.i, a = D.active();
      const cur = ui.open == null ? currentIdx(a) : ui.open;
      ui.open = cur === i ? -1 : i;
      render();
    },
    tick(el) {
      unlockAudio();
      const a = D.active(), i = +el.dataset.i, j = +el.dataset.j;
      const it = a.it[i], s = it.s[j];
      const ex = D.ex(it.e) || { type: 'w' };
      if (!s[2]) {
        const hist = index()[it.e], last = hist && hist[hist.length - 1];
        const prev = last && (last.s[j] || last.s[last.s.length - 1]);
        if (ex.type !== 't' && s[1] === '') s[1] = String(prev ? prev[1] : repsLow(it.r) || '');
        if (ex.type === 'w' && !num(s[0])) { haptic.warn(); return toast('Avval vaznni kiriting'); }
        if (ex.type === 't' && !num(s[0])) s[0] = String(num(it.r) || '');
        if (ex.type !== 't' && !num(s[1])) { haptic.warn(); return toast('Takror sonini kiriting'); }
        s[2] = 1;
        a.lt = Date.now();
        const next = it.s[j + 1];
        if (next && next[0] === '') next[0] = s[0];
        haptic.tap();
        const isLast = it.s.every((x) => x[2]);
        if (isLast) ui.open = null;
        const nextIt = isLast ? a.it[i + 1] : it;
        if (nextIt && ex.type !== 't') startRest(it.t, isLast ? `Keyingisi: ${exName(nextIt.e)}` : 'Dam olish');
      } else {
        s[2] = 0;
      }
      saveActive(a);
      render();
    },
    addSet(el) {
      const a = D.active(), it = a.it[+el.dataset.i];
      const last = it.s[it.s.length - 1];
      it.s.push([last ? last[0] : '', '', 0]);
      saveActive(a); ui.open = +el.dataset.i; render();
    },
    rmSet(el) {
      const a = D.active(), it = a.it[+el.dataset.i];
      if (it.s.length > 1) it.s.pop();
      saveActive(a); ui.open = +el.dataset.i; render();
    },
    mvEx(el) {
      const a = D.active(), i = +el.dataset.i;
      [a.it[i - 1], a.it[i]] = [a.it[i], a.it[i - 1]];
      saveActive(a); ui.open = i - 1; render();
    },
    addToSession() { ui.pick = { mode: 'session' }; ui.pickQ = ''; ui.pickGroup = 'all'; openSheet(pickerSheet); },
    finish() { finishSession(); },
    async cancelSession() {
      if (!(await confirmBox('Mashg‘ulot bekor qilinsinmi? Belgilangan podxodlar saqlanmaydi.'))) return;
      Store.remove('a'); endSession();
    },
    restAdd() { if (rest) { rest.end += 15000; rest.total += 15000; rest.fired = false; $('#restbar').classList.remove('done'); tick(); } },
    restSkip() { stopRest(); },

    video(el) {
      const ex = D.ex(el.dataset.id);
      if (!ex) return;
      if (ex.video && !ytId(ex.video)) return openLink(ex.video);
      ui.embed = ytId(ex.video) ? ex.id : null;
      openSheet(() => exSheet(ex.id));
    },
    playVideo(el) { const ex = D.ex(el.dataset.id); if (ex && ex.video) openLink(ex.video); },
    ytSearch(el) { openLink(ytSearch(el.dataset.q)); },
    openEx(el) { const id = el.dataset.id; openSheet(() => exSheet(id)); },
    newEx() {
      const id = 'c' + Date.now().toString(36);
      Store.set('x_' + id, { name: 'Yangi mashq', group: ui.libGroup !== 'all' ? ui.libGroup : 'kokrak', type: 'w', cue: '' });
      openSheet(() => exSheet(id));
    },
    async delEx(el) {
      if (!(await confirmBox('Mashq o‘chirilsinmi? Tarixdagi yozuvlar qoladi.'))) return;
      Store.remove('x_' + el.dataset.id); closeSheet();
    },
    resetEx(el) { Store.remove('x_' + el.dataset.id); drawSheet(); },
    libGroup(el) { ui.libGroup = el.dataset.g; render(); },
    pickGroup(el) { ui.pickGroup = el.dataset.g; drawSheet(); },

    editDay(el) { const p = +el.dataset.p; openSheet(() => dayView(p)); },
    editDayItems(el) { const p = +el.dataset.p; ui.embed = null; openSheet(() => dayEditor(p)); },
    startFromDay(el) {
      sheets.length = 0; drawSheet();
      ui.tab = 'today'; unlockAudio(); startSession(+el.dataset.p);
    },
    embed(el) { ui.embed = el.dataset.k; haptic.tap(); drawSheet(); },
    mvItem(el) {
      const p = +el.dataset.p, j = +el.dataset.j, k = j + +el.dataset.d, d = D.day(p);
      if (k < 0 || k >= d.items.length) return;
      [d.items[j], d.items[k]] = [d.items[k], d.items[j]];
      D.saveDay(p, d); haptic.tap(); drawSheet();
    },
    rmItem(el) {
      const p = +el.dataset.p, d = D.day(p);
      d.items.splice(+el.dataset.j, 1);
      D.saveDay(p, d); drawSheet();
    },
    addItem(el) { ui.pick = { mode: 'day', p: +el.dataset.p }; ui.pickQ = ''; ui.pickGroup = 'all'; openSheet(pickerSheet); },
    pickEx(el) {
      const id = el.dataset.id, ex = D.ex(id), s = D.settings();
      const sets = ex.type === 't' ? 1 : 3, reps = ex.type === 't' ? '10' : '10-12', restS = ex.type === 't' ? 0 : s.restDef;
      if (ui.pick && ui.pick.mode === 'day') {
        const d = D.day(ui.pick.p);
        d.items.push({ e: id, s: sets, r: reps, t: restS });
        D.saveDay(ui.pick.p, d);
      } else if (ui.pick && ui.pick.mode === 'session') {
        const a = D.active();
        a.it.push(newSessionItem(id, sets, reps, restS));
        saveActive(a); ui.open = a.it.length - 1;
      }
      haptic.tap(); toast('Qo‘shildi: ' + ex.name);
      closeSheet();
    },
    async resetDay(el) {
      if (!(await confirmBox('Bu kun standart dasturga qaytarilsinmi?'))) return;
      Store.remove('p_' + el.dataset.p); drawSheet();
    },

    heat(el) { ui.heatSel = el.dataset.d; render(); },
    openLog(el) { const d = el.dataset.d; openSheet(() => logSheet(d)); },
    async delLog(el) {
      if (!(await confirmBox('Bu mashg‘ulot butunlay o‘chirilsinmi?'))) return;
      const key = logKey(el.dataset.d), l = Store.get(key);
      if (l && l.m) { delete l.it; delete l.st; delete l.en; delete l.dur; Store.set(key, l); } else Store.remove(key);
      invalidate(); closeSheet();
    },
    moreHist() { ui.histN += 30; render(); },

    export() {
      const ta = $('#backup');
      const out = {};
      for (const k of Object.keys(Store.data)) out[k] = Store.data[k];
      ta.value = JSON.stringify({ app: 'zal-nazorat', v: 1, at: new Date().toISOString(), data: out });
      ta.hidden = false; $('#importGo').hidden = true;
      ta.select();
      if (navigator.clipboard) navigator.clipboard.writeText(ta.value).then(() => toast('Nusxa olindi — Saqlangan xabarlarga yuboring'), () => toast('Matnni belgilab nusxa oling'));
      else toast('Matnni belgilab nusxa oling');
    },
    import() { const ta = $('#backup'); ta.value = ''; ta.placeholder = 'Zaxira nusxa matnini shu yerga qo‘ying'; ta.hidden = false; $('#importGo').hidden = false; ta.focus(); },
    async importGo() {
      const j = parse($('#backup').value.trim());
      if (!j || j.app !== 'zal-nazorat' || !j.data) return toast('Noto‘g‘ri zaxira nusxa');
      if (!(await confirmBox(`${Object.keys(j.data).length} ta yozuv tiklansinmi? Bir xil kalitlar ustiga yoziladi.`))) return;
      for (const [k, v] of Object.entries(j.data)) if (/^[\w-]{1,128}$/.test(k) && v && typeof v === 'object') Store.set(k, v);
      invalidate(); toast('Tiklandi'); closeSheet();
    },
  };

  const IN = {
    set(el) {
      const a = D.active();
      if (!a) return;
      a.it[+el.dataset.i].s[+el.dataset.j][+el.dataset.f] = el.value.trim();
      saveActive(a);
    },
    libQ(el) { ui.libQ = el.value; $('#libList').innerHTML = libList(); },
    pickQ(el) { ui.pickQ = el.value; $('#pickList').innerHTML = pickList(); },
  };

  const CH = {
    metric(el) {
      const iso = isoDate(), key = logKey(iso);
      const l = Store.get(key) || { d: iso };
      l.m = Object.assign({}, l.m);
      const v = el.value.trim();
      if (v === '') delete l.m[el.dataset.k]; else l.m[el.dataset.k] = v.replace(',', '.');
      delete l.u;
      Store.set(key, l);
      haptic.tap(); toast('Saqlandi');
    },
    dayField(el) {
      const p = +el.dataset.p, d = D.day(p);
      d[el.dataset.f] = el.value.trim();
      D.saveDay(p, d);
    },
    dayRest(el) { const p = +el.dataset.p, d = D.day(p); d.rest = el.checked; D.saveDay(p, d); drawSheet(); },
    itemField(el) {
      const p = +el.dataset.p, j = +el.dataset.j, f = el.dataset.f, d = D.day(p);
      const v = el.value.trim();
      if (f === 'r') d.items[j].r = v || d.items[j].r;
      else d.items[j][f] = Math.max(f === 's' ? 1 : 0, Math.round(num(v) || 0));
      D.saveDay(p, d); drawSheet();
    },
    exField(el) {
      const id = el.dataset.id, f = el.dataset.f;
      const ov = Object.assign({}, Store.get('x_' + id));
      delete ov.u;
      let v = el.value.trim();
      if (f === 'video' && v && !/^https?:\/\//i.test(v)) { toast('Havola https:// bilan boshlanishi kerak'); return; }
      if (f === 'name' && !v) return;
      ov[f] = v;
      if (f === 'type' && v === 't') ov.unit = 'daq';
      Store.set('x_' + id, ov);
      toast('Saqlandi'); drawSheet();
    },
    setting(el) {
      const f = el.dataset.f;
      let v = el.value.trim();
      if (f !== 'start') { v = Math.round(num(v) || 0); if (v <= 0) return; }
      D.saveSettings({ [f]: v }); toast('Saqlandi');
    },
  };

  document.addEventListener('click', (e) => {
    const tab = e.target.closest('[data-tab]');
    if (tab) {
      if (sheets.length) { sheets.length = 0; drawSheet(); }
      ui.tab = tab.dataset.tab; haptic.tap(); render(); window.scrollTo(0, 0);
      return;
    }
    const el = e.target.closest('[data-act]');
    if (el && !el.disabled && ACT[el.dataset.act]) ACT[el.dataset.act](el, e);
  });
  document.addEventListener('input', (e) => { const h = e.target.dataset && IN[e.target.dataset.in]; if (h) h(e.target); });
  document.addEventListener('change', (e) => { const h = e.target.dataset && CH[e.target.dataset.ch]; if (h) h(e.target); });

  // ---------------------------------------------------------------- boot
  async function boot() {
    if (inTG) {
      TG.ready();
      TG.expand();
      if (tgAtLeast('7.7')) TG.disableVerticalSwipes(); // mashg‘ulot paytida pastga surib yopib qo‘ymaslik uchun
      if (tgAtLeast('6.1')) {
        TG.setHeaderColor('secondary_bg_color');
        TG.setBackgroundColor('secondary_bg_color');
        TG.BackButton.onClick(() => { if (sheets.length) closeSheet(); });
      }
    }
    $('#view').innerHTML = '<div class="empty">Yuklanmoqda…</div>';
    await Store.init();
    if (D.active()) sessionOn();
    render();
  }
  boot();
})();
