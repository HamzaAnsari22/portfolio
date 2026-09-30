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

  // ---- Motion effects ----
  // Stagger index for the tag pop-in (capped so long lists don't lag behind)
  $$(".tags").forEach((list) => $$("li", list).forEach((li, i) => li.style.setProperty("--i", Math.min(i, 12))));

  // Timeline line fills as the section scrolls past the middle of the screen
  const timeline = $(".timeline");
  if (timeline) {
    if (reduceMotion) timeline.style.setProperty("--tl", 1);
    else {
      const drawTimeline = () => {
        const r = timeline.getBoundingClientRect();
        const p = (window.innerHeight * 0.6 - r.top) / r.height;
        timeline.style.setProperty("--tl", Math.min(Math.max(p, 0), 1).toFixed(3));
      };
      window.addEventListener("scroll", drawTimeline, { passive: true });
      drawTimeline();
    }
  }

  const finePointer = window.matchMedia("(pointer: fine)").matches;
  if (finePointer && !reduceMotion) {
    // 3D tilt on the hero code card
    const visual = $(".hero__visual");
    const codeCard = $(".code-card");
    if (visual && codeCard) {
      visual.addEventListener("pointermove", (e) => {
        const r = visual.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        codeCard.classList.add("is-tilting");
        codeCard.style.transform = `perspective(1200px) rotateY(${x * 14}deg) rotateX(${-y * 10}deg)`;
      });
      visual.addEventListener("pointerleave", () => {
        codeCard.classList.remove("is-tilting");
        codeCard.style.transform = "";
      });
    }

    // Magnetic primary buttons
    $$(".btn--primary").forEach((btn) => {
      btn.classList.add("is-magnetic");
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        btn.style.transform = `translate(${dx * 0.2}px, ${dy * 0.3}px)`;
      });
      btn.addEventListener("pointerleave", () => { btn.style.transform = ""; });
    });

    // Cursor glow, eased toward the pointer
    const glow = document.createElement("div");
    glow.className = "cursor-glow";
    glow.setAttribute("aria-hidden", "true");
    document.body.prepend(glow);
    let gx = 0, gy = 0, tx = 0, ty = 0, raf = 0;
    const follow = () => {
      gx += (tx - gx) * 0.12; gy += (ty - gy) * 0.12;
      glow.style.transform = `translate(${gx}px, ${gy}px)`;
      raf = Math.abs(tx - gx) + Math.abs(ty - gy) > 0.5 ? requestAnimationFrame(follow) : 0;
    };
    window.addEventListener("pointermove", (e) => {
      tx = e.clientX; ty = e.clientY;
      if (!glow.classList.contains("is-on")) { gx = tx; gy = ty; glow.classList.add("is-on"); }
      if (!raf) raf = requestAnimationFrame(follow);
    }, { passive: true });
    document.documentElement.addEventListener("pointerleave", () => glow.classList.remove("is-on"));
  }

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
    window.location.href = `mailto:hamzasohail22.dev@gmail.com?subject=${subject}&body=${body}`;
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

  // ---- Tech stack logos ----
  // Single-colour logos (Simple Icons / Devicon plain) are drawn as a CSS mask tinted with the
  // brand colour, or with currentColor for black logos so they stay visible in both themes.
  // Multi-colour logos (Devicon "original") are plain <img>s.
  const SI = "https://cdn.jsdelivr.net/npm/simple-icons@15.22.0/icons/";
  const DV = "https://cdn.jsdelivr.net/gh/devicons/devicon@v2.16.0/icons/";
  const mask = (slug, color) => ({ src: `${SI}${slug}.svg`, color });
  const img = (path) => ({ src: `${DV}${path}`, img: true });
  const aws = { src: `${DV}amazonwebservices/amazonwebservices-plain-wordmark.svg`, color: "#FF9900", wide: true };
  const TECH = {
    "TypeScript": mask("typescript", "#3178C6"), "JavaScript": mask("javascript", "#F7DF1E"),
    "Python": mask("python", "#3776AB"), "C#": img("csharp/csharp-original.svg"),
    "Node.js": mask("nodedotjs", "#5FA04E"), "NestJS": mask("nestjs", "#E0234E"),
    "Express.js": mask("express"), "Koa.js": mask("koa"), "ASP.NET": mask("dotnet", "#7A5AF8"),
    "JWT": mask("jsonwebtokens"), "Passport": mask("passport", "#34E27A"),
    "Swagger / OpenAPI": mask("swagger", "#85EA2D"),
    "Serverless Framework": mask("serverless", "#FD5750"), "Serverless": mask("serverless", "#FD5750"),
    "React": mask("react", "#61DAFB"), "Redux Toolkit": mask("redux", "#764ABC"), "Redux": mask("redux", "#764ABC"),
    "Angular 17": img("angular/angular-original.svg"), "Angular Material": img("angularmaterial/angularmaterial-original.svg"),
    "AngularJS": img("angularjs/angularjs-original.svg"), "Vite": mask("vite", "#9135FF"), "Mapbox": mask("mapbox"),
    "PostgreSQL": mask("postgresql", "#4169E1"), "PostGIS": mask("postgresql", "#4169E1"),
    "MongoDB": mask("mongodb", "#47A248"), "MySQL": mask("mysql", "#4479A1"), "Redis": mask("redis", "#FF4438"),
    "Elasticsearch": mask("elasticsearch", "#00BFB3"), "InfluxDB": mask("influxdb", "#22ADF6"),
    "AWS IoT Core": aws, "Lambda": aws, "S3": aws, "AWS S3": aws, "SES": aws, "SQS": aws, "SNS": aws,
    "SQS / SNS": aws, "CloudWatch": aws, "ECR": aws,
    "Docker": mask("docker", "#2496ED"), "CircleCI": mask("circleci"), "Nx": mask("nx"),
    "Flyway": mask("flyway", "#CC0200"), "Git": mask("git", "#F03C2E"), "GitHub": mask("github"),
    "Bitbucket": mask("bitbucket", "#2684FF"),
    "WebRTC": mask("webrtc"), "WebRTC (PexRTC)": mask("webrtc"), "Pub/Sub": mask("googlepubsub", "#4285F4"),
    "Stripe": mask("stripe", "#635BFF"),
    "Jest": mask("jest", "#C21325"), "Grafana k6": mask("k6", "#7D64FF"), "SonarQube": mask("sonarqubeserver", "#126ED3"),
    "ESLint": mask("eslint", "#8080F2"), "New Relic": mask("newrelic", "#1CE783"),
    "Elastic Stack (ELK)": mask("elasticstack", "#00BFB3"),
    "Claude": mask("claude", "#D97757"), "GitHub Copilot": mask("githubcopilot"),
    "TensorFlow": mask("tensorflow", "#FF6F00"), "Django": mask("django", "#44B78B"),
    "Bootstrap": mask("bootstrap", "#7952B3"), "ethers.js": mask("ethers", "#4F63E6"),
    "Web3": mask("web3dotjs", "#F16822"), "Selenium": mask("selenium", "#43B02A"),
    "Firebase": mask("firebase", "#FFA611"), "SQLite": mask("sqlite", "#0F80CC"), "PHP": mask("php", "#777BB4"),
  };
  $$(".tags li, .marquee__track span").forEach((el) => {
    const tech = TECH[el.textContent.trim()];
    if (!tech) return;
    let icon;
    if (tech.img) {
      icon = document.createElement("img");
      icon.src = tech.src; icon.alt = ""; icon.loading = "lazy"; icon.decoding = "async";
    } else {
      icon = document.createElement("span");
      icon.style.setProperty("--icon", `url("${tech.src}")`);
      if (tech.color) icon.style.setProperty("--c", tech.color);
    }
    icon.className = `tech-icon${tech.wide ? " tech-icon--wide" : ""}`;
    icon.setAttribute("aria-hidden", "true");
    el.prepend(icon);
    el.classList.add("has-icon");
  });

  // ---- Footer year ----
  $("#year").textContent = new Date().getFullYear();
})();
