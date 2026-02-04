import { z } from 'zod';

// Zod schemas for validation
export const PlatformSchema = z.enum(['windows', 'mac', 'linux', 'android', 'ios', 'unknown']);

export const BehavioralSignatureSchema = z.object({
  thirdPartyCookies: z.boolean().optional(),
  canvasFingerprinting: z.boolean().optional(),
  trackingPixel: z.boolean().optional(),
  crossSiteRequests: z.number().optional(),
  localStorage: z.boolean().optional(),
  fingerprinting: z.boolean().optional(),
  cryptomining: z.boolean().optional(),
}).passthrough(); // Allow additional fields

export const ThreatReportSchema = z.object({
  report_id: z.string().uuid(),
  domain: z.string().min(3).max(255),
  behavioral_signature: BehavioralSignatureSchema,
  confidence: z.number().min(0).max(1),
  client_version: z.string().max(20),
  platform: PlatformSchema,
  installation_id: z.string().uuid(),
});

export type ThreatReport = z.infer<typeof ThreatReportSchema>;

export interface DailyDefinition {
  version: string;
  release_date: string;
  new_trackers: number;
  removed_trackers: number;
  total_trackers: number;
  tracker_list: any[];
  signature_patterns: any[];
  ml_model_version: string | null;
  changelog: string;
  download_count: number;
  status: 'active' | 'deprecated' | 'draft';
  created_at: string;
  published_at: string | null;
}

export interface AggregatedThreat {
  id: string;
  domain: string;
  report_count: number;
  avg_confidence: number;
  behavioral_patterns: any;
  first_seen: string;
  last_seen: string;
  status: 'pending' | 'approved' | 'rejected' | 'watching' | 'false_positive';
  category: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  notes: string | null;
  auto_approved: boolean;
  created_at: string;
  updated_at: string;
}
