/**
 * Beta Agent Onboarding Service
 *
 * Handles the specialized onboarding flow for beta agents.
 * Extends the base onboarding service with agent-specific steps.
 */

import { prisma } from '../lib/prisma.js';
import { randomBytes } from 'crypto';

export interface BetaAgentSignupParams {
  email: string;
  agentName: string;
  portsServed: string[];
  serviceTypes: string[];
  password: string;
  contactName: string;
  country?: string;
}

export interface AgentCredentials {
  imoMemberNumber?: string;
  portAuthorityLicense?: string;
  surveyorCertification?: string;
  businessRegistrationNumber?: string;
  [key: string]: any;
}

export interface PortCoverageSelection {
  portIds: string[];
  primaryPort?: string;
  secondaryPorts?: string[];
}

export class BetaAgentOnboardingService {
  /**
   * Start beta agent signup and onboarding
   * Creates organization, user, and beta agent profile
   */
  async startBetaAgentOnboarding(params: BetaAgentSignupParams) {
    const { email, agentName, portsServed, serviceTypes, password, contactName, country } = params;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Generate organization code
    const orgCode = this.generateOrgCode(agentName);

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create organization
      const organization = await tx.organization.create({
        data: {
          name: agentName,
          code: orgCode,
          type: 'agent',
          country: country || 'Unknown',
          betaStatus: 'enrolled',
          betaEnrolledAt: new Date(),
        },
      });

      // Hash password
      const bcrypt = await import('bcrypt');
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const user = await tx.user.create({
        data: {
          email,
          name: contactName,
          passwordHash,
          role: 'agent_beta',
          organizationId: organization.id,
        },
      });

      // Create beta agent profile
      const betaProfile = await tx.betaAgentProfile.create({
        data: {
          organizationId: organization.id,
          agentName,
          serviceTypes,
          portsCoverage: portsServed,
        },
      });

      return {
        organization,
        user,
        betaProfile,
      };
    });

    return {
      organizationId: result.organization.id,
      userId: result.user.id,
      betaProfileId: result.betaProfile.id,
      onboardingComplete: false,
      nextStep: 'submit_credentials',
    };
  }

  /**
   * Submit agent credentials (licenses, certifications, etc.)
   */
  async submitAgentCredentials(organizationId: string, credentials: AgentCredentials) {
    const betaProfile = await prisma.betaAgentProfile.findUnique({
      where: { organizationId },
    });

    if (!betaProfile) {
      throw new Error('Beta agent profile not found');
    }

    // Update credentials
    await prisma.betaAgentProfile.update({
      where: { organizationId },
      data: {
        credentials: credentials as any,
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      nextStep: 'select_port_coverage',
    };
  }

  /**
   * Select or update port coverage
   */
  async selectPortCoverage(organizationId: string, portCoverage: PortCoverageSelection) {
    const { portIds, primaryPort, secondaryPorts } = portCoverage;

    const betaProfile = await prisma.betaAgentProfile.findUnique({
      where: { organizationId },
    });

    if (!betaProfile) {
      throw new Error('Beta agent profile not found');
    }

    // Update port coverage
    await prisma.betaAgentProfile.update({
      where: { organizationId },
      data: {
        portsCoverage: portIds,
        credentials: {
          ...(betaProfile.credentials as object || {}),
          primaryPort,
          secondaryPorts,
        } as any,
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      nextStep: 'accept_sla',
    };
  }

  /**
   * Accept Beta SLA (Service Level Agreement)
   */
  async acceptBetaSLA(organizationId: string, slaVersion: string) {
    const betaProfile = await prisma.betaAgentProfile.findUnique({
      where: { organizationId },
    });

    if (!betaProfile) {
      throw new Error('Beta agent profile not found');
    }

    await prisma.$transaction(async (tx) => {
      // Update beta profile
      await tx.betaAgentProfile.update({
        where: { organizationId },
        data: {
          slaAcceptedAt: new Date(),
          slaVersion,
          updatedAt: new Date(),
        },
      });

      // Update organization
      await tx.organization.update({
        where: { id: organizationId },
        data: {
          betaSLAAcceptedVersion: slaVersion,
        },
      });
    });

    return {
      success: true,
      nextStep: 'generate_api_key',
    };
  }

  /**
   * Generate API key for beta agent
   */
  async generateAgentAPIKey(organizationId: string) {
    const betaProfile = await prisma.betaAgentProfile.findUnique({
      where: { organizationId },
    });

    if (!betaProfile) {
      throw new Error('Beta agent profile not found');
    }

    // Generate API key (32 bytes = 64 hex characters)
    const apiKey = `beta_${randomBytes(32).toString('hex')}`;
    const now = new Date();

    await prisma.$transaction(async (tx) => {
      // Update beta profile
      await tx.betaAgentProfile.update({
        where: { organizationId },
        data: {
          apiKey,
          apiKeyGeneratedAt: now,
          updatedAt: now,
        },
      });

      // Update organization
      await tx.organization.update({
        where: { id: organizationId },
        data: {
          apiKey,
          apiKeyGeneratedAt: now,
          betaStatus: 'active',
          betaCompletedOnboardingAt: now,
        },
      });
    });

    return {
      apiKey,
      generatedAt: now,
      onboardingComplete: true,
      nextStep: 'training',
    };
  }

  /**
   * Get beta agent onboarding state
   */
  async getBetaAgentOnboardingState(organizationId: string) {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        betaAgentProfile: true,
      },
    });

    if (!organization) {
      throw new Error('Organization not found');
    }

    if (!organization.betaAgentProfile) {
      throw new Error('Beta agent profile not found');
    }

    const profile = organization.betaAgentProfile;

    // Calculate onboarding progress
    const steps = {
      credentials_submitted: !!profile.credentials,
      port_coverage_selected: profile.portsCoverage.length > 0,
      sla_accepted: !!profile.slaAcceptedAt,
      api_key_generated: !!profile.apiKey,
    };

    const completedSteps = Object.values(steps).filter(Boolean).length;
    const totalSteps = Object.keys(steps).length;
    const progress = Math.round((completedSteps / totalSteps) * 100);

    // Determine next step
    let nextStep = 'submit_credentials';
    if (!steps.credentials_submitted) {
      nextStep = 'submit_credentials';
    } else if (!steps.port_coverage_selected) {
      nextStep = 'select_port_coverage';
    } else if (!steps.sla_accepted) {
      nextStep = 'accept_sla';
    } else if (!steps.api_key_generated) {
      nextStep = 'generate_api_key';
    } else {
      nextStep = 'training';
    }

    return {
      organizationId,
      agentName: profile.agentName,
      betaStatus: organization.betaStatus,
      enrolledAt: organization.betaEnrolledAt,
      completedAt: organization.betaCompletedOnboardingAt,
      progress,
      steps,
      nextStep,
      apiKey: profile.apiKey,
      serviceTypes: profile.serviceTypes,
      portsCoverage: profile.portsCoverage,
    };
  }

  /**
   * Reset API key (for security)
   */
  async resetAPIKey(organizationId: string) {
    const betaProfile = await prisma.betaAgentProfile.findUnique({
      where: { organizationId },
    });

    if (!betaProfile) {
      throw new Error('Beta agent profile not found');
    }

    // Generate new API key
    const apiKey = `beta_${crypto.randomBytes(32).toString('hex')}`;
    const now = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.betaAgentProfile.update({
        where: { organizationId },
        data: {
          apiKey,
          apiKeyGeneratedAt: now,
          updatedAt: now,
        },
      });

      await tx.organization.update({
        where: { id: organizationId },
        data: {
          apiKey,
          apiKeyGeneratedAt: now,
        },
      });
    });

    return {
      apiKey,
      generatedAt: now,
    };
  }

  /**
   * Generate organization code from agent name
   */
  private generateOrgCode(agentName: string): string {
    // Remove special characters and spaces, take first 8 chars, uppercase
    const clean = agentName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const prefix = clean.substring(0, 8);
    // Add 4 random chars to ensure uniqueness
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${suffix}`;
  }
}

export const betaAgentOnboardingService = new BetaAgentOnboardingService();
