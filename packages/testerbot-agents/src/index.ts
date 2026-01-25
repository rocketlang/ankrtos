/**
 * @ankr/testerbot-agents
 * Test agents for desktop, web, and mobile platforms
 */

export * from './base-agent';
export * from './desktop-agent';
export * from './web-agent';
export * from './mobile-agent';
export * from './visual-regression';

export { TestAgent } from './base-agent';
export { DesktopTestAgent } from './desktop-agent';
export { WebTestAgent } from './web-agent';
export { MobileTestAgent } from './mobile-agent';
export { VisualRegression } from './visual-regression';
export type { DesktopAgentConfig } from './desktop-agent';
export type { WebAgentConfig, BrowserType } from './web-agent';
export type { MobileAgentConfig, PlatformType } from './mobile-agent';
export type { VisualRegressionConfig } from './visual-regression';
