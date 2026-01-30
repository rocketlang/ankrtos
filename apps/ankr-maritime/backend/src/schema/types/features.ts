import { builder } from '../builder.js';
import { getAllFeatures, getEnabledFeatures, getTier, isFeatureEnabled, type FeatureFlag } from '../../config/features.js';

// FeatureFlag GraphQL type
const FeatureFlagType = builder.objectRef<FeatureFlag>('FeatureFlag');

builder.objectType(FeatureFlagType, {
  fields: (t) => ({
    key: t.exposeString('key'),
    name: t.exposeString('name'),
    description: t.exposeString('description'),
    tier: t.exposeString('tier'),
    enabled: t.exposeBoolean('enabled'),
    module: t.exposeString('module'),
  }),
});

// Query all features (shows enabled/disabled per current tier)
builder.queryField('features', (t) =>
  t.field({
    type: [FeatureFlagType],
    resolve: () => getAllFeatures(),
  }),
);

// Query only enabled features
builder.queryField('enabledFeatures', (t) =>
  t.field({
    type: [FeatureFlagType],
    resolve: () => getEnabledFeatures(),
  }),
);

// Query current tier
builder.queryField('currentTier', (t) =>
  t.string({ resolve: () => getTier() }),
);

// Check single feature
builder.queryField('isFeatureEnabled', (t) =>
  t.boolean({
    args: { key: t.arg.string({ required: true }) },
    resolve: (_root, args) => isFeatureEnabled(args.key),
  }),
);
