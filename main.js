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

/* ---- 海面のきらめき(v1.2): 水平線下に太陽の「光の道」。白のみ ---- */
function initDust() {
  const canvas = document.querySelector(".hero__dust");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let w, h, dpr, glints, raf;

  const COUNT = window.matchMedia("(max-width: 767px)").matches ? 90 : 160;
  const PATH_X = 0.62;   // 光の道の中心(横位置)

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.offsetWidth;
    h = canvas.offsetHeight;   // canvasは水平線から下だけを覆う
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawn() {
    // 水平線に近いほど密集し、遠ざかるほど光の道が広がる
    const d = Math.pow(Math.random(), 1.7);        // 0=水平線際に偏る
    const y = d * h;
    const spread = 0.06 + d * 0.3;                  // 遠近: 下ほど道幅が広い
    const onPath = Math.random() < 0.8;
    const x = onPath
      ? w * (PATH_X + (Math.random() - 0.5) * spread)
      : w * Math.random();
    return {
      x, y,
      len: (1.5 + Math.random() * 5) * (0.5 + d),   // 横長のグリント
      a: Math.random() * Math.PI * 2,
      s: 0.012 + Math.random() * 0.04,
      base: onPath ? 0.5 : 0.2,
    };
  }

  function tick() {
    if (document.documentElement.classList.contains("is-motion-off")) {
      ctx.clearRect(0, 0, w, h);
      raf = requestAnimationFrame(tick);
      return;
    }
    ctx.clearRect(0, 0, w, h);
    for (const p of glints) {
      p.a += p.s * 60;
      p.x += 0.05;
      if (p.x > w + 12) Object.assign(p, spawn(), { x: -8 });
      const tw = Math.abs(Math.sin(p.a));
      const alpha = p.base * (0.15 + tw * 0.85);
      // 海のきらめきは横に細長い
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(p.x - p.len, p.y);
      ctx.lineTo(p.x + p.len, p.y);
      ctx.stroke();
      // 最も強い瞬間だけ小さな十字
      if (tw > 0.99) {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - p.len * 0.6);
        ctx.lineTo(p.x, p.y + p.len * 0.6);
        ctx.stroke();
      }
    }
    raf = requestAnimationFrame(tick);
  }

  resize();
  glints = Array.from({ length: COUNT }, spawn);
  window.addEventListener("resize", () => {
    resize();
    glints = Array.from({ length: COUNT }, spawn);
  }, { passive: true });

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
