'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Gauge,
  Sparkles,
  ChevronDown,
  RefreshCw,
  Zap,
} from 'lucide-react';
import TrackMapSVG, { CornerMistake } from '@/components/dashboard/TrackMapSVG';
import TelemetryGauges from '@/components/dashboard/TelemetryGauges';
import SpeedChart, { TelemetryPoint } from '@/components/dashboard/SpeedChart';
import AgentTerminal from '@/components/dashboard/AgentTerminal';
import PaytmModal from '@/components/dashboard/PaytmModal';

export default function DashboardPage() {
  const [selectedTrack, setSelectedTrack] = useState('Monaco GP');
  const [selectedDriver, setSelectedDriver] = useState('Verstappen');
  const [proUnlocked, setProUnlocked] = useState(false);
  const [isPaytmOpen, setIsPaytmOpen] = useState(false);

  const [telemetryData, setTelemetryData] = useState<TelemetryPoint[]>([]);
  const [mistakes, setMistakes] = useState<CornerMistake[]>([]);
  const [currentPointIndex, setCurrentPointIndex] = useState(0);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    fetchTelemetry(selectedDriver, 'fastest');
  }, [selectedDriver, selectedTrack]);

  useEffect(() => {
    if (telemetryData.length === 0) return;
    const interval = setInterval(() => {
      setCurrentPointIndex((prev) => (prev + 1) % telemetryData.length);
    }, 400);
    return () => clearInterval(interval);
  }, [telemetryData]);

  const fetchTelemetry = async (driver: string, lap: string) => {
    setIsLoadingData(true);
    try {
      const res = await fetch(`http://localhost:8000/api/telemetry/${driver.toLowerCase()}/${lap}`);
      if (res.ok) {
        const json = await res.json();
        setTelemetryData(json.telemetry || []);
        setMistakes(json.mistakes || []);
      } else {
        useFallbackData();
      }
    } catch {
      useFallbackData();
    } finally {
      setIsLoadingData(false);
    }
  };

  const useFallbackData = () => {
    const points: TelemetryPoint[] = [];
    const cornerMistakesList: CornerMistake[] = [
      {
        id: 'c1',
        corner_name: 'Sainte Devote',
        turn_number: 1,
        severity: 'red',
        description: 'Braked 14m early vs Ghost Car. Applied throttle late.',
        time_lost: 0.34,
        cx: 435,
        cy: 270,
      },
      {
        id: 'c2',
        corner_name: 'Massenet & Casino',
        turn_number: 3,
        severity: 'red',
        description: 'Excessive steering scrub angle causing front tire wear.',
        time_lost: 0.42,
        cx: 350,
        cy: 70,
      },
      {
        id: 'c3',
        corner_name: 'Fairmont Hairpin',
        turn_number: 6,
        severity: 'green',
        description: 'Optimal apex trajectory matching Ghost Car baseline.',
        time_lost: 0.0,
        cx: 125,
        cy: 140,
      },
      {
        id: 'c4',
        corner_name: 'Nouvelle Chicane',
        turn_number: 10,
        severity: 'red',
        description: 'Aggressive kerb strike causing rear traction slip.',
        time_lost: 0.28,
        cx: 110,
        cy: 260,
      },
    ];

    for (let i = 0; i <= 3330; i += 50) {
      const isCorner1 = i >= 300 && i <= 600;
      const isCorner3 = i >= 1100 && i <= 1400;
      let speed = 280 - Math.sin(i / 150) * 80;
      if (isCorner1) speed = 105 + Math.sin(i / 20) * 15;
      if (isCorner3) speed = 125 + Math.sin(i / 20) * 10;
      const aiOptimal = speed + (isCorner1 ? 18 : isCorner3 ? 14 : 4);

      points.push({
        distance: i,
        driverSpeed: Math.round(speed),
        aiOptimalSpeed: Math.round(aiOptimal),
        throttle: Math.min(100, Math.max(10, Math.round((speed / 300) * 100))),
        brake: speed < 140 ? Math.round(80 - (speed / 140) * 50) : 0,
        gear: speed > 260 ? 8 : speed > 220 ? 7 : speed > 180 ? 6 : 4,
      });
    }

    setTelemetryData(points);
    setMistakes(cornerMistakesList);
  };

  const currentPoint = telemetryData[currentPointIndex] || {
    throttle: 85,
    brake: 0,
    gear: 7,
    driverSpeed: 240,
    aiOptimalSpeed: 254,
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#0A0A0A] flex flex-col">
      {/* Paytm Glassmorphism Modal */}
      <PaytmModal
        isOpen={isPaytmOpen}
        onClose={() => setIsPaytmOpen(false)}
        onPaymentSuccess={() => {
          setProUnlocked(true);
        }}
      />

      {/* Cockpit Navigation Bar */}
      <header className="h-16 border-b border-[#1F2029] bg-[#121216]/80 backdrop-blur-md px-6 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-red-600/20 border border-red-500/50 flex items-center justify-center glow-red">
              <Gauge className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <span className="text-base font-black tracking-wider text-white font-mono uppercase">APEX <span className="text-red-500">AI</span></span>
              <span className="text-[10px] text-gray-400 font-mono block">GHOST RACE & AGENT TERMINAL</span>
            </div>
          </Link>

          {/* Track Selection */}
          <div className="relative flex items-center gap-2 bg-[#0A0A0A] border border-[#1F2029] px-3 py-1.5 rounded-lg text-xs font-mono text-gray-200">
            <span className="text-gray-500">TRACK:</span>
            <select
              value={selectedTrack}
              onChange={(e) => setSelectedTrack(e.target.value)}
              className="bg-transparent text-white font-bold outline-none cursor-pointer"
            >
              <option value="Monaco GP" className="bg-[#121216]">Monaco GP (Monte Carlo)</option>
              <option value="Silverstone" className="bg-[#121216]">Silverstone (UK)</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </div>

          {/* Driver Selection */}
          <div className="relative flex items-center gap-2 bg-[#0A0A0A] border border-[#1F2029] px-3 py-1.5 rounded-lg text-xs font-mono text-gray-200">
            <span className="text-gray-500">DRIVER:</span>
            <select
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value)}
              className="bg-transparent text-red-400 font-bold outline-none cursor-pointer"
            >
              <option value="Verstappen" className="bg-[#121216]">Max Verstappen (1)</option>
              <option value="Hamilton" className="bg-[#121216]">Lewis Hamilton (44)</option>
              <option value="Leclerc" className="bg-[#121216]">Charles Leclerc (16)</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </div>
        </div>

        {/* Right Nav Action */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => fetchTelemetry(selectedDriver, 'fastest')}
            className="p-2 rounded-lg bg-[#0A0A0A] border border-[#1F2029] text-gray-400 hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingData ? 'animate-spin text-red-500' : ''}`} />
          </button>

          {proUnlocked ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/40 text-amber-400 font-mono text-xs font-bold glow-yellow">
              <Sparkles className="w-4 h-4" /> PRO AI ACTIVE
            </div>
          ) : (
            <button
              onClick={() => setIsPaytmOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-mono text-xs font-bold uppercase tracking-wider glow-red shadow-lg"
            >
              <Sparkles className="w-4 h-4" /> Unlock Pro AI (Paytm ₹49)
            </button>
          )}
        </div>
      </header>

      {/* Main Cockpit Split-Screen */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Panel (60% - Dynamic Ghost Race Telemetry) */}
        <div className="w-full md:w-[60%] border-r border-[#1F2029] flex flex-col p-4 space-y-4 overflow-y-auto">
          {/* Top Row: Dynamic SVG Ghost Race Track Map & Gauges */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-7 bg-[#121216]/60 border border-[#1F2029] rounded-xl p-2 flex flex-col justify-between">
              <TrackMapSVG mistakes={mistakes} />
            </div>

            <div className="lg:col-span-5 flex flex-col space-y-3">
              <TelemetryGauges
                throttle={currentPoint.throttle || 85}
                brake={currentPoint.brake || 0}
                gear={currentPoint.gear || 7}
                drs={currentPoint.driverSpeed > 250}
              />

              <div className="bg-[#121216]/60 border border-[#1F2029] rounded-xl p-4 flex flex-col justify-between flex-1 font-mono">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-cyan-400" /> GHOST LAP TIME DELTA
                  </span>
                  <span className="text-xs text-red-500 font-bold">+1.04s vs Perfect Lap</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 bg-[#0A0A0A] rounded border border-gray-800">
                    <span className="text-[10px] text-gray-500 block">S1 DELTA</span>
                    <span className="text-red-400 font-bold">+0.52s</span>
                  </div>
                  <div className="p-2 bg-[#0A0A0A] rounded border border-gray-800">
                    <span className="text-[10px] text-gray-500 block">S2 DELTA</span>
                    <span className="text-yellow-400 font-bold">+0.18s</span>
                  </div>
                  <div className="p-2 bg-[#0A0A0A] rounded border border-gray-800">
                    <span className="text-[10px] text-gray-500 block">S3 DELTA</span>
                    <span className="text-red-400 font-bold">+0.34s</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#121216]/60 border border-[#1F2029] rounded-xl flex-1 min-h-[260px]">
            <SpeedChart data={telemetryData} />
          </div>
        </div>

        {/* Right Panel (40% - Sleek Agent Terminal Console) */}
        <div className="w-full md:w-[40%] flex flex-col overflow-hidden">
          <AgentTerminal
            driver={selectedDriver}
            proUnlocked={proUnlocked}
            onUnlockPro={() => setIsPaytmOpen(true)}
          />
        </div>
      </div>
    </div>
  );
}
