import { BasePage } from "@zeppos/zml/base-page";
import * as hmUI from "@zos/ui";
import { log as Logger } from "@zos/utils";
import { getDeviceInfo } from "@zos/device";
import { px } from "@zos/utils";

const logger = Logger.getLogger("muslim-prayer-times");
const { width: DEVICE_WIDTH } = getDeviceInfo();

Page(
  BasePage({
    state: {
      text: null,
    },
    onInit() {
      logger.debug("page onInit invoked");
    },
    build() {
      this.state.text = hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(20),
        y: px(90),
        w: DEVICE_WIDTH - px(40),
        h: px(230),
        color: 0xffffff,
        text_size: px(30),
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text_style: hmUI.text_style.WRAP,
        text: "Getting location…",
      });

      hmUI.createWidget(hmUI.widget.BUTTON, {
        x: (DEVICE_WIDTH - px(180)) / 2,
        y: px(350),
        w: px(180),
        h: px(64),
        radius: px(32),
        text: "Refresh",
        text_size: px(28),
        normal_color: 0x1a73e8,
        press_color: 0x1453a8,
        click_func: () => this.loadLocation(),
      });

      this.loadLocation();
    },
    loadLocation() {
      this.setText("Getting location…");
      this.request({ method: "GET_LOCATION" })
        .then((result) => {
          // result is the object the side service passed to res(null, ...)
          const loc = result && result.lat != null ? result : result && result.data;
          if (!loc || loc.lat == null) {
            throw new Error("no location in reply");
          }
          logger.debug(`location: ${loc.city} ${loc.lat},${loc.lon}`);
          this.setText(
            `${loc.city || "Location"}\nLat: ${loc.lat.toFixed(4)}\nLon: ${loc.lon.toFixed(4)}`
          );
        })
        .catch((error) => {
          logger.error("location error: " + error);
          this.setText("Could not get location.\nPhone connected?\nTap Refresh.");
        });
    },
    setText(text) {
      this.state.text && this.state.text.setProperty(hmUI.prop.MORE, { text });
    },
    onDestroy() {
      logger.debug("page onDestroy invoked");
    },
  })
);
