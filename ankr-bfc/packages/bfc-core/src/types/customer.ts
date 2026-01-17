/**
 * Customer domain types for ankrBFC
 */

import { z } from 'zod';

// Enums as const objects for runtime use
export const KycStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
} as const;
export type KycStatus = (typeof KycStatus)[keyof typeof KycStatus];

export const CustomerStatus = {
  PROSPECT: 'PROSPECT',
  ACTIVE: 'ACTIVE',
  DORMANT: 'DORMANT',
  CHURNED: 'CHURNED',
  BLOCKED: 'BLOCKED',
  DECEASED: 'DECEASED',
} as const;
export type CustomerStatus = (typeof CustomerStatus)[keyof typeof CustomerStatus];

export const CustomerSegment = {
  MASS: 'MASS',
  AFFLUENT: 'AFFLUENT',
  HNI: 'HNI',
  ULTRA_HNI: 'ULTRA_HNI',
} as const;
export type CustomerSegment = (typeof CustomerSegment)[keyof typeof CustomerSegment];

export const ChurnRiskLevel = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
} as const;
export type ChurnRiskLevel = (typeof ChurnRiskLevel)[keyof typeof ChurnRiskLevel];

// Address type
export interface CustomerAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

// Communication preferences
export interface CommunicationPrefs {
  email: boolean;
  sms: boolean;
  push: boolean;
  whatsapp: boolean;
  call: boolean;
}

// Core customer type
export interface Customer {
  id: string;
  externalId: string;
  cif?: string;

  // Identity
  firstName: string;
  lastName: string;
  displayName?: string;
  email?: string;
  phone: string;
  altPhone?: string;

  // KYC
  pan?: string;
  aadhaarHash?: string;
  dateOfBirth?: Date;
  gender?: 'M' | 'F' | 'O';

  // Address
  address?: CustomerAddress;

  // Scores
  kycStatus: KycStatus;
  riskScore: number;
  trustScore: number;
  creditScore?: number;
  segment?: CustomerSegment;
  subSegment?: string;
  lifetimeValue: number;

  // Relationship
  relationshipManagerId?: string;
  branchCode?: string;
  onboardingChannel?: string;

  // Status
  status: CustomerStatus;
  statusReason?: string;

  // Churn
  churnProbability: number;
  churnRiskLevel?: ChurnRiskLevel;
  lastChurnScoreAt?: Date;

  // Preferences
  communicationPrefs?: CommunicationPrefs;
  preferredLanguage: string;
  dndEnabled: boolean;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastActivityAt?: Date;
}

// Customer 360 view - aggregated data
export interface Customer360 {
  customer: Customer;
  products: {
    savings: number;
    loans: number;
    cards: number;
    investments: number;
    totalBalance: number;
    totalOutstanding: number;
  };
  recentEpisodes: CustomerEpisode[];
  activeOffers: CustomerOffer[];
  nextBestActions: NextBestActionItem[];
  lifeEvents: LifeEventSummary[];
  churnAnalysis?: ChurnAnalysis;
}

// Episode type
export interface CustomerEpisode {
  id: string;
  customerId: string;
  state: string;
  context?: Record<string, unknown>;
  action: string;
  outcome: string;
  success: boolean;
  module: BfcModule;
  subModule?: string;
  channel: Channel;
  deviceType?: string;
  sessionId?: string;
  aiInsight?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

// Module types
export const BfcModule = {
  LOAN: 'LOAN',
  DEPOSIT: 'DEPOSIT',
  PAYMENT: 'PAYMENT',
  CARD: 'CARD',
  INVESTMENT: 'INVESTMENT',
  INSURANCE: 'INSURANCE',
  FOREX: 'FOREX',
  SUPPORT: 'SUPPORT',
  KYC: 'KYC',
  ONBOARDING: 'ONBOARDING',
} as const;
export type BfcModule = (typeof BfcModule)[keyof typeof BfcModule];

export const Channel = {
  BRANCH: 'BRANCH',
  DIGITAL: 'DIGITAL',
  MOBILE_APP: 'MOBILE_APP',
  ATM: 'ATM',
  CALL_CENTER: 'CALL_CENTER',
  WHATSAPP: 'WHATSAPP',
  EMAIL: 'EMAIL',
  CHATBOT: 'CHATBOT',
  FIELD_AGENT: 'FIELD_AGENT',
} as const;
export type Channel = (typeof Channel)[keyof typeof Channel];

// Offer type
export interface CustomerOffer {
  id: string;
  customerId: string;
  offerType: ProductType;
  offerCode: string;
  title: string;
  description: string;
  terms?: Record<string, unknown>;
  confidence: number;
  relevanceScore?: number;
  propensityScore?: number;
  status: OfferStatus;
  validFrom: Date;
  expiresAt?: Date;
  shownAt?: Date;
  clickedAt?: Date;
  convertedAt?: Date;
}

export const ProductType = {
  SAVINGS: 'SAVINGS',
  CURRENT: 'CURRENT',
  SALARY: 'SALARY',
  FD: 'FD',
  RD: 'RD',
  HOME_LOAN: 'HOME_LOAN',
  PERSONAL_LOAN: 'PERSONAL_LOAN',
  CAR_LOAN: 'CAR_LOAN',
  EDUCATION_LOAN: 'EDUCATION_LOAN',
  BUSINESS_LOAN: 'BUSINESS_LOAN',
  GOLD_LOAN: 'GOLD_LOAN',
  OVERDRAFT: 'OVERDRAFT',
  CREDIT_CARD: 'CREDIT_CARD',
  DEBIT_CARD: 'DEBIT_CARD',
  MUTUAL_FUND: 'MUTUAL_FUND',
  INSURANCE: 'INSURANCE',
  DEMAT: 'DEMAT',
} as const;
export type ProductType = (typeof ProductType)[keyof typeof ProductType];

export const OfferStatus = {
  GENERATED: 'GENERATED',
  QUEUED: 'QUEUED',
  SHOWN: 'SHOWN',
  CLICKED: 'CLICKED',
  CONVERTED: 'CONVERTED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
} as const;
export type OfferStatus = (typeof OfferStatus)[keyof typeof OfferStatus];

// Next Best Action
export interface NextBestActionItem {
  action: string;
  confidence: number;
  reason: string;
  offerCode?: string;
  priority: number;
}

// Life Event Summary
export interface LifeEventSummary {
  eventType: LifeEventType;
  confidence: number;
  detectedAt: Date;
  isConfirmed: boolean;
}

export const LifeEventType = {
  MARRIAGE: 'MARRIAGE',
  CHILD_BIRTH: 'CHILD_BIRTH',
  JOB_CHANGE: 'JOB_CHANGE',
  SALARY_INCREASE: 'SALARY_INCREASE',
  SALARY_DECREASE: 'SALARY_DECREASE',
  HOME_PURCHASE: 'HOME_PURCHASE',
  CAR_PURCHASE: 'CAR_PURCHASE',
  RELOCATION: 'RELOCATION',
  RETIREMENT: 'RETIREMENT',
  BUSINESS_START: 'BUSINESS_START',
  MEDICAL_EMERGENCY: 'MEDICAL_EMERGENCY',
  EDUCATION_START: 'EDUCATION_START',
} as const;
export type LifeEventType = (typeof LifeEventType)[keyof typeof LifeEventType];

// Churn Analysis
export interface ChurnAnalysis {
  probability: number;
  riskLevel: ChurnRiskLevel;
  factors: ChurnFactor[];
  lastCalculatedAt: Date;
}

export interface ChurnFactor {
  factor: string;
  weight: number;
  description: string;
}

// Zod schemas for validation
export const CustomerCreateSchema = z.object({
  externalId: z.string().min(1),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().optional(),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number'),
  pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN').optional(),
  dateOfBirth: z.coerce.date().optional(),
  gender: z.enum(['M', 'F', 'O']).optional(),
});

export const CustomerUpdateSchema = CustomerCreateSchema.partial();

export const EpisodeCreateSchema = z.object({
  customerId: z.string().uuid(),
  state: z.string().min(1),
  action: z.string().min(1),
  outcome: z.string().min(1),
  success: z.boolean(),
  module: z.nativeEnum(BfcModule),
  channel: z.nativeEnum(Channel).default('DIGITAL'),
  context: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type CustomerCreateInput = z.infer<typeof CustomerCreateSchema>;
export type CustomerUpdateInput = z.infer<typeof CustomerUpdateSchema>;
export type EpisodeCreateInput = z.infer<typeof EpisodeCreateSchema>;
