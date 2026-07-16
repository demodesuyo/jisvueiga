/* main.js — 映画監督になろう
   構成: reveal / ヘッダー状態 / ハンバーガー / フォーム検証 / モーション停止(基盤・削除禁止)
        + 文字分割点灯 / 映写光の塵パーティクル(シグネチャー) */

document.addEventListener("DOMContentLoaded", () => {
  initReveal();
  initHeader();
  initNav();
  initForm();
  initMotionStop();
  initChars();
  initDust();
  initLogo();
  initUtilityNav();
  initTicker();
  initTheater();
  initBookmarks();
});

/* ---- スクロールリビール ---- */
function initReveal() {
  const targets = document.querySelectorAll(".js-reveal");
  if (!targets.length) return;
  if (!("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("is-inview"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-inview");
          io.unobserve(e.target);
        }
      });
    },
    { rootMargin: "0px 0px -12% 0px" }
  );
  targets.forEach((el) => io.observe(el));
}

/* ---- ヘッダー: スクロールで背景 ---- */
function initHeader() {
  const header = document.querySelector(".site-header");
  if (!header) return;
  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 40);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  const setH = () =>
    document.documentElement.style.setProperty("--header-h", header.offsetHeight + "px");
  setH();
  window.addEventListener("resize", setH, { passive: true });
  if ("ResizeObserver" in window) new ResizeObserver(setH).observe(header);
}

/* ---- ハンバーガー(a11y構造は削除禁止) ---- */
function initNav() {
  const btn = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".global-nav");
  if (!btn || !nav) return;
  btn.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    btn.setAttribute("aria-expanded", String(open));
    btn.setAttribute("aria-label", open ? "メニューを閉じる" : "メニューを開く");
    document.body.style.overflow = open ? "hidden" : "";
  });
  nav.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      nav.classList.remove("is-open");
      btn.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    })
  );
}

/* ---- フォーム: 検証+ハニーポット+二重送信防止 ----
   data-demo 付きのフォームは送信せずサンクスページへ遷移(公開時はFormspree等の
   action を設定して data-demo を外す。手順はREADME参照) */
function initForm() {
  const form = document.querySelector(".js-contact-form");
  if (!form) return;

  const showError = (field, msg) => {
    const err = form.querySelector(`[data-error-for="${field.id}"]`);
    field.setAttribute("aria-invalid", msg ? "true" : "false");
    if (err) err.textContent = msg;
  };

  const validators = {
    name: (v) => (v.trim() ? "" : "お名前を入力してください"),
    email: (v) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
        ? ""
        : "メールアドレスの形式が正しくありません",
    message: (v) => (v.trim() ? "" : "内容を入力してください"),
  };

  form.addEventListener("submit", (e) => {
    const hp = form.querySelector(".form__hp input");
    if (hp && hp.value) {
      e.preventDefault();
      return;
    }
    let firstBad = null;
    Object.keys(validators).forEach((id) => {
      const field = form.querySelector(`#${id}`);
      if (!field) return;
      const msg = validators[id](field.value);
      showError(field, msg);
      if (msg && !firstBad) firstBad = field;
    });
    if (firstBad) {
      e.preventDefault();
      firstBad.focus();
      return;
    }
    const btn = form.querySelector('[type="submit"]');
    if (btn) {
      btn.disabled = true;
      btn.textContent = "送信しています…";
    }
    if (form.hasAttribute("data-demo")) {
      e.preventDefault();
      window.location.href = form.getAttribute("data-thanks") || "thanks/";
    }
  });
}

/* ---- モーション停止(ポリシー実装・削除禁止) ---- */
function initMotionStop() {
  const btn = document.querySelector(".motion-stop");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const off = document.documentElement.classList.toggle("is-motion-off");
    btn.textContent = off ? "アニメーションを再生する" : "アニメーションを停止する";
  });
}

/* ---- 文字分割: [data-chars] を1文字ずつ span.char 化(点灯用) ----
   見出しはCSS側で white-space: nowrap(折返し事故防止) */
function initChars() {
  document.querySelectorAll("[data-chars]").forEach((el) => {
    const text = el.textContent;
    el.textContent = "";
    el.setAttribute("aria-label", text);
    [...text].forEach((ch, i) => {
      const s = document.createElement("span");
      s.className = "char";
      s.style.setProperty("--char-i", i);
      s.setAttribute("aria-hidden", "true");
      s.textContent = ch;
      el.appendChild(s);
    });
  });
}

/* ---- 日本の四季(v2.0): スクロールで春→夏→秋→冬 ----
   [data-season]セクションの位置から現在の季節を割り出し、
   背景・差し色・舞う粒をなめらかにクロスフェードする。
   下層ページ(マーカーなし)は今日の日付の季節で固定。 */
const SEASONS = [
  { name: "spring", grad: ["#fffafc", "#fdf1f6", "#fbe9f1"], accent: [201, 100, 127] },
  { name: "summer", grad: ["#f6fbf3", "#eef8ec", "#f3f7e0"], accent: [74, 135, 92] },
  { name: "autumn", grad: ["#fdfaf4", "#faf0e3", "#f5e6d5"], accent: [180, 100, 52] },
  { name: "winter", grad: ["#f8fbfd", "#f2f6fa", "#edf2f7"], accent: [86, 124, 156] },
];

function gradCss(g) {
  return `linear-gradient(180deg, ${g[0]} 0%, ${g[1]} 50%, ${g[2]} 100%)`;
}

function initDust() {
  const bg = document.createElement("div");
  bg.className = "season-bg";
  bg.setAttribute("aria-hidden", "true");
  bg.innerHTML = '<div class="season-bg__a"></div><div class="season-bg__b"></div>';
  document.body.prepend(bg);
  const layerA = bg.querySelector(".season-bg__a");
  const layerB = bg.querySelector(".season-bg__b");

  const canvas = document.createElement("canvas");
  canvas.className = "season-canvas";
  canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(canvas);
  const ctx = canvas.getContext("2d");

  let w, h, dpr, raf;
  const SP = window.matchMedia("(max-width: 767px)").matches;

  // --- 季節ブレンド ---
  const markers = [...document.querySelectorAll("[data-season]")];
  const order = { spring: 0, summer: 1, autumn: 2, winter: 3 };
  let idxA = 0, idxB = 0, blend = 0, winterP = 0;

  function seasonByDate() {
    const m = new Date().getMonth() + 1;
    if (m >= 3 && m <= 5) return 0;
    if (m >= 6 && m <= 8) return 1;
    if (m >= 9 && m <= 11) return 2;
    return 3;
  }

  function computeBlend() {
    const doc = document.documentElement;
    if (!markers.length) {
      idxA = idxB = seasonByDate();
      blend = 0;
      winterP = Math.min(window.scrollY / Math.max(doc.scrollHeight - h, 1) * 1.6, 1);
      return;
    }
    const ref = window.scrollY + h * 0.45;
    const zones = markers.map((el) => ({ s: order[el.dataset.season] ?? 0, top: el.offsetTop }));
    let cur = zones[0], next = null;
    for (let k = 0; k < zones.length; k++) {
      if (ref >= zones[k].top) { cur = zones[k]; next = zones[k + 1] || null; }
    }
    idxA = cur.s;
    if (next && next.s !== cur.s) {
      const FADE = h * 0.5;
      idxB = next.s;
      blend = Math.min(Math.max(1 - (next.top - ref) / FADE, 0), 1);
    } else { idxB = idxA; blend = 0; }
    const wz = zones.filter((z) => z.s === 3)[0];
    winterP = wz ? Math.min(Math.max((ref - wz.top) / Math.max(doc.scrollHeight - wz.top, 1) * 1.5, 0), 1) : 0;
  }

  function applyBlend() {
    layerA.style.background = gradCss(SEASONS[idxA].grad);
    layerB.style.background = gradCss(SEASONS[idxB].grad);
    layerB.style.opacity = String(blend);
    const a = SEASONS[idxA].accent, b = SEASONS[idxB].accent;
    const c = a.map((v, k) => Math.round(v + (b[k] - v) * blend));
    const root = document.documentElement.style;
    root.setProperty("--color-accent", `rgb(${c[0]}, ${c[1]}, ${c[2]})`);
    root.setProperty("--accent-rgb", `${c[0]} ${c[1]} ${c[2]}`);
  }

  const weight = (i) => (idxA === i ? 1 - blend : 0) + (idxB === i ? blend : 0);

  // --- 舞う粒(花びら/光/紅葉/雪) ---
  const parts = [];
  const BASE = SP ? 40 : 70;

  function spawnPart() {
    const which = Math.random() < blend ? idxB : idxA;
    const name = SEASONS[which].name;
    const base = { type: name, x: Math.random() * w, ph: Math.random() * Math.PI * 2 };
    if (name === "spring") return { ...base, y: -12, r: 5 + Math.random() * 3.5,
      vy: 0.45 + Math.random() * 0.5, vx: 0.35 + Math.random() * 0.45,
      rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.035,
      color: `rgba(${250 + Math.random() * 5}, ${214 + Math.random() * 16}, ${226 + Math.random() * 14}, 0.7)` };
    if (name === "summer") return { ...base, y: h + 10, r: 1.2 + Math.random() * 2,
      vy: -(0.18 + Math.random() * 0.3), vx: 0 };
    if (name === "autumn") return { ...base, y: -14, r: 4.5 + Math.random() * 3.5,
      vy: 0.6 + Math.random() * 0.6, vx: 0.15,
      rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.08,
      color: ["rgba(224,150,102,0.7)", "rgba(230,176,118,0.7)", "rgba(207,128,96,0.7)"][Math.floor(Math.random() * 3)] };
    return { ...base, y: -8, r: 1 + Math.random() * 2.2,
      vy: 0.3 + Math.random() * 0.45, vx: 0 };
  }

  function drawPart(p) {
    if (p.type === "spring") {
      const r = p.r;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.moveTo(0, r);
      ctx.bezierCurveTo(-r * 0.9, r * 0.5, -r * 1.0, -r * 0.5, -r * 0.42, -r * 0.92);
      ctx.lineTo(-r * 0.16, -r * 1.0);
      ctx.lineTo(0, -r * 0.42);                                      // 深い切れ込み
      ctx.lineTo(r * 0.16, -r * 1.0);
      ctx.lineTo(r * 0.42, -r * 0.92);
      ctx.bezierCurveTo(r * 1.0, -r * 0.5, r * 0.9, r * 0.5, 0, r);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else if (p.type === "summer") {
      const tw = 0.15 + Math.abs(Math.sin(p.ph)) * 0.3;
      ctx.fillStyle = `rgba(240, 220, 140, ${tw})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === "autumn") {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.moveTo(0, -p.r);
      ctx.quadraticCurveTo(p.r * 0.9, 0, 0, p.r);
      ctx.quadraticCurveTo(-p.r * 0.9, 0, 0, -p.r);
      ctx.fill();
      ctx.restore();
    } else {
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // --- 地面の風景(向日葵畑/コキア/梅の枝) ---
  let flowersF, flowersB, kochiaF, kochiaB, plumSlots;
  function buildScenery() {
    const mk = (n, fn) => Array.from({ length: n }, (_, k) => fn(k, n));
    flowersB = mk(SP ? 6 : 11, (k, n) => ({ fx: (k + 0.3 + Math.random() * 0.4) / n,
      hgt: 26 + Math.random() * 20, size: 6 + Math.random() * 3.5, ph: Math.random() * 6.3 }));
    flowersF = mk(SP ? 5 : 9, (k, n) => ({ fx: (k + 0.2 + Math.random() * 0.6) / n,
      hgt: 48 + Math.random() * 40, size: 10 + Math.random() * 6, ph: Math.random() * 6.3 }));
    kochiaB = mk(Math.ceil(w / 46), (k, n) => ({ fx: (k + Math.random() * 0.8) / n,
      r: 14 + Math.random() * 9, dy: Math.random() * 6 }));
    kochiaF = mk(Math.ceil(w / 56), (k, n) => ({ fx: (k + Math.random() * 0.8) / n,
      r: 19 + Math.random() * 11, dy: Math.random() * 8 }));
    // 梅: 右上から伸びる枝と、ほころぶ順番(しきい値)つきの花
    plumSlots = mk(11, (k) => ({ t: 0.12 + (k / 11) * 0.82 + Math.random() * 0.04,
      off: (Math.random() - 0.5) * 26, side: Math.random() < 0.5 ? -1 : 1,
      th: 0.08 + (k / 11) * 0.75 + Math.random() * 0.08,
      size: 4.5 + Math.random() * 2.5 }));
  }

  function meadow(alpha, color) {
    const g = ctx.createLinearGradient(0, h - 76, 0, h);
    g.addColorStop(0, color.replace("A)", "0)"));
    g.addColorStop(1, color.replace("A)", `${0.65 * alpha})`));
    ctx.fillStyle = g;
    ctx.fillRect(0, h - 76, w, 76);
  }

  function drawSunflowerField(alpha, now) {
    meadow(alpha, "rgba(206, 228, 182, A)");
    for (const rows of [[flowersB, 0.55], [flowersF, 1]]) {
      const [list, depth] = rows;
      for (const f of list) {
        const sway = Math.sin(now / 1500 + f.ph) * 3.5 * depth;
        const x = f.fx * w + sway, yHead = h - f.hgt * depth - 6;
        ctx.strokeStyle = `rgba(122, 158, 108, ${0.6 * alpha * depth})`;
        ctx.lineWidth = 2 * depth;
        ctx.beginPath();
        ctx.moveTo(f.fx * w, h + 2);
        ctx.quadraticCurveTo(f.fx * w, yHead + f.hgt * 0.5, x, yHead);
        ctx.stroke();
        for (let k = 0; k < 12; k++) {
          const ang = (k / 12) * Math.PI * 2 + sway * 0.02;
          ctx.save();
          ctx.translate(x, yHead);
          ctx.rotate(ang);
          ctx.fillStyle = `rgba(243, 208, 96, ${0.85 * alpha * (0.7 + 0.3 * depth)})`;
          ctx.beginPath();
          ctx.ellipse(f.size * 0.95, 0, f.size * 0.5, f.size * 0.2, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        ctx.fillStyle = `rgba(134, 96, 56, ${0.85 * alpha})`;
        ctx.beginPath();
        ctx.arc(x, yHead, f.size * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawKochiaField(alpha, now) {
    meadow(alpha, "rgba(233, 204, 186, A)");
    for (const rows of [[kochiaB, 0.55, "rgba(228, 174, 178, A)"], [kochiaF, 1, "rgba(216, 148, 154, A)"]]) {
      const [list, depth, col] = rows;
      for (const b of list) {
        const x = b.fx * w + Math.sin(now / 2400 + b.fx * 9) * 1.5;
        const y = h - 8 - b.dy * depth;
        ctx.fillStyle = col.replace("A)", `${0.7 * alpha * (0.65 + 0.35 * depth)})`);
        ctx.beginPath();
        ctx.ellipse(x, y, b.r * depth, b.r * 1.18 * depth, 0, Math.PI, 0);
        ctx.fill();
      }
    }
  }

  function bez(t, a, b, c, d) {
    const u = 1 - t;
    return u*u*u*a + 3*u*u*t*b + 3*u*t*t*c + t*t*t*d;
  }
  function drawPlum(alpha, bloom, now) {
    // 雪の積もる地面
    meadow(alpha, "rgba(255, 255, 255, A)");
    // 右上から伸びる枝
    const x0 = w + 12, y0 = h * 0.10, x3 = w * (SP ? 0.3 : 0.55), y3 = h * 0.34;
    const x1 = w * 0.88, y1 = h * 0.10, x2 = w * (SP ? 0.55 : 0.72), y2 = h * 0.32;
    ctx.strokeStyle = `rgba(104, 82, 90, ${0.55 * alpha})`;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.bezierCurveTo(x1, y1, x2, y2, x3, y3);
    ctx.stroke();
    // 花: winterの進み(bloom)に応じてポツポツとほころぶ
    for (const s of plumSlots) {
      if (bloom < s.th) continue;
      const open = Math.min((bloom - s.th) * 7, 1);
      const bx = bez(s.t, x0, x1, x2, x3);
      const by = bez(s.t, y0, y1, y2, y3) + s.off * 0.4 + s.side * 5;
      const r = s.size * open;
      for (let k = 0; k < 5; k++) {
        const ang = (k / 5) * Math.PI * 2;
        ctx.fillStyle = `rgba(250, 224, 232, ${0.9 * alpha * open})`;
        ctx.beginPath();
        ctx.arc(bx + Math.cos(ang) * r * 0.62, by + Math.sin(ang) * r * 0.62, r * 0.46, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = `rgba(214, 148, 122, ${0.85 * alpha * open})`;
      ctx.beginPath();
      ctx.arc(bx, by, r * 0.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function tick(now) {
    if (document.documentElement.classList.contains("is-motion-off")) {
      ctx.clearRect(0, 0, w, h);
      raf = requestAnimationFrame(tick);
      return;
    }
    computeBlend();
    applyBlend();
    ctx.clearRect(0, 0, w, h);

    // 地面の風景(粒より奥)
    const wSu = weight(1), wAu = weight(2), wWi = weight(3), wSpr = weight(0);
    if (wSu > 0.04) drawSunflowerField(wSu, now);
    if (wAu > 0.04) drawKochiaField(wAu, now);
    if (wWi > 0.04) drawPlum(wWi, winterP, now);

    // 舞う粒: 桜吹雪は多め、夏は控えめ
    const target = Math.round(BASE * (1 + 0.9 * wSpr - 0.45 * wSu + 0.25 * wWi));
    while (parts.length < target) parts.push(spawnPart());
    for (let k = parts.length - 1; k >= 0; k--) {
      const p = parts[k];
      p.ph += 0.02;
      p.y += p.vy;
      p.x += (p.vx || 0) + Math.sin(p.ph) * (p.type === "summer" ? 0.2 : 0.5);
      if (p.rot !== undefined) p.rot += p.vr;
      if (p.y > h + 20 || p.y < -24 || p.x > w + 30) { parts.splice(k, 1); continue; }
      if (parts.length > target && Math.random() < 0.01) { parts.splice(k, 1); continue; }
      drawPart(p);
    }

    raf = requestAnimationFrame(tick);
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildScenery();
  }

  resize();
  computeBlend();
  applyBlend();
  window.addEventListener("resize", resize, { passive: true });
  raf = requestAnimationFrame(tick);
}

/* ---- ユーティリティ帯(v1.2): 全ページのヘッダーに自動挿入 ---- */
function initUtilityNav() {
  const header = document.querySelector(".site-header");
  if (!header) return;
  const here = location.pathname.split("/").pop() || "index.html";
  const items = [
    { href: "bookmark.html", label: "ブックマーク", ic: "★", id: "u-bm" },
    { href: "countries.html", label: "国から探す", ic: "◎" },
    { href: "works.html", label: "新着作品", ic: "▶" },
    { href: "about.html", label: "このサイトについて", ic: "✦" },
  ];
  const nav = document.createElement("nav");
  nav.className = "utility-nav";
  nav.setAttribute("aria-label", "クイックメニュー");
  nav.innerHTML = "<ul>" + items.map((i) => {
    const cur = here === i.href ? ' aria-current="page"' : "";
    const count = i.id === "u-bm" ? ' <span class="u-count" data-bm-count></span>' : "";
    return `<li><a href="${i.href}"${cur}><span class="u-ic" aria-hidden="true">${i.ic}</span>${i.label}${count}</a></li>`;
  }).join("") + "</ul>";
  header.appendChild(nav);
  updateBmCount();
}

/* ---- ブックマーク(v1.2): このブラウザに保存(ログイン不要) ---- */
const BM_KEY = "um-bookmarks";

function bmLoad() {
  try { return JSON.parse(localStorage.getItem(BM_KEY)) || []; } catch (e) { return []; }
}
function bmSave(list) {
  try { localStorage.setItem(BM_KEY, JSON.stringify(list)); } catch (e) {}
  updateBmCount();
}
function updateBmCount() {
  const el = document.querySelector("[data-bm-count]");
  if (el) {
    const n = bmLoad().length;
    el.textContent = n > 0 ? String(n) : "";
  }
}

function initBookmarks() {
  // 作品カードに★ボタンを付ける
  document.querySelectorAll(".film-card").forEach((card) => {
    const poster = card.querySelector(".film-card__poster");
    const title = card.querySelector(".film-card__title");
    const meta = card.querySelector(".film-card__meta");
    const img = card.querySelector("img");
    if (!poster || !title) return;
    const item = {
      id: title.textContent.trim(),
      title: title.textContent.trim(),
      meta: meta ? meta.textContent.trim() : "",
      img: img ? img.getAttribute("src") : "",
    };
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "bm-btn";
    const isOn = () => bmLoad().some((b) => b.id === item.id);
    const paint = () => {
      const on = isOn();
      btn.classList.toggle("is-on", on);
      btn.textContent = on ? "★" : "☆";
      btn.setAttribute("aria-label", on ? `${item.title}のブックマークを解除` : `${item.title}をブックマーク`);
      btn.setAttribute("aria-pressed", String(on));
    };
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      let list = bmLoad();
      if (isOn()) list = list.filter((b) => b.id !== item.id);
      else list.push(item);
      bmSave(list);
      paint();
    });
    paint();
    poster.appendChild(btn);
  });

  // ブックマーク一覧ページの描画
  const listEl = document.querySelector("#bookmark-list");
  if (listEl) renderBookmarkPage(listEl);
}

function renderBookmarkPage(listEl) {
  const list = bmLoad();
  if (!list.length) {
    listEl.innerHTML = '<p class="bm-empty">まだブックマークがありません。<a href="works.html">作品一覧</a>でポスターの☆を押すと、ここに並びます。</p>';
    return;
  }
  listEl.className = "works-grid";
  listEl.innerHTML = list.map((b) => `
    <div class="film-card">
      <div class="film-card__poster"><img src="${b.img}" alt="${b.title}" loading="lazy"></div>
      <p class="film-card__title">${b.title}</p>
      <p class="film-card__meta">${b.meta}</p>
    </div>`).join("");
  // 一覧側の★も動くように再スキャン
  listEl.querySelectorAll(".film-card").forEach(() => {});
  initBookmarksOnRendered(listEl);
}

function initBookmarksOnRendered(scope) {
  scope.querySelectorAll(".film-card").forEach((card) => {
    const poster = card.querySelector(".film-card__poster");
    const title = card.querySelector(".film-card__title").textContent.trim();
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "bm-btn is-on";
    btn.textContent = "★";
    btn.setAttribute("aria-label", `${title}のブックマークを解除`);
    btn.addEventListener("click", () => {
      bmSave(bmLoad().filter((b) => b.id !== title));
      renderBookmarkPage(document.querySelector("#bookmark-list"));
    });
    poster.appendChild(btn);
  });
}

/* ---- ロゴ画像(v2.2): テキストロゴを画像に差し替え ---- */
function initLogo() {
  const logo = document.querySelector(".site-header__logo");
  if (!logo) return;
  const img = document.createElement("img");
  img.src = "logo.png";
  img.alt = "自主映画ねっと";
  img.width = 616;
  img.height = 120;
  logo.textContent = "";
  logo.appendChild(img);
}

/* ---- のぼりティッカー(v2.3): ピックアップ/スポンサー/ファンからののぼり ----
   ▼ 掲載内容はこの配列を書き換えるだけ(上から順に流れます)
   type: "pick"=今週の1本 / "sponsor"=協賛 / "nobori"=ファンからの応援のぼり */
const TICKER_ITEMS = [
  { type: "pick", text: "今週の1本 『にわか雨（소나기）』 🇰🇷 韓国・22分 ── 夕立に足止めされたふたりの、ひと夏の掌編。" },
  { type: "cheer", text: "『青い街』ロドリゴ監督へ ── 日本から応援しています！（シネマ好き・東京）" },
  { type: "sponsor", text: "協賛: ミナト現像所（サンプル）── 自主映画の上映を応援しています" },
  { type: "cheer", text: "『にわか雨』ハン監督へ ── 次回作も楽しみに待ってます！（雨の日会・大阪）" },
  { type: "info", text: "監督に応援メッセージを送ろう → あなたの声をここに掲載できます（お問い合わせから）" },
];
const TICKER_HREF = "contact.html";
const TAG_LABEL = { pick: "PICK UP", sponsor: "SPONSOR", cheer: "応援", info: "INFO" };

function initTicker() {
  const header = document.querySelector(".site-header");
  if (!header) return;
  const a = document.createElement("a");
  a.className = "ticker";
  a.href = TICKER_HREF;
  a.setAttribute("aria-label", "ピックアップ・協賛・応援メッセージのお知らせ(タップで申し込みへ)");
  const text = TICKER_ITEMS.map((it) =>
    `<span class="tk-item"><span class="tk-tag">${TAG_LABEL[it.type] || ""}</span>${it.text}</span>`
  ).join("");
  a.innerHTML = `<div class="ticker__track"><span style="display:inline-flex;gap:56px;">${text}</span><span aria-hidden="true" style="display:inline-flex;gap:56px;">${text}</span></div>`;
  header.appendChild(a);
  // 中身の長さに応じて速度を一定に(約30px/秒のゆったり)
  const track = a.querySelector(".ticker__track");
  requestAnimationFrame(() => {
    const half = track.scrollWidth / 2;
    track.style.animationDuration = Math.max(36, Math.round(half / 30)) + "s";
  });
}

/* ---- ピックアップシアター(v2.3): ヒーローの映画館スクリーン ----
   ▼ youtubeId に動画ID(例: "dQw4w9WgXcQ")を入れると、タップで再生されます。
      空("")の間は「上映準備中」のポスター表示になります。 */
const PICKUP_THEATER = {
  youtubeId: "",
  title: "にわか雨（소나기）",
  meta: "🇰🇷 韓国・22分・ドラマ",
  poster: "film-kr.svg",
};

function initTheater() {
  const mount = document.querySelector("#pickup-theater");
  if (!mount) return;
  const p = PICKUP_THEATER;
  const screen = mount.querySelector(".theater__screen");
  const caption = mount.querySelector(".theater__caption");
  caption.innerHTML = `上映中: <strong>『${p.title}』</strong> ${p.meta}`;
  screen.innerHTML = `<img src="${p.poster}" alt="">`;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "theater__play";
  const ready = Boolean(p.youtubeId);
  btn.setAttribute("aria-label", ready ? `『${p.title}』を再生` : "上映準備中(作品一覧を見る)");
  btn.innerHTML = `<span class="pbtn" aria-hidden="true"></span><span class="msg">${ready ? "TAP TO PLAY" : "COMING SOON — 上映準備中"}</span>`;
  btn.addEventListener("click", () => {
    if (!ready) { window.location.href = "works.html"; return; }
    const f = document.createElement("iframe");
    f.src = `https://www.youtube-nocookie.com/embed/${p.youtubeId}?autoplay=1&rel=0`;
    f.title = p.title;
    f.allow = "autoplay; encrypted-media; picture-in-picture";
    f.allowFullscreen = true;
    screen.innerHTML = "";
    screen.appendChild(f);
  });
  screen.appendChild(btn);
}
