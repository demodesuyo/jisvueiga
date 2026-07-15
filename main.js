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
  initUtilityNav();
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
  { name: "spring", grad: ["#fef7f9", "#fdeef3", "#fbe4ec"], accent: [194, 80, 109] },
  { name: "summer", grad: ["#eef8ff", "#e9f6ea", "#f5f1d6"], accent: [47, 125, 79] },
  { name: "autumn", grad: ["#fdf8f0", "#f9edda", "#f5e0c4"], accent: [176, 84, 28] },
  { name: "winter", grad: ["#f4f8fb", "#edf3f8", "#e6edf5"], accent: [63, 111, 150] },
];

function gradCss(g) {
  return `linear-gradient(180deg, ${g[0]} 0%, ${g[1]} 50%, ${g[2]} 100%)`;
}

function initDust() {
  // 背景レイヤーとcanvasを全ページに注入
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
  const MAX = SP ? 44 : 78;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // --- 季節ブレンドの算出 ---
  const markers = [...document.querySelectorAll("[data-season]")];
  const order = { spring: 0, summer: 1, autumn: 2, winter: 3 };
  let idxA = 0, idxB = 0, blend = 0; // 現在: A→B へ blend(0..1)

  function seasonByDate() {
    const m = new Date().getMonth() + 1;
    if (m >= 3 && m <= 5) return 0;
    if (m >= 6 && m <= 8) return 1;
    if (m >= 9 && m <= 11) return 2;
    return 3;
  }

  function computeBlend() {
    if (!markers.length) {
      idxA = idxB = seasonByDate();
      blend = 0;
      return;
    }
    const ref = window.scrollY + h * 0.45;
    const zones = markers.map((el) => ({
      s: order[el.dataset.season] ?? 0,
      top: el.offsetTop,
    }));
    let cur = zones[0], next = null;
    for (let k = 0; k < zones.length; k++) {
      if (ref >= zones[k].top) { cur = zones[k]; next = zones[k + 1] || null; }
    }
    idxA = cur.s;
    if (next && next.s !== cur.s) {
      const FADE = h * 0.5; // 境界の手前50vhかけて移り変わる
      const d = next.top - ref;
      idxB = next.s;
      blend = Math.min(Math.max(1 - d / FADE, 0), 1);
    } else {
      idxB = idxA;
      blend = 0;
    }
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

  // --- 季節の粒 ---
  const parts = [];
  function spawnPart() {
    const which = Math.random() < blend ? idxB : idxA;
    const name = SEASONS[which].name;
    const base = { type: name, x: Math.random() * w, ph: Math.random() * Math.PI * 2 };
    if (name === "spring") return { ...base, y: -12, r: 4 + Math.random() * 3.5,
      vy: 0.5 + Math.random() * 0.6, rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.06,
      color: `rgba(${238 + Math.random() * 12}, ${150 + Math.random() * 30}, ${175 + Math.random() * 25}, 0.8)` };
    if (name === "summer") return { ...base, y: h + 10, r: 1.2 + Math.random() * 2.2,
      vy: -(0.2 + Math.random() * 0.35) };                       // 木漏れ日の光の粒(上昇)
    if (name === "autumn") return { ...base, y: -14, r: 5 + Math.random() * 4,
      vy: 0.7 + Math.random() * 0.7, rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.1,
      color: ["rgba(201,102,45,0.85)", "rgba(214,138,51,0.85)", "rgba(176,74,34,0.85)"][Math.floor(Math.random() * 3)] };
    return { ...base, y: -8, r: 1 + Math.random() * 2.4,          // winter
      vy: 0.35 + Math.random() * 0.5 };
  }

  function drawPart(p, t) {
    if (p.type === "spring") {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.r, p.r * 0.62, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (p.type === "summer") {
      const tw = 0.25 + Math.abs(Math.sin(p.ph)) * 0.45;
      ctx.fillStyle = `rgba(246, 214, 110, ${tw})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === "autumn") {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.beginPath();                       // 先のとがった木の葉
      ctx.moveTo(0, -p.r);
      ctx.quadraticCurveTo(p.r * 0.9, 0, 0, p.r);
      ctx.quadraticCurveTo(-p.r * 0.9, 0, 0, -p.r);
      ctx.fill();
      ctx.restore();
    } else {
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 夏だけ、画面の下でゆれる向日葵
  const flowers = Array.from({ length: SP ? 4 : 7 }, (_, k) => ({
    fx: (k + 0.5 + Math.random() * 0.3) / (SP ? 4.4 : 7.4),
    hgt: 46 + Math.random() * 42,
    size: 11 + Math.random() * 7,
    ph: Math.random() * Math.PI * 2,
  }));
  function drawSunflowers(alpha, t) {
    for (const f of flowers) {
      const x = f.fx * w + Math.sin(t / 1400 + f.ph) * 4;
      const yBase = h + 4, yHead = h - f.hgt;
      ctx.strokeStyle = `rgba(64, 122, 66, ${0.75 * alpha})`;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(f.fx * w, yBase);
      ctx.quadraticCurveTo(f.fx * w, yHead + f.hgt * 0.5, x, yHead);
      ctx.stroke();
      for (let k = 0; k < 12; k++) {                 // 花びら
        const ang = (k / 12) * Math.PI * 2 + Math.sin(t / 1400 + f.ph) * 0.05;
        ctx.save();
        ctx.translate(x, yHead);
        ctx.rotate(ang);
        ctx.fillStyle = `rgba(244, 196, 48, ${0.92 * alpha})`;
        ctx.beginPath();
        ctx.ellipse(f.size * 0.95, 0, f.size * 0.52, f.size * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = `rgba(112, 74, 34, ${0.95 * alpha})`;
      ctx.beginPath();
      ctx.arc(x, yHead, f.size * 0.42, 0, Math.PI * 2);
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
    while (parts.length < MAX) parts.push(spawnPart());
    for (let k = parts.length - 1; k >= 0; k--) {
      const p = parts[k];
      p.ph += 0.02;
      p.y += p.vy;
      p.x += Math.sin(p.ph) * (p.type === "summer" ? 0.2 : 0.6);
      if (p.rot !== undefined) p.rot += p.vr;
      if (p.y > h + 20 || p.y < -24) { parts.splice(k, 1); continue; }
      drawPart(p, now);
    }
    const wSummer = (idxA === 1 ? 1 - blend : 0) + (idxB === 1 ? blend : 0);
    if (wSummer > 0.05) drawSunflowers(wSummer, now);

    raf = requestAnimationFrame(tick);
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
