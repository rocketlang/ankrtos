/**
 * Channel Badge - Visual indicator for message channel
 */

import { Mail, MessageCircle, Hash, Users, Globe, Ticket } from 'lucide-react';

type Channel = 'email' | 'whatsapp' | 'slack' | 'teams' | 'webchat' | 'ticket' | 'sms';

interface ChannelBadgeProps {
  channel: Channel;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function ChannelBadge({ channel, size = 'md', showLabel = false }: ChannelBadgeProps) {
  const config = {
    email: {
      icon: Mail,
      label: 'Email',
      color: 'bg-blue-100 text-blue-700',
      iconColor: 'text-blue-600',
    },
    whatsapp: {
      icon: MessageCircle,
      label: 'WhatsApp',
      color: 'bg-green-100 text-green-700',
      iconColor: 'text-green-600',
    },
    slack: {
      icon: Hash,
      label: 'Slack',
      color: 'bg-purple-100 text-purple-700',
      iconColor: 'text-purple-600',
    },
    teams: {
      icon: Users,
      label: 'Teams',
      color: 'bg-indigo-100 text-indigo-700',
      iconColor: 'text-indigo-600',
    },
    webchat: {
      icon: Globe,
      label: 'Web Chat',
      color: 'bg-pink-100 text-pink-700',
      iconColor: 'text-pink-600',
    },
    ticket: {
      icon: Ticket,
      label: 'Ticket',
      color: 'bg-orange-100 text-orange-700',
      iconColor: 'text-orange-600',
    },
    sms: {
      icon: MessageCircle,
      label: 'SMS',
      color: 'bg-gray-100 text-gray-700',
      iconColor: 'text-gray-600',
    },
  };

  const { icon: Icon, label, color, iconColor } = config[channel];

  const sizes = {
    sm: { icon: 'w-3 h-3', padding: 'p-1', text: 'text-xs' },
    md: { icon: 'w-4 h-4', padding: 'p-1.5', text: 'text-sm' },
    lg: { icon: 'w-5 h-5', padding: 'p-2', text: 'text-base' },
  };

  if (showLabel) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full ${color} ${sizes[size].text} font-medium`}>
        <Icon className={sizes[size].icon} />
        <span>{label}</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center justify-center rounded-full ${color} ${sizes[size].padding}`} title={label}>
      <Icon className={sizes[size].icon} />
    </span>
  );
}
