import { set, cancel } from "@zos/alarm";
import { getDeviceInfo } from "@zos/device";
import { planAlarms } from "../shared/scheduler";
import { computePrayerTimes } from "../shared/prayer-times";
import {
  getLocation,
  getSettings,
  getAlarmEntries,
  setAlarmEntries,
  getRolloverAlarm,
  setRolloverAlarm,
  getLegacyAlarmIds,
  clearLegacyAlarmIds,
  getScheduledThrough,
  setScheduledThrough,
} from "../shared/storage";

const APP_SERVICE_URL = "app-service/reminder";
const ROLLOVER_PARAM = "rollover";
const ROLLOVER_BUFFER_MIN = 5;

function nextLocalMidnightSec(now) {
  const d = new Date(now);
  const ms = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, ROLLOVER_BUFFER_MIN, 0, 0).getTime();
  return Math.floor(ms / 1000);
}

// The midnight rollover alarm is what extends the schedule day-to-day. It lives
// in its own storage slot so the prayer-alarm diff can never cancel it. We only
// (re)create it when it's missing or has already passed, so a healthy rollover
// is left untouched across reschedules.
function ensureRollover(now) {
  const nowSec = Math.floor(now / 1000);
  const existing = getRolloverAlarm();

  if (existing && typeof existing.time === "number" && existing.time > nowSec) {
    return; // still pending; leave it alone
  }
  if (existing && existing.id != null) {
    try { cancel(existing.id); } catch (e) {}
    setRolloverAlarm(null);
  }

  const rolloverTime = nextLocalMidnightSec(now);
  if (rolloverTime > nowSec) {
    let id;
    try {
      id = set({
        url: APP_SERVICE_URL,
        time: rolloverTime,
        param: ROLLOVER_PARAM,
        store: true,
      });
    } catch (e) {}
    if (id) setRolloverAlarm({ id, time: rolloverTime });
  }
}

export function applyReminders(now = Date.now()) {
  // One-time migration from the old flat-id storage format. Those ids carry no
  // timing metadata so they can't be diffed; cancel them once and move on.
  const legacy = getLegacyAlarmIds();
  if (legacy.length) {
    for (let i = 0; i < legacy.length; i++) {
      try { cancel(legacy[i]); } catch (e) {}
    }
    clearLegacyAlarmIds();
  }

  const location = getLocation();
  const settings = getSettings();
  const existingAlarms = getAlarmEntries();
  const scheduledThrough = getScheduledThrough();

  if (!location) {
    for (let i = 0; i < existingAlarms.length; i++) {
      try { cancel(existingAlarms[i].id); } catch (e) {}
    }
    setAlarmEntries([]);
    // Keep the rollover alive so we automatically recover once a location is set.
    ensureRollover(now);
    return;
  }

  const plan = planAlarms({
    now,
    location,
    settings,
    existingAlarms,
    scheduledThrough,
    windowDays: 2,
    computeTimes: computePrayerTimes,
  });

  const { deviceSource } = getDeviceInfo();
  const target = [9765120, 9765121, 10158337].indexOf(deviceSource) !== -1 ? "bip6" : "gt";
  const APP_PAGE_URL = `page/${target}/alert/index.page`;

  // Create the new alarms FIRST. Only after they're registered (and persisted)
  // do we cancel the ones they replace, so a failed set() can never leave the
  // watch with nothing scheduled. With incremental diffing `create` is normally
  // tiny (just the newly-uncovered far edge of the window), so we don't risk
  // briefly exceeding the device alarm cap the way a full rebuild would.
  const created = [];
  for (let i = 0; i < plan.create.length; i++) {
    const item = plan.create[i];
    let id;
    try {
      id = set({
        url: APP_PAGE_URL,
        time: item.time,
        param: item.prayer,
        store: true,
      });
    } catch (e) {}
    if (id) created.push({ id, time: item.time, prayer: item.prayer });
  }

  // Persist kept + created before cancelling, so storage always reflects every
  // live alarm even if we're interrupted partway through the cancel loop.
  setAlarmEntries(plan.keep.concat(created));
  setScheduledThrough(plan.scheduledThrough);

  for (let i = 0; i < plan.cancelIds.length; i++) {
    try { cancel(plan.cancelIds[i]); } catch (e) {}
  }

  ensureRollover(now);
}
