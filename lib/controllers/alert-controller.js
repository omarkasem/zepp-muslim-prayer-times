import { notify } from "@zos/notification";
import { Vibrate } from "@zos/sensor";
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
      // Fire notification as a fallback gracefully
      try {
        notify({
          title: state.label,
          content: t("time_for") + " " + state.label,
          actions: [],
          vibrate: 0, // 0 so it doesn't collide with sensor vibrate
        });
      } catch (e) {}

      // Start vibrating
      try {
        vibrate = new Vibrate();
        // Mode 25 might not be standard, using scene or just start()
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
