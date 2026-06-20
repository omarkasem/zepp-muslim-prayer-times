// TEST ONLY — remove this file (and its callers) before release.
//
// Schedules N back-to-back alarms a few seconds apart so the prayer-alert
// screen can be triggered repeatedly without waiting for real prayer times.
// Mirrors the real alarm path in lib/reminders.js (same url + string param).
import { set } from "@zos/alarm";
import { getDeviceInfo } from "@zos/device";

export function scheduleTestAlarms(count = 10, gapSec = 15) {
  const { deviceSource } = getDeviceInfo();
  const target = [9765120, 9765121, 10158337].indexOf(deviceSource) !== -1 ? "bip6" : "gt";
  const url = `page/${target}/alert/index.page`;
  const prayers = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
  const nowSec = Math.floor(Date.now() / 1000);
  const ids = [];
  for (let i = 0; i < count; i++) {
    const id = set({
      url: url,
      time: nowSec + gapSec * (i + 1),
      param: prayers[i % prayers.length],
      store: true,
    });
    if (id) ids.push(id);
  }
  return ids;
}
