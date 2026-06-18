const MovieApp = (() => {
  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function setupMenu() {
    const toggle = document.querySelector(".menu-toggle");
    const nav = document.querySelector(".mobile-nav");
    if (!toggle || !nav) {
      return;
    }
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
  }

  function setupHero() {
    const hero = document.querySelector(".js-hero");
    if (!hero) {
      return;
    }
    const slides = Array.from(hero.querySelectorAll(".hero-slide"));
    const dots = Array.from(hero.querySelectorAll(".hero-dot"));
    if (slides.length <= 1) {
      return;
    }
    let index = 0;
    let timer = null;
    const show = next => {
      index = (next + slides.length) % slides.length;
      slides.forEach((slide, i) => slide.classList.toggle("is-active", i === index));
      dots.forEach((dot, i) => dot.classList.toggle("is-active", i === index));
    };
    const start = () => {
      stop();
      timer = window.setInterval(() => show(index + 1), 5200);
    };
    const stop = () => {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    };
    dots.forEach((dot, i) => {
      dot.addEventListener("click", () => {
        show(i);
        start();
      });
    });
    hero.addEventListener("mouseenter", stop);
    hero.addEventListener("mouseleave", start);
    start();
  }

  function setupImages() {
    document.querySelectorAll("img").forEach(img => {
      img.addEventListener("error", () => {
        img.style.display = "none";
      }, { once: true });
    });
  }

  function setupFilters() {
    document.querySelectorAll("[data-filter-panel]").forEach(panel => {
      const root = panel.closest("main") || document;
      const input = panel.querySelector("[data-search-input]");
      const cards = Array.from(root.querySelectorAll(".movie-card"));
      const buttons = Array.from(panel.querySelectorAll("button"));
      const empty = root.querySelector(".empty-state");
      let type = "";
      let region = "";

      const normalize = value => String(value || "").trim().toLowerCase();
      const apply = () => {
        const keyword = normalize(input ? input.value : "");
        let visible = 0;
        cards.forEach(card => {
          const haystack = normalize([
            card.dataset.title,
            card.dataset.region,
            card.dataset.type,
            card.dataset.year,
            card.dataset.genre,
            card.dataset.category,
            card.textContent
          ].join(" "));
          const matchKeyword = !keyword || haystack.includes(keyword);
          const matchType = !type || card.dataset.type === type;
          const matchRegion = !region || card.dataset.region === region;
          const show = matchKeyword && matchType && matchRegion;
          card.style.display = show ? "" : "none";
          if (show) {
            visible += 1;
          }
        });
        if (empty) {
          empty.classList.toggle("show", visible === 0);
        }
      };

      if (input) {
        input.addEventListener("input", apply);
      }

      buttons.forEach(button => {
        button.addEventListener("click", () => {
          if (button.hasAttribute("data-filter-reset")) {
            type = "";
            region = "";
            if (input) {
              input.value = "";
            }
          }
          if (button.hasAttribute("data-filter-type")) {
            const value = button.getAttribute("data-filter-type") || "";
            type = type === value ? "" : value;
          }
          if (button.hasAttribute("data-filter-region")) {
            const value = button.getAttribute("data-filter-region") || "";
            region = region === value ? "" : value;
          }
          buttons.forEach(item => item.classList.remove("active"));
          const typeButton = type ? panel.querySelector(`[data-filter-type="${CSS.escape(type)}"]`) : null;
          const regionButton = region ? panel.querySelector(`[data-filter-region="${CSS.escape(region)}"]`) : null;
          if (!type && !region && (!input || !input.value)) {
            const reset = panel.querySelector("[data-filter-reset]");
            if (reset) {
              reset.classList.add("active");
            }
          }
          if (typeButton) {
            typeButton.classList.add("active");
          }
          if (regionButton) {
            regionButton.classList.add("active");
          }
          apply();
        });
      });
    });
  }

  function mountPlayer(src) {
    const video = document.querySelector(".js-player-video");
    const overlay = document.querySelector(".js-player-overlay");
    if (!video || !src) {
      return;
    }
    let attached = false;
    let hls = null;

    const attach = () => {
      if (attached) {
        return Promise.resolve();
      }
      attached = true;
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src;
        return Promise.resolve();
      }
      if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(src);
        hls.attachMedia(video);
        return new Promise(resolve => {
          hls.on(window.Hls.Events.MANIFEST_PARSED, resolve);
          window.setTimeout(resolve, 1600);
        });
      }
      video.src = src;
      return Promise.resolve();
    };

    const play = () => {
      if (overlay) {
        overlay.classList.add("is-hidden");
      }
      attach().then(() => video.play()).catch(() => {});
    };

    if (overlay) {
      overlay.addEventListener("click", play);
    }
    video.addEventListener("click", () => {
      if (video.paused) {
        play();
      }
    });
    video.addEventListener("play", () => {
      if (overlay) {
        overlay.classList.add("is-hidden");
      }
    });
    window.addEventListener("pagehide", () => {
      if (hls) {
        hls.destroy();
      }
    });
  }

  ready(() => {
    setupMenu();
    setupHero();
    setupImages();
    setupFilters();
  });

  return {
    mountPlayer
  };
})();
