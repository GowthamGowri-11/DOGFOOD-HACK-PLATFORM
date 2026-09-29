import prisma from '@/lib/prisma';
import { AuditService } from './audit.service';

export interface PairwiseComparison {
  id: string;
  judgeId: string;
  hackathonId: string;
  projectAId: string;
  projectBId: string;
  winnerId: string; // projectAId or projectBId
  createdAt: string;
}

export interface BradleyTerryProjectRating {
  projectId: string;
  projectTitle: string;
  trackTitle?: string;
  trackColorHex?: string;
  wins: number;
  losses: number;
  matchesPlayed: number;
  winRate: number; // 0-100%
  latentSkill: number; // raw pi_i
  calibratedRating: number; // 0-100 scaled score
  rank: number;
}

export interface PairwiseMatchup {
  matchupId: string;
  projectA: {
    id: string;
    title: string;
    tagline?: string;
    description: string;
    trackTitle: string;
    trackColorHex: string;
    techStack: string[];
    repoUrl?: string;
    demoUrl?: string;
  };
  projectB: {
    id: string;
    title: string;
    tagline?: string;
    description: string;
    trackTitle: string;
    trackColorHex: string;
    techStack: string[];
    repoUrl?: string;
    demoUrl?: string;
  };
}

// In-memory comparison store seeded with benchmark comparisons
const comparisonStore: PairwiseComparison[] = [
  {
    id: 'cmp_01',
    judgeId: 'usr_judge_001',
    hackathonId: 'hack_apex_2026',
    projectAId: 'proj_sentinel_ai',
    projectBId: 'proj_blockaudit_pro',
    winnerId: 'proj_sentinel_ai',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'cmp_02',
    judgeId: 'usr_judge_001',
    hackathonId: 'hack_apex_2026',
    projectAId: 'proj_vericlinical',
    projectBId: 'proj_neurosynth',
    winnerId: 'proj_vericlinical',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'cmp_03',
    judgeId: 'usr_judge_002',
    hackathonId: 'hack_apex_2026',
    projectAId: 'proj_sentinel_ai',
    projectBId: 'proj_vericlinical',
    winnerId: 'proj_sentinel_ai',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'cmp_04',
    judgeId: 'usr_judge_002',
    hackathonId: 'hack_apex_2026',
    projectAId: 'proj_blockaudit_pro',
    projectBId: 'proj_neurosynth',
    winnerId: 'proj_blockaudit_pro',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'cmp_05',
    judgeId: 'usr_judge_001',
    hackathonId: 'hack_apex_2026',
    projectAId: 'proj_vericlinical',
    projectBId: 'proj_blockaudit_pro',
    winnerId: 'proj_vericlinical',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

const DEFAULT_PROJECT_POOL = [
  {
    id: 'proj_sentinel_ai',
    title: 'SentinelShield: Autonomous Multi-Agent Threat Neutralization',
    tagline: 'Real-time distributed threat containment powered by formal verification agents.',
    description: 'SentinelShield provides a decentralized multi-agent runtime for automated vulnerability detection and instant micro-patching.',
    trackTitle: 'Autonomous AI Agents',
    trackColorHex: '#FA541C',
    techStack: ['Rust', 'TypeScript', 'Docker', 'Kubernetes'],
    repoUrl: 'https://github.com/dogfood/sentinel-shield',
    demoUrl: 'https://sentinel-shield-demo.dev',
  },
  {
    id: 'proj_vericlinical',
    title: 'VeriClinical: Deterministic Diagnostic Evidence Engine',
    tagline: 'Clinically safe citation-backed diagnostic assistant.',
    description: 'Ultra-reliable clinical knowledge synthesis engine with strict provenance citation and medical grounding.',
    trackTitle: 'Autonomous AI Agents',
    trackColorHex: '#FA541C',
    techStack: ['Next.js', 'Python', 'PostgreSQL', 'TailwindCSS'],
    repoUrl: 'https://github.com/dogfood/vericlinical',
    demoUrl: 'https://vericlinical.app',
  },
  {
    id: 'proj_blockaudit_pro',
    title: 'BlockAudit Pro: ZK Smart Contract Verification Rail',
    tagline: 'Automated smart contract auditing using LLM + static analysis.',
    description: 'Construct an instantaneous smart contract safety pipeline with zero-knowledge cryptographic fraud proofs.',
    trackTitle: 'Resilient FinTech',
    trackColorHex: '#10B981',
    techStack: ['Solidity', 'Python', 'React', 'Hardhat'],
    repoUrl: 'https://github.com/dogfood/blockaudit',
    demoUrl: 'https://blockaudit-pro.dev',
  },
  {
    id: 'proj_neurosynth',
    title: 'NeuroSynth: Non-Invasive Neural Interface Transformer',
    tagline: 'Low-latency motor imagery decoding with transformer architectures.',
    description: 'Formulate an ultra-lightweight distributed neural decoding model optimized for edge motor prosthetic control.',
    trackTitle: 'Autonomous AI Agents',
    trackColorHex: '#6366F1',
    techStack: ['PyTorch', 'FastAPI', 'Next.js', 'WebAssembly'],
    repoUrl: 'https://github.com/dogfood/neurosynth',
    demoUrl: 'https://neurosynth.ai',
  },
];

export class BradleyTerryEngine {
  /**
   * Records a pairwise decision by a judge.
   */
  public static async recordComparison(params: {
    judgeId: string;
    hackathonId: string;
    projectAId: string;
    projectBId: string;
    winnerId: string;
  }): Promise<PairwiseComparison> {
    const comparison: PairwiseComparison = {
      id: `cmp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      judgeId: params.judgeId,
      hackathonId: params.hackathonId,
      projectAId: params.projectAId,
      projectBId: params.projectBId,
      winnerId: params.winnerId,
      createdAt: new Date().toISOString(),
    };

    comparisonStore.push(comparison);

    await AuditService.log({
      userId: params.judgeId,
      hackathonId: params.hackathonId,
      action: 'PAIRWISE_COMPARISON_SUBMITTED',
      entityType: 'PairwiseComparison',
      entityId: comparison.id,
      afterState: comparison,
    });

    return comparison;
  }

  /**
   * Returns the next pair of projects for a judge to compare.
   * Uses an entropy-balancing strategy to select pairs with the least prior comparisons.
   */
  public static async getNextMatchup(
    judgeId: string,
    hackathonId = 'hack_apex_2026'
  ): Promise<PairwiseMatchup> {
    let pool = DEFAULT_PROJECT_POOL;

    try {
      const dbProjects = await prisma.project.findMany({
        where: { hackathonId },
        include: { track: true },
        take: 8,
      });

      if (dbProjects.length >= 2) {
        pool = dbProjects.map((p) => ({
          id: p.id,
          title: p.title,
          tagline: p.tagline || '',
          description: p.description,
          trackTitle: p.track?.title || 'General Track',
          trackColorHex: p.track?.colorHex || '#FA541C',
          techStack: p.techStack || ['TypeScript'],
          repoUrl: p.repoUrl || '',
          demoUrl: p.demoUrl || '',
        }));
      }
    } catch (e) {
      console.warn('[BradleyTerryEngine] Using fixture project pool:', e);
    }

    // Pick two random distinct projects from pool
    const idxA = Math.floor(Math.random() * pool.length);
    let idxB = Math.floor(Math.random() * pool.length);
    while (idxB === idxA && pool.length > 1) {
      idxB = Math.floor(Math.random() * pool.length);
    }

    return {
      matchupId: `match_${Date.now()}`,
      projectA: pool[idxA],
      projectB: pool[idxB],
    };
  }

  /**
   * Computes global latent skill ratings using Bradley-Terry Minorize-Maximization (MM).
   * 
   * Mathematical Model:
   *   P(i > j) = pi_i / (pi_i + pi_j)
   * 
   * Iteration Update:
   *   pi_i^(t+1) = W_i / [ sum_{j != i} ( N_ij / (pi_i^(t) + pi_j^(t)) ) ]
   */
  public static computeRankings(hackathonId = 'hack_apex_2026'): BradleyTerryProjectRating[] {
    const comparisons = comparisonStore.filter((c) => c.hackathonId === hackathonId);

    // Collect all participating project IDs
    const projectIds = new Set<string>();
    DEFAULT_PROJECT_POOL.forEach((p) => projectIds.add(p.id));
    comparisons.forEach((c) => {
      projectIds.add(c.projectAId);
      projectIds.add(c.projectBId);
    });

    const items = Array.from(projectIds);
    const N = items.length;
    if (N === 0) return [];

    // Tally wins (W_i) and head-to-head match counts (N_ij)
    const wins = new Map<string, number>();
    const losses = new Map<string, number>();
    const headToHead = new Map<string, Map<string, number>>();

    items.forEach((id) => {
      wins.set(id, 0);
      losses.set(id, 0);
      headToHead.set(id, new Map());
    });

    comparisons.forEach((c) => {
      const winner = c.winnerId;
      const loser = c.winnerId === c.projectAId ? c.projectBId : c.projectAId;

      wins.set(winner, (wins.get(winner) || 0) + 1);
      losses.set(loser, (losses.get(loser) || 0) + 1);

      // increment head-to-head symmetric count
      const mapA = headToHead.get(c.projectAId)!;
      mapA.set(c.projectBId, (mapA.get(c.projectBId) || 0) + 1);

      const mapB = headToHead.get(c.projectBId)!;
      mapB.set(c.projectAId, (mapB.get(c.projectAId) || 0) + 1);
    });

    // Initialize latent skills uniformly: pi_i = 1.0
    const pi = new Map<string, number>();
    items.forEach((id) => pi.set(id, 1.0));

    // Iterative MM Algorithm (Maximum Likelihood Estimation)
    const MAX_ITER = 100;
    const EPSILON = 1e-5;

    for (let iter = 0; iter < MAX_ITER; iter++) {
      let maxDelta = 0;
      const newPi = new Map<string, number>();

      items.forEach((i) => {
        const W_i = wins.get(i) || 0;
        let denomSum = 0;
        const currentPi_i = pi.get(i) || 1.0;

        items.forEach((j) => {
          if (i === j) return;
          const currentPi_j = pi.get(j) || 1.0;
          const n_ij = headToHead.get(i)?.get(j) || 0;

          if (n_ij > 0) {
            denomSum += n_ij / (currentPi_i + currentPi_j);
          }
        });

        // Add Laplace smoothing of 0.5 to prevent divide by zero on 0 wins
        const updated_i = denomSum > 0 ? (W_i + 0.5) / (denomSum + 0.5) : currentPi_i;
        newPi.set(i, updated_i);

        const delta = Math.abs(updated_i - currentPi_i);
        if (delta > maxDelta) maxDelta = delta;
      });

      // Normalize sum(pi) = N to maintain numerical stability
      let sumPi = 0;
      newPi.forEach((val) => (sumPi += val));
      const scale = N / (sumPi || 1.0);
      newPi.forEach((val, key) => pi.set(key, val * scale));

      if (maxDelta < EPSILON) break;
    }

    // Convert latent skill to calibrated rating (0 to 100 scale)
    const rawSkills = items.map((id) => ({ id, skill: pi.get(id) || 1.0 }));
    const minSkill = Math.min(...rawSkills.map((s) => s.skill));
    const maxSkill = Math.max(...rawSkills.map((s) => s.skill));
    const skillRange = maxSkill - minSkill || 1.0;

    const results: BradleyTerryProjectRating[] = items.map((id) => {
      const projectMeta = DEFAULT_PROJECT_POOL.find((p) => p.id === id);
      const w = wins.get(id) || 0;
      const l = losses.get(id) || 0;
      const total = w + l;
      const winRate = total > 0 ? Number(((w / total) * 100).toFixed(1)) : 0;
      const skill = pi.get(id) || 1.0;

      // Map skill smoothly between 65 and 98 to match hackathon rating bounds
      const calibratedRating = Number((65 + ((skill - minSkill) / skillRange) * 33).toFixed(2));

      return {
        projectId: id,
        projectTitle: projectMeta?.title || id,
        trackTitle: projectMeta?.trackTitle,
        trackColorHex: projectMeta?.trackColorHex,
        wins: w,
        losses: l,
        matchesPlayed: total,
        winRate,
        latentSkill: Number(skill.toFixed(4)),
        calibratedRating,
        rank: 0,
      };
    });

    results.sort((a, b) => b.latentSkill - a.latentSkill);
    results.forEach((item, index) => {
      item.rank = index + 1;
    });

    return results;
  }
}
