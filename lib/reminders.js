import { set, cancel } from "@zos/alarm";
import { planAlarms } from "../shared/scheduler";
import { computePrayerTimes } from "../shared/prayer-times";
import {
  getLocation,
  getSettings,
  getAlarmIds,
  setAlarmIds,
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

export function applyReminders(now = Date.now()) {
  const location = getLocation();
  const settings = getSettings();
  const existingAlarmIds = getAlarmIds();
  const scheduledThrough = getScheduledThrough();

  if (!location) {
    for (let i = 0; i < existingAlarmIds.length; i++) {
      cancel(existingAlarmIds[i]);
    }
    setAlarmIds([]);
    return;
  }

  const plan = planAlarms({
    now,
    location,
    settings,
    existingAlarmIds,
    scheduledThrough,
    windowDays: 2,
    computeTimes: computePrayerTimes,
  });

  for (let i = 0; i < plan.cancelIds.length; i++) {
    cancel(plan.cancelIds[i]);
  }

  const newIds = [];

  for (let i = 0; i < plan.create.length; i++) {
    const item = plan.create[i];
    const id = set({
      url: APP_SERVICE_URL,
      time: item.time,
      param: item.prayer,
      store: true,
    });
    if (id) newIds.push(id);
  }

  const rolloverTime = nextLocalMidnightSec(now);
  if (rolloverTime > Math.floor(now / 1000)) {
    const rolloverId = set({
      url: APP_SERVICE_URL,
      time: rolloverTime,
      param: ROLLOVER_PARAM,
      store: true,
    });
    if (rolloverId) newIds.push(rolloverId);
  }

  setAlarmIds(newIds);
  setScheduledThrough(plan.scheduledThrough);
}
