(function () {
  function ready(callback) {
    if (document.readyState !== 'loading') {
      callback();
    } else {
      document.addEventListener('DOMContentLoaded', callback);
    }
  }

  function setupMenu() {
    var button = document.querySelector('[data-menu-button]');
    var panel = document.querySelector('[data-mobile-panel]');
    if (!button || !panel) {
      return;
    }
    button.addEventListener('click', function () {
      panel.classList.toggle('is-open');
    });
  }

  function setupHero() {
    var root = document.querySelector('[data-hero]');
    if (!root) {
      return;
    }
    var slides = Array.prototype.slice.call(root.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(root.querySelectorAll('[data-hero-dot]'));
    var prev = root.querySelector('[data-hero-prev]');
    var next = root.querySelector('[data-hero-next]');
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      if (!slides.length) {
        return;
      }
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === index);
      });
    }

    function restart() {
      if (timer) {
        window.clearInterval(timer);
      }
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5600);
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        show(i);
        restart();
      });
    });

    if (prev) {
      prev.addEventListener('click', function () {
        show(index - 1);
        restart();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
        restart();
      });
    }

    show(0);
    restart();
  }

  function textOf(card) {
    return [
      card.getAttribute('data-title') || '',
      card.getAttribute('data-region') || '',
      card.getAttribute('data-type') || '',
      card.getAttribute('data-year') || '',
      card.getAttribute('data-tags') || '',
      card.textContent || ''
    ].join(' ').toLowerCase();
  }

  function setupFilters() {
    var panels = Array.prototype.slice.call(document.querySelectorAll('[data-filter-panel]'));
    panels.forEach(function (panel) {
      var section = panel.closest('[data-card-list]') || document;
      var cards = Array.prototype.slice.call(section.querySelectorAll('.movie-card, .ranking-card'));
      var search = panel.querySelector('[data-card-search]');
      var selects = Array.prototype.slice.call(panel.querySelectorAll('[data-filter-select]'));
      var empty = section.querySelector('[data-no-results]');

      function apply() {
        var query = search ? search.value.trim().toLowerCase() : '';
        var filters = {};
        selects.forEach(function (select) {
          filters[select.getAttribute('data-filter-select')] = select.value;
        });
        var visible = 0;
        cards.forEach(function (card) {
          var ok = true;
          if (query && textOf(card).indexOf(query) === -1) {
            ok = false;
          }
          Object.keys(filters).forEach(function (key) {
            if (filters[key] && card.getAttribute('data-' + key) !== filters[key]) {
              ok = false;
            }
          });
          card.classList.toggle('is-hidden-card', !ok);
          if (ok) {
            visible += 1;
          }
        });
        if (empty) {
          empty.classList.toggle('is-visible', visible === 0);
        }
      }

      if (search) {
        search.addEventListener('input', apply);
      }
      selects.forEach(function (select) {
        select.addEventListener('change', apply);
      });
      apply();
    });
  }

  ready(function () {
    setupMenu();
    setupHero();
    setupFilters();
  });
})();

function initMoviePlayer(streamUrl) {
  var video = document.getElementById('movie-player');
  var startButton = document.querySelector('[data-player-start]');
  var shell = document.querySelector('[data-player-shell]');
  var hlsInstance = null;
  var initialized = false;

  function attachStream() {
    if (!video || initialized) {
      return;
    }
    initialized = true;
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
    } else if (window.Hls && window.Hls.isSupported()) {
      hlsInstance = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      hlsInstance.loadSource(streamUrl);
      hlsInstance.attachMedia(video);
    } else {
      video.src = streamUrl;
    }
  }

  function start() {
    if (!video) {
      return;
    }
    attachStream();
    if (startButton) {
      startButton.classList.add('is-hidden');
    }
    var playPromise = video.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(function () {});
    }
  }

  if (startButton) {
    startButton.addEventListener('click', start);
  }
  if (shell) {
    shell.addEventListener('click', function (event) {
      if (event.target === video && video.paused) {
        start();
      }
    });
  }
  if (video) {
    video.addEventListener('play', function () {
      if (startButton) {
        startButton.classList.add('is-hidden');
      }
    });
    video.addEventListener('emptied', function () {
      if (hlsInstance && typeof hlsInstance.destroy === 'function') {
        hlsInstance.destroy();
        hlsInstance = null;
      }
      initialized = false;
    });
  }
}
