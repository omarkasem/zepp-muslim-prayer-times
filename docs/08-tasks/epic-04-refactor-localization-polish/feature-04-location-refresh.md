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
- **Accurate IP provider chain**: the side-service now walks several key-less geolocation providers in
  accuracy order — `geojs → reallyfreegeoip → ipinfo → ipapi.co → ipwho.is` — skipping any that fail or
  return no timezone. This fixed the wrong-city problem (see below): different providers resolve the *same*
  IP very differently, and the original primary (`ipwho.is`) mislabelled an Alexandria IP as Giza while
  `geojs` returned the correct city + precise coordinates.

# Target Files

- `lib/location.js` (new) — `requestAndStoreLocation(requestFn)` + `locationLang()`; @zos/ui-free, reused by
  the home controller and both settings pages. Persists the location and reschedules reminders.
- `lib/controllers/home-controller.js` — `fetchLocation` now uses the helper; new `refreshLocation()` method.
- `page/{bip6,gt}/home/index.page.js` — tap-to-refresh on the city header and on the unavailable message.
- `page/{bip6,gt}/settings/index.page.js` — "Update Location" row + `updateLocation()`.
- `app-side/index.js` — `fetchLocalizedCity()` / `withLocalizedCity()`; `GET_LOCATION` reads `req.params.lang`
  and resolves location through `fetchIpLocation()` (the ordered provider chain).
- i18n: keys `update_location`, `updating` (en-US + ar-EG + fallbacks).

# Wrong-city investigation & resolution

On-device the city was wrong (Giza shown for an Alexandria user). We investigated the alternatives before
landing on the actual fix:

- **Watch GPS (`@zos/sensor` Geolocation)** — tried and rejected. Indoors it never gets a fix (`getStatus()`
  stays `"V"`, zero satellites), and most usage is indoors. Not viable as the location source.
- **Phone city via the Weather sensor** — tried and rejected. It reads whatever city the Zepp app has
  configured, which was itself wrong (Cairo), so it inherited the same error.
- **Better IP provider** — the actual fix. Testing the user's IP against multiple providers showed most
  return the correct city; the original primary (`ipwho.is`) was simply inaccurate for this IP. Because it
  *succeeded* with the wrong city, the old fallback to `ipapi.co` never triggered. Replacing the chain with
  accuracy-ordered providers (geojs primary) resolved it with no new permissions — matching how comparable
  Store apps do it (device-info / file / compass permissions only, no geolocation).

# Notes

- City accuracy is now correct: same IP mechanism, but an accurate provider chain. The name is still
  reverse-geocoded for language (Arabic in Arabic mode), and a manual refresh is available.
- No GPS / geolocation permission is required; the side-service `fetch` runs over the phone's connection.
- `shared/` math + alarm semantics untouched; `shared/` tests green.
