import { BasePage } from "@zeppos/zml/base-page";
import * as hmUI from "@zos/ui";
import { log as Logger } from "@zos/utils";
import { getDeviceInfo } from "@zos/device";
import { px } from "@zos/utils";
import { queryPermission, requestPermission } from "@zos/app";
import { start } from "@zos/app-service";

const logger = Logger.getLogger("muslim-prayer-times");
const { width: DEVICE_WIDTH } = getDeviceInfo();
const PERMS = ["device:os.bg_service", "device:os.notification"];

Page(
  BasePage({
    state: {
      locText: null,
      statusText: null,
    },
    build() {
      this.state.locText = hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(40),
        y: px(70),
        w: DEVICE_WIDTH - px(80),
        h: px(90),
        color: 0x33dd88,
        text_size: px(26),
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text_style: hmUI.text_style.WRAP,
        text: "Getting location…",
      });

      this.state.statusText = hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(40),
        y: px(170),
        w: DEVICE_WIDTH - px(80),
        h: px(150),
        color: 0xffffff,
        text_size: px(24),
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text_style: hmUI.text_style.WRAP,
        text: "Tap Start, then close the app.\n5 reminders, 30s apart.",
      });

      hmUI.createWidget(hmUI.widget.BUTTON, {
        x: (DEVICE_WIDTH - px(240)) / 2,
        y: px(330),
        w: px(240),
        h: px(70),
        radius: px(35),
        text: "Start 5 reminders",
        text_size: px(26),
        normal_color: 0x1a9b3c,
        press_color: 0x12702b,
        click_func: () => this.startTest(),
      });

      this.loadLocation();
    },
    loadLocation() {
      this.request({ method: "GET_LOCATION" })
        .then((result) => {
          const loc = result && result.lat != null ? result : result && result.data;
          if (!loc || loc.lat == null) throw new Error("no location");
          this.setLoc(`📍 ${loc.city || "Location"}\n${loc.lat.toFixed(3)}, ${loc.lon.toFixed(3)}`);
        })
        .catch((e) => {
          logger.error("loc error " + e);
          this.setLoc("📍 location unavailable");
        });
    },
    startTest() {
      const status = queryPermission({ permissions: PERMS });
      logger.log("perm status => " + JSON.stringify(status));
      if (status.every((s) => s === 2)) {
        this.launchService();
        return;
      }
      this.setStatus("Requesting permission…");
      requestPermission({
        permissions: PERMS,
        callback: (res) => {
          logger.log("perm result => " + JSON.stringify(res));
          if (res && res.every((s) => s === 2)) {
            this.launchService();
          } else {
            this.setStatus("Permission denied ❌\n" + JSON.stringify(res));
          }
        },
      });
    },
    launchService() {
      this.setStatus("Starting service…");
      try {
        const code = start({
          file: "app-service/reminder",
          param: "5",
          complete_func: (info) => {
            logger.log("start cb => " + JSON.stringify(info));
            this.setStatus(
              info && info.result
                ? "Started ✅\nClose the app & lower wrist.\n5 banners, 30s apart."
                : "Service FAILED ❌\n" + JSON.stringify(info)
            );
          },
        });
        logger.log("start() returned " + JSON.stringify(code));
        if (code !== 0) {
          this.setStatus("start() code: " + JSON.stringify(code) + " (not 0)");
        }
      } catch (e) {
        logger.error("start threw " + e);
        this.setStatus("start() threw:\n" + (e && e.message ? e.message : e));
      }
    },
    setLoc(text) {
      this.state.locText && this.state.locText.setProperty(hmUI.prop.MORE, { text });
    },
    setStatus(text) {
      this.state.statusText && this.state.statusText.setProperty(hmUI.prop.MORE, { text });
    },
  })
);
