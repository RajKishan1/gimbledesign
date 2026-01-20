import React, { useEffect, useRef } from "react";

interface HeroGlobeBackgroundProps {
  theme: "dark" | "light";
}

const HeroGlobeBackground: React.FC<HeroGlobeBackgroundProps> = ({ theme = "dark" }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let time = 0;
    const animationSpeed = 0.02; // Slightly increased for smoother, more noticeable animation

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      ctx.scale(dpr, dpr);
    };

    const drawGlobe = (
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number,
      currentTime: number
    ) => {
      // Theme colors
      const isDark = theme === "dark";
      const bgColor = isDark ? "#0a0a0a" : "#f8f9fa";
      const primaryColor = isDark ? [160, 160, 180] : [60, 70, 90];
      const waveColor = isDark ? [100, 100, 220] : [90, 100, 130];
      const highlightColor = isDark ? [140, 140, 240] : [140, 150, 180];

      // Clear with background
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, width, height);

      // Responsive globe sizing
      const centerX = width / 2;
      const centerY = height * 0.45;
      const baseRadius = Math.min(width, height) * 0.35;
      const radius = Math.max(250, Math.min(baseRadius, 450));

      // Draw full globe with improved stippling and enhanced rotation animation
      const gridRes = 2; // Finer grid for smoother appearance
      const rotationOffset = currentTime * 15; // Increased speed for more noticeable globe rotation

      for (let lat = -90; lat <= 90; lat += gridRes) {
        const y = -Math.sin((lat * Math.PI) / 180) * radius;
        const r = Math.cos((lat * Math.PI) / 180) * radius;

        for (let lon = -180; lon <= 180; lon += gridRes) {
          const rotatedLon = lon + rotationOffset;
          const x = Math.cos((rotatedLon * Math.PI) / 180) * r;
          const z = Math.sin((rotatedLon * Math.PI) / 180) * r;

          // Normal vector
          const nx = x / radius;
          const ny = y / radius;
          const nz = z / radius;

          // Improved lighting with multiple sources
          const topLight = Math.max(0, -ny * 0.7 + nz * 0.6);
          const sideLight = Math.max(0, nx * 0.4 + nz * 0.3);
          const ambient = 0.2;
          const lighting = ambient + topLight * 0.6 + sideLight * 0.4;

          // Distance fade from center
          const dist = Math.sqrt(x * x + y * y);
          const distFade = Math.pow(1 - dist / radius, 1.5);

          // Subtle grid-like pattern
          const pattern =
            (Math.sin((rotatedLon * Math.PI) / 20) * 0.1 +
             Math.sin((lat * Math.PI) / 15) * 0.1 +
             0.8);

          const opacity = lighting * distFade * pattern * (isDark ? 0.8 : 0.65);

          if (opacity > 0.05 && z > 0) { // Only front-facing points for efficiency
            ctx.fillStyle = `rgba(${primaryColor[0]}, ${primaryColor[1]}, ${primaryColor[2]}, ${opacity})`;
            ctx.fillRect(centerX + x, centerY + y, 1.2, 1.2);
          }
        }
      }

      // Draw animated flowing waves at bottom with improved fluidity
      const waveHeight = radius * 0.6; // Slightly taller waves
      const waveWidth = radius * 2.5;
      const particleCount = Math.min(12000, width * 8); // More particles for density

      for (let i = 0; i < particleCount; i++) {
        const px = (i / particleCount - 0.5) * waveWidth * 2; // Deterministic placement
        const depth = (i % 100) / 100; // Layered depths

        // Animated waves with smoother motion
        const t = px * 0.008 + currentTime * 1.2; // Slightly faster wave animation for improvement
        const wave1 = Math.sin(t * 2.2 + depth * Math.PI) * 40;
        const wave2 = Math.sin(t * 3.5 - depth * Math.PI * 0.7) * 25;
        const wave3 = Math.sin(t * 1.6 + depth * Math.PI * 1.3) * 30;
        const wave4 = Math.cos(t * 3.0 - depth * Math.PI * 0.5) * 20;

        const waveY = wave1 + wave2 + wave3 + wave4;
        const py = depth * waveHeight + waveY + radius * 0.1; // Offset to below globe

        // Improved opacity with better fading
        const xFade = 1 - Math.pow(Math.abs(px) / (waveWidth * 0.5), 2.2);
        const yFade = Math.pow(1 - py / waveHeight, 0.8);
        const waveDensity = (Math.sin(t * 2.2) + Math.sin(t * 3.5) + 2) / 4;

        let opacity = xFade * yFade * waveDensity * (isDark ? 0.7 : 0.55);

        if (opacity > 0.08 && py >= 0 && py < waveHeight) {
          const size = 0.8 + waveDensity * 1.2;
          ctx.fillStyle = `rgba(${waveColor[0]}, ${waveColor[1]}, ${waveColor[2]}, ${opacity})`;
          ctx.beginPath();
          ctx.arc(centerX + px, centerY + py, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Improved wave highlights with animation
      const highlightCount = Math.min(2000, width * 2);
      for (let i = 0; i < highlightCount; i++) {
        const px = (i / highlightCount - 0.5) * waveWidth * 2;
        const t = px * 0.008 + currentTime * 1.2; // Match wave speed

        const wave1 = Math.sin(t * 2.2) * 40;
        const wave2 = Math.sin(t * 3.5) * 25;
        const peakY = wave1 + wave2;

        const py = peakY + radius * 0.1 + (Math.sin(t * 5) * 5); // Small vertical oscillation

        const xFade = 1 - Math.pow(Math.abs(px) / (waveWidth * 0.5), 2.8);
        const peakness = Math.pow(Math.abs(Math.sin(t * 2.2) * Math.sin(t * 3.5)), 0.7);

        const opacity = xFade * peakness * (isDark ? 0.75 : 0.55);

        if (opacity > 0.2 && py >= 0 && py < waveHeight) {
          const size = 1.0 + peakness * 1.5;
          ctx.fillStyle = `rgba(${highlightColor[0]}, ${highlightColor[1]}, ${highlightColor[2]}, ${opacity})`;
          ctx.beginPath();
          ctx.arc(centerX + px, centerY + py, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Globe outline with subtle antialiasing
      ctx.strokeStyle = isDark ? "rgba(10, 10, 10, 0.35)" : "rgba(80, 90, 110, 0.45)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();

    //   Enhanced glow effect
      const glowGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        radius * 0.8,
        centerX,
        centerY,
        radius * 1.4
      );
      const glowColor = isDark ? "rgba(100, 100, 120, 0.12)" : "rgba(120, 130, 150, 0.08)";
      glowGradient.addColorStop(0, glowColor);
      glowGradient.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.4, 0, Math.PI * 2);
      ctx.fill();
    };

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      drawGlobe(ctx, rect.width, rect.height, time);
      time += animationSpeed;
      animationRef.current = requestAnimationFrame(animate);
    };

    resizeCanvas();
    animate();
    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [theme]);

  return (
    <div
      className={`relative min-h-[140%] w-full overflow-hidden ${theme === "dark" ? "bg-[#0a0a0a]" : "bg-gray-50"}`}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};

export default HeroGlobeBackground;