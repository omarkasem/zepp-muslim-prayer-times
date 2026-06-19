import { BasePage } from "@zeppos/zml/base-page";
import * as hmUI from "@zos/ui";
import { getDeviceInfo } from "@zos/device";
import { px } from "@zos/utils";
import { push } from "@zos/router";
import { getLocation, setLocation, getSettings } from "../../../shared/storage";
import { computePrayerTimes } from "../../../shared/prayer-times";
import { toHijri } from "../../../shared/hijri";
import { COLORS, FONT_SIZES } from "../../../lib/theme";
import { applyReminders } from "../../../lib/reminders";

const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = getDeviceInfo();

const PRAYERS = [
  { key: "fajr", label: "Fajr" },
  { key: "dhuhr", label: "Dhuhr" },
  { key: "asr", label: "Asr" },
  { key: "maghrib", label: "Maghrib" },
  { key: "isha", label: "Isha" },
];

// On Fridays (getDay() === 5) the Dhuhr prayer is the Jumu'ah congregation —
// same time, different name. Show "Jumu'ah" on that row.
function prayerLabel(prayer, date) {
  if (prayer.key === "dhuhr" && date.getDay() === 5) return "Jumu'ah";
  return prayer.label;
}

// Bip 6 is 390x450 rectangular and designWidth:390, so px() is 1:1. We still
// wrap coords in px() for portability, and lay out against DEVICE_WIDTH/HEIGHT.
const SIDE_MARGIN = 16;
const CONTENT_W = DEVICE_WIDTH - 2 * SIDE_MARGIN;

// Header (status bar is hidden in onInit).
const CITY_Y = 28;
const CITY_H = 28;
const HIJRI_Y = CITY_Y + CITY_H + 6;
const HIJRI_H = 22;

// Bottom nav.
const NAV_H = 56;
const NAV_Y = DEVICE_HEIGHT - NAV_H - 14;

// Prayer list region: leave a comfortable gap below the header and above the
// nav so the active pill never collides with either.
const LIST_TOP = 124;
const LIST_BOTTOM = NAV_Y - 30;
const LIST_HEIGHT = LIST_BOTTOM - LIST_TOP;
const ROW_HEIGHT_INACTIVE = 40;
const PILL_HEIGHT = 56;
const PILL_RADIUS = 28;
const ROW_INDENT = 22;

// Rough text-width estimate (no text metrics API on Zepp). ~0.56 * font size
// per character is a safe approximation for the system font.
function estTextW(str, size) {
  return Math.ceil((str ? str.length : 0) * size * 0.56);
}

function formatTime(epochMs, timeFormat) {
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

// Subtext on the highlighted (current) row: names the NEXT prayer + countdown,
// e.g. "Maghrib in 1h 23m".
function formatCountdown(label, ms) {
  if (ms < 0) ms = 0;
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin - h * 60;
  if (h > 0) return label + " in " + h + "h " + m + "m";
  return label + " in " + m + "m";
}

function tomorrowDate(now) {
  const d = new Date(now);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
}

Page(
  BasePage({
    state: {
      phase: "loading",
      location: null,
      times: null,
      tomorrowFajr: null,
      currentIndex: -1,
      countdownText: "",
      timeFormat: "12h",
    },

    onInit() {
      try { hmUI.setStatusBarVisible(false); } catch (e) {}
      this._firstBuild = true;
      const cached = getLocation();
      if (cached) {
        this.state.location = cached;
        if (this.prepareReadyStateFromLocation()) {
          this.computeNext();
          this.state.phase = "ready";
        } else {
          this.state.phase = "unavailable";
        }
      } else {
        this.state.phase = "loading";
        this.fetchLocation();
      }
    },

    onResume() {
      this.stopCountdownTimer();
      if (this._firstBuild) {
        this._firstBuild = false;
        if (this.state.phase === "ready") {
          this.startCountdownTimer();
        }
        return;
      }
      if (this.state.phase === "ready" && this.state.location) {
        if (this.prepareReadyStateFromLocation()) {
          this.computeNext();
          this.destroyWidgets();
          this.build();
          this.startCountdownTimer();
        }
      }
    },

    onPause() {
      this.stopCountdownTimer();
    },

    onDestroy() {
      this.stopCountdownTimer();
    },

    fetchLocation() {
      const self = this;
      this.request({
        method: "GET_LOCATION",
        params: {},
      })
        .then((loc) => {
          if (loc && typeof loc.lat === "number" && typeof loc.lon === "number" && loc.timezone) {
            try {
              setLocation(loc);
              self.state.location = loc;
              if (self.prepareReadyStateFromLocation()) {
                self.computeNext();
                self.state.phase = "ready";
                self.destroyWidgets();
                self.build();
                self.startCountdownTimer();
                try { applyReminders(); } catch (e) {}
              } else {
                self.renderUnavailable();
              }
            } catch (e) {
              self.renderUnavailable();
            }
          } else {
            self.renderUnavailable();
          }
        })
        .catch(() => {
          self.renderUnavailable();
        });
    },

    prepareReadyStateFromLocation() {
      const loc = this.state.location;
      if (!loc) return false;
      const settings = getSettings();
      this.state.timeFormat = settings.timeFormat;
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
      this.state.times = times;
      this.state.tomorrowFajr = tomorrowFajr;
      this.state.currentIndex = -1;
      this.state.countdownText = "";
      return true;
    },

    renderUnavailable() {
      this.state.phase = "unavailable";
      this.destroyWidgets();
      this.build();
    },

    // Pure: figure out the CURRENT prayer (the one whose time has begun and is
    // now active) + a countdown to the NEXT prayer. Does NOT touch widgets, so
    // it can run before the first build() (the pill is drawn correctly the first
    // time, instead of being retro-fitted via updateWidget). Returns true if the
    // highlighted (current) prayer changed since the last call.
    computeNext() {
      const t = this.state.times;
      if (!t) return false;
      const now = Date.now();
      const instants = PRAYERS.map((p) => t[p.key]);
      const last = PRAYERS.length - 1;
      const prevIndex = this.state.currentIndex;

      let currentIdx;
      let nextInstant;
      let nextPrayerIdx;
      let nextLabelDate;

      if (now < instants[0]) {
        // Before today's Fajr → still inside last night's Isha window.
        currentIdx = last;            // Isha
        nextPrayerIdx = 0;            // Fajr (today)
        nextInstant = instants[0];
        nextLabelDate = new Date();
      } else {
        // The current prayer is the last one whose time has already passed.
        currentIdx = 0;
        for (let i = 0; i < instants.length; i++) {
          if (instants[i] <= now) currentIdx = i;
        }
        if (currentIdx >= last) {
          // After Isha → next is tomorrow's Fajr.
          nextPrayerIdx = 0;
          nextInstant = this.state.tomorrowFajr || instants[0];
          nextLabelDate = tomorrowDate(now);
        } else {
          nextPrayerIdx = currentIdx + 1;
          nextInstant = instants[nextPrayerIdx];
          nextLabelDate = new Date();
        }
      }

      const nextLabel = prayerLabel(PRAYERS[nextPrayerIdx], nextLabelDate);
      this.state.currentIndex = currentIdx;
      this.state.countdownText = formatCountdown(nextLabel, nextInstant - now);
      return prevIndex !== currentIdx;
    },

    startCountdownTimer() {
      this.stopCountdownTimer();
      const self = this;
      // NOTE: global setInterval/clearInterval are in @zeppos/device-types v3
      // runtime. Verify on-device per review-fixes-steps-1-3.md Fix 4. If the
      // countdown does NOT tick, swap to @zos/timer createSysTimer.
      this._timer = setInterval(function () {
        if (self.state.phase !== "ready") return;
        const changed = self.computeNext();
        if (changed) {
          // The current prayer rolled over — redraw so the pill moves cleanly.
          self.destroyWidgets();
          self.build();
        } else {
          self.updateCountdown();
        }
      }, 60000);
    },

    stopCountdownTimer() {
      if (this._timer) {
        clearInterval(this._timer);
        this._timer = null;
      }
    },

    trackWidget(id) {
      if (!this._widgetIds) this._widgetIds = [];
      this._widgetIds.push(id);
      return id;
    },

    destroyWidgets() {
      this._countdownId = -1;
      if (!this._widgetIds) {
        this._widgetIds = [];
        return;
      }
      for (let i = 0; i < this._widgetIds.length; i++) {
        try { hmUI.deleteWidget(this._widgetIds[i]); } catch (e) {}
      }
      this._widgetIds = [];
    },

    build() {
      this.trackWidget(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: 0,
        y: 0,
        w: DEVICE_WIDTH,
        h: DEVICE_HEIGHT,
        color: COLORS.BACKGROUND,
      }));

      const phase = this.state.phase;

      if (phase === "loading" || phase === "unavailable") {
        this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
          x: px(SIDE_MARGIN),
          y: px(180),
          w: px(CONTENT_W),
          h: px(60),
          color: COLORS.TEXT_MUTED,
          text_size: px(FONT_SIZES.BODY_LG),
          align_h: hmUI.align.CENTER_H,
          align_v: hmUI.align.CENTER_V,
          text_style: hmUI.text_style.WRAP,
          text: phase === "loading" ? "Getting location…" : "Location unavailable",
        }));
        this.renderBottomNav();
        return;
      }

      this.renderHeader();
      this.renderList();
      this.renderBottomNav();
    },

    renderHeader() {
      const loc = this.state.location;
      const city = (loc && loc.city) ? loc.city : "—";
      const today = new Date();
      const hijri = toHijri(today);
      const hijriText = (hijri.day + " " + hijri.monthName + " " + hijri.year).toUpperCase();

      // Center the pin icon + city name as a single group. Estimate the text
      // width so the group is actually centered (a fixed-width box would let a
      // short city drift left).
      const iconSize = 22;
      const gap = 8;
      const textW = Math.min(estTextW(city, FONT_SIZES.LABEL_SM), CONTENT_W - iconSize - gap);
      const groupW = iconSize + gap + textW;
      const groupX = Math.round((DEVICE_WIDTH - groupW) / 2);

      this.trackWidget(hmUI.createWidget(hmUI.widget.IMG, {
        x: px(groupX),
        y: px(CITY_Y + (CITY_H - iconSize) / 2),
        w: px(iconSize),
        h: px(iconSize),
        src: "ic_pin.png",
      }));
      this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(groupX + iconSize + gap),
        y: px(CITY_Y),
        w: px(textW),
        h: px(CITY_H),
        color: COLORS.ACCENT,
        text_size: px(FONT_SIZES.LABEL_SM),
        align_h: hmUI.align.LEFT,
        align_v: hmUI.align.CENTER_V,
        text: city,
      }));

      this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(SIDE_MARGIN),
        y: px(HIJRI_Y),
        w: px(CONTENT_W),
        h: px(HIJRI_H),
        color: COLORS.TEXT_MUTED,
        text_size: px(FONT_SIZES.SMALL),
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        char_space: 1,
        text: hijriText,
      }));
    },

    renderList() {
      const times = this.state.times;
      const tf = this.state.timeFormat;
      const step = LIST_HEIGHT / (PRAYERS.length - 1);
      this._countdownId = -1;

      for (let i = 0; i < PRAYERS.length; i++) {
        const y = Math.round(LIST_TOP + i * step);
        const prayer = PRAYERS[i];
        const isActive = (i === this.state.currentIndex);
        const timeStr = formatTime(times[prayer.key], tf);
        const label = prayerLabel(prayer, new Date());

        if (isActive) {
          this.trackWidget(hmUI.createWidget(hmUI.widget.FILL_RECT, {
            x: px(SIDE_MARGIN),
            y: px(y - PILL_HEIGHT / 2),
            w: px(CONTENT_W),
            h: px(PILL_HEIGHT),
            radius: px(PILL_RADIUS),
            color: COLORS.NEXT_PRAYER_PILL,
          }));
          // Label (top) + countdown (below), left side.
          this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
            x: px(SIDE_MARGIN + ROW_INDENT),
            y: px(y - 18),
            w: px(180),
            h: px(22),
            color: COLORS.NEXT_PRAYER_TEXT,
            text_size: px(FONT_SIZES.LABEL_SM),
            align_v: hmUI.align.CENTER_V,
            text: label,
          }));
          this._countdownId = this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
            x: px(SIDE_MARGIN + ROW_INDENT),
            y: px(y + 6),
            w: px(180),
            h: px(18),
            color: COLORS.NEXT_PRAYER_TEXT,
            text_size: px(FONT_SIZES.SMALL),
            align_v: hmUI.align.CENTER_V,
            text: this.state.countdownText,
          }));
          // Time (right, larger).
          this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
            x: px(DEVICE_WIDTH - SIDE_MARGIN - ROW_INDENT - 160),
            y: px(y - PILL_HEIGHT / 2),
            w: px(160),
            h: px(PILL_HEIGHT),
            color: COLORS.NEXT_PRAYER_TEXT,
            text_size: px(FONT_SIZES.HEADLINE_MD),
            align_h: hmUI.align.RIGHT,
            align_v: hmUI.align.CENTER_V,
            text: timeStr,
          }));
        } else {
          this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
            x: px(SIDE_MARGIN + ROW_INDENT),
            y: px(y - ROW_HEIGHT_INACTIVE / 2),
            w: px(160),
            h: px(ROW_HEIGHT_INACTIVE),
            color: COLORS.TEXT_INACTIVE,
            text_size: px(FONT_SIZES.BODY_LG),
            align_v: hmUI.align.CENTER_V,
            text: label,
          }));
          this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
            x: px(DEVICE_WIDTH - SIDE_MARGIN - ROW_INDENT - 160),
            y: px(y - ROW_HEIGHT_INACTIVE / 2),
            w: px(160),
            h: px(ROW_HEIGHT_INACTIVE),
            color: COLORS.TEXT_INACTIVE,
            text_size: px(FONT_SIZES.BODY_LG),
            align_h: hmUI.align.RIGHT,
            align_v: hmUI.align.CENTER_V,
            text: timeStr,
          }));
        }
      }
    },

    updateCountdown() {
      if (this._countdownId && this._countdownId !== -1) {
        hmUI.updateWidget(this._countdownId, hmUI.widget.TEXT, {
          text: this.state.countdownText,
        });
      }
    },

    renderBottomNav() {
      const gap = 14;
      const btnW = Math.floor((CONTENT_W - gap) / 2);
      const startX = SIDE_MARGIN;
      const iconSize = 26;

      this.renderNavButton(
        startX, btnW, iconSize,
        "ic_compass.png", COLORS.ACCENT_DEEP,
        "Qibla", COLORS.ACCENT,
        () => push({ url: "page/bip6/qibla/index.page", params: {} })
      );

      this.renderNavButton(
        startX + btnW + gap, btnW, iconSize,
        "ic_gear.png", COLORS.TEXT_MUTED,
        "Settings", COLORS.TEXT_PRIMARY,
        () => push({ url: "page/bip6/settings/index.page", params: {} })
      );
    },

    renderNavButton(x, w, iconSize, iconSrc, iconColor, label, labelColor, onTap) {
      this.trackWidget(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: px(x),
        y: px(NAV_Y),
        w: px(w),
        h: px(NAV_H),
        radius: px(NAV_H / 2),
        color: COLORS.CARD,
      }));
      // Center the icon + label group within the button.
      const labelW = estTextW(label, FONT_SIZES.LABEL_SM);
      const innerGap = 8;
      const groupW = iconSize + innerGap + labelW;
      const groupX = x + Math.round((w - groupW) / 2);
      this.trackWidget(hmUI.createWidget(hmUI.widget.IMG, {
        x: px(groupX),
        y: px(NAV_Y + (NAV_H - iconSize) / 2),
        w: px(iconSize),
        h: px(iconSize),
        src: iconSrc,
        color: iconColor,
      }));
      this.trackWidget(hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(groupX + iconSize + innerGap),
        y: px(NAV_Y),
        w: px(labelW + 8),
        h: px(NAV_H),
        color: labelColor,
        text_size: px(FONT_SIZES.LABEL_SM),
        align_v: hmUI.align.CENTER_V,
        text: label,
      }));
      this.trackWidget(hmUI.createWidget(hmUI.widget.BUTTON, {
        x: px(x),
        y: px(NAV_Y),
        w: px(w),
        h: px(NAV_H),
        normal_src: "ic_transparent.png",
        press_src: "ic_transparent.png",
        color: 0x000000,
        click_func: onTap,
      }));
    },
  })
);
