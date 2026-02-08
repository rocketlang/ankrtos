export interface User {
  id: string;
  email: string;
  password_hash: string;
  username: string;
  created_at: number;
  updated_at: number;
}

export interface Challenge {
  id: string;
  user_id: string;
  challenge_type: ChallengeType;
  prompt: string;
  response?: string;
  score?: number;
  status: 'pending' | 'completed' | 'failed';
  created_at: number;
  completed_at?: number;
}

export type ChallengeType =
  | 'creative_writing'
  | 'contextual_reasoning'
  | 'emotional_intelligence'
  | 'pattern_creativity'
  | 'cultural_knowledge';

export interface Certificate {
  id: string;
  user_id: string;
  certificate_hash: string;
  issued_at: number;
  expires_at: number;
  status: 'active' | 'expired' | 'revoked';
  verification_level: 'basic' | 'advanced' | 'expert';
}

export interface ApiKey {
  id: string;
  user_id: string;
  key_hash: string;
  name: string;
  created_at: number;
  last_used_at?: number;
  status: 'active' | 'revoked';
}

export interface JWTPayload {
  userId: string;
  email: string;
}
