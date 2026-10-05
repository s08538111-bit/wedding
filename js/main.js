/* =====================================================================
   Логика сайта. Данные берутся из js/config.js — здесь ничего менять не нужно.
   ===================================================================== */
(function () {
  'use strict';

  window.__siteReady = true;

  var cfg = window.SITE || {};
  var root = document.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Помощники ---------- */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function get(obj, path) {
    return path.split('.').reduce(function (o, k) { return o == null ? undefined : o[k]; }, obj);
  }
  // Заглушка — это пустая строка или текст вида [ТАК]
  function isPlaceholder(v) { return typeof v !== 'string' || !v.trim() || /^\s*\[.*\]\s*$/.test(v); }
  function pad(n) { return String(n).padStart(2, '0'); }
  function plural(n, forms) {
    var a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return forms[2];
    if (b > 1 && b < 5) return forms[1];
    if (b === 1) return forms[0];
    return forms[2];
  }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  /* ---------- Дата и время ---------- */
  var target = new Date(cfg.dateISO);
  var dateValid = !isNaN(target.getTime());
  var view = Object.assign({}, cfg);
  if (cfg.dateText === 'auto' && dateValid) {
    view.dateText = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(target).replace(/\s*г\.$/, '');
  }
  if (cfg.timeText === 'auto' && dateValid) {
    view.timeText = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(target);
  }
  if (!dateValid) console.warn('[сайт] dateISO в js/config.js указан неверно — таймер не запущен.');

  var hideUnfilled = cfg.hideUnfilled !== false;

  /* ---------- Подстановка текстов из config.js ---------- */
  $$('[data-bind]').forEach(function (node) {
    var v = get(view, node.getAttribute('data-bind'));
    if (typeof v !== 'string') return;
    if (!v.trim() || (hideUnfilled && isPlaceholder(v))) { node.hidden = true; return; }
    node.hidden = false;
    if (node.hasAttribute('data-paragraphs')) {
      node.textContent = '';
      v.split(/\n\s*\n/).forEach(function (p) { node.appendChild(el('p', null, p.trim())); });
    } else {
      node.textContent = v;
    }
  });
  // Блоки, у которых главный текст не заполнен, скрываем целиком
  $$('[data-needs]').forEach(function (sec) {
    var v = get(view, sec.getAttribute('data-needs'));
    if (hideUnfilled && isPlaceholder(v)) sec.hidden = true;
  });
  if (!isPlaceholder(cfg.names)) {
    document.title = cfg.names + ' — приглашение на свадьбу';
  }

  /* ---------- Маршрут, карта, Telegram ---------- */
  var ev = cfg.event || {};
  var routeBtn = $('#routeBtn');
  var routeHref = '';
  if (/^https?:\/\//i.test(ev.routeUrl || '')) {
    routeHref = ev.routeUrl;
  } else if (!isPlaceholder(ev.address)) {
    var q = encodeURIComponent([ev.place, ev.address].filter(function (x) { return !isPlaceholder(x); }).join(', '));
    routeHref = ev.routeProvider === 'yandex'
      ? 'https://yandex.ru/maps/?text=' + q
      : 'https://www.google.com/maps/search/?api=1&query=' + q;
  }
  if (routeHref) { routeBtn.href = routeHref; routeBtn.hidden = false; }
  else { $('.actions').hidden = true; }

  if (/^https:\/\//i.test(ev.mapEmbedUrl || '')) {
    var frame = document.createElement('iframe');
    frame.src = ev.mapEmbedUrl;
    frame.title = 'Карта';
    frame.loading = 'lazy';
    frame.referrerPolicy = 'no-referrer-when-downgrade';
    frame.setAttribute('allowfullscreen', '');
    $('#mapWrap').appendChild(frame);
    $('#mapWrap').hidden = false;
  }

  var tg = cfg.telegram || {};
  if (/^https?:\/\//i.test(tg.url || '')) {
    var tgBtn = $('#tgBtn');
    tgBtn.href = tg.url;
    tgBtn.textContent = tg.buttonText || 'Перейти в Telegram';
    $('#chat').hidden = false;
  }

  /* ---------- Программа ---------- */
  var timeline = $('#timeline');
  ((cfg.program && cfg.program.items) || []).forEach(function (it, i) {
    if (hideUnfilled && isPlaceholder(it.time) && isPlaceholder(it.title)) return;
    var li = el('li', 'timeline__item');
    li.setAttribute('data-reveal', 'up');
    li.style.setProperty('--d', (i * 0.08) + 's');
    li.appendChild(el('span', 'timeline__time', it.time || ''));
    li.appendChild(el('span', 'timeline__mark'));
    var body = el('div', 'timeline__body');
    body.appendChild(el('p', 'timeline__title', it.title || ''));
    if (it.text) body.appendChild(el('p', 'timeline__text', it.text));
    li.appendChild(body);
    timeline.appendChild(li);
  });
  if (!timeline.children.length) $('#program').hidden = true;

  /* ---------- Дресс-код ---------- */
  var swatches = $('#swatches');
  ((cfg.dressCode && cfg.dressCode.colors) || []).forEach(function (c) {
    if (!/^#[0-9a-f]{3,8}$/i.test(c.hex || '')) return;
    var li = el('li', 'swatch');
    var dot = el('span', 'swatch__dot');
    dot.style.backgroundColor = c.hex;
    li.appendChild(dot);
    if (c.name) li.appendChild(el('span', 'swatch__name', c.name));
    swatches.appendChild(li);
  });
  if (!swatches.children.length) swatches.hidden = true;
  var dressText = (cfg.dressCode && cfg.dressCode.text) || '';
  if (!swatches.children.length && (!dressText.trim() || (hideUnfilled && isPlaceholder(dressText)))) $('#dresscode').hidden = true;

  /* ---------- Обратный отсчёт ---------- */
  var cd = {
    d: $('#cd-days'), h: $('#cd-hours'), m: $('#cd-minutes'), s: $('#cd-seconds'),
    dl: $('#cd-days-l'), hl: $('#cd-hours-l'), ml: $('#cd-minutes-l'), sl: $('#cd-seconds-l')
  };
  var cdFinished = $('#cd-finished');
  var cdTimer = null;

  function renderCountdown(days, hours, mins, secs) {
    cd.d.textContent = pad(days);  cd.dl.textContent = plural(days, ['день', 'дня', 'дней']);
    cd.h.textContent = pad(hours); cd.hl.textContent = plural(hours, ['час', 'часа', 'часов']);
    cd.m.textContent = pad(mins);  cd.ml.textContent = plural(mins, ['минута', 'минуты', 'минут']);
    cd.s.textContent = pad(secs);  cd.sl.textContent = plural(secs, ['секунда', 'секунды', 'секунд']);
  }
  function tick() {
    var diff = target.getTime() - Date.now();
    if (diff <= 0) {
      renderCountdown(0, 0, 0, 0);
      var msg = (cfg.countdown && cfg.countdown.finished) || '';
      if (msg) { cdFinished.textContent = msg; cdFinished.hidden = false; }
      if (cdTimer) clearInterval(cdTimer);
      return;
    }
    var total = Math.floor(diff / 1000);
    renderCountdown(Math.floor(total / 86400), Math.floor(total % 86400 / 3600), Math.floor(total % 3600 / 60), total % 60);
  }
  if (dateValid) {
    tick();
    cdTimer = setInterval(tick, 1000);
  } else {
    [cd.d, cd.h, cd.m, cd.s].forEach(function (n) { n.textContent = '--'; });
  }

  /* ---------- Появление при прокрутке ---------- */
  var revealStarted = false;
  function startReveal() {
    if (revealStarted) return;
    revealStarted = true;
    var items = $$('[data-reveal]');
    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (n) { n.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -4% 0px' });
    items.forEach(function (n) { io.observe(n); });
  }

  /* ---------- Лёгкий параллакс первого фото ---------- */
  var hero = $('.hero'), heroImg = $('.hero__img');
  if (hero && heroImg && !reduceMotion) {
    var ticking = false;
    var update = function () {
      var h = hero.offsetHeight, y = window.pageYOffset;
      if (y < h) heroImg.style.transform = 'translate3d(0,' + Math.min(y * 0.15, h * 0.05).toFixed(1) + 'px,0)';
      ticking = false;
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
  }

  /* ---------- Календарь месяца свадьбы ---------- */
  (function buildCalendar() {
    var box = $('#calendar-block');
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(cfg.dateISO || '');
    if (!box) return;
    if (!m || (cfg.calendar && cfg.calendar.enabled === false)) { box.hidden = true; return; }
    var year = +m[1], month = +m[2] - 1, day = +m[3];
    if (cfg.calendar && cfg.calendar.image) {
      $('#calendar').style.backgroundImage = 'linear-gradient(rgba(30,20,16,.10),rgba(30,20,16,.10)),url("' + cfg.calendar.image + '")';
    }
    var name = new Intl.DateTimeFormat('ru-RU', { month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month, 1)));
    $('#calTitle').textContent = name.charAt(0).toUpperCase() + name.slice(1) + ' ' + year;
    var grid = $('#calGrid');
    ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].forEach(function (d, i) {
      var c = el('div', 'cal__dow' + (i > 4 ? ' cal__dow--we' : ''), d);
      c.setAttribute('role', 'columnheader');
      grid.appendChild(c);
    });
    var offset = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7;   // неделя с понедельника
    var days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    for (var i = 0; i < offset; i++) grid.appendChild(el('div', 'cal__day'));
    for (var d = 1; d <= days; d++) {
      var col = (offset + d - 1) % 7;
      var cell = el('div', 'cal__day' + (col > 4 ? ' cal__day--we' : '') + (d === day ? ' cal__day--event' : ''), String(d));
      cell.setAttribute('role', 'cell');
      if (d === day) cell.setAttribute('aria-label', d + ' ' + name + ' — день свадьбы');
      grid.appendChild(cell);
    }
  })();

  /* ---------- Галерея: построение из config.js ---------- */
  var thumbs = [];
  (function buildGallery() {
    var sec = $('#gallery');
    var list = ((cfg.gallery && cfg.gallery.photos) || []).filter(function (p) { return p && p.src; });
    if (!list.length) { if (!(cfg.quote && cfg.quote.text)) sec.hidden = true; $('#galleryGrid').hidden = true; return; }
    var P = {
      1: ['W'], 2: ['T', 'T'], 3: ['W', 'T', 'T'], 4: ['T', 'N', 'N', 'W'],
      5: ['T', 'N', 'N', 'W', 'W'], 6: ['T', 'N', 'N', 'W', 'T', 'T']
    };
    var layout = [], n = list.length;
    while (n > 6) { layout = layout.concat(P[6]); n -= 6; }
    layout = layout.concat(P[n]);
    var grid = $('#galleryGrid');
    list.forEach(function (ph, i) {
      var b = el('button', 'gallery__item' + (layout[i] === 'T' ? ' g-tall' : layout[i] === 'W' ? ' g-wide' : ''));
      b.type = 'button';
      b.setAttribute('data-reveal', i % 2 ? 'right' : 'left');
      b.style.setProperty('--d', (i * 0.1) + 's');
      b.setAttribute('aria-label', 'Открыть фото ' + (i + 1));
      var img = document.createElement('img');
      img.src = ph.src; img.alt = ph.alt || ('Фотография ' + (i + 1));
      img.loading = 'lazy'; img.decoding = 'async';
      if (ph.pos) img.style.objectPosition = ph.pos;
      b.appendChild(img);
      grid.appendChild(b);
      thumbs.push(b);
    });
  })();

  /* ---------- Галерея: просмотр фото ---------- */
  var lb = $('#lightbox'), lbImg = $('#lbImg'), lbCount = $('#lbCount');
  var lbClose = $('#lbClose'), lbPrev = $('#lbPrev'), lbNext = $('#lbNext');
  var lbIndex = 0, lbOpener = null;

  function lbShow(i) {
    lbIndex = (i + thumbs.length) % thumbs.length;
    var img = $('img', thumbs[lbIndex]);
    lbImg.style.opacity = 0;
    lbImg.onload = function () { lbImg.style.opacity = 1; };
    lbImg.src = img.currentSrc || img.src;
    lbImg.alt = img.alt;
    lbCount.textContent = (lbIndex + 1) + ' из ' + thumbs.length;
    if (lbImg.complete) lbImg.style.opacity = 1;
  }
  function lbOpen(i, opener) {
    lbOpener = opener;
    lb.hidden = false;
    lbShow(i);
    requestAnimationFrame(function () { lb.classList.add('is-open'); });
    root.classList.add('is-locked');
    lbClose.focus();
  }
  function lbHide() {
    lb.classList.remove('is-open');
    setTimeout(function () { lb.hidden = true; }, 350);
    root.classList.remove('is-locked');
    if (lbOpener) lbOpener.focus();
  }
  thumbs.forEach(function (t, i) { t.addEventListener('click', function () { lbOpen(i, t); }); });
  lbClose.addEventListener('click', lbHide);
  lbPrev.addEventListener('click', function () { lbShow(lbIndex - 1); });
  lbNext.addEventListener('click', function () { lbShow(lbIndex + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb || e.target.tagName === 'FIGURE') lbHide(); });
  document.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') lbHide();
    else if (e.key === 'ArrowLeft') lbShow(lbIndex - 1);
    else if (e.key === 'ArrowRight') lbShow(lbIndex + 1);
    else if (e.key === 'Tab') {
      var f = [lbClose, lbPrev, lbNext], i = f.indexOf(document.activeElement);
      e.preventDefault();
      f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
  });
  var touchX = null;
  lb.addEventListener('touchstart', function (e) { touchX = e.changedTouches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    if (touchX === null) return;
    var dx = e.changedTouches[0].clientX - touchX;
    touchX = null;
    if (Math.abs(dx) > 50) lbShow(lbIndex + (dx < 0 ? 1 : -1));
  }, { passive: true });

  /* ---------- Анкета ---------- */
  var form = $('#rsvpForm');
  var rsvp = cfg.rsvp || {};
  var statusEl = $('#formStatus');
  var submitBtn = $('#submitBtn');
  submitBtn.textContent = rsvp.submitText || 'Отправить';

  var uid = 0;
  function buildField(f) {
    var isGroup = f.type === 'radio' || f.type === 'checkbox';
    var wrap = el(isGroup ? 'fieldset' : 'div', 'field');
    var id = 'f-' + (++uid);
    if (f.showIf) wrap.setAttribute('data-show-if', f.showIf);
    var label = el(isGroup ? 'legend' : 'label', 'field__label', f.label || '');
    if (!isGroup) label.setAttribute('for', id);
    wrap.appendChild(label);

    if (isGroup) {
      var box = el('div', 'choices');
      (f.options || []).forEach(function (opt) {
        var l = el('label', 'choice');
        var inp = document.createElement('input');
        inp.type = f.type; inp.name = f.name; inp.value = opt;
        if (f.required && f.type === 'radio') inp.required = true;
        l.appendChild(inp);
        l.appendChild(el('span', null, opt));
        box.appendChild(l);
      });
      wrap.appendChild(box);
    } else {
      var ctl = f.type === 'textarea' ? document.createElement('textarea') : document.createElement('input');
      if (f.type !== 'textarea') ctl.type = f.type === 'number' ? 'number' : 'text';
      ctl.className = 'input'; ctl.id = id; ctl.name = f.name;
      if (f.required) ctl.required = true;
      if (f.min != null) ctl.min = f.min;
      if (f.max != null) ctl.max = f.max;
      if (f.type === 'number') ctl.inputMode = 'numeric';
      wrap.appendChild(ctl);
    }
    return wrap;
  }
  var extra = $('#rsvpExtra');
  (rsvp.fields || []).forEach(function (f) { extra.appendChild(buildField(f)); });

  // Показ/скрытие вопросов, зависящих от ответа (showIf: "attend=Да")
  function updateConditional() {
    $$('[data-show-if]', form).forEach(function (w) {
      var parts = w.getAttribute('data-show-if').split('=');
      var field = form.elements[parts[0]];
      var current = field && field.value !== undefined ? field.value : '';
      var show = current === parts[1];
      w.hidden = !show;
      $$('input, textarea, select', w).forEach(function (c) { c.disabled = !show; });
    });
  }
  form.addEventListener('change', updateConditional);
  updateConditional();

  function setStatus(text, kind) {
    statusEl.textContent = text || '';
    statusEl.className = 'form__status' + (kind ? ' form__status--' + kind : '');
  }

  function collect() {
    var fd = new FormData(form), out = {};
    fd.forEach(function (_, key) {
      if (key === '_gotcha' || key in out) return;
      out[key] = fd.getAll(key).join(', ');
    });
    out.submitted_at = new Date().toISOString();
    return out;
  }

  function send(payload) {
    var type = rsvp.type, url = rsvp.endpoint;
    if (type === 'googleSheets') {
      // Apps Script не отдаёт CORS-заголовки, поэтому ответ прочитать нельзя:
      // мы узнаём только, что запрос ушёл. Проверяйте таблицу.
      return fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: new URLSearchParams(payload).toString()
      });
    }
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); });
  }

  function showThanks() {
    $('#thanksTitle').textContent = rsvp.successTitle || 'Спасибо!';
    $('#thanksText').textContent = rsvp.successText || 'Ваш ответ отправлен.';
    form.hidden = true;
    $('#thanks').hidden = false;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.reportValidity()) return;
    setStatus('');

    // Спам-бот заполнил скрытое поле — делаем вид, что всё хорошо, ничего не отправляя
    if (form.elements._gotcha && form.elements._gotcha.value) { showThanks(); return; }

    var configured = rsvp.endpoint && /^https:\/\//i.test(rsvp.endpoint) && (rsvp.type === 'formspree' || rsvp.type === 'googleSheets');
    if (!configured) {
      setStatus('Демо-режим: форма ещё не подключена к сервису, ответ никуда не отправлен. Инструкция — в README.md.', 'warn');
      console.info('[сайт] Данные формы (не отправлены):', collect());
      return;
    }

    submitBtn.disabled = true;
    var prev = submitBtn.textContent;
    submitBtn.textContent = 'Отправляем…';
    send(collect()).then(showThanks).catch(function () {
      setStatus('Не удалось отправить. Проверьте интернет и нажмите «' + prev + '» ещё раз.', 'error');
    }).then(function () {
      submitBtn.disabled = false;
      submitBtn.textContent = prev;
    });
  });

  /* ---------- Музыка ---------- */
  var music = cfg.music || {};
  var musicBtn = $('#musicBtn');
  var audio = null, musicFailed = false, resumeAfterHidden = false;

  function musicUi(playing) {
    musicBtn.classList.toggle('is-playing', playing);
    musicBtn.setAttribute('aria-pressed', String(playing));
    musicBtn.setAttribute('aria-label', playing ? 'Выключить музыку' : 'Включить музыку');
  }
  if (music.src) {
    audio = new Audio();
    audio.loop = true;
    audio.preload = 'metadata';
    audio.volume = typeof music.volume === 'number' ? Math.min(1, Math.max(0, music.volume)) : 0.7;
    audio.addEventListener('error', function () {
      musicFailed = true;
      musicBtn.hidden = true;
      console.info('[сайт] Музыкальный файл не найден или не поддерживается: ' + music.src + '. Кнопка музыки скрыта.');
    });
    audio.src = music.src;
    audio.addEventListener('play', function () { musicUi(true); });
    audio.addEventListener('pause', function () { musicUi(false); });
    musicBtn.addEventListener('click', function () {
      if (audio.paused) { var p = audio.play(); if (p && p.catch) p.catch(function () { musicUi(false); }); }
      else audio.pause();
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden && !audio.paused) { resumeAfterHidden = true; audio.pause(); }
      else if (!document.hidden && resumeAfterHidden) { resumeAfterHidden = false; audio.play().catch(function () {}); }
    });
  }

  /* ---------- Заставка и запуск ---------- */
  var intro = $('#intro');
  var opened = false;

  function openSite() {
    if (opened) return;
    opened = true;
    root.classList.add('is-opened');
    root.classList.remove('is-locked');
    window.scrollTo(0, 0);

    // play() вызывается прямо внутри нажатия — иначе мобильные браузеры его запретят
    if (audio && !musicFailed) {
      musicBtn.hidden = false;
      if (music.startOnOpen !== false) {
        var p = audio.play();
        if (p && p.catch) p.catch(function () { musicUi(false); });
      }
    }

    if (intro) {
      intro.classList.add('is-hiding');
      setTimeout(function () { intro.hidden = true; }, 1200);
    }
    setTimeout(startReveal, intro ? 450 : 0);
  }

  if (intro && cfg.intro && cfg.intro.enabled === false) { intro.hidden = true; intro = null; }
  if (intro) {
    intro.addEventListener('click', openSite);
  } else {
    openSite();
  }
})();
