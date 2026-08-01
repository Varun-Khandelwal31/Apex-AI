'use client';

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export interface TelemetryPoint {
  distance: number;       // meters along lap
  driverSpeed: number;    // km/h
  aiOptimalSpeed: number; // km/h
  gear?: number;
  throttle?: number;
  brake?: number;
}

interface SpeedChartProps {
  data: TelemetryPoint[];
}

export default function SpeedChart({ data }: SpeedChartProps) {
  return (
    <div className="w-full h-full p-4 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h4 className="text-xs font-mono font-bold text-gray-200 uppercase tracking-wider">
            LAP SPEED PROFILE VS AI OPTIMAL (KM/H)
          </h4>
          <p className="text-[11px] text-gray-400 font-mono">Telemetry Distance Delta (0m - 3337m)</p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-red-500 rounded"></span>
            <span className="text-gray-300">Driver Speed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-cyan-400 rounded"></span>
            <span className="text-cyan-400">AI Target</span>
          </div>
        </div>
      </div>

      <div className="w-full h-48 md:h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="driverSpeedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#E10600" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#E10600" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="aiSpeedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00F0FF" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#00F0FF" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2029" vertical={false} />
            <XAxis
              dataKey="distance"
              stroke="#666666"
              fontSize={10}
              tickFormatter={(v) => `${v}m`}
            />
            <YAxis
              stroke="#666666"
              fontSize={10}
              domain={[60, 310]}
              tickFormatter={(v) => `${v}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#121216',
                borderColor: '#1F2029',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '12px',
                fontFamily: 'monospace',
              }}
              formatter={(value: any, name: any) => [
                `${value} km/h`,
                name === 'driverSpeed' ? 'Driver Speed' : 'AI Optimal',
              ]}
              labelFormatter={(label) => `Distance: ${label}m`}
            />
            <Area
              type="monotone"
              dataKey="aiOptimalSpeed"
              stroke="#00F0FF"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#aiSpeedGrad)"
            />
            <Area
              type="monotone"
              dataKey="driverSpeed"
              stroke="#E10600"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#driverSpeedGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
