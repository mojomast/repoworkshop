"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const test = require("node:test");
const { createServer } = require("../server.js");

const root = path.resolve(__dirname, ".."); let directory; let server; let config; let origin; let base;
test.before(async () => {
  directory = fs.mkdtempSync(path.join(fs.existsSync("/dev/shm") ? "/dev/shm" : require("node:os").tmpdir(), "repoworkshop-route-test-"));
  config = { bind: "127.0.0.1", port: 0, capability: "Route_Test_Capability_0123456789abcdef", manifestPath: path.join(root, "manifest.example.json"), stateDir: directory };
  server = createServer(config); await new Promise((resolve) => server.listen(0, config.bind, resolve)); config.port = server.address().port; origin = `http://${config.bind}:${config.port}`; base = `${origin}/${config.capability}/`;
});
test.after(async () => { await new Promise((resolve) => server.close(resolve)); fs.rmSync(directory, { recursive: true, force: true }); });
function requestWithHost(host) {
  return new Promise((resolve, reject) => { const request = http.get({ hostname: config.bind, port: config.port, path: `/${config.capability}/api/state`, headers: { Host: host } }, (response) => { response.resume(); response.on("end", () => resolve(response)); }); request.on("error", reject); });
}
function oversizedRequest() {
  return new Promise((resolve, reject) => { const request = http.request({ hostname: config.bind, port: config.port, path: `/${config.capability}/api/state`, method: "PUT", headers: { Host: `${config.bind}:${config.port}`, Origin: origin, "Content-Type": "application/json", "Content-Length": "262145" } }, (response) => { response.resume(); response.on("end", () => resolve(response)); }); request.on("error", reject); request.end("{}"); });
}

test("smoke serves page, local assets, manifest projection, and no arbitrary files", async () => {
  for (const route of ["", "app.js", "app.css", "api/manifest", "api/state"]) { const response = await fetch(`${base}${route}`); assert.equal(response.status, 200, route); assert.equal(response.headers.get("cache-control"), "no-store"); assert.equal(response.headers.get("x-content-type-options"), "nosniff"); assert.equal(response.headers.get("x-frame-options"), "DENY"); assert.equal(response.headers.get("referrer-policy"), "no-referrer"); assert.match(response.headers.get("content-security-policy"), /default-src 'none'/); }
  const projection = await (await fetch(`${base}api/manifest`)).json(); assert.equal(projection.manifest.project.displayName, "Repository Planning Workshop"); assert.equal(JSON.stringify(projection).includes(directory), false);
  assert.equal((await fetch(`${base}server.js`)).status, 404); assert.equal((await fetch(`${origin}/manifest.example.json`)).status, 404); assert.equal((await fetch(`${origin}/wrong/api/state`)).status, 404);
});

test("known wrong methods, media type, Host, Origin, proxies, and body cap fail closed", async () => {
  let response = await fetch(base, { method: "POST" }); assert.equal(response.status, 405); assert.equal(response.headers.get("allow"), "GET");
  response = await fetch(`${base}api/state`, { method: "PUT", headers: { Origin: origin, "Content-Type": "text/plain" }, body: "{}" }); assert.equal(response.status, 415);
  response = await fetch(`${base}api/state`, { method: "PUT", headers: { Origin: "http://127.0.0.1:9", "Content-Type": "application/json" }, body: "{}" }); assert.equal(response.status, 403);
  response = await fetch(`${base}api/state`, { headers: { "X-Forwarded-For": "127.0.0.1" } }); assert.equal(response.status, 400);
  response = await requestWithHost("example.invalid"); assert.equal(response.statusCode, 400);
  response = await oversizedRequest(); assert.equal(response.statusCode, 413);
  response = await fetch(`${base}api/state`, { method: "PUT", headers: { Origin: origin, "Content-Type": "application/json" }, body: "{" }); assert.equal(response.status, 400);
});

test("PUT saves, increments revision, and returns current state on stale conflict", async () => {
  const loaded = await (await fetch(`${base}api/state`)).json(); loaded.state.decisions[0].answer = "thin-slice";
  let response = await fetch(`${base}api/state`, { method: "PUT", headers: { Origin: origin, "Content-Type": "application/json" }, body: JSON.stringify({ expectedRevision: 0, state: loaded.state }) }); assert.equal(response.status, 200); const saved = await response.json(); assert.equal(saved.state.revision, 1); assert.equal(saved.state.ready, true);
  response = await fetch(`${base}api/state`, { method: "PUT", headers: { Origin: origin, "Content-Type": "application/json" }, body: JSON.stringify({ expectedRevision: 0, state: loaded.state }) }); assert.equal(response.status, 409); assert.equal((await response.json()).state.revision, 1);
});

test("startup log guidance contains no capability token", () => {
  const source = fs.readFileSync(path.join(root, "server.js"), "utf8"); assert.doesNotMatch(source, /console\.log\([^\n]*capability\}/); assert.match(source, /private capability URL/);
});
