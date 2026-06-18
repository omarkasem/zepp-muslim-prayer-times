import { log as Logger } from "@zos/utils";
import { notify } from "@zos/notification";

const logger = Logger.getLogger("reminder-service");

// Woken by an alarm. Single execution: post ONE notification, then it exits.
// No timers here — each reminder is its own scheduled alarm.
AppService({
  onInit(params) {
    logger.log("reminder service woken, params=" + params);
    notify({
      title: "Next Prayer",
      content: "Reminder " + (params || ""),
      actions: [],
      vibrate: 5,
    });
  },
  onDestroy() {
    logger.log("reminder service destroyed");
  },
});
