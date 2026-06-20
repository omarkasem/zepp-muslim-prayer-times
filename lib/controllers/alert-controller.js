import { Vibrator } from "@zos/sensor";
import { applyReminders } from "../reminders";
import { t, prayerName } from "../i18n";

export function createAlertController(prayerParam, onExit) {
  const state = {
    label: "Prayer",
  };

  const prayer = (typeof prayerParam === "string") ? prayerParam : "";
  state.label = prayer ? prayerName(prayer) : t("prayer");

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
