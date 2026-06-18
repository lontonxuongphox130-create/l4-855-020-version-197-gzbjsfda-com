(function () {
    function ready(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
        } else {
            callback();
        }
    }

    ready(function () {
        var video = document.getElementById("moviePlayer");
        var overlay = document.getElementById("playOverlay");
        if (!video || typeof playerStream !== "string") {
            return;
        }

        var hlsInstance = null;

        function attachStream() {
            if (video.getAttribute("data-ready") === "true") {
                return;
            }
            video.setAttribute("data-ready", "true");

            if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = playerStream;
                return;
            }

            if (window.Hls && window.Hls.isSupported()) {
                hlsInstance = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: false,
                    backBufferLength: 90
                });
                hlsInstance.loadSource(playerStream);
                hlsInstance.attachMedia(video);
                return;
            }

            video.src = playerStream;
        }

        function startPlayback() {
            attachStream();
            if (overlay) {
                overlay.classList.add("is-hidden");
            }
            var playPromise = video.play();
            if (playPromise && typeof playPromise.catch === "function") {
                playPromise.catch(function () {});
            }
        }

        if (overlay) {
            overlay.addEventListener("click", startPlayback);
        }

        video.addEventListener("click", function () {
            if (video.paused) {
                startPlayback();
            }
        });

        video.addEventListener("play", function () {
            if (overlay) {
                overlay.classList.add("is-hidden");
            }
        });

        window.addEventListener("beforeunload", function () {
            if (hlsInstance) {
                hlsInstance.destroy();
            }
        });
    });
})();
