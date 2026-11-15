/* Sanidhaya Sharma — portfolio interactions
   - Hero service graph (canvas)
   - Scroll: header, progress, nav indicator, reveals, timeline fill
   - Pointer: spotlight cards, magnetic buttons
   - Live sync: GitHub REST API, LeetCode public stats APIs
*/
(function () {
  "use strict";

  const GH_USER = "SanidhayaSharma141";
  const LC_USER = "sanidhayasharma141";

  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  const store = {
    get(key, maxAgeMs) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const v = JSON.parse(raw);
        return Date.now() - v.t < maxAgeMs ? v : null;
      } catch (e) { return null; }
    },
    set(key, data) {
      try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), data })); } catch (e) { /* storage unavailable */ }
    }
  };

  /* ------------------------------------------------------------------ */
  /* Hero name: split letters for the staggered rise                     */
  /* ------------------------------------------------------------------ */
  $$("[data-split]").forEach((line) => {
    const text = line.textContent;
    line.textContent = "";
    [...text].forEach((ch, i) => {
      const s = document.createElement("span");
      s.className = "ch";
      s.style.setProperty("--i", i);
      s.setAttribute("aria-hidden", "true");
      s.textContent = ch;
      line.appendChild(s);
    });
  });

  const yearEl = $("[data-year]");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ------------------------------------------------------------------ */
  /* Header, progress bar, nav                                          */
  /* ------------------------------------------------------------------ */
  const header = $("[data-header]");
  const progress = $(".scroll-progress span");
  const toggle = $("[data-nav-toggle]");
  const links = $("[data-nav-links]");
  const indicator = $("[data-nav-indicator]");
  const navAnchors = $$(".nav-links a[href^='#']");
  const sections = navAnchors.map((a) => $(a.getAttribute("href"))).filter(Boolean);

  let lastY = window.scrollY;
  let ticking = false;

  function moveIndicator(a) {
    if (!indicator) return;
    if (!a) { indicator.style.setProperty("--o", 0); return; }
    const parent = links.getBoundingClientRect();
    const r = a.getBoundingClientRect();
    indicator.style.setProperty("--x", `${r.left - parent.left}px`);
    indicator.style.setProperty("--w", `${r.width}px`);
    indicator.style.setProperty("--o", 1);
  }

  function onScroll() {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.setProperty("--p", max > 0 ? (y / max).toFixed(4) : 0);

    header.classList.toggle("is-scrolled", y > 24);
    const menuOpen = links.classList.contains("is-open");
    if (!menuOpen) header.classList.toggle("is-hidden", y > lastY && y > window.innerHeight * 0.7);
    lastY = y;

    // active section
    const probe = y + window.innerHeight * 0.35;
    let current = null;
    sections.forEach((s) => { if (s.offsetTop <= probe) current = s; });
    navAnchors.forEach((a) => a.classList.toggle("is-active", current && a.getAttribute("href") === `#${current.id}`));
    moveIndicator(navAnchors.find((a) => a.classList.contains("is-active")));

    updateTimeline();
    ticking = false;
  }

  window.addEventListener("scroll", () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  window.addEventListener("resize", () => requestAnimationFrame(onScroll));

  if (toggle) {
    toggle.addEventListener("click", () => {
      const open = links.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
      header.classList.toggle("menu-open", open);
      header.classList.remove("is-hidden");
    });
    links.addEventListener("click", (e) => {
      if (e.target.closest("a")) {
        links.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        header.classList.remove("menu-open");
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Timeline fill                                                       */
  /* ------------------------------------------------------------------ */
  const timeline = $("[data-timeline]");
  const timelineFill = $("[data-timeline-fill]");
  function updateTimeline() {
    if (!timeline || !timelineFill) return;
    const r = timeline.getBoundingClientRect();
    const start = window.innerHeight * 0.7;
    const p = Math.min(1, Math.max(0, (start - r.top) / r.height));
    timelineFill.style.setProperty("--fill", reduceMotion ? 1 : p.toFixed(4));
  }

  /* ------------------------------------------------------------------ */
  /* Counters                                                            */
  /* ------------------------------------------------------------------ */
  function animateCount(el, to, decimals = 0, from = 0) {
    const suffix = el.dataset.suffix || "";
    if (reduceMotion) { el.textContent = Number(to).toFixed(decimals) + suffix; return; }
    const dur = 1400;
    const t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - k, 4);
      el.textContent = (from + (to - from) * e).toFixed(decimals) + suffix;
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function countIn(el) {
    if (el.dataset.counted) return;
    el.dataset.counted = "1";
    animateCount(el, parseFloat(el.dataset.count), parseInt(el.dataset.decimals || "0", 10));
  }

  function setCount(el, value) {
    if (!el) return;
    const decimals = parseInt(el.dataset.decimals || "0", 10);
    const from = parseFloat(el.textContent) || 0;
    el.dataset.count = value;
    if (el.dataset.counted) animateCount(el, value, decimals, from);
    else el.textContent = value;
  }

  /* ------------------------------------------------------------------ */
  /* Reveal on scroll with sibling stagger                               */
  /* ------------------------------------------------------------------ */
  const revealEls = $$(".reveal");
  revealEls.forEach((el) => {
    const siblings = [...el.parentElement.children].filter((c) => c.classList.contains("reveal"));
    const idx = siblings.indexOf(el);
    el.style.setProperty("--stagger", `${Math.min(idx, 6) * 90}ms`);
  });

  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        $$("[data-count]", entry.target).forEach(countIn);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-in"));
    $$("[data-count]").forEach((el) => { el.dataset.counted = "1"; });
  }

  /* ------------------------------------------------------------------ */
  /* Pointer effects                                                     */
  /* ------------------------------------------------------------------ */
  if (finePointer && !reduceMotion) {
    $$("[data-spotlight]").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${e.clientX - r.left}px`);
        card.style.setProperty("--my", `${e.clientY - r.top}px`);
      });
    });

    $$(".magnetic").forEach((btn) => {
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.25;
        const y = (e.clientY - r.top - r.height / 2) * 0.35;
        btn.style.transform = `translate(${x}px, ${y}px)`;
      });
      btn.addEventListener("pointerleave", () => { btn.style.transform = ""; });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Theme toggle                                                        */
  /* ------------------------------------------------------------------ */
  const themeBtn = $("[data-theme-toggle]");
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) { /* storage unavailable */ }
      document.dispatchEvent(new CustomEvent("themechange"));
    });
  }

  /* ------------------------------------------------------------------ */
  /* Hero photo: gentle 3D tilt toward the cursor                        */
  /* ------------------------------------------------------------------ */
  const tilt = $("[data-tilt]");
  if (tilt && finePointer && !reduceMotion) {
    const card = $(".photo-card", tilt);
    tilt.addEventListener("pointermove", (e) => {
      const r = tilt.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      card.style.setProperty("--ry", `${px * 10}deg`);
      card.style.setProperty("--rx", `${-py * 10}deg`);
    });
    tilt.addEventListener("pointerleave", () => {
      card.style.setProperty("--ry", "0deg");
      card.style.setProperty("--rx", "0deg");
    });
  }

  /* ------------------------------------------------------------------ */
  /* Hero: a living service graph of the stack                          */
  /* ------------------------------------------------------------------ */
  (function graph() {
    const canvas = $("[data-graph]");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const hero = canvas.parentElement;

    const LABELS = ["Python", "Kubernetes", "Go", "Linux", "Docker", "Java", "Terraform", "PostgreSQL",
      "GCP", "AWS", "ArgoCD", "Grafana", "ETL", "React", "REST", "Spring Boot", "TypeScript", "Gemini"];
    const C = {};
    function readColors() {
      const cs = getComputedStyle(document.documentElement);
      const v = (n) => cs.getPropertyValue(n).trim();
      C.edge = v("--graph-edge");
      C.node = v("--graph-node");
      C.label = v("--graph-label");
      C.labelHot = v("--ink");
      C.bg = v("--bg");
      C.apricot = v("--graph-packet");
      C.seafoam = v("--graph-packet-2");
      C.edgeHot = `rgba(${C.apricot}, 0.5)`;
    }
    readColors();
    document.addEventListener("themechange", () => { readColors(); if (reduceMotion) step(performance.now()); });

    let W = 0, H = 0, dpr = 1, nodes = [], edges = [], adj = [], packets = [];
    let mouse = { x: -9999, y: -9999, active: false };
    let hover = -1, running = false, raf = 0, t0 = performance.now(), lastSpawn = 0;

    function rand(a, b) { return a + Math.random() * (b - a); }

    function build() {
      const rect = hero.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = rect.width; H = rect.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const mobile = W < 960;
      // keep labelled nodes out of the text block and the photo
      const pad = 26;
      const blockers = [".hero-text", ".photo-card"].map((sel) => $(sel, hero)).filter(Boolean).map((el) => {
        const r = el.getBoundingClientRect();
        // labels draw to the right of their node, so reserve room for them on the left edge
        return { x0: r.left - rect.left - pad - 110, y0: r.top - rect.top - pad, x1: r.right - rect.left + pad, y1: r.bottom - rect.top + pad };
      });
      const free = (x, y) => blockers.every((b) => x < b.x0 || x > b.x1 || y < b.y0 || y > b.y1);
      const area = { x0: 0.02 * W, x1: W - 100, y0: 70, y1: H - 40 };
      const dotArea = { x0: 0, x1: W, y0: 60, y1: H };
      if (mobile) {
        // on phones keep the whole graph above the text so packets never cross the copy
        const tEl = $(".hero-text", hero);
        const top = tEl ? tEl.getBoundingClientRect().top - rect.top - 16 : H * 0.45;
        dotArea.y1 = Math.max(160, top);
        area.y1 = dotArea.y1;
      }
      const minDist = mobile ? 52 : 70;
      const labelCount = mobile ? 5 : 10;
      const dotCount = mobile ? 14 : 24;
      nodes = [];
      const place = (labelled, label) => {
        const box = labelled ? area : dotArea;
        for (let tries = 0; tries < 200; tries++) {
          const x = rand(box.x0, box.x1);
          const y = rand(box.y0, box.y1);
          const md = labelled ? minDist : minDist * 0.55;
          if (labelled && !free(x, y)) continue;
          if (nodes.every((n) => Math.hypot(n.hx - x, n.hy - y) > md)) {
            nodes.push({
              hx: x, hy: y, x, y, ox: 0, oy: 0,
              r: labelled ? 4.2 : rand(1.4, 2.4),
              label, labelled,
              phase: rand(0, Math.PI * 2), amp: rand(4, 10), speed: rand(0.25, 0.55),
              born: nodes.length * 55
            });
            return;
          }
        }
      };
      LABELS.slice(0, labelCount).forEach((l) => place(true, l));
      for (let i = 0; i < dotCount; i++) place(false, null);

      // edges: connect each node to its nearest neighbours
      const key = new Set();
      edges = [];
      adj = nodes.map(() => []);
      nodes.forEach((n, i) => {
        const k = n.labelled ? 3 : 2;
        nodes
          .map((m, j) => ({ j, d: Math.hypot(m.hx - n.hx, m.hy - n.hy) }))
          .filter((o) => o.j !== i)
          .sort((a, b) => a.d - b.d)
          .slice(0, k)
          .forEach(({ j }) => {
            const id = i < j ? `${i}-${j}` : `${j}-${i}`;
            if (key.has(id)) return;
            key.add(id);
            const e = { a: i, b: j, born: Math.max(nodes[i].born, nodes[j].born) + 200 };
            adj[i].push(edges.length);
            adj[j].push(edges.length);
            edges.push(e);
          });
      });
      packets = [];
    }

    function spawn(now) {
      if (packets.length > (W < 960 ? 18 : 34)) return;
      const e = Math.floor(Math.random() * edges.length);
      const dir = Math.random() < 0.5 ? 1 : -1;
      packets.push({ e, t: dir > 0 ? 0 : 1, dir, v: rand(0.35, 0.8), hops: Math.floor(rand(1, 4)), c: Math.random() < 0.72 ? C.apricot : C.seafoam, born: now });
    }

    function step(now) {
      const time = (now - t0) / 1000;
      const age = now - t0;
      ctx.clearRect(0, 0, W, H);

      // update node positions: drift + soft repel from cursor
      hover = -1;
      let best = 26;
      nodes.forEach((n, i) => {
        const dx0 = Math.sin(time * n.speed + n.phase) * n.amp;
        const dy0 = Math.cos(time * n.speed * 0.8 + n.phase) * n.amp;
        let tx = n.hx + dx0, ty = n.hy + dy0;
        if (mouse.active) {
          const dx = tx - mouse.x, dy = ty - mouse.y;
          const d = Math.hypot(dx, dy);
          if (d < 150 && d > 0.01) {
            const f = (1 - d / 150) * 34;
            tx += (dx / d) * f; ty += (dy / d) * f;
          }
          const hd = Math.hypot(n.x - mouse.x, n.y - mouse.y);
          if (n.labelled && hd < best) { best = hd; hover = i; }
        }
        n.x += (tx - n.x) * 0.08;
        n.y += (ty - n.y) * 0.08;
      });
      canvas.style.cursor = hover >= 0 ? "pointer" : "crosshair";

      // edges
      ctx.lineWidth = 1;
      edges.forEach((e) => {
        const k = Math.min(1, Math.max(0, (age - e.born) / 700));
        if (k <= 0) return;
        const a = nodes[e.a], b = nodes[e.b];
        const hot = hover >= 0 && (e.a === hover || e.b === hover);
        ctx.strokeStyle = hot ? C.edgeHot : C.edge;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k);
        ctx.stroke();
      });

      // packets travel along edges and hop to neighbours
      if (age > 1400 && now - lastSpawn > 110) { spawn(now); lastSpawn = now; }
      const dt = 1 / 60;
      for (let p = packets.length - 1; p >= 0; p--) {
        const pk = packets[p];
        const e = edges[pk.e];
        const a = nodes[e.a], b = nodes[e.b];
        const len = Math.max(30, Math.hypot(b.x - a.x, b.y - a.y));
        pk.t += pk.dir * (pk.v * 140 * dt) / len;
        if (pk.t > 1 || pk.t < 0) {
          const at = pk.t > 1 ? e.b : e.a;
          pk.hops--;
          const options = adj[at].filter((x) => x !== pk.e);
          if (pk.hops <= 0 || !options.length) { packets.splice(p, 1); continue; }
          pk.e = options[Math.floor(Math.random() * options.length)];
          const ne = edges[pk.e];
          pk.dir = ne.a === at ? 1 : -1;
          pk.t = pk.dir > 0 ? 0 : 1;
          continue;
        }
        const x = a.x + (b.x - a.x) * pk.t;
        const y = a.y + (b.y - a.y) * pk.t;
        const g = ctx.createRadialGradient(x, y, 0, x, y, 9);
        g.addColorStop(0, `rgba(${pk.c}, 0.55)`);
        g.addColorStop(1, `rgba(${pk.c}, 0)`);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = `rgb(${pk.c})`;
        ctx.beginPath(); ctx.arc(x, y, 1.9, 0, Math.PI * 2); ctx.fill();
      }

      // nodes + labels
      const mobile = W < 960;
      ctx.font = `500 ${mobile ? 11 : 12}px "Geist Mono", ui-monospace, monospace`;
      ctx.textBaseline = "middle";
      nodes.forEach((n, i) => {
        const k = Math.min(1, Math.max(0, (age - n.born) / 600));
        if (k <= 0) return;
        const s = 1 - Math.pow(1 - k, 3);
        const hot = i === hover;
        if (n.labelled) {
          ctx.fillStyle = C.bg;
          ctx.strokeStyle = hot ? `rgb(${C.apricot})` : C.node;
          ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(n.x, n.y, (hot ? 6.5 : n.r) * s, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          if (hot) {
            ctx.strokeStyle = `rgba(${C.apricot}, 0.25)`;
            ctx.beginPath(); ctx.arc(n.x, n.y, 14 + Math.sin(time * 4) * 2, 0, Math.PI * 2); ctx.stroke();
          }
          ctx.globalAlpha = s;
          ctx.fillStyle = hot ? C.labelHot : C.label;
          ctx.fillText(n.label, n.x + 11, n.y - 1);
          ctx.globalAlpha = 1;
        } else {
          ctx.globalAlpha = 0.7 * s;
          ctx.fillStyle = C.node;
          ctx.beginPath(); ctx.arc(n.x, n.y, n.r * s, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 1;
        }
      });

      if (running) raf = requestAnimationFrame(step);
    }

    function start() { if (!running && !reduceMotion) { running = true; raf = requestAnimationFrame(step); } }
    function stop() { running = false; cancelAnimationFrame(raf); }

    build();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { build(); });
    if (reduceMotion) {
      t0 = performance.now() - 10000;
      step(performance.now());
    } else {
      start();
    }

    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { build(); t0 = performance.now() - 3000; if (reduceMotion) step(performance.now()); }, 150);
    });

    hero.addEventListener("pointermove", (e) => {
      const r = canvas.getBoundingClientRect();
      mouse = { x: e.clientX - r.left, y: e.clientY - r.top, active: true };
    });
    hero.addEventListener("pointerleave", () => { mouse.active = false; });

    // a click on a node sends a burst of packets out of it
    canvas.addEventListener("click", () => {
      if (hover < 0) return;
      adj[hover].forEach((ei) => {
        const e = edges[ei];
        const dir = e.a === hover ? 1 : -1;
        packets.push({ e: ei, t: dir > 0 ? 0 : 1, dir, v: 1.2, hops: 3, c: C.apricot, born: performance.now() });
      });
    });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([entry]) => { entry.isIntersecting ? start() : stop(); }).observe(hero);
    }
    document.addEventListener("visibilitychange", () => { document.hidden ? stop() : start(); });
  })();

  /* ------------------------------------------------------------------ */
  /* Live sync helpers                                                   */
  /* ------------------------------------------------------------------ */
  function fetchJSON(url, ms = 7000) {
    const ctrl = "AbortController" in window ? new AbortController() : null;
    const timer = ctrl ? setTimeout(() => ctrl.abort(), ms) : null;
    return fetch(url, ctrl ? { signal: ctrl.signal } : {})
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .finally(() => timer && clearTimeout(timer));
  }

  function ago(dateish) {
    const s = Math.max(1, (Date.now() - new Date(dateish).getTime()) / 1000);
    const units = [["year", 31536000], ["month", 2592000], ["week", 604800], ["day", 86400], ["hour", 3600], ["minute", 60]];
    for (const [u, sec] of units) {
      const v = Math.floor(s / sec);
      if (v >= 1) return `${v} ${u}${v > 1 ? "s" : ""} ago`;
    }
    return "just now";
  }

  function setStatus(el, text, state) {
    if (!el) return;
    el.textContent = text;
    el.classList.toggle("is-live", state === "live");
    el.classList.toggle("is-loading", state === "loading");
  }

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ------------------------------------------------------------------ */
  /* GitHub                                                              */
  /* ------------------------------------------------------------------ */
  (function github() {
    const panel = $("[data-gh]");
    if (!panel) return;
    const status = $("[data-gh-status]");
    const LANG_COLORS = ["#6fd3be", "#ff9f5a", "#c792ea", "#78b4ff", "#f5eef7"];

    function render({ user, repos }, fetchedAt) {
      const own = repos.filter((r) => !r.fork);
      setCount($("[data-gh-repos]"), user.public_repos);
      setCount($("[data-gh-followers]"), user.followers);
      setCount($("[data-gh-stars]"), own.reduce((s, r) => s + (r.stargazers_count || 0), 0));

      const counts = {};
      own.forEach((r) => { if (r.language) counts[r.language] = (counts[r.language] || 0) + 1; });
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      const total = sorted.reduce((s, [, n]) => s + n, 0);
      if (total) {
        const top = sorted.slice(0, 4);
        const rest = sorted.slice(4).reduce((s, [, n]) => s + n, 0);
        if (rest) top.push(["Other", rest]);
        $("[data-gh-langbar]").innerHTML = top.map(([, n], i) =>
          `<span style="--w:${((n / total) * 100).toFixed(1)}%;--c:${LANG_COLORS[i]}"></span>`).join("");
        $("[data-gh-langkey]").innerHTML = top.map(([name, n], i) =>
          `<li style="--c:${LANG_COLORS[i]}">${esc(name)} <small>${Math.round((n / total) * 100)}%</small></li>`).join("");
        const langs = $("[data-gh-langs]");
        langs.hidden = false;
        requestAnimationFrame(() => requestAnimationFrame(() => langs.classList.add("is-drawn")));
      }

      const recent = own.slice().sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at)).slice(0, 4);
      if (recent.length) {
        $("[data-gh-recent-title]").textContent = "Recently pushed";
        $("[data-gh-recent]").innerHTML = recent.map((r) =>
          `<li><a href="${esc(r.html_url)}" target="_blank" rel="noreferrer"><span>${esc(r.name)}<small>${ago(r.pushed_at)}</small></span><em>${esc(r.language || "Code")}</em></a></li>`
        ).join("");
      }
      setStatus(status, `Synced ${ago(fetchedAt)}`, "live");
    }

    const cached = store.get("gh-v1", 60 * 60 * 1000);
    if (cached) { render(cached.data, cached.t); return; }

    setStatus(status, "Syncing", "loading");
    Promise.all([
      fetchJSON(`https://api.github.com/users/${GH_USER}`),
      fetchJSON(`https://api.github.com/users/${GH_USER}/repos?per_page=100&sort=pushed`)
    ]).then(([user, repos]) => {
      const data = { user, repos };
      store.set("gh-v1", data);
      render(data, Date.now());
    }).catch(() => setStatus(status, "Snapshot", null));

    const contrib = $("[data-contrib]");
    const img = contrib && $("img", contrib);
    if (img) {
      img.addEventListener("error", () => { contrib.hidden = true; });
      if (img.complete && img.naturalWidth === 0) contrib.hidden = true;
    }
  })();

  /* ------------------------------------------------------------------ */
  /* LeetCode (public community APIs; LeetCode itself blocks browsers)   */
  /* ------------------------------------------------------------------ */
  (function leetcode() {
    const panel = $("[data-lc]");
    if (!panel) return;
    const status = $("[data-lc-status]");

    const sources = [
      () => fetchJSON(`https://leetcode-api-faisalshohag.vercel.app/${LC_USER}`).then((d) => {
        if (d.totalSolved == null) throw new Error("no data");
        return { total: d.totalSolved, easy: d.easySolved, medium: d.mediumSolved, hard: d.hardSolved, ranking: d.ranking };
      }),
      () => fetchJSON(`https://alfa-leetcode-api.onrender.com/${LC_USER}/solved`, 12000).then((d) => {
        if (d.solvedProblem == null) throw new Error("no data");
        return { total: d.solvedProblem, easy: d.easySolved, medium: d.mediumSolved, hard: d.hardSolved };
      })
    ];

    function render(s, fetchedAt) {
      const total = s.total || (s.easy + s.medium + s.hard) || 0;
      const totalEl = $("[data-lc-total]");
      totalEl.textContent = "0";
      animateCount(totalEl, total);
      ["easy", "medium", "hard"].forEach((k) => {
        $(`[data-lc-${k}]`).textContent = s[k] ?? "–";
        const share = total ? (s[k] || 0) / total : 0;
        requestAnimationFrame(() => { $(`[data-lc-bar="${k}"]`).style.setProperty("--w", `${(share * 100).toFixed(1)}%`); });
      });

      // donut: segments sized by share of solved problems
      const R = 52, CIRC = 2 * Math.PI * R, GAP = 5;
      let offset = 0;
      ["easy", "medium", "hard"].forEach((k) => {
        const seg = $(`[data-ring="${k}"]`);
        const len = total ? ((s[k] || 0) / total) * CIRC : 0;
        const vis = Math.max(0, len - GAP);
        seg.style.strokeDashoffset = String(-offset);
        seg.classList.toggle("has-value", vis > 0);
        requestAnimationFrame(() => { seg.style.strokeDasharray = `${vis} ${CIRC}`; });
        offset += len;
      });

      if (s.ranking) {
        const rank = $("[data-lc-rank]");
        rank.innerHTML = `Global ranking <b>#${Number(s.ranking).toLocaleString("en-IN")}</b>`;
        rank.hidden = false;
      }
      setStatus(status, `Synced ${ago(fetchedAt)}`, "live");
    }

    function fail() {
      setStatus(status, "Unavailable", null);
      ["total", "easy", "medium", "hard"].forEach((k) => { $(`[data-lc-${k}]`).textContent = "–"; });
      $("[data-lc-fallback]").hidden = false;
    }

    const cached = store.get("lc-v1", 6 * 60 * 60 * 1000);
    const go = () => {
      if (cached) { render(cached.data, cached.t); return; }
      setStatus(status, "Syncing", "loading");
      sources.reduce((p, src) => p.catch(src), Promise.reject())
        .then((s) => { store.set("lc-v1", s); render(s, Date.now()); })
        .catch(fail);
    };

    // start the ring animation when the panel scrolls into view
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); go(); } }, { threshold: 0.2 });
      io.observe(panel);
    } else {
      go();
    }
  })();

  onScroll();
})();
