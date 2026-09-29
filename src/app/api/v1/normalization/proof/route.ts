import { NextRequest } from 'next/server';
import { NormalizationEngine } from '@/server/services/normalization.engine';
import { successResponse, errorResponse } from '@/lib/api/response';

export async function GET(req: NextRequest) {
  try {
    const proof = NormalizationEngine.generateNormalizationProof();
    return successResponse(proof, 'Normalization proof generated successfully');
  } catch (err: any) {
    return errorResponse(err.message || 'Error generating proof', 'PROOF_ERROR', 500);
  }
}
