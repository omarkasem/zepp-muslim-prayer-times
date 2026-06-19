# Product Description

A free Zepp OS watch app (Amazfit / Zepp watches) that shows the five daily Muslim prayer
times for the user's location and fires a wrist reminder before/at each prayer. Prayer times
are computed **offline on the watch** from the device's coordinates, so the app keeps working
with no phone connected. First target device: **Amazfit Bip 6**; also targeting the `gt` family
(round `r` / square `s`).

# Problem Statement

Muslims who wear a Zepp/Amazfit watch have no reliable on-wrist way to know prayer times or
get reminded. The two existing prayer apps in the Zepp store are unusable:

- one **doesn't work at all**,
- the other shows **inaccurate times**.

"Inaccurate" in prayer apps almost never means bad astronomy — it means a wrong **calculation
method**, wrong **timezone**, or wrong **coordinates**. So the bar to beat is low, and the win
condition is concrete: *times that match the user's local mosque, and reminders that actually
fire.*

# Target Users

- Practising Muslims who already own a Zepp/Amazfit watch (starting with Bip 6).
- People who want a glanceable next-prayer time + a wrist buzz, without pulling out their phone.
- Not a niche to "grow" — it's a free utility for an underserved existing audience.

# Main Features

- Today's five prayer times (Fajr, Dhuhr, Asr, Maghrib, Isha) for the user's location.
- Next-prayer name + live countdown on the main screen.
- Automatic daily reminders (notification + vibration) at a user-chosen offset before each prayer,
  or exactly on time.
- Calculation-method picker (Umm al-Qura, MWL, Egyptian, ISNA, etc.) — the main accuracy lever —
  plus Asr madhab (Shafi/Hanafi) and a high-latitude rule.
- Qibla direction (compass arrow toward Mecca).
- Hijri date.
- IP-based location lookup (city-level) via the phone companion, including the timezone the
  calculation depends on.

# MVP Features

Locked V1 scope:

1. **Today's 5 prayer times** computed offline on-device from lat/lon + date + method.
2. **Next-prayer + countdown** on the home screen.
3. **5 daily reminders** — auto-scheduled alarms, rescheduled each day, with a **global offset
   setting** (`remind X minutes before`, where `0` = exactly on time). *(Proven: alarms +
   notification already work.)*
4. **Calculation-method picker** + Asr madhab + high-latitude rule (settings screen).
5. **Qibla direction** (compass arrow toward Mecca).
6. **Hijri date** on the home screen.
7. **Location** via the existing IP lookup on the phone companion (lat/lon/city/timezone),
   cached on the watch so the app works offline afterward.

# Future Features

- Per-prayer reminder toggle (e.g. silence Fajr) and per-prayer manual ± minute adjustment.
- Glanceable watch tile / secondary widget showing the next prayer.
- Manual city / coordinate override for when IP location is wrong (VPN, ISP routing).
- GPS-based location for higher accuracy.
- Optional API cross-check of offline times.
- More languages (Arabic, etc.).

# Risks

- **Qibla / compass sensor** — qibla is committed to V1 (other Zepp prayer apps ship it, so the
  sensor + API exist). Build detail to confirm: which `@zos/sensor` compass API the Bip 6 exposes.
- **Offline math port** — the calculation library must run inside Zepp's restricted JS runtime
  (no DOM/Node; only `Date`/`Math`). Pure-math libraries port fine, but this needs verification.
- **Timezone correctness** — wrong timezone is the classic source of "inaccurate" times. The watch's
  local time vs the location's timezone must be handled explicitly.
- **IP location accuracy** — city-level only; can be wrong behind VPN. Acceptable for V1, but it's
  the most likely source of user complaints. Manual override is the fast-follow fix.
- **Per-target layout** — Bip 6 (390px round) and gt `r`/`s` need separate layouts; easy to let one rot.
- **Background alarm reliability** — reminders must survive day rollover and reschedule themselves;
  needs real multi-day testing on the watch.

# Possible Competitive Advantages

- **It actually works** — clears the bar both incumbents fail.
- **Accurate by construction** — correct calculation method + timezone + offline math, not a guess.
- **Works offline** — no daily phone/API dependency once location is cached.
- **Free** — no monetization friction; pure utility play.

# Honest Assessment

Keep going. This is a small, well-scoped utility for a real, underserved audience, and the two
proven-hard parts (location + reminders) already work on the device. The value is not novelty —
it's reliability and accuracy, which the incumbents fail at. The only scope I'd guard against is
per-prayer micro-config (correctly deferred). Nothing here is a blocker — the two proven-hard parts
already work, and the rest is well-trodden ground that other Zepp prayer apps already ship.
