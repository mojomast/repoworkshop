"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const STATE_VERSION = 1;
const MAX = { short: 120, text: 4096, notes: 16000, blockers: 100 };

function fail(message) { throw new Error(message); }
function plain(value) { return value && typeof value === "object" && !Array.isArray(value); }
function exact(object, keys, label) {
  if (!plain(object)) fail(`${label} must be an object`);
  const allowed = new Set(keys);
  for (const key of Object.keys(object)) if (!allowed.has(key)) fail(`${label} has unknown key: ${key}`);
  for (const key of keys) if (!(key in object)) fail(`${label} is missing: ${key}`);
}
function optionalExact(object, required, optional, label) {
  if (!plain(object)) fail(`${label} must be an object`);
  const allowed = new Set([...required, ...optional]);
  for (const key of Object.keys(object)) if (!allowed.has(key)) fail(`${label} has unknown key: ${key}`);
  for (const key of required) if (!(key in object)) fail(`${label} is missing: ${key}`);
}
function string(value, label, max = MAX.text, empty = false) {
  if (typeof value !== "string" || value.length > max || (!empty && !value.trim())) fail(`${label} must be a ${empty ? "bounded" : "non-empty bounded"} string`);
  return value;
}
function id(value, label) {
  string(value, label, 64);
  if (!/^[a-z][a-z0-9-]*$/.test(value)) fail(`${label} must be a stable lowercase ID`);
  return value;
}
function unique(items, label) {
  const seen = new Set();
  for (const item of items) { if (seen.has(item)) fail(`${label} must be unique`); seen.add(item); }
}

// Canonical serialization recursively sorts object keys; array order is significant.
function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (plain(value)) return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}
function manifestDigest(manifest) {
  return crypto.createHash("sha256").update(canonical(manifest)).digest("hex");
}

function validateManifest(manifest) {
  exact(manifest, ["schemaVersion", "project", "baseline", "bounds", "groups", "epics", "decisions", "initialBlockers"], "manifest");
  if (manifest.schemaVersion !== 1) fail("manifest schemaVersion must be 1");
  exact(manifest.project, ["displayName", "subtitle", "artifactBasename", "stateNamespace"], "project");
  string(manifest.project.displayName, "project.displayName", MAX.short);
  string(manifest.project.subtitle, "project.subtitle", 240);
  for (const key of ["artifactBasename", "stateNamespace"]) {
    string(manifest.project[key], `project.${key}`, 80);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(manifest.project[key])) fail(`project.${key} is unsafe`);
  }
  exact(manifest.baseline, ["identity", "digest"], "baseline");
  string(manifest.baseline.identity, "baseline.identity", MAX.short);
  if (!/^[a-f0-9]{64}$/.test(manifest.baseline.digest)) fail("baseline.digest must be lowercase SHA-256");
  exact(manifest.bounds, ["maxBodyBytes", "maxBlockers", "maxTextLength", "maxNotesLength"], "bounds");
  for (const [key, ceiling] of [["maxBodyBytes", 1048576], ["maxBlockers", MAX.blockers], ["maxTextLength", MAX.text], ["maxNotesLength", MAX.notes]]) {
    if (!Number.isInteger(manifest.bounds[key]) || manifest.bounds[key] < 1 || manifest.bounds[key] > ceiling) fail(`bounds.${key} is out of range`);
  }
  if (!Array.isArray(manifest.groups) || !manifest.groups.length) fail("groups must be a non-empty array");
  const groupIds = manifest.groups.map((group, index) => {
    exact(group, ["id", "label", "description"], `groups[${index}]`); id(group.id, "group.id"); string(group.label, "group.label", MAX.short); string(group.description, "group.description", 240); return group.id;
  });
  unique(groupIds, "group IDs");
  if (!Array.isArray(manifest.epics) || !manifest.epics.length) fail("epics must be a non-empty array");
  const epicIds = manifest.epics.map((epic, index) => {
    exact(epic, ["id", "groupId", "title", "summary", "suggestedPriority", "dependencies", "dependencySummary", "riskSummary"], `epics[${index}]`);
    id(epic.id, "epic.id"); id(epic.groupId, "epic.groupId");
    if (!groupIds.includes(epic.groupId)) fail(`epic ${epic.id} references unknown group`);
    string(epic.title, "epic.title", MAX.short); string(epic.summary, "epic.summary", manifest.bounds.maxTextLength);
    if (!["P0", "P1", "P2", "P3"].includes(epic.suggestedPriority)) fail(`epic ${epic.id} has invalid priority`);
    if (!Array.isArray(epic.dependencies)) fail(`epic ${epic.id} dependencies must be an array`);
    epic.dependencies.forEach((dependency) => id(dependency, "dependency")); unique(epic.dependencies, `dependencies for ${epic.id}`);
    string(epic.dependencySummary, "epic.dependencySummary", manifest.bounds.maxTextLength, true);
    string(epic.riskSummary, "epic.riskSummary", manifest.bounds.maxTextLength, true);
    return epic.id;
  });
  unique(epicIds, "epic IDs");
  for (const epic of manifest.epics) for (const dependency of epic.dependencies) if (!epicIds.includes(dependency) || dependency === epic.id) fail(`epic ${epic.id} has invalid dependency ${dependency}`);
  const visiting = new Set(), visited = new Set();
  function visit(epicId) {
    if (visiting.has(epicId)) fail("epic dependency cycle detected");
    if (visited.has(epicId)) return;
    visiting.add(epicId); manifest.epics.find((epic) => epic.id === epicId).dependencies.forEach(visit); visiting.delete(epicId); visited.add(epicId);
  }
  epicIds.forEach(visit);
  // Group order is authority: each group's epics form one contiguous block in that order.
  const expectedGroups = groupIds.filter((groupId) => manifest.epics.some((epic) => epic.groupId === groupId));
  const observedGroups = manifest.epics.map((epic) => epic.groupId).filter((value, index, all) => index === 0 || value !== all[index - 1]);
  if (canonical(expectedGroups) !== canonical(observedGroups)) fail("epics do not follow exact group order");
  if (!Array.isArray(manifest.decisions)) fail("decisions must be an array");
  const decisionIds = manifest.decisions.map((decision, index) => {
    exact(decision, ["id", "prompt", "required", "options"], `decisions[${index}]`); id(decision.id, "decision.id"); string(decision.prompt, "decision.prompt", 240);
    if (typeof decision.required !== "boolean") fail(`decision ${decision.id} required must be boolean`);
    if (!Array.isArray(decision.options) || decision.options.length < 3) fail(`decision ${decision.id} needs at least three options`);
    const optionIds = decision.options.map((option, optionIndex) => {
      exact(option, ["id", "label", "tradeoff", "recommended"], `decision option ${optionIndex}`); id(option.id, "option.id"); string(option.label, "option.label", MAX.short); string(option.tradeoff, "option.tradeoff", 500); if (typeof option.recommended !== "boolean") fail("option.recommended must be boolean"); return option.id;
    });
    unique(optionIds, `option IDs for ${decision.id}`);
    if (decision.options.filter((option) => option.recommended).length !== 1) fail(`decision ${decision.id} must have exactly one recommendation`);
    return decision.id;
  });
  unique(decisionIds, "decision IDs");
  if (!Array.isArray(manifest.initialBlockers) || manifest.initialBlockers.length > manifest.bounds.maxBlockers) fail("initialBlockers is invalid");
  manifest.initialBlockers.forEach((blocker, index) => validateBlocker(blocker, manifest, `initialBlockers[${index}]`));
  unique(manifest.initialBlockers.map((blocker) => blocker.id), "blocker IDs");
  return manifest;
}

function validateBlocker(blocker, manifest, label = "blocker") {
  exact(blocker, ["id", "owner", "severity", "request", "notes", "resolved"], label);
  id(blocker.id, `${label}.id`); string(blocker.owner, `${label}.owner`, MAX.short, true);
  if (!["low", "medium", "high", "critical"].includes(blocker.severity)) fail(`${label}.severity is invalid`);
  string(blocker.request, `${label}.request`, manifest.bounds.maxTextLength); string(blocker.notes, `${label}.notes`, manifest.bounds.maxTextLength, true);
  if (typeof blocker.resolved !== "boolean") fail(`${label}.resolved must be boolean`);
}

function computeReady(state, manifest) {
  const failures = [];
  for (const epic of state.epics) {
    if (epic.included && epic.disposition === "Need decision") failures.push(`${epic.id}: disposition needs a decision`);
    if (["Defer", "Remove"].includes(epic.disposition) && !epic.reason.trim()) failures.push(`${epic.id}: disposition reason is required`);
  }
  for (const decision of state.decisions) if (manifest.decisions.find((item) => item.id === decision.id).required && (!decision.answer.trim() || (decision.answer === "custom" && !decision.customAnswer.trim()))) failures.push(`${decision.id}: required decision is unanswered`);
  for (const blocker of state.blockers) if (!blocker.resolved && ["high", "critical"].includes(blocker.severity)) failures.push(`${blocker.id}: ${blocker.severity} blocker is unresolved`);
  return { ready: failures.length === 0, failures };
}

function initialState(manifest, now = new Date().toISOString()) {
  validateManifest(manifest);
  const state = {
    version: STATE_VERSION, manifestDigest: manifestDigest(manifest), revision: 0, updatedAt: now, ready: false,
    epics: manifest.epics.map((epic) => ({ id: epic.id, included: true, disposition: "Build", priority: epic.suggestedPriority, reason: "", scope: epic.summary, dependencyNotes: epic.dependencySummary, riskNotes: epic.riskSummary })),
    decisions: manifest.decisions.map((decision) => ({ id: decision.id, answer: "", customAnswer: "" })),
    blockers: structuredClone(manifest.initialBlockers), overallNotes: ""
  };
  state.ready = computeReady(state, manifest).ready;
  return state;
}

function validateState(state, manifest) {
  exact(state, ["version", "manifestDigest", "revision", "updatedAt", "ready", "epics", "decisions", "blockers", "overallNotes"], "state");
  if (state.version !== STATE_VERSION || state.manifestDigest !== manifestDigest(manifest)) fail("state version or manifest digest mismatch");
  if (!Number.isInteger(state.revision) || state.revision < 0) fail("state.revision is invalid");
  if (typeof state.updatedAt !== "string" || !Number.isFinite(Date.parse(state.updatedAt))) fail("state.updatedAt is invalid");
  if (typeof state.ready !== "boolean") fail("state.ready is invalid");
  if (!Array.isArray(state.epics) || state.epics.length !== manifest.epics.length) fail("state epic records must exactly match manifest");
  state.epics.forEach((epic, index) => {
    exact(epic, ["id", "included", "disposition", "priority", "reason", "scope", "dependencyNotes", "riskNotes"], `state.epics[${index}]`);
    if (epic.id !== manifest.epics[index].id) fail("state epic IDs/order must exactly match manifest");
    if (typeof epic.included !== "boolean" || !["Build", "Need decision", "Defer", "Remove"].includes(epic.disposition) || !["P0", "P1", "P2", "P3"].includes(epic.priority)) fail(`state epic ${epic.id} has invalid controls`);
    for (const key of ["reason", "scope", "dependencyNotes", "riskNotes"]) string(epic[key], `epic.${key}`, manifest.bounds.maxTextLength, true);
  });
  if (!Array.isArray(state.decisions) || state.decisions.length !== manifest.decisions.length) fail("state decision records must exactly match manifest");
  state.decisions.forEach((decision, index) => {
    exact(decision, ["id", "answer", "customAnswer"], `state.decisions[${index}]`);
    const source = manifest.decisions[index]; if (decision.id !== source.id) fail("state decision IDs/order must exactly match manifest");
    string(decision.answer, "decision.answer", manifest.bounds.maxTextLength, true); string(decision.customAnswer, "decision.customAnswer", manifest.bounds.maxTextLength, true);
    if (decision.answer && decision.answer !== "custom" && !source.options.some((option) => option.id === decision.answer)) fail(`decision ${decision.id} answer is unknown`);
    if (decision.answer === "custom" && !decision.customAnswer.trim()) fail(`decision ${decision.id} custom answer is empty`);
  });
  if (!Array.isArray(state.blockers) || state.blockers.length > manifest.bounds.maxBlockers) fail("state.blockers is invalid");
  state.blockers.forEach((blocker, index) => validateBlocker(blocker, manifest, `state.blockers[${index}]`)); unique(state.blockers.map((blocker) => blocker.id), "state blocker IDs");
  string(state.overallNotes, "overallNotes", manifest.bounds.maxNotesLength, true);
  const computed = computeReady(state, manifest).ready; if (state.ready !== computed) fail("state.ready does not match computed readiness");
  return state;
}

function statePath(stateDir, namespace) { return path.join(stateDir, `${namespace}.state.json`); }
function assertSafeDirectory(stateDir) {
  const stat = fs.lstatSync(stateDir); if (!stat.isDirectory() || stat.isSymbolicLink()) fail("state directory is not a safe directory");
  if (fs.realpathSync(stateDir) !== path.resolve(stateDir)) fail("state directory contains a symlink or ambiguous path");
  if (process.platform !== "win32" && (stat.mode & 0o077) !== 0) fail("state directory must be owner-only");
}
function assertSafeParent(stateDir) {
  const parent = path.dirname(stateDir); const stat = fs.lstatSync(parent);
  if (!stat.isDirectory() || stat.isSymbolicLink() || fs.realpathSync(parent) !== path.resolve(parent)) fail("state directory parent is unsafe");
}
function loadState(stateDir, manifest) {
  try { assertSafeDirectory(stateDir); } catch (error) { if (error.code !== "ENOENT") throw error; assertSafeParent(stateDir); return initialState(manifest); }
  const file = statePath(stateDir, manifest.project.stateNamespace);
  let stat; try { stat = fs.lstatSync(file); } catch (error) { if (error.code === "ENOENT") return initialState(manifest); throw error; }
  if (!stat.isFile() || stat.isSymbolicLink()) fail("state file is not a regular file");
  return validateState(JSON.parse(fs.readFileSync(file, "utf8")), manifest);
}
function persistState(stateDir, manifest, candidate, expectedRevision, now = new Date().toISOString()) {
  let missing = false; try { assertSafeDirectory(stateDir); } catch (error) { if (error.code !== "ENOENT") throw error; assertSafeParent(stateDir); missing = true; }
  const current = missing ? initialState(manifest) : loadState(stateDir, manifest);
  if (!Number.isInteger(expectedRevision) || expectedRevision !== current.revision) return { conflict: true, state: current };
  if (missing) fs.mkdirSync(stateDir, { mode: 0o700 });
  assertSafeDirectory(stateDir);
  const next = structuredClone(candidate); next.version = STATE_VERSION; next.manifestDigest = manifestDigest(manifest); next.revision = current.revision + 1; next.updatedAt = now; next.ready = computeReady(next, manifest).ready;
  validateState(next, manifest);
  const file = statePath(stateDir, manifest.project.stateNamespace); const temporary = path.join(stateDir, `.${manifest.project.stateNamespace}.${process.pid}.${crypto.randomBytes(6).toString("hex")}.tmp`);
  try {
    fs.writeFileSync(temporary, `${JSON.stringify(next, null, 2)}\n`, { mode: 0o600, flag: "wx" }); fs.chmodSync(temporary, 0o600); fs.renameSync(temporary, file);
  } catch (error) {
    error.code = "REPOWORKSHOP_PERSISTENCE"; throw error;
  } finally { try { fs.unlinkSync(temporary); } catch {} }
  return { conflict: false, state: next };
}

module.exports = { STATE_VERSION, canonical, manifestDigest, validateManifest, computeReady, initialState, validateState, loadState, persistState, statePath };
