# Example: Intent Brief and Epic (sanitized)

This compact worked example shows the 0.4.0 planning fields filled for a realistic repository change. Values are illustrative and sanitized.

## Intent Brief (confirmed by the user before research)

```json
{
  "problem": "Operators cannot tell why nightly sync jobs fail without reading raw logs.",
  "affectedActors": ["on-call operators"],
  "successSignals": ["Failure reason visible in the job dashboard without log access."],
  "constraints": ["No new external services."],
  "nonGoals": ["Retry-policy redesign."],
  "horizon": "Next release"
}
```

## Epic with evidence chain and change map

```json
{
  "id": "EPIC-004",
  "title": "Surface sync failure reasons",
  "problem": "Failure causes are only present in raw worker logs.",
  "outcome": "The dashboard shows the classified failure reason for each failed job.",
  "acceptanceSignals": ["A failed fixture job renders its classified reason in the dashboard test."],
  "classification": "missing",
  "evidenceIds": ["EVIDENCE-014", "EVIDENCE-019"],
  "evidenceMap": {
    "observation": "Dashboard API omits failure classification (EVIDENCE-014); workers already classify errors internally (EVIDENCE-019).",
    "hypothesis": "The classification exists but is never persisted or exposed.",
    "intervention": "Persist the worker classification and expose it through the existing job-status endpoint.",
    "uncertainty": "Classification granularity for network errors is unverified."
  },
  "effort": "M",
  "horizon": "Next release",
  "externalDependency": null,
  "changeMap": [
    { "boundary": "worker result schema", "confidence": "confirmed", "reason": "EVIDENCE-019 shows the classification field in worker output." },
    { "boundary": "dashboard rendering", "confidence": "likely", "reason": "Status panel component not yet traced to the endpoint." }
  ]
}
```

## Decision with option prerequisites

```json
{
  "id": "DEC-004",
  "prompt": "Where should failure classification be persisted?",
  "recommendedOptionId": "DEC-004-OPT-01",
  "options": [
    {
      "id": "DEC-004-OPT-01",
      "label": "Extend the job-status table",
      "dependsOnEpicIds": ["EPIC-004"],
      "incompatibleOptionIds": ["DEC-004-OPT-02"]
    },
    {
      "id": "DEC-004-OPT-02",
      "label": "Emit a separate failure-events stream",
      "dependsOnEpicIds": ["EPIC-007"],
      "incompatibleOptionIds": ["DEC-004-OPT-01"]
    }
  ]
}
```

Selecting `DEC-004-OPT-02` pulls discovery epic `EPIC-007` into the effective graph; the reviewer must approve it before readiness passes, and the selection snapshot freezes that edge for the devplan.
