import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Award } from 'lucide-react';

const getBadgeColor = (badge) => {
  const colors = {
    none: '#9CA3AF',
    bronze: '#CD7F32',
    silver: '#C0C0C0',
    gold: '#FFD700',
    diamond: '#B9F2FF',
    platinum: '#E5E4E2'
  };
  return colors[badge] || colors.none;
};

const BadgeProgressBar = ({ currentBadge, totalSales, badgeConfig }) => {
  const badgeTiers = ['none', 'bronze', 'silver', 'gold', 'diamond', 'platinum'];
  const currentIndex = badgeTiers.indexOf(currentBadge || 'none');
  const nextBadge = currentIndex < badgeTiers.length - 1 ? badgeTiers[currentIndex + 1] : null;

  if (!nextBadge || !badgeConfig[nextBadge]) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Badge Progress</span>
          <Badge style={{ backgroundColor: getBadgeColor(currentBadge) }} className="text-white">
            <Award className="w-3 h-3 mr-1" />
            {(currentBadge || 'none').toUpperCase()} (MAX)
          </Badge>
        </div>
        <div className="text-sm text-gray-500">Maximum badge tier reached!</div>
      </div>
    );
  }

  const currentThreshold = badgeConfig[currentBadge]?.minSales || 0;
  const nextThreshold = badgeConfig[nextBadge].minSales;
  const progress = Math.min(
    100,
    Math.round(((totalSales - currentThreshold) / (nextThreshold - currentThreshold)) * 100)
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">Badge Progress</span>
        <span className="text-gray-600">{progress}% to {nextBadge.toUpperCase()}</span>
      </div>
      <div className="flex items-center gap-3">
        <Badge style={{ backgroundColor: getBadgeColor(currentBadge) }} className="text-white">
          <Award className="w-3 h-3 mr-1" />
          {(currentBadge || 'none').toUpperCase()}
        </Badge>
        <Progress value={progress} className="flex-1" />
        <Badge style={{ backgroundColor: getBadgeColor(nextBadge) }} className="text-white opacity-50">
          <Award className="w-3 h-3 mr-1" />
          {nextBadge.toUpperCase()}
        </Badge>
      </div>
      <div className="text-xs text-gray-500">
        {totalSales} / {nextThreshold} sales (need {nextThreshold - totalSales} more)
      </div>
    </div>
  );
};

export default BadgeProgressBar;
