import React, { useEffect, useState } from 'react';

/**
 * FintechCosmicBackground
 *
 * Immersive FinTech cosmic dual-sphere motion system:
 * - Upper Celestial Sphere:
 *   - Luminous magenta, fuchsia (#D946EF, #C026D3, #F472B6)
 *   - Scroll-synchronized rotation & subtle vertical drift
 * - Lower Celestial Sphere:
 *   - Luminous electric blue, royal cobalt, neon cyan (#2563EB, #38BDF8, #60A5FA)
 *   - Counter-movement and horizon compression
 * - Central Luminous Horizon Flare:
 *   - Atmospheric waistline with breathing pulses
 * - GPU-accelerated transforms & prefers-reduced-motion safe
 */
export const FintechCosmicBackground: React.FC = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Detect reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleMediaChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    mediaQuery.addEventListener('change', handleMediaChange);

    // Scroll progress handler with requestAnimationFrame throttling
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
          const currentProgress = totalScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / totalScroll)) : 0;
          setScrollProgress(currentProgress);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Compute smooth transform styles if motion is enabled
  const upperSphereTransform = prefersReducedMotion
    ? 'translate3d(-50%, 0, 0)'
    : `translate3d(-50%, ${scrollProgress * -70}px, 0) rotate(${scrollProgress * 24}deg)`;

  const lowerSphereTransform = prefersReducedMotion
    ? 'translate3d(-50%, 0, 0)'
    : `translate3d(-50%, ${scrollProgress * -110}px, 0) rotate(${scrollProgress * -18}deg)`;

  const flareOpacity = prefersReducedMotion
    ? 0.45
    : 0.38 + Math.sin(scrollProgress * Math.PI) * 0.22;

  return (
    <div 
      aria-hidden="true" 
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#070B20] select-none"
    >
      {/* 1. DEEP FOUNDATION VIGNETTE */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 45%, #0B1233 0%, #070B20 60%, #030612 100%)'
        }}
      />

      {/* 2. CENTRAL AMBIENT HORIZON FLARE */}
      <div 
        className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300"
        style={{ opacity: flareOpacity }}
      >
        {/* Luminous magenta/violet horizon beam */}
        <div 
          className="absolute w-[110vw] max-w-[1800px] h-[360px] rounded-full blur-[110px] -translate-y-10"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(217, 70, 239, 0.48) 0%, rgba(192, 38, 211, 0.28) 45%, rgba(7, 11, 32, 0) 75%)'
          }}
        />
        {/* Luminous electric cobalt/cyan horizon beam */}
        <div 
          className="absolute w-[105vw] max-w-[1700px] h-[380px] rounded-full blur-[105px] translate-y-14"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(37, 99, 235, 0.52) 0%, rgba(56, 189, 248, 0.32) 48%, rgba(7, 11, 32, 0) 75%)'
          }}
        />
      </div>

      {/* 3. UPPER CELESTIAL SPHERE (MAGENTA / FUCHSIA / PINK DOME) */}
      <div 
        className="absolute left-1/2 w-[150vw] max-w-[2100px] h-[105vh] flex items-end justify-center will-change-transform transition-transform duration-75 ease-out"
        style={{
          top: '-34vh',
          transform: upperSphereTransform,
        }}
      >
        <div 
          className="w-full h-full rounded-[50%] relative"
          style={{
            background: 'radial-gradient(ellipse at 50% 25%, #0D163F 0%, #070B20 74%, #040716 100%)',
            boxShadow: `
              0 32px 115px 35px rgba(217, 70, 239, 0.46),
              0 14px 50px 16px rgba(192, 38, 211, 0.65),
              0 4px 22px 5px rgba(244, 114, 182, 0.88),
              inset 0 -14px 34px rgba(192, 38, 211, 0.45)
            `,
            borderBottom: '2.5px solid rgba(245, 208, 254, 0.95)',
          }}
        >
          {/* Internal specular ambient glow along the bottom rim */}
          <div 
            className="absolute inset-x-0 bottom-0 h-[85px] rounded-b-[50%] pointer-events-none"
            style={{
              background: 'linear-gradient(to top, rgba(217, 70, 239, 0.28) 0%, rgba(192, 38, 211, 0.08) 60%, transparent 100%)'
            }}
          />
        </div>
      </div>

      {/* 4. LOWER CELESTIAL SPHERE (ELECTRIC BLUE / CYAN / SKY DOME) */}
      <div 
        className="absolute left-1/2 w-[150vw] max-w-[2100px] h-[105vh] flex items-start justify-center will-change-transform transition-transform duration-75 ease-out"
        style={{
          top: '70vh',
          transform: lowerSphereTransform,
        }}
      >
        <div 
          className="w-full h-full rounded-[50%] relative"
          style={{
            background: 'radial-gradient(ellipse at 50% 75%, #0A1336 0%, #070B20 74%, #040716 100%)',
            boxShadow: `
              0 -32px 115px 35px rgba(37, 99, 235, 0.48),
              0 -14px 50px 16px rgba(56, 189, 248, 0.70),
              0 -4px 22px 5px rgba(125, 211, 252, 0.92),
              inset 0 14px 34px rgba(59, 130, 246, 0.45)
            `,
            borderTop: '2.5px solid rgba(186, 230, 253, 0.95)',
          }}
        >
          {/* Internal specular ambient glow along the top rim */}
          <div 
            className="absolute inset-x-0 top-0 h-[85px] rounded-t-[50%] pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, rgba(56, 189, 248, 0.26) 0%, rgba(37, 99, 235, 0.08) 60%, transparent 100%)'
            }}
          />
        </div>
      </div>

      {/* Subtle fine cosmic star-dust texture */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none mix-blend-screen"
        style={{
          backgroundImage: 'radial-gradient(1px 1px at 20px 30px, #ffffff, rgba(0,0,0,0)), radial-gradient(1.5px 1.5px at 100px 150px, #38BDF8, rgba(0,0,0,0)), radial-gradient(1px 1px at 240px 80px, #D946EF, rgba(0,0,0,0))',
          backgroundSize: '300px 300px'
        }}
      />
    </div>
  );
};
