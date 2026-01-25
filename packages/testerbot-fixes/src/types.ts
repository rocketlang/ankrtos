/**
 * TesterBot Fixes - Core Types
 */

/**
 * Represents a single action taken during a fix attempt
 */
export interface FixAction {
  type: string;           // e.g., "restart-service", "clear-cache", "install-dependency"
  description: string;    // Human-readable description
  command?: string;       // Shell command executed (if any)
  timestamp: number;      // When the action was taken
  success: boolean;       // Whether the action succeeded
  output?: string;        // Command output or result
  error?: string;         // Error message if failed
}

/**
 * State snapshot for rollback
 */
export interface FixState {
  timestamp: number;
  description: string;
  data: Record<string, any>;  // Flexible state data
}

/**
 * Result of a fix attempt
 */
export interface AutoFixResult {
  fixId: string;                  // ID of the fix that was attempted
  fixName: string;                // Human-readable name
  success: boolean;               // Overall success/failure
  applied: boolean;               // Whether fix was actually applied
  verified: boolean;              // Whether fix was verified
  duration: number;               // Time taken in milliseconds
  actions: FixAction[];           // List of actions taken
  error?: string;                 // Error message if failed
  rollbackAvailable: boolean;     // Whether rollback is possible
  verificationDetails?: string;   // Details about verification
}

/**
 * Context about the test failure that needs fixing
 */
export interface FailureContext {
  testId: string;
  testName: string;
  errorMessage: string;
  errorStack?: string;
  app: string;
  environment: string;
  timestamp: number;
  retryCount: number;
}

/**
 * Fix interface - all auto-fix implementations must follow this
 */
export interface Fix {
  id: string;                     // Unique fix ID (e.g., "fix-build-failed")
  name: string;                   // Human-readable name
  description: string;            // What this fix does
  category: string;               // Category (build, service, network, etc.)
  tags: string[];                 // Tags for filtering
  priority: number;               // Higher = run first (0-100)

  /**
   * Check if this fix applies to the given failure
   */
  canFix(context: FailureContext): boolean;

  /**
   * Apply the fix
   */
  apply(context: FailureContext): Promise<AutoFixResult>;

  /**
   * Verify the fix worked (by re-running the test or checking conditions)
   */
  verify(context: FailureContext): Promise<boolean>;

  /**
   * Rollback the fix if verification failed
   */
  rollback(context: FailureContext): Promise<void>;

  /**
   * Optional: save state before applying fix (for rollback)
   */
  saveState?(context: FailureContext): Promise<FixState>;

  /**
   * Optional: restore state (rollback)
   */
  restoreState?(state: FixState): Promise<void>;
}

/**
 * Fix registry entry
 */
export interface FixRegistryEntry {
  fix: Fix;
  metadata: {
    registeredAt: number;
    timesApplied: number;
    timesSucceeded: number;
    timesFailed: number;
    averageDuration: number;
  };
}
