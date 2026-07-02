# Recruiter-Grade Candidate Ranker

A self-contained browser app that ranks candidates by recruiter-style evidence instead of literal keyword matching.

Open `index.html` in a browser. Paste a role brief, paste candidate profiles separated by `---`, then select `Rank`.

To run the engine smoke test:

```bash
node tests/engine.test.js
```

## How It Scores

The ranking engine extracts structured signals from both the role and candidates:

- role/domain alignment across product, data, engineering, sales, operations, recruiting, design, security, and finance
- seniority fit based on titles, scope language, and years
- evidence quality from measurable outcomes and ownership language
- trajectory from promotions, growing scope, startup or enterprise context
- constraints such as location, sponsorship, remote-only, or relocation mismatch
- risk flags such as unclear ownership, short tenure, or missing scale proof

Each result includes the score, reasons the candidate rises, and what a recruiter should verify in the next conversation.

## Files

- `index.html` - app shell
- `styles.css` - responsive recruiter dashboard UI
- `engine.js` - pure ranking logic
- `app.js` - sample data and rendering
