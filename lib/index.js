// src/index.ts
var name = "dsh-plugin-radio";
var inject = ["webServer"];
var NOW_PLAYING_PATH = "/plugins/dsh-plugin-radio/now-playing";
var UPSTREAM = "https://api.radioparadise.com/api/now_playing?chan=";
var CACHE_MS = 1e4;
var TIMEOUT_MS = 5e3;
var CHANNELS = {
  "main-mix": 0,
  "mellow-mix": 1
};
var JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "public, max-age=10"
};
function setHeaders(res) {
  for (const [key, value] of Object.entries(JSON_HEADERS)) res.setHeader(key, value);
}
function respond(req, res, status, body) {
  setHeaders(res);
  res.statusCode = status;
  res.end(req.method === "HEAD" ? void 0 : body);
}
function sendJson(req, res, status, payload) {
  respond(req, res, status, JSON.stringify(payload));
}
function stringField(record, key) {
  const value = record[key];
  return typeof value === "string" ? value.trim() : "";
}
async function fetchUpstream(chan, fetchImpl, timeoutMs) {
  const signal = typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function" ? AbortSignal.timeout(timeoutMs) : void 0;
  const response = await fetchImpl(`${UPSTREAM}${chan}`, {
    signal,
    headers: { accept: "application/json" }
  });
  if (!response.ok) throw new Error(`upstream responded ${response.status}`);
  const raw = await response.json();
  if (typeof raw !== "object" || raw === null) throw new Error("upstream returned non-object");
  const record = raw;
  const title = stringField(record, "title");
  if (title === "") throw new Error("upstream returned no title");
  return {
    ok: true,
    artist: stringField(record, "artist"),
    title,
    album: stringField(record, "album")
  };
}
function createNowPlayingHandler(deps = {}) {
  const fetchImpl = deps.fetch ?? globalThis.fetch;
  const now = deps.now ?? Date.now;
  const timeoutMs = deps.timeoutMs ?? TIMEOUT_MS;
  const cacheMs = deps.cacheMs ?? CACHE_MS;
  const cache = /* @__PURE__ */ new Map();
  return async (req, res) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.setHeader("allow", "GET, HEAD");
      sendJson(req, res, 405, { ok: false });
      return;
    }
    const url = new URL(String(req.url ?? ""), "http://localhost");
    const station = url.searchParams.get("station") ?? "";
    if (!Object.prototype.hasOwnProperty.call(CHANNELS, station)) {
      sendJson(req, res, 400, { ok: false });
      return;
    }
    const chan = CHANNELS[station];
    const cached = cache.get(chan);
    if (cached !== void 0 && now() - cached.at < cacheMs) {
      respond(req, res, cached.status, cached.body);
      return;
    }
    let status = 502;
    let body = JSON.stringify({ ok: false });
    try {
      const payload = await fetchUpstream(chan, fetchImpl, timeoutMs);
      status = 200;
      body = JSON.stringify(payload);
    } catch {
    }
    cache.set(chan, { at: now(), status, body });
    respond(req, res, status, body);
  };
}
function apply(ctx) {
  const handler = createNowPlayingHandler();
  ctx.effect(
    () => ctx.webServer.register({
      kind: "exact",
      path: NOW_PLAYING_PATH,
      handler
    }),
    `dsh-radio: GET ${NOW_PLAYING_PATH}`
  );
}
export {
  NOW_PLAYING_PATH,
  apply,
  createNowPlayingHandler,
  inject,
  name
};
