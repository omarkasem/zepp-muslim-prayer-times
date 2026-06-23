import { getSettings, setSettings } from "../../shared/storage";
import { METHODS } from "../../shared/methods";
import { applyReminders } from "../reminders";
import { METHOD_SHORT_LABELS, hijriOffsetLabel } from "./settings-controller";
import { t } from "../i18n";

function getHighLatOptions() {
  return [
    { value: "none", label: t("none") },
    { value: "middle_of_night", label: t("middle_of_night") },
    { value: "one_seventh", label: t("one_seventh") },
    { value: "angle_based", label: t("angle_based") },
  ];
}

function getReminderOffsetOptions() {
  return [
    { value: 0, label: t("at_prayer_time") },
    { value: 5, label: t("5_min") },
    { value: 10, label: t("10_min") },
    { value: 15, label: t("15_min") },
    { value: 20, label: t("20_min") },
  ];
}

function getHijriOffsetOptions() {
  const out = [];
  for (let n = -2; n <= 2; n++) {
    out.push({ value: n, label: hijriOffsetLabel(n) });
  }
  return out;
}

function methodOptions() {
  const out = [];
  for (const id in METHODS) {
    if (METHODS[id] && METHODS[id].name) {
      const k = METHOD_SHORT_LABELS[id];
      out.push({ value: id, label: k ? t(k) : METHODS[id].name });
    }
  }
  return out;
}

function pickerConfig(key) {
  if (key === "method") {
    return { title: t("calc_method"), storageKey: "method", options: methodOptions() };
  }
  if (key === "highLatRule") {
    return { title: t("high_lat_rule"), storageKey: "highLatRule", options: getHighLatOptions() };
  }
  if (key === "reminderOffset") {
    return { title: t("reminder_offset"), storageKey: "reminderOffsetMin", options: getReminderOffsetOptions() };
  }
  if (key === "hijriOffset") {
    return { title: t("hijri_adjust"), storageKey: "hijriOffsetDays", options: getHijriOffsetOptions() };
  }
  return null;
}

function valuesEqual(a, b) {
  return a === b;
}

function setSettingAndReschedule(patch) {
  const current = getSettings();
  const merged = Object.assign({}, current, patch);
  setSettings(merged);
  try { applyReminders(); } catch (e) {}
}

export function createSettingsPickerController(onExit) {
  const state = {
    key: null,
    config: null,
    currentValue: null,
  };

  return {
    state,
    onInit(p, options) {
      let params = {};
      if (typeof p === "string") {
        try { params = JSON.parse(p) || {}; } catch (e) { params = {}; }
      } else if (p && typeof p === "object") {
        params = p;
      }
      if (options && options.params) {
        params = options.params;
      }
      const key = params.key;
      const config = pickerConfig(key);
      state.key = key;
      state.config = config;
      if (config) {
        const s = getSettings();
        state.currentValue = s[config.storageKey];
      }
    },
    onResume() {
      if (state.config) {
        const s = getSettings();
        state.currentValue = s[state.config.storageKey];
      }
    },
    selectOption(storageKey, value) {
      if (valuesEqual(state.currentValue, value)) {
        if (onExit) onExit();
        return;
      }
      const patch = {};
      patch[storageKey] = value;
      setSettingAndReschedule(patch);
      state.currentValue = value;
      if (onExit) onExit();
    }
  };
}
