/**
 * Plugin Designer GraphQL API
 * Visual plugin creation for email intelligence
 *
 * @package @ankr/email-intelligence
 * @version 1.0.0
 */

import { builder } from '../builder.js';
import { Context } from '../context.js';
import { pluginRegistry } from '../../services/email-intelligence/index.js';
import type { IndustryPlugin, EntityExtractor } from '../../services/email-intelligence/index.js';

// ============================================================================
// Object Types
// ============================================================================

const EntityExtractorType = builder.objectRef<EntityExtractor>('EntityExtractor').implement({
  description: 'Entity extractor configuration',
  fields: (t) => ({
    name: t.exposeString('name', { description: 'Extractor name' }),
    description: t.string({ nullable: true, resolve: (parent) => parent.description }),
    pattern: t.string({ nullable: true, resolve: (parent) => parent.pattern?.toString() }),
    patterns: t.stringList({ nullable: true, resolve: (parent) => parent.patterns?.map((p) => p.toString()) }),
    ragQuery: t.string({ nullable: true, resolve: (parent) => parent.ragQuery }),
    weight: t.float({ nullable: true, resolve: (parent) => parent.weight }),
  }),
});

const BucketConditionType = builder.objectRef<any>('BucketCondition').implement({
  description: 'Bucket routing condition',
  fields: (t) => ({
    field: t.exposeString('field'),
    operator: t.exposeString('operator'),
    value: t.exposeString('value'),
  }),
});

const BucketConfigType = builder.objectRef<any>('BucketConfig').implement({
  description: 'Email bucket configuration',
  fields: (t) => ({
    id: t.exposeString('id'),
    name: t.exposeString('name'),
    displayName: t.exposeString('displayName'),
    description: t.string({ nullable: true, resolve: (parent) => parent.description }),
    conditions: t.field({ type: [BucketConditionType], resolve: (parent) => parent.conditions }),
    assignTo: t.string({ nullable: true, resolve: (parent) => parent.assignTo }),
    notificationChannels: t.stringList({ nullable: true, resolve: (parent) => parent.notificationChannels }),
  }),
});

const CategoryConfigType = builder.objectRef<any>('CategoryConfig').implement({
  description: 'Category classification configuration',
  fields: (t) => ({
    name: t.exposeString('name'),
    displayName: t.exposeString('displayName'),
    keywords: t.stringList({ resolve: (parent) => parent.keywords }),
    weight: t.exposeFloat('weight'),
    description: t.string({ nullable: true, resolve: (parent) => parent.description }),
  }),
});

const IndustryPluginType = builder.objectRef<IndustryPlugin>('IndustryPlugin').implement({
  description: 'Complete industry plugin configuration',
  fields: (t) => ({
    industry: t.exposeString('industry'),
    displayName: t.exposeString('displayName'),
    version: t.exposeString('version'),
    description: t.string({ nullable: true, resolve: (parent) => parent.description }),
    author: t.string({ nullable: true, resolve: (parent) => parent.author }),
    entityExtractors: t.field({
      type: [EntityExtractorType],
      resolve: (parent) =>
        Object.entries(parent.config.entityExtractors || {}).map(([_, extractor]) => extractor),
    }),
    categories: t.field({
      type: [CategoryConfigType],
      resolve: (parent) => parent.config.categories || [],
    }),
    buckets: t.field({
      type: [BucketConfigType],
      resolve: (parent) => parent.config.buckets || [],
    }),
  }),
});

const PluginListItemType = builder.objectRef<any>('PluginListItem').implement({
  description: 'Plugin summary for list view',
  fields: (t) => ({
    industry: t.exposeString('industry'),
    displayName: t.exposeString('displayName'),
    version: t.exposeString('version'),
    description: t.string({ nullable: true, resolve: (parent) => parent.description }),
    author: t.string({ nullable: true, resolve: (parent) => parent.author }),
    extractorsCount: t.exposeInt('extractorsCount'),
    categoriesCount: t.exposeInt('categoriesCount'),
    bucketsCount: t.exposeInt('bucketsCount'),
  }),
});

const EmailTestResultType = builder.objectRef<any>('EmailTestResult').implement({
  description: 'Result of testing an email with a plugin',
  fields: (t) => ({
    entities: t.stringList({ resolve: (parent) => parent.entities }),
    category: t.string({ nullable: true, resolve: (parent) => parent.category }),
    categoryConfidence: t.float({ nullable: true, resolve: (parent) => parent.categoryConfidence }),
    urgency: t.string({ nullable: true, resolve: (parent) => parent.urgency }),
    urgencyScore: t.int({ nullable: true, resolve: (parent) => parent.urgencyScore }),
    actionable: t.string({ nullable: true, resolve: (parent) => parent.actionable }),
    bucket: t.string({ nullable: true, resolve: (parent) => parent.bucket }),
    confidence: t.float({ nullable: true, resolve: (parent) => parent.confidence }),
    processingTime: t.int({ nullable: true, resolve: (parent) => parent.processingTime }),
  }),
});

// ============================================================================
// Input Types
// ============================================================================

const EntityExtractorInput = builder.inputType('EntityExtractorInput', {
  fields: (t) => ({
    name: t.string({ required: true }),
    description: t.string(),
    pattern: t.string(),
    patterns: t.stringList(),
    ragQuery: t.string(),
    weight: t.float(),
    examples: t.stringList(),
  }),
});

const CategoryConfigInput = builder.inputType('CategoryConfigInput', {
  fields: (t) => ({
    name: t.string({ required: true }),
    displayName: t.string({ required: true }),
    keywords: t.stringList({ required: true }),
    weight: t.float({ required: true }),
    description: t.string(),
  }),
});

const BucketConditionInput = builder.inputType('BucketConditionInput', {
  fields: (t) => ({
    field: t.string({ required: true }),
    operator: t.string({ required: true }),
    value: t.string({ required: true }),
  }),
});

const BucketConfigInput = builder.inputType('BucketConfigInput', {
  fields: (t) => ({
    id: t.string({ required: true }),
    name: t.string({ required: true }),
    displayName: t.string({ required: true }),
    description: t.string(),
    conditions: t.field({ type: [BucketConditionInput], required: true }),
    assignTo: t.string(),
    notificationChannels: t.stringList(),
  }),
});

// ============================================================================
// Queries
// ============================================================================

builder.queryField('plugins', (t) =>
  t.field({
    type: [PluginListItemType],
    description: 'List all available plugins',
    resolve: async () => {
      const plugins = pluginRegistry.list();
      return plugins.map((p) => ({
        industry: p.industry,
        displayName: p.displayName,
        version: p.version,
        description: p.description,
        author: p.author,
        extractorsCount: Object.keys(p.config.entityExtractors || {}).length,
        categoriesCount: p.config.categories?.length || 0,
        bucketsCount: p.config.buckets?.length || 0,
      }));
    },
  })
);

builder.queryField('plugin', (t) =>
  t.field({
    type: IndustryPluginType,
    nullable: true,
    description: 'Get plugin by industry',
    args: {
      industry: t.arg.string({ required: true }),
    },
    resolve: async (_root, args) => {
      const plugin = pluginRegistry.get(args.industry);
      return plugin || null;
    },
  })
);

builder.queryField('testEmail', (t) =>
  t.field({
    type: EmailTestResultType,
    description: 'Test an email with a plugin configuration',
    args: {
      industry: t.arg.string({ required: true }),
      subject: t.arg.string({ required: true }),
      body: t.arg.string({ required: true }),
    },
    resolve: async (_root, args) => {
      const plugin = pluginRegistry.get(args.industry);
      if (!plugin) {
        throw new Error(`Plugin not found: ${args.industry}`);
      }

      const { BaseEmailParser } = await import('../../services/email-intelligence/index.js');
      const parser = new BaseEmailParser(plugin.config);

      const startTime = Date.now();
      const result = await parser.parse(
        { subject: args.subject, body: args.body },
        args.body
      );
      const processingTime = Date.now() - startTime;

      return {
        entities: result.entities.map((e) => JSON.stringify(e)),
        category: result.category,
        categoryConfidence: result.categoryConfidence,
        urgency: result.urgency,
        urgencyScore: result.urgencyScore,
        actionable: result.actionable,
        bucket: result.bucket?.id,
        confidence: result.confidence,
        processingTime,
      };
    },
  })
);

// ============================================================================
// Mutations
// ============================================================================

builder.mutationField('savePlugin', (t) =>
  t.field({
    type: IndustryPluginType,
    description: 'Create or update a plugin',
    args: {
      industry: t.arg.string({ required: true }),
      displayName: t.arg.string({ required: true }),
      version: t.arg.string({ required: true }),
      description: t.arg.string(),
      author: t.arg.string(),
      entityExtractors: t.arg({ type: [EntityExtractorInput] }),
      categories: t.arg({ type: [CategoryConfigInput] }),
      buckets: t.arg({ type: [BucketConfigInput] }),
    },
    resolve: async (_root, args) => {
      // Build plugin object
      const plugin: IndustryPlugin = {
        industry: args.industry,
        displayName: args.displayName,
        version: args.version,
        description: args.description,
        author: args.author,
        config: {
          industry: args.industry,
          displayName: args.displayName,
          version: args.version,
          description: args.description,
          entityExtractors: {},
          keywords: {},
          categories: args.categories || [],
          buckets: args.buckets || [],
        },
      };

      // Convert extractors to map
      if (args.entityExtractors) {
        for (const extractor of args.entityExtractors) {
          const extractorObj: EntityExtractor = {
            name: extractor.name,
            description: extractor.description,
            weight: extractor.weight || 0.9,
          };

          // Convert pattern strings to RegExp
          if (extractor.pattern) {
            extractorObj.pattern = new RegExp(extractor.pattern, 'gi');
          }
          if (extractor.patterns) {
            extractorObj.patterns = extractor.patterns.map((p: string) => new RegExp(p, 'gi'));
          }
          if (extractor.ragQuery) {
            extractorObj.ragQuery = extractor.ragQuery;
          }

          plugin.config.entityExtractors[extractor.name.toLowerCase()] = extractorObj;
        }
      }

      // Register plugin
      pluginRegistry.register(plugin);

      // TODO: Save to database
      // await saveToDB(plugin);

      return plugin;
    },
  })
);

builder.mutationField('deletePlugin', (t) =>
  t.boolean({
    description: 'Delete a plugin',
    args: {
      industry: t.arg.string({ required: true }),
    },
    resolve: async (_root, args) => {
      // TODO: Implement delete from registry and database
      throw new Error('Delete not yet implemented');
    },
  })
);

builder.mutationField('learnPattern', (t) =>
  t.string({
    description: 'Learn extraction pattern from examples using RAG',
    args: {
      entityType: t.arg.string({ required: true }),
      examples: t.arg.stringList({ required: true }),
    },
    resolve: async (_root, args) => {
      // TODO: Implement RAG-based pattern learning
      // For now, return a simple regex based on examples
      if (args.examples.length === 0) {
        throw new Error('Need at least one example');
      }

      // Simple heuristic: create OR pattern from examples
      const escaped = args.examples.map((ex) => ex.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      const pattern = `\\b(${escaped.join('|')})\\b`;

      return pattern;
    },
  })
);
