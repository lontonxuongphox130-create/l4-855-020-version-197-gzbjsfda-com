(function () {
  function selectAll(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function escapeHTML(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function setupMobileMenu() {
    var button = document.querySelector("[data-mobile-toggle]");
    var nav = document.querySelector("[data-mobile-nav]");
    if (!button || !nav) {
      return;
    }
    button.addEventListener("click", function () {
      nav.classList.toggle("open");
    });
  }

  function setupBackTop() {
    selectAll("[data-back-top]").forEach(function (button) {
      button.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
  }

  function setupHero() {
    var slides = selectAll("[data-hero-slide]");
    var dots = selectAll("[data-hero-dot]");
    if (slides.length <= 1) {
      return;
    }
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("active", slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("active", dotIndex === index);
      });
    }

    function start() {
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener("click", function () {
        window.clearInterval(timer);
        show(dotIndex);
        start();
      });
    });

    show(0);
    start();
  }

  function setupFilters() {
    selectAll("[data-filter-input]").forEach(function (input) {
      var scopeSelector = input.getAttribute("data-filter-scope") || "body";
      var scope = document.querySelector(scopeSelector) || document;
      var cards = selectAll("[data-filter-card]", scope);
      var empty = document.querySelector(input.getAttribute("data-empty-target") || "");

      function applyFilter() {
        var keyword = input.value.trim().toLowerCase();
        var visible = 0;
        cards.forEach(function (card) {
          var text = (card.getAttribute("data-keywords") || card.textContent || "").toLowerCase();
          var matched = text.indexOf(keyword) !== -1;
          card.style.display = matched ? "" : "none";
          if (matched) {
            visible += 1;
          }
        });
        if (empty) {
          empty.classList.toggle("show", visible === 0);
        }
      }

      input.addEventListener("input", applyFilter);
      applyFilter();
    });
  }

  function setupSearchPage() {
    var root = document.querySelector("[data-search-page]");
    if (!root || !window.SEARCH_MOVIES) {
      return;
    }

    var input = root.querySelector("[data-search-input]");
    var region = root.querySelector("[data-search-region]");
    var type = root.querySelector("[data-search-type]");
    var year = root.querySelector("[data-search-year]");
    var results = root.querySelector("[data-search-results]");
    var empty = root.querySelector("[data-search-empty]");
    var params = new URLSearchParams(window.location.search);

    function fillSelect(select, values, current) {
      if (!select) {
        return;
      }
      values.forEach(function (value) {
        var option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        if (value === current) {
          option.selected = true;
        }
        select.appendChild(option);
      });
    }

    var uniqueRegions = Array.from(new Set(window.SEARCH_MOVIES.map(function (movie) { return movie.region; }))).sort();
    var uniqueTypes = Array.from(new Set(window.SEARCH_MOVIES.map(function (movie) { return movie.type; }))).sort();
    var uniqueYears = Array.from(new Set(window.SEARCH_MOVIES.map(function (movie) { return movie.year; }))).sort().reverse();

    if (input && params.get("q")) {
      input.value = params.get("q");
    }
    fillSelect(region, uniqueRegions, params.get("region"));
    fillSelect(type, uniqueTypes, params.get("type"));
    fillSelect(year, uniqueYears, params.get("year"));

    function card(movie) {
      return "" +
        "<article class="movie-card">" +
        "<a class="card-link" href="" + escapeHTML(movie.url) + "" aria-label="观看" + escapeHTML(movie.title) + "">" +
        "<div class="card-poster">" +
        "<img src="" + escapeHTML(movie.cover) + "" alt="" + escapeHTML(movie.title) + "" loading="lazy">" +
        "<span class="year-badge">" + escapeHTML(movie.year) + "</span>" +
        "<span class="play-badge">▶</span>" +
        "</div>" +
        "<div class="card-body">" +
        "<h3>" + escapeHTML(movie.title) + "</h3>" +
        "<p>" + escapeHTML(movie.oneLine) + "</p>" +
        "<div class="card-meta"><span>" + escapeHTML(movie.type) + "</span><span>" + escapeHTML(movie.genre) + "</span></div>" +
        "</div>" +
        "</a>" +
        "</article>";
    }

    function render() {
      var q = input ? input.value.trim().toLowerCase() : "";
      var selectedRegion = region ? region.value : "";
      var selectedType = type ? type.value : "";
      var selectedYear = year ? year.value : "";

      var matched = window.SEARCH_MOVIES.filter(function (movie) {
        var haystack = [movie.title, movie.region, movie.type, movie.year, movie.genre, movie.tags, movie.oneLine].join(" ").toLowerCase();
        return (!q || haystack.indexOf(q) !== -1) &&
          (!selectedRegion || movie.region === selectedRegion) &&
          (!selectedType || movie.type === selectedType) &&
          (!selectedYear || movie.year === selectedYear);
      });

      results.innerHTML = matched.map(card).join("");
      if (empty) {
        empty.classList.toggle("show", matched.length === 0);
      }
    }

    [input, region, type, year].forEach(function (control) {
      if (control) {
        control.addEventListener("input", render);
        control.addEventListener("change", render);
      }
    });

    render();
  }

  function setupPlayers() {
    selectAll("[data-player]").forEach(function (shell) {
      var video = shell.querySelector("video");
      var button = shell.querySelector("[data-play]");
      var status = shell.querySelector("[data-player-status]");
      var source = shell.getAttribute("data-video-src");
      var prepared = false;
      var hlsInstance = null;

      function setStatus(message) {
        if (status) {
          status.textContent = message;
        }
      }

      function prepareVideo() {
        if (!video || !source || prepared) {
          return;
        }
        setStatus("正在连接播放源");
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = source;
        } else if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true
          });
          hlsInstance.loadSource(source);
          hlsInstance.attachMedia(video);
        } else {
          video.src = source;
        }
        prepared = true;
      }

      function playVideo() {
        prepareVideo();
        if (!video) {
          return;
        }
        shell.classList.add("is-playing");
        var playPromise = video.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(function () {
            shell.classList.remove("is-playing");
            setStatus("点击播放器控件继续播放");
          });
        }
      }

      if (button) {
        button.addEventListener("click", playVideo);
      }
      if (video) {
        video.addEventListener("play", function () {
          shell.classList.add("is-playing");
          setStatus("正在播放");
        });
        video.addEventListener("pause", function () {
          if (!video.ended) {
            setStatus("已暂停");
          }
        });
        video.addEventListener("ended", function () {
          shell.classList.remove("is-playing");
          setStatus("播放结束");
        });
        video.addEventListener("error", function () {
          setStatus("播放源暂时无法连接，请稍后重试");
        });
      }

      window.addEventListener("beforeunload", function () {
        if (hlsInstance) {
          hlsInstance.destroy();
        }
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    setupMobileMenu();
    setupBackTop();
    setupHero();
    setupFilters();
    setupSearchPage();
    setupPlayers();
  });
})();
