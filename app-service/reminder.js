import { notify } from "@zos/notification";
import { exit } from "@zos/app-service";
import { setTimeout } from "@zos/timer";
import { log as Logger } from "@zos/utils";

const logger = Logger.getLogger("reminder-service");

// Background service: fires `total` notifications, 30s apart.
// Runs even when the app is closed and the watch is asleep on the wrist.
AppService({
  onInit(params) {
    const total = parseInt(params, 10) || 5;
    logger.log("reminder service started, total=" + total);
    let n = 0;

    const fire = () => {
      n += 1;
      logger.log("firing reminder " + n);
      notify({
        title: "Next Prayer",
        content: `Test reminder #${n} of ${total}`,
        actions: [],
        vibrate: 5,
      });

      if (n >= total) {
        // all done — shut the service down shortly after the last one
        setTimeout(() => exit(), 3000);
        return;
      }
      setTimeout(fire, 30000);
    };

    // first reminder 30s after start, then every 30s
    setTimeout(fire, 30000);
  },
  onDestroy() {
    logger.log("reminder service destroyed");
  },
});
