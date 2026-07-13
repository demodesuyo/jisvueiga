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

/* ---- 水中の生きものと泡(v1.3): 泡・小魚の群れ・イルカ ---- */
function initDust() {
  const canvas = document.querySelector(".hero__dust");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let w, h, dpr, bubbles, schools, dolphin, raf;

  const SP = window.matchMedia("(max-width: 767px)").matches;

  // イルカのシルエット(100x40の座標系, 鼻先が左)
  const DOLPHIN = new Path2D(
    "M0 24 C 14 12 26 8 40 8 C 44 8 46 7 48 3 C 52 1 54 2 53 6 " +
    "C 52 9 50 10 47 11 C 62 12 76 14 88 17 C 92 12 96 8 100 7 " +
    "C 97 13 95 16 94 19 C 96 22 99 26 100 31 C 95 29 90 25 87 22 " +
    "C 74 24 60 26 46 26 C 44 30 40 34 34 36 C 36 32 37 29 37 27 " +
    "C 24 27 10 26 0 24 Z"
  );

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.offsetWidth;
    h = canvas.offsetHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawnBubble(fromBottom) {
    return {
      x: Math.random() * w,
      y: fromBottom ? h + 6 : Math.random() * h,
      r: 0.8 + Math.random() * 2.2,
      vy: 0.25 + Math.random() * 0.5,
      a: Math.random() * Math.PI * 2,
      s: 0.02 + Math.random() * 0.03,
    };
  }

  function spawnSchool(dir) {
    const n = 5 + Math.floor(Math.random() * 4);
    return {
      dir,                                    // 1=右へ, -1=左へ
      x: dir === 1 ? -80 : w + 80,
      y: h * (0.25 + Math.random() * 0.55),
      v: (0.35 + Math.random() * 0.25) * dir,
      fish: Array.from({ length: n }, () => ({
        ox: Math.random() * 70,
        oy: (Math.random() - 0.5) * 46,
        size: 5 + Math.random() * 4,
        ph: Math.random() * Math.PI * 2,
      })),
    };
  }

  function drawFish(x, y, size, dir, wag) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(dir, 1);
    ctx.fillStyle = "rgba(12, 42, 66, 0.5)";
    ctx.beginPath();
    ctx.ellipse(0, 0, size, size * 0.38, 0, 0, Math.PI * 2);
    ctx.moveTo(-size * 0.8, 0);
    ctx.lineTo(-size * 1.5, -size * 0.5 * wag);
    ctx.lineTo(-size * 1.5, size * 0.5 * wag);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function newDolphin() {
    const dir = Math.random() < 0.5 ? 1 : -1;
    return {
      active: false,
      wait: (SP ? 7 : 5) + Math.random() * 8,   // 秒
      dir,
      x: 0, t: 0,
      dur: 9 + Math.random() * 3,
      y0: h * (0.3 + Math.random() * 0.35),
      amp: 26 + Math.random() * 22,
      size: SP ? 0.7 : 1.0,
    };
  }

  function tick(now) {
    if (document.documentElement.classList.contains("is-motion-off")) {
      ctx.clearRect(0, 0, w, h);
      raf = requestAnimationFrame(tick);
      return;
    }
    ctx.clearRect(0, 0, w, h);

    // 泡
    for (const b of bubbles) {
      b.y -= b.vy;
      b.a += b.s * 60;
      b.x += Math.sin(b.a) * 0.25;
      if (b.y < -8) Object.assign(b, spawnBubble(true));
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

    // 小魚の群れ
    for (const sc of schools) {
      sc.x += sc.v;
      if ((sc.dir === 1 && sc.x > w + 140) || (sc.dir === -1 && sc.x < -140)) {
        Object.assign(sc, spawnSchool(sc.dir));
      }
      for (const f of sc.fish) {
        f.ph += 0.09;
        const fx = sc.x + f.ox * sc.dir;
        const fy = sc.y + f.oy + Math.sin(f.ph) * 3;
        drawFish(fx, fy, f.size, sc.dir, 0.7 + Math.sin(f.ph * 2) * 0.3);
      }
    }

    // イルカ: ときどき画面を横切る
    dolphin.t += 1 / 60;
    if (!dolphin.active) {
      if (dolphin.t > dolphin.wait) { dolphin.active = true; dolphin.t = 0; }
    } else {
      const p = dolphin.t / dolphin.dur;
      if (p >= 1) { dolphin = newDolphin(); }
      else {
        const x = dolphin.dir === 1 ? -140 + p * (w + 280) : w + 140 - p * (w + 280);
        const y = dolphin.y0 + Math.sin(p * Math.PI * 2) * dolphin.amp;
        const slope = Math.cos(p * Math.PI * 2) * dolphin.amp * (Math.PI * 2) / (w + 280);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.atan(slope) * dolphin.dir);
        ctx.scale(dolphin.dir * dolphin.size, dolphin.size);
        ctx.translate(-50, -20);
        ctx.fillStyle = "rgba(10, 38, 62, 0.55)";
        ctx.fill(DOLPHIN);
        ctx.restore();
      }
    }

    raf = requestAnimationFrame(tick);
  }

  function build() {
    bubbles = Array.from({ length: SP ? 26 : 44 }, () => spawnBubble(false));
    schools = [spawnSchool(1), spawnSchool(-1)];
    dolphin = newDolphin();
  }

  resize();
  build();
  window.addEventListener("resize", () => { resize(); build(); }, { passive: true });

  const io = new IntersectionObserver(([e]) => {
    if (e.isIntersecting) {
      raf = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(raf);
    }
  });
  io.observe(canvas);
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
