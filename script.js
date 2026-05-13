/* ---------- Mobile burger menu (drawer) ---------- */
document.addEventListener("click", function(e) {
  // Abre/fecha via botão burger
  if (e.target.closest("#navBurger")) {
    e.preventDefault();
    document.body.classList.toggle("nav-open");
    return;
  }
  // Fecha ao clicar em link do menu
  if (e.target.closest(".nav a.link") && document.body.classList.contains("nav-open")) {
    document.body.classList.remove("nav-open");
    return;
  }
  // Fecha ao clicar no backdrop (fora do drawer)
  if (document.body.classList.contains("nav-open")
      && !e.target.closest(".nav ul")
      && !e.target.closest("#navBurger")) {
    document.body.classList.remove("nav-open");
  }
});

// Fecha drawer ao redimensionar pra desktop
window.addEventListener("resize", function() {
  if (window.innerWidth > 960) document.body.classList.remove("nav-open");
});

/* ---------- Theme toggle (dark / light) com event delegation ---------- */
// Garante o tema inicial (caso o script inline do <head> tenha falhado)
(function initTheme() {
  const root = document.documentElement;
  if (!root.hasAttribute("data-theme")) {
    const stored = localStorage.getItem("conex_theme");
    root.setAttribute("data-theme", stored || "dark");
  }
})();

// Event delegation no document — pega click no botão em qualquer momento,
// imune a problemas de timing/order de scripts
document.addEventListener("click", function(e) {
  const btn = e.target.closest("#themeToggle");
  if (!btn) return;
  e.preventDefault();
  const root = document.documentElement;
  const current = root.getAttribute("data-theme") || "dark";
  const next = current === "dark" ? "light" : "dark";
  root.setAttribute("data-theme", next);
  localStorage.setItem("conex_theme", next);
  btn.setAttribute("aria-label",
    next === "dark" ? "Mudar para modo claro" : "Mudar para modo escuro");
  console.log("[theme] switched to:", next);
});

/* ---------- Loader (mais rápido após nav interna) ---------- */
window.addEventListener("load", () => {
  const l = document.getElementById("loader");
  if (!l) return;
  const fromInternal = sessionStorage.getItem("conex_internal_nav") === "1";
  if (fromInternal) sessionStorage.removeItem("conex_internal_nav");
  setTimeout(() => l.classList.add("gone"), fromInternal ? 180 : 700);
});

/* ---------- Page transitions (entre páginas .html) ---------- */
(function setupPageTransitions(){
  const cover = document.createElement("div");
  cover.className = "page-transition";
  cover.innerHTML = `
    <span class="corner tl"></span><span class="corner tr"></span>
    <span class="corner bl"></span><span class="corner br"></span>
    <svg class="marker" viewBox="0 0 8704.52 4154.8" aria-hidden="true"><use href="#brand-symbol"/></svg>
    <div class="t-text">Carregando módulo · <span class="t-target">—</span></div>
  `;
  document.body.appendChild(cover);
  const targetEl = cover.querySelector(".t-target");

  const internalPages = ["index.html","servicos.html","sobre.html","blog.html","contato.html"];
  document.querySelectorAll('a[href]').forEach(a => {
    const href = a.getAttribute("href");
    if (!href) return;
    // Skip externals, anchors, mail/tel
    if (href.startsWith("http") || href.startsWith("#") || href.startsWith("mailto") || href.startsWith("tel") || a.target === "_blank") return;
    // Only intercept internal page navigation
    const file = href.split("/").pop().split("?")[0];
    if (!internalPages.includes(file)) return;
    // Skip clicks to the current page
    const here = location.pathname.split("/").pop() || "index.html";
    if (file === here) return;

    a.addEventListener("click", e => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // permitir abrir em nova aba
      e.preventDefault();
      const label = file.replace(".html","").toUpperCase();
      targetEl.textContent = label === "INDEX" ? "INÍCIO" : label;
      requestAnimationFrame(() => cover.classList.add("active"));
      sessionStorage.setItem("conex_internal_nav", "1");
      setTimeout(() => { window.location.href = href; }, 520);
    });
  });
})();

/* ---------- Live clock ---------- */
function pad(n){return String(n).padStart(2,"0")}
function tick(){
  const d = new Date();
  const t = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  const dt = `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} · ${t}`;
  const c = document.getElementById("clock"); if(c) c.textContent = t;
  const fc = document.getElementById("footerClock"); if(fc) fc.textContent = dt;
}
tick(); setInterval(tick, 1000);
const yearEl = document.getElementById("year"); if(yearEl) yearEl.textContent = new Date().getFullYear();

/* ---------- Lenis smooth scroll ---------- */
const lenis = new Lenis({ duration: 1.15, easing: t => Math.min(1, 1.001 - Math.pow(2, -10*t)) });
function raf(time){ lenis.raf(time); requestAnimationFrame(raf); }
requestAnimationFrame(raf);

/* Anchor scroll via Lenis (only same-page hashes) */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener("click", e => {
    const id = a.getAttribute("href");
    if(id.length > 1){
      const el = document.querySelector(id);
      if(el){ e.preventDefault(); lenis.scrollTo(el, { offset: -60, duration: 1.4 }); }
    }
  });
});

/* ---------- ScrollTrigger reveal ---------- */
gsap.registerPlugin(ScrollTrigger);
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add(time => lenis.raf(time*1000));
gsap.ticker.lagSmoothing(0);

document.querySelectorAll(".reveal, .reveal-stagger").forEach(el => {
  ScrollTrigger.create({
    trigger: el, start: "top 85%",
    onEnter: () => el.classList.add("in"),
  });
});

/* ---------- Counters ---------- */
document.querySelectorAll("[data-counter]").forEach(el => {
  const target = parseFloat(el.getAttribute("data-counter"));
  const suffix = el.getAttribute("data-suffix") || "";
  const pad0 = el.getAttribute("data-counter").startsWith("0");
  ScrollTrigger.create({
    trigger: el, start: "top 90%", once: true,
    onEnter: () => {
      const obj = { v: 0 };
      gsap.to(obj, {
        v: target, duration: 1.6, ease: "power2.out",
        onUpdate: () => {
          const n = Math.round(obj.v);
          el.textContent = (pad0 && n < 10 ? "0"+n : n) + suffix;
        }
      });
    }
  });
});

/* ---------- Cursor glow ---------- */
const glow = document.getElementById("cursorGlow");
if (glow) {
  window.addEventListener("pointermove", e => {
    glow.style.left = e.clientX + "px";
    glow.style.top  = e.clientY + "px";
  });
  window.addEventListener("pointerdown", () => glow.style.opacity = .4);
  window.addEventListener("pointerup",   () => glow.style.opacity = .7);
}

/* Module hover spotlight */
document.querySelectorAll(".module").forEach(m => {
  m.addEventListener("pointermove", e => {
    const r = m.getBoundingClientRect();
    m.style.setProperty("--mx", (e.clientX - r.left) + "px");
    m.style.setProperty("--my", (e.clientY - r.top)  + "px");
  });
});

/* ---------- Background parallax ---------- */
if (document.querySelector(".bg-grid")) {
  gsap.to(".bg-grid", {
    yPercent: 25,
    ease: "none",
    scrollTrigger: { trigger: "body", start: "top top", end: "bottom top", scrub: true }
  });
}

/* ---------- model-viewer (GLB do Blender) — fade fallback no load ---------- */
const mv = document.getElementById("brand3d");
if (mv && mv.tagName === "MODEL-VIEWER") {
  const heroBox = mv.closest(".hud-3d");
  mv.addEventListener("load", () => heroBox?.classList.add("loaded"));
  mv.addEventListener("error", (e) => console.warn("[model-viewer] erro:", e));
  /* Failsafe: 8s de timeout caso o evento load não dispare */
  setTimeout(() => heroBox?.classList.add("loaded"), 8000);
}

/* ---------- Contact form (UI only) ---------- */
const form = document.getElementById("contactForm");
if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const btn = form.querySelector("button[type='submit']");
    const original = btn.textContent;
    btn.textContent = "Enviando...";
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = "Mensagem enviada ✓";
      form.reset();
      setTimeout(() => { btn.textContent = original; btn.disabled = false; }, 2400);
    }, 900);
  });
}
