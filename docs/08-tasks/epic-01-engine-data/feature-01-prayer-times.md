# Purpose

Compute the five daily prayer times (Fajr, Dhuhr, Asr, Maghrib, Isha) for a location, date, and
settings — offline, as pure JavaScript. This is the accuracy core of the whole app.

# User Value

Correct prayer times that match the user's local mosque — the single thing both incumbent apps fail at.

# Dependencies

- `shared/methods.js` (calculation-method presets).
- Inputs come from `shared/storage.js` (`location`, `settings`) — but this module receives plain values,
  it does not read storage itself.

# Target Files

- `shared/prayer-times.js` (create)
- `shared/__tests__/prayer-times.test.js` (create)

# Public Interface

```js
// shared/prayer-times.js
// Pure. No @zos/*. Date/Math only.
export function computePrayerTimes({
  lat,            // number
  lon,            // number
  timezone,       // IANA id string, e.g. "Africa/Cairo" (from the IP lookup)
  date,           // JS Date for the target day (local day)
  method,         // method id understood by methods.js
  madhab,         // "standard" (Shafi) | "hanafi"  → Asr shadow factor
  highLatRule,    // "none" | "middle_of_night" | "one_seventh" | "angle_based"
}) /* => { fajr, dhuhr, asr, maghrib, isha } as epoch-ms numbers (instants) */
```

- Output: an object mapping each prayer to an **epoch-ms instant** (so the scheduler can turn them into
  alarm timestamps and the UI can format them). Returning instants avoids string/format ambiguity.

# Related Services

- None (pure module).

# Related Shared Logic

- `methods.js` for Fajr/Isha twilight angles; `madhab` selects the Asr shadow-length factor (1 vs 2).

# Build Order

After `methods.js` (Step 3), before `scheduler.js` (Step 7).

# Tasks

- Port an established prayer-time algorithm (adhan-style / PrayTimes.org) into pure JS — do NOT hand-roll
  solar astronomy.
- Map `method` → angles via `methods.js`; map `madhab` → Asr factor (standard = 1, hanafi = 2).
- **Timezone:** compute the prayer instants using the **location's** timezone offset, not the host/device
  clock. Pragmatic approach: derive the day's UTC offset for `timezone` (the device is normally in that
  zone, so its offset is a valid fallback if a tz lookup isn't available); document whichever approach is used.
- Apply the `highLatRule` so extreme latitudes never yield NaN/invalid times.
- Validate inputs: numeric `lat`/`lon`, a `date`, a known `method` (fall back via `methods.js`).

# Tests

- Cairo (known method/date) matches a trusted reference within ±1 minute for all 5 prayers.
- A second location in a different timezone matches its reference (guards the timezone path).
- `madhab: "hanafi"` produces a later Asr than `"standard"` for the same inputs.
- Changing `method` changes Fajr/Isha as expected (e.g. ISNA vs MWL differ).
- A high-latitude location with each `highLatRule` returns finite, ordered times (fajr < dhuhr < asr < maghrib < isha).
- Invalid input (missing `lat`) throws or returns a clearly-invalid result (defined behavior, tested).

# Acceptance Criteria

- `computePrayerTimes` returns 5 ordered epoch-ms instants for valid input.
- Times match references within ±1 min for the tested locations/methods.
- No `@zos/*`, no Node/DOM APIs; runs under Vitest.
- High-latitude and bad input handled without NaN.

# Definition Of Done

- Validation on inputs.
- Follows architecture (pure `shared/` module) + naming conventions.
- Edge cases handled (timezone, high latitude, bad input).
- Vitest tests pass.
- No debug leftovers.

# Notes For AI Coding

- The timezone handling is the highest-risk part — be explicit in code comments about how the offset is
  derived, and make at least one test use a timezone different from the machine running the tests.
- Keep the algorithm in one focused module; don't pull in a large dependency if a compact port suffices.
