# Judging, Scoring & AI Jury Subsystem (Phase 6)

## 1. Architecture Overview & Independence Invariant

The judging architecture comprises TWO completely independent evaluation pipelines:

```
                  LOCKED SUBMISSION SNAPSHOT
                              │
              ┌───────────────┴───────────────┐
              ↓                               ↓
         HUMAN JURY                        AI JURY
              │                               │
              ↓                               ↓
       Human Evaluation                 AI Evaluation
  (Rubric Criterion Scores)        (Criterion Evidence & Score)
              │                               │
              └───────────────┬───────────────┘
                              ↓
                      Comparison Layer
                  (MAE, RMSE, Agreement)
                              ↓
                      Calibration Data
                 (Future Model Improvement)
```

> **CRITICAL INVARIANT:** The AI Jury independently evaluates the locked submission snapshot and rubric criteria **without receiving the human score or judge feedback as input**. Human and AI evaluations are compared post-evaluation in the comparison layer.

---

## 2. Assignment Engine & COI Protection

The Assignment Engine matches eligible projects to judges based on:
1. **Target Redundancy:** Default $K=2$ judges per project.
2. **Workload Balancing:** Even distribution of evaluations across active judges while respecting `maxWorkload`.
3. **Conflict of Interest (COI) Elimination:** 
   - Judges affiliated with a team (as leader or member) are strictly excluded.
   - Explicitly configured `conflictTeamIds` on the Judge profile are honored.
4. **Track Alignment:** Judges with specified `expertiseTracks` are prioritized for relevant track submissions.
5. **Idempotent Transaction Safety:** Unique constraints on `(judgeId, projectId)` prevent duplicate assignments upon re-generation.

---

## 3. Rubric Engine & Versioning

- **Rubric Structure:** A Rubric contains criteria with `weightPercentage` and `maxScore`.
- **Validation Rules:**
  - Total criterion weights must sum to exactly $100\%$ ($\sum w_i = 100$).
  - Every criterion must have $w_i > 0$ and $\text{maxScore} > 0$.
- **Rubric Immutability:** Once any submitted human evaluation references a rubric version, that rubric is immutable. To adjust criteria, organizers must instantiate a new Rubric version (`v2`, `v3`).

---

## 4. Human Evaluation & Score Calculation

1. **Criterion-Level Scoring:** Judges score each criterion independently. Direct arbitrary score overrides are forbidden.
2. **Authoritative Server Calculation:**
   $$\text{WeightedContribution}_i = \left(\frac{\text{rawScore}_i}{\text{maxScore}_i} \times 100\right) \times \left(\frac{\text{weightPercentage}_i}{100}\right)$$
   $$\text{WeightedScore} = \sum_{i=1}^M \text{WeightedContribution}_i$$
3. **Evaluation Locking:** Once marked `SUBMITTED`, evaluations are locked in an atomic database transaction. Double submission or modification is rejected.
4. **Strict Judge Isolation:** Judge A cannot inspect Judge B's assignments, evaluations, or scores.

---

## 5. Score Normalization Engine

Normalizes judge curves to reconcile lenient versus strict graders:

1. **Z-Score Normalization:**
   $$z_{j, p} = \frac{S_{j, p} - \mu_j}{\sigma_j}$$
   $$\text{FinalScore}(p) = \text{clamp}_{[0, 100]}\left(\mu_{\text{global}} + \left(\frac{1}{|J_p|} \sum_{j \in J_p} z_{j, p}\right) \cdot \sigma_{\text{global}}\right)$$
2. **Safety Fallbacks:**
   - Zero standard deviation ($\sigma_j = 0$) or single evaluation falls back safely to global/raw scale without `NaN` or `Infinity`.
3. **Min-Max Scaling:** Scales raw project averages linearly across the range of scores.

---

## 6. AI Jury & Comparison Engine

1. **Autonomous Evidence Extraction:** Inspects repository URLs, demo endpoints, tech stacks, and architecture deliverables.
2. **Confidence & Evidence Storage:** Stores structured evidence with category, findings, snippet, source location, and confidence level ($[0.0, 1.0]$).
3. **Model & Prompt Versioning:** Records exact `AIModelVersion` and `PromptVersion` for reproducibility.
4. **Comparison Metrics:**
   - **MAE (Mean Absolute Error):** $\frac{1}{N} \sum |S_{\text{AI}} - S_{\text{Human}}|$
   - **RMSE (Root Mean Squared Error):** $\sqrt{\frac{1}{N} \sum (S_{\text{AI}} - S_{\text{Human}})^2}$
   - **Agreement Rate:** Percentage of criterion scores within tolerance ($\le 10$ points).
   - **Pearson Correlation:** Linear alignment between AI and human grading curves.
5. **Calibration Pipeline:** Splits comparison records into 80/20 train/validation partitions to evaluate bias offsets and improve future AI prompts offline without online model feedback loops.
