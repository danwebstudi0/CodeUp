const tg = window.Telegram && Telegram.WebApp;
if (tg) { tg.ready(); tg.expand(); try { tg.setHeaderColor('#0f0f1a'); tg.setBackgroundColor('#0f0f1a'); } catch (e) {} }
const $ = q => document.querySelector(q);
const esc = t => String(t).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const hap = (k, t) => { try { k === 'n' ? tg.HapticFeedback.notificationOccurred(t) : tg.HapticFeedback.impactOccurred(t); } catch (e) {} };
const tu = (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) || { id: 0, first_name: 'Друг', username: '' };
const MAXL = 5, REGEN = 15 * 60000;
// BACKEND: замените load/save на fetch('/api/user')
const Api = { key: 'codeup2_' + tu.id, load() { try { return JSON.parse(localStorage.getItem(this.key)); } catch (e) { return null; } }, save(s) { try { localStorage.setItem(this.key, JSON.stringify(s)); } catch (e) {} } };
const day = (o = 0) => { const d = new Date(); d.setDate(d.getDate() + o); return d.toISOString().slice(0, 10); };
let s = Api.load() || { telegram_id: tu.id, xp: 0, level: 1, streak: 0, last_activity: null, lives: MAXL, livesAt: Date.now(), completed_lessons: [], completed_projects: [], achievements: [], skills: [], selected_tracks: [], pref: '', onb: 0, codes: 0, bugs: 0, days: [], daily: { d: '', c: 0, done: false } };
s.first_name = tu.first_name; s.username = tu.username || ''; s.avatar = tu.photo_url || ''; s.goals = s.goals || {}; s.path = s.path || []; s.ai = s.ai || [];
if (s.daily.d !== day()) s.daily = { d: day(), c: 0, done: false };
const save = () => Api.save(s);
const need = l => 25 * (l - 1) * (l + 2), lvlOf = x => { let l = 1; while (x >= need(l + 1)) l++; return l; };
const curStreak = () => [day(), day(-1)].includes(s.last_activity) ? s.streak : 0;
const done = id => s.completed_lessons.includes(id);
const open_ = (t, i) => { const id = t.lessons[i].id, k = s.path.indexOf(id); return k >= 0 ? k === 0 || done(s.path[k - 1]) : i === 0 || done(t.lessons[i - 1].id); };
function byId(id) { for (const t of TRACKS) { const i = t.lessons.findIndex(l => l.id === id); if (i >= 0) return { t, i }; } return null; }
const prog = t => t.lessons.filter(l => done(l.id)).length;
function regen() { const n = Date.now(); if (s.lives >= MAXL) { s.livesAt = n; return; } while (s.lives < MAXL && n - s.livesAt >= REGEN) { s.lives++; s.livesAt += REGEN; } if (s.lives >= MAXL) s.livesAt = n; }
function touch() { const t = day(); if (s.daily.d !== t) s.daily = { d: t, c: 0, done: false }; if (s.last_activity === t) return; s.streak = s.last_activity === day(-1) ? s.streak + 1 : 1; s.last_activity = t; s.days.push(t); toast('🔥 Серия: ' + s.streak); }
function nextL() { for (const id of s.path) { if (!done(id)) { const r = byId(id); if (r) return r; } } const ts = s.selected_tracks.length ? TRACKS.filter(t => s.selected_tracks.includes(t.id)) : TRACKS; for (const t of ts) { const i = t.lessons.findIndex(l => !done(l.id)); if (i >= 0) return { t, i }; } return null; }

// ---- эффекты ----
function toast(m) { const e = document.createElement('div'); e.className = 'toast'; e.textContent = m; $('#fx').appendChild(e); setTimeout(() => e.remove(), 2700); }
function floatXP(t) { const e = document.createElement('div'); e.className = 'fl'; e.textContent = t; e.style.left = (innerWidth / 2 - 30) + 'px'; e.style.top = (innerHeight - 160) + 'px'; $('#fx').appendChild(e); setTimeout(() => e.remove(), 1100); }
function confetti(n = 40) { const c = ['#7c5cff', '#4d8dff', '#ffc94d', '#2ecc8f', '#ff5b6e']; for (let i = 0; i < n; i++) { const e = document.createElement('div'); e.className = 'cf'; e.style.left = Math.random() * 100 + '%'; e.style.background = c[i % 5]; e.style.setProperty('--x', (Math.random() * 160 - 80) + 'px'); e.style.setProperty('--r', Math.random() * 720 + 'deg'); e.style.animationDelay = Math.random() * .4 + 's'; $('#fx').appendChild(e); setTimeout(() => e.remove(), 2400); } }
function levelUp() { hap('n', 'success'); confetti(60); const o = document.createElement('div'); o.className = 'ov'; o.innerHTML = `<h1>LEVEL UP! 🎉</h1><p>Теперь у тебя уровень ${s.level}</p><button class="btn">Отлично</button>`; o.querySelector('button').onclick = () => o.remove(); $('#fx').appendChild(o); }
function gain(n) { s.xp += n; floatXP('+' + n + ' XP'); const l = lvlOf(s.xp); if (l > s.level) { s.level = l; levelUp(); } checkAch(); }
function checkAch() { ACHIEVEMENTS.forEach(a => { if (!s.achievements.includes(a.id) && a.ok(s)) { s.achievements.push(a.id); hap('n', 'success'); toast(a.i + ' Достижение: ' + a.n); confetti(20); } }); }

// ---- экраны ----
let tab = 'home', rk = 'world', openT = '', sub = '', ob = s.onb ? 9 : 0;
function ava(n, u, c = '') { return `<div class="ava ${c}" style="${u ? `background-image:url(${esc(u)})` : ''}">${u ? '' : esc((n || '?')[0])}</div>`; }
function render() {
  regen(); const a = $('#app'); a.style.animation = 'none'; a.offsetWidth; a.style.animation = '';
  if (ob < 4) { $('#nav').innerHTML = ''; a.innerHTML = vOb(); return; }
  $('#nav').innerHTML = [['home', '🏠', 'Главная'], ['path', '🧭', 'Путь'], ['proj', '🏗️', 'Проекты'], ['rank', '🏆', 'Рейтинг'], ['me', '👤', 'Профиль']].map(([k, i, n]) => `<button class="${tab === k ? 'on' : ''}" onclick="go('${k}')"><span>${i}</span>${n}</button>`).join('');
  a.innerHTML = { home: vHome, path: vPath, proj: vProj, rank: vRank, me: vMe, ai: vAi }[tab]();
}
function go(t) { tab = t; sub = ''; hap('i', 'light'); render(); scrollTo(0, 0); }
function vOb() {
  if (ob === 3) return vGoals();
  if (ob === 0) return `<div style="text-align:center;padding-top:15vh"><div style="font-size:64px" class="fire">👋</div><h1>Добро пожаловать в CodeUp</h1><p class="sub" style="margin-bottom:28px">Здесь ты научишься создавать сайты, Telegram-ботов, Mini Apps, игры и другие проекты — даже если сейчас не умеешь программировать.</p><button class="btn" onclick="ob=1;render()">Начать обучение →</button></div>`;
  if (ob === 1) return `<h1>Какой у тебя уровень?</h1>` + [['zero', '🟢 Я вообще ничего не знаю'], ['some', '🟡 Немного знаком с программированием'], ['pro', '🔵 Уже умею программировать']].map(([k, n]) => `<button class="opt ${s.pref === k ? 'sel' : ''}" style="font-family:inherit" onclick="s.pref='${k}';hap('i','light');render()">${n}</button>`).join('') + `<button class="btn" style="margin-top:10px;${s.pref ? '' : 'opacity:.4'}" onclick="if(s.pref){ob=2;render()}else toast('Сначала выбери уровень')">Дальше →</button>`;
  return `<h1>Что хочешь создавать?</h1><p class="sub" style="margin-bottom:12px">Можно выбрать несколько направлений</p>` + TRACKS.filter(t => !t.hid).map(t => `<button class="opt ${s.selected_tracks.includes(t.id) ? 'sel' : ''}" style="font-family:inherit" onclick="pickT('${t.id}')">${t.icon} <b>${t.title}</b><br><small style="color:var(--mut)">${t.tech.join(' · ')}</small></button>`).join('') + `<button class="btn" style="margin-top:10px;${s.selected_tracks.length ? '' : 'opacity:.4'}" onclick="if(s.selected_tracks.length){ob=3;hap('i','light');render()}else toast('Сначала выбери направление')">Дальше: выбрать цель →</button>`;
}
function pickT(id) { const a = s.selected_tracks, i = a.indexOf(id); i < 0 ? a.push(id) : a.splice(i, 1); hap('i', 'light'); render(); }
const need2 = () => { const a = need(s.level), b = need(s.level + 1); return `<div class="bar"><i style="width:${(s.xp - a) / (b - a) * 100}%"></i></div><div class="sub" style="margin-top:4px">${s.xp - a} / ${b - a} XP до уровня ${s.level + 1}</div>`; };
function week() { const n = new Date(), dow = (n.getDay() + 6) % 7; return `<div class="wk">${['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((d, i) => `<div class="${s.days.includes(day(i - dow)) ? 'on' : ''}">${d}<br>${s.days.includes(day(i - dow)) ? '🔥' : '·'}</div>`).join('')}</div>`; }
const achRow = a => `<div class="ach ${s.achievements.includes(a.id) ? '' : 'off'}" style="margin-bottom:10px"><span class="ic">${a.i}</span><div><b>${a.n}</b><br><small>${a.d}</small></div></div>`;
function vHome() {
  const n = nextL(), d = s.daily;
  const hero = n ? `<div class="card hero"><div class="sub" style="color:#ffffffcc">Продолжить обучение</div><h2>${n.t.icon} ${n.t.title}</h2><p>Урок ${n.i + 1} из ${n.t.lessons.length} · ${esc(n.t.lessons[n.i].title)}</p><div class="bar" style="margin-top:10px"><i style="width:${prog(n.t) / n.t.lessons.length * 100}%"></i></div><button class="btn" onclick="openLesson('${n.t.id}',${n.i})">Продолжить →</button></div>` : `<div class="card hero"><h2>🏆 Все курсы пройдены!</h2><p>Выбери другое направление на вкладке «Путь».</p></div>`;
  return `<div class="row" style="align-items:center;margin-bottom:14px;flex:none">${ava(s.first_name, s.avatar)}<h1 style="margin:0;flex:5">Привет, ${esc(s.first_name)} 👋</h1></div>
  <div class="row" style="margin-bottom:14px"><div class="chip"><span class="fire">🔥</span> ${curStreak()}<small>Серия</small></div><div class="chip">⭐ ${s.xp}<small>XP</small></div><div class="chip">🏆 ${s.level}<small>Уровень</small></div></div>${hero}
  <div class="card"><h3>🎯 Задание дня</h3><p class="sub">Реши 3 задания в уроках · +50 XP</p><div class="bar" style="margin-top:10px"><i style="width:${Math.min(d.c, 3) / 3 * 100}%;background:var(--ok)"></i></div><p style="margin-top:6px">${d.done ? 'Выполнено! 🎉' : Math.min(d.c, 3) + ' / 3'}</p></div>
  <div class="card"><h3>Серия</h3>${week()}</div><button class="btn ghost" style="margin-bottom:14px" onclick="go('ai')">🤖 AI-наставник</button><div class="card"><h3>Достижения</h3>${ACHIEVEMENTS.slice(0, 3).map(achRow).join('')}</div>`;
}
function vPath() {
  return vMyPath() + `<h1>Все направления</h1>` + TRACKS.map(t => { const p = prog(t), o = openT === t.id; return `<div class="card"><div class="sec" onclick="openT=${o ? "''" : `'${t.id}'`};render()"><div class="n">${t.icon}</div><div style="flex:1"><b>${t.title}</b>${s.selected_tracks.includes(t.id) ? ' ⭐' : ''}<div>${t.tech.map(x => `<span class="tc">${x}</span>`).join('')}</div></div><b>${p}/${t.lessons.length}</b></div>` + (o ? `<div style="margin-top:12px">` + t.lessons.map((l, i) => { const dn = done(l.id), lk = !open_(t, i); return `<div class="card sec ${dn ? 'done' : ''} ${lk ? 'lock' : ''}" style="background:var(--card2);margin-bottom:8px" onclick="openLesson('${t.id}',${i})"><div class="n">${dn ? '✓' : lk ? '🔒' : i + 1}</div><b>${esc(l.title)}</b></div>`; }).join('') + `</div>` : '') + `</div>`; }).join('');
}
function vProj() {
  const ts = TRACKS.filter(t => s.selected_tracks.includes(t.id));
  return `<h1>Мои проекты</h1>` + (ts.length ? ts.map(t => { const p = prog(t), pc = Math.round(p / t.lessons.length * 100), n = t.lessons.findIndex(l => !done(l.id)); return `<div class="card"><h3>${t.icon} ${t.project}</h3><div class="bar"><i style="width:${pc}%;background:var(--ok)"></i></div><p class="sub" style="margin:6px 0">${p}/${t.lessons.length} этапов · ${pc}%</p>` + t.lessons.map((l, i) => `<div class="ach ${done(l.id) ? '' : 'off'}" style="margin:4px 0">${done(l.id) ? '✓' : '○'} ${esc(l.title)}</div>`).join('') + (n >= 0 ? `<button class="btn" style="margin-top:10px" onclick="openLesson('${t.id}',${n})">Следующий этап →</button>` : `<p style="margin-top:8px">🏆 Проект завершён!</p>`) + `</div>`; }).join('') : `<div class="card"><p>Выбери цели, чтобы увидеть проекты.</p><button class="btn" style="margin-top:10px" onclick="s.onb=0;ob=2;render()">Выбрать направления</button></div>`);
}
function vRank() {
  let l = FAKE_USERS.map(u => ({ n: u[0], l: u[1], x: u[2] })); if (rk === 'friends') l = l.filter((_, i) => i % 2 === 0);
  l.push({ n: s.first_name, l: s.level, x: s.xp, me: 1 }); l.sort((a, b) => b.x - a.x);
  return `<h1>Рейтинг</h1><div class="tabs"><button class="${rk === 'world' ? 'on' : ''}" onclick="rk='world';render()">🌍 Общий</button><button class="${rk === 'friends' ? 'on' : ''}" onclick="rk='friends';render()">👥 Друзья</button></div>` + l.map((u, i) => `<div class="lb ${u.me ? 'me' : ''}"><b>${i + 1}</b>${ava(u.n, u.me ? s.avatar : '')}<div><b>${esc(u.n)}</b><div class="sub" style="${u.me ? 'color:#fff' : ''}">Уровень ${u.l}</div></div><b>${u.x} XP</b></div>`).join('');
}
function vMe() {
  const techs = TRACKS.filter(t => prog(t) > 0).flatMap(t => t.tech);
  return `<div class="card" style="text-align:center">${ava(s.first_name, s.avatar, 'big')}<h2>${esc(s.first_name)}</h2><p class="sub">${s.username ? '@' + esc(s.username) : ''}</p><p style="margin:8px 0">Level ${s.level} · ${s.xp} XP</p>${need2()}</div>
  <div class="row" style="margin-bottom:14px"><div class="chip">🔥 ${curStreak()}<small>дней</small></div><div class="chip">📚 ${s.completed_lessons.length}<small>уроков</small></div><div class="chip">🏗️ ${s.completed_projects.length}<small>проектов</small></div></div>
  <div class="card"><b>Изученные технологии</b><div>${techs.length ? [...new Set(techs)].map(x => `<span class="tc">${x}</span>`).join('') : '<p class="sub">Пока пусто — пройди первый урок</p>'}</div></div>
  <div class="card"><b>❤️ Жизни: ${s.lives} / ${MAXL}</b><p class="sub">Жизнь восстанавливается за 15 минут. Теряются только за ошибки в вопросах.</p></div>
  <div class="card"><h3>Достижения</h3>${ACHIEVEMENTS.map(achRow).join('')}</div>
  <button class="btn ghost" onclick="ob=1;render()">Изменить уровень и цели</button>`;
}

// ---- урок ----
let L = null;
function link(u) { tg && tg.openLink ? tg.openLink(u) : window.open(u, '_blank'); }
function openLesson(tid, i) {
  const t = TRACKS.find(x => x.id === tid); regen();
  if (!open_(t, i)) { hap('n', 'warning'); return toast('🔒 Сначала пройди предыдущий урок'); }
  L = { t, l: t.lessons[i], paid: {}, k: 0, h: 0, sel: null, fb: null, err: 0, first: !done(t.lessons[i].id), val: '' };
  $('#lesson').hidden = false; try { tg.BackButton.show(); } catch (e) {} drawL();
}
function closeL() { $('#lesson').hidden = true; L = null; try { tg.BackButton.hide(); } catch (e) {} render(); }
if (tg) tg.BackButton.onClick(closeL);
const norm = v => String(v).toLowerCase().replace(/\s+/g, '');
function drawL() {
  const T = L.l.steps, st = T[L.k]; let h = '', f = '', fb = L.fb;
  const top = `<div class="lt"><button class="x" onclick="closeL()">✕</button><div class="bar"><i style="width:${L.k / T.length * 100}%"></i></div><b>❤️ ${s.lives}</b></div>`;
  const nx = `<button class="btn" onclick="nextS()">${st.items ? 'Готово ✓' : 'Дальше →'}</button>`;
  if (st.t === 'info') {
    h = `<div class="tag">${esc(L.l.title)}</div><h2>${esc(st.h)}</h2><p>${esc(st.p)}</p>` + (st.n && s.pref === 'zero' ? `<div class="fb ok" style="margin-top:10px">💡 ${esc(st.n)}</div>` : '') + (st.items ? `<ol>${st.items.map(x => `<li>${esc(x)}</li>`).join('')}</ol>` : '') + (st.p2 ? `<p class="sub">${esc(st.p2)}</p>` : '');
    f = (st.link ? `<button class="btn ghost" style="margin-bottom:8px" onclick="link('${st.link[1]}')">${st.link[0]} ↗</button>` : '') + nx;
  } else if (st.t === 'code') {
    h = `<div class="tag">Разбор кода</div><h3>Нажимай на строки — я объясню</h3><div class="cb"><button class="cp" onclick="navigator.clipboard&&navigator.clipboard.writeText(L.l.steps[L.k].code.join('\\n'));toast('✅ Код скопирован')">📋 Копировать</button><pre>${st.code.map((c, i) => `<div class="ln ${L.sel === i ? 'on' : ''}" onclick="L.sel=${i};hap('i','light');drawL()">${hl(c)}</div>`).join('')}</pre></div><div id="ex">${L.sel != null ? esc(st.ex[L.sel]) : 'Выбери строку выше 👆'}</div><div class="sm"><button class="btn ghost" onclick="L.sel=null;$('#ex').textContent=L.l.steps[L.k].why">Почему это нужно?</button></div>`;
    f = nx;
  } else if (st.t === 'quiz') {
    h = `<div class="tag">${st.err ? '🐞 Найди ошибку' : '🎯 Проверь себя'}</div><h3>${esc(st.q)}</h3>` + st.o.map((o, j) => `<button class="opt ${fb ? (j === st.a ? 'ok' : j === L.sel ? 'bad' : '') : ''}" ${fb ? 'disabled' : ''} onclick="L.sel=${j};judge(${j === st.a})">${esc(o)}</button>`).join('');
  } else {
    h = `<div class="tag">💻 Практика</div><h3>${esc(st.q)}</h3>` + (st.code ? `<pre>${hl(st.code)}</pre>` : '') + `<input id="in" class="inp" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Пиши код здесь" value="${esc(L.val)}" ${fb && fb.ok ? 'disabled' : ''}>` + (L.msg ? `<div class="fb bad" style="margin-top:10px">${esc(L.msg)}</div>` : '') + (L.h ? `<div class="fb ok" style="margin-top:10px">💡 ${L.h >= 3 ? 'Решение: <code>' + esc(st.sol) + '</code>' : 'Подсказка ' + L.h + ': ' + esc(st.hints[L.h - 1])}</div>` : '');
    if (!fb) f = `<button class="btn" onclick="L.val=$('#in').value;if(L.val.trim()){chk()?judge(true):wrong()}">Проверить</button><button class="btn ghost" style="margin-top:8px" onclick="L.val=$('#in').value;L.h=Math.min(3,L.h+1);hap('i','light');drawL()">💡 Я застрял${L.h ? ' (' + L.h + '/3)' : ''}</button>`;
  }
  if (fb) f = `<div class="fb ${fb.ok ? 'ok' : 'bad'}"><b>${fb.ok ? '✅ Правильно! ' + (fb.xp ? '+' + fb.xp + ' XP' : '') : '❌ Неправильно'}</b><p>${esc(st.e || 'Отлично, код верный!')}</p></div><button class="btn" onclick="${s.lives < 1 && !fb.ok ? 'closeL()' : 'nextS()'}">${s.lives < 1 && !fb.ok ? 'Выйти' : 'Дальше →'}</button>`;
  $('#lesson').innerHTML = top + `<div class="lb2">${h}</div><div class="lft">${f}<div class="sm"><button class="btn ghost" onclick="backS()">← Назад</button><button class="btn ghost" onclick="skipS()">Далее →</button></div></div>`;
}
function wrong() { L.msg = 'Пока не то. Проверь кавычки, скобки и регистр букв — или нажми «Я застрял».'; hap('n', 'warning'); drawL(); }
function judge(ok) {
  const st = L.l.steps[L.k]; touch(); const w = st.t === 'write'; let xp = 0;
  if (ok) { const fresh = !L.paid[L.k]; L.paid[L.k] = 1; xp = L.first && fresh ? (w ? 15 : 5) : 0; L.msg = ''; if (fresh) { s.daily.c++; if (w) s.codes++; if (st.err) s.bugs++; } hap('n', 'success'); if (xp) gain(xp); if (s.daily.c >= 3 && !s.daily.done) { s.daily.done = true; gain(50); toast('🎯 Задание дня выполнено!'); confetti(30); } }
  else { L.err++; if (s.lives === MAXL) s.livesAt = Date.now(); s.lives--; hap('n', 'error'); }
  L.fb = { ok, xp }; save(); drawL();
  if (!ok) { const z = $('#lesson'); z.style.animation = 'none'; z.offsetWidth; z.style.animation = 'shake .4s'; }
}
function nextS() { L.k++; L.fb = null; L.sel = null; L.h = 0; L.val = ''; L.msg = ''; L.k >= L.l.steps.length ? finish() : drawL(); }
function finish() {
  const first = L.first; let b = 0, proj = false; touch();
  if (first) { s.completed_lessons.push(L.l.id); b = 30; if (!L.t.hid && L.t.lessons.every(l => done(l.id)) && !s.completed_projects.includes(L.t.id)) { s.completed_projects.push(L.t.id); b += 100; proj = true; } }
  if (b) gain(b); pathBonus(); checkAch(); save(); confetti(70); hap('n', 'success');
  $('#lesson').innerHTML = `<div class="ov" style="position:static;flex:1"><h1>Отлично! 🎉</h1><p>Урок «${esc(L.l.title)}» пройден${L.err ? '' : ' без ошибок 💯'}</p><h2>${b ? '+' + b + ' XP' : 'Повторение'}</h2>${proj ? `<p>🏆 Проект «${esc(L.t.project)}» завершён!</p>` : ''}<button class="btn" onclick="closeL()">Продолжить</button>${navBtns()}</div>`;
}

const LANG = { web: 'markup', bot: 'python', mini: 'javascript', game: 'javascript', ai: 'javascript', git: 'markup', db: 'python', shop: 'python' };
function chk() { const st = L.l.steps[L.k], v = norm(L.val); return st.ans.map(norm).some(a => v === a || (a.endsWith('=') && v.startsWith(a) && v.length > a.length)) || (st.re || []).some(x => x.test(L.val.trim())); }
function hl(c) { const g = L.l.lang || LANG[L.t.id] || 'markup'; try { return Prism.highlight(c, Prism.languages[g], g); } catch (e) { return esc(c); } }
function goalById(id) { for (const k in GOALS) { const g = GOALS[k].find(x => x.id === id); if (g) return g; } return null; }
function vGoals() {
  return `<h1>Что ты хочешь создать?</h1>` + s.selected_tracks.map(tid => { const t = TRACKS.find(x => x.id === tid); return `<h3>${t.icon} ${t.title}</h3>` + GOALS[tid].map(g => `<button class="opt ${s.goals[tid] === g.id ? 'sel' : ''}" style="font-family:inherit" onclick="s.goals['${tid}']='${g.id}';hap('i','light');render()">${g.i} ${g.n}</button>`).join(''); }).join('') + `<button class="btn" style="margin-top:10px;${s.selected_tracks.every(t => s.goals[t]) ? '' : 'opacity:.4'}" onclick="buildPath()">Построить путь →</button>`;
}
function buildPath() {
  if (!s.selected_tracks.length) { toast('Сначала выбери направление'); ob = 2; return render(); }
  const miss = s.selected_tracks.find(t => !goalById(s.goals[t])); if (miss) { hap('n', 'warning'); return toast('Выбери цель: ' + TRACKS.find(x => x.id === miss).title); }
  const p = []; s.selected_tracks.forEach(t => goalById(s.goals[t]).p.forEach(id => p.includes(id) || p.push(id))); s.path = p; s.onb = 1; ob = 4; tab = 'path'; save(); hap('n', 'success'); confetti(); render(); }
function vMyPath() {
  if (!s.path.length) return `<h1>Мой путь</h1><div class="card"><p>Выбери, что хочешь создать, и я построю путь.</p><button class="btn" style="margin-top:10px" onclick="ob=2;render()">Выбрать цель</button></div>`;
  const d = s.path.filter(done).length, pc = Math.round(d / s.path.length * 100), nm = Object.values(s.goals).map(goalById).filter(Boolean).map(g => g.i + ' ' + g.n).join(', ');
  return `<h1>🚀 Мой путь</h1><div class="card"><b>🎯 Моя цель: ${esc(nm)}</b><div class="bar" style="margin:10px 0"><i style="width:${pc}%;background:var(--ok)"></i></div><p class="sub">${d}/${s.path.length} этапов · ${pc}%</p></div>` + s.path.map((id, i) => { const r = byId(id), dn = done(id), lk = !open_(r.t, r.i); return `<div class="card sec ${dn ? 'done' : ''} ${lk ? 'lock' : ''}" onclick="openLesson('${r.t.id}',${r.i})"><div class="n">${dn ? '✓' : lk ? '🔒' : i + 1}</div><div><b>${esc(r.t.lessons[r.i].title)}</b><div class="sub">${dn ? '✅ Пройдено' : lk ? '🔒 Заблокировано' : '▶️ Доступно'}</div></div></div>`; }).join('') + `<button class="btn ghost" style="margin-bottom:18px" onclick="ob=2;render()">Изменить цель</button>`;
}
function pathBonus() { const k = s.path.join(); s.pd = s.pd || []; if (s.path.length && s.path.every(done) && !s.pd.includes(k)) { s.pd.push(k); gain(150); toast('🏆 Твой проект готов! +150 XP'); } }
// BACKEND: AI работает через POST /api/ai (ключ AI хранится только на сервере)
async function askAI(message) { const response = await fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message }) }); if (!response.ok) throw new Error('no backend'); return await response.json(); }
const AI_STUB = '🤖 AI-наставник пока находится в разработке. Позже здесь можно будет отправлять свой код и получать объяснения от AI.';
async function sendAI(pre) {
  const v = $('#ai').value.trim(); if (!v) return toast('Напиши вопрос или вставь код');
  s.ai.push({ r: 'u', t: pre + v }); let r; try { r = (await askAI(pre + v)).reply || AI_STUB; } catch (e) { r = AI_STUB; }
  s.ai.push({ r: 'b', t: r }); s.ai = s.ai.slice(-20); save(); render();
}
function nextStep() {
  const q = s.path.length ? s.path : TRACKS.flatMap(x => x.lessons.map(l => l.id)), ci = q.findIndex(id => !done(id));
  let m; if (ci < 0) m = '🎉 Ты дошёл до конца этого пути!';
  else { const cur = byId(q[ci]).t.lessons[byId(q[ci]).i].title, nx = q[ci + 1] && byId(q[ci + 1]); m = 'Текущий урок: ' + cur + '\n' + (nx ? 'Следующий шаг: ' + nx.t.lessons[nx.i].title : '🎉 Это последний этап — пройди его, и ты дошёл до конца этого пути!'); }
  s.ai.push({ r: 'b', t: '🧭 ' + m }); s.ai = s.ai.slice(-20); save(); hap('i', 'light'); render();
}
function seq() { return s.path.includes(L.l.id) ? s.path : L.t.lessons.map(l => l.id); }
function nbr(d) { const q = seq(), id = q[q.indexOf(L.l.id) + d]; return id ? byId(id) : null; }
function navBtns() { const a = nbr(-1), b = nbr(1); return `<div class="sm" style="width:100%;margin-top:6px">${a ? `<button class="btn ghost" onclick="openLesson('${a.t.id}',${a.i})">← Предыдущий</button>` : ''}${b ? `<button class="btn ghost" onclick="openLesson('${b.t.id}',${b.i})">Следующий →</button>` : ''}</div>`; }
function backS() { hap('i', 'light'); if (L.k > 0) { L.k--; L.fb = null; L.sel = null; L.h = 0; L.val = ''; L.msg = ''; return drawL(); } const p = nbr(-1); p ? openLesson(p.t.id, p.i) : toast('Это первый этап пути'); }
function skipS() { const st = L.l.steps[L.k]; if (st.t === 'info' || st.t === 'code' || !L.first || L.fb) return nextS(); hap('n', 'warning'); toast('Сначала выполни задание'); }
function vAi() {
  return `<h1>🤖 AI Mentor</h1><div class="card">${s.ai.length ? s.ai.map(m => `<p style="white-space:pre-line;margin-bottom:10px;${m.r === 'u' ? 'text-align:right;color:var(--ac2)' : ''}">${m.r === 'u' ? '' : '🤖 '}${esc(m.t)}</p>`).join('') : '<p class="sub">Вставь код или опиши проблему.</p>'}</div><textarea id="ai" class="inp" rows="4" placeholder="Вставь код или вопрос"></textarea><div class="sm"><button class="btn ghost" onclick="sendAI('Дай подсказку: ')">💡 Подсказка</button><button class="btn ghost" onclick="sendAI('Объясни: ')">❓ Объяснить</button><button class="btn ghost" onclick="sendAI('Найди ошибку: ')">🐛 Найти ошибку</button><button class="btn ghost" onclick="nextStep()">➡️ Следующий шаг</button></div><button class="btn" style="margin-top:8px" onclick="sendAI('')">Отправить</button>${(() => { const n = nextL(); return n && !done(n.t.lessons[n.i].id) ? `<button class="btn ghost" style="margin-top:8px" onclick="openLesson('${n.t.id}',${n.i})">▶️ Открыть: ${esc(n.t.lessons[n.i].title)}</button>` : ''; })()}`;
}
s.path = s.path.filter(id => byId(id)); Object.keys(s.goals).forEach(k => { if (!goalById(s.goals[k])) delete s.goals[k]; });
checkAch(); save(); render();
