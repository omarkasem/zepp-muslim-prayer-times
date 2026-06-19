import { BasePage } from "@zeppos/zml/base-page";
import * as hmUI from "@zos/ui";
import { getDeviceInfo } from "@zos/device";
import { px } from "@zos/utils";
import { COLORS, FONT_SIZES } from "../../../../lib/theme";

const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = getDeviceInfo();

Page(
  BasePage({
    build() {
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(20),
        y: (DEVICE_HEIGHT - px(100)) / 2,
        w: DEVICE_WIDTH - px(40),
        h: px(100),
        color: COLORS.TEXT_MUTED,
        text_size: px(FONT_SIZES.LABEL_SM),
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text_style: hmUI.text_style.WRAP,
        text: "Qibla (Step 5)",
      });
    },
  })
);
