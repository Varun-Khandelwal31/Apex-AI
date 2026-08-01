'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Terminal as TerminalIcon,
  Play,
  Radio,
  Lock,
  Sparkles,
  RotateCcw,
  Zap,
  CheckCircle2,
  Cpu,
  Wrench,
} from 'lucide-react';

interface TerminalLine {
  id: string;
  type: 'system' | 'agent' | 'user' | 'success' | 'error';
  agentName?: string;
  text: string;
  timestamp: string;
}

interface AgentTerminalProps {
  driver: string;
  proUnlocked: boolean;
  onUnlockPro: () => void;
}

export default function AgentTerminal({ driver, proUnlocked, onUnlockPro }: AgentTerminalProps) {
  const [lines, setLines] = useState<TerminalLine[]>([
    {
      id: '1',
      type: 'system',
      text: 'APEX WAR ROOM TERMINAL v2.4.0 ONLINE // SYSTEM READY',
      timestamp: '00:00:01',
    },
    {
      id: '2',
      type: 'system',
      text: 'ENDPOINT ACTIVE: /api/run-agents // WEBSOCKET STREAM: /ws/agents',
      timestamp: '00:00:02',
    },
    {
      id: '3',
      type: 'agent',
      agentName: 'System',
      text: 'Click [Execute AI Simulation] to run Telemetry Analyst → Vehicle Dynamics → Race Strategist multi-agent flow.',
      timestamp: '00:00:03',
    },
  ]);

  const [inputCmd, setInputCmd] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentThought, setCurrentThought] = useState<string | null>(null);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [driver, proUnlocked]);

  const connectWebSocket = () => {
    try {
      const ws = new WebSocket('ws://localhost:8000/ws/agents');
      ws.onopen = () => {
        addTerminalLine('system', 'Connected to Multi-Agent War Room (/ws/agents)');
      };
      ws.onmessage = (event) => {
        try {
          const frame = JSON.parse(event.data);

          if (frame.thought) {
            setCurrentThought(frame.thought);
            addTerminalLine('agent', frame.thought, frame.agent);
          }

          if (frame.status === 'done' && frame.final_response) {
            addTerminalLine('success', frame.final_response, 'War Room Summary');
            setIsExecuting(false);
            setCurrentThought(null);
          }
        } catch {
          addTerminalLine('agent', event.data, 'Multi-Agent Stream');
        }
      };
      ws.onerror = () => {
        addTerminalLine('error', 'WebSocket notice (HTTP fallback active)');
      };
      wsRef.current = ws;
    } catch {
      console.warn('WS error');
    }
  };

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines, currentThought]);

  const addTerminalLine = (
    type: 'system' | 'agent' | 'user' | 'success' | 'error',
    text: string,
    agentName?: string
  ) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLines((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        type,
        text,
        agentName,
        timestamp: time,
      },
    ]);
  };

  const executeSimulation = async (cmdPrompt?: string) => {
    const promptText = cmdPrompt || inputCmd || 'Execute AI Simulation';

    addTerminalLine('user', `$ apex-agent run "${promptText}" --driver=${driver}`);
    setIsExecuting(true);
    setInputCmd('');

    // Send via WebSocket or fallback HTTP /api/run-agents
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          prompt: promptText,
          driver: driver,
          pro_unlocked: proUnlocked,
        })
      );
    } else {
      try {
        addTerminalLine('agent', '[Telemetry Analyst]: Analyzing Turn 3 understeer against Ghost Lap...', 'Telemetry Analyst');
        await new Promise((r) => setTimeout(r, 600));

        addTerminalLine('agent', '[Vehicle Dynamics Engineer]: To fix this understeer, I recommend a custom setup. Click below to generate.', 'Vehicle Dynamics Engineer');
        await new Promise((r) => setTimeout(r, 600));

        const res = await fetch('http://localhost:8000/api/run-agents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: promptText,
            driver: driver,
            pro_unlocked: proUnlocked,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          addTerminalLine('success', data.response, 'War Room Summary');
        }
      } catch (err) {
        addTerminalLine('error', `Execution error: ${err}`);
      } finally {
        setIsExecuting(false);
      }
    }
  };

  return (
    <div className="w-full h-full bg-[#050509] border-l border-[#1F2029] flex flex-col justify-between overflow-hidden font-mono">
      {/* Terminal Header */}
      <div className="p-3 bg-[#0A0A0E] border-b border-[#1F2029] flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
          <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
          <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
          <span className="text-xs font-bold text-gray-300 ml-2 flex items-center gap-1.5">
            <TerminalIcon className="w-4 h-4 text-cyan-400" /> APEX AGENT TERMINAL
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1 text-emerald-400 font-bold">
            <Radio className="w-3 h-3 animate-pulse" /> /api/run-agents
          </span>
          <button
            onClick={() => setLines([])}
            className="text-gray-500 hover:text-white transition-colors"
            title="Clear Console"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Primary Action Hero Banner */}
      <div className="p-3 bg-[#0D0D14] border-b border-[#1F2029] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-red-500" />
          <span className="text-xs text-gray-300">Driver: <strong className="text-red-400">{driver}</strong></span>
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          disabled={isExecuting}
          onClick={() => executeSimulation('Execute AI Simulation')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-bold text-xs uppercase tracking-wider glow-red shadow-lg transition-all disabled:opacity-50"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          {isExecuting ? 'SIMULATING AGENTS...' : 'EXECUTE AI SIMULATION'}
        </motion.button>
      </div>

      {/* Terminal Output Log Feed */}
      <div className="flex-1 p-4 overflow-y-auto space-y-2.5 text-xs text-gray-300">
        {lines.map((line) => {
          const isAgent = line.type === 'agent';
          const isSuccess = line.type === 'success';
          const isUser = line.type === 'user';
          const isErr = line.type === 'error';

          return (
            <div key={line.id} className="leading-relaxed">
              {isUser && (
                <div className="text-cyan-400 font-bold flex items-center gap-2">
                  <span className="text-gray-600">[{line.timestamp}]</span> {line.text}
                </div>
              )}

              {isAgent && (
                <div className="text-emerald-400 flex items-start gap-2 border-l-2 border-emerald-500/50 pl-2 py-0.5">
                  <span className="text-gray-600 shrink-0">[{line.timestamp}]</span>
                  <div>
                    {line.agentName && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 font-bold mr-2 text-[10px]">
                        [{line.agentName}]
                      </span>
                    )}
                    <span className="text-gray-200">{line.text}</span>
                  </div>
                </div>
              )}

              {isSuccess && (
                <div className="bg-[#12121A] border border-cyan-500/30 rounded-lg p-3 text-gray-100 shadow-md">
                  <div className="text-cyan-400 font-bold text-[11px] mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> MULTI-AGENT WAR ROOM SYNTHESIS
                    </span>
                    {proUnlocked && (
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[9px] font-bold glow-yellow">
                        <Sparkles className="w-3 h-3 inline mr-1" /> PAYTM UNLOCKED
                      </span>
                    )}
                  </div>

                  {(() => {
                    const text = line.text;
                    const setupHeaderIndex = text.indexOf('🔧 **[Vehicle Dynamics Engineer]');

                    if (setupHeaderIndex === -1) {
                      return <div className="whitespace-pre-wrap text-xs text-gray-300 leading-relaxed">{text}</div>;
                    }

                    const topPart = text.substring(0, setupHeaderIndex);
                    const restPart = text.substring(setupHeaderIndex);
                    const strategyHeaderIndex = restPart.indexOf('🏎️ **[Race Strategist]');

                    const setupBlock = strategyHeaderIndex !== -1 ? restPart.substring(0, strategyHeaderIndex) : restPart;
                    const strategyBlock = strategyHeaderIndex !== -1 ? restPart.substring(strategyHeaderIndex) : '';

                    return (
                      <div className="space-y-3">
                        <div className="whitespace-pre-wrap text-xs text-gray-300">{topPart}</div>

                        {/* 🔧 VEHICLE DYNAMICS SETUP RECOMMENDATIONS */}
                        <div className="relative border border-amber-500/30 rounded-lg p-3 bg-amber-950/20">
                          {!proUnlocked ? (
                            /* BLURRED STATE UNTIL PAYTM POLL SUCCESS */
                            <div className="relative">
                              <div className="filter blur-sm select-none opacity-30 whitespace-pre-wrap text-xs text-amber-200">
                                🔧 **[Vehicle Dynamics Engineer] Setup Recommendations**:
                                • Aero / Front Wing: Increase front wing angle by +1.0° (Front Wing +1 click)
                                • Suspension / Anti-Roll Bar: Stiffen front anti-roll bar by 2 clicks (Anti-Roll Bar softened)
                                • Drivetrain / Differential: Decrease power-on diff lock by 5%
                              </div>
                              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 backdrop-blur-sm rounded-lg p-3 text-center">
                                <p className="text-xs text-amber-300 font-mono font-bold mb-1">
                                  "To fix this understeer in Turn 3, I recommend a custom setup."
                                </p>
                                <p className="text-[11px] text-gray-400 font-mono mb-3">
                                  Click below to generate & un-blur full setup details via Paytm.
                                </p>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={onUnlockPro}
                                  className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-white font-bold text-xs uppercase tracking-wider glow-yellow shadow-lg flex items-center gap-1.5"
                                >
                                  <Sparkles className="w-4 h-4" /> UNLOCK AI SETUP (₹49)
                                </motion.button>
                              </div>
                            </div>
                          ) : (
                            /* UN-BLURRED REVEALED STATE UPON SUCCESSFUL POLL */
                            <motion.div
                              initial={{ opacity: 0, filter: 'blur(10px)' }}
                              animate={{ opacity: 1, filter: 'blur(0px)' }}
                              transition={{ duration: 0.8 }}
                            >
                              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 mb-1">
                                <Wrench className="w-3.5 h-3.5 text-amber-400" /> VEHICLE DYNAMICS SETUP RECOMMENDATIONS (UNLOCKED)
                              </div>
                              <div className="whitespace-pre-wrap text-xs text-gray-100 leading-relaxed font-mono font-bold bg-black/40 p-2.5 rounded border border-amber-500/40">
                                • Front Wing: +1.0° (+1 click for turn-in response){'\n'}
                                • Anti-Roll Bar: Softened front ARB by 2 clicks to eliminate Turn 3 understeer{'\n'}
                                • Differential: Power-on lock reduced by 5% for traction on exit
                              </div>
                            </motion.div>
                          )}
                        </div>

                        {strategyBlock && (
                          <div className="whitespace-pre-wrap text-xs text-gray-300 border-t border-gray-800 pt-2">
                            {strategyBlock}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {line.type === 'system' && (
                <div className="text-gray-500 text-[11px]">
                  [{line.timestamp}] # {line.text}
                </div>
              )}

              {isErr && (
                <div className="text-red-400 text-[11px] font-bold">
                  [{line.timestamp}] ! {line.text}
                </div>
              )}
            </div>
          );
        })}

        {isExecuting && (
          <div className="flex items-center gap-2 text-cyan-400 text-xs animate-pulse">
            <Zap className="w-3.5 h-3.5 animate-spin" />
            <span>Streaming thought process over /ws/agents...</span>
          </div>
        )}

        <div ref={terminalEndRef} />
      </div>

      {/* Input Section */}
      <div className="p-3 bg-[#0A0A0E] border-t border-[#1F2029] shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            executeSimulation();
          }}
          className="flex items-center gap-2 bg-[#050508] border border-[#1F2029] rounded-lg px-3 py-2"
        >
          <span className="text-cyan-500 font-bold text-xs">$</span>
          <input
            type="text"
            value={inputCmd}
            onChange={(e) => setInputCmd(e.target.value)}
            placeholder="Type terminal command..."
            className="flex-1 bg-transparent text-xs text-gray-100 placeholder-gray-600 outline-none"
          />
          <button
            type="submit"
            disabled={isExecuting || !inputCmd.trim()}
            className="text-xs text-red-500 hover:text-red-400 font-bold disabled:opacity-40"
          >
            ENTER
          </button>
        </form>
      </div>
    </div>
  );
}
