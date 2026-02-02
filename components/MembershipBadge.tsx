
import React from 'react';
import { Crown, Diamond, Star, Zap } from 'lucide-react';
import { MembershipTier } from '../types';
import { MEMBERSHIP_CONFIG } from '../lib/membership';

interface MembershipBadgeProps {
  tier: MembershipTier;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  animated?: boolean;
}

const MembershipBadge: React.FC<MembershipBadgeProps> = ({ 
  tier, 
  size = 'md', 
  showLabel = true,
  animated = false
}) => {
  const config = MEMBERSHIP_CONFIG[tier];
  
  const sizeClasses = {
    sm: { container: 'px-2 py-0.5 text-xs gap-1', icon: 12 },
    md: { container: 'px-3 py-1 text-sm gap-1.5', icon: 14 },
    lg: { container: 'px-4 py-1.5 text-base gap-2', icon: 18 },
    xl: { container: 'px-5 py-2 text-lg gap-2.5', icon: 22 }
  };
  
  const sizeClass = sizeClasses[size];
  
  // 根据图标名称返回对应组件
  const getIcon = () => {
    const iconProps = { 
      size: sizeClass.icon, 
      className: tier === 'free' ? 'text-gray-500' : 'text-white'
    };
    
    switch (config.icon) {
      case 'Crown': return <Crown {...iconProps} />;
      case 'Diamond': return <Diamond {...iconProps} />;
      case 'Star': return <Star {...iconProps} />;
      case 'Zap': return <Zap {...iconProps} />;
      default: return <Star {...iconProps} />;
    }
  };
  
  return (
    <span 
      className={`
        inline-flex items-center rounded-full font-bold 
        ${config.color} 
        ${sizeClass.container}
        ${animated ? 'animate-pulse' : ''}
        ${tier !== 'free' ? 'shadow-lg' : ''}
      `}
    >
      {getIcon()}
      {showLabel && <span>{config.badge}</span>}
    </span>
  );
};

// 会员等级进度条组件
interface MembershipProgressProps {
  current: number;
  target: number;
  tier: MembershipTier;
  size?: 'sm' | 'md' | 'lg';
}

export const MembershipProgress: React.FC<MembershipProgressProps> = ({
  current,
  target,
  tier,
  size = 'md'
}) => {
  const progress = Math.min(100, (current / target) * 100);
  const isComplete = current >= target;
  
  const heightClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };
  
  return (
    <div className="w-full">
      <div className={`bg-gray-200 rounded-full overflow-hidden ${heightClasses[size]}`}>
        <div 
          className={`
            h-full rounded-full transition-all duration-500 ease-out
            ${isComplete 
              ? 'bg-gradient-to-r from-amber-500 to-orange-500' 
              : 'bg-gradient-to-r from-blue-500 to-cyan-500'
            }
          `}
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between mt-1 text-xs text-gray-500">
        <span>{current} 门</span>
        <span>{target} 门</span>
      </div>
    </div>
  );
};

export default MembershipBadge;
