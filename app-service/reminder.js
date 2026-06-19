import { log as Logger } from "@zos/utils";
import { notify } from "@zos/notification";
import { applyReminders } from "../lib/reminders";

const logger = Logger.getLogger("reminder-service");

const PRAYER_LABELS = {
  fajr: "Fajr",
  dhuhr: "Dhuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha",
};

const ROLLOVER_PARAM = "rollover";

AppService({
  onInit(params) {
    if (params === ROLLOVER_PARAM) {
      logger.log("rollover alarm; rescheduling");
      try {
        applyReminders();
      } catch (e) {
        logger.log("rollover applyReminders failed: " + (e && e.message));
      }
      return;
    }

    const prayer = (typeof params === "string") ? params : "";
    const label = PRAYER_LABELS[prayer] || "Prayer";
    logger.log("prayer alarm: " + prayer);
    notify({
      title: label,
      content: "Time for " + label,
      actions: [],
      vibrate: 5,
    });
  },
  onDestroy() {
    logger.log("reminder service destroyed");
  },
});
