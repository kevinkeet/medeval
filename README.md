# MedModel — meds.kevinkeet.com

Individualized medication benefit, harm & burden. Deployed via GitHub Pages
(this branch, root) to **https://meds.kevinkeet.com**.

**What it does:** starts from RCT evidence and adjusts the expected absolute
benefit for the patient in front of you — baseline risk → competing mortality →
time-to-benefit → adherence — then shows harms (patient-scaled, starting
immediately) and treatment burden beside it. Every adjustment renders as a
step in a waterfall so the reasoning is inspectable. Two views: a
single-medication deep dive and a regimen review that ranks every therapy
applicable to the patient by severity-weighted net benefit.

This is the merger of two generations of this site:

- the original meds.kevinkeet.com calculator's curated **60-medication
  database** (per-indication NNT/RRR from landmark trials, harms, burden
  tiers, costs, contraindications, QALY severity weights) — preserved intact
  in `js/data/medeval-database.js` and still browsable at
  [`legacy/`](legacy/index.html);
- a **competing-hazards engine** with hand-verified deep entries for the major
  preventive classes (trial demographics, CIs, time-to-benefit literature,
  harm scaling), developed in `acting-intern-shared/medmodel/`.

No build system, no backend — plain HTML/JS/CSS with browser globals and
cache-busted script tags (`?v=YYYYMMDD`; bump in both HTML files whenever any
JS/CSS changes).

## Files

| File | Role |
|---|---|
| `index.html` | App shell (both views) |
| `methods.html` | Methods & evidence: formulas, data lineage, ~65 citations |
| `js/engine.js` | Monthly-cycle competing-hazards model (`window.BenefitModel`, node-requirable) |
| `js/data/medeval-database.js` | The 60-medication database (canonical copy; `window.MedevalDB`) |
| `js/data/medications.js` | Deep-verified evidence entries, 12 meds (`window.MedLibrary`) |
| `js/services/lift.js` | Database→engine conversion: lift math, class-default TTB table, deep-overlay map, severity weights, contraindication matching (`window.Lift`) |
| `js/data/riskmodels.js` | PCE (validated against guideline worked examples), CHA₂DS₂-VASc (Friberg), HAS-BLED (Pisters), CKD-EPI 2021 (`window.RiskModels`) |
| `js/data/lifetables.js` | Health levels, condition mortality HRs, Walter–Covinsky reference (`window.LifeTables`) |
| `js/app.js` | UI wiring: patient state, deep/lifted/symptomatic resolution, both views |
| `test/` | `node test/engine.test.js && node test/lift.test.js` before every commit |
| `legacy/` | The original calculator, unchanged (its own copies of the old engine and database) |

## Editing the database

`js/data/medeval-database.js` is the canonical medication database (the copy
in `legacy/` is frozen). New entries appear in the catalog automatically via
the lift service; add a `DEEP_MAP` row in `js/services/lift.js` when a
hand-verified deep entry should take over a drug-indication pair. Symptomatic
and replacement medications are deliberately not run through the prevention
model — they get a felt-benefit card.

A sibling copy of this app lives in `acting-intern-shared/medmodel/` for the
teaching simulator; when editing either, port meaningful changes across (the
files are structured identically).

## Dev

```
npx http-server -p 8080 -c-1   # or python3 -m http.server
node test/engine.test.js && node test/lift.test.js
```

Educational tool — not medical advice.
