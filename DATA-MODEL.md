# Data Model Specification

## Core Domain Entities & Hierarchy

```
Hackathon (1)
 ├── Track (N)
 │    └── ProblemStatement (N)
 ├── Prize (N)
 ├── Registration (N) ── User (1)
 ├── Team (N)
 │    ├── TeamMember (N) ── User (1)
 │    ├── TeamInvite (N)
 │    └── Project (1)
 │         ├── Submission (N)
 │         ├── JudgeAssignment (N) ── Judge (1) ── User (1)
 │         │    └── Evaluation (1) ── EvaluationScore (N) ── RubricCriterion (1)
 │         ├── AIJuryRun (N)
 │         │    ├── AIEvidence (N)
 │         │    └── AIScore (N) ── RubricCriterion (1)
 │         ├── Vote (N) ── User (1)
 │         ├── Comment (N) ── User (1)
 │         └── Result (1)
 ├── Rubric (N)
 │    └── RubricCriterion (N)
 ├── ScoreNormalization (N)
 ├── AttendanceSession (N)
 │    └── AttendanceRecord (N) ── User (1)
 ├── Certificate (N) ── User (1)
 └── AuditLog (N)
```

## AI Calibration & Training Entity Flow

```
Evaluation (Human) + AIJuryRun (AI)
         │
         ↓
  AIHumanComparison
         │
         ↓
   TrainingExample (Train 80% / Validation 20%)
         │
         ↓
   DatasetVersion
         │
         ↓
   CalibrationRun (MAE, RMSE, Pearson Correlation metrics)
         │
         ↓
   AIModelVersion / PromptVersion
```
