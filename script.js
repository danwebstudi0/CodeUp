const tg = window.Telegram && Telegram.WebApp;
if (tg) { tg.ready(); tg.expand(); try { tg.setHeaderColor('#0f0f1a'); tg.setBackgroundColor('#0f0f1a'); } catch (e) {} }
const $ = q => document.querySelector(q);
const esc = t => String(t).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const hap = (k, t) => { try { k === 'n' ? tg.HapticFeedback.notificationOccurred(t) : tg.HapticFeedback.impactOccurred(t); } catch (e) {} };
const tu = (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) || { id: 0, first_name: 'Друг', username: '' };
const MAXL = 5, REGEN = 15 * 60000;

// BACKEND: замените load/save на fetch('/api/user') — остальной код менять не нужно
const Api = {
  key: 'codeup_' + tu.id,
  load() { try { return JSON.parse(localStorage.getItem(this.key)); } catch (e) { return null; } },
  save(s) { try { localStorage.setItem(this.key, JSON.stringify(s)); } catch (e) {} }
};

const day = (o = 0) => { const d = new Date(); d.setDate(d.getDate() + o); return d.toISOString().slice(0, 10); };
let s = Api.load() || { telegram_id: tu.id, xp: 0, level: 1, streak: 0, last_activity: null, lives: MAXL, livesAt: Date.now(), completed_lessons: [], achievements: [], perfect: 0, daily: { d: '', c: 0, done: false } };
s.first_name = tu.first_name; s.username = tu.username || ''; s.avatar = tu.photo_url || '';
if (s.daily.d !== day()) s.daily = { d: day(), c: 0, done: false };
const save = () => Api.save(s);
const need = l => 25 * (l - 1) * (l + 2);               // 0,100,250,450,700...
const lvlOf = x => { let l = 1; while (x >= need(l + 1)) l++; return l; };
const curStreak = () => [day(), day(-1)].includes(s.last_activity) ? s.streak : 0;
function regen() { const n = Date.now(); if (s.lives >= MAXL) { s.livesAt = n; return; } while (s.lives < MAXL && n - s.livesAt >= REGEN) { s.lives++; s.livesAt += REGEN; } if (s.lives >= MAXL) s.livesAt = n; }
function touch() { const t = day(); if (s.daily.d !== t) s.daily = { d: t, c: 0, done: false }; if (s.last_activity === t) return; s.streak = s.last_activity === day(-1) ? s.streak + 1 : 1; s.last_activity = t; toast('🔥 Серия: ' + s.streak); }

// ---------- эффекты ----------
function toast(m) { const e = document.createElement('div'); e.className = 'toast'; e.textContent = m; $('#fx').appendChild(e); setTimeout(() => e.remove(), 2700); }
function floatXP(t) { const e = document.createElement('div'); e.className = 'fl'; e.textContent = t; e.style.left = (innerWidth / 2 - 30) + 'px'; e.style.top = (innerHeight - 160) + 'px'; $('#fx').appendChild(e); setTimeout(() => e.remove(), 1100); }
function confetti(n = 40) { const c = ['#7c5cff', '#4d8dff', '#ffc94d', '#2ecc8f', '#ff5b6e']; for (let i = 0; i < n; i++) { const e = document.createElement('div'); e.className = 'cf'; e.style.left = Math.random() * 100 + '%'; e.style.background = c[i % 5]; e.style.setProperty('--x', (Math.random() * 160 - 80) + 'px'); e.style.setProperty('--r', (Math.random() * 720) + 'deg'); e.style.animationDelay = Math.random() * .4 + 's'; $('#fx').appendChild(e); setTimeout(() => e.remove(), 2400); } }
function levelUp() { hap('n', 'success'); confetti(60); const o = document.createElement('div'); o.className = 'ov'; o.innerHTML = `<h1>LEVEL UP! 🎉</h1><p>Теперь у тебя уровень ${s.level}</p><button class="btn">Отлично</button>`; o.querySelector('button').onclick = () => o.remove(); $('#fx').appendChild(o); }
function gain(n) { s.xp += n; floatXP('+' + n + ' XP'); const l = lvlOf(s.xp); if (l > s.level) { s.level = l; levelUp(); } checkAch(); }
function checkAch() { ACHIEVEMENTS.forEach(a => { if (!s.achievements.includes(a.id) && a.ok(s)) { s.achievements.push(a.id); hap('n', 'success'); toast(a.i + ' Достижение: ' + a.n); confetti(20); } }); }

// ---------- экраны ----------
let tab = 'home', sub = '', rk = 'world';
const nextLesson = () => { const i = COURSE.findIndex((_, j) => !s.completed_lessons.includes(j)); return i < 0 ? COURSE.length - 1 : i; };
function ava(name, url, cls = '') { return `<div class="ava ${cls}" style="${url ? `background-image:url(${esc(url)})` : ''}">${url ? '' : esc((name || '?')[0])}</div>`; }
function render() {
  regen();
  $('#nav').innerHTML = [['home', '🏠', 'Главная'], ['learn', '📚', 'Учёба'], ['rank', '🏆', 'Рейтинг'], ['me', '👤', 'Профиль']].map(([k, i, n]) => `<button class="${tab === k ? 'on' : ''}" onclick="go('${k}')"><span>${i}</span>${n}</button>`).join('');
  const a = $('#app'); a.style.animation = 'none'; a.offsetWidth; a.style.animation = '';
  a.innerHTML = { home: vHome, learn: vLearn, rank: vRank, me: vMe }[tab]();
}
function go(t) { tab = t; sub = ''; hap('i', 'light'); render(); scrollTo(0, 0); }
function xpBar() { const a = need(s.level), b = need(s.level + 1); return `<div class="bar"><i style="width:${(s.xp - a) / (b - a) * 100}%"></i></div><div class="sub" style="margin-top:4px">${s.xp - a} / ${b - a} XP до уровня ${s.level + 1}</div>`; }
function vHome() {
  const i = nextLesson(), done = s.completed_lessons.length, d = s.daily;
  return `<h1>Привет, ${esc(s.first_name)} 👋</h1>
  <div class="row" style="margin-bottom:14px"><div class="chip"><span class="fire">🔥</span> ${curStreak()}<small>Серия</small></div><div class="chip">⭐ ${s.xp}<small>XP</small></div><div class="chip">🏆 ${s.level}<small>Уровень</small></div></div>
  <div class="card hero"><div class="sub" style="color:#ffffffcc">Продолжить обучение</div><h2>🐍 Python</h2><p>Урок ${Math.min(done + 1, COURSE.length)} из ${COURSE.length} · ${esc(COURSE[i].title)}</p>
  <div class="bar" style="margin-top:10px"><i style="width:${done / COURSE.length * 100}%"></i></div><button class="btn" onclick="openLesson(${i})">Продолжить →</button></div>
  <div class="card"><h3>🎯 Задание дня</h3><p class="sub">Ответь правильно на 5 вопросов · +50 XP</p><div class="bar" style="margin-top:10px"><i style="width:${Math.min(d.c, 5) / 5 * 100}%;background:var(--ok)"></i></div><p style="margin-top:6px">${d.done ? 'Выполнено! 🎉' : Math.min(d.c, 5) + ' / 5'}</p></div>
  <div class="card"><h3>Твои достижения</h3>${ACHIEVEMENTS.slice(0, 3).map(achRow).join('')}</div>`;
}
function vLearn() {
  return `<h1>Учёба</h1><div class="card"><h2>🐍 Python с нуля</h2><p class="sub">${s.completed_lessons.length} из ${COURSE.length} уроков</p></div>` + COURSE.map((l, i) => {
    const dn = s.completed_lessons.includes(i), lk = i > 0 && !s.completed_lessons.includes(i - 1), cur = !dn && !lk;
    return `<div class="card sec ${dn ? 'done' : ''} ${lk ? 'lock' : ''} ${cur ? 'cur' : ''}" onclick="openLesson(${i})"><div class="n">${dn ? '✓' : lk ? '🔒' : i + 1}</div><div><b>${esc(l.title)}</b><div class="sub">Раздел ${i + 1} · +130 XP</div></div></div>`;
  }).join('');
}
function vRank() {
  let list = FAKE_USERS.map(u => ({ n: u[0], l: u[1], x: u[2] })); if (rk === 'friends') list = list.filter((_, i) => i % 2 === 0);
  list.push({ n: s.first_name, l: s.level, x: s.xp, me: 1 }); list.sort((a, b) => b.x - a.x);
  return `<h1>Рейтинг</h1><div class="tabs"><button class="${rk === 'world' ? 'on' : ''}" onclick="rk='world';render()">🌍 Общий</button><button class="${rk === 'friends' ? 'on' : ''}" onclick="rk='friends';render()">👥 Друзья</button></div>` +
    list.map((u, i) => `<div class="lb ${u.me ? 'me' : ''}"><b>${i + 1}</b>${ava(u.n, u.me ? s.avatar : '')}<div><b>${esc(u.n)}</b><div class="sub" style="${u.me ? 'color:#fff' : ''}">Уровень ${u.l}</div></div><b>${u.x} XP</b></div>`).join('');
}
const achRow = a => { const on = s.achievements.includes(a.id); return `<div class="ach ${on ? '' : 'off'}" style="margin-bottom:10px"><span class="ic">${a.i}</span><div><b>${a.n}</b><br><small>${a.d}</small></div></div>`; };
function vMe() {
  if (sub === 'ach') return `<h1>Достижения</h1><div class="card">${ACHIEVEMENTS.map(achRow).join('')}</div><button class="btn ghost" onclick="sub='';render()">← Назад</button>`;
  return `<div class="card" style="text-align:center">${ava(s.first_name, s.avatar, 'big')}<h2>${esc(s.first_name)}</h2><p class="sub">${s.username ? '@' + esc(s.username) : ''}</p><p style="margin:8px 0">Level ${s.level} · ${s.xp} XP</p>${xpBar()}</div>
  <div class="row" style="margin-bottom:14px"><div class="chip">🔥 ${curStreak()}<small>дней</small></div><div class="chip">📚 ${s.completed_lessons.length}<small>уроков</small></div><div class="chip">🏆 ${s.achievements.length}<small>наград</small></div></div>
  <div class="card"><b>❤️ Жизни: ${s.lives} / ${MAXL}</b><p class="sub">Одна жизнь восстанавливается за 15 минут</p></div>
  <button class="btn" onclick="sub='ach';render()">Мои достижения</button>`;
}

// ---------- урок ----------
let L = null;
const TN = { choice: '🎯 Выбери ответ', order: '🧩 Расставь строки', fill: '✍️ Заполни пропуск' };
const norm = v => String(v).toLowerCase().replace(/\s+/g, '');
function openLesson(i) {
  regen();
  if (i > 0 && !s.completed_lessons.includes(i - 1)) { hap('n', 'warning'); return toast('🔒 Сначала пройди предыдущий урок'); }
  if (s.lives < 1) { hap('n', 'error'); return toast('💔 Жизни закончились — скоро восстановятся'); }
  L = { i, k: -1, combo: 0, err: 0, xp: 0, sel: null, ord: [], pool: [], fb: null };
  $('#lesson').hidden = false; try { tg.BackButton.show(); } catch (e) {} drawL();
}
function closeL() { $('#lesson').hidden = true; L = null; try { tg.BackButton.hide(); } catch (e) {} render(); }
if (tg) tg.BackButton.onClick(closeL);
function prep() { const t = COURSE[L.i].tasks[L.k]; L.ord = []; if (t.t === 'order') L.pool = t.lines.map((_, j) => j).sort(() => Math.random() - .5); }
const mult = () => Math.min(3, 1 + Math.floor(L.combo / 3));
function drawL() {
  const les = COURSE[L.i], T = les.tasks, k = L.k; let h = '', f = '';
  const top = `<div class="lt"><button class="x" onclick="closeL()">✕</button><div class="bar"><i style="width:${Math.max(0, k) / T.length * 100}%"></i></div>${L.combo >= 2 ? `<span class="cmb">🔥 x${mult()}</span>` : ''}<b>❤️ ${s.lives}</b></div>`;
  if (k < 0) {
    h = `<div class="tag">Урок ${L.i + 1}</div><h2>${esc(les.title)}</h2><p>${esc(les.text)}</p><pre>${esc(les.code)}</pre><p class="sub">Впереди ${T.length} задания. Отвечай подряд правильно — XP умножается!</p>`;
    f = `<button class="btn" onclick="L.k=0;prep();drawL()">Начать →</button>`;
  } else {
    const t = T[k], fb = L.fb;
    h = `<div class="tag">${t.err ? '🐞 Найди ошибку' : t.t === 'fill' && !t.code ? '💻 Мини-задача' : TN[t.t]}</div><h3>${esc(t.q)}</h3>` + (t.code ? `<pre>${esc(t.code)}</pre>` : '');
    if (t.t === 'choice') h += t.o.map((o, j) => `<button class="opt ${fb ? (j === t.a ? 'ok' : j === L.sel ? 'bad' : '') : ''}" ${fb ? 'disabled' : ''} onclick="pick(${j})">${esc(o)}</button>`).join('');
    else if (t.t === 'fill') h += `<input id="in" class="inp" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Твой ответ" ${fb ? 'disabled' : ''} value="${esc(L.val || '')}">`;
    else h += `<div class="zone">${L.ord.map((j, n) => `<button class="ch" ${fb ? 'disabled' : ''} onclick="L.ord.splice(${n},1);drawL()">${esc(t.lines[j])}</button>`).join('') || '<span class="sub">Нажимай на строки по порядку</span>'}</div><div class="pool">${L.pool.filter(j => !L.ord.includes(j)).map(j => `<button class="ch" onclick="L.ord.push(${j});hap('i','light');drawL()">${esc(t.lines[j])}</button>`).join('')}</div>`;
    if (fb) f = `<div class="fb ${fb.ok ? 'ok' : 'bad'}"><b>${fb.ok ? '✅ Правильно! +' + fb.xp + ' XP' : '❌ Неправильно'}</b><p>${esc(t.e)}</p></div><button class="btn" onclick="next()">${s.lives < 1 && !fb.ok ? 'Выйти' : 'Дальше →'}</button>`;
    else if (t.t === 'fill') f = `<button class="btn" onclick="L.val=$('#in').value;if(L.val.trim())judge(COURSE[L.i].tasks[L.k].ans.map(norm).includes(norm(L.val)))">Проверить</button>`;
    else if (t.t === 'order') f = `<button class="btn" ${L.ord.length < t.lines.length ? 'disabled style="opacity:.5"' : ''} onclick="judge(L.ord.every((j,n)=>j===n))">Проверить</button>`;
  }
  $('#lesson').innerHTML = top + `<div class="lb2">${h}</div><div class="lft">${f}</div>`;
  const inp = $('#in'); if (inp && !L.fb) inp.focus();
}
function pick(j) { L.sel = j; judge(j === COURSE[L.i].tasks[L.k].a); }
function judge(ok) {
  touch();
  if (ok) { L.combo++; const xp = 10 * mult(); L.xp += xp; s.daily.c++; hap('n', 'success'); gain(xp); L.fb = { ok, xp };
    if (s.daily.c >= 5 && !s.daily.done) { s.daily.done = true; gain(50); toast('🎯 Задание выполнено! +50 XP'); confetti(30); } }
  else { L.combo = 0; L.err++; if (s.lives === MAXL) s.livesAt = Date.now(); s.lives--; hap('n', 'error'); L.fb = { ok, xp: 0 }; }
  save(); drawL();
  if (!ok) { const z = $('#lesson'); z.style.animation = 'none'; z.offsetWidth; z.style.animation = 'shake .4s'; }
}
function next() {
  if (s.lives < 1 && !L.fb.ok) { toast('💔 Жизни закончились'); return closeL(); }
  L.k++; L.fb = null; L.sel = null; L.val = '';
  if (L.k >= COURSE[L.i].tasks.length) return finish();
  prep(); drawL();
}
function finish() {
  const first = !s.completed_lessons.includes(L.i), perfect = L.err === 0; let b = 30;
  if (first) { s.completed_lessons.push(L.i); b += 100; }
  if (perfect) s.perfect++;
  gain(b); touch(); save(); confetti(70); hap('n', 'success');
  $('#lesson').innerHTML = `<div class="ov" style="position:static;flex:1"><h1>Урок пройден! 🎉</h1><p>${perfect ? '💯 Без ошибок!' : 'Ошибок: ' + L.err}</p><h2>+${L.xp + b} XP</h2><p class="sub">${first ? '+130 XP за урок и раздел' : 'Повторение: +30 XP'}</p><button class="btn" onclick="closeL()">Продолжить</button></div>`;
}
checkAch(); save(); render();
setInterval(() => { if (!L && $('#lesson').hidden) { regen(); } }, 30000);
