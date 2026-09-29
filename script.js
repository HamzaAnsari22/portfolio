(() => {
  const root = document.documentElement;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- Theme ----
  const storedTheme = (() => { try { return localStorage.getItem("theme"); } catch { return null; } })();
  root.dataset.theme = storedTheme || "dark";
  $("#themeToggle").addEventListener("click", () => {
    root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
    try { localStorage.setItem("theme", root.dataset.theme); } catch {}
  });

  // ---- Mobile menu ----
  const menuBtn = $("#menuToggle");
  const links = $(".nav__links");
  const setMenu = (open) => {
    links.classList.toggle("is-open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
  };
  menuBtn.addEventListener("click", () => setMenu(!links.classList.contains("is-open")));
  $$("a", links).forEach((a) => a.addEventListener("click", () => setMenu(false)));

  // ---- Scroll: nav border + progress bar ----
  const nav = $(".nav");
  const progress = $(".scroll-progress");
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle("is-scrolled", y > 10);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // ---- Active nav link ----
  const navLinks = $$(".nav__links a");
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === `#${entry.target.id}`));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  $$("main section[id]").forEach((s) => sectionObserver.observe(s));

  // ---- Reveal on scroll ----
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12 });
  $$(".reveal").forEach((el, i) => {
    el.style.transitionDelay = `${(i % 4) * 70}ms`;
    revealObserver.observe(el);
  });

  // ---- Stat counters ----
  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseFloat(el.dataset.count);
      const decimals = parseInt(el.dataset.decimals || "0", 10);
      const suffix = el.dataset.suffix || "";
      const duration = reduceMotion ? 0 : 1400;
      const start = performance.now();
      const tick = (now) => {
        const t = duration ? Math.min((now - start) / duration, 1) : 1;
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = (target * eased).toFixed(decimals) + suffix;
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      countObserver.unobserve(el);
    });
  }, { threshold: 0.6 });
  $$("[data-count]").forEach((el) => countObserver.observe(el));

  // ---- Typing effect ----
  const typed = $("#typed");
  const phrases = [
    "scalable backends",
    "real-time IoT platforms",
    "secure REST APIs",
    "React & Angular apps",
    "things that ship on time",
  ];
  if (!reduceMotion) {
    let p = 0, c = phrases[0].length, deleting = true;
    const step = () => {
      const word = phrases[p];
      c += deleting ? -1 : 1;
      typed.textContent = word.slice(0, c);
      let delay = deleting ? 40 : 80;
      if (!deleting && c === word.length) { deleting = true; delay = 1800; }
      else if (deleting && c === 0) { deleting = false; p = (p + 1) % phrases.length; delay = 300; }
      setTimeout(step, delay);
    };
    setTimeout(step, 2200);
  }

  // ---- Skill card spotlight ----
  $$(".skill-card").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  });

  // ---- Project filters ----
  const filters = $$(".filter");
  const projects = $$(".project");
  filters.forEach((btn) => {
    btn.addEventListener("click", () => {
      filters.forEach((b) => b.classList.toggle("is-active", b === btn));
      const f = btn.dataset.filter;
      projects.forEach((card) => {
        const show = f === "all" || card.dataset.cat.split(" ").includes(f);
        card.classList.toggle("is-hidden", !show);
        if (show) card.classList.add("is-visible");
      });
    });
  });

  // ---- Toast ----
  const toast = $("#toast");
  let toastTimer;
  const showToast = (msg) => {
    toast.textContent = msg;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2400);
  };

  // ---- Copy email ----
  $$(".copy-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copy);
        showToast("Email copied to clipboard ✓");
      } catch {
        showToast(btn.dataset.copy);
      }
    });
  });

  // ---- Contact form → Formspree, falling back to mailto ----
  const form = $("#contactForm");
  const formspreeId = form.dataset.formspree.trim();
  if (formspreeId) $("#contactNote").textContent = "I usually reply within a day or two.";

  const openMailto = (data) => {
    const subject = encodeURIComponent(`Portfolio enquiry from ${data.get("name")}`);
    const body = encodeURIComponent(`${data.get("message")}\n\n— ${data.get("name")} (${data.get("email")})`);
    window.location.href = `mailto:ansarihamza438@gmail.com?subject=${subject}&body=${body}`;
    showToast("Opening your email app…");
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    if (data.get("_gotcha")) return;
    if (!formspreeId) return openMailto(data);

    const btn = $("button[type=submit]", form);
    btn.disabled = true;
    try {
      const res = await fetch(`https://formspree.io/f/${formspreeId}`, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(res.statusText);
      form.reset();
      showToast("Thanks! Your message has been sent ✓");
    } catch {
      showToast("Couldn't send. Opening your email app instead…");
      openMailto(data);
    } finally {
      btn.disabled = false;
    }
  });

  // ---- Footer year ----
  $("#year").textContent = new Date().getFullYear();
})();
