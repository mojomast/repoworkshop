"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const stateModule = require("../state.js");
const { isSafeBind, loadConfig, loadManifest } = require("../server.js");

const root = path.resolve(__dirname, "..");
const fixture = () => stateModule.parseJsonStrict(fs.readFileSync(path.join(root, "manifest.example.json"), "utf8"));
const roots = [];
function temporary() { const directory = fs.mkdtempSync(path.join(fs.existsSync("/dev/shm") ? "/dev/shm" : os.tmpdir(), "repoworkshop-board-test-")); roots.push(directory); return directory; }
test.after(() => roots.splice(0).forEach((directory) => fs.rmSync(directory, { recursive: true, force: true })));
function answerRequired(state) { state.decisions[0].selectedOptionId = "DEC-001-OPT-01"; state.ready = true; state.stateDigest = stateModule.stateDigest(state); }

test("published canonical vectors cover exact bytes, Unicode ordering, and strict rejection", () => {
  const vectors = JSON.parse(fs.readFileSync(path.join(__dirname, "canonical-vectors.json"), "utf8"));
  vectors.accepted.forEach((vector) => { const value = stateModule.parseJsonStrict(vector.json); assert.equal(stateModule.canonical(value), vector.canonical, vector.name); assert.equal(stateModule.hash(value), vector.sha256, vector.name); });
  vectors.rejected.forEach((vector) => assert.throws(() => stateModule.parseJsonStrict(vector.json), undefined, vector.name));
  assert.throws(() => stateModule.parseJsonStrict('{"outer":{"x":1,"x":2}}'), /duplicate JSON object key/);
});

test("canonical manifest validates self projections and typed IDs", () => {
  const manifest = fixture(); assert.equal(stateModule.validateManifest(manifest), manifest); assert.equal(stateModule.manifestDigest(manifest), manifest.manifestDigest); assert.equal(stateModule.baselineDigest(manifest.researchBaseline), manifest.baselineDigest);
  const changed = structuredClone(manifest); changed.epics[0].id = "epic-1"; changed.manifestDigest = stateModule.manifestDigest(changed); assert.throws(() => stateModule.validateManifest(changed), /type prefix/);
  const badOption = structuredClone(manifest); badOption.decisions[0].options[0].id = "DEC-002-OPT-01"; badOption.manifestDigest = stateModule.manifestDigest(badOption); assert.throws(() => stateModule.validateManifest(badOption), /does not belong/);
});

test("revision zero is synthesized only; first persisted state is revision one and retrievable", () => {
  const manifest = fixture(); const parent = temporary(); const directory = path.join(parent, "state"); const state = stateModule.loadState(directory, manifest); assert.equal(state.revision, 0); assert.equal(fs.existsSync(directory), false); assert.doesNotThrow(() => stateModule.validateState(state, manifest, { allowSynthesized: true })); assert.throws(() => stateModule.validateState(state, manifest), /revision/);
  answerRequired(state); const result = stateModule.persistState(directory, manifest, state, 0, "2026-08-11T00:00:00.000Z"); assert.equal(result.state.revision, 1); assert.equal(result.state.ready, true); assert.match(result.state.stateDigest, /^sha256:[0-9a-f]{64}$/); const snapshot = stateModule.approvedSelectionSnapshot(result.state, manifest); assert.equal(snapshot.sourceStateDigest, result.state.stateDigest); assert.equal(snapshot.epics[0].id, "EPIC-001"); assert.match(snapshot.snapshotDigest, /^sha256:/);
});

test("readiness reports direct, transitive, and dependency-decision targets", () => {
  const manifest = fixture(); const state = stateModule.initialState(manifest); answerRequired(state); assert.equal(stateModule.computeReady(state, manifest).ready, true);
  state.epics[0].enabled = false; const failures = stateModule.computeReady(state, manifest).failures; assert.ok(failures.some((item) => item.targetId === "EPIC-002" && item.relatedId === "EPIC-001")); assert.ok(failures.some((item) => item.targetId === "EPIC-003" && item.relatedId === "EPIC-001" && /via EPIC-002/.test(item.message)));
  state.epics[0].enabled = true; state.decisions[0].selectedOptionId = null; assert.ok(stateModule.computeReady(state, manifest).failures.some((item) => item.targetId === "DEC-001" && item.relatedId === "EPIC-001"));
});

test("empty custom remains saveable and unanswered while optional custom does not block", () => {
  const manifest = fixture(); manifest.decisions[0].required = false; manifest.epics[0].requiredDecisionIds = []; manifest.manifestDigest = stateModule.manifestDigest(manifest); const state = stateModule.initialState(manifest); state.decisions[0].customAnswer = "   "; state.ready = true; state.stateDigest = stateModule.stateDigest(state); assert.equal(stateModule.computeReady(state, manifest).ready, true); assert.doesNotThrow(() => stateModule.validateState(state, manifest, { allowSynthesized: true }));
  manifest.decisions[0].required = true; manifest.manifestDigest = stateModule.manifestDigest(manifest); const required = stateModule.initialState(manifest); required.decisions[0].customAnswer = " "; assert.equal(stateModule.computeReady(required, manifest).ready, false);
});

test("durable publication keeps prior state and recovers validated backup", () => {
  const manifest = fixture(); const directory = path.join(temporary(), "state"); const first = stateModule.initialState(manifest); answerRequired(first); const saved = stateModule.persistState(directory, manifest, first, 0).state; assert.equal(saved.revision, 1);
  const candidate = structuredClone(saved); candidate.overallNotes = "new"; assert.throws(() => stateModule.persistState(directory, manifest, candidate, 1, undefined, { beforePublish() { throw new Error("simulated publication failure"); } }), /simulated publication failure/); assert.equal(stateModule.loadState(directory, manifest).revision, 1);
  const file = stateModule.statePath(directory, manifest.project.slug); fs.writeFileSync(file, "corrupt", { mode: 0o600 }); assert.equal(stateModule.loadState(directory, manifest).revision, 1); assert.equal(fs.readdirSync(directory).some((name) => name.endsWith(".tmp")), false);
  const linked = path.join(temporary(), "linked"); fs.symlinkSync(directory, linked); assert.throws(() => stateModule.loadState(linked, manifest), /unsafe/);
});

test("bind/configuration and no-follow manifest loading fail closed", () => {
  ["127.0.0.1", "10.1.2.3", "172.16.0.1", "192.168.5.4"].forEach((address) => assert.equal(isSafeBind(address), true)); ["0.0.0.0", "::", "localhost", "8.8.8.8", "172.32.0.1"].forEach((address) => assert.equal(isSafeBind(address), false)); assert.throws(() => loadConfig({ REPOWORKSHOP_BIND: "0.0.0.0", REPOWORKSHOP_CAPABILITY: "a".repeat(32) })); assert.equal(loadManifest(path.join(root, "manifest.example.json")).schemaVersion, 1);
  const link = path.join(temporary(), "manifest.json"); fs.symlinkSync(path.join(root, "manifest.example.json"), link); assert.throws(() => loadManifest(link));
});

test("UI stays dependency-free, local, accessible, narrow, and manifest-driven", () => {
  const html = fs.readFileSync(path.join(root, "public/index.html"), "utf8"); const js = fs.readFileSync(path.join(root, "public/app.js"), "utf8"); const css = fs.readFileSync(path.join(root, "public/app.css"), "utf8"); const combined = `${html}\n${js}\n${css}`; assert.match(html, /ui-helpers\.js/); assert.match(html, /role="status"/); assert.match(css, /max-width: 600px/); assert.match(css, /:focus-visible/); assert.doesNotMatch(combined, /https?:\/\/|innerHTML|document\.write/i); assert.match(js, /manifest\.epics/); assert.match(js, /review\.txt/);
});
