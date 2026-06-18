(function () {
  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
    } else {
      document.addEventListener("DOMContentLoaded", fn);
    }
  }

  ready(function () {
    var toggle = document.querySelector("[data-nav-toggle]");
    var mobileNav = document.querySelector("[data-mobile-nav]");

    if (toggle && mobileNav) {
      toggle.addEventListener("click", function () {
        mobileNav.classList.toggle("open");
      });
    }

    var slides = Array.prototype.slice.call(document.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(document.querySelectorAll("[data-hero-dot]"));
    var currentSlide = 0;

    function showSlide(index) {
      if (!slides.length) {
        return;
      }
      currentSlide = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("active", i === currentSlide);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("active", i === currentSlide);
      });
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        showSlide(i);
      });
    });

    if (slides.length > 1) {
      setInterval(function () {
        showSlide(currentSlide + 1);
      }, 5200);
    }

    var searchInputs = Array.prototype.slice.call(document.querySelectorAll("[data-search-input]"));
    var genreSelect = document.querySelector("[data-filter-genre]");
    var cards = Array.prototype.slice.call(document.querySelectorAll("[data-movie-card]"));

    function filterCards() {
      var query = searchInputs.map(function (input) {
        return input.value.trim().toLowerCase();
      }).filter(Boolean).pop() || "";
      var genre = genreSelect ? genreSelect.value.trim().toLowerCase() : "";

      cards.forEach(function (card) {
        var haystack = [
          card.getAttribute("data-title"),
          card.getAttribute("data-year"),
          card.getAttribute("data-region"),
          card.getAttribute("data-genre"),
          card.getAttribute("data-tags")
        ].join(" ").toLowerCase();
        var okQuery = !query || haystack.indexOf(query) !== -1;
        var okGenre = !genre || haystack.indexOf(genre) !== -1;
        card.classList.toggle("is-hidden", !(okQuery && okGenre));
      });
    }

    searchInputs.forEach(function (input) {
      input.addEventListener("input", filterCards);
    });

    if (genreSelect) {
      genreSelect.addEventListener("change", filterCards);
    }

    var players = Array.prototype.slice.call(document.querySelectorAll("[data-player]"));

    players.forEach(function (player) {
      var video = player.querySelector("video");
      var cover = player.querySelector("[data-player-cover]");
      var message = player.querySelector("[data-player-message]");
      var streamUrl = player.getAttribute("data-stream");
      var initialized = false;
      var hlsInstance = null;

      function setMessage(text) {
        if (message) {
          message.textContent = text || "";
          message.hidden = !text;
        }
      }

      function setup() {
        if (!video || !streamUrl || initialized) {
          return;
        }
        initialized = true;
        setMessage("");

        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = streamUrl;
        } else if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls({
            maxBufferLength: 24
          });
          hlsInstance.loadSource(streamUrl);
          hlsInstance.attachMedia(video);
          hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
            if (data && data.fatal) {
              setMessage("暂时无法播放");
            }
          });
        } else {
          setMessage("暂时无法播放");
        }
      }

      function play() {
        setup();
        if (!video) {
          return;
        }
        var promise = video.play();
        if (promise && promise.catch) {
          promise.catch(function () {
            setMessage("点击画面继续播放");
          });
        }
      }

      if (cover) {
        cover.addEventListener("click", function () {
          cover.classList.add("hidden");
          play();
        });
      }

      if (video) {
        video.addEventListener("click", function () {
          if (video.paused) {
            play();
          } else {
            video.pause();
          }
        });
        video.addEventListener("play", function () {
          if (cover) {
            cover.classList.add("hidden");
          }
        });
      }

      window.addEventListener("pagehide", function () {
        if (hlsInstance) {
          hlsInstance.destroy();
        }
      });
    });
  });
})();
