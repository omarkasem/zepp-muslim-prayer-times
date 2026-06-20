import { log as Logger } from "@zos/utils";
import { applyReminders } from "../lib/reminders";

const logger = Logger.getLogger("reminder-service");

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
  },
  onDestroy() {
    logger.log("reminder service destroyed");
  },
});
