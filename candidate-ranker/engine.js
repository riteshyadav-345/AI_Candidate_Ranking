(function (root) {
  const SKILL_ONTOLOGY = {
    leadership: ["lead", "managed", "mentor", "coached", "hired", "team", "stakeholder", "executive", "strategy"],
    product: ["product", "roadmap", "discovery", "user", "customer", "experiment", "metric", "launch", "market"],
    data: ["data", "analytics", "sql", "python", "model", "forecast", "dashboard", "experiment", "statistical"],
    engineering: ["engineering", "software", "api", "architecture", "cloud", "distributed", "platform", "frontend", "backend"],
    sales: ["sales", "quota", "pipeline", "enterprise", "account", "revenue", "negotiation", "crm", "deal"],
    operations: ["operations", "process", "supply", "logistics", "workflow", "service", "delivery", "quality"],
    recruiting: ["recruiting", "sourcing", "interview", "candidate", "talent", "hiring", "pipeline", "ats"],
    design: ["design", "ux", "research", "prototype", "figma", "accessibility", "interaction", "visual"],
    security: ["security", "risk", "compliance", "incident", "privacy", "audit", "threat", "governance"],
    finance: ["finance", "budget", "forecast", "pricing", "margin", "accounting", "investment", "p&l"]
  };

  const SENIORITY_TERMS = {
    junior: ["junior", "associate", "assistant", "entry", "0-2"],
    mid: ["mid", "specialist", "manager", "3+", "4+"],
    senior: ["senior", "lead", "principal", "head", "director", "staff", "5+", "7+", "10+"],
    executive: ["vp", "chief", "cxo", "executive", "founder", "general manager"]
  };

  const IMPACT_PATTERNS = [
    /(?:increased|grew|raised|improved|reduced|cut|saved|accelerated|launched|built|scaled|delivered)\s+[^.]{0,80}?(?:\d+[%x]?|\$[\d,.]+|[0-9]+m|[0-9]+k)/gi,
    /(?:\d+[%x]?|\$[\d,.]+|[0-9]+m|[0-9]+k)\s+[^.]{0,80}?(?:growth|reduction|revenue|users|customers|conversion|retention|cost|time|accuracy)/gi
  ];

  const RISK_TERMS = {
    "short tenure": ["3 months", "4 months", "short stint", "job hopped", "laid off twice"],
    "missing scale proof": ["small project", "class project", "personal project only"],
    "unclear ownership": ["assisted", "helped with", "participated", "exposed to"],
    "needs sponsorship": ["visa", "sponsorship", "h1b"],
    "location mismatch": ["remote only", "relocation not possible", "cannot relocate"]
  };

  function tokenize(text) {
    return (text || "")
      .toLowerCase()
      .replace(/[^a-z0-9+#.$% -]/g, " ")
      .split(/\s+/)
      .filter(Boolean);
  }

  function unique(items) {
    return Array.from(new Set(items));
  }

  function countMatches(tokens, terms) {
    const text = ` ${tokens.join(" ")} `;
    return terms.reduce((count, term) => {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return count + (new RegExp(`\\b${escaped}\\b`, "i").test(text) ? 1 : 0);
    }, 0);
  }

  function extractSignals(text) {
    const tokens = tokenize(text);
    const raw = (text || "").toLowerCase();
    const domains = Object.entries(SKILL_ONTOLOGY)
      .map(([name, terms]) => ({ name, hits: countMatches(tokens, terms) }))
      .filter((domain) => domain.hits > 0)
      .sort((a, b) => b.hits - a.hits);

    const seniority = Object.entries(SENIORITY_TERMS)
      .map(([level, terms]) => ({ level, hits: countMatches(tokens, terms) }))
      .sort((a, b) => b.hits - a.hits)[0] || { level: "mid", hits: 0 };

    const impactEvidence = unique(
      IMPACT_PATTERNS.flatMap((pattern) => raw.match(pattern) || [])
    ).slice(0, 5);

    const riskFlags = Object.entries(RISK_TERMS)
      .filter(([, terms]) => terms.some((term) => raw.includes(term)))
      .map(([risk]) => risk);

    const yearsMatch = raw.match(/(\d+)\+?\s*(?:years|yrs)/);
    const years = yearsMatch ? Number(yearsMatch[1]) : 0;

    return {
      tokens,
      domains,
      seniority: seniority.hits ? seniority.level : "unspecified",
      impactEvidence,
      riskFlags,
      years
    };
  }

  function overlapScore(roleDomains, candidateDomains) {
    if (!roleDomains.length || !candidateDomains.length) return 0;
    const roleTotal = roleDomains.reduce((sum, domain) => sum + domain.hits, 0);
    const candidateMap = new Map(candidateDomains.map((domain) => [domain.name, domain.hits]));
    const weighted = roleDomains.reduce((sum, domain) => {
      const candidateHits = candidateMap.get(domain.name) || 0;
      return sum + Math.min(domain.hits, candidateHits);
    }, 0);
    return Math.min(100, Math.round((weighted / Math.max(1, roleTotal)) * 100));
  }

  function seniorityScore(role, candidate) {
    const order = ["junior", "mid", "senior", "executive"];
    if (role.seniority === "unspecified") return 70;
    if (candidate.seniority === "unspecified") return candidate.years ? 62 : 45;
    const delta = Math.abs(order.indexOf(role.seniority) - order.indexOf(candidate.seniority));
    return Math.max(35, 100 - delta * 24);
  }

  function evidenceScore(candidate) {
    const impact = Math.min(70, candidate.impactEvidence.length * 18);
    const tenure = Math.min(20, candidate.years * 3);
    const ownership = countMatches(candidate.tokens, ["owned", "led", "built", "launched", "scaled", "managed"]) * 5;
    return Math.min(100, impact + tenure + ownership);
  }

  function constraintScore(roleText, candidateText) {
    const role = roleText.toLowerCase();
    const candidate = candidateText.toLowerCase();
    let score = 82;
    if (role.includes("onsite") && candidate.includes("remote only")) score -= 35;
    if (role.includes("relocat") && candidate.includes("cannot relocate")) score -= 35;
    if (role.includes("no sponsorship") && candidate.includes("sponsorship")) score -= 45;
    if (role.includes("startup") && candidate.includes("enterprise only")) score -= 16;
    return Math.max(20, score);
  }

  function trajectoryScore(candidateText, candidate) {
    const text = candidateText.toLowerCase();
    let score = 55;
    if (/promoted|promotion|expanded scope|from .* to|grew into/.test(text)) score += 24;
    if (/startup|0 to 1|built from scratch|first hire|founding/.test(text)) score += 12;
    if (/enterprise|global|multi-region|large scale/.test(text)) score += 10;
    if (candidate.riskFlags.includes("short tenure")) score -= 18;
    return Math.max(20, Math.min(100, score));
  }

  function makeExplanation(roleSignals, candidateSignals, candidateText, scores) {
    const matchingDomains = roleSignals.domains
      .filter((roleDomain) => candidateSignals.domains.some((domain) => domain.name === roleDomain.name))
      .slice(0, 3)
      .map((domain) => domain.name);

    const strengths = [];
    if (matchingDomains.length) strengths.push(`Strongest alignment is in ${matchingDomains.join(", ")}.`);
    if (candidateSignals.impactEvidence.length) strengths.push(`Shows measurable impact: ${candidateSignals.impactEvidence[0]}.`);
    if (scores.trajectory >= 75) strengths.push("Career pattern suggests growing scope and ownership.");
    if (!strengths.length) strengths.push("Some transferable context is present, but evidence is thin.");

    const concerns = [];
    if (scores.role < 55) concerns.push("Core domain alignment is weaker than the leading candidates.");
    if (scores.evidence < 45) concerns.push("Impact proof needs validation in interview.");
    candidateSignals.riskFlags.slice(0, 2).forEach((risk) => concerns.push(`Possible risk: ${risk}.`));
    if (!concerns.length) concerns.push("Main diligence should focus on depth, motivation, and compensation fit.");

    return { strengths, concerns };
  }

  function parseCandidates(input) {
    return (input || "")
      .split(/\n-{3,}\n|\n\n(?=[A-Z][^\n]{2,80}\n)/)
      .map((block) => block.trim())
      .filter(Boolean)
      .map((block, index) => {
        const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
        const name = lines[0].replace(/^name:\s*/i, "") || `Candidate ${index + 1}`;
        return { id: `candidate-${index + 1}`, name, text: lines.slice(1).join(" ") || block };
      });
  }

  function rankCandidates(roleText, candidateInput) {
    const roleSignals = extractSignals(roleText);
    const candidates = parseCandidates(candidateInput);

    return candidates
      .map((candidate) => {
        const candidateSignals = extractSignals(candidate.text);
        const scores = {
          role: overlapScore(roleSignals.domains, candidateSignals.domains),
          seniority: seniorityScore(roleSignals, candidateSignals),
          evidence: evidenceScore(candidateSignals),
          trajectory: trajectoryScore(candidate.text, candidateSignals),
          constraints: constraintScore(roleText, candidate.text)
        };
        const riskPenalty = candidateSignals.riskFlags.length * 6;
        const total = Math.max(0, Math.min(100, Math.round(
          scores.role * 0.3 +
          scores.evidence * 0.25 +
          scores.seniority * 0.16 +
          scores.trajectory * 0.16 +
          scores.constraints * 0.13 -
          riskPenalty
        )));
        return {
          ...candidate,
          total,
          scores,
          signals: candidateSignals,
          explanation: makeExplanation(roleSignals, candidateSignals, candidate.text, scores)
        };
      })
      .sort((a, b) => b.total - a.total);
  }

  root.CandidateRanker = { extractSignals, parseCandidates, rankCandidates };
})(typeof window !== "undefined" ? window : globalThis);

if (typeof module !== "undefined") {
  module.exports = globalThis.CandidateRanker;
}
