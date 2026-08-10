#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const skillRoot = path.join(root, "skills", "repository-planning-workshop");
const skillFile = path.join(skillRoot, "SKILL.md");
const currentVersion = "0.1.1";
const currentLicense = "MIT";
const errors = [];

const required = [
  "README.md",
  "LICENSE",
  "CHANGELOG.md",
  "CONTRIBUTING.md",
  "SECURITY.md",
  "CODE_OF_CONDUCT.md",
  ".gitignore",
  ".github/workflows/validate.yml",
  ".github/ISSUE_TEMPLATE/bug.yml",
  ".github/ISSUE_TEMPLATE/feature.yml",
  ".github/ISSUE_TEMPLATE/config.yml",
  ".github/pull_request_template.md",
  ".claude-plugin/plugin.json",
  ".claude-plugin/marketplace.json",
  "docs/opencode.md",
  "docs/claude-code.md",
  "docs/hermes-agent.md",
  "docs/security-model.md",
  "docs/workflow.md",
  "docs/portability.md",
  "examples/example-research-finding.md",
  "examples/example-devplan.md",
  "scripts/validate.mjs",
  "skills/repository-planning-workshop/SKILL.md",
  "skills/repository-planning-workshop/references/workshop-lifecycle.md",
  "skills/repository-planning-workshop/references/research-and-synthesis.md",
  "skills/repository-planning-workshop/references/canonical-data-contract.md",
  "skills/repository-planning-workshop/references/board-spec.md",
  "skills/repository-planning-workshop/references/artifact-to-devplan.md",
  "skills/repository-planning-workshop/templates/research-agent-prompt.md",
  "skills/repository-planning-workshop/templates/devplan-template.md"
];

for (const relative of required) {
  if (!fs.existsSync(path.join(root, relative))) errors.push(`Missing required file: ${relative}`);
}

function walk(directory) {
  const output = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === ".git") continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...walk(absolute));
    else if (entry.isFile()) output.push(absolute);
  }
  return output;
}

function relative(absolute) {
  return path.relative(root, absolute).split(path.sep).join("/");
}

function readText(absolute) {
  return fs.readFileSync(absolute, "utf8");
}

const files = walk(root);
const machineSpecificPathPatterns = [
  /\/home\/(?!\$|\{|%)[^/\s"'`]+(?:\/|\b)/i,
  /\/Users\/(?!\$|\{|%)[^/\s"'`]+(?:\/|\b)/i,
  /(?:^|[\s"'`(=])(?:[A-Za-z]:[\\/])/m
];
const machinePathCases = [
  [["", "home", "developer", "workspace"].join("/"), true],
  [["", "Users", "developer", "workspace"].join("/"), true],
  [["C:", "workspace"].join("\\"), true],
  ["$HOME/workspace", false],
  ["${HOME}/workspace", false],
  ["%USERPROFILE%\\workspace", false],
  ["$env:USERPROFILE\\workspace", false]
];
for (const [candidate, expected] of machinePathCases) {
  const actual = machineSpecificPathPatterns.some((pattern) => pattern.test(candidate));
  if (actual !== expected) errors.push("Validator machine-specific path assumptions failed");
}
for (const absolute of files) {
  const text = readText(absolute);
  const lines = text.split("\n");
  lines.forEach((line, index) => {
    if (/[ \t]+$/.test(line)) errors.push(`${relative(absolute)}:${index + 1}: trailing whitespace`);
  });
  if (machineSpecificPathPatterns.some((pattern) => pattern.test(text))) {
    errors.push(`${relative(absolute)}: contains a machine-specific absolute path; use an environment-variable placeholder`);
  }
}

function parseSimpleFrontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
  if (!match) throw new Error("missing YAML frontmatter");
  const result = {};
  let section = null;
  for (const [index, line] of match[1].split("\n").entries()) {
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    const nested = line.match(/^  ([A-Za-z0-9_.-]+):\s*(.*)$/);
    if (nested && section === "metadata") {
      result.metadata[nested[1]] = unquote(nested[2]);
      continue;
    }
    const top = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!top) throw new Error(`unsupported frontmatter syntax on line ${index + 2}`);
    section = top[1];
    result[section] = section === "metadata" && top[2] === "" ? {} : unquote(top[2]);
  }
  return result;
}

function unquote(value) {
  const trimmed = value.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) return JSON.parse(trimmed);
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) return trimmed.slice(1, -1).replaceAll("''", "'");
  return trimmed;
}

try {
  const frontmatter = parseSimpleFrontmatter(readText(skillFile));
  const allowed = new Set(["name", "description", "license", "compatibility", "metadata", "allowed-tools"]);
  for (const key of Object.keys(frontmatter)) {
    if (!allowed.has(key)) errors.push(`SKILL.md: non-portable frontmatter field: ${key}`);
  }
  const folder = path.basename(skillRoot);
  if (frontmatter.name !== folder) errors.push(`SKILL.md: name must match folder (${folder})`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(frontmatter.name ?? "") || frontmatter.name.length > 64) {
    errors.push("SKILL.md: invalid Agent Skills name");
  }
  if (typeof frontmatter.description !== "string" || frontmatter.description.length < 1 || frontmatter.description.length > 1024 || !frontmatter.description.startsWith("Use ONLY when")) {
    errors.push('SKILL.md: description must be narrow, 1..1024 characters, and start with "Use ONLY when"');
  }
  if (frontmatter.license !== currentLicense) errors.push(`SKILL.md: license must be ${currentLicense}`);
  if (typeof frontmatter.compatibility !== "string" || frontmatter.compatibility.length > 500) errors.push("SKILL.md: invalid compatibility string");
  if (!frontmatter.metadata || Object.values(frontmatter.metadata).some((value) => typeof value !== "string")) {
    errors.push("SKILL.md: metadata values must all be strings");
  }
  if (frontmatter.metadata?.version !== currentVersion || frontmatter.metadata?.author !== "mojomast") {
    errors.push(`SKILL.md: expected version ${currentVersion} and author mojomast metadata`);
  }
} catch (error) {
  errors.push(`SKILL.md: ${error.message}`);
}

function markdownLinks(text) {
  const links = [];
  const expression = /!?\[[^\]]*\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g;
  for (const match of text.matchAll(expression)) links.push(match[1].replace(/^<|>$/g, ""));
  return links;
}

function localTarget(source, link) {
  if (/^(?:[a-z][a-z0-9+.-]*:|#)/i.test(link)) return null;
  // Schema notation such as `[Evidence](0..4096)` is not a Markdown file link.
  if (/^\d+\.\.\d+$/.test(link)) return null;
  const withoutFragment = link.split("#", 1)[0].split("?", 1)[0];
  if (!withoutFragment) return null;
  let decoded;
  try {
    decoded = decodeURIComponent(withoutFragment);
  } catch {
    errors.push(`${relative(source)}: malformed URL encoding in link ${link}`);
    return null;
  }
  return path.resolve(path.dirname(source), decoded);
}

for (const absolute of files.filter((file) => file.endsWith(".md"))) {
  for (const link of markdownLinks(readText(absolute))) {
    const target = localTarget(absolute, link);
    if (!target) continue;
    if (!target.startsWith(`${root}${path.sep}`) && target !== root) {
      errors.push(`${relative(absolute)}: relative link escapes repository: ${link}`);
    } else if (!fs.existsSync(target)) {
      errors.push(`${relative(absolute)}: broken relative link: ${link}`);
    }
  }
}

const linkedSkillFiles = new Set();
for (const link of markdownLinks(readText(skillFile))) {
  const target = localTarget(skillFile, link);
  if (!target) continue;
  if (!target.startsWith(`${skillRoot}${path.sep}`)) {
    errors.push(`SKILL.md: local link escapes installed skill root: ${link}`);
  } else if (!fs.existsSync(target)) {
    errors.push(`SKILL.md: referenced support file does not exist: ${link}`);
  } else {
    linkedSkillFiles.add(path.resolve(target));
  }
}

const supportFiles = files.filter((file) =>
  file.startsWith(`${skillRoot}${path.sep}references${path.sep}`) ||
  file.startsWith(`${skillRoot}${path.sep}templates${path.sep}`)
);
for (const support of supportFiles) {
  if (!linkedSkillFiles.has(path.resolve(support))) {
    errors.push(`SKILL.md: support file is not directly linked for remote installation: ${relative(support)}`);
  }
}

try {
  const plugin = JSON.parse(readText(path.join(root, ".claude-plugin", "plugin.json")));
  const marketplace = JSON.parse(readText(path.join(root, ".claude-plugin", "marketplace.json")));
  const entry = marketplace.plugins?.find((candidate) => candidate.name === "repoworkshop");
  if (plugin.name !== "repoworkshop" || marketplace.name !== "repoworkshop" || !entry) {
    errors.push("Claude plugin and marketplace names must consistently be repoworkshop");
  }
  if (plugin.version !== currentVersion || marketplace.version !== plugin.version || entry?.version !== plugin.version) {
    errors.push(`Claude plugin and marketplace versions must consistently be ${currentVersion}`);
  }
  if (entry?.source !== "./") errors.push('Claude marketplace plugin source must be "./"');
  if (plugin.license !== currentLicense || entry?.license !== plugin.license) errors.push("Claude package license mismatch");
  if (!fs.existsSync(path.join(root, "skills", "repository-planning-workshop", "SKILL.md"))) {
    errors.push("Claude plugin skill directory is missing");
  }
} catch (error) {
  errors.push(`Claude JSON validation failed: ${error.message}`);
}

const workflow = readText(path.join(root, ".github", "workflows", "validate.yml"));
if (!/permissions:\n  contents: read/.test(workflow)) errors.push("Workflow must declare contents: read permission");
if (!/actions\/checkout@[0-9a-f]{40}\b/.test(workflow)) errors.push("Workflow checkout action must be pinned to a full commit SHA");
if (!workflow.includes("node scripts/validate.mjs")) errors.push("Workflow must run the validator");

if (errors.length > 0) {
  console.error(`Validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Validation passed: ${files.length} files checked, ${supportFiles.length} skill support files linked.`);
