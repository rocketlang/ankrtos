-- Add beta-related columns to Organization table
ALTER TABLE "Organization" ADD COLUMN "betaStatus" TEXT DEFAULT 'not_enrolled'; -- not_enrolled, invited, enrolled, active, churned
ALTER TABLE "Organization" ADD COLUMN "betaEnrolledAt" TIMESTAMP;
ALTER TABLE "Organization" ADD COLUMN "betaCompletedOnboardingAt" TIMESTAMP;
ALTER TABLE "Organization" ADD COLUMN "betaFeedbackScore" INTEGER CHECK ("betaFeedbackScore" >= 1 AND "betaFeedbackScore" <= 5);
ALTER TABLE "Organization" ADD COLUMN "betaSLAAcceptedVersion" TEXT;
ALTER TABLE "Organization" ADD COLUMN "apiKey" TEXT UNIQUE;
ALTER TABLE "Organization" ADD COLUMN "apiKeyGeneratedAt" TIMESTAMP;

-- Create BetaAgentProfile table
CREATE TABLE "BetaAgentProfile" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT UNIQUE NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "agentName" TEXT NOT NULL,
  "serviceTypes" TEXT[] NOT NULL, -- port_agent, surveyor, bunker_supplier, ship_chandler
  "portsCoverage" TEXT[] NOT NULL, -- array of port IDs
  "credentials" JSONB, -- agent credentials (IMO member ID, port authority license, etc.)
  "slaAcceptedAt" TIMESTAMP,
  "slaVersion" TEXT,
  "apiKey" TEXT UNIQUE,
  "apiKeyGeneratedAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create BetaFeedback table
CREATE TABLE "BetaFeedback" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT REFERENCES "Organization"("id") ON DELETE CASCADE,
  "userId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "rating" INTEGER NOT NULL CHECK ("rating" >= 1 AND "rating" <= 5),
  "category" TEXT NOT NULL, -- UI, Performance, Features, Documentation, Support
  "feedback" TEXT NOT NULL,
  "screenshot" TEXT, -- URL to uploaded screenshot
  "url" TEXT, -- Page where feedback was submitted
  "browser" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create BugReport table
CREATE TABLE "BugReport" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT REFERENCES "Organization"("id") ON DELETE CASCADE,
  "userId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "severity" TEXT NOT NULL CHECK ("severity" IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
  "stepsToReproduce" TEXT,
  "screenshot" TEXT,
  "url" TEXT,
  "browser" TEXT,
  "userAgent" TEXT,
  "status" TEXT NOT NULL DEFAULT 'new' CHECK ("status" IN ('new', 'investigating', 'in_progress', 'resolved', 'wont_fix')),
  "resolvedAt" TIMESTAMP,
  "resolvedBy" TEXT,
  "resolution" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create FeatureRequest table
CREATE TABLE "FeatureRequest" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT REFERENCES "Organization"("id") ON DELETE CASCADE,
  "userId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "priority" TEXT CHECK ("priority" IN ('HIGH', 'MEDIUM', 'LOW')),
  "votes" INTEGER NOT NULL DEFAULT 1,
  "status" TEXT NOT NULL DEFAULT 'submitted' CHECK ("status" IN ('submitted', 'reviewing', 'planned', 'in_progress', 'completed', 'rejected')),
  "completedAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create BetaTrainingProgress table
CREATE TABLE "BetaTrainingProgress" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "videoId" TEXT,
  "tutorialId" TEXT,
  "completedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE("userId", "videoId"),
  UNIQUE("userId", "tutorialId")
);

-- Create indexes for better query performance
CREATE INDEX "idx_beta_feedback_org" ON "BetaFeedback"("organizationId");
CREATE INDEX "idx_beta_feedback_created" ON "BetaFeedback"("createdAt" DESC);
CREATE INDEX "idx_bug_report_severity" ON "BugReport"("severity", "status");
CREATE INDEX "idx_bug_report_org" ON "BugReport"("organizationId");
CREATE INDEX "idx_feature_request_votes" ON "FeatureRequest"("votes" DESC);
CREATE INDEX "idx_feature_request_status" ON "FeatureRequest"("status");
CREATE INDEX "idx_beta_agent_profile_org" ON "BetaAgentProfile"("organizationId");
CREATE INDEX "idx_beta_training_user" ON "BetaTrainingProgress"("userId");
CREATE INDEX "idx_organization_beta_status" ON "Organization"("betaStatus");
