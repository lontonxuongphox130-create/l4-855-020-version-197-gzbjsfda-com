function setupMobileMenu() {
  const toggle = document.querySelector('[data-menu-toggle]');
  const panel = document.querySelector('[data-mobile-panel]');
  if (!toggle || !panel) {
    return;
  }
  toggle.addEventListener('click', function () {
    panel.classList.toggle('is-open');
  });
}

function setupHeroSlider() {
  const slides = Array.from(document.querySelectorAll('[data-hero-slide]'));
  const dots = Array.from(document.querySelectorAll('[data-hero-dot]'));
  if (!slides.length || !dots.length) {
    return;
  }
  let current = 0;
  let timer = null;
  function show(index) {
    current = (index + slides.length) % slides.length;
    slides.forEach(function (slide, idx) {
      slide.classList.toggle('is-active', idx === current);
    });
    dots.forEach(function (dot, idx) {
      dot.classList.toggle('is-active', idx === current);
    });
  }
  function start() {
    timer = window.setInterval(function () {
      show(current + 1);
    }, 5600);
  }
  dots.forEach(function (dot, idx) {
    dot.addEventListener('click', function () {
      if (timer) {
        window.clearInterval(timer);
      }
      show(idx);
      start();
    });
  });
  show(0);
  start();
}

function normalizeText(value) {
  return String(value || '').toLowerCase().replace(/\s+/g, '');
}

function setupLocalFilters() {
  const search = document.getElementById('localSearch');
  const year = document.getElementById('yearFilter');
  const clear = document.getElementById('clearFilters');
  const cards = Array.from(document.querySelectorAll('[data-card]'));
  if (!cards.length || (!search && !year)) {
    return;
  }
  function apply() {
    const q = normalizeText(search ? search.value : '');
    const selectedYear = year ? year.value : '';
    cards.forEach(function (card) {
      const text = normalizeText(card.dataset.text || card.dataset.title || '');
      const cardYear = card.dataset.year || '';
      const matchedText = !q || text.indexOf(q) !== -1;
      const matchedYear = !selectedYear || cardYear === selectedYear;
      card.hidden = !(matchedText && matchedYear);
    });
  }
  if (search) {
    search.addEventListener('input', apply);
  }
  if (year) {
    year.addEventListener('change', apply);
  }
  if (clear) {
    clear.addEventListener('click', function () {
      if (search) {
        search.value = '';
      }
      if (year) {
        year.value = '';
      }
      apply();
    });
  }
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function movieCardTemplate(movie) {
  const tags = (movie.tags || []).slice(0, 4).map(function (tag) {
    return '<span>' + escapeHtml(tag) + '</span>';
  }).join('');
  return '<article class="movie-card compact">'
    + '<a class="poster-link" href="' + escapeHtml(movie.url) + '" aria-label="观看 ' + escapeHtml(movie.title) + '">'
    + '<img src="' + escapeHtml(movie.cover) + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">'
    + '<span class="play-chip">播放</span>'
    + '</a>'
    + '<div class="card-body">'
    + '<div class="card-meta"><span>' + escapeHtml(movie.year) + '</span><span>' + escapeHtml(movie.region) + '</span><span>' + escapeHtml(movie.type) + '</span></div>'
    + '<h2><a href="' + escapeHtml(movie.url) + '">' + escapeHtml(movie.title) + '</a></h2>'
    + '<p>' + escapeHtml(movie.oneLine) + '</p>'
    + '<div class="tag-row">' + tags + '</div>'
    + '</div>'
    + '</article>';
}

function setupSearchPage() {
  const input = document.getElementById('searchInput');
  const results = document.getElementById('searchResults');
  const summary = document.getElementById('searchSummary');
  if (!input || !results || !summary) {
    return;
  }
  const params = new URLSearchParams(window.location.search);
  const initial = params.get('q') || '';
  input.value = initial;
  function render() {
    const q = normalizeText(input.value);
    const source = Array.isArray(window.SEARCH_INDEX) ? window.SEARCH_INDEX : [];
    const matched = source.filter(function (movie) {
      const text = normalizeText([movie.title, movie.year, movie.region, movie.type, movie.category, (movie.tags || []).join(' ')].join(' '));
      return !q || text.indexOf(q) !== -1;
    }).slice(0, 96);
    summary.textContent = q ? '搜索结果' : '精选推荐';
    if (!matched.length) {
      results.innerHTML = '<div class="empty-state">没有找到匹配的影片</div>';
      return;
    }
    results.innerHTML = matched.map(movieCardTemplate).join('');
  }
  input.addEventListener('input', render);
  render();
}

function initMoviePlayer(videoId, buttonId, sourceUrl) {
  const video = document.getElementById(videoId);
  const button = document.getElementById(buttonId);
  if (!video || !button || !sourceUrl) {
    return;
  }
  let ready = false;
  let hlsInstance = null;
  function attach() {
    if (ready) {
      return;
    }
    ready = true;
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = sourceUrl;
    } else if (window.Hls && window.Hls.isSupported()) {
      hlsInstance = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      hlsInstance.loadSource(sourceUrl);
      hlsInstance.attachMedia(video);
    } else {
      video.src = sourceUrl;
    }
  }
  function start() {
    attach();
    button.classList.add('is-hidden');
    const playTask = video.play();
    if (playTask && typeof playTask.catch === 'function') {
      playTask.catch(function () {});
    }
  }
  button.addEventListener('click', start);
  video.addEventListener('click', function () {
    if (!ready || video.paused) {
      start();
    }
  });
  window.addEventListener('beforeunload', function () {
    if (hlsInstance) {
      hlsInstance.destroy();
    }
  });
}

document.addEventListener('DOMContentLoaded', function () {
  setupMobileMenu();
  setupHeroSlider();
  setupLocalFilters();
});
