(function () {

  /* ==============================
     Utilities
  ============================== */

  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const smoothstep = (t) => {
    t = clamp(t, 0, 1);
    return t * t * (3 - 2 * t);
  };

  /* ==============================
     HERO PIN REVEAL
  ============================== */

  const heroPinSpacer = document.querySelector(".hero-pin-spacer");
  const heroBg = document.querySelector('[data-parallax="heroBg"]');
  const heroFront = document.querySelector("[data-hero-front]");
  const heroBack = document.querySelector("[data-hero-back]");

  function updateHeroPinned() {
    if (!heroPinSpacer) return;

    const r = heroPinSpacer.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    const travel = Math.max(1, heroPinSpacer.offsetHeight - vh);
    const p = clamp(-r.top / travel, 0, 1);

    if (heroBg) {
      const bgY = Math.min(p * 30, 30);
      heroBg.style.transform = `translate3d(0, ${bgY}px, 0) scale(1.08)`;
    }

    if (heroFront) {
      const t1 = clamp(p / 0.20, 0, 1);
      heroFront.style.transform = `translate3d(0, ${(1 - t1) * 80}px, 0)`;
      heroFront.style.opacity = String(t1);
    }

    if (heroBack) {
      const t2 = clamp((p - 0.15) / 0.20, 0, 1);
      heroBack.style.transform = `translate3d(0, ${(1 - t2) * 18}px, 0)`;
      heroBack.style.opacity = String(t2);
    }
  }

  /* ==============================
     MISSION / VISION PIN
  ============================== */

  const mvSpacer = document.querySelector(".mv-pin-spacer");
  const mvTrack = document.querySelector("[data-mv-track]");
  const mvMission = document.querySelector("[data-mv-mission]");
  const mvVision  = document.querySelector("[data-mv-vision]");

  function updateMV() {
    if (!mvSpacer || !mvTrack) return;

    const r = mvSpacer.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    const travel = Math.max(1, mvSpacer.offsetHeight - vh);
    const p = clamp(-r.top / travel, 0, 1);

    const slideStart = 0.38;
    const slideEnd   = 0.88;

    let x = 0;
    if (p <= slideStart) x = 0;
    else if (p >= slideEnd) x = -50;
    else {
      const t = (p - slideStart) / (slideEnd - slideStart);
      x = -50 * smoothstep(t);
    }

    mvTrack.style.transform = `translate3d(${x}%,0,0)`;

    if (mvMission && mvVision) {
      const fadeT = clamp((p - slideStart) / (slideEnd - slideStart), 0, 1);
      const e = smoothstep(fadeT);
      mvMission.style.opacity = String(1 - e);
      mvVision.style.opacity  = String(e);
    }
  }

  /* ==============================
     CAROUSEL (INFINITE + DOTS)
  ============================== */

  const carSection  = document.querySelector("#carousel");
  const carTrack    = document.querySelector("[data-car-track]");
  const carPrev     = document.querySelector("[data-car-prev]");
  const carNext     = document.querySelector("[data-car-next]");
  const carDots     = document.querySelector("[data-car-dots]");
  const carWindow   = document.querySelector("[data-car-window]");

  let carSlides = carTrack ? Array.from(carTrack.children) : [];
  const realCount = carSlides.length;

  let carIndex = 0;
  let pos = 0;
  let carTimer = null;
  const intervalMs = 2800;

  function setTransition(on) {
    if (!carTrack) return;
    carTrack.style.transition = on ? "transform 700ms ease" : "none";
  }

  function buildDots() {
    if (!carDots || !realCount) return;
    carDots.innerHTML = "";

    for (let i = 0; i < realCount; i++) {
      const b = document.createElement("button");
      b.className = "dotbtn" + (i === carIndex ? " active" : "");
      b.type = "button";
      b.setAttribute("aria-label", `Go to slide ${i + 1}`);

      b.addEventListener("click", () => {
        carIndex = i;
        pos = i;
        setTransition(true);
        renderCarousel();
      });

      carDots.appendChild(b);
    }
  }

  function updateDots() {
    if (!carDots) return;
    const btns = Array.from(carDots.children);
    btns.forEach((b, i) => b.classList.toggle("active", i === carIndex));
  }

  function renderCarousel() {
    if (!carTrack || !realCount) return;
    carTrack.style.transform = `translate3d(${-pos * 100}%,0,0)`;
    updateDots();
  }

  function nextSlide() {
    if (!realCount) return;
    pos += 1;
    carIndex = (carIndex + 1) % realCount;
    setTransition(true);
    renderCarousel();
  }

  function prevSlide() {
    if (!realCount) return;

    if (pos === 0) {
      setTransition(false);
      pos = realCount;
      renderCarousel();

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTransition(true);
          pos = realCount - 1;
          carIndex = realCount - 1;
          renderCarousel();
        });
      });
      return;
    }

    pos -= 1;
    carIndex = (carIndex - 1 + realCount) % realCount;
    setTransition(true);
    renderCarousel();
  }

  function startAuto() {
    stopAuto();
    carTimer = setInterval(nextSlide, intervalMs);
  }

  function stopAuto() {
    if (carTimer) clearInterval(carTimer);
    carTimer = null;
  }

  function setupInfinite() {
    if (!carTrack || !realCount) return;

    const cloneExists = carTrack.querySelector("[data-clone]");
    if (!cloneExists) {
      const clone = carSlides[0].cloneNode(true);
      clone.setAttribute("data-clone", "1");
      carTrack.appendChild(clone);
    }

    carSlides = Array.from(carTrack.children);
    buildDots();
    renderCarousel();

    carTrack.addEventListener("transitionend", () => {
      if (pos === realCount) {
        setTransition(false);
        pos = 0;
        renderCarousel();
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setTransition(true));
        });
      }
    });
  }

  function bindCarousel() {
    if (!carTrack || !realCount) return;

    setupInfinite();

    carNext?.addEventListener("click", nextSlide);
    carPrev?.addEventListener("click", prevSlide);

    // Swipe
    let startX = 0;
    let dragging = false;

    carWindow?.addEventListener("pointerdown", (e) => {
      dragging = true;
      startX = e.clientX;
      carWindow.setPointerCapture(e.pointerId);
    });

    carWindow?.addEventListener("pointerup", (e) => {
      if (!dragging) return;
      dragging = false;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 40) dx < 0 ? nextSlide() : prevSlide();
    });

    carWindow?.addEventListener("pointercancel", () => {
      dragging = false;
    });

    // Auto only when visible
    if (carSection) {
      const io = new IntersectionObserver((entries) => {
        entries[0].isIntersecting ? startAuto() : stopAuto();
      }, { threshold: 0.35 });
      io.observe(carSection);
    } else {
      startAuto();
    }

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stopAuto();
      else startAuto();
    });
  }

  /* ==============================
     INDUSTRIES PIN (TRUE CROSSFADE + TEXT PASSES THROUGH)
     - BG is pinned, no dim gap
     - Text motion uses global progress s (no reset)
  ============================== */

  const indSpacer = document.querySelector("[data-ind-spacer]");
  const indBgs = Array.from(document.querySelectorAll("[data-ind-bg]"));
  const indFrames = Array.from(document.querySelectorAll("[data-ind-frame]"));

  function updateIndustriesPin() {
    if (!indSpacer || !indBgs.length || !indFrames.length) return;

    const r = indSpacer.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    const travel = Math.max(1, indSpacer.offsetHeight - vh);
    const p = clamp(-r.top / travel, 0, 1);

    const n = indFrames.length;
    const s = p * n; // continuous global segment progress

    const i = Math.floor(clamp(s, 0, n - 1));
    const t = s - i;

    // Dissolve window (shared by BG + text)
    const fadeStart = 0.70;
    const fadeEnd   = 0.92;
    const xf = clamp((t - fadeStart) / (fadeEnd - fadeStart), 0, 1);
    const e = smoothstep(xf);

    // --- Backgrounds: true crossfade (current + next = 1 during fade) ---
    indBgs.forEach((bg, k) => {
      let op = 0;

      if (k === i) op = 1;
      if (t >= fadeStart && t <= fadeEnd) {
        if (k === i) op = 1 - e;
        if (k === i + 1) op = e;
      }
      if (t > fadeEnd) {
        if (k === i) op = 0;
        if (k === i + 1) op = 1;
      }

      bg.style.opacity = String(op);
    });

    // --- Text: passes upward using global local = s - k (no snapping) ---
    const travelPx = 260;

    indFrames.forEach((frame, k) => {
      const local = s - k; // continuous per frame, active when 0..1

      // render only nearby frames
      if (local < -0.25 || local > 1.25) {
        frame.style.opacity = "0";
        frame.style.transform = "translate3d(0, 9999px, 0)";
        return;
      }

      // Opacity: full on for most, then fade out in the dissolve window
      // Also fade in near the start of its segment so it doesn't pop.
      const inStart = 0.06;
      const inEnd   = 0.18;

      let op = 0;

      if (local >= 0 && local < inStart) op = 0;
      else if (local >= inStart && local <= inEnd) {
        op = smoothstep((local - inStart) / (inEnd - inStart));
      } else if (local > inEnd && local < fadeStart) {
        op = 1;
      } else if (local >= fadeStart && local <= fadeEnd) {
        // same fade-out timing as bg
        const lx = clamp((local - fadeStart) / (fadeEnd - fadeStart), 0, 1);
        op = 1 - smoothstep(lx);
      } else {
        op = 0;
      }

      // Movement: enters from below, passes center, exits top
      const y = (0.45 - local) * travelPx;
      frame.style.opacity = String(op);
      frame.style.transform = `translate3d(0, ${y}px, 0)`;
    });
  }

  /* ==============================
     RAF LOOP
  ============================== */

  let ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;

    requestAnimationFrame(() => {
      updateHeroPinned();
      updateMV();
      updateIndustriesPin();
      ticking = false;
    });
  }

  // Init
  bindCarousel();
  updateHeroPinned();
  updateMV();
  updateIndustriesPin();

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => {
    updateHeroPinned();
    updateMV();
    updateIndustriesPin();
  });

})();