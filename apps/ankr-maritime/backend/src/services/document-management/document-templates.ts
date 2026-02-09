/**
 * Document Templates Service
 *
 * Manages reusable document templates:
 * - Template creation and management
 * - Variable placeholders and substitution
 * - Template categories and organization
 * - Document generation from templates
 * - Template versioning and sharing
 *
 * @module DocumentTemplates
 */

import { PrismaClient } from '@prisma/client';
import { GraphQLError } from 'graphql';
import { getPrisma } from '../../lib/db.js';


// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();

// ============================================================================
// Types and Enums
// ============================================================================

export enum TemplateCategory {
  CHARTER_PARTY = 'CHARTER_PARTY',
  BILL_OF_LADING = 'BILL_OF_LADING',
  INVOICE = 'INVOICE',
  STATEMENT_OF_FACTS = 'STATEMENT_OF_FACTS',
  VOYAGE_INSTRUCTIONS = 'VOYAGE_INSTRUCTIONS',
  LETTER_OF_PROTEST = 'LETTER_OF_PROTEST',
  NOTICE_OF_READINESS = 'NOTICE_OF_READINESS',
  TIME_SHEET = 'TIME_SHEET',
  CORRESPONDENCE = 'CORRESPONDENCE',
  CUSTOM = 'CUSTOM',
}

export enum TemplateFormat {
  MARKDOWN = 'MARKDOWN',
  HTML = 'HTML',
  DOCX = 'DOCX',
  PDF = 'PDF',
  PLAIN_TEXT = 'PLAIN_TEXT',
}

export enum TemplateStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
  DEPRECATED = 'DEPRECATED',
}

export enum VariableType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  DATE = 'DATE',
  CURRENCY = 'CURRENCY',
  BOOLEAN = 'BOOLEAN',
  SELECT = 'SELECT',
  MULTI_SELECT = 'MULTI_SELECT',
  VESSEL = 'VESSEL',
  PORT = 'PORT',
  COMPANY = 'COMPANY',
  USER = 'USER',
}

// ============================================================================
// Interfaces
// ============================================================================

export interface TemplateVariable {
  name: string; // e.g., "vessel_name", "laycan_from"
  label: string; // Human-readable label
  type: VariableType;
  required: boolean;
  defaultValue?: any;

  // For SELECT/MULTI_SELECT types
  options?: Array<{ value: string; label: string }>;

  // Validation
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };

  // Help text
  description?: string;
  placeholder?: string;
}

export interface DocumentTemplate {
  templateId: string;
  templateName: string;
  description: string;

  category: TemplateCategory;
  format: TemplateFormat;
  status: TemplateStatus;

  // Content
  content: string; // Template content with {{placeholders}}
  variables: TemplateVariable[];

  // Metadata
  tags: string[];
  version: string;

  // Sharing
  isPublic: boolean; // Available to all organizations
  isShared: boolean; // Shared within organization
  sharedWith: string[]; // Specific user IDs or organization IDs

  // Usage statistics
  usageCount: number;
  lastUsedAt?: Date;

  // Multi-tenancy
  organizationId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;

  // Additional metadata
  metadata?: Record<string, any>;
}

export interface GeneratedDocument {
  documentId: string;
  templateId: string;
  content: string;
  format: TemplateFormat;

  variableValues: Record<string, any>;

  generatedBy: string;
  generatedAt: Date;

  organizationId: string;
}

export interface TemplatePreview {
  templateId: string;
  previewContent: string;
  sampleData: Record<string, any>;
}

// ============================================================================
// Document Templates Service
// ============================================================================

export class DocumentTemplatesService {

  /**
   * Create template
   */
  async createTemplate(
    templateData: {
      templateName: string;
      description: string;
      category: TemplateCategory;
      format: TemplateFormat;
      content: string;
      variables: TemplateVariable[];
      tags?: string[];
      isPublic?: boolean;
      isShared?: boolean;
    },
    createdBy: string,
    organizationId: string
  ): Promise<DocumentTemplate> {
    // Validate template content and variables
    this.validateTemplate(templateData.content, templateData.variables);

    const template: DocumentTemplate = {
      templateId: this.generateTemplateId(),
      templateName: templateData.templateName,
      description: templateData.description,
      category: templateData.category,
      format: templateData.format,
      status: TemplateStatus.ACTIVE,
      content: templateData.content,
      variables: templateData.variables,
      tags: templateData.tags || [],
      version: '1.0',
      isPublic: templateData.isPublic || false,
      isShared: templateData.isShared || false,
      sharedWith: [],
      usageCount: 0,
      organizationId,
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Store template (in production, use DocumentTemplate table)
    // For MVP, store in metadata
    await this.storeTemplate(template);

    return template;
  }

  /**
   * Get template by ID
   */
  async getTemplate(
    templateId: string,
    organizationId: string
  ): Promise<DocumentTemplate | null> {
    // In production: Fetch from DocumentTemplate table
    // For MVP, return from default templates or metadata

    const templates = await this.getTemplates(organizationId);
    return templates.find(t => t.templateId === templateId) || null;
  }

  /**
   * Get all templates
   */
  async getTemplates(
    organizationId: string,
    filters?: {
      category?: TemplateCategory;
      status?: TemplateStatus;
      isPublic?: boolean;
      tags?: string[];
    }
  ): Promise<DocumentTemplate[]> {
    // Get default templates + organization templates
    let templates = [
      ...this.getDefaultTemplates(organizationId),
      // In production: fetch custom templates from database
    ];

    // Apply filters
    if (filters) {
      if (filters.category) {
        templates = templates.filter(t => t.category === filters.category);
      }
      if (filters.status) {
        templates = templates.filter(t => t.status === filters.status);
      }
      if (filters.isPublic !== undefined) {
        templates = templates.filter(t => t.isPublic === filters.isPublic);
      }
      if (filters.tags && filters.tags.length > 0) {
        templates = templates.filter(t =>
          filters.tags!.some(tag => t.tags.includes(tag))
        );
      }
    }

    return templates;
  }

  /**
   * Update template
   */
  async updateTemplate(
    templateId: string,
    updates: Partial<DocumentTemplate>,
    updatedBy: string,
    organizationId: string
  ): Promise<DocumentTemplate> {
    const template = await this.getTemplate(templateId, organizationId);

    if (!template) {
      throw new GraphQLError(`Template not found: ${templateId}`);
    }

    // Check permissions (owner or admin)
    if (template.organizationId !== organizationId && !template.isPublic) {
      throw new GraphQLError('Not authorized to update this template');
    }

    // Validate if content or variables are being updated
    if (updates.content || updates.variables) {
      const content = updates.content || template.content;
      const variables = updates.variables || template.variables;
      this.validateTemplate(content, variables);
    }

    // Update template
    const updatedTemplate: DocumentTemplate = {
      ...template,
      ...updates,
      updatedAt: new Date(),
    };

    // Increment version if content changed
    if (updates.content || updates.variables) {
      const [major, minor] = template.version.split('.').map(Number);
      updatedTemplate.version = `${major}.${minor + 1}`;
    }

    await this.storeTemplate(updatedTemplate);

    return updatedTemplate;
  }

  /**
   * Delete template
   */
  async deleteTemplate(
    templateId: string,
    organizationId: string
  ): Promise<boolean> {
    const template = await this.getTemplate(templateId, organizationId);

    if (!template) {
      throw new GraphQLError(`Template not found: ${templateId}`);
    }

    if (template.organizationId !== organizationId) {
      throw new GraphQLError('Not authorized to delete this template');
    }

    // Soft delete - mark as archived
    await this.updateTemplate(
      templateId,
      { status: TemplateStatus.ARCHIVED },
      'system',
      organizationId
    );

    return true;
  }

  /**
   * Generate document from template
   */
  async generateDocument(
    templateId: string,
    variableValues: Record<string, any>,
    generatedBy: string,
    organizationId: string,
    options?: {
      fileName?: string;
      saveToVault?: boolean;
    }
  ): Promise<GeneratedDocument> {
    const template = await this.getTemplate(templateId, organizationId);

    if (!template) {
      throw new GraphQLError(`Template not found: ${templateId}`);
    }

    // Validate required variables
    this.validateVariableValues(template.variables, variableValues);

    // Substitute variables in content
    const content = this.substituteVariables(template.content, variableValues, template.variables);

    const generatedDocument: GeneratedDocument = {
      documentId: this.generateDocumentId(),
      templateId,
      content,
      format: template.format,
      variableValues,
      generatedBy,
      generatedAt: new Date(),
      organizationId,
    };

    // Update template usage
    await this.incrementTemplateUsage(templateId, organizationId);

    // Save to document vault if requested
    if (options?.saveToVault) {
      await this.saveToVault(
        generatedDocument,
        template.templateName,
        options.fileName,
        organizationId
      );
    }

    return generatedDocument;
  }

  /**
   * Preview template with sample data
   */
  async previewTemplate(
    templateId: string,
    sampleData?: Record<string, any>,
    organizationId?: string
  ): Promise<TemplatePreview> {
    const template = await this.getTemplate(templateId, organizationId || 'system');

    if (!template) {
      throw new GraphQLError(`Template not found: ${templateId}`);
    }

    // Generate sample data if not provided
    const data = sampleData || this.generateSampleData(template.variables);

    // Substitute variables
    const previewContent = this.substituteVariables(template.content, data, template.variables);

    return {
      templateId,
      previewContent,
      sampleData: data,
    };
  }

  /**
   * Clone template
   */
  async cloneTemplate(
    templateId: string,
    newName: string,
    clonedBy: string,
    organizationId: string
  ): Promise<DocumentTemplate> {
    const sourceTemplate = await this.getTemplate(templateId, organizationId);

    if (!sourceTemplate) {
      throw new GraphQLError(`Template not found: ${templateId}`);
    }

    const clonedTemplate = await this.createTemplate(
      {
        templateName: newName,
        description: `Cloned from ${sourceTemplate.templateName}`,
        category: sourceTemplate.category,
        format: sourceTemplate.format,
        content: sourceTemplate.content,
        variables: sourceTemplate.variables,
        tags: [...sourceTemplate.tags, 'cloned'],
      },
      clonedBy,
      organizationId
    );

    return clonedTemplate;
  }

  /**
   * Share template
   */
  async shareTemplate(
    templateId: string,
    shareWith: string[], // User IDs or organization IDs
    sharedBy: string,
    organizationId: string
  ): Promise<DocumentTemplate> {
    const template = await this.getTemplate(templateId, organizationId);

    if (!template) {
      throw new GraphQLError(`Template not found: ${templateId}`);
    }

    if (template.createdBy !== sharedBy && template.organizationId !== organizationId) {
      throw new GraphQLError('Not authorized to share this template');
    }

    return await this.updateTemplate(
      templateId,
      {
        isShared: true,
        sharedWith: [...new Set([...template.sharedWith, ...shareWith])],
      },
      sharedBy,
      organizationId
    );
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private validateTemplate(content: string, variables: TemplateVariable[]): void {
    // Extract placeholders from content
    const placeholderRegex = /\{\{([^}]+)\}\}/g;
    const placeholders = new Set<string>();
    let match;

    while ((match = placeholderRegex.exec(content)) !== null) {
      placeholders.add(match[1].trim());
    }

    // Check that all placeholders have corresponding variables
    const variableNames = new Set(variables.map(v => v.name));

    for (const placeholder of placeholders) {
      if (!variableNames.has(placeholder)) {
        throw new GraphQLError(
          `Placeholder {{${placeholder}}} does not have a corresponding variable definition`
        );
      }
    }
  }

  private validateVariableValues(
    variables: TemplateVariable[],
    values: Record<string, any>
  ): void {
    for (const variable of variables) {
      const value = values[variable.name];

      // Check required
      if (variable.required && (value === undefined || value === null || value === '')) {
        throw new GraphQLError(`Required variable missing: ${variable.label}`);
      }

      // Skip validation if not provided and not required
      if (value === undefined || value === null) {
        continue;
      }

      // Type validation
      switch (variable.type) {
        case VariableType.NUMBER:
        case VariableType.CURRENCY:
          if (typeof value !== 'number' && isNaN(Number(value))) {
            throw new GraphQLError(`Invalid number for ${variable.label}`);
          }
          break;

        case VariableType.DATE:
          if (!(value instanceof Date) && isNaN(Date.parse(value))) {
            throw new GraphQLError(`Invalid date for ${variable.label}`);
          }
          break;

        case VariableType.BOOLEAN:
          if (typeof value !== 'boolean') {
            throw new GraphQLError(`Invalid boolean for ${variable.label}`);
          }
          break;

        case VariableType.SELECT:
          if (variable.options && !variable.options.some(opt => opt.value === value)) {
            throw new GraphQLError(`Invalid option for ${variable.label}`);
          }
          break;

        case VariableType.MULTI_SELECT:
          if (!Array.isArray(value)) {
            throw new GraphQLError(`${variable.label} must be an array`);
          }
          break;
      }

      // Custom validation rules
      if (variable.validation) {
        const val = variable.validation;

        if (typeof value === 'number') {
          if (val.min !== undefined && value < val.min) {
            throw new GraphQLError(`${variable.label} must be at least ${val.min}`);
          }
          if (val.max !== undefined && value > val.max) {
            throw new GraphQLError(`${variable.label} must be at most ${val.max}`);
          }
        }

        if (typeof value === 'string') {
          if (val.minLength !== undefined && value.length < val.minLength) {
            throw new GraphQLError(`${variable.label} must be at least ${val.minLength} characters`);
          }
          if (val.maxLength !== undefined && value.length > val.maxLength) {
            throw new GraphQLError(`${variable.label} must be at most ${val.maxLength} characters`);
          }
          if (val.pattern && !new RegExp(val.pattern).test(value)) {
            throw new GraphQLError(`${variable.label} does not match required format`);
          }
        }
      }
    }
  }

  private substituteVariables(
    content: string,
    values: Record<string, any>,
    variables: TemplateVariable[]
  ): string {
    let result = content;

    for (const variable of variables) {
      const value = values[variable.name];
      const placeholder = `{{${variable.name}}}`;

      // Format value based on type
      let formattedValue = '';

      if (value !== undefined && value !== null) {
        switch (variable.type) {
          case VariableType.DATE:
            formattedValue = new Date(value).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });
            break;

          case VariableType.CURRENCY:
            formattedValue = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
            }).format(Number(value));
            break;

          case VariableType.NUMBER:
            formattedValue = Number(value).toLocaleString('en-US');
            break;

          case VariableType.BOOLEAN:
            formattedValue = value ? 'Yes' : 'No';
            break;

          case VariableType.MULTI_SELECT:
            formattedValue = Array.isArray(value) ? value.join(', ') : String(value);
            break;

          default:
            formattedValue = String(value);
        }
      } else if (variable.defaultValue !== undefined) {
        formattedValue = String(variable.defaultValue);
      }

      // Replace all occurrences
      result = result.split(placeholder).join(formattedValue);
    }

    return result;
  }

  private generateSampleData(variables: TemplateVariable[]): Record<string, any> {
    const sampleData: Record<string, any> = {};

    for (const variable of variables) {
      switch (variable.type) {
        case VariableType.TEXT:
          sampleData[variable.name] = `Sample ${variable.label}`;
          break;

        case VariableType.NUMBER:
        case VariableType.CURRENCY:
          sampleData[variable.name] = 12345;
          break;

        case VariableType.DATE:
          sampleData[variable.name] = new Date();
          break;

        case VariableType.BOOLEAN:
          sampleData[variable.name] = true;
          break;

        case VariableType.SELECT:
          sampleData[variable.name] = variable.options?.[0]?.value || 'option1';
          break;

        case VariableType.MULTI_SELECT:
          sampleData[variable.name] = variable.options?.slice(0, 2).map(o => o.value) || [];
          break;

        case VariableType.VESSEL:
          sampleData[variable.name] = 'MV Sample Vessel';
          break;

        case VariableType.PORT:
          sampleData[variable.name] = 'Singapore';
          break;

        case VariableType.COMPANY:
          sampleData[variable.name] = 'Sample Shipping Co.';
          break;

        case VariableType.USER:
          sampleData[variable.name] = 'John Doe';
          break;

        default:
          sampleData[variable.name] = variable.defaultValue || '';
      }
    }

    return sampleData;
  }

  private async incrementTemplateUsage(templateId: string, organizationId: string): Promise<void> {
    const template = await this.getTemplate(templateId, organizationId);

    if (template) {
      template.usageCount++;
      template.lastUsedAt = new Date();
      await this.storeTemplate(template);
    }
  }

  private async saveToVault(
    generatedDocument: GeneratedDocument,
    templateName: string,
    fileName: string | undefined,
    organizationId: string
  ): Promise<void> {
    const docName = fileName || `${templateName}_${new Date().toISOString().split('T')[0]}`;

    await prisma.document.create({
      data: {
        name: docName,
        type: 'generated',
        fileSize: Buffer.byteLength(generatedDocument.content),
        mimeType: this.getFormMimeType(generatedDocument.format),
        uploadedBy: generatedDocument.generatedBy,
        organizationId,
        metadata: {
          generatedFromTemplate: generatedDocument.templateId,
          variableValues: generatedDocument.variableValues,
          generatedAt: generatedDocument.generatedAt,
        },
      },
    });
  }

  private getFormMimeType(format: TemplateFormat): string {
    switch (format) {
      case TemplateFormat.HTML:
        return 'text/html';
      case TemplateFormat.MARKDOWN:
        return 'text/markdown';
      case TemplateFormat.DOCX:
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case TemplateFormat.PDF:
        return 'application/pdf';
      case TemplateFormat.PLAIN_TEXT:
      default:
        return 'text/plain';
    }
  }

  private async storeTemplate(template: DocumentTemplate): Promise<void> {
    // In production: Store in DocumentTemplate table
    // For MVP: Store in a simple cache or file
    console.log(`[Template] Stored template: ${template.templateId}`);
  }

  private getDefaultTemplates(organizationId: string): DocumentTemplate[] {
    return [
      {
        templateId: 'voyage-instructions-template',
        templateName: 'Voyage Instructions',
        description: 'Standard voyage instructions template',
        category: TemplateCategory.VOYAGE_INSTRUCTIONS,
        format: TemplateFormat.MARKDOWN,
        status: TemplateStatus.ACTIVE,
        content: `# VOYAGE INSTRUCTIONS

**Vessel:** {{vessel_name}}
**Voyage No:** {{voyage_number}}
**Master:** {{master_name}}

## Load Port: {{load_port}}
**Arrival:** {{load_port_arrival}}
**Cargo:** {{cargo_description}}
**Quantity:** {{cargo_quantity}} MT

## Discharge Port: {{discharge_port}}
**ETA:** {{discharge_port_eta}}

## Special Instructions
{{special_instructions}}

## Agent Details
**Load Port Agent:** {{load_agent}}
**Discharge Port Agent:** {{discharge_agent}}

---
*Generated on {{generation_date}}*
`,
        variables: [
          { name: 'vessel_name', label: 'Vessel Name', type: VariableType.VESSEL, required: true },
          { name: 'voyage_number', label: 'Voyage Number', type: VariableType.TEXT, required: true },
          { name: 'master_name', label: 'Master Name', type: VariableType.TEXT, required: true },
          { name: 'load_port', label: 'Load Port', type: VariableType.PORT, required: true },
          { name: 'load_port_arrival', label: 'Load Port Arrival', type: VariableType.DATE, required: true },
          { name: 'cargo_description', label: 'Cargo Description', type: VariableType.TEXT, required: true },
          { name: 'cargo_quantity', label: 'Cargo Quantity (MT)', type: VariableType.NUMBER, required: true },
          { name: 'discharge_port', label: 'Discharge Port', type: VariableType.PORT, required: true },
          { name: 'discharge_port_eta', label: 'Discharge Port ETA', type: VariableType.DATE, required: true },
          { name: 'special_instructions', label: 'Special Instructions', type: VariableType.TEXT, required: false },
          { name: 'load_agent', label: 'Load Port Agent', type: VariableType.COMPANY, required: true },
          { name: 'discharge_agent', label: 'Discharge Port Agent', type: VariableType.COMPANY, required: true },
          { name: 'generation_date', label: 'Generation Date', type: VariableType.DATE, required: true, defaultValue: new Date() },
        ],
        tags: ['voyage', 'operations', 'instructions'],
        version: '1.0',
        isPublic: true,
        isShared: false,
        sharedWith: [],
        usageCount: 0,
        organizationId,
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        templateId: 'nor-template',
        templateName: 'Notice of Readiness',
        description: 'Standard NOR template',
        category: TemplateCategory.NOTICE_OF_READINESS,
        format: TemplateFormat.PLAIN_TEXT,
        status: TemplateStatus.ACTIVE,
        content: `NOTICE OF READINESS

TO: {{charterer_name}}
CC: {{agent_name}}

Vessel: {{vessel_name}}
Voyage: {{voyage_number}}
Port: {{port_name}}
Date: {{nor_date}}
Time: {{nor_time}}

We hereby give Notice of Readiness that the vessel {{vessel_name}} arrived at {{port_name}} on {{nor_date}} at {{nor_time}} and is ready in all respects to {{operation}} cargo as per Charter Party dated {{cp_date}}.

All holds/tanks cleaned and ready.
All certificates valid.
Vessel in free pratique.

Awaiting your loading/discharge instructions.

Signed: {{master_name}}
Master, {{vessel_name}}
`,
        variables: [
          { name: 'charterer_name', label: 'Charterer Name', type: VariableType.COMPANY, required: true },
          { name: 'agent_name', label: 'Agent Name', type: VariableType.COMPANY, required: true },
          { name: 'vessel_name', label: 'Vessel Name', type: VariableType.VESSEL, required: true },
          { name: 'voyage_number', label: 'Voyage Number', type: VariableType.TEXT, required: true },
          { name: 'port_name', label: 'Port Name', type: VariableType.PORT, required: true },
          { name: 'nor_date', label: 'NOR Date', type: VariableType.DATE, required: true },
          { name: 'nor_time', label: 'NOR Time', type: VariableType.TEXT, required: true },
          { name: 'operation', label: 'Operation', type: VariableType.SELECT, required: true, options: [
            { value: 'load', label: 'Load' },
            { value: 'discharge', label: 'Discharge' },
          ]},
          { name: 'cp_date', label: 'Charter Party Date', type: VariableType.DATE, required: true },
          { name: 'master_name', label: 'Master Name', type: VariableType.TEXT, required: true },
        ],
        tags: ['operations', 'laytime', 'NOR'],
        version: '1.0',
        isPublic: true,
        isShared: false,
        sharedWith: [],
        usageCount: 0,
        organizationId,
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }

  private generateTemplateId(): string {
    return `TPL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateDocumentId(): string {
    return `DOC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const documentTemplatesService = new DocumentTemplatesService();
