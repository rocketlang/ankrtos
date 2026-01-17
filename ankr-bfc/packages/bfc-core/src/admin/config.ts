/**
 * BFC Admin Panel Configuration
 *
 * Centralized configuration for admin dashboards, modules, and features
 * Integrates with @ankr/iam for role-based access
 */

// =============================================================================
// ADMIN PANEL TYPES
// =============================================================================

export interface AdminPanelConfig {
  // Branding
  branding: BrandingConfig;

  // Navigation
  navigation: NavigationConfig;

  // Modules
  modules: ModuleConfig[];

  // Access Control
  accessControl: AccessControlConfig;

  // Dashboard
  dashboard: DashboardConfig;

  // Features
  features: FeatureFlags;

  // Integrations
  integrations: IntegrationConfig;
}

export interface BrandingConfig {
  appName: string;
  logo: string;
  favicon: string;
  primaryColor: string;
  secondaryColor: string;
  theme: 'light' | 'dark' | 'auto';
  customCss?: string;
}

export interface NavigationConfig {
  position: 'side' | 'top';
  collapsed: boolean;
  showSearch: boolean;
  showNotifications: boolean;
  showUserMenu: boolean;
  quickActions: QuickAction[];
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  action: string; // Route or action ID
  permission?: string;
}

export interface ModuleConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  route: string;
  enabled: boolean;
  permissions: string[];
  subModules?: SubModuleConfig[];
  badge?: { type: 'count' | 'status'; value: string | number };
}

export interface SubModuleConfig {
  id: string;
  name: string;
  route: string;
  permissions: string[];
}

export interface AccessControlConfig {
  roles: RoleConfig[];
  defaultRole: string;
  superAdminRole: string;
  permissions: PermissionConfig[];
}

export interface RoleConfig {
  id: string;
  name: string;
  description: string;
  level: number; // Higher = more access
  permissions: string[];
  isSystem: boolean;
}

export interface PermissionConfig {
  id: string;
  name: string;
  description: string;
  module: string;
  actions: string[];
}

export interface DashboardConfig {
  layout: 'grid' | 'list' | 'custom';
  widgets: WidgetConfig[];
  refreshInterval: number; // seconds
}

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  size: 'small' | 'medium' | 'large' | 'full';
  position: { row: number; col: number };
  dataSource: string;
  refreshInterval?: number;
  permissions?: string[];
  config?: Record<string, any>;
}

export type WidgetType =
  | 'metric'
  | 'chart'
  | 'table'
  | 'list'
  | 'map'
  | 'calendar'
  | 'activity'
  | 'alerts'
  | 'custom';

export interface FeatureFlags {
  // Core Features
  multiTenant: boolean;
  auditLogging: boolean;
  dataExport: boolean;
  bulkOperations: boolean;
  advancedSearch: boolean;

  // Communication
  inAppNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;

  // AI Features
  aiAssistant: boolean;
  predictiveAnalytics: boolean;
  documentAI: boolean;

  // Security
  mfaRequired: boolean;
  ipWhitelist: boolean;
  sessionRecording: boolean;

  // Integrations
  webhooks: boolean;
  apiAccess: boolean;
  ssoEnabled: boolean;
}

export interface IntegrationConfig {
  // ANKR Services
  eon: { enabled: boolean; endpoint: string };
  aiProxy: { enabled: boolean; endpoint: string };
  complymitra: { enabled: boolean; endpoint: string };

  // External Services
  sms: { provider: string; enabled: boolean };
  email: { provider: string; enabled: boolean };
  storage: { provider: string; bucket: string };

  // Analytics
  analytics: { provider: string; trackingId: string };
}

// =============================================================================
// DEFAULT BFC ADMIN CONFIGURATION
// =============================================================================

export const DEFAULT_ADMIN_CONFIG: AdminPanelConfig = {
  branding: {
    appName: 'BFC Admin',
    logo: '/assets/logo.svg',
    favicon: '/assets/favicon.ico',
    primaryColor: '#1E40AF',
    secondaryColor: '#3B82F6',
    theme: 'light',
  },

  navigation: {
    position: 'side',
    collapsed: false,
    showSearch: true,
    showNotifications: true,
    showUserMenu: true,
    quickActions: [
      { id: 'new-customer', label: 'New Customer', icon: 'user-plus', action: '/customers/new', permission: 'customers.create' },
      { id: 'new-application', label: 'New Application', icon: 'file-plus', action: '/applications/new', permission: 'applications.create' },
      { id: 'support-ticket', label: 'Support Ticket', icon: 'ticket', action: '/support/new', permission: 'support.create' },
    ],
  },

  modules: [
    // Dashboard
    {
      id: 'dashboard',
      name: 'Dashboard',
      description: 'Overview and KPIs',
      icon: 'layout-dashboard',
      route: '/dashboard',
      enabled: true,
      permissions: ['dashboard.view'],
    },

    // Customer Management
    {
      id: 'customers',
      name: 'Customers',
      description: 'Customer 360 management',
      icon: 'users',
      route: '/customers',
      enabled: true,
      permissions: ['customers.view'],
      subModules: [
        { id: 'customer-list', name: 'All Customers', route: '/customers', permissions: ['customers.view'] },
        { id: 'customer-segments', name: 'Segments', route: '/customers/segments', permissions: ['customers.segments'] },
        { id: 'customer-kyc', name: 'KYC Pending', route: '/customers/kyc', permissions: ['customers.kyc'] },
        { id: 'customer-churn', name: 'Churn Risk', route: '/customers/churn', permissions: ['customers.churn'] },
      ],
    },

    // Credit & Loans
    {
      id: 'credit',
      name: 'Credit',
      description: 'Loan applications and decisions',
      icon: 'credit-card',
      route: '/credit',
      enabled: true,
      permissions: ['credit.view'],
      subModules: [
        { id: 'applications', name: 'Applications', route: '/credit/applications', permissions: ['credit.applications'] },
        { id: 'decisions', name: 'Decisions', route: '/credit/decisions', permissions: ['credit.decisions'] },
        { id: 'portfolio', name: 'Portfolio', route: '/credit/portfolio', permissions: ['credit.portfolio'] },
        { id: 'npa', name: 'NPA Monitoring', route: '/credit/npa', permissions: ['credit.npa'] },
      ],
    },

    // Offers & Campaigns
    {
      id: 'campaigns',
      name: 'Campaigns',
      description: 'Marketing campaigns and offers',
      icon: 'megaphone',
      route: '/campaigns',
      enabled: true,
      permissions: ['campaigns.view'],
      subModules: [
        { id: 'campaign-list', name: 'All Campaigns', route: '/campaigns', permissions: ['campaigns.view'] },
        { id: 'offers', name: 'Offers', route: '/campaigns/offers', permissions: ['campaigns.offers'] },
        { id: 'analytics', name: 'Analytics', route: '/campaigns/analytics', permissions: ['campaigns.analytics'] },
      ],
    },

    // Compliance
    {
      id: 'compliance',
      name: 'Compliance',
      description: 'AML, KYC, and regulatory',
      icon: 'shield-check',
      route: '/compliance',
      enabled: true,
      permissions: ['compliance.view'],
      subModules: [
        { id: 'aml-alerts', name: 'AML Alerts', route: '/compliance/aml', permissions: ['compliance.aml'] },
        { id: 'str-reports', name: 'STR Reports', route: '/compliance/str', permissions: ['compliance.str'] },
        { id: 'ctr-reports', name: 'CTR Reports', route: '/compliance/ctr', permissions: ['compliance.ctr'] },
        { id: 'audit-log', name: 'Audit Log', route: '/compliance/audit', permissions: ['compliance.audit'] },
      ],
    },

    // DocChain
    {
      id: 'documents',
      name: 'Documents',
      description: 'Document management with chain-of-custody',
      icon: 'files',
      route: '/documents',
      enabled: true,
      permissions: ['documents.view'],
      subModules: [
        { id: 'all-docs', name: 'All Documents', route: '/documents', permissions: ['documents.view'] },
        { id: 'regulatory', name: 'Regulatory', route: '/documents/regulatory', permissions: ['documents.regulatory'] },
        { id: 'reports', name: 'Reports', route: '/documents/reports', permissions: ['documents.reports'] },
        { id: 'pending-approval', name: 'Pending Approval', route: '/documents/pending', permissions: ['documents.approve'] },
      ],
    },

    // HRMS
    {
      id: 'hrms',
      name: 'HR & Payroll',
      description: 'Staff management',
      icon: 'building-2',
      route: '/hrms',
      enabled: true,
      permissions: ['hrms.view'],
      subModules: [
        { id: 'employees', name: 'Employees', route: '/hrms/employees', permissions: ['hrms.employees'] },
        { id: 'attendance', name: 'Attendance', route: '/hrms/attendance', permissions: ['hrms.attendance'] },
        { id: 'leave', name: 'Leave', route: '/hrms/leave', permissions: ['hrms.leave'] },
        { id: 'payroll', name: 'Payroll', route: '/hrms/payroll', permissions: ['hrms.payroll'] },
      ],
    },

    // CRM
    {
      id: 'crm',
      name: 'CRM',
      description: 'Customer relationships',
      icon: 'heart-handshake',
      route: '/crm',
      enabled: true,
      permissions: ['crm.view'],
      subModules: [
        { id: 'leads', name: 'Leads', route: '/crm/leads', permissions: ['crm.leads'] },
        { id: 'opportunities', name: 'Opportunities', route: '/crm/opportunities', permissions: ['crm.opportunities'] },
        { id: 'activities', name: 'Activities', route: '/crm/activities', permissions: ['crm.activities'] },
      ],
    },

    // Analytics
    {
      id: 'analytics',
      name: 'Analytics',
      description: 'Reports and insights',
      icon: 'chart-bar',
      route: '/analytics',
      enabled: true,
      permissions: ['analytics.view'],
      subModules: [
        { id: 'dashboards', name: 'Dashboards', route: '/analytics/dashboards', permissions: ['analytics.dashboards'] },
        { id: 'reports', name: 'Reports', route: '/analytics/reports', permissions: ['analytics.reports'] },
        { id: 'exports', name: 'Data Export', route: '/analytics/exports', permissions: ['analytics.exports'] },
      ],
    },

    // Settings
    {
      id: 'settings',
      name: 'Settings',
      description: 'System configuration',
      icon: 'settings',
      route: '/settings',
      enabled: true,
      permissions: ['settings.view'],
      subModules: [
        { id: 'general', name: 'General', route: '/settings/general', permissions: ['settings.general'] },
        { id: 'users', name: 'Users', route: '/settings/users', permissions: ['settings.users'] },
        { id: 'roles', name: 'Roles', route: '/settings/roles', permissions: ['settings.roles'] },
        { id: 'integrations', name: 'Integrations', route: '/settings/integrations', permissions: ['settings.integrations'] },
        { id: 'notifications', name: 'Notifications', route: '/settings/notifications', permissions: ['settings.notifications'] },
      ],
    },
  ],

  accessControl: {
    defaultRole: 'staff',
    superAdminRole: 'super_admin',
    roles: [
      {
        id: 'super_admin',
        name: 'Super Admin',
        description: 'Full system access',
        level: 100,
        permissions: ['*'],
        isSystem: true,
      },
      {
        id: 'admin',
        name: 'Admin',
        description: 'Administrative access',
        level: 90,
        permissions: [
          'dashboard.*', 'customers.*', 'credit.*', 'campaigns.*',
          'compliance.*', 'documents.*', 'hrms.*', 'crm.*',
          'analytics.*', 'settings.view', 'settings.users', 'settings.roles',
        ],
        isSystem: true,
      },
      {
        id: 'compliance_officer',
        name: 'Compliance Officer',
        description: 'Compliance and AML access',
        level: 80,
        permissions: [
          'dashboard.view', 'customers.view', 'customers.kyc',
          'compliance.*', 'documents.*', 'analytics.view', 'analytics.reports',
        ],
        isSystem: true,
      },
      {
        id: 'risk_manager',
        name: 'Risk Manager',
        description: 'Risk and credit access',
        level: 80,
        permissions: [
          'dashboard.view', 'customers.view', 'customers.churn',
          'credit.*', 'compliance.aml', 'analytics.*',
        ],
        isSystem: true,
      },
      {
        id: 'branch_manager',
        name: 'Branch Manager',
        description: 'Branch-level access',
        level: 70,
        permissions: [
          'dashboard.view', 'customers.*', 'credit.view', 'credit.applications',
          'campaigns.view', 'hrms.view', 'hrms.attendance', 'hrms.leave',
          'crm.*', 'analytics.view',
        ],
        isSystem: true,
      },
      {
        id: 'relationship_manager',
        name: 'Relationship Manager',
        description: 'Customer relationship access',
        level: 60,
        permissions: [
          'dashboard.view', 'customers.view', 'customers.kyc',
          'credit.view', 'credit.applications', 'campaigns.view',
          'crm.*', 'analytics.view',
        ],
        isSystem: true,
      },
      {
        id: 'staff',
        name: 'Staff',
        description: 'Basic staff access',
        level: 50,
        permissions: [
          'dashboard.view', 'customers.view',
          'credit.view', 'campaigns.view',
        ],
        isSystem: true,
      },
      {
        id: 'auditor',
        name: 'Auditor',
        description: 'Read-only audit access',
        level: 40,
        permissions: [
          'dashboard.view', 'customers.view', 'credit.view',
          'compliance.view', 'compliance.audit', 'documents.view',
          'analytics.view', 'analytics.reports',
        ],
        isSystem: true,
      },
    ],
    permissions: [
      // Dashboard
      { id: 'dashboard.view', name: 'View Dashboard', description: 'Access main dashboard', module: 'dashboard', actions: ['view'] },

      // Customers
      { id: 'customers.view', name: 'View Customers', description: 'View customer list', module: 'customers', actions: ['view'] },
      { id: 'customers.create', name: 'Create Customers', description: 'Create new customers', module: 'customers', actions: ['create'] },
      { id: 'customers.edit', name: 'Edit Customers', description: 'Edit customer details', module: 'customers', actions: ['edit'] },
      { id: 'customers.delete', name: 'Delete Customers', description: 'Delete customers', module: 'customers', actions: ['delete'] },
      { id: 'customers.kyc', name: 'Manage KYC', description: 'Manage customer KYC', module: 'customers', actions: ['view', 'edit'] },
      { id: 'customers.segments', name: 'Manage Segments', description: 'Manage customer segments', module: 'customers', actions: ['view', 'edit'] },
      { id: 'customers.churn', name: 'View Churn Risk', description: 'View churn risk analysis', module: 'customers', actions: ['view'] },

      // Credit
      { id: 'credit.view', name: 'View Credit', description: 'View credit module', module: 'credit', actions: ['view'] },
      { id: 'credit.applications', name: 'Manage Applications', description: 'Manage loan applications', module: 'credit', actions: ['view', 'edit'] },
      { id: 'credit.decisions', name: 'Make Decisions', description: 'Make credit decisions', module: 'credit', actions: ['view', 'edit', 'approve'] },
      { id: 'credit.portfolio', name: 'View Portfolio', description: 'View loan portfolio', module: 'credit', actions: ['view'] },
      { id: 'credit.npa', name: 'Manage NPA', description: 'Manage NPA accounts', module: 'credit', actions: ['view', 'edit'] },

      // Compliance
      { id: 'compliance.view', name: 'View Compliance', description: 'View compliance module', module: 'compliance', actions: ['view'] },
      { id: 'compliance.aml', name: 'Manage AML', description: 'Manage AML alerts', module: 'compliance', actions: ['view', 'edit'] },
      { id: 'compliance.str', name: 'Manage STR', description: 'Manage STR reports', module: 'compliance', actions: ['view', 'create', 'submit'] },
      { id: 'compliance.ctr', name: 'Manage CTR', description: 'Manage CTR reports', module: 'compliance', actions: ['view', 'create', 'submit'] },
      { id: 'compliance.audit', name: 'View Audit Log', description: 'View audit logs', module: 'compliance', actions: ['view'] },

      // Documents
      { id: 'documents.view', name: 'View Documents', description: 'View documents', module: 'documents', actions: ['view'] },
      { id: 'documents.create', name: 'Create Documents', description: 'Upload documents', module: 'documents', actions: ['create'] },
      { id: 'documents.approve', name: 'Approve Documents', description: 'Approve documents', module: 'documents', actions: ['approve'] },
      { id: 'documents.regulatory', name: 'Regulatory Docs', description: 'Access regulatory documents', module: 'documents', actions: ['view', 'create', 'submit'] },
      { id: 'documents.reports', name: 'Generate Reports', description: 'Generate reports', module: 'documents', actions: ['view', 'create'] },

      // HRMS
      { id: 'hrms.view', name: 'View HRMS', description: 'View HRMS module', module: 'hrms', actions: ['view'] },
      { id: 'hrms.employees', name: 'Manage Employees', description: 'Manage employees', module: 'hrms', actions: ['view', 'create', 'edit'] },
      { id: 'hrms.attendance', name: 'Manage Attendance', description: 'Manage attendance', module: 'hrms', actions: ['view', 'edit'] },
      { id: 'hrms.leave', name: 'Manage Leave', description: 'Manage leave', module: 'hrms', actions: ['view', 'approve'] },
      { id: 'hrms.payroll', name: 'Manage Payroll', description: 'Process payroll', module: 'hrms', actions: ['view', 'process'] },

      // CRM
      { id: 'crm.view', name: 'View CRM', description: 'View CRM module', module: 'crm', actions: ['view'] },
      { id: 'crm.leads', name: 'Manage Leads', description: 'Manage leads', module: 'crm', actions: ['view', 'create', 'edit'] },
      { id: 'crm.opportunities', name: 'Manage Opportunities', description: 'Manage opportunities', module: 'crm', actions: ['view', 'create', 'edit'] },
      { id: 'crm.activities', name: 'Log Activities', description: 'Log activities', module: 'crm', actions: ['view', 'create'] },

      // Analytics
      { id: 'analytics.view', name: 'View Analytics', description: 'View analytics', module: 'analytics', actions: ['view'] },
      { id: 'analytics.dashboards', name: 'Custom Dashboards', description: 'Create dashboards', module: 'analytics', actions: ['view', 'create'] },
      { id: 'analytics.reports', name: 'Generate Reports', description: 'Generate reports', module: 'analytics', actions: ['view', 'create'] },
      { id: 'analytics.exports', name: 'Export Data', description: 'Export data', module: 'analytics', actions: ['export'] },

      // Settings
      { id: 'settings.view', name: 'View Settings', description: 'View settings', module: 'settings', actions: ['view'] },
      { id: 'settings.general', name: 'General Settings', description: 'Manage general settings', module: 'settings', actions: ['view', 'edit'] },
      { id: 'settings.users', name: 'Manage Users', description: 'Manage users', module: 'settings', actions: ['view', 'create', 'edit', 'delete'] },
      { id: 'settings.roles', name: 'Manage Roles', description: 'Manage roles', module: 'settings', actions: ['view', 'create', 'edit', 'delete'] },
      { id: 'settings.integrations', name: 'Manage Integrations', description: 'Manage integrations', module: 'settings', actions: ['view', 'edit'] },
      { id: 'settings.notifications', name: 'Notification Settings', description: 'Manage notifications', module: 'settings', actions: ['view', 'edit'] },
    ],
  },

  dashboard: {
    layout: 'grid',
    refreshInterval: 60,
    widgets: [
      {
        id: 'total-customers',
        type: 'metric',
        title: 'Total Customers',
        size: 'small',
        position: { row: 1, col: 1 },
        dataSource: '/api/metrics/customers/total',
      },
      {
        id: 'active-applications',
        type: 'metric',
        title: 'Active Applications',
        size: 'small',
        position: { row: 1, col: 2 },
        dataSource: '/api/metrics/applications/active',
      },
      {
        id: 'approval-rate',
        type: 'metric',
        title: 'Approval Rate',
        size: 'small',
        position: { row: 1, col: 3 },
        dataSource: '/api/metrics/credit/approval-rate',
      },
      {
        id: 'aml-alerts',
        type: 'metric',
        title: 'AML Alerts',
        size: 'small',
        position: { row: 1, col: 4 },
        dataSource: '/api/metrics/compliance/aml-alerts',
        permissions: ['compliance.aml'],
      },
      {
        id: 'application-trend',
        type: 'chart',
        title: 'Application Trend',
        size: 'medium',
        position: { row: 2, col: 1 },
        dataSource: '/api/metrics/applications/trend',
        config: { chartType: 'line', period: '30d' },
      },
      {
        id: 'portfolio-distribution',
        type: 'chart',
        title: 'Portfolio Distribution',
        size: 'medium',
        position: { row: 2, col: 3 },
        dataSource: '/api/metrics/credit/distribution',
        config: { chartType: 'pie' },
      },
      {
        id: 'recent-activities',
        type: 'activity',
        title: 'Recent Activities',
        size: 'medium',
        position: { row: 3, col: 1 },
        dataSource: '/api/activities/recent',
      },
      {
        id: 'compliance-alerts',
        type: 'alerts',
        title: 'Compliance Alerts',
        size: 'medium',
        position: { row: 3, col: 3 },
        dataSource: '/api/alerts/compliance',
        permissions: ['compliance.view'],
      },
    ],
  },

  features: {
    multiTenant: true,
    auditLogging: true,
    dataExport: true,
    bulkOperations: true,
    advancedSearch: true,
    inAppNotifications: true,
    emailNotifications: true,
    smsNotifications: true,
    aiAssistant: true,
    predictiveAnalytics: true,
    documentAI: true,
    mfaRequired: true,
    ipWhitelist: false,
    sessionRecording: true,
    webhooks: true,
    apiAccess: true,
    ssoEnabled: true,
  },

  integrations: {
    eon: { enabled: true, endpoint: 'http://localhost:4005' },
    aiProxy: { enabled: true, endpoint: 'http://localhost:4444' },
    complymitra: { enabled: true, endpoint: 'http://localhost:4015' },
    sms: { provider: 'msg91', enabled: true },
    email: { provider: 'ses', enabled: true },
    storage: { provider: 's3', bucket: 'bfc-documents' },
    analytics: { provider: 'mixpanel', trackingId: '' },
  },
};

// =============================================================================
// ADMIN PANEL SERVICE
// =============================================================================

export class AdminPanelService {
  private config: AdminPanelConfig;

  constructor(config: AdminPanelConfig = DEFAULT_ADMIN_CONFIG) {
    this.config = config;
  }

  getConfig(): AdminPanelConfig {
    return this.config;
  }

  updateConfig(updates: Partial<AdminPanelConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  // Navigation
  getNavigationForRole(roleId: string): ModuleConfig[] {
    const role = this.config.accessControl.roles.find(r => r.id === roleId);
    if (!role) return [];

    return this.config.modules.filter(module => {
      if (!module.enabled) return false;
      return this.hasPermission(role.permissions, module.permissions);
    }).map(module => ({
      ...module,
      subModules: module.subModules?.filter(sub =>
        this.hasPermission(role.permissions, sub.permissions)
      ),
    }));
  }

  // Permissions
  hasPermission(userPermissions: string[], requiredPermissions: string[]): boolean {
    if (userPermissions.includes('*')) return true;
    return requiredPermissions.some(req => {
      if (userPermissions.includes(req)) return true;
      // Check wildcard (e.g., 'customers.*' matches 'customers.view')
      const [module] = req.split('.');
      return userPermissions.includes(`${module}.*`);
    });
  }

  checkAccess(userId: string, roleId: string, permission: string): boolean {
    const role = this.config.accessControl.roles.find(r => r.id === roleId);
    if (!role) return false;
    return this.hasPermission(role.permissions, [permission]);
  }

  // Dashboard
  getDashboardWidgetsForRole(roleId: string): WidgetConfig[] {
    const role = this.config.accessControl.roles.find(r => r.id === roleId);
    if (!role) return [];

    return this.config.dashboard.widgets.filter(widget => {
      if (!widget.permissions) return true;
      return this.hasPermission(role.permissions, widget.permissions);
    });
  }

  // Modules
  isModuleEnabled(moduleId: string): boolean {
    const module = this.config.modules.find(m => m.id === moduleId);
    return module?.enabled ?? false;
  }

  enableModule(moduleId: string): void {
    const module = this.config.modules.find(m => m.id === moduleId);
    if (module) module.enabled = true;
  }

  disableModule(moduleId: string): void {
    const module = this.config.modules.find(m => m.id === moduleId);
    if (module) module.enabled = false;
  }

  // Features
  isFeatureEnabled(feature: keyof FeatureFlags): boolean {
    return this.config.features[feature] ?? false;
  }

  toggleFeature(feature: keyof FeatureFlags, enabled: boolean): void {
    this.config.features[feature] = enabled;
  }

  // Roles
  getRoles(): RoleConfig[] {
    return this.config.accessControl.roles;
  }

  getRole(roleId: string): RoleConfig | undefined {
    return this.config.accessControl.roles.find(r => r.id === roleId);
  }

  createRole(role: Omit<RoleConfig, 'isSystem'>): RoleConfig {
    const newRole: RoleConfig = { ...role, isSystem: false };
    this.config.accessControl.roles.push(newRole);
    return newRole;
  }

  updateRole(roleId: string, updates: Partial<RoleConfig>): RoleConfig | undefined {
    const role = this.config.accessControl.roles.find(r => r.id === roleId);
    if (role && !role.isSystem) {
      Object.assign(role, updates);
    }
    return role;
  }

  deleteRole(roleId: string): boolean {
    const index = this.config.accessControl.roles.findIndex(
      r => r.id === roleId && !r.isSystem
    );
    if (index >= 0) {
      this.config.accessControl.roles.splice(index, 1);
      return true;
    }
    return false;
  }
}

// Factory
export function createAdminPanelService(config?: AdminPanelConfig): AdminPanelService {
  return new AdminPanelService(config);
}

export default AdminPanelService;
