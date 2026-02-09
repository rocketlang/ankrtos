// onboarding-service.ts — Company Onboarding & KYC Workflow

import { PrismaClient } from '@prisma/client';
import { tenantManager } from './tenant-manager.js';
import { passwordPolicy } from './password-policy.js';
import { getPrisma } from '../lib/db.js';


// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();

interface OnboardingStep {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  completedAt?: Date;
}

interface CompanyRegistration {
  companyName: string;
  email: string;
  country: string;
  businessType: string; // shipowner, charterer, broker, agent, operator
  fleetSize?: number;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  phoneNumber?: string;
}

interface KYCDocument {
  id: string;
  type: string; // company_registration, tax_id, maritime_license, trade_license, etc.
  fileName: string;
  fileUrl: string;
  status: 'pending' | 'verified' | 'rejected';
  uploadedAt: Date;
  verifiedAt?: Date;
  rejectionReason?: string;
}

interface ModuleSelection {
  chartering: boolean;
  operations: boolean;
  snp: boolean;
  agency: boolean;
  bunkers: boolean;
  claims: boolean;
  compliance: boolean;
  finance: boolean;
  crm: boolean;
  hr: boolean;
  analytics: boolean;
  carbon: boolean;
}

interface OnboardingState {
  organizationId: string;
  currentStep: number;
  steps: OnboardingStep[];
  registration?: CompanyRegistration;
  kycDocuments: KYCDocument[];
  moduleSelection?: ModuleSelection;
  branding?: {
    logo?: string;
    primaryColor?: string;
  };
  completedAt?: Date;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  { id: 'company-info', name: 'Company Information', status: 'pending' },
  { id: 'admin-account', name: 'Admin Account Setup', status: 'pending' },
  { id: 'kyc-upload', name: 'KYC Document Upload', status: 'pending' },
  { id: 'module-selection', name: 'Select Modules', status: 'pending' },
  { id: 'branding', name: 'Customize Branding', status: 'pending' },
  { id: 'team-invite', name: 'Invite Team Members', status: 'pending' },
];

export class OnboardingService {
  /**
   * Start company registration
   */
  async startOnboarding(registration: CompanyRegistration): Promise<string> {
    // Validate admin password
    const passwordValidation = await passwordPolicy.validatePassword(
      registration.adminPassword,
      registration.adminName,
      registration.adminEmail
    );

    if (!passwordValidation.valid) {
      throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
    }

    // Create organization
    const organizationId = await tenantManager.createOrganization(
      registration.companyName,
      registration.email
    );

    // Create admin user
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(registration.adminPassword, 12);

    const adminUser = await prisma.user.create({
      data: {
        email: registration.adminEmail,
        name: registration.adminName,
        password: hashedPassword,
        role: 'company_admin',
        organizationId,
        isActive: true,
        passwordChangedAt: new Date(),
        passwordExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
    });

    // Initialize onboarding state
    const onboardingState: OnboardingState = {
      organizationId,
      currentStep: 0,
      steps: [...ONBOARDING_STEPS],
      registration,
      kycDocuments: [],
    };

    // Mark first two steps as completed
    onboardingState.steps[0].status = 'completed';
    onboardingState.steps[0].completedAt = new Date();
    onboardingState.steps[1].status = 'completed';
    onboardingState.steps[1].completedAt = new Date();
    onboardingState.currentStep = 2; // Move to KYC upload

    // Store onboarding state
    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        onboardingState: onboardingState as any,
      },
    });

    return organizationId;
  }

  /**
   * Get onboarding state
   */
  async getOnboardingState(organizationId: string): Promise<OnboardingState | null> {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { onboardingState: true },
    });

    if (!org || !org.onboardingState) return null;

    return org.onboardingState as OnboardingState;
  }

  /**
   * Upload KYC document
   */
  async uploadKYCDocument(
    organizationId: string,
    type: string,
    fileName: string,
    fileUrl: string
  ): Promise<void> {
    const state = await this.getOnboardingState(organizationId);
    if (!state) throw new Error('Onboarding not started');

    const kycDoc: KYCDocument = {
      id: `kyc_${Date.now()}`,
      type,
      fileName,
      fileUrl,
      status: 'pending',
      uploadedAt: new Date(),
    };

    state.kycDocuments.push(kycDoc);

    // Mark KYC step as in progress
    const kycStep = state.steps.find((s) => s.id === 'kyc-upload');
    if (kycStep && kycStep.status === 'pending') {
      kycStep.status = 'in_progress';
    }

    await prisma.organization.update({
      where: { id: organizationId },
      data: { onboardingState: state as any },
    });

    // Create activity log
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId: 'system',
        action: 'kyc_document_uploaded',
        entityType: 'organization',
        entityId: organizationId,
        metadata: { type, fileName },
      },
    });
  }

  /**
   * Complete KYC upload step
   */
  async completeKYCStep(organizationId: string): Promise<void> {
    const state = await this.getOnboardingState(organizationId);
    if (!state) throw new Error('Onboarding not started');

    // Require at least 2 documents (company registration + tax ID)
    if (state.kycDocuments.length < 2) {
      throw new Error('Please upload at least company registration and tax ID documents');
    }

    const kycStep = state.steps.find((s) => s.id === 'kyc-upload');
    if (kycStep) {
      kycStep.status = 'completed';
      kycStep.completedAt = new Date();
    }

    state.currentStep = 3; // Move to module selection

    await prisma.organization.update({
      where: { id: organizationId },
      data: { onboardingState: state as any },
    });
  }

  /**
   * Select modules
   */
  async selectModules(organizationId: string, modules: ModuleSelection): Promise<void> {
    const state = await this.getOnboardingState(organizationId);
    if (!state) throw new Error('Onboarding not started');

    state.moduleSelection = modules;

    // Update tenant modules
    await tenantManager.updateModules(organizationId, modules);

    // Mark module selection step as completed
    const moduleStep = state.steps.find((s) => s.id === 'module-selection');
    if (moduleStep) {
      moduleStep.status = 'completed';
      moduleStep.completedAt = new Date();
    }

    state.currentStep = 4; // Move to branding

    await prisma.organization.update({
      where: { id: organizationId },
      data: { onboardingState: state as any },
    });
  }

  /**
   * Customize branding
   */
  async customizeBranding(
    organizationId: string,
    branding: { logo?: string; primaryColor?: string; secondaryColor?: string; accentColor?: string }
  ): Promise<void> {
    const state = await this.getOnboardingState(organizationId);
    if (!state) throw new Error('Onboarding not started');

    state.branding = branding;

    // Update tenant branding
    await tenantManager.updateBranding(organizationId, {
      logo: branding.logo,
      primaryColor: branding.primaryColor || '#0369a1',
      secondaryColor: branding.secondaryColor || '#0c4a6e',
      accentColor: branding.accentColor || '#38bdf8',
      companyName: state.registration?.companyName || '',
    });

    // Mark branding step as completed
    const brandingStep = state.steps.find((s) => s.id === 'branding');
    if (brandingStep) {
      brandingStep.status = 'completed';
      brandingStep.completedAt = new Date();
    }

    state.currentStep = 5; // Move to team invite

    await prisma.organization.update({
      where: { id: organizationId },
      data: { onboardingState: state as any },
    });
  }

  /**
   * Skip a step
   */
  async skipStep(organizationId: string, stepId: string): Promise<void> {
    const state = await this.getOnboardingState(organizationId);
    if (!state) throw new Error('Onboarding not started');

    const step = state.steps.find((s) => s.id === stepId);
    if (!step) throw new Error('Step not found');

    // Can't skip required steps
    if (['company-info', 'admin-account', 'kyc-upload', 'module-selection'].includes(stepId)) {
      throw new Error('This step cannot be skipped');
    }

    step.status = 'skipped';
    step.completedAt = new Date();

    // Move to next incomplete step
    const nextStepIndex = state.steps.findIndex(
      (s) => s.status === 'pending' || s.status === 'in_progress'
    );

    if (nextStepIndex !== -1) {
      state.currentStep = nextStepIndex;
    }

    await prisma.organization.update({
      where: { id: organizationId },
      data: { onboardingState: state as any },
    });
  }

  /**
   * Complete onboarding
   */
  async completeOnboarding(organizationId: string): Promise<void> {
    const state = await this.getOnboardingState(organizationId);
    if (!state) throw new Error('Onboarding not started');

    // Check required steps
    const requiredSteps = ['company-info', 'admin-account', 'kyc-upload', 'module-selection'];
    const incompleteRequired = state.steps.filter(
      (s) => requiredSteps.includes(s.id) && s.status !== 'completed'
    );

    if (incompleteRequired.length > 0) {
      throw new Error(
        `Please complete required steps: ${incompleteRequired.map((s) => s.name).join(', ')}`
      );
    }

    state.completedAt = new Date();
    state.currentStep = state.steps.length; // Mark as done

    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        onboardingState: state as any,
        onboardingCompletedAt: new Date(),
      },
    });

    // Create welcome alert
    await prisma.alert.create({
      data: {
        organizationId,
        type: 'welcome',
        severity: 'low',
        title: 'Welcome to Mari8X!',
        message: 'Your account is now set up and ready to use.',
        status: 'active',
      },
    });

    // Create activity log
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId: 'system',
        action: 'onboarding_completed',
        entityType: 'organization',
        entityId: organizationId,
        metadata: { completedSteps: state.steps.length },
      },
    });
  }

  /**
   * Get onboarding progress percentage
   */
  async getProgress(organizationId: string): Promise<number> {
    const state = await this.getOnboardingState(organizationId);
    if (!state) return 0;

    const completed = state.steps.filter(
      (s) => s.status === 'completed' || s.status === 'skipped'
    ).length;

    return Math.round((completed / state.steps.length) * 100);
  }

  /**
   * Verify KYC document (admin only)
   */
  async verifyKYCDocument(
    organizationId: string,
    documentId: string,
    verified: boolean,
    rejectionReason?: string
  ): Promise<void> {
    const state = await this.getOnboardingState(organizationId);
    if (!state) throw new Error('Onboarding not started');

    const doc = state.kycDocuments.find((d) => d.id === documentId);
    if (!doc) throw new Error('Document not found');

    doc.status = verified ? 'verified' : 'rejected';
    doc.verifiedAt = new Date();
    if (rejectionReason) {
      doc.rejectionReason = rejectionReason;
    }

    await prisma.organization.update({
      where: { id: organizationId },
      data: { onboardingState: state as any },
    });

    // Send notification to admin
    await prisma.alert.create({
      data: {
        organizationId,
        type: verified ? 'kyc_approved' : 'kyc_rejected',
        severity: verified ? 'low' : 'medium',
        title: verified ? 'KYC Document Approved' : 'KYC Document Rejected',
        message: verified
          ? `Your ${doc.type} document has been verified`
          : `Your ${doc.type} document was rejected: ${rejectionReason}`,
        metadata: { documentId, type: doc.type },
        status: 'active',
      },
    });
  }

  /**
   * Get guided setup recommendations based on business type
   */
  getRecommendedModules(businessType: string): ModuleSelection {
    const recommendations: Record<string, ModuleSelection> = {
      shipowner: {
        chartering: true,
        operations: true,
        snp: true,
        agency: false,
        bunkers: true,
        claims: true,
        compliance: true,
        finance: true,
        crm: false,
        hr: true,
        analytics: true,
        carbon: true,
      },
      charterer: {
        chartering: true,
        operations: true,
        snp: false,
        agency: false,
        bunkers: true,
        claims: true,
        compliance: true,
        finance: true,
        crm: true,
        hr: false,
        analytics: true,
        carbon: false,
      },
      broker: {
        chartering: true,
        operations: false,
        snp: true,
        agency: false,
        bunkers: false,
        claims: false,
        compliance: true,
        finance: true,
        crm: true,
        hr: false,
        analytics: true,
        carbon: false,
      },
      agent: {
        chartering: false,
        operations: true,
        snp: false,
        agency: true,
        bunkers: false,
        claims: false,
        compliance: true,
        finance: true,
        crm: true,
        hr: false,
        analytics: false,
        carbon: false,
      },
      operator: {
        chartering: false,
        operations: true,
        snp: false,
        agency: false,
        bunkers: true,
        claims: true,
        compliance: true,
        finance: true,
        crm: false,
        hr: true,
        analytics: true,
        carbon: true,
      },
    };

    return (
      recommendations[businessType] || {
        chartering: true,
        operations: true,
        snp: false,
        agency: false,
        bunkers: true,
        claims: true,
        compliance: true,
        finance: true,
        crm: true,
        hr: false,
        analytics: true,
        carbon: true,
      }
    );
  }

  /**
   * Generate sample data for new organization (demo mode)
   */
  async generateSampleData(organizationId: string): Promise<void> {
    // Create 2 sample vessels
    await prisma.vessel.createMany({
      data: [
        {
          imo: '9876543',
          name: 'MV Sample Vessel 1',
          type: 'bulk_carrier',
          flag: 'GR',
          dwt: 75000,
          yearBuilt: 2015,
          status: 'active',
          organizationId,
        },
        {
          imo: '9876544',
          name: 'MV Sample Vessel 2',
          type: 'container',
          flag: 'LR',
          dwt: 50000,
          yearBuilt: 2018,
          status: 'active',
          organizationId,
        },
      ],
    });

    // Create 3 sample ports
    await prisma.port.createMany({
      data: [
        {
          locode: 'SGSIN',
          name: 'Singapore',
          country: 'SG',
          timezone: 'Asia/Singapore',
          organizationId,
        },
        {
          locode: 'NLRTM',
          name: 'Rotterdam',
          country: 'NL',
          timezone: 'Europe/Amsterdam',
          organizationId,
        },
        {
          locode: 'USNYC',
          name: 'New York',
          country: 'US',
          timezone: 'America/New_York',
          organizationId,
        },
      ],
    });

    // Create activity log
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId: 'system',
        action: 'sample_data_generated',
        entityType: 'organization',
        entityId: organizationId,
        metadata: { vessels: 2, ports: 3 },
      },
    });
  }
}

export const onboardingService = new OnboardingService();
