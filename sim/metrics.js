/**
 * EWJE v2 — Simulator Evaluation Metrics
 */

function calculateKendallTau(rankA, rankB) {
  // rankA, rankB are arrays of project IDs in ranked order
  const n = rankA.length;
  if (n < 2) return 1.0;

  const posA = new Map();
  const posB = new Map();
  rankA.forEach((id, idx) => posA.set(id, idx));
  rankB.forEach((id, idx) => posB.set(id, idx));

  let concordant = 0;
  let discordant = 0;

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const p1 = rankA[i];
      const p2 = rankA[j];

      const aDiff = posA.get(p1) - posA.get(p2);
      const bDiff = posB.get(p1) - posB.get(p2);

      if (aDiff * bDiff > 0) {
        concordant++;
      } else if (aDiff * bDiff < 0) {
        discordant++;
      }
    }
  }

  const totalPairs = (n * (n - 1)) / 2;
  return totalPairs > 0 ? (concordant - discordant) / totalPairs : 1.0;
}

function calculateTopKOverlap(rankA, rankB, k = 3) {
  const topA = new Set(rankA.slice(0, k));
  const topB = new Set(rankB.slice(0, k));
  let count = 0;
  topA.forEach((p) => {
    if (topB.has(p)) count++;
  });
  return count / k;
}

function calculateWinnerAccuracy(rankA, rankB) {
  return rankA[0] === rankB[0] ? 1.0 : 0.0;
}

function calculatePodiumPairwiseAccuracy(groundTruthRanks, estimatedRanks, topN = 5) {
  const topProjects = groundTruthRanks.slice(0, topN);
  const posEst = new Map();
  estimatedRanks.forEach((id, idx) => posEst.set(id, idx));

  let correct = 0;
  let total = 0;
  for (let i = 0; i < topProjects.length; i++) {
    for (let j = i + 1; j < topProjects.length; j++) {
      const p1 = topProjects[i];
      const p2 = topProjects[j];
      const diffEst = posEst.get(p1) - posEst.get(p2);
      if (diffEst < 0) {
        correct++;
      }
      total++;
    }
  }
  return total > 0 ? correct / total : 1.0;
}

function calculateBiasMae(trueBiases, estimatedBiases) {
  let sum = 0;
  let count = 0;
  for (const j in trueBiases) {
    if (estimatedBiases && estimatedBiases[j] !== undefined) {
      sum += Math.abs(trueBiases[j] - estimatedBiases[j]);
      count++;
    }
  }
  return count > 0 ? sum / count : 0.0;
}

module.exports = {
  calculateKendallTau,
  calculateTopKOverlap,
  calculateWinnerAccuracy,
  calculatePodiumPairwiseAccuracy,
  calculateBiasMae,
};
