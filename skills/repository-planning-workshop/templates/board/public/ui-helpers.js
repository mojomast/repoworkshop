"use strict";

(function publish(root, factory) {
  const helpers = factory();
  if (typeof module === "object" && module.exports) module.exports = helpers;
  else root.RepoWorkshopUI = helpers;
})(globalThis, function createHelpers() {
  function answered(answer, source) {
    return answer.selectedOptionId !== null
      ? source.options.some((option) => option.id === answer.selectedOptionId)
      : answer.customAnswer !== null && answer.customAnswer.trim().length > 0;
  }
  function requiredDecisions(state, manifest) {
    const required = new Set(manifest.decisions.filter((item) => item.required).map((item) => item.id));
    state.epics.forEach((answer, index) => { if (answer.enabled && answer.disposition === "Build") manifest.epics[index].requiredDecisionIds.forEach((id) => required.add(id)); });
    let changed = true;
    while (changed) { changed = false; manifest.decisions.forEach((item) => { if (required.has(item.id)) item.dependsOnDecisionIds.forEach((id) => { if (!required.has(id)) { required.add(id); changed = true; } }); }); }
    return required;
  }
  function readinessFailures(state, manifest) {
    const failures = []; const epics = new Map(state.epics.map((item) => [item.id, item])); const decisions = new Map(state.decisions.map((item) => [item.id, item]));
    state.epics.forEach((epic, index) => {
      if (epic.enabled && epic.disposition === "Need decision") failures.push({ targetId: epic.id, message: `${epic.id}: choose a final disposition` });
      if (["Remove", "Defer"].includes(epic.disposition) && !epic.dispositionReason.trim()) failures.push({ targetId: epic.id, message: `${epic.id}: add a disposition reason` });
      if (epic.enabled && epic.disposition === "Build") {
        const inspect = (id, trail = []) => { const dependency = epics.get(id); const chain = [...trail, id]; if (!dependency.enabled || dependency.disposition !== "Build") failures.push({ targetId: epic.id, relatedId: id, message: `${epic.id}: required dependency ${id} must be enabled Build${chain.length > 1 ? ` (via ${chain.slice(0, -1).join(" -> ")})` : ""}` }); else manifest.epics.find((item) => item.id === id).dependsOnEpicIds.forEach((nested) => inspect(nested, chain)); };
        manifest.epics[index].dependsOnEpicIds.forEach((id) => inspect(id));
        manifest.epics[index].requiredDecisionIds.forEach((id) => { const source = manifest.decisions.find((item) => item.id === id); if (!answered(decisions.get(id), source)) failures.push({ targetId: id, relatedId: epic.id, message: `${epic.id}: required dependency decision ${id} is unanswered` }); });
      }
    });
    requiredDecisions(state, manifest).forEach((id) => { if (!answered(decisions.get(id), manifest.decisions.find((item) => item.id === id)) && !failures.some((item) => item.targetId === id)) failures.push({ targetId: id, message: `${id}: required decision is unanswered` }); });
    state.blockers.forEach((blocker) => { if (!blocker.resolved || !blocker.resolutionNote.trim()) failures.push({ targetId: blocker.id, message: `${blocker.id}: resolve the blocker with a note` }); });
    return failures;
  }
  function decisionVisible(answer, source, unansweredOnly) { return !unansweredOnly || !answered(answer, source); }
  function epicVisible(source, answer, filters) {
    const query = filters.query.trim().toLocaleLowerCase();
    return (!query || `${source.id} ${source.title} ${source.summary}`.toLocaleLowerCase().includes(query)) &&
      (filters.inclusion === "all" || (filters.inclusion === "included") === answer.enabled) &&
      (filters.priority === "all" || source.suggestedPriority === filters.priority);
  }
  function selectOption(answer, optionId) { return { ...answer, selectedOptionId: optionId }; }
  function selectCustom(answer) { return { ...answer, selectedOptionId: null, customAnswer: answer.customAnswer ?? "" }; }
  function typeCustom(answer, value) { return { ...answer, selectedOptionId: null, customAnswer: value }; }
  function safeBlock(value) {
    const visible = String(value).replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/gu, (character) => `\\u${character.codePointAt(0).toString(16).padStart(4, "0")}`);
    return (visible || "(none)").split(/\r?\n/u).map((line) => `    ${line.replace(/[<>`]/gu, (character) => ({ "<": "‹", ">": "›", "`": "ˋ" })[character])}`).join("\n");
  }
  function reviewExport(manifest, state) {
    const lines = ["REVIEW ONLY - NON-AUTHORITATIVE", "Saved JSON state is the sole authority.", "", "PROJECT", safeBlock(manifest.project.displayName), "", "BASELINE", safeBlock(manifest.baselineDigest), "", "REVISION", `    ${state.revision}`, "", "INCLUDED WORK"];
    state.epics.forEach((epic, index) => { if (!epic.enabled) return; lines.push("", `  ${epic.id}`, "  Title:", safeBlock(manifest.epics[index].title), "  Disposition:", safeBlock(epic.disposition), "  Reason:", safeBlock(epic.dispositionReason), "  Notes:", safeBlock(epic.notes)); });
    lines.push("", "DECISIONS"); state.decisions.forEach((decision, index) => { const source = manifest.decisions[index]; const selected = source.options.find((option) => option.id === decision.selectedOptionId); lines.push("", `  ${decision.id}`, "  Prompt:", safeBlock(source.prompt), "  Answer:", safeBlock(selected ? selected.label : decision.customAnswer?.trim() ? decision.customAnswer : "Unanswered"), "  Notes:", safeBlock(decision.notes)); });
    lines.push("", "BLOCKERS"); state.blockers.forEach((blocker, index) => lines.push("", `  ${blocker.id}`, "  Title:", safeBlock(manifest.blockers[index].title), "  Status:", `    ${blocker.resolved ? "Resolved" : "Unresolved"}`, "  Resolution note:", safeBlock(blocker.resolutionNote)));
    lines.push("", "OVERALL NOTES", safeBlock(state.overallNotes), ""); return lines.join("\n");
  }
  return { answered, readinessFailures, decisionVisible, epicVisible, selectOption, selectCustom, typeCustom, safeBlock, reviewExport };
});
