import { getLocation, getSettings } from "../../shared/storage";
import { computePrayerTimes } from "../../shared/prayer-times";
import { requestAndStoreLocation } from "../location";
import { t, prayerName } from "../i18n";

export const PRAYERS = [
  { key: "fajr" },
  { key: "dhuhr" },
  { key: "asr" },
  { key: "maghrib" },
  { key: "isha" },
];

export function prayerLabel(prayer, date) {
  if (prayer.key === "dhuhr" && date.getDay() === 5) return t("prayer_jumuah");
  return prayerName(prayer.key);
}

export function formatTime(epochMs, timeFormat) {
  const d = new Date(epochMs);
  const h24 = d.getHours();
  const m = d.getMinutes();
  const mm = m < 10 ? "0" + m : "" + m;
  if (timeFormat === "24h") {
    return h24 + ":" + mm;
  }
  const ampm = h24 >= 12 ? "PM" : "AM";
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;
  return h12 + ":" + mm + " " + ampm;
}

export function formatCountdown(label, ms) {
  if (ms < 0) ms = 0;
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin - h * 60;
  if (h > 0) return label + " " + t("in") + " " + h + "h " + m + "m";
  return label + " " + t("in") + " " + m + "m";
}

function tomorrowDate(now) {
  const d = new Date(now);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
}

export function createHomeController(viewRequestFn, onStateChange, onCountdownTick) {
  const state = {
    phase: "loading",
    location: null,
    times: null,
    tomorrowFajr: null,
    currentIndex: -1,
    countdownText: "",
    timeFormat: "12h",
  };

  let firstBuild = true;
  let timer = null;

  function prepareReadyStateFromLocation() {
    const loc = state.location;
    if (!loc) return false;
    const settings = getSettings();
    state.timeFormat = settings.timeFormat;
    const now = new Date();
    let times;
    try {
      times = computePrayerTimes({
        lat: loc.lat,
        lon: loc.lon,
        timezone: loc.timezone,
        date: now,
        method: settings.method,
        madhab: settings.madhab,
        highLatRule: settings.highLatRule,
      });
    } catch (e) {
      return false;
    }
    let tomorrowFajr = null;
    try {
      const tom = computePrayerTimes({
        lat: loc.lat,
        lon: loc.lon,
        timezone: loc.timezone,
        date: tomorrowDate(now),
        method: settings.method,
        madhab: settings.madhab,
        highLatRule: settings.highLatRule,
      });
      tomorrowFajr = tom.fajr;
    } catch (e) {
      tomorrowFajr = null;
    }
    state.times = times;
    state.tomorrowFajr = tomorrowFajr;
    state.currentIndex = -1;
    state.countdownText = "";
    return true;
  }

  function computeNext() {
    const t = state.times;
    if (!t) return false;
    const now = Date.now();
    const instants = PRAYERS.map((p) => t[p.key]);
    const last = PRAYERS.length - 1;
    const prevIndex = state.currentIndex;

    let currentIdx;
    let nextInstant;
    let nextPrayerIdx;
    let nextLabelDate;

    if (now < instants[0]) {
      currentIdx = last;            
      nextPrayerIdx = 0;            
      nextInstant = instants[0];
      nextLabelDate = new Date();
    } else {
      currentIdx = 0;
      for (let i = 0; i < instants.length; i++) {
        if (instants[i] <= now) currentIdx = i;
      }
      if (currentIdx >= last) {
        nextPrayerIdx = 0;
        nextInstant = state.tomorrowFajr || instants[0];
        nextLabelDate = tomorrowDate(now);
      } else {
        nextPrayerIdx = currentIdx + 1;
        nextInstant = instants[nextPrayerIdx];
        nextLabelDate = new Date();
      }
    }

    const nextLabel = prayerLabel(PRAYERS[nextPrayerIdx], nextLabelDate);
    state.currentIndex = currentIdx;
    state.countdownText = formatCountdown(nextLabel, nextInstant - now);
    return prevIndex !== currentIdx;
  }

  function fetchLocation() {
    requestAndStoreLocation(viewRequestFn)
      .then((loc) => {
        if (loc) {
          state.location = loc;
          if (prepareReadyStateFromLocation()) {
            computeNext();
            state.phase = "ready";
            onStateChange();
            startCountdownTimer();
          } else {
            state.phase = "unavailable";
            onStateChange();
          }
        } else {
          state.phase = "unavailable";
          onStateChange();
        }
      })
      .catch(() => {
        state.phase = "unavailable";
        onStateChange();
      });
  }

  function startCountdownTimer() {
    stopCountdownTimer();
    timer = setInterval(function () {
      if (state.phase !== "ready") return;
      const changed = computeNext();
      if (changed) {
        onStateChange();
      } else {
        onCountdownTick();
      }
    }, 60000);
  }

  function stopCountdownTimer() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  return {
    state,
    onInit() {
      firstBuild = true;
      const cached = getLocation();
      if (cached) {
        state.location = cached;
        if (prepareReadyStateFromLocation()) {
          computeNext();
          state.phase = "ready";
        } else {
          state.phase = "unavailable";
        }
      } else {
        state.phase = "loading";
        fetchLocation();
      }
    },
    refreshLocation() {
      stopCountdownTimer();
      state.phase = "loading";
      onStateChange();
      fetchLocation();
    },
    onResume() {
      stopCountdownTimer();
      if (firstBuild) {
        firstBuild = false;
        if (state.phase === "ready") {
          startCountdownTimer();
        }
        return;
      }
      if (state.phase === "ready" && state.location) {
        if (prepareReadyStateFromLocation()) {
          computeNext();
          onStateChange();
          startCountdownTimer();
        }
      }
    },
    onPause() {
      stopCountdownTimer();
    },
    onDestroy() {
      stopCountdownTimer();
    }
  };
}
