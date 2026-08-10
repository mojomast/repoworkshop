"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { canonical, manifestDigest, validateManifest, initialState, validateState, computeReady, persistState, loadState, statePath } = require("../state.js");
const { isSafeBind, loadConfig, loadManifest } = require("../server.js");

const root = path.resolve(__dirname, "..");
const fixture = () => JSON.parse(fs.readFileSync(path.join(root, "manifest.example.json"), "utf8"));
const temporaryRoots = [];
function temporary() {
  const parent = fs.existsSync("/dev/shm") ? "/dev/shm" : os.tmpdir();
  const directory = fs.mkdtempSync(path.join(parent, "repoworkshop-board-test-")); temporaryRoots.push(directory); return directory;
}
test.after(() => temporaryRoots.splice(0).forEach((directory) => fs.rmSync(directory, { recursive: true, force: true })));

test("manifest validates and digest uses deterministic canonical serialization", () => {
  const manifest = fixture(); assert.equal(validateManifest(manifest), manifest); assert.match(manifestDigest(manifest), /^[a-f0-9]{64}$/);
  assert.equal(canonical({ z: 1, a: { y: 2, b: 3 } }), '{"a":{"b":3,"y":2},"z":1}');
  const reordered = JSON.parse(JSON.stringify(manifest)); reordered.project = { stateNamespace: reordered.project.stateNamespace, displayName: reordered.project.displayName, artifactBasename: reordered.project.artifactBasename, subtitle: reordered.project.subtitle };
  assert.equal(manifestDigest(reordered), manifestDigest(manifest)); reordered.epics.reverse(); assert.notEqual(manifestDigest(reordered), manifestDigest(manifest));
});

test("manifest rejects unknown keys, references, cycles, duplicates, order, and recommendations", () => {
  const cases = [];
  let value = fixture(); value.extra = true; cases.push(value);
  value = fixture(); value.epics[1].dependencies = ["absent"]; cases.push(value);
  value = fixture(); value.epics[0].dependencies = ["validation-path"]; cases.push(value);
  value = fixture(); value.epics[1].id = value.epics[0].id; cases.push(value);
  value = fixture(); [value.epics[1], value.epics[2]] = [value.epics[2], value.epics[1]]; cases.push(value);
  value = fixture(); value.decisions[0].options.forEach((option) => { option.recommended = false; }); cases.push(value);
  value = fixture(); value.project.artifactBasename = "../unsafe"; cases.push(value);
  cases.forEach((candidate) => assert.throws(() => validateManifest(candidate)));
});

test("initial state exactly follows authority without writing and computes readiness", () => {
  const manifest = fixture(); const parent = temporary(); const missing = path.join(parent, "state"); const state = loadState(missing, manifest);
  assert.equal(fs.existsSync(missing), false); assert.deepEqual(state.epics.map((epic) => epic.id), manifest.epics.map((epic) => epic.id)); assert.equal(state.epics.every((epic) => epic.included && epic.disposition === "Build"), true); assert.equal(state.ready, false);
  state.decisions[0].answer = "thin-slice"; state.ready = true; assert.equal(computeReady(state, manifest).ready, true); validateState(state, manifest);
  state.decisions[0].answer = "custom"; state.decisions[0].customAnswer = ""; assert.equal(computeReady(state, manifest).ready, false);
  state.epics[0].id = "wrong"; assert.throws(() => validateState(state, manifest), /IDs\/order/);
});

test("readiness blocks dispositions, decisions, blockers, and missing reasons", () => {
  const manifest = fixture(); const state = initialState(manifest); state.decisions[0].answer = "thin-slice";
  state.epics[0].disposition = "Need decision"; assert.equal(computeReady(state, manifest).ready, false);
  state.epics[0].disposition = "Remove"; assert.match(computeReady(state, manifest).failures.join(" "), /reason/);
  state.epics[0].reason = "Superseded"; state.blockers.push({ id: "external-review", owner: "Team", severity: "high", request: "Confirm boundary", notes: "", resolved: false }); assert.equal(computeReady(state, manifest).ready, false);
  state.blockers[0].resolved = true; assert.equal(computeReady(state, manifest).ready, true);
});

test("atomic persistence revisions, conflicts, mode, and refuses symlinks", () => {
  const manifest = fixture(); const directory = temporary(); const state = loadState(directory, manifest); state.decisions[0].answer = "thin-slice";
  let result = persistState(directory, manifest, state, 0, "2026-01-01T00:00:00.000Z"); assert.equal(result.conflict, false); assert.equal(result.state.revision, 1); assert.equal(result.state.ready, true);
  const file = statePath(directory, manifest.project.stateNamespace); if (process.platform !== "win32") assert.equal(fs.statSync(file).mode & 0o777, 0o600);
  result = persistState(directory, manifest, state, 0); assert.equal(result.conflict, true); assert.equal(result.state.revision, 1); assert.equal(fs.readdirSync(directory).some((name) => name.endsWith(".tmp")), false);
  const linkDirectory = path.join(temporary(), "linked"); fs.symlinkSync(directory, linkDirectory); assert.throws(() => loadState(linkDirectory, manifest), /safe directory|symlink/);
  fs.rmSync(file); fs.symlinkSync(path.join(directory, "target"), file); assert.throws(() => loadState(directory, manifest), /regular file/);
});

test("bind and configuration accept only exact private IPv4 and safe capability", () => {
  ["127.0.0.1", "127.2.3.4", "10.1.2.3", "172.16.0.1", "172.31.255.254", "192.168.5.4"].forEach((address) => assert.equal(isSafeBind(address), true));
  ["0.0.0.0", "::", "localhost", "8.8.8.8", "172.32.0.1", "192.169.1.1", "10.1.2.3/24", "01.2.3.4.example"].forEach((address) => assert.equal(isSafeBind(address), false));
  assert.throws(() => loadConfig({ REPOWORKSHOP_BIND: "0.0.0.0", REPOWORKSHOP_CAPABILITY: "a".repeat(32) }));
  assert.throws(() => loadConfig({ REPOWORKSHOP_BIND: "127.0.0.1", REPOWORKSHOP_CAPABILITY: "short" }));
  assert.equal(loadConfig({ REPOWORKSHOP_BIND: "127.0.0.1", REPOWORKSHOP_CAPABILITY: "Ab_".repeat(12), REPOWORKSHOP_MANIFEST: path.join(root, "manifest.example.json"), REPOWORKSHOP_STATE_DIR: temporary() }).bind, "127.0.0.1");
  assert.equal(loadManifest(path.join(root, "manifest.example.json")).schemaVersion, 1);
});

test("UI is local, generic, accessible, compact, and manifest-driven", () => {
  const html = fs.readFileSync(path.join(root, "public/index.html"), "utf8"); const js = fs.readFileSync(path.join(root, "public/app.js"), "utf8"); const css = fs.readFileSync(path.join(root, "public/app.css"), "utf8"); const combined = `${html}\n${js}\n${css}`;
  assert.match(html, /id="epic-groups"/); assert.match(html, /id="unanswered-only"/); assert.match(html, /id="blockers"/); assert.match(html, /Review-only export/); assert.match(html, /label/); assert.match(css, /max-width: 600px/); assert.match(css, /:focus-visible/); assert.doesNotMatch(combined, /role="grid"|position:\s*sticky|https?:\/\//i);
  assert.doesNotMatch(js, /core-contract|delivery-sequence|\.epics\.length\s*[!=]==?\s*\d/); assert.match(js, /manifest\.project\.displayName/); assert.match(js, /artifactBasename/); assert.match(js, /textContent/); assert.doesNotMatch(js, /innerHTML|insertAdjacentHTML|document\.write/);
  const identifiers = (process.env.REPOWORKSHOP_SOURCE_IDENTIFIERS || "").split(",").map((value) => value.trim()).filter(Boolean);
  identifiers.forEach((identifier) => assert.equal(combined.toLowerCase().includes(identifier.toLowerCase()), false, `stale source identifier: ${identifier}`));
});
