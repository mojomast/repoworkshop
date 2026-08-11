"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const state = require("../state.js");
const ui = require("../public/ui-helpers.js");
const manifest = state.parseJsonStrict(fs.readFileSync(path.join(__dirname, "..", "manifest.example.json"), "utf8"));

test("pure option/custom transitions preserve draft and unanswered filtering", () => { let answer = state.initialState(manifest).decisions[0]; answer = ui.typeCustom(answer, "draft"); answer = ui.selectOption(answer, "DEC-001-OPT-02"); assert.equal(answer.customAnswer, "draft"); assert.equal(ui.answered(answer, manifest.decisions[0]), true); answer = ui.selectCustom(answer); assert.equal(answer.customAnswer, "draft"); answer = ui.typeCustom(answer, "  "); assert.equal(ui.answered(answer, manifest.decisions[0]), false); assert.equal(ui.decisionVisible(answer, manifest.decisions[0], true), true); });
test("pure filter behavior combines query, enabled, and priority", () => { const board = state.initialState(manifest); assert.equal(ui.epicVisible(manifest.epics[0], board.epics[0], { query: "core", inclusion: "included", priority: "P0" }), true); assert.equal(ui.epicVisible(manifest.epics[0], board.epics[0], { query: "missing", inclusion: "all", priority: "all" }), false); });
test("review export is inert text under hostile multiline payloads", () => { const board = state.initialState(manifest); board.overallNotes = "<script>alert(1)</script>\n![x](javascript:alert(1))\n[click](data:text/html,x)\u202e"; board.epics[0].notes = "# heading\n<div onload=x>"; const output = ui.reviewExport(manifest, board); assert.ok(output.startsWith("REVIEW ONLY - NON-AUTHORITATIVE")); assert.doesNotMatch(output, /<script|<div|\u202e/u); for (const hostile of output.split("\n").filter((line) => /javascript:|data:text|# heading/.test(line))) assert.match(hostile, /^ {4}/); });
test("readiness presentation identifies focusable records", () => { const board = state.initialState(manifest); const failures = ui.readinessFailures(board, manifest); assert.ok(failures.every((item) => /^DEC-|^EPIC-|^BLOCK-/.test(item.targetId))); });
