/* global module */
(() => {
  "use strict";

  function timestamp(value) {
    return typeof value === "string" && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(value)
      ? Date.parse(value) : NaN;
  }

  function archiveStart(response, videoId) {
    const details = response?.videoDetails;
    const live = response?.microformat?.playerMicroformatRenderer?.liveBroadcastDetails;
    if (typeof videoId !== "string" || !/^[\w-]{11}$/.test(videoId) ||
        details?.videoId !== videoId || details.isLiveContent !== true ||
        details.isLive === true || details.isUpcoming === true ||
        live?.isLiveNow !== false) return null;
    const start = timestamp(live.startTimestamp);
    const end = timestamp(live.endTimestamp);
    return Number.isFinite(start) && Number.isFinite(end) && end >= start ? start : null;
  }

  function clockText(start, seconds) {
    if (!Number.isFinite(start) || !Number.isFinite(seconds) || seconds < 0) return "";
    const date = new Date(start + Math.floor(seconds) * 1000);
    if (!Number.isFinite(date.getTime())) return "";
    const pad = value => String(value).padStart(2, "0");
    return ` (${String(date.getFullYear()).padStart(4, "0")}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())})`;
  }

  // The same pure functions run in the extension and the dependency-free tests.
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { archiveStart, clockText };
    return;
  }

  let label;
  let navigating = false;
  function clear() {
    label?.remove();
    label = undefined;
  }

  function update() {
    try {
      const url = new URL(location.href);
      const player = document.getElementById("movie_player");
      const video = player?.querySelector("video.html5-main-video");
      const time = player?.querySelector(".ytp-time-contents");
      if (navigating || url.pathname !== "/watch" || !video || !time ||
          player.classList.contains("ad-showing") || player.classList.contains("ad-interrupting")) {
        clear();
        return;
      }
      const pagePlayer = player.wrappedJSObject;
      const response = typeof pagePlayer?.getPlayerResponse === "function"
        ? pagePlayer.getPlayerResponse() : window.wrappedJSObject?.ytInitialPlayerResponse;
      const start = archiveStart(response, url.searchParams.get("v"));
      const text = start === null ? "" : clockText(start, video.currentTime);
      if (!text) {
        clear();
        return;
      }
      if (label?.parentNode !== time) {
        clear();
        label = document.createElement("span");
        label.className = "youtube-archive-clock";
        label.title = "配信時刻（端末の現地時刻）：配信開始日時＋再生位置";
        time.append(label);
      }
      if (label.textContent !== text) label.textContent = text;
    } catch {
      // YouTube owns these objects; stale or unavailable metadata must hide the clock.
      clear();
    }
  }

  document.addEventListener("yt-navigate-start", () => { navigating = true; clear(); });
  document.addEventListener("yt-navigate-finish", () => { navigating = false; update(); });
  for (const event of ["timeupdate", "seeked", "loadedmetadata", "durationchange", "emptied"])
    document.addEventListener(event, update, true);
  // A small poll also handles player replacement and metadata arriving after navigation.
  setInterval(update, 250);
  update();
})();
