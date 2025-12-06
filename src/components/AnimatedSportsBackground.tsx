import React from 'react';
import { Box, keyframes } from '@mui/material';
import {
  SportsBasketball,
  SportsSoccer,
  SportsFootball,
  SportsVolleyball,
  SportsTennis,
  SportsHockey,
  FitnessCenter,
  DirectionsRun,
  Pool,
  SportsHandball,
  SportsCricket,
  SportsBaseball,
} from '@mui/icons-material';

// Keyframe animations for different movement patterns
const floatAnimation1 = keyframes`
  0% {
    transform: translate(0, 0) rotate(0deg) scale(1);
    opacity: 0.3;
  }
  25% {
    transform: translate(100px, -50px) rotate(5deg) scale(1.1);
    opacity: 0.5;
  }
  50% {
    transform: translate(200px, 0px) rotate(-5deg) scale(1);
    opacity: 0.3;
  }
  75% {
    transform: translate(100px, 50px) rotate(5deg) scale(0.9);
    opacity: 0.4;
  }
  100% {
    transform: translate(0, 0) rotate(0deg) scale(1);
    opacity: 0.3;
  }
`;

const floatAnimation2 = keyframes`
  0% {
    transform: translate(0, 0) rotate(0deg) scale(1);
    opacity: 0.2;
  }
  33% {
    transform: translate(-80px, 60px) rotate(-8deg) scale(1.15);
    opacity: 0.4;
  }
  66% {
    transform: translate(80px, -60px) rotate(8deg) scale(0.85);
    opacity: 0.3;
  }
  100% {
    transform: translate(0, 0) rotate(0deg) scale(1);
    opacity: 0.2;
  }
`;

const floatAnimation3 = keyframes`
  0% {
    transform: translate(0, 0) rotate(0deg) scale(1);
    opacity: 0.25;
  }
  50% {
    transform: translate(150px, 100px) rotate(10deg) scale(1.2);
    opacity: 0.45;
  }
  100% {
    transform: translate(0, 0) rotate(0deg) scale(1);
    opacity: 0.25;
  }
`;

const slideAnimation = keyframes`
  0% {
    transform: translateX(-100%);
    opacity: 0;
  }
  10% {
    opacity: 0.3;
  }
  90% {
    opacity: 0.3;
  }
  100% {
    transform: translateX(100vw);
    opacity: 0;
  }
`;

const bounceAnimation = keyframes`
  0%, 100% {
    transform: translateY(0) scale(1);
    opacity: 0.3;
  }
  50% {
    transform: translateY(-80px) scale(1.1);
    opacity: 0.5;
  }
`;

interface AnimatedSportsBackgroundProps {
  variant?: 'full' | 'minimal' | 'subtle';
}

const AnimatedSportsBackground: React.FC<AnimatedSportsBackgroundProps> = ({ 
  variant = 'full' 
}) => {
  // Sports icons array
  const sportsIcons = [
    { Icon: SportsBasketball, color: '#ff6b35' },
    { Icon: SportsSoccer, color: '#00f5ff' },
    { Icon: SportsFootball, color: '#4ecdc4' },
    { Icon: SportsVolleyball, color: '#ffe66d' },
    { Icon: SportsTennis, color: '#a8dadc' },
    { Icon: SportsHockey, color: '#f1faee' },
    { Icon: FitnessCenter, color: '#00f5ff' },
    { Icon: DirectionsRun, color: '#0080ff' },
    { Icon: Pool, color: '#4cc9f0' },
    { Icon: SportsHandball, color: '#f72585' },
    { Icon: SportsCricket, color: '#7209b7' },
    { Icon: SportsBaseball, color: '#3a0ca3' },
  ];

  const getOpacity = () => {
    switch (variant) {
      case 'minimal': return 0.4;
      case 'subtle': return 0.6;
      default: return 0.8;
    }
  };

  const getCount = () => {
    switch (variant) {
      case 'minimal': return 3;
      case 'subtle': return 5;
      default: return 8;
    }
  };

  const iconCount = variant === 'minimal' ? 12 : variant === 'subtle' ? 18 : 25;
  
  const sportsElements = Array.from({ length: iconCount }, (_, i) => ({
    id: i,
    icon: sportsIcons[i % sportsIcons.length],
    size: 60 + Math.random() * 100, // Larger icons
    top: Math.random() * 100,
    left: Math.random() * 100,
    animationDuration: 10 + Math.random() * 20,
    animationDelay: Math.random() * 8,
    animationType: ['float1', 'float2', 'float3', 'slide', 'bounce'][Math.floor(Math.random() * 5)],
    rotation: Math.random() * 360,
  }));

  const getAnimation = (type: string) => {
    switch (type) {
      case 'float1': return floatAnimation1;
      case 'float2': return floatAnimation2;
      case 'float3': return floatAnimation3;
      case 'slide': return slideAnimation;
      case 'bounce': return bounceAnimation;
      default: return floatAnimation1;
    }
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: getOpacity(),
      }}
    >
      {/* Animated gradient background */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(ellipse at 20% 30%, rgba(0, 245, 255, 0.25) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 70%, rgba(0, 128, 255, 0.25) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(138, 43, 226, 0.2) 0%, transparent 50%)
          `,
          animation: `${floatAnimation1} 30s ease-in-out infinite`,
        }}
      />

      {/* Animated sports icons */}
      {sportsElements.map((element) => {
        const IconComponent = element.icon.Icon;
        return (
          <Box
            key={element.id}
            sx={{
              position: 'absolute',
              top: `${element.top}%`,
              left: `${element.left}%`,
              animation: `${getAnimation(element.animationType)} ${element.animationDuration}s ease-in-out infinite`,
              animationDelay: `${element.animationDelay}s`,
              opacity: 0.7, // More visible
              transform: `rotate(${element.rotation}deg)`,
              filter: `drop-shadow(0 0 25px ${element.icon.color})`, // Stronger glow
            }}
          >
            <IconComponent
              sx={{
                fontSize: element.size,
                color: element.icon.color,
                opacity: 0.9, // More opaque
              }}
            />
          </Box>
        );
      })}

      {/* Sport equipment particles */}
      {Array.from({ length: 20 }).map((_, i) => {
        const shapes = ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏑', '🏏', '🏓', '🥊', '🏋️', '🤸', '🏃', '🚴', '🏊'];
        return (
          <Box
            key={`particle-${i}`}
            sx={{
              position: 'absolute',
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              fontSize: 30 + Math.random() * 50, // Larger emojis
              animation: `${floatAnimation2} ${10 + Math.random() * 20}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
              opacity: 0.6, // More visible
              filter: 'drop-shadow(0 0 15px rgba(0, 245, 255, 0.8))', // Stronger glow
            }}
          >
            {shapes[i % shapes.length]}
          </Box>
        );
      })}

      {/* Sport text elements */}
      {variant === 'full' && (
        <>
          {['TRAIN', 'COMPETE', 'WIN', 'PERFORM', 'EXCEL', 'ACHIEVE'].map((text, i) => (
            <Box
              key={`text-${i}`}
              sx={{
                position: 'absolute',
                top: `${15 + i * 15}%`,
                left: `${i % 2 === 0 ? 5 : 75}%`,
                fontSize: 70 + Math.random() * 50, // Larger text
                fontWeight: 900,
                color: 'transparent',
                WebkitTextStroke: '2px rgba(0, 245, 255, 0.4)', // Thicker, more visible stroke
                textStroke: '2px rgba(0, 245, 255, 0.4)',
                animation: `${floatAnimation1} ${20 + i * 3}s ease-in-out infinite`,
                animationDelay: `${i * 2}s`,
                opacity: 0.5, // More visible
                transform: `rotate(${-15 + i * 5}deg)`,
                userSelect: 'none',
                pointerEvents: 'none',
                textShadow: '0 0 30px rgba(0, 245, 255, 0.5)', // Add glow
              }}
            >
              {text}
            </Box>
          ))}
        </>
      )}

      {/* Large featured sports icons */}
      {[
        { Icon: SportsBasketball, top: 10, left: 10, color: '#ff6b35', size: 150 },
        { Icon: SportsSoccer, top: 20, right: 10, color: '#00f5ff', size: 180 },
        { Icon: FitnessCenter, bottom: 15, left: 15, color: '#4ecdc4', size: 160 },
        { Icon: DirectionsRun, top: 50, left: 5, color: '#ffe66d', size: 140 },
        { Icon: SportsVolleyball, bottom: 20, right: 15, color: '#f72585', size: 170 },
      ].map((item, i) => {
        const IconComponent = item.Icon;
        return (
          <Box
            key={`featured-${i}`}
            sx={{
              position: 'absolute',
              top: item.top ? `${item.top}%` : 'auto',
              bottom: item.bottom ? `${item.bottom}%` : 'auto',
              left: item.left ? `${item.left}%` : 'auto',
              right: item.right ? `${item.right}%` : 'auto',
              animation: `${bounceAnimation} ${15 + i * 3}s ease-in-out infinite`,
              animationDelay: `${i * 1.5}s`,
              opacity: 0.4,
              filter: `drop-shadow(0 0 40px ${item.color})`,
            }}
          >
            <IconComponent
              sx={{
                fontSize: item.size,
                color: item.color,
                opacity: 0.8,
              }}
            />
          </Box>
        );
      })}

      {/* Grid pattern overlay */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            linear-gradient(rgba(0, 245, 255, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 245, 255, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          animation: `${slideAnimation} 60s linear infinite`,
        }}
      />
    </Box>
  );
};

export default AnimatedSportsBackground;
