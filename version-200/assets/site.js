(function () {
    function ready(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
        } else {
            callback();
        }
    }

    ready(function () {
        var menuButton = document.querySelector("[data-menu-button]");
        var mobileNav = document.querySelector("[data-mobile-nav]");
        if (menuButton && mobileNav) {
            menuButton.addEventListener("click", function () {
                mobileNav.classList.toggle("is-open");
            });
        }

        var slides = Array.prototype.slice.call(document.querySelectorAll("[data-hero-slide]"));
        var dots = Array.prototype.slice.call(document.querySelectorAll("[data-hero-dot]"));
        var current = 0;

        function showSlide(index) {
            if (!slides.length) {
                return;
            }
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, i) {
                slide.classList.toggle("is-active", i === current);
            });
            dots.forEach(function (dot, i) {
                dot.classList.toggle("is-active", i === current);
            });
        }

        dots.forEach(function (dot, i) {
            dot.addEventListener("click", function () {
                showSlide(i);
            });
        });

        if (slides.length > 1) {
            window.setInterval(function () {
                showSlide(current + 1);
            }, 5600);
        }

        Array.prototype.slice.call(document.querySelectorAll("[data-movie-rail]")).forEach(function (rail) {
            var section = rail.closest(".content-section");
            if (!section) {
                return;
            }
            var left = section.querySelector("[data-rail-left]");
            var right = section.querySelector("[data-rail-right]");
            if (left) {
                left.addEventListener("click", function () {
                    rail.scrollBy({ left: -420, behavior: "smooth" });
                });
            }
            if (right) {
                right.addEventListener("click", function () {
                    rail.scrollBy({ left: 420, behavior: "smooth" });
                });
            }
        });

        var searchInputs = Array.prototype.slice.call(document.querySelectorAll("[data-search-input]"));
        var yearFilter = document.querySelector("[data-year-filter]");
        var cards = Array.prototype.slice.call(document.querySelectorAll("[data-movie-card]"));

        function applyFilters() {
            var keyword = searchInputs.map(function (input) {
                return input.value.trim().toLowerCase();
            }).filter(Boolean).join(" ");
            var year = yearFilter ? yearFilter.value : "";
            var visible = 0;

            cards.forEach(function (card) {
                var haystack = (card.getAttribute("data-search") || "").toLowerCase();
                var cardYear = card.getAttribute("data-year") || "";
                var matchedKeyword = !keyword || keyword.split(/\s+/).every(function (part) {
                    return haystack.indexOf(part) !== -1;
                });
                var matchedYear = !year || cardYear === year;
                var show = matchedKeyword && matchedYear;
                card.classList.toggle("hidden-by-filter", !show);
                if (show) {
                    visible += 1;
                }
            });

            var grid = document.querySelector("[data-filter-grid]") || document.querySelector(".rank-section") || document.querySelector(".movie-grid");
            var old = document.querySelector("[data-no-results]");
            if (old) {
                old.remove();
            }
            if (cards.length && visible === 0 && grid) {
                var empty = document.createElement("div");
                empty.className = "no-results";
                empty.setAttribute("data-no-results", "true");
                empty.textContent = "没有找到匹配的影片";
                grid.appendChild(empty);
            }
        }

        searchInputs.forEach(function (input) {
            input.addEventListener("input", applyFilters);
        });
        if (yearFilter) {
            yearFilter.addEventListener("change", applyFilters);
        }
    });
})();
