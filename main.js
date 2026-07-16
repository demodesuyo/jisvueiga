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
  initLeader();
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

/* ---- 映写光の塵(シグネチャー): 光錐の中を漂う微粒子 ---- */
function initDust() {
  const canvas = document.querySelector(".hero__dust");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let w, h, dpr, particles, raf;

  const COUNT = window.matchMedia("(max-width: 767px)").matches ? 44 : 80;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.offsetWidth;
    h = canvas.offsetHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawn() {
    // 光錐(右上→左下)の帯の中に発生させる
    const t = Math.random();
    return {
      x: w * (0.35 + t * 0.65) + (Math.random() - 0.5) * w * 0.28,
      y: h * t * 0.9 + Math.random() * h * 0.1,
      r: 0.6 + Math.random() * 1.7,
      vx: -0.08 - Math.random() * 0.18,
      vy: 0.05 + Math.random() * 0.14,
      a: Math.random() * Math.PI * 2,      // またたき位相
      s: 0.008 + Math.random() * 0.02,     // またたき速度
    };
  }

  function tick() {
    if (document.documentElement.classList.contains("is-motion-off")) {
      ctx.clearRect(0, 0, w, h);
      raf = requestAnimationFrame(tick);
      return;
    }
    ctx.clearRect(0, 0, w, h);
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.a += p.s * 60;
      if (p.x < -10 || p.y > h + 10) Object.assign(p, spawn(), { y: -5 });
      const alpha = 0.12 + Math.abs(Math.sin(p.a)) * 0.4;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 217, 138, ${alpha})`;
      ctx.fill();
    }
    raf = requestAnimationFrame(tick);
  }

  resize();
  particles = Array.from({ length: COUNT }, spawn);
  window.addEventListener("resize", () => resize(), { passive: true });

  // 画面外では止める(バッテリー配慮)
  const io = new IntersectionObserver(([e]) => {
    if (e.isIntersecting) {
      raf = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(raf);
    }
  });
  io.observe(canvas);
}

/* ---- カウントダウンリーダー(v1.1): セッション初回のみ3・2・1 → ランプ暖機 ---- */
function initLeader() {
  const hero = document.querySelector(".hero");
  if (!hero) return;

  // グレイン層(常設・CSS側でmotion-off時は非表示)
  const grain = document.createElement("div");
  grain.className = "hero__grain";
  grain.setAttribute("aria-hidden", "true");
  hero.appendChild(grain);

  if (document.documentElement.classList.contains("is-motion-off")) return;
  let shown = false;
  try { shown = sessionStorage.getItem("leader-shown") === "1"; } catch (e) {}
  if (shown) return;
  try { sessionStorage.setItem("leader-shown", "1"); } catch (e) {}

  hero.classList.add("is-warming");

  const leader = document.createElement("div");
  leader.className = "leader";
  leader.setAttribute("aria-hidden", "true");
  leader.innerHTML =
    '<div class="leader__cross-h"></div><div class="leader__cross-v"></div>' +
    '<div class="leader__frame"><span class="leader__num">3</span></div>' +
    '<p class="leader__hint">TAP TO SKIP</p>';
  document.body.appendChild(leader);
  const num = leader.querySelector(".leader__num");

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    leader.classList.add("is-done");
    hero.classList.remove("is-warming");
    hero.classList.add("is-on");
    setTimeout(() => leader.remove(), 600);
  };

  let n = 3;
  const timer = setInterval(() => {
    n -= 1;
    if (n >= 1) {
      num.textContent = String(n);
    } else {
      clearInterval(timer);
      finish();
    }
  }, 550);

  leader.addEventListener("click", () => { clearInterval(timer); finish(); });
  setTimeout(finish, 4000); // 開かない事故の保険(削除禁止)
}
