/**
 * Common Fixes - Export all fix implementations
 */

export { BuildFailedFix } from './build-failed-fix';
export { DatabaseConnectionFix } from './database-connection-fix';
export { PortInUseFix } from './port-in-use-fix';
export { MissingEnvVarFix } from './missing-env-var-fix';
export { ServiceCrashedFix } from './service-crashed-fix';

// Convenience array of all fixes
import { BuildFailedFix } from './build-failed-fix';
import { DatabaseConnectionFix } from './database-connection-fix';
import { PortInUseFix } from './port-in-use-fix';
import { MissingEnvVarFix } from './missing-env-var-fix';
import { ServiceCrashedFix } from './service-crashed-fix';

export const ALL_FIXES = [
  new BuildFailedFix(),
  new DatabaseConnectionFix(),
  new ServiceCrashedFix(),
  new PortInUseFix(),
  new MissingEnvVarFix()
];
