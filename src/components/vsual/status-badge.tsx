'use client';

import { Badge } from '@/components/ui/badge';

/**
 * Status Badge
 *
 * Uses shadcn Badge to display automation status indicators
 * with appropriate colors for each status type.
 */

type StatusType = 'success' | 'skipped' | 'error' | 'unknown' | 'tracked';

interface StatusBadgeProps {
  status: StatusType;
}

const statusConfig: Record<StatusType, { className: string; label: string }> = {
  success: {
    className: 'bg-[#34C759]/10 text-[#34C759] border-transparent',
    label: 'Sent',
  },
  tracked: {
    className: 'bg-[#007AFF]/10 text-[#007AFF] border-transparent',
    label: 'Tracked',
  },
  skipped: {
    className: 'bg-[#FF9500]/10 text-[#FF9500] border-transparent',
    label: 'Skipped',
  },
  error: {
    className: 'bg-[#FF3B30]/10 text-[#FF3B30] border-transparent',
    label: 'Error',
  },
  unknown: {
    className: 'bg-[#86868B]/10 text-[#86868B] border-transparent',
    label: 'Unknown',
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const cfg = statusConfig[status] || statusConfig.unknown;

  return (
    <Badge className={cfg.className}>
      {cfg.label}
    </Badge>
  );
}
