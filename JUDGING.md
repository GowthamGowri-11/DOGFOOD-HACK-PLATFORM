# Evidence-Weighted Judging Engine v2 (EWJE v2)
## Methodology, Mathematical Model, Security Architecture & Audit Specification

---

## 1. What EWJE Does

**EWJE (Evidence-Weighted Judging Engine v2)** is an offline-capable, deterministic, and fully reproducible judging engine built for hackathon and competitive evaluation platforms.

EWJE addresses the core statistical challenge of decentralized human judging: **systematic judge bias** (harsh vs. generous scoring scales) and **vocal outlier vulnerability**. It jointly estimates:
1. True underlying project quality per criterion ($q_{p,c}$).
2. A single systematic judge scale offset per judge ($b_j$), shared across criteria.
3. Robust influence weights ($w$) via fixed-iteration Huber Iteratively Reweighted Least Squares (IRLS) to dampen isolated extreme scores without silently discarding evidence.

All score entries are recorded in an append-only cryptographic event log, guaranteeing complete public audibility and deterministic recomputation.

---

## 2. What EWJE Does NOT Claim

> **Important Scientific Disclosure:**
> EWJE does **NOT** claim to identify the "objectively best project" or achieve "mathematical fairness." Subjective human evaluation cannot be reduced to a single objective ground truth.
>
> **Defensible Claim:**
> *EWJE is a deterministic, reproducible judging methodology designed to reduce systematic judge-scale effects, preserve disagreement, expose result sensitivity, and allow the published result to be independently recomputed from an append-only audit trail.*

---

## 3. Three Fairness Goals

1. **Equal Judging Opportunity:** Every project is evaluated by exactly $k$ judges ($k=3$ by default) assigned through a deterministic, conflict-free, workload-balanced bipartite generator.
2. **Equal Treatment Across Judges:** Systematic scale shifts ($b_j$) are estimated via Ridge shrinkage and zero-centered so that a project assigned to a harsh judge is not unfairly penalized relative to one evaluated by a lenient judge.
3. **Ranking Robustness:** Fixed-iteration Huber M-estimation ensures that a single erratic or miscalibrated score cannot unilaterally distort the podium rankings, while preserving high-disagreement flags for human review.

---

## 4. Assignment Methodology

- **Target Coverage:** Default $k = 3$ judges per project.
- **Deterministic Seeded Selection:** Seeded pseudo-random shuffling ensures identical assignment graphs given the same seed.
- **Conflict Avoidance:** Zero assignments allowed where conflicts of interest are registered.
- **Workload Balancing:** Maximum spread between judge workloads is constrained to $\le \pm 1$.
- **Graph Connectivity:** The bipartite judge-project graph must form a single connected component to allow comparative scale identification.
- **Dropout Protocol:** When a judge drops out, affected projects are reassigned, creating a new versioned assignment without modifying previous historical versions.

---

## 5. Mathematical Model

For complete judge submissions, the observed score $y_{j,p,c}$ is modeled as:

$$y_{j,p,c} = q_{p,c} + b_j + \epsilon_{j,p,c}$$

Where:
- $y_{j,p,c} \in [\text{scaleMin}, \text{scaleMax}]$ is the observed score given by judge $j$ to project $p$ on criterion $c$.
- $q_{p,c}$ is the estimated latent project quality for criterion $c$.
- $b_j$ is the scalar systematic judge offset (one parameter per judge, shared across all criteria).
- $\epsilon_{j,p,c}$ is the zero-mean residual noise.

---

## 6. Huber IRLS (Iteratively Reweighted Least Squares)

Fitting uses a fixed-iteration stopping rule ($T = 30$ iterations) rather than floating-point convergence thresholds:

1. **Residual Computation:**
   $$r_{j,p,c} = y_{j,p,c} - q_{p,c} - b_j$$

2. **Robust Scale Estimation (MAD):**
   $$\text{MAD} = \text{median}(|r - \text{median}(r)|)$$
   $$\hat{\sigma} = \max(1.4826 \cdot \text{MAD}, \text{SCALE\_FLOOR})$$

3. **Huber Threshold:**
   $$\delta = k_{\text{Huber}} \cdot \hat{\sigma}, \quad \text{with } k_{\text{Huber}} = 1.345$$

4. **Influence Weights:**
   $$w_{j,p,c} = \begin{cases} 1.0 & \text{if } |r_{j,p,c}| \le \delta \\ \frac{\delta}{|r_{j,p,c}|} & \text{if } |r_{j,p,c}| > \delta \end{cases}$$

5. **Project Quality Update:**
   $$q_{p,c} = \frac{\sum_{j} w_{j,p,c} (y_{j,p,c} - b_j)}{\sum_{j} w_{j,p,c}}$$

---

## 7. Ridge Calibration

Judge offsets are updated with $L_2$ Ridge shrinkage ($\lambda = 1.0$) to stabilize estimates when judge workloads are finite:

$$b_j = \frac{\sum_{p,c} w_{j,p,c} (y_{j,p,c} - q_{p,c})}{\sum_{p,c} w_{j,p,c} + \lambda}$$

---

## 8. Correct Identification & Centering Rule

Because the joint model $y = q + b$ has a global shift ambiguity ($q + c, b - c$), EWJE applies zero-centering to judge offsets while simultaneously shifting project qualities:

$$\bar{b} = \frac{1}{|J|} \sum_{j \in J} b_j$$
$$b_j \leftarrow b_j - \bar{b}$$
$$q_{p,c} \leftarrow q_{p,c} + \bar{b}$$

> **Theorem:** For all $(j,p,c)$, the fitted value $(q_{p,c} + b_j)$ after centering is strictly identical to the value before centering. Ridge identifies the solution; centering reports judge offsets around the population mean.

---

## 9. Calculation Modes

Selected once per event (never per project):
- `CALIBRATED_ROBUST`: Enabled when the bipartite judge-project graph is connected and every judge has at least $\text{MIN\_JUDGE\_PROJECTS} = 2$ complete submissions.
- `ROBUST_ONLY`: Fallback mode (disables judge offset estimation $b_j = 0$, retains robust Huber weighting) if connectivity is broken or judge evaluation counts are sparse.

---

## 10. Diagnostic Flags

Flags do **NOT** modify project scores:
- `LOW_EVIDENCE`: Triggered if a project receives fewer than 2 complete submissions.
- `HIGH_DISAGREEMENT`: Triggered when the range of raw judge scores on any criterion exceeds $20\%$ of the rubric scale.
- `CRITERION_PATTERN`: Triggered when a judge's residual profile is strongly concentrated in a single criterion (flagged for audit rather than penalized).

---

## 11. Sensitivity Analysis (Leave-One-Judge-Out)

After primary calculation, EWJE recomputes the podium rankings omitting each judge one at a time:
- **`STABLE`**: The podium position is unchanged across all leave-one-judge-out iterations.
- **`SENSITIVE`**: At least one judge removal changes the podium recipient.

---

## 12. Simulation Methodology

The reference simulator lives in `/sim` and executes 10 realistic scenarios:
1. `balanced_assignment`
2. `disrupted_assignment`
3. `judge_dropout`
4. `erratic_judge`
5. `scale_distortion`
6. `ceiling_effects`
7. `harsh_judge`
8. `generous_judge`
9. `missing_scores`
10. `criterion_specific_behavior`

Evaluated across 6 baselines:
1. Plain Average
2. Median
3. Per-Judge Z-Score
4. Robust-Only
5. Calibration-Only
6. Full EWJE v2

---

## 13. Baseline Comparison Table

### Held-Out Seeds Evaluation (10 Independent Seeds, 25 Projects, 8 Judges)

| Baseline | Kendall Tau ($\tau$) | Top-3 Overlap | Winner Accuracy | Podium Pairwise Acc | Bias MAE |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Plain Average** | 0.7993 | 0.7767 | 0.7200 | 0.8070 | N/A |
| **Median** | 0.8049 | 0.7900 | 0.7500 | 0.8100 | N/A |
| **Per-Judge Z-Score** | 0.8269 | 0.7633 | 0.7900 | 0.8010 | N/A |
| **Robust-Only** | 0.8152 | 0.7933 | 0.7700 | 0.8200 | N/A |
| **Calibration-Only** | 0.8765 | 0.8267 | 0.8300 | 0.8470 | 1.6830 |
| **Full EWJE v2** | **0.8801** | **0.8400** | **0.8700** | **0.8570** | **1.5575** |

---

## 14. Held-Out Validation & Small Event Sizes

### Small Event Size (5 Judges, 15 Projects)

| Baseline | Kendall Tau ($\tau$) | Top-3 Overlap | Winner Accuracy | Bias MAE |
| :--- | :--- | :--- | :--- | :--- |
| **Plain Average** | 0.7627 | 0.8267 | 0.6200 | N/A |
| **Per-Judge Z-Score** | 0.8419 | 0.8800 | 0.6200 | N/A |
| **Full EWJE v2** | **0.8579** | **0.9000** | **0.7200** | **2.4486** |

---

## 15. Cases Where EWJE Loses

In accordance with scientific integrity:
1. **Severe Nonlinear Scale Compressions:** When a judge's scale is heavily compressed non-linearly (e.g., all scores between 68 and 72), linear offset models underestimate the variance transformation; rank-based or median methods can occasionally perform comparably.
2. **Disconnected Graph Components:** When judging groups do not overlap, judge bias cannot be mathematically identified, forcing fallback to `ROBUST_ONLY`.
3. **Small Sample Noise:** With fewer than 4 projects per judge, Ridge shrinkage appropriately shrinks offsets towards zero, yielding results close to Plain Average.

---

## 16. Server-Side Role Isolation

- **Judges:** Can only see assigned projects and submit their own scores. Cannot inspect other judges' scores, offsets, or pre-publication standings.
- **Participants:** Can view published rankings and their own `ParticipantResultCard` (criterion scores, weights, calculation mode). Cannot access judge pseudonyms, individual scores, or influence weights.
- **Organizers:** Can view `OrganizerAuditCard` with pseudonymized judge offsets, 7-check validation report, and trigger deterministic recomputation.

---

## 17. Append-Only Audit Trail & Hash Chain

All scores are stored as append-only events:
$$\text{hash}_n = \text{SHA-256}(\text{previous\_hash}_{n-1} + \text{canonicalJson}(\text{payload}_n))$$

Genesis hash:
`0000000000000000000000000000000000000000000000000000000000000000_GENESIS_EWJE_V2`

Tampering with any historical score breaks downstream SHA-256 verification and pinpoints the exact record ID.

---

## 18. Deterministic Recomputation

Final results are sealed into an immutable snapshot. Anyone can independently recompute and verify:
```bash
# Recompute and verify result hash for an event
make recompute EVENT=HACK_001

# Verify append-only score event hash chain
make verify-chain EVENT=HACK_001

# Verify public reference test vector
make verify-public
```

---

## 19. Known Limitations

1. Linear bias assumption ($y = q + b + \epsilon$) does not account for judge-specific criterion sensitivities.
2. Anonymity with very small judge pools ($<4$ judges) may not prevent participant deduction of judge identity based on public timing.
3. Offline execution relies on local deterministic PRNG seeds.

---

## 20. Reproduction Instructions

```bash
# 1. Run all unit and security tests
npm test

# 2. Run simulation suite across tuning & held-out seeds
make sim

# 3. Run public test vector verification
make verify-public
```
