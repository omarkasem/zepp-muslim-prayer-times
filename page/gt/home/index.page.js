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
        x: px(40),
        y: px(140),
        w: DEVICE_WIDTH - px(80),
        h: px(180),
        color: 0xffffff,
        text_size: px(32),
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text_style: hmUI.text_style.WRAP,
        text: "Getting location…",
      });

      hmUI.createWidget(hmUI.widget.BUTTON, {
        x: (DEVICE_WIDTH - px(200)) / 2,
        y: px(330),
        w: px(200),
        h: px(70),
        radius: px(35),
        text: "Refresh",
        text_size: px(30),
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
