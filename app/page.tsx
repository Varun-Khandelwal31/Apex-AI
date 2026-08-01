'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { Gauge, Cpu, Zap, ChevronRight } from 'lucide-react';

const TrackScene = dynamic(() => import('@/components/3d/TrackScene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full absolute inset-0 bg-[#0A0A0A] flex items-center justify-center">
      <div className="text-red-500 font-mono text-sm animate-pulse flex items-center gap-2">
        <Zap className="w-4 h-4" /> INITIALIZING TELEMETRY ENGINE...
      </div>
    </div>
  ),
});

export default function LandingPage() {
  const router = Router();
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleEnterCockpit = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      router.push('/dashboard');
    }, 900);
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#0A0A0A]">
      {/* 3D R3F Background */}
      <TrackScene />

      {/* Screen Transition Overlay */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            className="fixed inset-0 bg-black z-50 flex items-center justify-center"
          >
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4 glow-red"></div>
              <p className="text-red-500 font-mono tracking-widest text-sm uppercase">
                CALIBRATING TELEMETRY SENSORS...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* UI Overlay */}
      <div className="relative z-10 w-full h-full flex flex-col justify-between p-8 md:p-16 pointer-events-none">
        {/* Header Branding */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-600/20 border border-red-500/50 flex items-center justify-center glow-red">
              <Gauge className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h2 className="text-xs font-mono tracking-widest text-red-500 uppercase">F1 TELEMETRY AI</h2>
              <p className="text-xs text-gray-400 font-mono">SEASON 2024 / MONACO GP</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4 text-xs font-mono text-gray-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> FASTF1 LIVE
            </span>
            <span className="text-gray-600">|</span>
            <span className="flex items-center gap-1 text-cyan-400">
              <Cpu className="w-3.5 h-3.5" /> XGBoost Model v2.4
            </span>
          </div>
        </motion.div>

        {/* Hero Section */}
        <div className="my-auto max-w-2xl pointer-events-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/60 border border-red-500/30 text-red-400 text-xs font-mono mb-6 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              NEXT-GEN MOTORSPORTS INTELLIGENCE
            </div>

            <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white uppercase leading-none mb-4">
              APEX <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-500 to-amber-500 text-glow-red">AI</span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 font-light mb-8 max-w-xl">
              The Autonomous Race Engineer
            </p>

            <p className="text-sm text-gray-400 font-mono mb-10 leading-relaxed max-w-lg border-l-2 border-red-600/50 pl-4">
              Real-time telemetry mistake detection, XGBoost lap time loss prediction, and LangChain ReAct pit strategy engineering.
            </p>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleEnterCockpit}
              className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-lg tracking-wide uppercase transition-all duration-300 glow-red shadow-lg shadow-red-900/40"
            >
              Enter Cockpit
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </motion.div>
        </div>

        {/* Footer Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-gray-800/80 pt-6 pointer-events-auto"
        >
          <div>
            <div className="text-xs font-mono text-gray-500 uppercase">TRACK RESOLUTION</div>
            <div className="text-lg font-bold font-mono text-gray-200">100 Hz Telemetry</div>
          </div>
          <div>
            <div className="text-xs font-mono text-gray-500 uppercase">CORNER DETECTION</div>
            <div className="text-lg font-bold font-mono text-cyan-400">XGBoost ML</div>
          </div>
          <div>
            <div className="text-xs font-mono text-gray-500 uppercase">RACE STRATEGY</div>
            <div className="text-lg font-bold font-mono text-emerald-400">LangChain ReAct</div>
          </div>
          <div>
            <div className="text-xs font-mono text-gray-500 uppercase">PRO UPGRADE</div>
            <div className="text-lg font-bold font-mono text-amber-400">Paytm Instant</div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

function Router() {
  return useRouter();
}
