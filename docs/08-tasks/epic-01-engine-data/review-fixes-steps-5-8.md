# Review fixes — Epic 01, Steps 5–8

Steps 5–8 reviewed: all 27 tests pass and the modules are clean. One fix is required before Epic 01 is
done; two items are optional. Apply Fix 1, re-run `npm test` (must stay green), then Epic 01 is complete.
Do NOT expand scope beyond these.

---

## Fix 1 (REQUIRED): remove optional chaining from `shared/scheduler.js`

`shared/scheduler.js` is the only file using optional chaining (`?.`) — lines ~19 and ~47–49
(`settings?.reminderOffsetMin`, `settings?.method`, `settings?.madhab`, `settings?.highLatRule`). This
module is imported by on-watch code (the page and `app-service`), and `?.` is ES2020. If the Zepp OS 3
runtime/bundler doesn't support it, alarm scheduling will **silently break on-device** even though the
Node tests pass. The rest of the codebase (e.g. `storage.js`) deliberately avoids `?.`.

**Do this:** replace the optional chaining with explicit guards, matching the existing code style. For example:
- `const offsetMs = (settings && settings.reminderOffsetMin ? settings.reminderOffsetMin : 0) * 60 * 1000;`
- Guard the `computeTimes` call with a local `const s = settings || {};` and pass `s.method`, `s.madhab`, `s.highLatRule`.

No behavior change — just remove `?.` everywhere in this file. Confirm `npm test` is still green (27 passing).

## Fix 2 (OPTIONAL): invalid-location alarm behavior in `shared/scheduler.js`

Currently, when `location` is invalid, `planAlarms` returns `cancelIds = [...existingAlarmIds]` with an
empty `create`. The caller would then cancel all existing alarms and schedule none, leaving the user with
**zero reminders**. Consider returning `cancelIds: []` (and unchanged `scheduledThrough`) on invalid
location, so previously-scheduled alarms keep firing until a valid location is available. If you change
this, add/adjust a test to cover it. (Can also be deferred to the Epic 02 wiring — your call.)

## Fix 3 (OPTIONAL): broaden `shared/hijri.test.js`

`toHijri` uses a 29.5-day average month, so it can be ±1 day vs official dates (acceptable for V1
display). Add 1–2 more reference-date assertions — e.g. a date near a Hijri year boundary and a known Eid
date — to catch any gross off-by-one. Display-only; not a blocker.

---

## Done when
- `shared/scheduler.js` has no `?.` / `??`; explicit guards used instead; behavior unchanged.
- `npm test` is green.
- (Optional) invalid-location returns `cancelIds: []`; (optional) extra hijri tests added.
- No new scope beyond the above.
