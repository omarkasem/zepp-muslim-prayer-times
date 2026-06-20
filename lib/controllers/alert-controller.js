import { Vibrator } from "@zos/sensor";
import { applyReminders } from "../reminders";
import { t, prayerName } from "../i18n";
import { computePrayerTimes } from "../../shared/prayer-times";
import { getLocation, getSettings } from "../../shared/storage";
import { formatTime } from "./home-controller";

export function createAlertController(prayerParam, onExit) {
  const state = {
    label: "Prayer",
    time: "",
    offsetMin: 0,
    context: "",
  };

  const prayer = (typeof prayerParam === "string") ? prayerParam : "";
  state.label = prayer ? prayerName(prayer) : t("prayer");

  // The reminder may fire a few minutes BEFORE the prayer (user's offset). Word
  // it accordingly: "Fajr in 10 min" vs. "Time for Fajr".
  const settingsForOffset = getSettings();
  state.offsetMin = (settingsForOffset && settingsForOffset.reminderOffsetMin) || 0;
  state.context = state.offsetMin > 0
    ? (t("in") + " " + state.offsetMin + " " + t("min"))
    : t("time_for");

  // Resolve the actual clock time of this prayer (for today) so the alert can
  // show it prominently. Best-effort; leaves time empty on any failure.
  try {
    const loc = getLocation();
    const settings = getSettings();
    if (loc && prayer) {
      const times = computePrayerTimes({
        lat: loc.lat,
        lon: loc.lon,
        timezone: loc.timezone,
        date: new Date(),
        method: settings.method,
        madhab: settings.madhab,
        highLatRule: settings.highLatRule,
      });
      if (times && times[prayer] != null) {
        state.time = formatTime(times[prayer], settings.timeFormat);
      }
    }
  } catch (e) {}

  let vibrate;
  let timeoutId;

  return {
    state,
    onInit() {
      // Notification removed in favor of full-screen alert

      // Start vibrating
      try {
        vibrate = new Vibrator();
        vibrate.start();
      } catch (e) {}

      // Reschedule next reminders
      try {
        applyReminders();
      } catch (e) {}

      // Auto-dismiss after 60 seconds
      timeoutId = setTimeout(() => {
        this.dismiss();
      }, 60000);
    },
    onDestroy() {
      if (vibrate) {
        try { vibrate.stop(); } catch (e) {}
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    },
    dismiss() {
      if (vibrate) {
        try { vibrate.stop(); } catch (e) {}
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (onExit) onExit();
    }
  };
}
