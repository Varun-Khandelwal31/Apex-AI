'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Zap } from 'lucide-react';

export interface CornerMistake {
  id: string;
  corner_name: string;
  turn_number: number;
  severity: 'red' | 'green';
  description: string;
  time_lost: number;
  cx: number;
  cy: number;
}

interface TrackMapSVGProps {
  mistakes: CornerMistake[];
  selectedCorner?: string | null;
  onSelectCorner?: (corner: CornerMistake) => void;
  driverLapProgress?: number; // 0 to 1
  ghostLapProgress?: number;  // 0 to 1
}

export default function TrackMapSVG({
  mistakes,
  selectedCorner,
  onSelectCorner,
  driverLapProgress = 0,
  ghostLapProgress = 0,
}: TrackMapSVGProps) {
  const [hoveredCorner, setHoveredCorner] = useState<CornerMistake | null>(null);

  const pathRef = useRef<SVGPathElement>(null);
  const [driverCoord, setDriverCoord] = useState({ x: 180, y: 350 });
  const [ghostCoord, setGhostCoord] = useState({ x: 180, y: 350 });
  const [lapProgress, setLapProgress] = useState(0);

  // Monaco SVG track path definition (viewBox 0 0 500 400)
  const trackPath = `
    M 180,350 
    C 240,350 320,350 380,340 
    C 410,335 440,310 435,270 
    C 430,230 400,200 370,160 
    C 350,135 340,100 350,70 
    C 360,40 330,25 300,30 
    C 260,35 240,65 210,95 
    C 180,125 150,135 125,140 
    C 90,145 60,160 55,190 
    C 50,225 80,250 110,260 
    C 140,270 145,290 135,315 
    C 125,340 140,350 180,350 Z
  `;

  // Continuous lap animation loop
  useEffect(() => {
    let animId: number;
    let startTime: number | null = null;
    const lapDurationMs = 12000; // 12 second lap loop

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = (timestamp - startTime) % lapDurationMs;
      const progress = elapsed / lapDurationMs;
      setLapProgress(progress);

      if (pathRef.current) {
        const totalLen = pathRef.current.getTotalLength();

        // Driver Car position (Red)
        const driverPoint = pathRef.current.getPointAtLength((progress % 1) * totalLen);
        setDriverCoord({ x: driverPoint.x, y: driverPoint.y });

        // Ghost Car position (Neon Green - slightly ahead on sector exits)
        const ghostProgress = (progress * 1.04) % 1;
        const ghostPoint = pathRef.current.getPointAtLength(ghostProgress * totalLen);
        setGhostCoord({ x: ghostPoint.x, y: ghostPoint.y });
      }

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-4">
      {/* Header & Legend */}
      <div className="flex items-center justify-between z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
            <h3 className="text-sm font-mono font-bold text-gray-200 uppercase">
              CIRCUIT DE MONACO - GHOST RACE ENGINE
            </h3>
          </div>
          <p className="text-xs text-gray-400 font-mono mt-0.5">
            Driver (Red) vs Theoretical Perfect Lap (Neon Green)
          </p>
        </div>

        {/* Live Car Legend */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="flex items-center gap-1.5 text-red-400 font-bold">
            <span className="w-3 h-3 rounded-full bg-red-600 border border-white glow-red"></span>
            Driver Car (VER)
          </span>
          <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <span className="w-3 h-3 rounded-full bg-[#39FF14] border border-white glow-green"></span>
            Ghost Car (Perfect)
          </span>
        </div>
      </div>

      {/* SVG Circuit Canvas */}
      <div className="relative w-full h-64 md:h-72 my-2 flex items-center justify-center">
        <svg
          viewBox="0 0 500 400"
          className="w-full h-full max-h-72 overflow-visible drop-shadow-[0_0_15px_rgba(225,6,0,0.15)]"
        >
          <defs>
            <filter id="glowRed" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glowGreen" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Track Glow */}
          <path
            d={trackPath}
            fill="none"
            stroke="#E10600"
            strokeWidth="12"
            strokeOpacity="0.12"
          />

          {/* Main Track Path (Reference for getPointAtLength) */}
          <path
            ref={pathRef}
            d={trackPath}
            fill="none"
            stroke="#1F2029"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Inner Neon Dashed Track Line */}
          <path
            d={trackPath}
            fill="none"
            stroke="#00F0FF"
            strokeWidth="2"
            strokeDasharray="6 4"
            strokeOpacity="0.8"
          />

          {/* Start/Finish Line */}
          <line x1="180" y1="335" x2="180" y2="365" stroke="#FFFFFF" strokeWidth="3" />
          <text x="185" y="375" fill="#AAAAAA" fontSize="10" fontFamily="monospace">
            START / FINISH
          </text>

          {/* Pulsing Corner Mistake Overlay Nodes */}
          {mistakes.map((m) => {
            const isRed = m.severity === 'red';
            const isSelected = selectedCorner === m.id;

            return (
              <g
                key={m.id}
                className="cursor-pointer transition-transform duration-300 hover:scale-125"
                onClick={() => onSelectCorner && onSelectCorner(m)}
                onMouseEnter={() => setHoveredCorner(m)}
                onMouseLeave={() => setHoveredCorner(null)}
              >
                <circle
                  cx={m.cx}
                  cy={m.cy}
                  r={isSelected ? 14 : 10}
                  className={isRed ? 'pulse-corner-red' : 'pulse-corner-green'}
                />
                <circle
                  cx={m.cx}
                  cy={m.cy}
                  r="4"
                  fill={isRed ? '#FFFFFF' : '#000000'}
                />
                <text
                  x={m.cx + 12}
                  y={m.cy + 4}
                  fill={isRed ? '#FF4D4D' : '#39FF14'}
                  fontSize="11"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  T{m.turn_number}
                </text>
              </g>
            );
          })}

          {/* 🏎️ GHOST CAR DOT (NEON GREEN #39FF14) */}
          <g transform={`translate(${ghostCoord.x}, ${ghostCoord.y})`}>
            {/* Outer Pulsing Aura */}
            <circle r="12" fill="#39FF14" fillOpacity="0.25" className="animate-ping" />
            {/* Main Ghost Car Dot */}
            <circle r="7" fill="#39FF14" stroke="#FFFFFF" strokeWidth="1.5" filter="url(#glowGreen)" />
            <text x="10" y="-8" fill="#39FF14" fontSize="9" fontWeight="bold" fontFamily="monospace">
              GHOST
            </text>
          </g>

          {/* 🏎️ DRIVER CAR DOT (NEON RED #E10600) */}
          <g transform={`translate(${driverCoord.x}, ${driverCoord.y})`}>
            {/* Outer Pulsing Aura */}
            <circle r="12" fill="#E10600" fillOpacity="0.3" className="animate-ping" />
            {/* Main Driver Car Dot */}
            <circle r="7.5" fill="#E10600" stroke="#FFFFFF" strokeWidth="1.5" filter="url(#glowRed)" />
            <text x="10" y="14" fill="#FF1E27" fontSize="9" fontWeight="bold" fontFamily="monospace">
              VER (DRIVER)
            </text>
          </g>
        </svg>

        {/* Hover / Selected Tooltip Overlay */}
        {(hoveredCorner || selectedCorner) && (
          <div className="absolute bottom-2 left-4 right-4 bg-[#121216]/95 border border-red-500/40 rounded-lg p-3 backdrop-blur-md shadow-xl flex items-center justify-between z-20">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  (hoveredCorner || mistakes[0])?.severity === 'red'
                    ? 'bg-red-950/80 border border-red-500/50 text-red-400'
                    : 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-400'
                }`}
              >
                {(hoveredCorner || mistakes[0])?.severity === 'red' ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="text-xs font-mono font-bold text-white flex items-center gap-2">
                  <span>{(hoveredCorner || mistakes[0])?.corner_name}</span>
                  <span className="text-gray-400">
                    (Turn {(hoveredCorner || mistakes[0])?.turn_number})
                  </span>
                </div>
                <p className="text-xs text-gray-300 font-mono mt-0.5">
                  {(hoveredCorner || mistakes[0])?.description}
                </p>
              </div>
            </div>
            <div className="text-right font-mono">
              <div className="text-xs text-gray-400">GHOST DELTA</div>
              <div className="text-sm font-bold text-red-500">
                +{(hoveredCorner || mistakes[0])?.time_lost.toFixed(2)}s
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
