import { BasePage } from "@zeppos/zml/base-page";
import * as hmUI from "@zos/ui";
import { getDeviceInfo } from "@zos/device";
import { px } from "@zos/utils";

const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = getDeviceInfo();

Page(
  BasePage({
    build() {
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(20),
        y: (DEVICE_HEIGHT - px(100)) / 2,
        w: DEVICE_WIDTH - px(40),
        h: px(100),
        color: 0xffffff,
        text_size: px(30),
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text_style: hmUI.text_style.WRAP,
        text: "Prayer Times",
      });
    },
  })
);
