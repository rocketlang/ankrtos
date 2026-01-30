import { create } from 'zustand';

export type FeatureTier = 'free' | 'pro' | 'enterprise';

export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  tier: FeatureTier;
  enabled: boolean;
  module: string;
}

interface FeaturesState {
  tier: FeatureTier;
  features: FeatureFlag[];
  setTier: (tier: FeatureTier) => void;
  setFeatures: (features: FeatureFlag[]) => void;
  isEnabled: (key: string) => boolean;
}

export const useFeaturesStore = create<FeaturesState>()((set, get) => ({
  tier: 'free',
  features: [],
  setTier: (tier) => set({ tier }),
  setFeatures: (features) => set({ features }),
  isEnabled: (key) => {
    const feature = get().features.find((f) => f.key === key);
    return feature?.enabled ?? false;
  },
}));
