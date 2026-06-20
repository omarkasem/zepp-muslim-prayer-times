# Purpose

Let the user re-fetch their location on demand (after travelling, changing network/SIM, or when the
auto-detected city is wrong), and show the city name localized (Arabic in Arabic mode). Added during Epic 04
polish in response to on-device testing (city showing the wrong/English name).

# User Value

The location is auto-detected once and cached; if it's wrong or the user moves, there was no way to refresh
without reinstalling. Now there are two obvious controls, and the city reads in the user's language.

# What was implemented

- **Tap the city/header on Home** → re-fetches the location (transparent button over the header). While
  fetching, Home shows the loading state, then re-renders with the new city + recomputed times/reminders.
- **Settings → "Update Location"** row (top of the list) → same re-fetch; shows the current city as its
  value and "Updating…" while in flight.
- **Tap the "location required" message on Home** → retries the fetch (so a failed first fetch isn't a
  dead end).
- **Localized city name**: `GET_LOCATION` now carries a `lang` param (`ar`/`en` from `isRTL()`); the
  side-service reverse-geocodes the city name in that language via BigDataCloud's key-less client endpoint,
  falling back to the IP provider's English name on failure.

# Target Files

- `lib/location.js` (new) — `requestAndStoreLocation(requestFn)` + `locationLang()`; @zos/ui-free, reused by
  the home controller and both settings pages. Persists the location and reschedules reminders.
- `lib/controllers/home-controller.js` — `fetchLocation` now uses the helper; new `refreshLocation()` method.
- `page/{bip6,gt}/home/index.page.js` — tap-to-refresh on the city header and on the unavailable message.
- `page/{bip6,gt}/settings/index.page.js` — "Update Location" row + `updateLocation()`.
- `app-side/index.js` — `fetchLocalizedCity()` / `withLocalizedCity()`; `GET_LOCATION` reads `req.params.lang`.
- i18n: keys `update_location`, `updating` (en-US + ar-EG + fallbacks).

# Not in scope (deferred)

- **GPS-based location.** IP geolocation is ISP-level, so it can report a nearby wrong city (e.g. Giza for
  an Alexandria user) and the refresh button will not fix that — re-querying IP returns the same result.
  Switching the location source to the watch GPS is a separate, larger change to be discussed/decided later.

# Notes

- City name accuracy is unchanged (still IP-derived coordinates); only the *language* of the name is
  localized and a manual refresh is now possible.
- `shared/` math + alarm semantics untouched; `shared/` tests green.
