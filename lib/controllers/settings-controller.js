import { getSettings, setSettings } from "../../shared/storage";
import { applyReminders } from "../reminders";
import { t } from "../i18n";

export const METHOD_SHORT_LABELS = {
  mwl: "method_mwl",
  isna: "method_isna",
  egyptian: "method_egyptian",
  umm_al_qura: "method_umm_al_qura",
  karachi: "method_karachi",
};

const HIGH_LAT_LABELS = {
  none: "none",
  middle_of_night: "middle_of_night",
  one_seventh: "one_seventh",
  angle_based: "angle_based",
};

const REMINDER_OFFSET_LABELS = {
  0: "at_prayer_time",
  5: "5_min",
  10: "10_min",
  15: "15_min",
  20: "20_min",
};

export function methodLabel(id) {
  const k = METHOD_SHORT_LABELS[id];
  return k ? t(k) : "—";
}

export function highLatLabel(id) {
  const k = HIGH_LAT_LABELS[id];
  return k ? t(k) : "—";
}

export function reminderOffsetLabel(n) {
  const k = REMINDER_OFFSET_LABELS[n];
  return k != null ? t(k) : "—";
}

export function hijriOffsetLabel(n) {
  const v = (typeof n === "number" && !isNaN(n)) ? n : 0;
  const unit = (Math.abs(v) === 1) ? t("day") : t("days");
  // Use a sign prefix so the direction of the nudge is unambiguous.
  const sign = v > 0 ? "+" : (v < 0 ? "−" : "");
  return sign + Math.abs(v) + " " + unit;
}

export function createSettingsController(onStateChange) {
  const state = {
    settings: null,
  };

  function reload() {
    state.settings = getSettings();
    if (onStateChange) onStateChange();
  }

  return {
    state,
    onInit() {
      reload();
    },
    onResume() {
      reload();
    },
    updateSetting(patch) {
      const current = getSettings();
      const merged = Object.assign({}, current, patch);
      setSettings(merged);
      try { applyReminders(); } catch (e) {}
      reload();
    }
  };
}
