export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Dogfood Hackathon Platform API",
    version: "1.0.0",
    description: "Production REST and Realtime API powering end-to-end hackathon lifecycles, cross-judge Z-score normalization, Bradley-Terry pairwise evaluation, Sybil-resistant voting, and HMAC-SHA256 authenticated webhooks.",
    contact: {
      name: "Engineering Core",
      url: "https://dogfood.platform/docs",
      email: "api-support@dogfood.platform"
    },
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT"
    }
  },
  servers: [
    {
      url: "http://localhost:3000/api/v1",
      description: "Local Development Server"
    },
    {
      url: "https://api.dogfood.platform/v1",
      description: "Production Edge Cluster"
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Standard JWT bearer token issued upon /auth/login or /auth/session"
      },
      webhookSignature: {
        type: "apiKey",
        in: "header",
        name: "X-Dogfood-Signature",
        description: "HMAC-SHA256 digest of webhook payloads using pre-shared secrets"
      }
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          error: { type: "string" },
          statusCode: { type: "integer", example: 400 },
          details: { type: "string" }
        },
        required: ["error"]
      },
      Hackathon: {
        type: "object",
        properties: {
          id: { type: "string", example: "hck_2026_spring" },
          title: { type: "string", example: "Global AI Innovators 2026" },
          description: { type: "string" },
          status: { type: "string", enum: ["UPCOMING", "ACTIVE", "JUDGING", "CONCLUDED"] },
          startDate: { type: "string", format: "date-time" },
          endDate: { type: "string", format: "date-time" },
          maxTeamSize: { type: "integer", example: 4 },
          tracks: {
            type: "array",
            items: { type: "string" }
          }
        },
        required: ["id", "title", "status"]
      },
      Submission: {
        type: "object",
        properties: {
          id: { type: "string", example: "sub_90214" },
          hackathonId: { type: "string" },
          teamId: { type: "string" },
          title: { type: "string", example: "NeuralGuard - Quantum Shield" },
          description: { type: "string" },
          repositoryUrl: { type: "string", format: "uri" },
          demoUrl: { type: "string", format: "uri" },
          videoUrl: { type: "string", format: "uri" },
          track: { type: "string" },
          submittedAt: { type: "string", format: "date-time" }
        },
        required: ["id", "title", "repositoryUrl"]
      },
      NormalizationProofResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          metadata: {
            type: "object",
            properties: {
              algorithm: { type: "string", example: "Standardized Z-Score Normalization (Gaussian Calibration)" },
              totalJudges: { type: "integer", example: 4 },
              totalProjects: { type: "integer", example: 6 },
              globalMean: { type: "number", example: 76.5 },
              globalStdDev: { type: "number", example: 10.2 }
            }
          },
          evaluatorStats: {
            type: "array",
            items: {
              type: "object",
              properties: {
                judgeId: { type: "string" },
                judgeName: { type: "string" },
                evalCount: { type: "integer" },
                mean: { type: "number" },
                stdDev: { type: "number" },
                strictness: { type: "string", enum: ["Strict", "Moderate", "Lenient"] }
              }
            }
          },
          projectShifts: {
            type: "array",
            items: {
              type: "object",
              properties: {
                projectId: { type: "string" },
                projectTitle: { type: "string" },
                assignedJudge: { type: "string" },
                rawScore: { type: "number" },
                rawRank: { type: "integer" },
                zScore: { type: "number" },
                normalizedScore: { type: "number" },
                normalizedRank: { type: "integer" },
                rankShift: { type: "integer" },
                verdict: { type: "string" }
              }
            }
          }
        }
      },
      PairwiseMatchupResponse: {
        type: "object",
        properties: {
          matchupId: { type: "string" },
          track: { type: "string" },
          projectA: {
            type: "object",
            properties: {
              id: { type: "string" },
              title: { type: "string" },
              tagline: { type: "string" },
              track: { type: "string" },
              repoUrl: { type: "string" },
              demoUrl: { type: "string" }
            }
          },
          projectB: {
            type: "object",
            properties: {
              id: { type: "string" },
              title: { type: "string" },
              tagline: { type: "string" },
              track: { type: "string" },
              repoUrl: { type: "string" },
              demoUrl: { type: "string" }
            }
          }
        }
      },
      PairwiseVoteRequest: {
        type: "object",
        properties: {
          matchupId: { type: "string" },
          winnerId: { type: "string" },
          loserId: { type: "string" },
          rationale: { type: "string" },
          evaluationCriteria: {
            type: "object",
            properties: {
              technicalDepth: { type: "string", enum: ["A", "B", "TIED"] },
              executionQuality: { type: "string", enum: ["A", "B", "TIED"] },
              originality: { type: "string", enum: ["A", "B", "TIED"] }
            }
          }
        },
        required: ["matchupId", "winnerId", "loserId"]
      },
      PairwiseLeaderboardResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          model: { type: "string", example: "Bradley-Terry Maximum Likelihood Estimator (Minorize-Maximization)" },
          stats: {
            type: "object",
            properties: {
              totalVotes: { type: "integer" },
              convergenceIterations: { type: "integer" },
              tolerance: { type: "number" },
              converged: { type: "boolean" }
            }
          },
          rankings: {
            type: "array",
            items: {
              type: "object",
              properties: {
                rank: { type: "integer" },
                projectId: { type: "string" },
                title: { type: "string" },
                latentScore: { type: "number" },
                eloEquivalent: { type: "integer" },
                wins: { type: "integer" },
                losses: { type: "integer" },
                winRate: { type: "string" }
              }
            }
          }
        }
      }
    }
  },
  paths: {
    "/auth/session": {
      get: {
        summary: "Retrieve Current Session",
        description: "Returns the authenticated user details and active role permissions from the secure session token.",
        tags: ["Authentication"],
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Active session payload",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    user: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        email: { type: "string" },
                        name: { type: "string" },
                        role: { type: "string", enum: ["PARTICIPANT", "JUDGE", "ORGANIZER", "ADMIN"] }
                      }
                    }
                  }
                }
              }
            }
          },
          "401": { description: "Unauthenticated request" }
        }
      }
    },
    "/hackathons": {
      get: {
        summary: "List Hackathons",
        description: "Returns a paginated list of public and active hackathons with track breakdowns.",
        tags: ["Hackathons"],
        parameters: [
          { name: "status", in: "query", schema: { type: "string" }, description: "Filter by status (ACTIVE, UPCOMING, CONCLUDED)" },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 }, description: "Number of records to return" }
        ],
        responses: {
          "200": {
            description: "List of hackathons",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    hackathons: { type: "array", items: { $ref: "#/components/schemas/Hackathon" } }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        summary: "Create New Hackathon",
        description: "Organizer/Admin endpoint to provision a new hackathon instance with rubrics and schedules.",
        tags: ["Hackathons"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Hackathon" }
            }
          }
        },
        responses: {
          "201": { description: "Hackathon created successfully" },
          "403": { description: "Forbidden - Insufficient permissions" }
        }
      }
    },
    "/submissions": {
      get: {
        summary: "Query Submissions",
        description: "Returns submissions filtered by hackathon ID, track, or judging status.",
        tags: ["Submissions"],
        parameters: [
          { name: "hackathonId", in: "query", required: true, schema: { type: "string" } },
          { name: "track", in: "query", schema: { type: "string" } }
        ],
        responses: {
          "200": {
            description: "Array of submissions",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    submissions: { type: "array", items: { $ref: "#/components/schemas/Submission" } }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        summary: "Submit Project Entry",
        description: "Uploads codebase URLs, pitch deck links, and demo video for a registered team.",
        tags: ["Submissions"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Submission" }
            }
          }
        },
        responses: {
          "201": { description: "Submission recorded" },
          "400": { description: "Validation error or past submission deadline" }
        }
      }
    },
    "/evaluations": {
      post: {
        summary: "Submit Rubric Evaluation",
        description: "Record a judge's criterion-based numeric scoring and qualitative feedback for an assigned project.",
        tags: ["Judging & Scoring"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  submissionId: { type: "string" },
                  criteriaScores: {
                    type: "object",
                    additionalProperties: { type: "number" }
                  },
                  feedback: { type: "string" }
                },
                required: ["submissionId", "criteriaScores"]
              }
            }
          }
        },
        responses: {
          "200": { description: "Evaluation persisted" },
          "403": { description: "Judge not assigned to this submission or conflict of interest detected" }
        }
      }
    },
    "/normalization/proof": {
      get: {
        summary: "Cross-Judge Normalization Proof",
        description: "Computes judge-specific means (μ_j) and standard deviations (σ_j) to transform raw scores into standardized Z-scores (z_jk) and calibrated global ranks, demonstrating mitigation of judge leniency variance.",
        tags: ["Normalization"],
        responses: {
          "200": {
            description: "Complete statistical audit trail and raw vs normalized ranking shift analysis",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/NormalizationProofResponse" }
              }
            }
          }
        }
      }
    },
    "/pairwise/matchup": {
      get: {
        summary: "Generate Pairwise Matchup (The Gavel Approach)",
        description: "Delivers an entropy-balanced project pair for blind head-to-head comparison by a designated judge.",
        tags: ["Pairwise Mode"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "track", in: "query", schema: { type: "string" }, description: "Optional track constraint" }
        ],
        responses: {
          "200": {
            description: "Pairwise matchup candidates",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PairwiseMatchupResponse" }
              }
            }
          }
        }
      }
    },
    "/pairwise/vote": {
      post: {
        summary: "Cast Pairwise Vote",
        description: "Records the binary preference outcome of a matchup and triggers Bradley-Terry Minorize-Maximization ranking re-estimation.",
        tags: ["Pairwise Mode"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PairwiseVoteRequest" }
            }
          }
        },
        responses: {
          "200": {
            description: "Vote recorded and latent ability recalculated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    totalComparisons: { type: "integer" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/pairwise/leaderboard": {
      get: {
        summary: "Bradley-Terry Pairwise Global Leaderboard",
        description: "Returns the real-time global project standings derived via the Bradley-Terry Minorize-Maximization MLE algorithm.",
        tags: ["Pairwise Mode"],
        responses: {
          "200": {
            description: "Converged latent ability scores and Elo standings",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PairwiseLeaderboardResponse" }
              }
            }
          }
        }
      }
    },
    "/webhooks": {
      get: {
        summary: "List Registered Webhook Endpoints",
        description: "Returns configured external webhook subscription endpoints with event masks.",
        tags: ["Webhooks & Integrations"],
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "List of active webhooks",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    webhooks: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          url: { type: "string", format: "uri" },
                          events: { type: "array", items: { type: "string" } },
                          active: { type: "boolean" }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        summary: "Register Webhook Subscription",
        description: "Subscribes an external URL to platform lifecycle events (submission.created, judging.completed, results.published) with HMAC-SHA256 signing.",
        tags: ["Webhooks & Integrations"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  url: { type: "string", format: "uri" },
                  secret: { type: "string" },
                  events: { type: "array", items: { type: "string" } }
                },
                required: ["url", "secret", "events"]
              }
            }
          }
        },
        responses: {
          "201": { description: "Webhook registered successfully" }
        }
      }
    },
    "/certificates/verify": {
      get: {
        summary: "Verify Cryptographic Certificate",
        description: "Public endpoint validating cryptographic checksum, issuer signatures, and tamper-evident metadata for participant and winner certificates.",
        tags: ["Certificates & Verification"],
        parameters: [
          { name: "code", in: "query", required: true, schema: { type: "string" }, description: "Certificate verification token / serial number" }
        ],
        responses: {
          "200": {
            description: "Valid certificate details",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    valid: { type: "boolean" },
                    recipientName: { type: "string" },
                    hackathonTitle: { type: "string" },
                    awardType: { type: "string" },
                    issuedAt: { type: "string", format: "date-time" },
                    signatureDigest: { type: "string" }
                  }
                }
              }
            }
          },
          "404": { description: "Certificate code not found or invalid" }
        }
      }
    }
  }
};
