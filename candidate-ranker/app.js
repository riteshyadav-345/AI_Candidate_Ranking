const sampleRole = `Senior Product Data Lead
Own product analytics and experimentation for a B2B SaaS platform. Need someone who can partner with product and engineering, define metrics, run SQL/Python analysis, design experiments, influence executives, and mentor analysts. Startup pace, remote-friendly, 7+ years preferred.`;

const sampleCandidates = `Aisha Morgan
Senior analytics manager with 8 years in B2B SaaS. Led product analytics for a collaboration platform, built SQL and Python experimentation workflows, mentored 4 analysts, and improved activation by 18%. Partnered with product, engineering, and executives on roadmap decisions. Promoted twice as scope expanded from dashboards to strategy.

---
Ben Carter
Backend engineering lead with 10 years building distributed APIs and cloud platforms. Managed 6 engineers, improved system latency by 35%, and worked closely with product teams. Some analytics exposure through event pipelines, but no direct experimentation ownership.

---
Priya Shah
Product manager with 6 years across marketplace and consumer apps. Launched onboarding experiments that grew conversion by 12%, strong user discovery and roadmap skills, comfortable with dashboards. Limited Python and no direct analyst management.

---
Mateo Ruiz
Data analyst with 4 years in fintech. Expert SQL, Python dashboards, and statistical analysis. Helped with an A/B testing program and reduced reporting time by 40%. Remote only, seeking senior IC role; limited leadership experience.`;

const roleInput = document.querySelector("#roleInput");
const candidatesInput = document.querySelector("#candidatesInput");
const resultsEl = document.querySelector("#results");
const summaryEl = document.querySelector("#summary");
const loadSampleButton = document.querySelector("#loadSample");
const rankButton = document.querySelector("#rankButton");

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function scoreClass(score) {
  if (score >= 80) return "excellent";
  if (score >= 62) return "good";
  if (score >= 45) return "mixed";
  return "weak";
}

function renderScore(label, value) {
  return `
    <div class="score-row">
      <span>${label}</span>
      <div class="meter" aria-hidden="true"><span style="width:${value}%"></span></div>
      <strong>${value}</strong>
    </div>
  `;
}

function renderResults() {
  const ranked = window.CandidateRanker.rankCandidates(roleInput.value, candidatesInput.value);
  resultsEl.innerHTML = "";

  if (!ranked.length) {
    summaryEl.textContent = "Add at least one candidate profile to rank.";
    resultsEl.innerHTML = `<div class="empty">No candidates yet.</div>`;
    return;
  }

  const top = ranked[0];
  summaryEl.textContent = `${ranked.length} candidates ranked. Top fit: ${top.name} at ${top.total}/100.`;

  ranked.forEach((candidate, index) => {
    const article = document.createElement("article");
    article.className = "candidate";
    const domainTags = candidate.signals.domains
      .slice(0, 5)
      .map((domain) => `<span>${escapeHtml(domain.name)}</span>`)
      .join("");

    article.innerHTML = `
      <div class="candidate-head">
        <div>
          <span class="rank">#${index + 1}</span>
          <h2>${escapeHtml(candidate.name)}</h2>
        </div>
        <div class="fit ${scoreClass(candidate.total)}">${candidate.total}</div>
      </div>
      <div class="score-grid">
        ${renderScore("Role fit", candidate.scores.role)}
        ${renderScore("Evidence", candidate.scores.evidence)}
        ${renderScore("Seniority", candidate.scores.seniority)}
        ${renderScore("Trajectory", candidate.scores.trajectory)}
        ${renderScore("Constraints", candidate.scores.constraints)}
      </div>
      <div class="insight-grid">
        <section>
          <h3>Why they rise</h3>
          <ul>${candidate.explanation.strengths.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
        </section>
        <section>
          <h3>What to verify</h3>
          <ul>${candidate.explanation.concerns.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
        </section>
      </div>
      <div class="signal-strip">
        ${domainTags}
      </div>
    `;
    resultsEl.appendChild(article);
  });
}

loadSampleButton.addEventListener("click", () => {
  roleInput.value = sampleRole;
  candidatesInput.value = sampleCandidates;
  renderResults();
});

rankButton.addEventListener("click", renderResults);

roleInput.value = sampleRole;
candidatesInput.value = sampleCandidates;
renderResults();
