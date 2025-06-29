import React, { useRef } from 'react';
import Chip, { ChipProps } from '@mui/material/Chip';
import { styled, keyframes } from '@mui/material/styles';

const pulseAnim = keyframes`
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0,0,0,0.12); }
  50% { transform: scale(1.12); box-shadow: 0 0 8px 4px rgba(0,0,0,0.18); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0,0,0,0); }
`;

const AnimatedChip = styled(Chip, {
  shouldForwardProp: (prop) => prop !== 'pulse' && prop !== 'isActive' && prop !== 'animationKey',
})<{ pulse?: boolean; isActive?: boolean; animationKey?: number }>(({ pulse, isActive, animationKey }) => ({
  transition: 'opacity 0.3s',
  opacity: isActive ? 1 : 0.5,
  ...(pulse && {
    animation: `${pulseAnim} 0.5s cubic-bezier(.4,2,.6,1)`,
    animationName: `${pulseAnim}-${animationKey}`,
  }),
}));

export type AnimatedStatusChipProps = ChipProps & {
  pulse?: boolean;
  isActive?: boolean;
  icon?: React.ReactNode;
};

const AnimatedStatusChip: React.FC<AnimatedStatusChipProps> = ({ pulse = false, isActive = true, icon, ...props }) => {
  // Use a ref to store a unique animation key that updates when pulse goes true
  const animationKeyRef = useRef<number>(0);
  React.useEffect(() => {
    if (pulse) {
      animationKeyRef.current = Date.now();
    }
  }, [pulse]);

  return (
    <AnimatedChip
      {...props}
      pulse={pulse}
      isActive={isActive}
      animationKey={animationKeyRef.current}
      icon={icon ? (
        <span style={{ display: 'flex', alignItems: 'center', marginRight: 2 }}>{icon}</span>
      ) : undefined}
    />
  );
};

export default AnimatedStatusChip; 