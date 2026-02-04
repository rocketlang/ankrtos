/**
 * WhatsApp Bot Menu Configuration
 *
 * ADD TO: Sidebar under "Operations" or "System" menu
 *
 * RECOMMENDATION:
 * - Operations → For daily use (conversations, quick actions)
 * - System → For admin/setup (provider config, analytics)
 */

export const WHATSAPP_MENU_ITEMS = {
  // Main menu item
  main: {
    label: 'WhatsApp Bot',
    icon: '📱',
    path: '/whatsapp-admin',
    badge: 'NEW',
  },

  // Sub-items
  items: [
    {
      label: 'Live Conversations',
      labelHi: 'लाइव चैट',
      icon: '💬',
      path: '/whatsapp-admin',
      description: 'Monitor all WhatsApp conversations',
    },
    {
      label: 'Bot Demo',
      labelHi: 'बॉट डेमो',
      icon: '🤖',
      path: '/whatsapp-demo',
      description: 'Test the bot without actual WhatsApp',
    },
    {
      label: 'Analytics',
      labelHi: 'एनालिटिक्स',
      icon: '📊',
      path: '/whatsapp-analytics',
      description: 'Message stats, conversion rates',
    },
    {
      label: 'Settings',
      labelHi: 'सेटिंग्स',
      icon: '⚙️',
      path: '/whatsapp-settings',
      description: 'Provider config, templates',
    },
  ],

  // Placement recommendation
  placement: {
    recommended: 'Operations', // For WowTruck
    alternative: 'System',     // For admin-focused view
    position: 'after:fleet',   // After Fleet menu
  },
};

/**
 * WHERE TO ADD IN WOWTRUCK:
 *
 * OPERATIONS Menu (for daily ops team):
 * ├── Trips
 * ├── Fleet
 * ├── Drivers
 * └── 📱 WhatsApp Bot ← ADD HERE
 *     ├── Live Conversations
 *     ├── Bot Demo
 *     └── Analytics
 *
 * OR
 *
 * SYSTEM Menu (for admins):
 * ├── Settings
 * ├── Users
 * └── 📱 WhatsApp Bot ← ADD HERE
 *     ├── Live Conversations
 *     ├── Bot Demo
 *     ├── Analytics
 *     └── Provider Settings
 */

export default WHATSAPP_MENU_ITEMS;
