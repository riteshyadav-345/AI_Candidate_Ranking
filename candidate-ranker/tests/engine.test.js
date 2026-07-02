const assert = require("assert");
const ranker = require("../engine.js");

const role = "Senior product data lead for B2B SaaS. Needs SQL, Python, experimentation, product partnership, executive influence, mentoring, and 7+ years.";
const candidates = `Aisha Morgan
Senior analytics manager with 8 years in B2B SaaS. Led product analytics, built SQL and Python experimentation workflows, mentored 4 analysts, and improved activation by 18%.

---
Ben Carter
Backend engineering lead with 10 years building APIs and cloud platforms. Managed 6 engineers and improved latency by 35%. Some analytics exposure.

---
Mateo Ruiz
Data analyst with 4 years in fintech. Expert SQL and Python dashboards. Helped with A/B testing and reduced reporting time by 40%. Limited leadership experience.`;

const ranked = ranker.rankCandidates(role, candidates);

assert.strictEqual(ranked.length, 3);
assert.strictEqual(ranked[0].name, "Aisha Morgan");
assert(ranked[0].total > ranked[1].total);
assert(ranked[0].scores.evidence >= 45);
assert(ranked.some((candidate) => candidate.explanation.concerns.length > 0));

console.log("engine.test.js passed");
