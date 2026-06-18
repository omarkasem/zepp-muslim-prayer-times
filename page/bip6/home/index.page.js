import { BasePage } from "@zeppos/zml/base-page";
import * as hmUI from "@zos/ui";
import { log as Logger } from "@zos/utils";
import { getDeviceInfo } from "@zos/device";
import { px } from "@zos/utils";
import { getPackageInfo } from "@zos/app";
import * as alarmMgr from "@zos/alarm";

const logger = Logger.getLogger("muslim-prayer-times");
const { width: DEVICE_WIDTH } = getDeviceInfo();

Page(
  BasePage({
    state: {
      locText: null,
      statusText: null,
    },
    build() {
      this.state.locText = hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(20),
        y: px(40),
        w: DEVICE_WIDTH - px(40),
        h: px(96),
        color: 0x33dd88,
        text_size: px(26),
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text_style: hmUI.text_style.WRAP,
        text: "Getting location…",
      });

      this.state.statusText = hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(20),
        y: px(150),
        w: DEVICE_WIDTH - px(40),
        h: px(170),
        color: 0xffffff,
        text_size: px(24),
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text_style: hmUI.text_style.WRAP,
        text: "Tap Start, then close the app.\n5 reminders, 30s apart.",
      });

      hmUI.createWidget(hmUI.widget.BUTTON, {
        x: (DEVICE_WIDTH - px(220)) / 2,
        y: px(348),
        w: px(220),
        h: px(64),
        radius: px(32),
        text: "Start 5 reminders",
        text_size: px(24),
        normal_color: 0x1a9b3c,
        press_color: 0x12702b,
        click_func: () => this.scheduleReminders(),
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
    scheduleReminders() {
      this.setStatus("Scheduling…");
      const { appId } = getPackageInfo();
      const now = Math.round(Date.now() / 1000);
      const ids = [];
      for (let i = 1; i <= 5; i++) {
        const t = now + i * 30; // 30s apart
        const id = alarmMgr.set({
          appid: appId,
          url: "app-service/reminder",
          time: t,
          date: t,
          param: "#" + i + " of 5",
          repeat_type: alarmMgr.REPEAT_ONCE,
          store: true,
        });
        ids.push(id);
      }
      logger.log("alarm ids => " + JSON.stringify(ids));
      const ok = ids.every((x) => x && x !== 0);
      this.setStatus(
        (ok ? "Scheduled 5 alarms ✅" : "Some FAILED ❌") +
          "\n30s apart (~2.5 min).\nClose the app & lower wrist.\nids: " +
          JSON.stringify(ids)
      );
    },
    setLoc(text) {
      this.state.locText && this.state.locText.setProperty(hmUI.prop.MORE, { text });
    },
    setStatus(text) {
      this.state.statusText && this.state.statusText.setProperty(hmUI.prop.MORE, { text });
    },
  })
);
