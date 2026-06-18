import * as hmUI from "@zos/ui";
import { log as Logger } from "@zos/utils";
import { getDeviceInfo } from "@zos/device";
import { px } from "@zos/utils";
import { Geolocation } from "@zos/sensor";

const logger = Logger.getLogger("muslim-prayer-times");
const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = getDeviceInfo();

Page({
  state: {
    geo: null,
    text: null,
    onChange: null,
  },
  onInit() {
    logger.debug("page onInit invoked");
    this.state.geo = new Geolocation();
  },
  build() {
    this.state.text = hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(20),
      y: px(160),
      w: DEVICE_WIDTH - px(40),
      h: px(160),
      color: 0xffffff,
      text_size: px(32),
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.WRAP,
      text: "Locating…",
    });

    // Tap anywhere to re-locate
    hmUI.createWidget(hmUI.widget.BUTTON, {
      x: 0,
      y: 0,
      w: DEVICE_WIDTH,
      h: DEVICE_HEIGHT,
      text: "",
      normal_color: 0x000000,
      press_color: 0x000000,
      click_func: () => this.locate(),
    });

    this.locate();
  },
  locate() {
    const { geo } = this.state;
    this.setText("Locating…");

    if (this.state.onChange) {
      geo.offChange(this.state.onChange);
    }
    this.state.onChange = () => {
      const status = geo.getStatus(); // 'A' = valid fix, 'V' = no fix yet
      if (status === "A") {
        const lat = geo.getLatitude();
        const lon = geo.getLongitude();
        logger.debug(`fix: ${lat}, ${lon}`);
        this.setText(`Lat: ${lat.toFixed(5)}\nLon: ${lon.toFixed(5)}`);
        geo.stop();
      }
    };
    geo.onChange(this.state.onChange);
    geo.start();
  },
  setText(text) {
    this.state.text && this.state.text.setProperty(hmUI.prop.MORE, { text });
  },
  onDestroy() {
    logger.debug("page onDestroy invoked");
    const { geo, onChange } = this.state;
    if (geo) {
      onChange && geo.offChange(onChange);
      geo.stop();
    }
  },
});
