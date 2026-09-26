# AI Jury & Calibration Subsystem

## 1. AI Evidence Extraction & Autonomous Evaluation

The AI Jury evaluates submissions without human score contamination.

### Workflow:
1. **Submission Analysis:** Inspects repository URLs, codebase structure, architecture diagrams, APIs, test suites, and documentation.
2. **Evidence Extraction:** Extracts verifiable factual items (e.g., `REST API Detected`, `JWT Auth Implemented`, `Zero Automated Unit Tests Found`).
3. **Rubric Evaluation:** Evaluates each `RubricCriterion` and assigns an objective score, confidence rating ($0.0 - 1.0$), and structured feedback.
4. **Reproducibility Stamp:** Every run records `AIModelVersion`, `PromptVersion`, and `RubricVersion`.

---

## 2. AI-Human Comparison & Error Analysis

When both human judges and the AI Jury have evaluated a project, the platform computes:
- **Criterion Difference:** $\Delta_i = S_{\text{AI}, i} - S_{\text{Human}, i}$
- **Absolute Error (AE):** $|\Delta_i|$
- **Platform-Wide Metrics:**
  - **Mean Absolute Error (MAE):** $\text{MAE} = \frac{1}{N} \sum_{k=1}^N |\Delta_k|$
  - **Root Mean Squared Error (RMSE):** $\text{RMSE} = \sqrt{\frac{1}{N} \sum_{k=1}^N \Delta_k^2}$
  - **Pearson Correlation ($r$):** Alignment between human ranking and AI ranking.
  - **Agreement Rate:** Percentage of evaluations within $\pm 10\%$ error threshold.

---

## 3. Calibration Pipeline (Versioned & Controlled)

1. **Dataset Versioning:** Historical comparisons are saved into `DatasetVersion` records and split into **Training (80%)** and **Validation (20%)** sets.
2. **Calibration Engine:** Optimizes temperature parameters, criterion weight adjustments, and prompt guidelines to minimize validation MAE.
3. **Verification Before Promotion:** A calibrated model version is only approved for future hackathons if $\text{MAE}_{\text{after}} < \text{MAE}_{\text{before}}$ on hold-out validation data.
