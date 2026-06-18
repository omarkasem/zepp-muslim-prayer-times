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

AppSideService(
  BaseSideService({
    onInit() {},
    onRun() {},
    onDestroy() {},

    onRequest(req, res) {
      if (req.method === "GET_LOCATION") {
        fetchFromIpwhois()
          .catch(() => fetchFromIpapi())
          .then((loc) => res(null, loc))
          .catch((err) => res((err && err.message) || "location lookup failed"));
      } else {
        res("unknown method: " + req.method);
      }
    },
  })
);
