(function () {
  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
    } else {
      document.addEventListener("DOMContentLoaded", fn);
    }
  }

  function initMenu() {
    var button = document.querySelector("[data-menu-button]");
    var menu = document.querySelector("[data-mobile-nav]");
    if (!button || !menu) return;
    button.addEventListener("click", function () {
      menu.classList.toggle("open");
      button.textContent = menu.classList.contains("open") ? "×" : "☰";
    });
  }

  function initHero() {
    var root = document.querySelector("[data-hero]");
    if (!root) return;
    var slides = Array.prototype.slice.call(root.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(root.querySelectorAll("[data-hero-dot]"));
    if (slides.length < 2) return;
    var current = 0;
    var timer = null;

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("active", i === current);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("active", i === current);
      });
    }

    function start() {
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5200);
    }

    function stop() {
      if (timer) window.clearInterval(timer);
      timer = null;
    }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        stop();
        show(Number(dot.getAttribute("data-hero-dot")) || 0);
        start();
      });
    });

    root.addEventListener("mouseenter", stop);
    root.addEventListener("mouseleave", start);
    start();
  }

  function normalize(value) {
    return String(value || "").toLowerCase().trim();
  }

  function initFilters() {
    var inputs = Array.prototype.slice.call(document.querySelectorAll("[data-search-input]"));
    var cards = Array.prototype.slice.call(document.querySelectorAll("[data-card]"));
    var empty = document.querySelector("[data-empty-state]");
    var filterButtons = Array.prototype.slice.call(document.querySelectorAll("[data-filter]"));
    if (!cards.length) return;

    var params = new URLSearchParams(window.location.search);
    var initial = params.get("q") || "";
    var category = "all";
    inputs.forEach(function (input) {
      input.value = initial;
    });

    function apply() {
      var query = normalize(inputs[0] ? inputs[0].value : "");
      var visible = 0;
      cards.forEach(function (card) {
        var text = normalize(card.getAttribute("data-title"));
        var cardCategory = card.getAttribute("data-category") || "";
        var matchText = !query || text.indexOf(query) !== -1;
        var matchCategory = category === "all" || cardCategory === category;
        var show = matchText && matchCategory;
        card.style.display = show ? "" : "none";
        if (show) visible += 1;
      });
      if (empty) empty.classList.toggle("show", visible === 0);
    }

    inputs.forEach(function (input) {
      input.addEventListener("input", apply);
    });

    filterButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        category = button.getAttribute("data-filter") || "all";
        filterButtons.forEach(function (item) {
          item.classList.toggle("active", item === button);
        });
        apply();
      });
    });

    apply();
  }

  window.initMoviePlayer = function (source) {
    var video = document.getElementById("video-player");
    var button = document.getElementById("play-button");
    if (!video || !button || !source) return;
    var loaded = false;
    var hls = null;

    function attach() {
      if (loaded) return;
      loaded = true;
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = source;
      } else if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({ enableWorker: true });
        hls.loadSource(source);
        hls.attachMedia(video);
      } else {
        video.src = source;
      }
    }

    function start() {
      attach();
      button.classList.add("is-hidden");
      var playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(function () {
          button.classList.remove("is-hidden");
        });
      }
    }

    button.addEventListener("click", start);
    video.addEventListener("click", function () {
      if (!loaded) start();
    });
    video.addEventListener("play", function () {
      button.classList.add("is-hidden");
    });
    video.addEventListener("pause", function () {
      if (video.currentTime === 0 || video.ended) {
        button.classList.remove("is-hidden");
      }
    });
    window.addEventListener("pagehide", function () {
      if (hls) hls.destroy();
    });
  };

  ready(function () {
    initMenu();
    initHero();
    initFilters();
  });
})();
