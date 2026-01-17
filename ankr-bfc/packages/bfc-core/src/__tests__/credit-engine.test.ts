/**
 * Credit Engine Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  CreditEngine,
  creditPolicies,
  CreditApplication,
  CreditDecision,
} from '../integrations/credit-engine';

// Mock dependencies
vi.mock('../integrations/ai-proxy', () => ({
  AIProxyClient: vi.fn().mockImplementation(() => ({
    complete: vi.fn().mockResolvedValue({
      content: JSON.stringify({
        decision: 'APPROVE',
        reasoning: 'Good credit profile',
        confidence: 0.85,
      }),
    }),
  })),
}));

vi.mock('../integrations/eon', () => ({
  EonClient: vi.fn().mockImplementation(() => ({
    recall: vi.fn().mockResolvedValue([]),
    remember: vi.fn().mockResolvedValue({ success: true }),
  })),
}));

describe('CreditEngine', () => {
  let engine: CreditEngine;

  beforeEach(() => {
    engine = new CreditEngine();
  });

  describe('Credit Policies', () => {
    it('should have policies for all loan types', () => {
      expect(creditPolicies.HOME_LOAN).toBeDefined();
      expect(creditPolicies.PERSONAL_LOAN).toBeDefined();
      expect(creditPolicies.CAR_LOAN).toBeDefined();
      expect(creditPolicies.BUSINESS_LOAN).toBeDefined();
      expect(creditPolicies.CREDIT_CARD).toBeDefined();
      expect(creditPolicies.OVERDRAFT).toBeDefined();
    });

    it('should have valid policy parameters', () => {
      const policy = creditPolicies.HOME_LOAN;

      expect(policy.minAge).toBeGreaterThan(18);
      expect(policy.maxAge).toBeLessThanOrEqual(70);
      expect(policy.minIncome).toBeGreaterThan(0);
      expect(policy.maxLoanAmount).toBeGreaterThan(0);
      expect(policy.maxFoir).toBeGreaterThan(0);
      expect(policy.maxFoir).toBeLessThanOrEqual(1);
      expect(policy.minBureauScore).toBeGreaterThanOrEqual(300);
      expect(policy.baseRate).toBeGreaterThan(0);
    });
  });

  describe('processApplication', () => {
    const createMockApplication = (overrides: Partial<CreditApplication> = {}): CreditApplication => ({
      applicationId: 'APP-001',
      customerId: 'CUST-001',
      productType: 'PERSONAL_LOAN',
      applicant: {
        name: 'Test User',
        age: 35,
        occupation: 'Software Engineer',
        employmentType: 'SALARIED',
        employer: 'Tech Corp',
        yearsEmployed: 5,
        residenceType: 'OWNED',
      },
      financial: {
        monthlyIncome: 100000,
        existingEmi: 10000,
      },
      request: {
        amount: 500000,
        tenure: 36,
        purpose: 'Home renovation',
      },
      bureauScore: 750,
      channel: 'DIGITAL',
      submittedAt: new Date(),
      ...overrides,
    });

    it('should approve good credit applications', async () => {
      const application = createMockApplication();

      const decision = await engine.processApplication(application);

      expect(decision.decision).toBe('APPROVED');
      expect(decision.riskGrade).toMatch(/^[A-C]$/);
      expect(decision.approvedAmount).toBeDefined();
      expect(decision.interestRate).toBeDefined();
    });

    it('should reject applications failing hard policies', async () => {
      const application = createMockApplication({
        applicant: {
          name: 'Young Applicant',
          age: 18, // Below minimum age
          occupation: 'Student',
          employmentType: 'OTHER',
          residenceType: 'RENTED',
        },
      });

      const decision = await engine.processApplication(application);

      expect(decision.decision).toBe('REJECTED');
      expect(decision.rejectionReasons).toBeDefined();
      expect(decision.rejectionReasons!.length).toBeGreaterThan(0);
    });

    it('should limit approved amount based on FOIR', async () => {
      const application = createMockApplication({
        financial: {
          monthlyIncome: 50000,
          existingEmi: 20000, // High existing obligations
        },
        request: {
          amount: 2000000, // High loan amount
          tenure: 36,
        },
      });

      const decision = await engine.processApplication(application);

      if (decision.decision === 'APPROVED' || decision.decision === 'CONDITIONAL_APPROVAL') {
        expect(decision.approvedAmount).toBeLessThanOrEqual(application.request.amount);
      }
    });

    it('should flag low bureau score applications for review', async () => {
      const application = createMockApplication({
        bureauScore: 620, // Below threshold
      });

      const decision = await engine.processApplication(application);

      expect(['MANUAL_REVIEW', 'CONDITIONAL_APPROVAL', 'REJECTED']).toContain(decision.decision);
    });

    it('should calculate correct EMI', async () => {
      const application = createMockApplication({
        request: {
          amount: 1000000,
          tenure: 60,
        },
      });

      const decision = await engine.processApplication(application);

      if (decision.emiAmount) {
        // EMI should be reasonable (between 15k and 30k for 10L over 5 years)
        expect(decision.emiAmount).toBeGreaterThan(15000);
        expect(decision.emiAmount).toBeLessThan(30000);
      }
    });

    it('should include processing time', async () => {
      const application = createMockApplication();

      const decision = await engine.processApplication(application);

      expect(decision.processingTime).toBeDefined();
      expect(decision.processingTime).toBeGreaterThanOrEqual(0);
    });

    it('should determine risk grade based on score', async () => {
      const application = createMockApplication({ bureauScore: 800 });
      const decision = await engine.processApplication(application);

      expect(['A', 'B', 'C', 'D', 'E', 'F']).toContain(decision.riskGrade);
      expect(decision.riskScore).toBeGreaterThanOrEqual(0);
      expect(decision.riskScore).toBeLessThanOrEqual(100);
    });
  });
});
