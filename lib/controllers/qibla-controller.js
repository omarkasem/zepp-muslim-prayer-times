import { Compass, Vibrator, VIBRATOR_SCENE_DURATION } from "@zos/sensor";
import { getLocation } from "../../shared/storage";
import { qiblaBearing as calcQiblaBearing } from "../../shared/qibla";
import { t } from "../i18n";

const ALIGN_THRESHOLD_DEG = 6;
const CALIBRATE_FALLBACK_MS = 5000;
const FIGURE8_INTERVAL_MS = 50;

const CARDINALS = ["cardinal_n", "NE", "cardinal_e", "SE", "cardinal_s", "SW", "cardinal_w", "NW"];

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
    onStateChange();
    handleReading();
  }

  function startFallback() {
    stopFallback();
    fallbackTimer = setTimeout(() => {
      if (state.phase === "calibrate") {
        transitionToActive();
      }
    }, CALIBRATE_FALLBACK_MS);
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
      if (valid) transitionToActive();
      return;
    }

    if (state.phase === "active") {
      if (!valid || state.qiblaBearing == null) {
        onHeadingTick(null, null);
        return;
      }
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
      if (!loc || state.qiblaBearing == null) {
        state.phase = "noLocation";
      } else {
        state.phase = "calibrate";
        startCalibrate();
      }
    },
    onResume() {
      if (state.phase === "calibrate") {
        startCalibrate();
      } else if (state.phase === "active") {
        startCompass();
      }
    },
    onPause() {
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
