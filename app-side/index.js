import { BaseSideService } from "@zeppos/zml/base-side";

// Some models return res.body as a JSON string, others as an object.
function parseBody(res) {
  const body = res && res.body;
  return typeof body === "string" ? JSON.parse(body) : body;
}

// Primary + fallback IP-geolocation providers (HTTPS, no API key).
// IP-based location works indoors (uses the phone's internet connection),
// city-level accuracy — which is plenty for prayer times.
function fetchFromIpwhois() {
  return fetch({ url: "https://ipwho.is/", method: "GET" }).then((res) => {
    const d = parseBody(res);
    if (d && d.success && d.latitude != null) {
      return {
        lat: d.latitude,
        lon: d.longitude,
        city: d.city || "",
        country: d.country || "",
        timezone: (d.timezone && d.timezone.id) || "",
      };
    }
    throw new Error("ipwho.is returned no location");
  });
}

function fetchFromIpapi() {
  return fetch({ url: "https://ipapi.co/json/", method: "GET" }).then((res) => {
    const d = parseBody(res);
    if (d && d.latitude != null) {
      return {
        lat: d.latitude,
        lon: d.longitude,
        city: d.city || "",
        country: d.country_name || "",
        timezone: d.timezone || "",
      };
    }
    throw new Error("ipapi.co returned no location");
  });
}

// Reverse-geocode the city name in the requested language (BigDataCloud's
// client endpoint is free + key-less and supports localityLanguage). Used to
// localize the city label (e.g. Arabic). Falls back to the IP-provided name.
function fetchLocalizedCity(lat, lon, lang) {
  const url =
    "https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=" +
    lat + "&longitude=" + lon + "&localityLanguage=" + lang;
  return fetch({ url: url, method: "GET" }).then((res) => {
    const d = parseBody(res);
    if (d) {
      return d.city || d.locality || d.principalSubdivision || "";
    }
    return "";
  });
}

function withLocalizedCity(loc, lang) {
  if (!lang) return Promise.resolve(loc);
  return fetchLocalizedCity(loc.lat, loc.lon, lang)
    .then((name) => {
      if (name) loc.city = name;
      return loc;
    })
    .catch(() => loc);
}

AppSideService(
  BaseSideService({
    onInit() {},
    onRun() {},
    onDestroy() {},

    onRequest(req, res) {
      if (req.method === "GET_LOCATION") {
        const lang = (req.params && req.params.lang) || "";
        fetchFromIpwhois()
          .catch(() => fetchFromIpapi())
          .then((loc) => withLocalizedCity(loc, lang))
          .then((loc) => res(null, loc))
          .catch((err) => res((err && err.message) || "location lookup failed"));
      } else {
        res("unknown method: " + req.method);
      }
    },
  })
);
