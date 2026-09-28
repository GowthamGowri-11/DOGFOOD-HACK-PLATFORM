import prisma from '../src/lib/prisma';
import { ResultService } from '../src/server/services/result.service';

export {};

async function seedTracksAndScorecards() {
  const hackathonId = 'hack_buildathon_2026';
  console.log('--- Setting up Tracks & Scorecard Evaluation Details ---');

  // 1. Create 4 enterprise tracks
  const tracksData = [
    {
      slug: 'ai-enterprise',
      title: 'Enterprise AI & Autonomous Systems',
      colorHex: '#2563EB',
    },
    {
      slug: 'cloud-security',
      title: 'Cloud Infrastructure & Zero-Trust Security',
      colorHex: '#6366F1',
    },
    {
      slug: 'fintech-crypto',
      title: 'FinTech Intelligence & Cryptographic Audit',
      colorHex: '#059669',
    },
    {
      slug: 'health-multimodal',
      title: 'HealthTech & Multimodal Diagnostics',
      colorHex: '#8B5CF6',
    },
  ];

  const tracks: Record<string, any> = {};
  for (const t of tracksData) {
    const track = await prisma.track.upsert({
      where: { hackathonId_slug: { hackathonId, slug: t.slug } },
      update: { title: t.title, colorHex: t.colorHex },
      create: { hackathonId, ...t },
    });
    tracks[t.slug] = track;
  }
  console.log('Tracks configured: 4 tracks');

  // 2. Map projects to diverse tracks
  const projects = await prisma.project.findMany({
    where: { hackathonId },
    include: { team: true },
  });

  const trackMapping: Record<string, string> = {
    'Aura Systems': 'ai-enterprise',
    'Synapse Labs': 'cloud-security',
    'Apex Sentinel': 'cloud-security',
    'Cognitive Flow': 'ai-enterprise',
    'Vanguard Core': 'fintech-crypto',
    'Polaris Intelligence': 'health-multimodal',
    'Nova Protocol': 'fintech-crypto',
    'DeepMatrix': 'health-multimodal',
  };

  const projectTechStacks: Record<string, string[]> = {
    'Aura Systems': ['Python 3.11', 'FastAPI', 'PostgreSQL (pgvector)', 'LangChain', 'Docker', 'Next.js 14'],
    'Synapse Labs': ['Go 1.22', 'eBPF', 'Kubernetes', 'gRPC', 'Prometheus', 'Zero-Trust MTLS', 'React'],
    'Apex Sentinel': ['Rust', 'K8s Operator SDK', 'OpenTelemetry', 'ClickHouse', 'TailwindCSS', 'TypeScript'],
    'Cognitive Flow': ['Python 3.11', 'Ray Distributed', 'Kafka', 'PostgreSQL', 'GraphQL', 'Next.js 14'],
    'Vanguard Core': ['Solidity', 'Rust', 'CosmWasm', 'PostgreSQL', 'Zero-Knowledge SNARKs', 'React'],
    'Polaris Intelligence': ['PyTorch 2.3', 'DICOM Tools', 'FastAPI', 'CUDA 12', 'WebRTC', 'Next.js 14'],
    'Nova Protocol': ['TypeScript', 'Node.js', 'PostgreSQL', 'WebSockets', 'TailwindCSS'],
    'DeepMatrix': ['Python', 'TensorFlow', 'PostgreSQL', 'FastAPI', 'Docker', 'TailwindCSS'],
  };

  for (const p of projects) {
    const trackSlug = trackMapping[p.team.name] || 'ai-enterprise';
    const track = tracks[trackSlug] || tracks['ai-enterprise'];
    const stack = projectTechStacks[p.team.name] || ['Python', 'PostgreSQL', 'Next.js'];

    await prisma.project.update({
      where: { id: p.id },
      data: {
        trackId: track.id,
        techStack: stack,
      },
    });
  }
  console.log('Projects assigned to tracks and tech stacks');

  // 3. Ensure AI Model Version and Prompt Version exist for AI Jury Runs
  const modelVersion = await prisma.aIModelVersion.upsert({
    where: { versionTag: 'claude-3-7-sonnet-v1.4' },
    update: {},
    create: {
      versionTag: 'claude-3-7-sonnet-v1.4',
      modelProvider: 'anthropic',
      modelName: 'claude-3-7-sonnet',
      temperature: 0.2,
      systemPromptHash: 'hash-apex-eval-v1',
      isActive: true,
    },
  });

  const promptVersion = await prisma.promptVersion.upsert({
    where: { versionTag: 'enterprise-jury-v3.2' },
    update: {},
    create: {
      versionTag: 'enterprise-jury-v3.2',
      promptTemplate: 'Evaluate enterprise system for scalability, zero-trust security, and business impact.',
      evidenceRules: 'Provide concrete code citations and architectural analysis.',
      isActive: true,
    },
  });

  // Ensure Rubric
  const rubric = await prisma.rubric.findFirst({
    where: { hackathonId, isCurrent: true },
  });

  if (!rubric) {
    console.error('No rubric found!');
    return;
  }

  // 4. Seed AI Jury Runs and Evaluation breakdown for each project
  const aiAnalysisData: Record<string, {
    totalScore: number;
    aiScore: number;
    humanScore: number;
    criteriaScores: Array<{ title: string; score: number; maxScore: number; color?: string }>;
    humanScores: Array<{ title: string; score: number; maxScore: number }>;
    pros: string[];
    cons: string[];
    improve: string[];
  }> = {
    'Aura Systems': {
      totalScore: 95.0,
      aiScore: 96.0,
      humanScore: 94.0,
      humanScores: [
        { title: 'Innovation & Idea', score: 24, maxScore: 25 },
        { title: 'Technical Implementation', score: 24, maxScore: 25 },
        { title: 'UI/UX Design', score: 23, maxScore: 25 },
        { title: 'Presentation & Pitch', score: 24, maxScore: 25 },
        { title: 'Business Impact & Feasibility', score: 24, maxScore: 25 },
      ],
      criteriaScores: [
        { title: 'Idea / Concept', score: 15, maxScore: 15 },
        { title: 'Innovation', score: 14, maxScore: 15 },
        { title: 'Frontend Layer', score: 9, maxScore: 10 },
        { title: 'Middleware Layer', score: 10, maxScore: 10 },
        { title: 'Backend Layer', score: 10, maxScore: 10 },
        { title: 'Security & Auth', score: 8, maxScore: 8 },
        { title: 'Database Schema', score: 8, maxScore: 8 },
        { title: 'Code Quality', score: 8, maxScore: 8 },
        { title: 'Architecture', score: 8, maxScore: 8 },
        { title: 'Performance', score: 4, maxScore: 4 },
        { title: 'UI & Styling', score: 4, maxScore: 4 },
      ],
      pros: [
        'Modular high-throughput RAG architecture with sub-25ms vector retrieval latency.',
        'Zero-trust token verification integrated across all microservice ingress points.',
        'Deterministic fallback caching prevents hallucinations and minimizes LLM API spikes.',
        'Fully documented asynchronous job queues and vector indexing.',
      ],
      cons: [
        'High memory footprint during initial vector index hydration.',
        'Docker-compose environment requires dedicated GPUs for local embedding computation.',
        'Rate limit back-off logic could be optimized for multi-tenant enterprise saturation.',
      ],
      improve: [
        'Implement hybrid sparse-dense reciprocal rank fusion for domain-specific queries.',
        'Adopt high-speed cache warmers to eliminate cold-start indexing overhead.',
        'Add OpenTelemetry traces for distributed agent reasoning execution.',
      ],
    },
    'Synapse Labs': {
      totalScore: 91.0,
      aiScore: 92.0,
      humanScore: 90.0,
      humanScores: [
        { title: 'Innovation & Idea', score: 23, maxScore: 25 },
        { title: 'Technical Implementation', score: 24, maxScore: 25 },
        { title: 'UI/UX Design', score: 22, maxScore: 25 },
        { title: 'Presentation & Pitch', score: 23, maxScore: 25 },
        { title: 'Business Impact & Feasibility', score: 23, maxScore: 25 },
      ],
      criteriaScores: [
        { title: 'Idea / Concept', score: 14, maxScore: 15 },
        { title: 'Innovation', score: 14, maxScore: 15 },
        { title: 'Frontend Layer', score: 8, maxScore: 10 },
        { title: 'Middleware Layer', score: 9, maxScore: 10 },
        { title: 'Backend Layer', score: 10, maxScore: 10 },
        { title: 'Security & Auth', score: 8, maxScore: 8 },
        { title: 'Database Schema', score: 7, maxScore: 8 },
        { title: 'Code Quality', score: 8, maxScore: 8 },
        { title: 'Architecture', score: 8, maxScore: 8 },
        { title: 'Performance', score: 4, maxScore: 4 },
        { title: 'UI & Styling', score: 3, maxScore: 4 },
      ],
      pros: [
        'Autonomous zero-trust agent swarm with decentralized peer consensus.',
        'Kernel-level eBPF monitoring ensures zero packet manipulation or eavesdropping.',
        'Extremely lightweight Go binaries with minimal container attack surface.',
      ],
      cons: [
        'Configuration steep learning curve for non-Kubernetes enterprise clusters.',
        'CLI tooling dominates; web dashboard lacks granular RBAC self-service.',
      ],
      improve: [
        'Provide single-binary standalone mode for developer workstations.',
        'Integrate automated compliance report generation (SOC2, ISO 27001).',
      ],
    },
    'Apex Sentinel': {
      totalScore: 88.0,
      aiScore: 89.0,
      humanScore: 87.0,
      humanScores: [
        { title: 'Innovation & Idea', score: 22, maxScore: 25 },
        { title: 'Technical Implementation', score: 23, maxScore: 25 },
        { title: 'UI/UX Design', score: 21, maxScore: 25 },
        { title: 'Presentation & Pitch', score: 22, maxScore: 25 },
        { title: 'Business Impact & Feasibility', score: 22, maxScore: 25 },
      ],
      criteriaScores: [
        { title: 'Idea / Concept', score: 13, maxScore: 15 },
        { title: 'Innovation', score: 13, maxScore: 15 },
        { title: 'Frontend Layer', score: 8, maxScore: 10 },
        { title: 'Middleware Layer', score: 9, maxScore: 10 },
        { title: 'Backend Layer', score: 9, maxScore: 10 },
        { title: 'Security & Auth', score: 8, maxScore: 8 },
        { title: 'Database Schema', score: 8, maxScore: 8 },
        { title: 'Code Quality', score: 8, maxScore: 8 },
        { title: 'Architecture', score: 7, maxScore: 8 },
        { title: 'Performance', score: 3, maxScore: 4 },
        { title: 'UI & Styling', score: 3, maxScore: 4 },
      ],
      pros: [
        'High-speed anomaly detection processing over 50,000 events/sec via Rust engine.',
        'Seamless integration with Kubernetes native audit log webhooks.',
      ],
      cons: [
        'Initial model training requires extensive baseline normal traffic captures.',
        'Storage footprint grows rapidly without aggressive ClickHouse TTL policies.',
      ],
      improve: [
        'Provide pre-trained baseline models for standard cloud deployments.',
        'Add automated remediation webhooks for instant pod quarantine.',
      ],
    },
    'Cognitive Flow': {
      totalScore: 84.0,
      aiScore: 85.0,
      humanScore: 83.0,
      humanScores: [
        { title: 'Innovation & Idea', score: 21, maxScore: 25 },
        { title: 'Technical Implementation', score: 22, maxScore: 25 },
        { title: 'UI/UX Design', score: 20, maxScore: 25 },
        { title: 'Presentation & Pitch', score: 21, maxScore: 25 },
        { title: 'Business Impact & Feasibility', score: 21, maxScore: 25 },
      ],
      criteriaScores: [
        { title: 'Idea / Concept', score: 13, maxScore: 15 },
        { title: 'Innovation', score: 12, maxScore: 15 },
        { title: 'Frontend Layer', score: 7, maxScore: 10 },
        { title: 'Middleware Layer', score: 8, maxScore: 10 },
        { title: 'Backend Layer', score: 9, maxScore: 10 },
        { title: 'Security & Auth', score: 7, maxScore: 8 },
        { title: 'Database Schema', score: 7, maxScore: 8 },
        { title: 'Code Quality', score: 7, maxScore: 8 },
        { title: 'Architecture', score: 7, maxScore: 8 },
        { title: 'Performance', score: 3, maxScore: 4 },
        { title: 'UI & Styling', score: 3, maxScore: 4 },
      ],
      pros: [
        'Distributed agent coordination framework using Ray and event-driven Kafka topics.',
        'Fault-tolerant retry semantics ensure tasks execute exactly once.',
      ],
      cons: [
        'High cluster provisioning requirements in production environments.',
        'Monitoring dashboard could use real-time graph visualization.',
      ],
      improve: [
        'Introduce lightweight single-node orchestrator for staging testing.',
        'Build interactive DAG visualization in Next.js.',
      ],
    },
    'Vanguard Core': {
      totalScore: 80.3,
      aiScore: 81.0,
      humanScore: 80.0,
      humanScores: [
        { title: 'Innovation & Idea', score: 20, maxScore: 25 },
        { title: 'Technical Implementation', score: 21, maxScore: 25 },
        { title: 'UI/UX Design', score: 19, maxScore: 25 },
        { title: 'Presentation & Pitch', score: 20, maxScore: 25 },
        { title: 'Business Impact & Feasibility', score: 20, maxScore: 25 },
      ],
      criteriaScores: [
        { title: 'Idea / Concept', score: 12, maxScore: 15 },
        { title: 'Innovation', score: 12, maxScore: 15 },
        { title: 'Frontend Layer', score: 7, maxScore: 10 },
        { title: 'Middleware Layer', score: 8, maxScore: 10 },
        { title: 'Backend Layer', score: 8, maxScore: 10 },
        { title: 'Security & Auth', score: 8, maxScore: 8 },
        { title: 'Database Schema', score: 7, maxScore: 8 },
        { title: 'Code Quality', score: 7, maxScore: 8 },
        { title: 'Architecture', score: 7, maxScore: 8 },
        { title: 'Performance', score: 3, maxScore: 4 },
        { title: 'UI & Styling', score: 3, maxScore: 4 },
      ],
      pros: [
        'Zero-knowledge proof verification provides cryptographically verifiable audit trails.',
        'Comprehensive Rust smart contracts with formal verification specs.',
      ],
      cons: [
        'Proof generation times are computationally heavy on standard CPU hardware.',
      ],
      improve: [
        'Accelerate SNARK prover with GPU / WebAssembly optimizations.',
      ],
    },
    'Polaris Intelligence': {
      totalScore: 78.7,
      aiScore: 79.0,
      humanScore: 78.0,
      humanScores: [
        { title: 'Innovation & Idea', score: 19, maxScore: 25 },
        { title: 'Technical Implementation', score: 20, maxScore: 25 },
        { title: 'UI/UX Design', score: 20, maxScore: 25 },
        { title: 'Presentation & Pitch', score: 19, maxScore: 25 },
        { title: 'Business Impact & Feasibility', score: 19, maxScore: 25 },
      ],
      criteriaScores: [
        { title: 'Idea / Concept', score: 11, maxScore: 15 },
        { title: 'Innovation', score: 11, maxScore: 15 },
        { title: 'Frontend Layer', score: 8, maxScore: 10 },
        { title: 'Middleware Layer', score: 7, maxScore: 10 },
        { title: 'Backend Layer', score: 8, maxScore: 10 },
        { title: 'Security & Auth', score: 7, maxScore: 8 },
        { title: 'Database Schema', score: 7, maxScore: 8 },
        { title: 'Code Quality', score: 7, maxScore: 8 },
        { title: 'Architecture', score: 7, maxScore: 8 },
        { title: 'Performance', score: 3, maxScore: 4 },
        { title: 'UI & Styling', score: 3, maxScore: 4 },
      ],
      pros: [
        'Multimodal diagnostic imaging pipelines support DICOM format with zero compression loss.',
        'Intuitive radiology viewer interface built with Next.js and WebGL.',
      ],
      cons: [
        'HIPAA compliance sandbox needs additional end-to-end encryption layers.',
      ],
      improve: [
        'Integrate federated learning to allow multi-hospital collaborative fine-tuning.',
      ],
    },
  };

  // 5. Create AIJuryRun records for each project
  for (const p of projects) {
    const data = aiAnalysisData[p.team.name] || aiAnalysisData['Aura Systems'];

    // Delete previous AI runs if any
    await prisma.aIJuryRun.deleteMany({
      where: { projectId: p.id },
    });

    const aiRun = await prisma.aIJuryRun.create({
      data: {
        hackathonId,
        projectId: p.id,
        rubricId: rubric.id,
        modelVersionId: modelVersion.id,
        promptVersionId: promptVersion.id,
        overallScore: data.aiScore,
        confidenceScore: 0.94,
        rawAnalysis: {
          totalScore: data.totalScore,
          aiScore: data.aiScore,
          humanScore: data.humanScore,
          criteriaScores: data.criteriaScores,
          humanScores: data.humanScores,
          pros: data.pros,
          cons: data.cons,
          improve: data.improve,
        },
        summaryFeedback: `Automated enterprise jury assessment for ${p.title}. Architecture demonstrated exceptional execution with balanced score distribution across all evaluated layers.`,
        executionLatencyMs: 1420,
      },
    });

    console.log(`Created AIJuryRun for project: ${p.title} (Score: ${data.aiScore})`);
  }

  // 6. Regenerate Results and verification
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const adminId = admin?.id || 'usr_admin_001';

  const genResult = await ResultService.generateResults(hackathonId, adminId, {
    method: 'Z_SCORE',
    forceRegenerate: true,
  });

  console.log(`Results successfully generated with ${genResult.results.length} ranked projects`);

  // 7. Publish Results so both Admin and Public Leaderboard are live!
  await ResultService.publishResults(hackathonId, adminId);
  console.log('Results officially published to public leaderboard!');
}

seedTracksAndScorecards()
  .then(() => {
    console.log('SUCCESS');
    process.exit(0);
  })
  .catch((e) => {
    console.error('ERROR:', e);
    process.exit(1);
  });
