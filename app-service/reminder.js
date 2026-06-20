import { applyReminders } from "../lib/reminders";

const ROLLOVER_PARAM = "rollover";

AppService({
  onInit(params) {
    if (params === ROLLOVER_PARAM) {
      try {
        applyReminders();
      } catch (e) {
      }
      return;
    }
  },
  onDestroy() {
  },
});
