(function () {
  var menuToggle = document.querySelector('[data-menu-toggle]');
  var mobilePanel = document.querySelector('[data-mobile-panel]');

  if (menuToggle && mobilePanel) {
    menuToggle.addEventListener('click', function () {
      var open = mobilePanel.classList.toggle('is-open');
      menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  var hero = document.querySelector('[data-hero]');

  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var current = 0;

    var showSlide = function (index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === current);
      });
    };

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        showSlide(Number(dot.getAttribute('data-hero-dot')) || 0);
      });
    });

    if (slides.length > 1) {
      window.setInterval(function () {
        showSlide(current + 1);
      }, 6500);
    }
  }

  var scrollPlayer = document.querySelector('[data-scroll-player]');

  if (scrollPlayer) {
    scrollPlayer.addEventListener('click', function (event) {
      event.preventDefault();
      var player = document.querySelector('[data-player]');
      if (player) {
        player.scrollIntoView({ behavior: 'smooth', block: 'center' });
        var overlay = player.querySelector('.player-overlay');
        if (overlay) {
          overlay.click();
        }
      }
    });
  }

  var playerNodes = Array.prototype.slice.call(document.querySelectorAll('[data-player]'));

  playerNodes.forEach(function (node) {
    var video = node.querySelector('video');
    var overlay = node.querySelector('.player-overlay');
    var source = node.getAttribute('data-src');
    var initialized = false;
    var hls = null;

    var initialize = function () {
      if (initialized || !video || !source) {
        return;
      }

      initialized = true;

      if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: false
        });
        hls.loadSource(source);
        hls.attachMedia(video);
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
      } else {
        video.src = source;
      }
    };

    var start = function () {
      initialize();
      if (overlay) {
        overlay.classList.add('is-hidden');
      }
      var playPromise = video.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(function () {
          if (overlay) {
            overlay.classList.remove('is-hidden');
          }
        });
      }
    };

    if (overlay && video) {
      overlay.addEventListener('click', start);
    }

    if (video) {
      video.addEventListener('play', function () {
        if (overlay) {
          overlay.classList.add('is-hidden');
        }
      });

      video.addEventListener('pause', function () {
        if (overlay && !video.ended) {
          overlay.classList.remove('is-hidden');
        }
      });

      video.addEventListener('ended', function () {
        if (overlay) {
          overlay.classList.remove('is-hidden');
        }
      });
    }

    window.addEventListener('pagehide', function () {
      if (hls && typeof hls.destroy === 'function') {
        hls.destroy();
      }
    });
  });

  var searchPage = document.querySelector('[data-search-page]');

  if (searchPage) {
    var params = new URLSearchParams(window.location.search);
    var query = (params.get('q') || '').trim();
    var input = searchPage.querySelector('[data-search-input]');
    var status = searchPage.querySelector('[data-search-status]');
    var cards = Array.prototype.slice.call(searchPage.querySelectorAll('.movie-card'));

    if (input) {
      input.value = query;
    }

    var normalize = function (value) {
      return String(value || '').toLowerCase();
    };

    var filterCards = function (term) {
      var normalized = normalize(term);
      var matched = 0;

      cards.forEach(function (card) {
        var haystack = normalize([
          card.getAttribute('data-title'),
          card.getAttribute('data-tags'),
          card.getAttribute('data-region'),
          card.getAttribute('data-year'),
          card.textContent
        ].join(' '));
        var visible = !normalized || haystack.indexOf(normalized) !== -1;
        card.classList.toggle('is-hidden', !visible);
        if (visible) {
          matched += 1;
        }
      });

      if (status) {
        status.textContent = normalized ? '已匹配 ' + matched + ' 条结果' : '输入关键词浏览匹配结果';
      }
    };

    filterCards(query);

    if (input) {
      input.addEventListener('input', function () {
        filterCards(input.value.trim());
      });
    }
  }
})();
