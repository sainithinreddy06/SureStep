import React, { useEffect, useRef } from 'react';
import { Footprints, Shield, Compass, Mountain, AlertCircle } from 'lucide-react';

interface MovingBackcountryBackgroundProps {
  className?: string;
}

export const MovingBackcountryBackground: React.FC<MovingBackcountryBackgroundProps> = ({
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Dynamic canvas for smooth moving topographic contours & scanning particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Particle nodes representing AI terrain mesh points
    interface TerrainNode {
      x: number;
      y: number;
      vx: number;
      vy: number;
      stability: number; // 0 to 1
      size: number;
    }

    const nodes: TerrainNode[] = [];
    const NODE_COUNT = 36;
    for (let i = 0; i < NODE_COUNT; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: 0.3 + Math.random() * 0.45, // steady downward moving flow (hiker stepping forward)
        stability: 0.7 + Math.random() * 0.3,
        size: 2 + Math.random() * 2
      });
    }

    let scanY = 0;
    let scanDirection = 1;
    let time = 0;

    const render = () => {
      time += 0.015;
      ctx.clearRect(0, 0, width, height);

      // 1. Draw flowing animated topographic elevation contour waves
      ctx.lineWidth = 1;
      const waveCount = 5;
      for (let w = 0; w < waveCount; w++) {
        ctx.beginPath();
        const baseElevation = height * 0.3 + w * 90;
        ctx.strokeStyle = `rgba(16, 185, 129, ${0.06 - w * 0.008})`; // emerald glow

        for (let x = 0; x <= width; x += 30) {
          const wave1 = Math.sin(x * 0.003 + time + w) * 28;
          const wave2 = Math.cos(x * 0.007 - time * 0.7) * 16;
          const y = baseElevation + wave1 + wave2;

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      // 2. Draw Moving LiDAR / Radar Scan line
      scanY += scanDirection * 1.2;
      if (scanY > height) {
        scanY = height;
        scanDirection = -1;
      } else if (scanY < 0) {
        scanY = 0;
        scanDirection = 1;
      }

      const scanGrad = ctx.createLinearGradient(0, scanY - 40, 0, scanY + 40);
      scanGrad.addColorStop(0, 'rgba(16, 185, 129, 0)');
      scanGrad.addColorStop(0.5, 'rgba(16, 185, 129, 0.12)');
      scanGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');
      ctx.fillStyle = scanGrad;
      ctx.fillRect(0, scanY - 40, width, 80);

      ctx.beginPath();
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.moveTo(0, scanY);
      ctx.lineTo(width, scanY);
      ctx.stroke();

      // 3. Draw Moving AI Terrain Mesh & Safe Footing Points
      nodes.forEach((node, idx) => {
        node.x += node.vx;
        node.y += node.vy;

        // Wrap around when moving past screen bottom (forward motion)
        if (node.y > height + 20) {
          node.y = -20;
          node.x = Math.random() * width;
        }
        if (node.x < 0) node.x = width;
        if (node.x > width) node.x = 0;

        // Draw node
        ctx.beginPath();
        const isStable = node.stability > 0.8;
        ctx.fillStyle = isStable ? 'rgba(52, 211, 153, 0.45)' : 'rgba(251, 191, 36, 0.35)';
        ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
        ctx.fill();

        // Connect nearby nodes with subtle triangulated mesh lines
        for (let j = idx + 1; j < nodes.length; j++) {
          const other = nodes[j];
          const dist = Math.hypot(node.x - other.x, node.y - other.y);
          if (dist < 110) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(16, 185, 129, ${(1 - dist / 110) * 0.12})`;
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Dynamic Moving Alpine Terrain Image Layer with continuous forward/lateral motion */}
      <div className="absolute -inset-[8%] w-[116%] h-[116%] animate-mountain-motion">
        <img
          src="/src/assets/images/forest_peak_1790697377835.jpg"
          alt="Moving Backcountry Mountain Trail"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center filter brightness-[0.7] contrast-[1.15]"
        />
      </div>

      {/* Real-time HTML5 Topographic & AI Terrain Mesh Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-80" />

      {/* Floating Tactical Project Elements moving in the background */}
      {/* 1. Moving AR Footstep Placement Beacons */}
      <div className="absolute top-[28%] left-[12%] animate-float-slow hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-950/80 border border-emerald-500/40 text-[10px] font-mono text-emerald-300 backdrop-blur-md shadow-lg shadow-emerald-950/50">
        <Footprints className="w-3.5 h-3.5 text-emerald-400" />
        <span>STEP CONFIDENCE 96% · SOLID BEDROCK</span>
      </div>

      <div className="absolute top-[48%] right-[14%] animate-float-delayed hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-950/80 border border-emerald-500/40 text-[10px] font-mono text-emerald-300 backdrop-blur-md shadow-lg shadow-emerald-950/50">
        <Shield className="w-3.5 h-3.5 text-emerald-400" />
        <span>SLOPE STABILITY: OPTIMAL (11.2°)</span>
      </div>

      <div className="absolute bottom-[22%] left-[18%] animate-float-slow hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-stone-950/80 border border-amber-500/40 text-[10px] font-mono text-amber-300 backdrop-blur-md shadow-lg">
        <AlertCircle className="w-3 h-3 text-amber-400" />
        <span>AVOID LOOSE TALUS CHUTE (EAST)</span>
      </div>

      {/* Tactical Compass & Altimeter HUD Stamp */}
      <div className="absolute top-20 right-8 hidden xl:flex flex-col items-end gap-1 text-[10px] font-mono text-stone-500 select-none">
        <div className="flex items-center gap-1 text-emerald-400/80">
          <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '40s' }} />
          <span>NAV 328° NW · FIX: SATELLITE 3D</span>
        </div>
        <div className="text-stone-400/60">
          TERRAGUARD LiDAR ACTIVE MESH
        </div>
      </div>

      {/* Multilayered Cinematic Vignette Gradients (Dark center & borders for 100% crystal text readability) */}
      <div className="absolute inset-0 bg-gradient-to-b from-stone-950/90 via-stone-950/65 to-stone-950/95" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(12,10,9,0.3)_0%,rgba(12,10,9,0.85)_75%,rgba(12,10,9,0.98)_100%)]" />
    </div>
  );
};
