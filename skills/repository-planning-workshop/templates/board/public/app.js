"use strict";

const view = { manifest: null, state: null, failures: [], conflict: false };
const $ = (id) => document.getElementById(id);
function element(tag, attributes = {}, text = "") {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attributes)) {
    if (key === "class") node.className = value;
    else if (key === "checked") node.checked = value;
    else node.setAttribute(key, value);
  }
  if (text) node.textContent = text;
  return node;
}
function labeledControl(label, control) { const wrapper = element("label"); wrapper.append(label, control); return wrapper; }
function updateStatus(message) { $("status").textContent = message; }
function updateReadiness() {
  const panel = $("readiness"); panel.replaceChildren();
  const computed = readinessFailures(); panel.classList.toggle("ready", computed.length === 0);
  panel.append(element("strong", {}, computed.length ? "Not ready" : "Ready for implementation planning"));
  if (computed.length) { const list = element("ul"); computed.forEach((failure) => list.append(element("li", {}, failure))); panel.append(list); }
  $("summary").textContent = `${view.state.epics.filter((epic) => epic.included).length} included · ${view.state.epics.filter((epic) => epic.included && epic.disposition === "Build").length} Build · revision ${view.state.revision}`;
}
function readinessFailures() {
  const failures = [];
  view.state.epics.forEach((epic) => {
    if (epic.included && epic.disposition === "Need decision") failures.push(`${epic.id}: choose a disposition`);
    if (["Defer", "Remove"].includes(epic.disposition) && !epic.reason.trim()) failures.push(`${epic.id}: add a disposition reason`);
  });
  view.state.decisions.forEach((decision, index) => { if (view.manifest.decisions[index].required && (!decision.answer.trim() || (decision.answer === "custom" && !decision.customAnswer.trim()))) failures.push(`${decision.id}: answer the required decision`); });
  view.state.blockers.forEach((blocker) => { if (!blocker.resolved && ["high", "critical"].includes(blocker.severity)) failures.push(`${blocker.id}: resolve the ${blocker.severity} blocker`); });
  return failures;
}
function select(values, selected, label) {
  const control = element("select", { "aria-label": label });
  values.forEach((value) => { const option = element("option", { value }, value); option.selected = value === selected; control.append(option); }); return control;
}
function renderEpics() {
  const root = $("epic-groups"); root.replaceChildren(); const query = $("search").value.toLowerCase(); const inclusion = $("inclusion-filter").value; const priority = $("priority-filter").value;
  view.manifest.groups.forEach((group) => {
    const section = element("div", { class: "group" }); const heading = element("div", { class: "group-header" }); heading.append(element("h3", {}, group.label), element("p", {}, group.description)); section.append(heading);
    let visible = 0;
    view.manifest.epics.forEach((source, index) => {
      if (source.groupId !== group.id) return; const epic = view.state.epics[index];
      const matches = (!query || `${source.title} ${source.summary} ${source.id}`.toLowerCase().includes(query)) && (inclusion === "all" || (inclusion === "included") === epic.included) && (priority === "all" || epic.priority === priority);
      if (!matches) return; visible += 1;
      const row = element("article", { class: "epic-row" }); const main = element("div", { class: "epic-main" }); const title = element("div", { class: "epic-title" }); title.append(element("strong", {}, source.title), element("small", {}, `${source.id} — ${source.summary}`));
      const controls = element("div", { class: "epic-controls" }); const included = element("input", { type: "checkbox", "aria-label": `Include ${source.title}`, checked: epic.included }); included.addEventListener("change", () => { epic.included = included.checked; updateReadiness(); applyFilters(); });
      const disposition = select(["Build", "Need decision", "Defer", "Remove"], epic.disposition, `Disposition for ${source.title}`); disposition.addEventListener("change", () => { epic.disposition = disposition.value; updateReadiness(); });
      const priorityControl = select(["P0", "P1", "P2", "P3"], epic.priority, `Priority for ${source.title}`); priorityControl.addEventListener("change", () => { epic.priority = priorityControl.value; updateReadiness(); applyFilters(); });
      controls.append(labeledControl("Include", included), labeledControl("Disposition", disposition), labeledControl("Priority", priorityControl)); main.append(title, controls); row.append(main);
      const details = element("details"); details.open = epic.reason !== "" || epic.scope !== source.summary || epic.dependencyNotes !== source.dependencySummary || epic.riskNotes !== source.riskSummary;
      const indicators = [source.dependencies.length ? `${source.dependencies.length} dependencies` : "No dependencies", source.riskSummary ? "Risk noted" : "No risk noted"];
      details.append(element("summary", {}, `Scope, dependency, and risk details · ${indicators.join(" · ")}`)); const grid = element("div", { class: "details-grid" });
      [["Disposition reason", "reason"], ["Scope", "scope"], ["Dependency notes", "dependencyNotes"], ["Risk notes", "riskNotes"]].forEach(([label, key]) => { const area = element("textarea", { rows: "3", "aria-label": `${label} for ${source.title}` }); area.value = epic[key]; area.addEventListener("input", () => { epic[key] = area.value; updateReadiness(); }); grid.append(labeledControl(label, area)); });
      details.append(grid); row.append(details); section.append(row);
    });
    if (visible) root.append(section);
  });
}
function renderDecisions() {
  const root = $("decisions"); root.replaceChildren(); const unansweredOnly = $("unanswered-only").checked;
  view.manifest.decisions.forEach((source, index) => {
    const decision = view.state.decisions[index]; if (unansweredOnly && decision.answer) return;
    const row = element("article", { class: "decision-row" }); const fieldset = element("fieldset"); fieldset.append(element("legend", {}, `${source.prompt}${source.required ? " (required)" : ""}`));
    source.options.forEach((option) => {
      const wrapper = element("label", { class: "option" }); const radio = element("input", { type: "radio", name: `decision-${source.id}`, value: option.id, checked: decision.answer === option.id }); radio.addEventListener("change", () => { decision.answer = option.id; updateReadiness(); });
      const name = element("span", {}, option.label); if (option.recommended) name.append(" ", element("span", { class: "recommendation" }, "Recommended")); wrapper.append(radio, name, element("small", {}, option.tradeoff)); fieldset.append(wrapper);
    });
    const customWrapper = element("label", { class: "option" }); const customRadio = element("input", { type: "radio", name: `decision-${source.id}`, value: "custom", checked: decision.answer === "custom" }); const custom = element("input", { type: "text", "aria-label": `Custom answer for ${source.prompt}` }); custom.value = decision.customAnswer;
    customRadio.addEventListener("change", () => { decision.answer = "custom"; updateReadiness(); }); custom.addEventListener("input", () => { decision.customAnswer = custom.value; if (custom.value) { decision.answer = "custom"; customRadio.checked = true; } updateReadiness(); }); customWrapper.append(customRadio, element("span", {}, "Custom answer"), custom); fieldset.append(customWrapper); row.append(fieldset); root.append(row);
  });
}
function renderBlockers() {
  const root = $("blockers"); root.replaceChildren();
  view.state.blockers.forEach((blocker, index) => {
    const row = element("article", { class: "blocker-row" }); const grid = element("div", { class: "blocker-grid" });
    function inputFor(label, key) { const control = element("input", { type: "text", "aria-label": `${label} for blocker ${index + 1}` }); control.value = blocker[key]; control.addEventListener("input", () => { blocker[key] = control.value; updateReadiness(); }); return labeledControl(label, control); }
    grid.append(inputFor("Owner", "owner")); const severity = select(["low", "medium", "high", "critical"], blocker.severity, `Severity for blocker ${index + 1}`); severity.addEventListener("change", () => { blocker.severity = severity.value; updateReadiness(); }); grid.append(labeledControl("Severity", severity), inputFor("Request", "request"), inputFor("Notes", "notes"));
    const resolved = element("input", { type: "checkbox", "aria-label": `Resolved blocker ${index + 1}`, checked: blocker.resolved }); resolved.addEventListener("change", () => { blocker.resolved = resolved.checked; updateReadiness(); }); grid.append(labeledControl("Resolved", resolved));
    const remove = element("button", { type: "button", "aria-label": `Remove blocker ${index + 1}` }, "Remove"); remove.addEventListener("click", () => { view.state.blockers.splice(index, 1); renderBlockers(); updateReadiness(); }); grid.append(remove); row.append(grid); root.append(row);
  });
  if (!view.state.blockers.length) root.append(element("p", {}, "No blockers recorded."));
}
function applyFilters() { renderEpics(); }
function brief() {
  const lines = [`# ${view.manifest.project.displayName} — Review-only planning brief`, "", "> Non-authoritative review export. Canonical saved state controls planning.", "", `Baseline: ${view.manifest.baseline.identity}`, `Revision: ${view.state.revision}`, "", "## Included work"];
  view.state.epics.forEach((epic, index) => { if (epic.included) lines.push(`- ${epic.priority} · ${epic.disposition} · ${view.manifest.epics[index].title}${epic.reason ? ` — ${epic.reason}` : ""}`); });
  lines.push("", "## Decisions"); view.state.decisions.forEach((decision, index) => lines.push(`- ${view.manifest.decisions[index].prompt}: ${decision.answer === "custom" ? decision.customAnswer : decision.answer || "Unanswered"}`));
  lines.push("", "## Blockers"); view.state.blockers.forEach((blocker) => lines.push(`- [${blocker.resolved ? "x" : " "}] ${blocker.severity}: ${blocker.request} (owner: ${blocker.owner || "unassigned"})`)); lines.push("", "## Overall notes", view.state.overallNotes || "None."); return `${lines.join("\n")}\n`;
}
async function reload() {
  updateStatus("Loading saved state…"); const response = await fetch("api/state", { cache: "no-store" }); if (!response.ok) throw new Error("State could not be loaded"); const payload = await response.json(); view.state = payload.state; view.failures = payload.readinessFailures; view.conflict = false; renderAll(); updateStatus(`Loaded revision ${view.state.revision}.`);
}
async function save() {
  updateStatus("Saving…"); const response = await fetch("api/state", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ expectedRevision: view.state.revision, state: view.state }) }); const payload = await response.json();
  if (response.status === 409) { view.conflict = true; updateStatus(`Conflict: server is at revision ${payload.state.revision}. Reload before saving.`); return; }
  if (!response.ok) throw new Error(payload.error || "Save failed"); view.state = payload.state; view.failures = payload.readinessFailures; renderAll(); updateStatus(`Saved revision ${view.state.revision}.`);
}
function renderAll() { renderEpics(); renderDecisions(); renderBlockers(); $("overall-notes").value = view.state.overallNotes; updateReadiness(); }
async function start() {
  try {
    const response = await fetch("api/manifest", { cache: "no-store" }); if (!response.ok) throw new Error("Manifest could not be loaded"); view.manifest = (await response.json()).manifest;
    document.title = view.manifest.project.displayName; $("project-title").textContent = view.manifest.project.displayName; $("project-subtitle").textContent = view.manifest.project.subtitle;
    await reload();
  } catch (error) { updateStatus(error.message); }
}
[$("search"), $("inclusion-filter"), $("priority-filter")].forEach((control) => control.addEventListener("input", applyFilters));
$("clear-filters").addEventListener("click", () => { $("search").value = ""; $("inclusion-filter").value = "all"; $("priority-filter").value = "all"; applyFilters(); });
$("unanswered-only").addEventListener("change", renderDecisions);
$("add-blocker").addEventListener("click", () => { if (view.state.blockers.length >= view.manifest.bounds.maxBlockers) return updateStatus("Blocker limit reached."); view.state.blockers.push({ id: `blocker-${Date.now().toString(36)}`, owner: "", severity: "medium", request: "Describe the blocking request", notes: "", resolved: false }); renderBlockers(); updateReadiness(); });
$("overall-notes").addEventListener("input", (event) => { view.state.overallNotes = event.target.value; });
$("request-ready").addEventListener("click", () => { const failures = readinessFailures(); updateReadiness(); updateStatus(failures.length ? `Readiness blocked by ${failures.length} item(s).` : "All readiness checks pass. Save to persist ready state."); });
$("save").addEventListener("click", () => save().catch((error) => updateStatus(error.message))); $("reload").addEventListener("click", () => reload().catch((error) => updateStatus(error.message)));
$("copy-brief").addEventListener("click", () => navigator.clipboard.writeText(brief()).then(() => updateStatus("Review brief copied."), () => updateStatus("Copy unavailable; use download.")));
$("download-brief").addEventListener("click", () => { const link = element("a", { download: `${view.manifest.project.artifactBasename}-review.md`, href: URL.createObjectURL(new Blob([brief()], { type: "text/markdown" })) }); link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 0); });
start();
