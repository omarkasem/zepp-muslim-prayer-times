import { Compass, Vibrator, VIBRATOR_SCENE_DURATION } from "@zos/sensor";
import { getLocation } from "../../shared/storage";
import { qiblaBearing as calcQiblaBearing } from "../../shared/qibla";
import { t } from "../i18n";

const ALIGN_THRESHOLD_DEG = 6;
const CALIBRATE_MIN_MS = 3000;
const CALIBRATE_MAX_MS = 8000;
const FIGURE8_INTERVAL_MS = 50;
const CALIBRATE_FRESH_MS = 2 * 60000;

const CARDINALS = ["cardinal_n", "NE", "cardinal_e", "SE", "cardinal_s", "SW", "cardinal_w", "NW"];

let lastCalibratedAt = 0;

function calibratedRecently() {
  return lastCalibratedAt > 0 && (Date.now() - lastCalibratedAt) < CALIBRATE_FRESH_MS;
}

export function bearingToCardinal(deg) {
  const normalized = ((deg % 360) + 360) % 360;
  const idx = Math.round(normalized / 45) % 8;
  const k = CARDINALS[idx];
  return k.startsWith("cardinal_") ? t(k) : k;
}

export function normalize360(deg) {
  return ((deg % 360) + 360) % 360;
}

export function minimalAngleFromZero(deg) {
  const n = normalize360(deg);
  return n > 180 ? 360 - n : n;
}

export function createQiblaController(onStateChange, onAnimTick, onHeadingTick) {
  const state = {
    location: null,
    qiblaBearing: null,
    phase: "calibrate",
    aligned: false,
    calibrateStartedAt: 0,
    lastVibrateAt: 0,
    figure8T: 0,
    headingValid: false,
    headingAngle: null,
    relAngle: null,
  };

  let compass = null;
  let animTimer = null;
  let fallbackTimer = null;
  let pollTimer = null;
  let onChangeCb = null;
  // The page fires onResume right after onInit on first show; without this we'd
  // start the calibrate cycle twice. Skip the first onResume after onInit.
  let initialized = false;

  function stopAnim() {
    if (animTimer) {
      clearInterval(animTimer);
      animTimer = null;
    }
  }

  function startAnim() {
    stopAnim();
    animTimer = setInterval(() => {
      if (state.phase !== "calibrate") {
        stopAnim();
        return;
      }
      state.figure8T += 0.12;
      onAnimTick(state.figure8T);
    }, FIGURE8_INTERVAL_MS);
  }

  function stopFallback() {
    if (fallbackTimer) {
      clearTimeout(fallbackTimer);
      fallbackTimer = null;
    }
  }

  function transitionToActive() {
    stopAnim();
    stopFallback();
    state.phase = "active";
    state.aligned = false;
    lastCalibratedAt = Date.now();
    onStateChange();
    handleReading();
  }

  function startFallback() {
    stopFallback();
    fallbackTimer = setTimeout(() => {
      if (state.phase === "calibrate") {
        transitionToActive();
      }
    }, CALIBRATE_MAX_MS);
  }

  function stopPoll() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  function stopCompass() {
    stopPoll();
    if (compass) {
      try { compass.stop(); } catch (e) {}
      try { if (onChangeCb) compass.offChange(onChangeCb); } catch (e) {}
      compass = null;
      onChangeCb = null;
    }
  }

  function maybeVibrate() {
    const now = Date.now();
    if (now - (state.lastVibrateAt || 0) < 2000) return;
    state.lastVibrateAt = now;
    try {
      const v = new Vibrator();
      try { v.setMode({ mode: VIBRATOR_SCENE_DURATION }); } catch (e) {}
      v.start();
    } catch (e) {}
  }

  function handleReading() {
    if (!compass) return;
    let angle;
    try { angle = compass.getDirectionAngle(); } catch (e) { angle = "INVALID"; }
    const valid = !(typeof angle === "string" || isNaN(angle));
    
    state.headingValid = valid;
    state.headingAngle = valid ? angle : null;

    if (state.phase === "calibrate") {
      const elapsed = Date.now() - (state.calibrateStartedAt || 0);
      if (valid && elapsed >= CALIBRATE_MIN_MS) transitionToActive();
      return;
    }

    if (state.phase === "active") {
      if (!valid || state.qiblaBearing == null) {
        onHeadingTick(null, null);
        return;
      }
      // Keep the freshness window anchored to real usage, not just the moment
      // calibration finished, so a long active session doesn't expire mid-use.
      lastCalibratedAt = Date.now();
      const heading = angle;
      const rel = normalize360(state.qiblaBearing - heading);
      const minA = minimalAngleFromZero(rel);
      const isAligned = minA <= ALIGN_THRESHOLD_DEG;
      const wasAligned = state.aligned;
      state.aligned = isAligned;
      state.relAngle = rel;

      onHeadingTick(heading, rel);

      if (isAligned && !wasAligned) {
        maybeVibrate();
      }
    }
  }

  function startCompass() {
    stopCompass();
    compass = new Compass();
    onChangeCb = () => handleReading();
    try { compass.onChange(onChangeCb); } catch (e) {}
    try { compass.start(); } catch (e) {}
    stopPoll();
    pollTimer = setInterval(() => handleReading(), 150);
  }

  function startCalibrate() {
    state.figure8T = 0;
    state.calibrateStartedAt = Date.now();
    startAnim();
    startCompass();
    startFallback();
  }

  return {
    state,
    onInit() {
      const loc = getLocation();
      state.location = loc;
      if (loc) {
        try {
          state.qiblaBearing = calcQiblaBearing(loc);
        } catch (e) {
          state.qiblaBearing = null;
        }
      }
      initialized = true;
      if (!loc || state.qiblaBearing == null) {
        state.phase = "noLocation";
      } else {
        if (calibratedRecently()) {
          state.phase = "active";
          state.aligned = false;
          startCompass();
        } else {
          state.phase = "calibrate";
          startCalibrate();
        }
      }
    },
    onResume() {
      // The first onResume immediately follows onInit, which already started the
      // correct phase. Skip it so we don't restart calibration redundantly.
      if (initialized) {
        initialized = false;
        return;
      }
      if (state.phase === "noLocation") return;
      if (calibratedRecently()) {
        state.phase = "active";
        state.aligned = false;
        onStateChange();
        startCompass();
        return;
      }
      state.phase = "calibrate";
      state.aligned = false;
      onStateChange();
      startCalibrate();
    },
    onPause() {
      // Once hidden, any later onResume is a genuine return: clear the
      // first-resume guard so it can't accidentally swallow a real resume.
      initialized = false;
      stopCompass();
      stopAnim();
      stopFallback();
    },
    onDestroy() {
      stopCompass();
      stopAnim();
      stopFallback();
    }
  };
}
