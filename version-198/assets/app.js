(function () {
    function ready(callback) {
        if (document.readyState !== 'loading') {
            callback();
        } else {
            document.addEventListener('DOMContentLoaded', callback);
        }
    }

    function normalize(value) {
        return (value || '').toString().trim().toLowerCase();
    }

    function setupMenu() {
        var button = document.querySelector('[data-menu-toggle]');
        var mobile = document.querySelector('[data-mobile-nav]');
        if (!button || !mobile) {
            return;
        }
        button.addEventListener('click', function () {
            mobile.classList.toggle('open');
        });
    }

    function setupHero() {
        var root = document.querySelector('[data-hero]');
        if (!root) {
            return;
        }
        var slides = Array.prototype.slice.call(root.querySelectorAll('.hero-slide'));
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
                slide.classList.toggle('active', i === index);
            });
            dots.forEach(function (dot, i) {
                dot.classList.toggle('active', i === index);
            });
        }

        function advance(step) {
            show(index + step);
        }

        function start() {
            stop();
            timer = window.setInterval(function () {
                advance(1);
            }, 5600);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
                timer = null;
            }
        }

        dots.forEach(function (dot) {
            dot.addEventListener('click', function () {
                show(parseInt(dot.getAttribute('data-hero-dot'), 10) || 0);
                start();
            });
        });
        if (prev) {
            prev.addEventListener('click', function () {
                advance(-1);
                start();
            });
        }
        if (next) {
            next.addEventListener('click', function () {
                advance(1);
                start();
            });
        }
        root.addEventListener('mouseenter', stop);
        root.addEventListener('mouseleave', start);
        show(0);
        start();
    }

    function setupSearch() {
        var input = document.querySelector('[data-page-search]');
        var cards = Array.prototype.slice.call(document.querySelectorAll('[data-card]'));
        var categoryFilter = document.querySelector('[data-filter-category]');
        var yearFilter = document.querySelector('[data-filter-year]');
        var empty = document.querySelector('[data-no-result]');
        if (!input || !cards.length) {
            return;
        }

        var params = new URLSearchParams(window.location.search);
        var initial = params.get('q');
        if (initial) {
            input.value = initial;
        }

        function run() {
            var query = normalize(input.value);
            var category = categoryFilter ? normalize(categoryFilter.value) : '';
            var year = yearFilter ? normalize(yearFilter.value) : '';
            var visible = 0;
            cards.forEach(function (card) {
                var haystack = normalize([
                    card.getAttribute('data-title'),
                    card.getAttribute('data-region'),
                    card.getAttribute('data-year'),
                    card.getAttribute('data-genre'),
                    card.getAttribute('data-tags'),
                    card.getAttribute('data-category'),
                    card.textContent
                ].join(' '));
                var cardCategory = normalize(card.getAttribute('data-category'));
                var cardYear = normalize(card.getAttribute('data-year'));
                var matched = (!query || haystack.indexOf(query) !== -1) &&
                    (!category || cardCategory === category) &&
                    (!year || cardYear === year);
                card.style.display = matched ? '' : 'none';
                if (matched) {
                    visible += 1;
                }
            });
            if (empty) {
                empty.classList.toggle('show', visible === 0);
            }
        }

        input.addEventListener('input', run);
        if (categoryFilter) {
            categoryFilter.addEventListener('change', run);
        }
        if (yearFilter) {
            yearFilter.addEventListener('change', run);
        }
        run();
    }

    function attachMedia(video, src) {
        if (!video || video.getAttribute('data-ready') === '1') {
            return;
        }
        video.setAttribute('data-ready', '1');
        if (window.Hls && window.Hls.isSupported()) {
            var hls = new window.Hls({
                enableWorker: true,
                lowLatencyMode: true,
                backBufferLength: 60
            });
            hls.loadSource(src);
            hls.attachMedia(video);
            video._hls = hls;
        } else {
            video.src = src;
        }
    }

    window.initPlayer = function (id, src) {
        var video = document.getElementById(id);
        if (!video) {
            return;
        }
        var shell = video.closest('.player-shell');
        var start = shell ? shell.querySelector('.player-start') : null;

        function play() {
            attachMedia(video, src);
            if (start) {
                start.classList.add('is-hidden');
            }
            video.controls = true;
            var result = video.play();
            if (result && typeof result.catch === 'function') {
                result.catch(function () {});
            }
        }

        if (start) {
            start.addEventListener('click', play);
        }
        video.addEventListener('click', function () {
            if (video.paused) {
                play();
            }
        });
    };

    ready(function () {
        setupMenu();
        setupHero();
        setupSearch();
    });
})();
