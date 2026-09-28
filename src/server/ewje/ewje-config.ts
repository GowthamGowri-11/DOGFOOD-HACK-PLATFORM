/**
 * EWJE v2 — Canonical Versioned Configuration
 * All mathematical constants live in this single immutable definition.
 */

import { EwjeConfig } from './ewje-types';

export const EWJE_V2_DEFAULTS: Readonly<EwjeConfig> = Object.freeze({
  algorithmVersion: 'EWJE_V2',
  iters: 30,
  lambda: 1.0,
  huberK: 1.345,
  scaleFloorFactor: 0.01,
  offsetCapFactor: 0.10,
  offsetCapEnabled: false, // Initially OFF per spec until simulation evidence justifies it
  minJudgeProjects: 2,
  disagreementThresholdPercent: 20.0,
  defaultJudgesPerProject: 3,
});

export const GENESIS_HASH_EWJE_V2 = '0000000000000000000000000000000000000000000000000000000000000000_GENESIS_EWJE_V2';

export function getEwjeConfig(overrides?: Partial<EwjeConfig>): EwjeConfig {
  return {
    ...EWJE_V2_DEFAULTS,
    ...overrides,
  };
}
