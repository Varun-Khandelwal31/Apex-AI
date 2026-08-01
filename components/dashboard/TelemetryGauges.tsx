'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface TelemetryGaugesProps {
  throttle: number; // 0 - 100 %
  brake: number;    // 0 - 100 %
  gear: number;     // 1 - 8
  rpm?: number;     // 0 - 15000
  drs?: boolean;
}

export default function TelemetryGauges({ throttle, brake, gear, drs = false }: TelemetryGaugesProps) {
  const getCircleStroke = (value: number) => {
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (value / 100) * circumference;
    return { circumference, strokeDashoffset };
  };

  const throttleCircle = getCircleStroke(throttle);
  const brakeCircle = getCircleStroke(brake);

  return (
    <div className="grid grid-cols-3 gap-3 p-4 bg-[#121216]/60 border border-[#1F2029] rounded-xl backdrop-blur-sm">
      {/* Throttle Gauge */}
      <div className="flex flex-col items-center justify-center text-center">
        <div className="relative w-20 h-20 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 90 90">
            {/* Track Circle */}
            <circle
              cx="45"
              cy="45"
              r="36"
              stroke="#1F2029"
              strokeWidth="6"
              fill="transparent"
            />
            {/* Animated Throttle Value */}
            <motion.circle
              cx="45"
              cy="45"
              r="36"
              stroke="#39FF14"
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={throttleCircle.circumference}
              animate={{ strokeDashoffset: throttleCircle.strokeDashoffset }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-base font-bold font-mono text-emerald-400">{Math.round(throttle)}%</span>
          </div>
        </div>
        <span className="text-[11px] font-mono text-gray-400 mt-1 uppercase tracking-wider">THROTTLE</span>
      </div>

      {/* Gear Indicator */}
      <div className="flex flex-col items-center justify-center text-center border-x border-[#1F2029] px-2">
        <div className="relative w-20 h-20 rounded-full border-2 border-red-600/40 bg-red-950/20 flex flex-col items-center justify-center glow-red">
          <span className="text-3xl font-black font-mono text-white text-glow-red">{gear}</span>
          <span className="text-[9px] font-mono text-red-400 tracking-widest uppercase">GEAR</span>
        </div>
        <div className="mt-1 flex items-center gap-1">
          <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${drs ? 'bg-cyan-500 text-black glow-cyan' : 'bg-gray-800 text-gray-500'}`}>
            DRS {drs ? 'ACTIVE' : 'OFF'}
          </span>
        </div>
      </div>

      {/* Brake Pressure Gauge */}
      <div className="flex flex-col items-center justify-center text-center">
        <div className="relative w-20 h-20 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 90 90">
            <circle
              cx="45"
              cy="45"
              r="36"
              stroke="#1F2029"
              strokeWidth="6"
              fill="transparent"
            />
            <motion.circle
              cx="45"
              cy="45"
              r="36"
              stroke="#E10600"
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={brakeCircle.circumference}
              animate={{ strokeDashoffset: brakeCircle.strokeDashoffset }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-base font-bold font-mono text-red-500">{Math.round(brake)}%</span>
          </div>
        </div>
        <span className="text-[11px] font-mono text-gray-400 mt-1 uppercase tracking-wider">BRAKE</span>
      </div>
    </div>
  );
}
