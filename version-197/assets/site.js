(function () {
    function qs(selector, root) {
        return (root || document).querySelector(selector);
    }

    function qsa(selector, root) {
        return Array.prototype.slice.call((root || document).querySelectorAll(selector));
    }

    function normalize(value) {
        return String(value || '').trim().toLowerCase();
    }

    function initMenu() {
        var button = qs('[data-menu-button]');
        var panel = qs('[data-mobile-panel]');
        if (!button || !panel) {
            return;
        }
        button.addEventListener('click', function () {
            panel.classList.toggle('open');
        });
    }

    function initHero() {
        var slides = qsa('[data-hero-slide]');
        var tabs = qsa('[data-hero-tab]');
        if (!slides.length || !tabs.length) {
            return;
        }
        var index = 0;
        var timer = null;

        function show(next) {
            index = (next + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('active', slideIndex === index);
            });
            tabs.forEach(function (tab, tabIndex) {
                tab.classList.toggle('active', tabIndex === index);
            });
        }

        function play() {
            clearInterval(timer);
            timer = setInterval(function () {
                show(index + 1);
            }, 5200);
        }

        tabs.forEach(function (tab) {
            tab.addEventListener('click', function () {
                show(Number(tab.getAttribute('data-hero-tab') || 0));
                play();
            });
        });
        show(0);
        play();
    }

    function initLocalFilter() {
        var form = qs('[data-local-filter]');
        var list = qs('[data-filter-list]');
        if (!form || !list) {
            return;
        }
        var input = qs('input', form);
        var cards = qsa('.movie-card', list);
        function apply() {
            var keyword = normalize(input.value);
            cards.forEach(function (card) {
                var text = normalize([
                    card.getAttribute('data-title'),
                    card.getAttribute('data-genre'),
                    card.getAttribute('data-region'),
                    card.getAttribute('data-year')
                ].join(' '));
                card.style.display = !keyword || text.indexOf(keyword) !== -1 ? '' : 'none';
            });
        }
        form.addEventListener('submit', function (event) {
            event.preventDefault();
            apply();
        });
        input.addEventListener('input', apply);
    }

    function createCard(item) {
        var article = document.createElement('article');
        article.className = 'movie-card';
        article.innerHTML = [
            '<a class="poster-link" href="' + item.url + '" aria-label="' + escapeHtml(item.title) + '">',
            '<img src="./' + item.image + '" alt="' + escapeHtml(item.title) + '" loading="lazy">',
            '<span class="poster-shade"></span>',
            '<span class="poster-play">▶</span>',
            '</a>',
            '<div class="movie-card-body">',
            '<div class="movie-meta"><span>' + escapeHtml(item.year) + '</span><span>' + escapeHtml(item.region) + '</span><span>' + escapeHtml(item.type) + '</span></div>',
            '<h3><a href="' + item.url + '">' + escapeHtml(item.title) + '</a></h3>',
            '<p>' + escapeHtml(item.oneLine) + '</p>',
            '</div>',
            '<div class="movie-tags"><span>' + escapeHtml(item.genre) + '</span></div>'
        ].join('');
        return article;
    }

    function escapeHtml(value) {
        return String(value || '').replace(/[&<>"']/g, function (char) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[char];
        });
    }

    function initSearchPage() {
        var form = qs('[data-search-page-form]');
        var results = qs('[data-search-results]');
        var label = qs('[data-search-label]');
        if (!form || !results || typeof SEARCH_ITEMS === 'undefined') {
            return;
        }
        var input = qs('input[name="q"]', form);
        var params = new URLSearchParams(window.location.search);
        var initial = params.get('q') || '';
        input.value = initial;

        function render() {
            var keyword = normalize(input.value);
            results.innerHTML = '';
            if (!keyword) {
                if (label) {
                    label.textContent = '输入关键词开始搜索';
                }
                return;
            }
            var matched = SEARCH_ITEMS.filter(function (item) {
                return normalize(item.text).indexOf(keyword) !== -1;
            });
            if (label) {
                label.textContent = matched.length ? '为您找到相关影片' : '暂无匹配影片';
            }
            matched.slice(0, 120).forEach(function (item) {
                results.appendChild(createCard(item));
            });
        }

        form.addEventListener('submit', function (event) {
            event.preventDefault();
            var url = new URL(window.location.href);
            url.searchParams.set('q', input.value.trim());
            window.history.replaceState(null, '', url.toString());
            render();
        });
        input.addEventListener('input', render);
        render();
    }

    window.startMoviePlayer = function (videoId, buttonId, streamUrl) {
        var video = document.getElementById(videoId);
        var button = document.getElementById(buttonId);
        if (!video || !button || !streamUrl) {
            return;
        }
        var hlsInstance = null;

        function bindStream() {
            if (video.getAttribute('data-ready') === '1') {
                return;
            }
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
            video.setAttribute('data-ready', '1');
        }

        function begin() {
            bindStream();
            button.classList.add('hidden');
            var promise = video.play();
            if (promise && typeof promise.catch === 'function') {
                promise.catch(function () {
                    button.classList.remove('hidden');
                });
            }
        }

        button.addEventListener('click', begin);
        video.addEventListener('play', function () {
            button.classList.add('hidden');
        });
        video.addEventListener('pause', function () {
            if (!video.ended) {
                button.classList.remove('hidden');
            }
        });
        video.addEventListener('ended', function () {
            button.classList.remove('hidden');
        });
        window.addEventListener('beforeunload', function () {
            if (hlsInstance) {
                hlsInstance.destroy();
            }
        });
    };

    document.addEventListener('DOMContentLoaded', function () {
        initMenu();
        initHero();
        initLocalFilter();
        initSearchPage();
    });
})();
